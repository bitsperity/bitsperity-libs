<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte';

  let { nostr, pubkey, limit = 3, className = '' }: { nostr: any; pubkey: string; limit?: number; className?: string } = $props();

  let loading: boolean = $state(false);
  type ArticleItem = { id: string; d: string; title: string; summary: string; image?: string | undefined; created_at: number };
  let items: ArticleItem[] = $state([] as ArticleItem[]);
  let unsubscribe: (() => void) | null = null;

  function getTag(ev: any, key: string): string | undefined {
    try { return (ev.tags || []).find((t: string[]) => t?.[0] === key)?.[1]; } catch { return undefined; }
  }

  function parse(ev: any) {
    const d = getTag(ev, 'd') || '';
    const title = getTag(ev, 'title') || (ev.content?.slice(0, 60) || 'Untitled');
    const summary = getTag(ev, 'summary') || (ev.content?.slice(0, 160) || '');
    const image = getTag(ev, 'image');
    return { id: ev.id, d, title, summary, image, created_at: ev.created_at || 0 };
  }

  async function load() {
    if (!nostr || !pubkey) return;
    loading = true;
    try {
      const store = nostr.content?.articles?.(pubkey, { limit: Math.max(10, limit * 3) });
      if (!store || typeof store.subscribe !== 'function') { loading = false; return; }
      unsubscribe = store.subscribe((arr: any[]) => {
        const parsed = (arr || []).map(parse).sort((a, b) => b.created_at - a.created_at);
        items = parsed.slice(0, limit);
        loading = false;
      });
    } catch {
      loading = false;
    }
  }

  function openAll() { try { location.assign(`/articles?author=${pubkey}`); } catch {} }
  function openArticle(it: { d: string }) { try { location.assign(`/articles/${pubkey}/${encodeURIComponent(it.d)}`); } catch {} }

  onMount(() => { load(); return () => { try { unsubscribe?.(); } catch {} }; });
</script>

<div class="articles-widget {className}">
  <div class="widget-header">
    <h3>📝 Articles</h3>
    <button class="ghost" onclick={openAll} title="Alle Artikel ansehen">Alle</button>
  </div>

  {#if loading}
    <div class="loading">Lädt…</div>
  {:else if items.length === 0}
    <div class="empty">Keine Artikel</div>
  {:else}
    <ul class="list">
      {#each items as it}
        <li>
          <button class="item" onclick={() => openArticle(it)} onkeydown={(e) => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); openArticle(it); } }}>
            {#if it.image}
              <div class="thumb" style={`--bg:url('${it.image}')`}></div>
            {:else}
              <div class="thumb placeholder"></div>
            {/if}
            <div class="body">
              <div class="title">{it.title}</div>
              <div class="meta"><span class="date">{new Date(it.created_at * 1000).toLocaleDateString()}</span></div>
              {#if it.summary}
                <div class="summary">{it.summary}</div>
              {/if}
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .articles-widget { border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:.75rem; background: rgba(255,255,255,0.03); }
  .widget-header { display:flex; align-items:center; justify-content: space-between; margin-bottom:.5rem; }
  .widget-header h3 { margin: 0; font-size: 1rem; }
  .ghost { border:1px solid rgba(255,255,255,0.12); background: transparent; color:#cbd5e1; border-radius:8px; padding:4px 8px; cursor:pointer; }
  .loading, .empty { opacity:.8; font-style: italic; }
  .list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.5rem; }
  .item { display:grid; grid-template-columns: 60px 1fr; gap:.6rem; padding:.5rem; border:1px solid rgba(255,255,255,0.06); border-radius:10px; background: rgba(255,255,255,0.02); cursor:pointer; text-align:left; }
  .thumb { width:60px; height:60px; border-radius:8px; background-image: var(--bg); background-size: cover; background-position: center; }
  .thumb.placeholder { background: linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(147,51,234,0.25) 100%); }
  .item:focus { outline: 2px solid rgba(125,211,252,0.5); }
  .body { display:flex; flex-direction:column; gap:.2rem; }
  .meta { color:#94a3b8; font-size:.8rem; }
  .title { font-weight:600; color:#e2e8f0; line-height:1.2; }
  .summary { color:#94a3b8; font-size:.9rem; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient: vertical; }
</style>


