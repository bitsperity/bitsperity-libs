<script lang="ts">
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import { goto } from '$app/navigation';
  import ProfileAvatar from '$lib/components/ui/ProfileAvatar.svelte';

  let author = $state('');
  let q = $state('');
  let items: any[] = $state([]);
  let all: any[] = $state([]);
  let loading = $state(false);
  let unsubscribers: Array<() => void> = [];
  const PAGE_SIZE = 60;
  const MAX_RENDERED = 180;
  let paging: { until: number | null; hasMore: boolean } = $state({ until: null, hasMore: true });
  let updateScheduled = false;
  let pendingArr: any[] = [];
  let filterRaf: number | null = null;

  function getTag(ev: any, key: string): string | undefined {
    try { return (ev.tags || []).find((t: string[]) => t?.[0] === key)?.[1]; } catch { return undefined; }
  }
  function meta(ev: any) {
    return {
      d: getTag(ev, 'd') || '',
      title: getTag(ev, 'title') || (ev.content?.slice(0, 80) || 'Untitled'),
      summary: getTag(ev, 'summary') || (ev.content?.slice(0, 200) || ''),
      image: getTag(ev, 'image') || undefined,
    };
  }
  function tags(ev: any): string[] {
    try { return (ev.tags || []).filter((t: string[]) => t?.[0] === 't').map((t: string[]) => t?.[1]).filter(Boolean); } catch { return []; }
  }
  function readingTime(ev: any): string {
    try {
      const text: string = String(ev.content || '');
      const words = (text.trim().match(/\S+/g) || []).length;
      const minutes = Math.max(1, Math.round(words / 200));
      return `${minutes} min`;
    } catch { return '1 min'; }
  }
  function openArticle(ev: any) {
    const m = meta(ev);
    if (ev?.pubkey && m.d) goto(`/articles/${ev.pubkey}/${encodeURIComponent(m.d)}`);
  }
  function openProfile(pubkey: string) { if (pubkey) goto(`/?profile=${pubkey}`); }

  function applyFilters(input?: any[]) {
    const base = Array.isArray(input) ? input : (Array.isArray(all) ? all : []);
    const run = () => {
      let filtered = base;
      if (author) filtered = filtered.filter((e: any) => e.pubkey === author);
      if (q) {
        const s = q.toLowerCase();
        filtered = filtered.filter((e: any) => {
          const m = meta(e);
          return (m.title?.toLowerCase().includes(s) || m.summary?.toLowerCase().includes(s) || (e.content||'').toLowerCase().includes(s));
        });
      }
      const sorted = filtered.slice().sort((a, b) => b.created_at - a.created_at);
      items = sorted.slice(0, MAX_RENDERED);
    };
    if (typeof requestAnimationFrame !== 'function') {
      run();
      return;
    }
    if (filterRaf) { try { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(filterRaf); } catch {} }
    filterRaf = requestAnimationFrame(run);
  }

  function scheduleUpdate(arr: any[]) {
    pendingArr = Array.isArray(arr) ? arr : [];
    if (updateScheduled) return;
    updateScheduled = true;
    const run = () => {
      try {
        all = pendingArr;
        applyFilters(all);
        const list = all || [];
        paging.hasMore = list.length >= PAGE_SIZE;
        if (list.length > 0) {
          const oldest = list.reduce((min: number, e: any) => Math.min(min, e.created_at || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
          paging.until = oldest > 0 ? oldest - 1 : null;
        } else {
          paging.until = null;
        }
        loading = false;
      } finally {
        updateScheduled = false;
      }
    };
    if (typeof requestAnimationFrame !== 'function') {
      run();
      return;
    }
    requestAnimationFrame(run);
  }

  async function load() {
    loading = true;
    try {
      const svc: any = await getService('nostr');
      try { await (svc.getInstance() as any).connect?.(); } catch {}

      // Cache read (bounded + author filter)
      let qStore;
      if (author) {
        // initial Cache-Fill (author-spezifisch)
        try { await (svc.getInstance() as any).sub().kinds([30023]).authors([author]).limit(PAGE_SIZE * 3).executeOnce({ closeOn: 'eose' }); } catch {}
        qStore = (svc.getInstance() as any).content?.articles?.(author, { limit: PAGE_SIZE * 3 })
          || (svc.getInstance() as any).query().kinds([30023]).authors([author]).limit(PAGE_SIZE * 3).execute();
      } else {
        // initial Cache-Fill (global)
        try { await (svc.getInstance() as any).sub().kinds([30023]).limit(PAGE_SIZE * 3).executeOnce({ closeOn: 'eose' }); } catch {}
        qStore = (svc.getInstance() as any).query().kinds([30023]).limit(PAGE_SIZE * 3).execute();
      }
      if (qStore?.subscribe) {
        const u1 = qStore.subscribe((arr: any[]) => { scheduleUpdate(arr || []); });
        unsubscribers.push(u1);
      }

      // Start a small live subscription to fill cache in background (decoupled from UI)
      try {
        const inst = (svc.getInstance() as any);
        const live = author
          ? await inst.sub().kinds([30023]).authors([author]).limit(PAGE_SIZE).execute()
          : await inst.sub().kinds([30023]).limit(PAGE_SIZE).execute();
        // keep handle alive; stop on cleanup
        unsubscribers.push(() => { try { live.stop?.(); } catch {} });
      } catch {}
    } catch {
      loading = false;
    }
  }

  async function loadMore() {
    if (paging.until == null) return;
    try {
      const svc: any = await getService('nostr');
      let qb = (svc.getInstance() as any).query().kinds([30023]);
      if (author) qb = qb.authors([author]);
      qb = qb.until(paging.until).limit(PAGE_SIZE);
      const store = qb.execute();
      let first = true;
      const unsub = store.subscribe((more: any[]) => {
        if (!first) return; first = false; try { unsub(); } catch {}
        const arr = Array.isArray(more) ? more : [];
        if (arr.length === 0) { paging.hasMore = false; return; }
        const merged = [...(all || []), ...arr];
        const dedup = new Map<string, any>();
        merged.forEach(ev => { if (ev?.id) dedup.set(ev.id, ev); });
        // cap total retained for filtering
        all = Array.from(dedup.values()).sort((a: any, b: any) => b.created_at - a.created_at).slice(0, 1000);
        applyFilters(all);
        paging.hasMore = arr.length >= PAGE_SIZE;
        const oldest = arr.reduce((min: number, e: any) => Math.min(min, e.created_at || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
        paging.until = oldest > 0 ? oldest - 1 : paging.until;
      });
    } catch {}
  }

  function initFromUrl() {
    try { const params = new URLSearchParams(window.location.search); author = params.get('author') || ''; q = params.get('q') || ''; } catch {}
  }

  onMount(() => { initFromUrl(); load(); });
  $effect(() => { void q; applyFilters(); });
  // Rebuild query when author changes
  $effect(() => { void author; try { unsubscribers.forEach((u)=>u()); unsubscribers=[]; } catch {}; load(); });
  // Cleanup
  $effect(() => () => { try { unsubscribers.forEach((u)=>u()); unsubscribers=[]; } catch {} });
</script>

<div class="articles-page">
  <header class="page-header">
    <div class="title-group">
      <h1>Articles</h1>
      <p class="subtitle">Long‑form (NIP‑23) mit Cover, Hashtags und Lesezeit</p>
    </div>
    <div class="filters">
      <input type="text" placeholder="Autor (hex)" bind:value={author} />
      <input type="text" placeholder="Suche in Titel/Content" bind:value={q} />
      <button class="primary" onclick={() => goto('/articles/new')} aria-label="Neuen Artikel erstellen">Neu</button>
    </div>
  </header>

  {#if loading}
    <div class="hint">Loading…</div>
  {/if}

  <div class="grid">
    {#each items as it}
      {#key it.id}
        {#if meta(it).image}
          <button class="card" style={`--bg:url('${meta(it).image}')`} onclick={() => openArticle(it)} aria-label={`Öffne Artikel ${meta(it).title}`}>
            <div class="cover"></div>
            <div class="card-body">
              <div class="card-title">{meta(it).title}</div>
              {#if meta(it).summary}
                <div class="card-summary">{meta(it).summary}</div>
              {/if}
              <div class="card-footer">
                <ProfileAvatar pubkey={it.pubkey} size="sm" on:profileClick={() => openProfile(it.pubkey)} />
                <span class="sep"></span>
                <span class="muted">{new Date(it.created_at * 1000).toLocaleDateString()}</span>
                <span class="dot"></span>
                <span class="muted">{readingTime(it)}</span>
              </div>
              {#if tags(it).length}
                <div class="tags">
                  {#each tags(it).slice(0,3) as t}
                    <span class="tag">#{t}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </button>
        {:else}
          <button class="card no-image" onclick={() => openArticle(it)} aria-label={`Öffne Artikel ${meta(it).title}`}>
            <div class="cover"></div>
            <div class="card-body">
              <div class="card-title">{meta(it).title}</div>
              {#if meta(it).summary}
                <div class="card-summary">{meta(it).summary}</div>
              {/if}
              <div class="card-footer">
                <ProfileAvatar pubkey={it.pubkey} size="sm" on:profileClick={() => openProfile(it.pubkey)} />
                <span class="sep"></span>
                <span class="muted">{new Date(it.created_at * 1000).toLocaleDateString()}</span>
                <span class="dot"></span>
                <span class="muted">{readingTime(it)}</span>
              </div>
              {#if tags(it).length}
                <div class="tags">
                  {#each tags(it).slice(0,3) as t}
                    <span class="tag">#{t}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </button>
        {/if}
      {/key}
    {/each}
  </div>
</div>

<style>
  .articles-page { padding: 1rem; display:flex; flex-direction:column; gap:1rem; }
  .page-header { display:flex; align-items:flex-end; justify-content: space-between; gap:1rem; flex-wrap: wrap; }
  .title-group { display:flex; flex-direction:column; gap:.25rem; }
  .subtitle { margin:0; color:#94a3b8; font-size:.95rem; }
  .filters { display:flex; gap:.5rem; align-items:center; flex-wrap: wrap; }
  input { padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); }
  .primary { border:1px solid rgba(255,255,255,0.12); background: var(--color-primary); color: var(--color-primary-text); border-radius:8px; padding:6px 10px; cursor:pointer; }
  .grid { display:grid; gap:.9rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .card { position:relative; display:flex; flex-direction:column; align-items:stretch; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); cursor:pointer; text-align:left; }
  .card .cover { height:160px; background: linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(147,51,234,0.25) 100%); }
  .card:not(.no-image) .cover { background-image: var(--bg); background-size: cover; background-position: center; }
  .card-body { display:flex; flex-direction:column; gap:.45rem; padding:.75rem; }
  .card-title { font-weight:700; color:#e2e8f0; }
  .card-summary { color:#94a3b8; font-size:.95rem; min-height: 2.6em; line-height:1.3; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient: vertical; }
  .card-footer { display:flex; align-items:center; gap:.5rem; color:#94a3b8; font-size:.85rem; }
  .sep { flex: 0 0 8px; }
  .dot { width:4px; height:4px; background:#64748b; border-radius:50%; display:inline-block; margin:0 .25rem; }
  .muted { color:#94a3b8; }
  .tags { display:flex; gap:.35rem; flex-wrap: wrap; margin-top:.1rem; }
  .tag { font-size:.75rem; color:#cbd5e1; background: rgba(148,163,184,0.12); border:1px solid rgba(148,163,184,0.25); padding:.1rem .4rem; border-radius:999px; }
</style>


