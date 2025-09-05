<script lang="ts">
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import { goto } from '$app/navigation';
  import ProfileImage from '$lib/components/ui/ProfileImage.svelte';

  let author = $state('');
  let q = $state('');
  let items: any[] = $state([]);
  let all: any[] = $state([]);
  let loading = $state(false);
  let unsubscribers: Array<() => void> = [];

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

  function applyFilters() {
    let filtered = Array.isArray(all) ? all : [];
    if (author) filtered = filtered.filter((e: any) => e.pubkey === author);
    if (q) {
      const s = q.toLowerCase();
      filtered = filtered.filter((e: any) => {
        const m = meta(e);
        return (m.title?.toLowerCase().includes(s) || m.summary?.toLowerCase().includes(s) || (e.content||'').toLowerCase().includes(s));
      });
    }
    items = filtered.slice().sort((a, b) => b.created_at - a.created_at).slice(0, 500);
  }

  async function load() {
    loading = true;
    try {
      const svc: any = await getService('nostr');
      try { await (svc.getInstance() as any).connect?.(); } catch {}

      // Cache read
      let qStore;
      if (author) {
        qStore = (svc.getInstance() as any).content?.articles?.(author, { limit: 2000 });
      } else {
        qStore = (svc.getInstance() as any).query().kinds([30023]).limit(2000).execute();
      }
      if (qStore?.subscribe) {
        const u1 = qStore.subscribe((arr: any[]) => { all = Array.isArray(arr) ? arr : []; applyFilters(); loading = false; });
        unsubscribers.push(u1);
      }

      // Live
      const sub = author
        ? null
        : await (svc.getInstance() as any).sub().kinds([30023]).limit(2000).execute();
      if (sub?.store) {
        const u2 = sub.store.subscribe((arr: any[]) => { all = Array.isArray(arr) ? arr : []; applyFilters(); loading = false; });
        unsubscribers.push(u2);
      }
    } catch {
      loading = false;
    }
  }

  function initFromUrl() {
    try { const params = new URLSearchParams(window.location.search); author = params.get('author') || ''; q = params.get('q') || ''; } catch {}
  }

  onMount(() => { initFromUrl(); load(); });
  $effect(() => { void author; void q; applyFilters(); });
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
                <ProfileImage pubkey={it.pubkey} size="sm" on:profileClick={() => openProfile(it.pubkey)} />
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
                <ProfileImage pubkey={it.pubkey} size="sm" on:profileClick={() => openProfile(it.pubkey)} />
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


