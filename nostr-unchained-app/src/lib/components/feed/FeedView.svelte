<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import EventCard from '../terminal/EventCard.svelte';
  import KeyDisplay from '../ui/KeyDisplay.svelte';
  import { page } from '$app/stores';

  let { nostr }: { nostr: any } = $props();

  type FeedTab = 'home' | 'mentions' | 'hashtags' | 'own';
  let tab: FeedTab = $state('home');
  let hashtag = $state('nostr');

  let me = $state<string>('');
  let myFollows: string[] = $state([]);
  let myFollowsReady: boolean = $state(false);
  let isSignedIn: boolean = $state(false);
  let live: any = $state(null);
  let cacheUnsub: (() => void) | null = null;
  let events: any[] = $state([]);
  let isLoading = $state(false);
  const PAGE_SIZE = 50;
  const MAX_RENDERED = 200; // keep list small to avoid DOM thrash
  let paging: { until: number | null; hasMore: boolean } = $state({ until: null, hasMore: true });
  const EMPTY_DELAY_MS = 1500; // Wartezeit, bevor wir "Keine Events" anzeigen
  let firstLiveStartedAt = 0;
  const DEFAULT_SINCE_SECS = 60 * 60 * 24 * 7; // 7 Tage Rückblick für robuste Antworten
  let liveEmptyTimer: ReturnType<typeof setTimeout> | null = null;

  // Start-deduplication keys to avoid unnecessary restarts (which could reset loading timers)
  let lastCacheKey: string | null = $state(null);
  let lastLiveKey: string | null = $state(null);
  let liveStartInFlight: boolean = $state(false);

  function makeKey(kind: 'cache' | 'live'): string {
    const base: any = { tab };
    if (tab === 'mentions' || tab === 'own') base.me = me || '';
    if (tab === 'hashtags') base.t = (hashtag || '').trim().toLowerCase();
    if (tab === 'home') {
      base.fReady = !!myFollowsReady;
      // only hash a prefix to keep key small but sensitive to changes
      const sample = myFollows.slice(0, 50).join(',');
      base.fLen = myFollows.length;
      base.fSample = sample;
    }
    base.kind = kind;
    base.limit = PAGE_SIZE;
    return JSON.stringify(base);
  }

  // Throttle incoming updates via rAF with robust fallbacks (visibility/background)
  let pendingRaw: any[] = [];
  let updateScheduled = false;
  let rafId: number | null = null;
  function applyUpdate(list: any[]) {
    const sorted = list.slice().sort((a: any, b: any) => b.created_at - a.created_at);
    events = sorted.slice(0, MAX_RENDERED);
    paging.hasMore = list.length >= PAGE_SIZE;
    if (list.length > 0) {
      const oldest = list.reduce((min: number, e: any) => Math.min(min, e.created_at || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
      paging.until = oldest > 0 ? oldest - 1 : null;
    } else {
      paging.until = null;
    }
    // Nur dann "fertig", wenn wir Daten haben –
    // ansonsten weiter Laden bis Timeout, um falsches "Keine Events" zu vermeiden
    if (list.length > 0) {
      isLoading = false;
      if (liveEmptyTimer) { try { clearTimeout(liveEmptyTimer); } catch {} liveEmptyTimer = null; }
    } else {
      const elapsed = Date.now() - firstLiveStartedAt;
      isLoading = elapsed < EMPTY_DELAY_MS;
    }
  }

  function scheduleUpdate(raw: any[], immediate = false) {
    if (immediate) {
      applyUpdate(raw || []);
      return;
    }
    pendingRaw = raw;
    if (updateScheduled) return;
    updateScheduled = true;
    const flush = () => {
      try { applyUpdate(pendingRaw || []); } finally { updateScheduled = false; }
    };
    const useRaf = typeof requestAnimationFrame === 'function' && (typeof document === 'undefined' || document.visibilityState === 'visible');
    if (useRaf) {
      rafId = requestAnimationFrame(flush);
    } else {
      setTimeout(flush, 0);
    }
  }

  // Resolve my pubkey and follows (NIP-02) reactively, including auth changes
  let followsUnsub: (() => void) | null = null;
  async function setupFollowsSubscription() {
    try {
      const store = await nostr.profile.follows.mine();
      if (followsUnsub) { try { followsUnsub(); } catch {} followsUnsub = null; }
      followsUnsub = store.follows.subscribe((follows: any[]) => {
        myFollows = (follows || []).map((f: any) => f.pubkey).slice(0, 500);
        myFollowsReady = true;
        // Sobald Follows bekannt sind: Feed neu entscheiden
        ensureFeed();
      });
    } catch {
      // Kein Signer/keine Berechtigung → Home darf nicht blockieren
      myFollows = [];
      myFollowsReady = true;
      ensureFeed();
    }
  }

  function updateSignedIn() {
    try {
      const info = nostr?.getSigningInfo?.();
      isSignedIn = !!info && info.method && info.method !== 'unknown';
    } catch { isSignedIn = false; }
  }

  function stopLive() {
    try { live?.stop?.(); } catch {}
    live = null;
    if (liveEmptyTimer) { try { clearTimeout(liveEmptyTimer); } catch {} liveEmptyTimer = null; }
  }

  function stopCache() {
    if (cacheUnsub) { try { cacheUnsub(); } catch {} cacheUnsub = null; }
  }

  function startCacheRead() {
    if (!nostr) return;
    try {
      const key = makeKey('cache');
      if (key === lastCacheKey && cacheUnsub) return; // already active
      lastCacheKey = key;
      stopCache();
      isLoading = true;
      let qb = nostr.query().kinds([1]);
      if (tab === 'home') {
        // Home ohne Login nicht anzeigen
        if (!isSignedIn) { isLoading = false; return; }
        // Wenn Follows noch nicht bereit, starte globalen Feed und wechsle später um
        if (myFollowsReady && myFollows.length > 0) qb = qb.authors(myFollows);
      }
      if (tab === 'mentions' && me) qb = qb.tags('p', [me]);
      if (tab === 'hashtags' && hashtag.trim()) qb = qb.tags('t', [hashtag.trim()]);
      if (tab === 'own' && me) qb = qb.authors([me]);
      // Für globale/weit gefasste Feeds erzwinge ein Zeitfenster (einige Relays liefern sonst nichts)
      const now = Math.floor(Date.now() / 1000);
      const needsSince = (tab === 'home' && (!myFollowsReady || myFollows.length === 0)) || tab === 'hashtags';
      if (needsSince) qb = qb.since(now - DEFAULT_SINCE_SECS);
      qb = qb.limit(PAGE_SIZE);
      const store = qb.execute();
      let first = true;
      cacheUnsub = store.subscribe((arr: any[]) => { scheduleUpdate(arr || [], first); first = false; });
    } catch {}
  }

  async function startLive() {
    if (!nostr) return;
    const key = makeKey('live');
    if (key === lastLiveKey && (live || liveStartInFlight)) return; // already active or starting
    lastLiveKey = key;
    stopLive();
    isLoading = true;
    firstLiveStartedAt = Date.now();
    if (liveEmptyTimer) { try { clearTimeout(liveEmptyTimer); } catch {} }
    liveEmptyTimer = setTimeout(() => { if (events.length === 0) { isLoading = false; } }, EMPTY_DELAY_MS);

    try {
      liveStartInFlight = true;
      let builder = nostr.sub().kinds([1]); // NIP-01 text notes

      if (tab === 'home') {
        if (!isSignedIn) { isLoading = false; liveStartInFlight = false; return; }
        // Home: wenn Follows bereit → follows-Feed; sonst globaler Feed
        if (myFollowsReady && myFollows.length > 0) builder = builder.authors(myFollows);
      } else if (tab === 'mentions' && me) {
        // Mentions: #p contains me (NIP-10)
        builder = builder.tags('p', [me]);
        // Pre-fill cache once to avoid waiting for live
        try { await nostr.sub().kinds([1]).tags('p', [me]).limit(PAGE_SIZE).executeOnce({ closeOn: 'eose' }); } catch {}
      } else if (tab === 'hashtags' && hashtag.trim()) {
        // Hashtags: #t (NIP-01/NIP-12 moved)
        builder = builder.tags('t', [hashtag.trim()]);
        // Pre-fill cache once for fast first paint
        try { await nostr.sub().kinds([1]).tags('t', [hashtag.trim()]).limit(PAGE_SIZE).executeOnce({ closeOn: 'eose' }); } catch {}
      } else if (tab === 'own' && me) {
        builder = builder.authors([me]);
      }

      // Reasonable limit + Zeitfenster wie beim CacheRead
      const now2 = Math.floor(Date.now() / 1000);
      const needsSinceLive = (tab === 'home' && (!myFollowsReady || myFollows.length === 0)) || tab === 'hashtags';
      if (needsSinceLive) builder = builder.since(now2 - DEFAULT_SINCE_SECS);
      builder = builder.limit(PAGE_SIZE);

      const handle = await builder.execute();
      live = handle;
      handle.store.subscribe((list: any[]) => {
        scheduleUpdate(list || []);
      });
      liveStartInFlight = false;
    } catch (e) {
      isLoading = false;
      liveStartInFlight = false;
      console.error('Feed start failed', e);
    }
  }

  function ensureFeed() {
    startCacheRead();
    startLive();
  }

  async function refreshIdentity(force: boolean = false) {
    try { me = await nostr.getPublicKey(); } catch { me = ''; }
    updateSignedIn();
    await setupFollowsSubscription();
    // Startentscheidung zentralisiert
    ensureFeed();
  }

  function handleAuthChanged() {
    // Force fresh start when signer arrives later
    lastCacheKey = null; lastLiveKey = null; myFollowsReady = false;
    updateSignedIn();
    // Rebind follows after auth changes
    setupFollowsSubscription().then(() => ensureFeed());
  }

  function handleSignerChanged() {
    lastCacheKey = null; lastLiveKey = null; myFollowsReady = false;
    updateSignedIn();
    // Rebind follows after signer changes
    setupFollowsSubscription().then(() => ensureFeed());
  }
  function handleWindowFocus() { refreshIdentity(false); }

  onMount(async () => {
    // URL Params: optional tab/tag
    try {
      const params = new URLSearchParams(location.search);
      const t = (params.get('tab') || '').toLowerCase();
      const tag = params.get('tag') || '';
      if (t === 'mentions' || t === 'hashtags' || t === 'own' || t === 'home') {
        tab = t as any;
      }
      if (tag && tab === 'hashtags') {
        hashtag = tag;
      }
    } catch {}

    await refreshIdentity(true);
    try { window.addEventListener('nostr:auth-changed' as any, handleAuthChanged as any); } catch {}
    try { window.addEventListener('nostr:signer-changed' as any, handleSignerChanged as any); } catch {}
    try { window.addEventListener('focus', handleWindowFocus); } catch {}
  });

  // React to query param changes while staying on the same route (SPA navigation)
  let lastSeenParamsKey: string = $state('');
  $effect(() => {
    const unsub = page.subscribe(($p) => {
      try {
        const t = ($p.url.searchParams.get('tab') || '').toLowerCase();
        const tg = $p.url.searchParams.get('tag') || '';
        const key = `${t}|${tg}`;
        if (key === lastSeenParamsKey) return;
        lastSeenParamsKey = key;
        let changed = false;
        if (t && (t === 'home' || t === 'mentions' || t === 'hashtags' || t === 'own') && t !== tab) { tab = t as any; changed = true; }
        if (t === 'hashtags' && tg && tg !== hashtag) { hashtag = tg; changed = true; }
        if (changed) ensureFeed();
      } catch {}
    });
    return () => { try { unsub(); } catch {} };
  });

  onDestroy(() => {
    if (followsUnsub) { try { followsUnsub(); } catch {} followsUnsub = null; }
    try { window.removeEventListener('nostr:auth-changed' as any, handleAuthChanged as any); } catch {}
    try { window.removeEventListener('nostr:signer-changed' as any, handleSignerChanged as any); } catch {}
    try { window.removeEventListener('focus', handleWindowFocus); } catch {}
  });

  function switchTab(next: FeedTab) {
    if (tab === next) return;
    tab = next;
    ensureFeed();
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
        const mergedSorted = Array.from(dedup.values()).sort((a: any, b: any) => b.created_at - a.created_at);
        // keep bounded
        events = mergedSorted.slice(0, Math.max(MAX_RENDERED, PAGE_SIZE * 3));
        paging.hasMore = more.length >= PAGE_SIZE;
        const oldest = more.reduce((min: number, e: any) => Math.min(min, e.created_at || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
        paging.until = oldest > 0 ? oldest - 1 : paging.until;
      });
    } catch (e) { console.error('Feed loadMore failed', e); }
  }

  // Cleanup rAF on destroy
  $effect(() => () => { if (rafId) { try { cancelAnimationFrame(rafId); } catch {} rafId = null; } stopCache(); });
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
        <input class="hashtag-input" type="text" bind:value={hashtag} placeholder="hashtag…" onkeydown={(e)=> e.key==='Enter' && ensureFeed()} />
        <button class="ghost-btn" onclick={ensureFeed}>Apply</button>
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


