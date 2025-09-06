<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getService } from '$lib/services/ServiceContainer.js';
  import ProfileAvatar from '$lib/components/ui/ProfileAvatar.svelte';

  let nostr: any = null;
  let mePk: string | null = null;

  // Channels state
  let channelsStore: any = null;
  let channels: any[] = $state([]);
  let selectedId: string | null = $state(null);
  let selectedMeta: any = $state(null);

  // Messages state
  let messagesStore: any = null;
  let messages: any[] = $state([]);
  let newMessage = $state('');
  let composing = $state(false);
  function handleComposerKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  let participants: string[] = $state([]);

  // Create channel form
  let showCreate = $state(false);
  let chName = $state('');
  let chAbout = $state('');
  let chTag = $state('');

  async function ensureNostr() {
    if (nostr) return nostr;
    const svc: any = await getService('nostr');
    nostr = await (svc.getReadyInstance ? svc.getReadyInstance() : svc.getInstance());
    try { await nostr.connect?.(); } catch {}
    try { mePk = await nostr.getPublicKey?.(); } catch { mePk = null; }
    return nostr;
  }

  function pickChannel(id: string) {
    selectedId = id;
    subscribeMessages(id);
    loadMetadata(id);
    // Update URL (deep-link)
    try { const u = new URL(location.href); u.searchParams.set('c', id); history.replaceState(null, '', u.toString()); } catch {}
  }

  let channelsUnsub: (()=>void) | null = null;
  function subscribeChannels() {
    if (!nostr) return;
    try { channelsUnsub && channelsUnsub(); channelsUnsub = null; } catch {}
    // Prime cache fast with one-shot to avoid blank first render
    try { nostr.sub().kinds([40]).executeOnce({ closeOn: 'eose' }); } catch {}
    channelsStore = nostr.channels.list();
    channelsUnsub = channelsStore.subscribe((evs: any[]) => {
      try {
        const latest = (evs || []).slice().sort((a,b)=>b.created_at-a.created_at);
        channels = latest;
        if (!selectedId && channels.length) {
          selectedId = channels[0].id;
          subscribeMessages(selectedId);
        }
      } catch {}
    });
  }

  let messagesUnsub: (()=>void) | null = null;
  function subscribeMessages(id: string) {
    if (!nostr || !id) return;
    try { messagesUnsub && messagesUnsub(); messagesUnsub = null; } catch {}
    // Viewer filtered messages if pubkey vorhanden
    const base = mePk ? nostr.channels.visibleMessages(id, mePk) : nostr.channels.messagesFor(id);
    messagesStore = base;
    messagesUnsub = messagesStore.subscribe((evs: any[]) => {
      try {
        const list = (evs || []).slice().sort((a,b)=>a.created_at-b.created_at);
        messages = list;
        // Build participants by recency
        const lastByPk = new Map<string, number>();
        for (const m of list) lastByPk.set(m.pubkey, m.created_at);
        participants = Array.from(lastByPk.entries())
          .sort((a,b)=>b[1]-a[1])
          .map(([pk])=>pk)
          .slice(0, 16);
        maybeScrollToLatest();
      } catch {}
    });
  }

  function loadMetadata(id: string) {
    try {
      const store = nostr.channels.metadataFor(id);
      store.subscribe((evs: any[]) => {
        try {
          const latest = (evs||[])[0];
          selectedMeta = latest ? JSON.parse(latest.content||'{}') : null;
        } catch { selectedMeta = null; }
      });
    } catch { selectedMeta = null; }
  }

  // Auto-scroll UX
  let scrollEl: HTMLDivElement | null = null;
  let userPinnedTop = false;
  function onScroll(e: Event) {
    const el = e.currentTarget as HTMLDivElement;
    // If user scrolls far from bottom, disable auto-scroll
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    userPinnedTop = !atBottom;
  }
  function maybeScrollToLatest() {
    if (!scrollEl || userPinnedTop) return;
    try { scrollEl.scrollTop = scrollEl.scrollHeight; } catch {}
  }

  async function sendMessage() {
    try {
      if (!nostr || !selectedId) return;
      const text = (newMessage || '').trim();
      if (!text) return;
      await nostr.channels.message(selectedId).content(text).publish();
      newMessage = '';
    } catch {}
  }

  async function createChannel() {
    try {
      await ensureNostr();
      const builder = nostr.channels.create();
      if (chName) builder.name(chName);
      if (chAbout) builder.about(chAbout);
      if (chTag) builder.category(chTag);
      await builder.publish();
      showCreate = false; chName=''; chAbout=''; chTag='';
      // refresh picked list automatically via sub
    } catch {}
  }

  async function hideMessage(mid: string) {
    try { await ensureNostr(); await nostr.channels.hide(mid).publish(); } catch {}
  }

  async function muteUser(pk: string) {
    try { await ensureNostr(); await nostr.channels.mute(pk).publish(); } catch {}
  }

  onMount(async () => {
    await ensureNostr();
    subscribeChannels();
    // Deep-link select
    try {
      const c = new URL(location.href).searchParams.get('c');
      if (c) { selectedId = c; subscribeMessages(c); loadMetadata(c); }
    } catch {}
    return () => {
      try { channelsUnsub && channelsUnsub(); } catch {}
      try { messagesUnsub && messagesUnsub(); } catch {}
    };
  });
</script>

<div class="chat-layout">
  <aside class="channel-list">
    <div class="header">
      <h2>Public Chat</h2>
      <button class="btn" on:click={() => showCreate = !showCreate}>{showCreate ? 'Close' : 'New'}</button>
    </div>

    {#if showCreate}
      <div class="card create">
        <input class="input" placeholder="Name" bind:value={chName} />
        <input class="input" placeholder="About" bind:value={chAbout} />
        <input class="input" placeholder="#category (optional)" bind:value={chTag} />
        <button class="btn primary" on:click={createChannel}>Create</button>
      </div>
    {/if}

    <div class="list" role="list">
      {#each channels as ch}
        <button class="item" aria-current={selectedId===ch.id} on:click={() => pickChannel(ch.id)}>
          <div class="title">{(JSON.parse(ch.content||'{}')?.name) || 'Channel'}</div>
          <div class="meta">{new Date(ch.created_at*1000).toLocaleString()}</div>
        </button>
      {/each}
      {#if channels.length === 0}
        <div class="empty">No channels yet</div>
      {/if}
    </div>
  </aside>

  <section class="messages">
    {#if !selectedId}
      <div class="placeholder">Select a channel…</div>
    {:else}
      <div class="channel-header">
        <div class="head-title">
          <div class="name">{selectedMeta?.name || 'Channel'}</div>
          {#if selectedMeta?.about}<div class="about">{selectedMeta.about}</div>{/if}
        </div>
        <div class="head-actions">
          <button class="ghost" on:click={() => pickChannel(selectedId!)}>Refresh</button>
          <a class="ghost" href={`/threads/${selectedId}`}>Root</a>
        </div>
      </div>
      {#if participants.length > 0}
        <div class="participants" role="list">
          {#each participants as pk}
            <a class="pitem" href={`/profiles/${pk}`} title="Participant">
              <ProfileAvatar pubkey={pk} size="xs" navigateOnClick={false} />
            </a>
          {/each}
        </div>
      {/if}
      <div class="messages-scroll" bind:this={scrollEl} on:scroll={onScroll}>
        {#each messages as m (m.id)}
          <div class="msg">
            <a class="author" href={`/profiles/${m.pubkey}`} title="View profile">
              <ProfileAvatar pubkey={m.pubkey} size="xs" navigateOnClick={false} />
            </a>
            <div class="bubble">
              <div class="content">{m.content}</div>
              <div class="tools">
                <button class="ghost" title="Hide for me" on:click={() => hideMessage(m.id)}>Hide</button>
                <button class="ghost" title="Mute author" on:click={() => muteUser(m.pubkey)}>Mute</button>
                <a class="ghost" href={`/threads/${m.id}`}>Thread</a>
              </div>
            </div>
          </div>
        {/each}
      </div>
      {#if userPinnedTop}
        <button class="jump" on:click={() => { userPinnedTop=false; maybeScrollToLatest(); }} title="Jump to latest">↓ New</button>
      {/if}
      <div class="composer">
        <textarea class="textarea" rows="2" placeholder="Message… (Enter = Send, Shift+Enter = Zeile)" bind:value={newMessage} on:keydown={handleComposerKey} on:focus={() => composing=true} on:blur={() => composing=false} />
        <button class="btn primary" on:click={sendMessage}>Send</button>
      </div>
    {/if}
  </section>
</div>

<style>
  .chat-layout { display:grid; grid-template-columns: 320px 1fr; gap: 12px; padding: 12px; height: calc(100vh - 52px); }
  .channel-list { border-right: 1px solid var(--color-border); padding-right: 12px; display:flex; flex-direction:column; min-height:0; }
  .header { display:flex; align-items:center; justify-content: space-between; margin-bottom: 8px; }
  .card.create { display:flex; flex-direction:column; gap:6px; padding:8px; border:1px solid var(--color-border); border-radius:10px; background: rgba(255,255,255,0.04); margin-bottom:8px; }
  .list { flex:1; overflow:auto; display:flex; flex-direction:column; gap:4px; }
  .item { text-align:left; padding:8px; border:1px solid transparent; border-radius:10px; background: transparent; color: var(--color-text); cursor:pointer; }
  .item[aria-current="true"] { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.35); }
  .title { font-weight:600; }
  .meta { font-size:.8rem; color:#94a3b8; }
  .messages { display:flex; flex-direction:column; min-height:0; }
  .channel-header { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; padding:6px 4px; border-bottom:1px solid var(--color-border); }
  .head-title { display:flex; flex-direction:column; }
  .name { font-weight:700; }
  .about { color:#94a3b8; font-size:.9rem; }
  .participants { display:flex; gap:6px; padding:6px 4px; border-bottom:1px solid var(--color-border); overflow:auto; }
  .pitem { display:inline-flex; }
  .messages-scroll { flex:1; overflow:auto; display:flex; flex-direction:column; gap:8px; padding-right: 8px; }
  .msg { display:flex; gap:8px; align-items:flex-start; }
  .bubble { border:1px solid var(--color-border); border-radius:12px; padding:8px; background: rgba(255,255,255,0.04); width: 100%; }
  .content { white-space: pre-wrap; word-break: break-word; }
  .tools { display:flex; gap:6px; margin-top:4px; }
  .composer { display:flex; gap:8px; padding-top:8px; border-top:1px solid var(--color-border); }
  .textarea { flex:1; padding:.5rem .65rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); resize: vertical; min-height: 42px; }
  .textarea:focus { outline:none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
  .btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-text); border-color: var(--color-primary); }
  .ghost { padding:4px 8px; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background: transparent; color:#cbd5e1; cursor:pointer; font-size:.85rem; }
  .jump { position: sticky; bottom: 8px; margin-left: auto; align-self: flex-end; padding:6px 10px; border:1px solid rgba(99,102,241,0.35); border-radius:9999px; background: rgba(99,102,241,0.15); color:#e2e8f0; cursor:pointer; }

  @media (max-width: 960px) {
    .chat-layout { grid-template-columns: 1fr; }
    .channel-list { border-right:none; padding-right:0; }
  }
</style>


