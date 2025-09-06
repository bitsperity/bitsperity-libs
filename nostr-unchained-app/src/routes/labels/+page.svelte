<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import BackHeader from '$lib/components/ui/BackHeader.svelte';
  import ProfileAvatar from '$lib/components/ui/ProfileAvatar.svelte';

  let ns = $state('');
  let type: 'event' | 'profile' | 'all' = $state('all');
  let q = $state('');
  let items: any[] = $state([]);
  let all: any[] = $state([]);
  let loading = $state(false);
  let unsubscribers: Array<() => void> = [];
  // URL-State bewusst nicht manipulieren – einfache Client-Filter
  
  function shorten(id: string, n = 8) {
    if (!id) return '';
    return id.slice(0, n) + '…';
  }
  function firstTagValue(ev: any, key: string): string | null {
    try { return (ev.tags || []).find((t: string[]) => t[0] === key)?.[1] || null; } catch { return null; }
  }
  function openProfile(pubkey: string) { if (pubkey) location.assign(`/profiles/${pubkey}`); }
  function openThread(eventId: string) { if (eventId) location.assign(`/threads/${eventId}`); }
  function handleBack() { try { if (history.length > 1) history.back(); else location.assign('/'); } catch { location.assign('/'); } }

  function applyFromUrl() {
    // optional: initiales Auslesen; ansonsten leer lassen
    try {
      const params = new URLSearchParams(window.location.search);
      ns = params.get('ns') || '';
      const t = params.get('type');
      type = (t === 'event' || t === 'profile' || t === 'all') ? t : 'all';
      q = params.get('q') || '';
    } catch {}
  }

  // debounce filter evaluation to avoid thrash when many updates arrive
  let filterRaf: number | null = null;
  function applyFilters(list: any[]) {
    if (filterRaf) { try { cancelAnimationFrame(filterRaf); } catch {} }
    filterRaf = requestAnimationFrame(() => {
      const arr = Array.isArray(list) ? list : [];
      let filtered = arr;
      if (ns) filtered = filtered.filter((e: any) => e.tags?.some((t: string[]) => t[0] === 'L' && t[1] === ns));
      if (type !== 'all') {
        if (type === 'event') filtered = filtered.filter((e: any) => e.tags?.some((t: string[]) => t[0] === 'e'));
        if (type === 'profile') filtered = filtered.filter((e: any) => e.tags?.some((t: string[]) => t[0] === 'p'));
      }
      if (q) {
        const qq = q.toLowerCase();
        filtered = filtered.filter((e: any) =>
          (e.content || '').toLowerCase().includes(qq) ||
          (e.tags || []).some((t: string[]) => (t.join(':') || '').toLowerCase().includes(qq))
        );
      }
      items = filtered.slice().sort((a: any, b: any) => b.created_at - a.created_at).slice(0, 400);
    });
  }

  async function load() {
    loading = true;
    try {
      const svc: any = await getService('nostr');
      // Ensure connection
      try { await (svc.getInstance() as any).connect?.(); } catch {}
      // 1) Initial einmaliger Cache-Fill; Namespace wird clientseitig gefiltert
      try { await (svc.getInstance() as any).sub().kinds([1985]).limit(800).executeOnce({ closeOn: 'eose' }); } catch {}
      const qStore = (svc.getInstance() as any).query().kinds([1985]).limit(800).execute();
      const unsubQ = qStore.subscribe((arr: any[]) => {
        all = Array.isArray(arr) ? arr : [];
        applyFilters(all);
        loading = false;
      });
      unsubscribers.push(unsubQ);

      // 2) Live updates
      const sub = await (svc.getInstance() as any).sub().kinds([1985]).limit(800).execute();
      const unsubLive = sub.store.subscribe((arr: any[]) => {
        all = Array.isArray(arr) ? arr : [];
        applyFilters(all);
        loading = false;
      });
      unsubscribers.push(unsubLive);
    } catch {
      loading = false;
    }
  }

  onMount(() => { applyFromUrl(); load(); });
  // Refilter on state changes
  $effect(() => { void ns; void type; void q; applyFilters(all); });
  $effect(() => () => { try { unsubscribers.forEach((u)=>u()); unsubscribers=[]; } catch {} });
</script>

<div class="labels-page">
  <BackHeader title="Labels" fallbackHref="/explore" sticky />
  <header class="page-header">
    <div class="filters">
      <input type="text" placeholder="Namespace (z.B. app)" bind:value={ns} oninput={() => {}} />
      <select bind:value={type} onchange={() => {}}>
        <option value="all">All</option>
        <option value="event">Events</option>
        <option value="profile">Profiles</option>
      </select>
      <input type="text" placeholder="Search (tags/content)" bind:value={q} oninput={() => {}} />
    </div>
  </header>

  {#if loading}
    <div class="hint">Loading…</div>
  {/if}

  {#if !loading && items.length === 0}
    <div class="empty">
      <div class="emoji">🏷️</div>
      <div>No labels found</div>
      <small>Try changing the namespace or filters.</small>
    </div>
  {/if}

  <div class="list">
    {#each items as it}
      <div class="item">
        <div class="row">
          <div class="author" title={it.pubkey}>
            <ProfileAvatar pubkey={it.pubkey} size="sm" on:profileClick={() => openProfile(it.pubkey)} />
            <button class="link" onclick={() => openProfile(it.pubkey)}>{shorten(it.pubkey)}</button>
          </div>
          <div class="meta">
            <code class="id">{shorten(it.id)}</code>
            <span class="time">{new Date(it.created_at * 1000).toLocaleString()}</span>
          </div>
        </div>
        <div class="tags">
          {#each it.tags as t}
            <span class="tag" title={t.join(':')}><b>{t[0]}</b>{t[1] ? `:${t[1]}` : ''}{t[2] ? `:${t[2]}` : ''}</span>
          {/each}
        </div>
        {#if it.content}
          <div class="content">{it.content}</div>
        {/if}
        <div class="actions">
          {#if firstTagValue(it, 'e')}
            <button class="action" onclick={() => openThread(firstTagValue(it, 'e')!)} title="Event öffnen">🔎 Open Event</button>
          {/if}
          {#if firstTagValue(it, 'p')}
            <button class="action" onclick={() => openProfile(firstTagValue(it, 'p')!)} title="Profil öffnen">👤 Profile</button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .labels-page { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .page-header { display:flex; align-items:center; justify-content: flex-end; gap:.75rem; }
  .filters { display:flex; gap:.5rem; align-items:center; flex-wrap: wrap; }
  input, select { padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); }
  .list { display:flex; flex-direction: column; gap:.5rem; }
  .item { padding:.6rem .8rem; border:1px solid rgba(255,255,255,0.08); border-radius:10px; background: rgba(255,255,255,0.03); display:flex; flex-direction:column; gap:.4rem; }
  .row { display:flex; align-items:center; justify-content: space-between; gap:.5rem; }
  .author { display:flex; align-items:center; gap:.5rem; }
  .link { background:none; border:none; color:#7dd3fc; cursor:pointer; padding:0; font-family: var(--font-mono); }
  .meta { display:flex; gap:.5rem; align-items:center; color:#94a3b8; font-size:.8rem; }
  .id { font-family: var(--font-mono); }
  .tags { display:flex; gap:.35rem; flex-wrap: wrap; margin:.25rem 0; }
  .tag { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:2px 6px; border-radius:8px; font-size:.75rem; }
  .content { color:#cbd5e1; font-size:.9rem; }
  .actions { display:flex; gap:.5rem; }
  .action { border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color:#e2e8f0; padding:4px 8px; border-radius:8px; cursor:pointer; font-size:.8rem; }
  .empty { text-align:center; opacity:.8; padding:1.5rem 0; display:flex; gap:.25rem; flex-direction:column; align-items:center; }
  .emoji { font-size:2rem; }
  .hint { opacity:.8; font-style: italic; }
</style>


