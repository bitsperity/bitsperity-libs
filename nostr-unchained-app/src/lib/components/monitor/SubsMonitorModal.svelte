<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  const dispatch = createEventDispatcher();

  // Data
  let nostr: any = null;
  let relayStats: any = null;
  let analytics: any = null;
  let shared: Array<any> = [];
  let active: Array<any> = [];
  let snapshot: any = null;
  let timer: any = null;
  let refreshMs = 1000;

  // UI State
  type Tab = 'overview' | 'shared' | 'active' | 'relays' | 'json';
  let activeTab: Tab = 'overview';

  // Filters / sorting
  let sharedFilter = '';
  let sharedSort: 'listeners' | 'events' | 'age' | 'key' = 'listeners';
  let sharedDir: 'asc' | 'desc' = 'desc';
  let activeFilter = '';
  let activeSort: 'id' | 'events' | 'age' = 'age';
  let activeDir: 'asc' | 'desc' = 'desc';

  function getSharedRows() {
    const rows = (shared || []).slice().filter(s => {
      const f = sharedFilter.trim().toLowerCase();
      if (!f) return true;
      return s.key?.toLowerCase?.().includes(f) || JSON.stringify(s.filters||'').toLowerCase().includes(f);
    });
    rows.sort((a, b) => {
      const av = sharedSort === 'listeners' ? (a.stats?.listenerCount||0)
        : sharedSort === 'events' ? (a.stats?.eventCount||0)
        : sharedSort === 'age' ? (a.stats?.age||0)
        : String(a.key||'').localeCompare(String(b.key||''));
      const bv = sharedSort === 'listeners' ? (b.stats?.listenerCount||0)
        : sharedSort === 'events' ? (b.stats?.eventCount||0)
        : sharedSort === 'age' ? (b.stats?.age||0)
        : String(b.key||'');
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sharedDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }

  function getActiveRows() {
    const rows = (active || []).slice().filter(s => {
      const f = activeFilter.trim().toLowerCase();
      if (!f) return true;
      return (s.id||'').toLowerCase().includes(f) || JSON.stringify(s.filters||'').toLowerCase().includes(f);
    });
    rows.sort((a, b) => {
      const av = activeSort === 'id' ? String(a.id||'')
        : activeSort === 'events' ? (a.eventCount||0)
        : (Date.now() - (a.createdAt || Date.now()));
      const bv = activeSort === 'id' ? String(b.id||'')
        : activeSort === 'events' ? (b.eventCount||0)
        : (Date.now() - (b.createdAt || Date.now()));
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return activeDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }

  function toggleSharedSort(key: 'listeners' | 'events' | 'age' | 'key') {
    if (sharedSort === key) sharedDir = sharedDir === 'asc' ? 'desc' : 'asc'; else { sharedSort = key; sharedDir = key === 'key' ? 'asc' : 'desc'; }
  }
  function toggleActiveSort(key: 'id' | 'events' | 'age') {
    if (activeSort === key) activeDir = activeDir === 'asc' ? 'desc' : 'asc'; else { activeSort = key; activeDir = key === 'id' ? 'asc' : 'desc'; }
  }

  function copyJson() { try { navigator.clipboard.writeText(JSON.stringify(snapshot || { relayStats, analytics, shared, active }, null, 2)); } catch {} }
  function downloadJson() {
    try {
      const blob = new Blob([JSON.stringify(snapshot || { relayStats, analytics, shared, active }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'subs-stats.json'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  }

  function adjustRefresh(ms: number) {
    refreshMs = Math.max(250, Math.min(10_000, ms || 1000));
    try { if (timer) clearInterval(timer); } catch {}
    timer = setInterval(refresh, refreshMs);
  }

  async function stopAll() {
    try { const sm = nostr?.getSubscriptionManager?.(); await sm?.unsubscribeAll?.(); } catch {}
    await refresh();
  }
  async function stopOne(id: string) {
    try { const sm = nostr?.getSubscriptionManager?.(); await sm?.unsubscribe?.(id); } catch {}
    await refresh();
  }
  async function cleanupShared() {
    try { const sm = nostr?.getSubscriptionManager?.(); await sm?.cleanupSharedSubscriptions?.(); } catch {}
    await refresh();
  }

  async function refresh() {
    try {
      if (!nostr) { const svc: any = await getService('nostr'); nostr = svc.getInstance(); }
      relayStats = nostr.getRelayStats?.() || nostr.getStats?.() || null;
      const sm = nostr.getSubscriptionManager?.();
      analytics = sm?.getSubscriptionAnalytics?.() || null;
      shared = sm?.getSharedSubscriptionsOverview?.() || [];
      active = sm?.getActiveSubscriptions?.() || [];
      snapshot = { relayStats, analytics, shared, active };
    } catch {}
  }

  onMount(async () => {
    await refresh();
    timer = setInterval(refresh, refreshMs);
    return () => { try { clearInterval(timer); } catch {} };
  });
</script>

<div class="modal-backdrop" on:click={() => dispatch('close')}></div>
<div class="modal" role="dialog" aria-label="Subscriptions Monitor">
  <header class="modal-header">
    <h3>📡 Subscriptions Monitor</h3>
    <button class="icon" on:click={() => dispatch('close')}>✕</button>
  </header>
  <div class="modal-body">
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" class:active={activeTab==='overview'} on:click={() => activeTab='overview'}>Overview</button>
      <button class="tab" class:active={activeTab==='shared'} on:click={() => activeTab='shared'}>Shared</button>
      <button class="tab" class:active={activeTab==='active'} on:click={() => activeTab='active'}>Active</button>
      <button class="tab" class:active={activeTab==='relays'} on:click={() => activeTab='relays'}>Relays</button>
      <button class="tab" class:active={activeTab==='json'} on:click={() => activeTab='json'}>JSON</button>
    </div>

    <!-- Actions -->
    <div class="actions">
      <div class="refresh-controls">
        <label>Refresh</label>
        <input class="input refresh-input" type="number" min="250" max="10000" bind:value={refreshMs} on:change={(e)=>adjustRefresh(Number((e.currentTarget as HTMLInputElement).value || refreshMs))} />
        <span>ms</span>
      </div>
      <div class="spacer"></div>
      <button class="icon" on:click={copyJson} title="Copy JSON">📋</button>
      <button class="icon" on:click={downloadJson} title="Download JSON">⬇️</button>
      <button class="danger" on:click={stopAll} title="Stop all">🛑 Stop All</button>
    </div>

    {#if activeTab === 'overview'}
      <div class="grid">
        <div class="card"><div class="label">Relays total</div><div class="value">{relayStats?.total ?? '-'}</div></div>
        <div class="card"><div class="label">Connected</div><div class="value">{relayStats?.connected ?? '-'}</div></div>
        <div class="card"><div class="label">Subscriptions</div><div class="value">{analytics?.totalSubscriptions ?? '-'}</div></div>
        <div class="card"><div class="label">Shared</div><div class="value">{analytics?.sharedSubscriptions ?? '-'}</div></div>
        <div class="card"><div class="label">Listeners</div><div class="value">{analytics?.totalListeners ?? '-'}</div></div>
        <div class="card"><div class="label">Duplicates avoided</div><div class="value">{analytics?.duplicatesAvoided ?? '-'}</div></div>
      </div>
    {/if}

    {#if activeTab === 'shared'}
      <div class="toolbar">
        <input class="filter" placeholder="Filter key or filters…" bind:value={sharedFilter} />
        <div class="segmented">
          <button class="seg-btn" class:active={sharedSort==='key'} on:click={() => toggleSharedSort('key')}>Key {sharedSort==='key' ? (sharedDir==='asc'?'↑':'↓') : ''}</button>
          <button class="seg-btn" class:active={sharedSort==='listeners'} on:click={() => toggleSharedSort('listeners')}>Listeners {sharedSort==='listeners' ? (sharedDir==='asc'?'↑':'↓') : ''}</button>
          <button class="seg-btn" class:active={sharedSort==='events'} on:click={() => toggleSharedSort('events')}>Events {sharedSort==='events' ? (sharedDir==='asc'?'↑':'↓') : ''}</button>
          <button class="seg-btn" class:active={sharedSort==='age'} on:click={() => toggleSharedSort('age')}>Age {sharedSort==='age' ? (sharedDir==='asc'?'↑':'↓') : ''}</button>
        </div>
        <button class="ghost" on:click={cleanupShared} title="Cleanup shared without listeners">🧹 Cleanup</button>
      </div>
      <div class="table">
        <div class="row head">
          <div>Key</div><div>Listeners</div><div>Events</div><div>Age</div><div>Relays</div><div>Filters</div>
        </div>
        {#each getSharedRows() as s}
          <div class="row">
            <div class="mono">{s.key}</div>
            <div>{s.stats?.listenerCount ?? 0}</div>
            <div>{s.stats?.eventCount ?? 0}</div>
            <div>{Math.round((s.stats?.age||0)/1000)}s</div>
            <div class="mono small">{(s.relays||[]).length}</div>
            <div class="mono small">{JSON.stringify(s.filters)}</div>
          </div>
        {/each}
        {#if (shared||[]).length === 0}
          <div class="row"><div class="mono">No shared subscriptions</div></div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'active'}
      <div class="toolbar">
        <input class="filter" placeholder="Filter id or filters…" bind:value={activeFilter} />
        <div class="segmented">
          <button class="seg-btn" class:active={activeSort==='id'} on:click={() => toggleActiveSort('id')}>Id {activeSort==='id' ? (activeDir==='asc'?'↑':'↓') : ''}</button>
          <button class="seg-btn" class:active={activeSort==='events'} on:click={() => toggleActiveSort('events')}>Events {activeSort==='events' ? (activeDir==='asc'?'↑':'↓') : ''}</button>
          <button class="seg-btn" class:active={activeSort==='age'} on:click={() => toggleActiveSort('age')}>Age {activeSort==='age' ? (activeDir==='asc'?'↑':'↓') : ''}</button>
        </div>
      </div>
      <div class="table">
        <div class="row head">
          <div>Id</div><div>Events</div><div>Age</div><div>Filters</div><div>Action</div>
        </div>
        {#each getActiveRows() as s}
          <div class="row">
            <div class="mono small">{s.id}</div>
            <div>{s.eventCount || 0}</div>
            <div>{Math.round((Date.now() - (s.createdAt || Date.now()))/1000)}s</div>
            <div class="mono small">{JSON.stringify(s.filters)}</div>
            <div><button class="danger small" on:click={() => stopOne(s.id)}>Stop</button></div>
          </div>
        {/each}
        {#if (active||[]).length === 0}
          <div class="row"><div class="mono">No active subscriptions</div></div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'relays'}
      <div class="json-view"><pre class="json-content">{JSON.stringify(relayStats, null, 2)}</pre></div>
    {/if}

    {#if activeTab === 'json'}
      <div class="json-view"><pre class="json-content">{JSON.stringify(snapshot, null, 2)}</pre></div>
    {/if}
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset:0; background: rgba(0,0,0,.5); }
  .modal { position: fixed; top:8%; left:50%; transform: translateX(-50%); width: min(960px, 96vw); max-height: 90vh; background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
  .modal-header { display:flex; align-items:center; justify-content: space-between; padding:.6rem .75rem; border-bottom:1px solid var(--color-border); }
  .modal-body { padding:.75rem; display:flex; flex-direction:column; gap:.75rem; }
  .icon { background: transparent; border:1px solid rgba(255,255,255,.1); border-radius:8px; color:#e2e8f0; cursor:pointer; padding:.25rem .5rem; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap:.5rem; }
  .card { border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:.5rem; background: rgba(255,255,255,.04); }
  .label { color:#94a3b8; font-size:.8rem; }
  .value { font-size:1.1rem; font-weight:600; }

  /* Tabs */
  .tabs { display:flex; gap:.25rem; border-bottom:1px solid var(--color-border); padding-bottom:.25rem; }
  .tab { background: transparent; border:1px solid rgba(255,255,255,.08); border-radius:8px; color:#e2e8f0; cursor:pointer; padding:.3rem .6rem; font-size:.9rem; }
  .tab.active { background: var(--color-primary); color: var(--color-primary-text); border-color: var(--color-primary); }

  /* Actions */
  .actions { display:flex; align-items:center; gap:.5rem; }
  .spacer { flex:1; }
  .refresh-controls { display:flex; align-items:center; gap:.4rem; }
  .refresh-controls input { width: 90px; }
  .refresh-input { appearance: textfield; -moz-appearance: textfield; }
  .refresh-input::-webkit-outer-spin-button, .refresh-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .input { padding:.4rem .6rem; border:1px solid var(--color-border); border-radius:8px; background: var(--color-background); color: var(--color-text); }
  .input:focus { outline:none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
  .danger { border:1px solid rgb(239, 68, 68); border-radius:8px; background: rgba(239,68,68,.1); color: rgb(239,68,68); padding:.25rem .5rem; cursor:pointer; }
  .danger.small { font-size:.85rem; padding:.15rem .4rem; }
  .ghost { border:1px solid rgba(255,255,255,.1); border-radius:8px; background: transparent; color:#e2e8f0; padding:.25rem .5rem; cursor:pointer; }

  /* Tables */
  .toolbar { display:flex; align-items:center; gap:.5rem; }
  .filter { flex:1; padding:.4rem .6rem; border:1px solid var(--color-border); border-radius:8px; background: var(--color-background); color: var(--color-text); }
  .table { display:flex; flex-direction:column; gap:.25rem; border-top:1px solid rgba(255,255,255,.08); padding-top:.5rem; max-height: 50vh; overflow:auto; }
  .row { display:grid; grid-template-columns: 2fr .7fr .7fr .7fr .8fr 3fr; gap:.5rem; align-items:flex-start; padding:.25rem .25rem; }
  .row.head { position: sticky; top: 0; background: var(--color-surface); z-index: 1; color:#94a3b8; font-weight:600; }
  .table::-webkit-scrollbar { height: 8px; width: 8px; }
  .table::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 9999px; }
  .table::-webkit-scrollbar-track { background: rgba(255,255,255,.06); }
  .mono { font-family: var(--font-mono); }
  .small { font-size:.8rem; }
  .segmented { display:inline-flex; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; background: rgba(255,255,255,0.04); }
  .seg-btn { padding:.35rem .6rem; background: transparent; color: var(--color-text); border: none; cursor: pointer; font-size:.9rem; }
  .seg-btn.active { background: var(--color-primary); color: var(--color-primary-text); }

  /* JSON */
  .json-view { background: var(--color-surface); border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
  .json-content { padding:.6rem; margin:0; font-family: var(--font-mono); font-size:.85rem; line-height:1.5; color: var(--color-text-muted); max-height: 60vh; overflow:auto; }
</style>


