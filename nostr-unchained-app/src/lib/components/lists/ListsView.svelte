<script lang="ts">
  import { onMount } from 'svelte';
  import EventCard from '../terminal/EventCard.svelte';
  import KeyDisplay from '../ui/KeyDisplay.svelte';
  let { nostr }: any = $props();
  let me: string | null = null;
  let lists: any[] = $state([]);
  let rawEvents: any[] = $state([]);
  let loading = $state(true);
  let active: any = $state(null);
  let activeItems: any[] = $state([]);
  let activeLoading = $state(false);
  let unsubItems: (()=>void) | null = null;
  let activePeople: string[] = $state([]);
  let activeAddresses: string[] = $state([]);
  let activeTopics: string[] = $state([]);
  let activeRelays: string[] = $state([]);

  function parseList(ev: any) {
    const getTag = (n: string) => (ev.tags || []).find((t: any) => t[0] === n)?.[1];
    const all = (n: string) => (ev.tags || []).filter((t: any) => t[0] === n);
    return {
      id: ev.id,
      kind: ev.kind,
      identifier: getTag('d') || null,
      title: getTag('title') || (ev.kind === 30003 && getTag('d') === 'bookmarks' ? 'Bookmarks' : null),
      description: getTag('description') || null,
      e: all('e').length,
      p: all('p').length,
      a: all('a').length,
      updated_at: ev.created_at
    };
  }

  async function load() {
    try { me = await nostr.getPublicKey(); } catch {}
    try {
      // subscription-first, then cache query
      await nostr.sub().kinds([30000,30001,30002,30003]).authors([me]).limit(50).execute();
    } catch {}
    try {
      const q = nostr.query().kinds([30000,30001,30002,30003]).authors([me]).limit(50).execute();
      const unsub = q.subscribe((evs: any[]) => {
        rawEvents = evs || [];
        lists = rawEvents.map(parseList).sort((a,b)=> (b.updated_at||0)-(a.updated_at||0));
      });
    } finally { loading = false; }
  }

  async function openList(idx: number) {
    try {
      const ev = rawEvents[idx];
      if (!ev) return;
      active = { parsed: lists[idx], ev };
      // Extract 'e' tags (event ids). For generic lists we start with e-entries only (low risk)
      const ids = Array.from(new Set((ev.tags || []).filter((t: any)=> Array.isArray(t) && t[0]==='e' && t[1]).map((t:any)=>String(t[1]))));
      activeItems = [];
      if (ids.length === 0) return;
      activeLoading = true;
      try { await nostr.sub().ids(ids).limit(ids.length).executeOnce({ closeOn: 'eose' }); } catch {}
      try { unsubItems && unsubItems(); } catch {}
      const q = nostr.query().ids(ids).limit(ids.length).execute();
      unsubItems = q.subscribe((evs: any[]) => { activeItems = evs || []; activeLoading = false; });

      // Extract p/a/t/relay for detail meta view
      const tags = ev.tags || [];
      activePeople = Array.from(new Set(tags.filter((t:any)=> Array.isArray(t) && t[0]==='p' && t[1]).map((t:any)=> String(t[1]))));
      activeAddresses = Array.from(new Set(tags.filter((t:any)=> Array.isArray(t) && t[0]==='a' && t[1]).map((t:any)=> String(t[1]))));
      activeTopics = Array.from(new Set(tags.filter((t:any)=> Array.isArray(t) && t[0]==='t' && t[1]).map((t:any)=> String(t[1]))));
      activeRelays = Array.from(new Set(tags.filter((t:any)=> Array.isArray(t) && t[0]==='relay' && t[1]).map((t:any)=> String(t[1]))));
    } catch {}
  }

  function closeList() { try { unsubItems && unsubItems(); } catch {}; unsubItems = null; active = null; activeItems = []; activeLoading = false; }

  onMount(load);
</script>

<div class="lists-view">
  <h2>🗂️ Lists</h2>
  {#if loading}
    <div class="loading">Lade Listen…</div>
  {:else if lists.length === 0}
    <div class="empty">Keine Listen gefunden</div>
  {:else}
    <div class="grid">
      {#each lists as l, i (l.id)}
        <div class="list-card" onclick={() => openList(i)} title="Open list">
          <div class="list-top">
            <div class="list-title">{l.title || `List ${l.kind}`}</div>
            {#if l.identifier}<div class="list-id">d={l.identifier}</div>{/if}
          </div>
          <div class="list-meta">e:{l.e} · p:{l.p} · a:{l.a}</div>
          {#if l.kind === 30003 && l.identifier === 'bookmarks'}
            <div class="list-tag">🔖 Bookmarks</div>
          {/if}
        </div>
      {/each}
    </div>
    {#if active}
      <div class="detail">
        <div class="detail-header">
          <div class="detail-title">{active.parsed.title || `List ${active.parsed.kind}`} {#if active.parsed.identifier}<span class="list-id">d={active.parsed.identifier}</span>{/if}</div>
          <button class="ghost" onclick={closeList}>Close</button>
        </div>
        {#if activeLoading}
          <div class="loading">Lade Einträge…</div>
        {:else if activeItems.length === 0}
          <div class="empty">Keine Einträge (e‑Tags) gefunden</div>
        {:else}
          <div class="items">
            {#each activeItems as ev (ev.id)}
              <EventCard event={ev} {nostr} />
            {/each}
          </div>
        {/if}

        <div class="meta">
          {#if activePeople.length > 0}
            <div class="meta-section">
              <div class="meta-title">People (p)</div>
              <div class="people">
                {#each activePeople as pk}
                  <KeyDisplay hexKey={pk} variant="compact" copyable={true} />
                {/each}
              </div>
            </div>
          {/if}
          {#if activeAddresses.length > 0}
            <div class="meta-section">
              <div class="meta-title">Addresses (a)</div>
              <ul class="addr-list">
                {#each activeAddresses as a}
                  <li><code>{a}</code></li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if activeTopics.length > 0}
            <div class="meta-section">
              <div class="meta-title">Topics (t)</div>
              <div class="topics">
                {#each activeTopics as t}
                  <span class="topic">#{t}</span>
                {/each}
              </div>
            </div>
          {/if}
          {#if activeRelays.length > 0}
            <div class="meta-section">
              <div class="meta-title">Relays</div>
              <ul class="relay-list">
                {#each activeRelays as r}
                  <li><code>{r}</code></li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .lists-view { display:flex; flex-direction: column; gap: .75rem; padding: 1rem; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap:.75rem; }
  .list-card { border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:.75rem; background: rgba(255,255,255,0.04); }
  .list-top { display:flex; justify-content: space-between; gap:.5rem; align-items:center; margin-bottom:.25rem; }
  .list-title { font-weight:600; color:#e2e8f0; }
  .list-id { font-family: var(--font-mono); color:#94a3b8; font-size:.8rem; }
  .list-meta { color:#a3b2c5; font-size:.85rem; }
  .list-tag { margin-top:.25rem; font-size:.85rem; color:#ddd6fe; }
  .loading,.empty { color:#94a3b8; font-style: italic; }
  .detail { margin-top: .75rem; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:.75rem; background: rgba(255,255,255,0.03); }
  .detail-header { display:flex; align-items:center; justify-content: space-between; margin-bottom:.5rem; }
  .detail-title { font-weight:600; color:#e2e8f0; }
  .items { display:flex; flex-direction: column; gap:.6rem; }
  .ghost { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .meta { margin-top:.75rem; display:flex; flex-direction: column; gap:.5rem; }
  .meta-section { border-top:1px solid rgba(255,255,255,0.06); padding-top:.5rem; }
  .meta-title { font-weight:600; color:#cbd5e1; margin-bottom:.25rem; }
  .people { display:flex; flex-wrap: wrap; gap:.35rem; }
  .addr-list, .relay-list { margin:0; padding-left: 1rem; color:#a3b2c5; }
  .topics { display:flex; flex-wrap: wrap; gap:.35rem; }
  .topic { font-size:.8rem; color:#06b6d4; background: rgba(6, 182, 212, 0.1); padding: 2px 6px; border-radius: 10px; border: 1px solid rgba(6,182,212,.2) }
</style>
