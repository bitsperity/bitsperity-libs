<script lang="ts">
  import { onMount } from 'svelte';
  import EventCard from '../terminal/EventCard.svelte';
  import KeyDisplay from '../ui/KeyDisplay.svelte';

  let { nostr }: { nostr: any } = $props();

  type FeedTab = 'home' | 'mentions' | 'hashtags' | 'own';
  let tab: FeedTab = $state('home');
  let hashtag = $state('nostr');

  let me = $state<string>('');
  let myFollows: string[] = $state([]);
  let live: any = $state(null);
  let events: any[] = $state([]);
  let isLoading = $state(false);
  const PAGE_SIZE = 50;
  let paging: { until: number | null; hasMore: boolean } = $state({ until: null, hasMore: true });

  // Resolve my pubkey and follows (NIP-02) reactively
  onMount(async () => {
    try { me = await nostr.getPublicKey(); } catch {}
    try {
      const store = await nostr.profile.follows.mine();
      store.follows.subscribe((follows: any[]) => {
        myFollows = (follows || []).map((f: any) => f.pubkey).slice(0, 500);
        // If we are on home, refresh sub to include latest follows
        if (tab === 'home') startLive();
      });
    } catch {}
    startLive();
  });

  function stopLive() {
    try { live?.stop?.(); } catch {}
    live = null;
  }

  async function startLive() {
    if (!nostr) return;
    stopLive();
    isLoading = true;

    try {
      let builder = nostr.sub().kinds([1]); // NIP-01 text notes

      if (tab === 'home') {
        // Home: authors = my follows (NIP-02)
        if (myFollows.length > 0) builder = builder.authors(myFollows);
      } else if (tab === 'mentions' && me) {
        // Mentions: #p contains me (NIP-10)
        builder = builder.tags('p', [me]);
      } else if (tab === 'hashtags' && hashtag.trim()) {
        // Hashtags: #t (NIP-01/NIP-12 moved)
        builder = builder.tags('t', [hashtag.trim()]);
      } else if (tab === 'own' && me) {
        builder = builder.authors([me]);
      }

      // Reasonable limit; auto-batching in builder will scale
      builder = builder.limit(PAGE_SIZE);

      const handle = await builder.execute();
      live = handle;
      handle.store.subscribe((list: any[]) => {
        const raw = (list || []);
        const sorted = raw.slice().sort((a, b) => b.created_at - a.created_at);
        events = sorted;
        paging.hasMore = raw.length >= PAGE_SIZE;
        if (raw.length > 0) {
          const oldest = raw.reduce((min: number, e: any) => Math.min(min, e.created_at || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
          paging.until = oldest > 0 ? oldest - 1 : null;
        } else {
          paging.until = null;
        }
        isLoading = false;
      });
    } catch (e) {
      isLoading = false;
      console.error('Feed start failed', e);
    }
  }

  function switchTab(next: FeedTab) {
    if (tab === next) return;
    tab = next;
    startLive();
  }

  async function loadMore() {
    if (paging.until == null || !nostr) return;
    try {
      let qb = nostr.query().kinds([1]);
      if (tab === 'home' && myFollows.length > 0) qb = qb.authors(myFollows);
      if (tab === 'mentions' && me) qb = qb.tags('p', [me]);
      if (tab === 'hashtags' && hashtag.trim()) qb = qb.tags('t', [hashtag.trim()]);
      if (tab === 'own' && me) qb = qb.authors([me]);
      qb = qb.until(paging.until).limit(PAGE_SIZE);
      const store = qb.execute();
      let first = true;
      const unsub = store.subscribe((more: any[]) => {
        if (!first) return; first = false; try { unsub(); } catch {}
        if (!Array.isArray(more) || more.length === 0) { paging.hasMore = false; return; }
        const merged = [...events, ...more];
        const dedup = new Map<string, any>();
        merged.forEach(ev => { if (ev?.id) dedup.set(ev.id, ev); });
        events = Array.from(dedup.values()).sort((a: any, b: any) => b.created_at - a.created_at);
        paging.hasMore = more.length >= PAGE_SIZE;
        const oldest = more.reduce((min: number, e: any) => Math.min(min, e.created_at || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
        paging.until = oldest > 0 ? oldest - 1 : paging.until;
      });
    } catch (e) { console.error('Feed loadMore failed', e); }
  }
</script>

<div class="feed-view">
  <div class="feed-header">
    <div class="left">
      {#if me}
        <KeyDisplay hexKey={me} variant="compact" copyable={false} />
      {/if}
    </div>
    <div class="segmented">
      <button class="seg-btn" class:active={tab==='home'} onclick={() => switchTab('home')}>Home</button>
      <button class="seg-btn" class:active={tab==='mentions'} onclick={() => switchTab('mentions')}>Mentions</button>
      <button class="seg-btn" class:active={tab==='hashtags'} onclick={() => switchTab('hashtags')}>#Hashtag</button>
      <button class="seg-btn" class:active={tab==='own'} onclick={() => switchTab('own')}>Own</button>
    </div>
    <div class="right">
      {#if tab==='hashtags'}
        <input class="hashtag-input" type="text" bind:value={hashtag} placeholder="hashtag…" onkeydown={(e)=> e.key==='Enter' && startLive()} />
        <button class="ghost-btn" onclick={startLive}>Apply</button>
      {/if}
    </div>
  </div>

  {#if isLoading}
    <div class="loading"><div class="spinner"></div> <span>lädt…</span></div>
  {:else if events.length === 0}
    <div class="empty">Keine Events</div>
  {:else}
    <div class="list">
      {#each events as ev (ev.id)}
        <EventCard event={ev} {nostr} />
      {/each}
      {#if paging.hasMore}
        <button class="ghost-btn load-more" onclick={loadMore}>Mehr laden</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .feed-view { display:flex; flex-direction: column; height:100%; }
  .feed-header { display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; gap:.5rem; padding: .5rem 1rem; border-bottom:1px solid var(--color-border); background: var(--color-surface); }
  .left { opacity:.8; }
  .right { display:flex; justify-content:flex-end; align-items:center; gap:.5rem; }
  .segmented { display:inline-flex; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); }
  .seg-btn { padding:8px 12px; background:transparent; color:#cbd5e1; border:none; cursor:pointer; font-size:.9rem; }
  .seg-btn.active { background: var(--color-primary); color: var(--color-primary-text); }
  .ghost-btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .hashtag-input { padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); font-family: var(--font-mono); width: 160px; }
  .loading { display:flex; align-items:center; gap:.5rem; padding:1rem; color:#cbd5e1; }
  .spinner { width:20px; height:20px; border:2px solid var(--color-border); border-top:2px solid var(--color-primary); border-radius:50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
  .empty { padding: 1rem; color: var(--color-text-muted); }
  .list { display:flex; flex-direction: column; gap: 1rem; padding: 1rem; overflow-y:auto; }
  .ghost-btn.load-more { align-self:center; padding:8px 14px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
</style>


