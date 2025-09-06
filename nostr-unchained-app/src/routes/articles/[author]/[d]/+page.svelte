<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import { renderMarkdownSafe } from '$lib/utils/markdown';
  import BackHeader from '$lib/components/ui/BackHeader.svelte';

  export let params: { author: string; d: string };

  let loading = false;
  let article: any = null;
  let html: string = '';
  let notFoundTimer: any = null;

  function getTag(ev: any, key: string): string | undefined {
    try { return (ev.tags || []).find((t: string[]) => t?.[0] === key)?.[1]; } catch { return undefined; }
  }

  function titleOf(ev: any) { return getTag(ev, 'title') || 'Untitled'; }
  function summaryOf(ev: any) { return getTag(ev, 'summary') || ''; }
  function imageOf(ev: any) { return getTag(ev, 'image') || ''; }
  function tagsOf(ev: any): string[] { try { return (ev.tags||[]).filter((t:string[])=>t?.[0]==='t').map((t:string[])=>t?.[1]).filter(Boolean); } catch { return []; } }
  function readingTime(content: string): string { try { const words=(String(content||'').trim().match(/\S+/g)||[]).length; return `${Math.max(1, Math.round(words/200))} min`; } catch { return '1 min'; } }

  async function load() {
    loading = true;
    try {
      const svc: any = await getService('nostr');
      const d = decodeURIComponent(params.d || '');
      const inst: any = await svc.getReadyInstance();
      try { await inst.connect?.(); } catch {}
      // Live subscription (narrowed by d tag)
      // Single-shot: nur Cache füllen und dann schließen
      try { await inst.sub().kinds([30023]).authors([params.author]).tags('d', [d]).executeOnce({ closeOn: 'eose' }); } catch {}
      const store = inst.query().kinds([30023]).authors([params.author]).execute();
      const unsub = store.subscribe(async (arr: any[]) => {
        const list = Array.isArray(arr) ? arr : [];
        const filtered = list.filter((e: any) => Array.isArray(e.tags) && e.tags.some((t: string[]) => t?.[0] === 'd' && t?.[1] === d));
        if (filtered.length > 0) {
          const ev = filtered.sort((a: any, b: any) => b.created_at - a.created_at)[0];
          article = ev;
          loading = false;
          if (notFoundTimer) { try { clearTimeout(notFoundTimer); } catch {} notFoundTimer = null; }
          try { html = await renderMarkdownSafe(ev?.content); } catch {}
        }
      });
      // Show Not Found if nichts nach kurzer Zeit
      try { if (notFoundTimer) clearTimeout(notFoundTimer); } catch {}
      notFoundTimer = setTimeout(() => { if (!article) loading = false; }, 1200);
      // auto unsubscribe on destroy
      // unsubscribe on destroy
      // svelte5: use cleanup return
      // but we keep simple try/catch for compatibility
      // @ts-ignore
      onDestroy(() => { try { unsub?.(); } catch {} });
    } catch { loading = false; }
  }

  onMount(load);
</script>

<div class="article-page">
  <BackHeader title={article ? titleOf(article) : 'Article'} fallbackHref="/articles" sticky />

  {#if loading}
    <div class="hint">Loading…</div>
  {:else if !article}
    <div class="empty">Not found</div>
  {:else}
    <section class="hero" class:no-image={!imageOf(article)} style={imageOf(article) ? `--hero:url('${imageOf(article)}')` : ''}>
      <div class="overlay"></div>
      <div class="hero-inner">
        <h1 class="title">{titleOf(article)}</h1>
        {#if summaryOf(article)}
          <p class="summary">{summaryOf(article)}</p>
        {/if}
        <div class="meta">
          <span class="muted">{new Date(article.created_at*1000).toLocaleDateString()}</span>
          <span class="dot"></span>
          <span class="muted">{readingTime(article.content)}</span>
        </div>
        {#if tagsOf(article).length}
          <div class="tags">
            {#each tagsOf(article) as t}
              <span class="tag">#{t}</span>
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <article class="content markdown">
      {#if html && html.trim().length}
        {@html html}
      {:else}
        <pre>{article.content}</pre>
      {/if}
    </article>
  {/if}
</div>

<style>
  .article-page { padding: 0 0 2rem 0; display:flex; flex-direction:column; gap:1rem; }
  /* Header styles consolidated in BackHeader */
  .hero { position:relative; min-height: 280px; display:flex; align-items:flex-end; }
  .hero .overlay { position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%); }
  .hero:not(.no-image) { background-image: var(--hero); background-size: cover; background-position: center; }
  .hero.no-image { background: linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(147,51,234,0.35) 100%); }
  .hero-inner { position:relative; padding: 1.25rem; display:flex; flex-direction:column; gap:.5rem; width:100%; }
  .title { font-size: clamp(1.5rem, 2.6vw, 2.25rem); margin:0; }
  .summary { color:#cbd5e1; font-size:1.05rem; margin:0; max-width: 70ch; }
  .meta { display:flex; align-items:center; gap:.5rem; color:#cbd5e1; }
  .dot { width:4px; height:4px; background:#94a3b8; border-radius:50%; display:inline-block; }
  .muted { color:#e2e8f0; opacity:.85; }
  .tags { display:flex; gap:.4rem; flex-wrap: wrap; }
  .tag { font-size:.8rem; color:#e2e8f0; background: rgba(148,163,184,0.18); border:1px solid rgba(148,163,184,0.32); padding:.15rem .5rem; border-radius:999px; }
  .content.markdown { padding: 1.25rem; white-space: pre-wrap; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; font-size:1.02rem; color:#e2e8f0; line-height:1.65; }
</style>


