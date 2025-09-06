<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  const dispatch = createEventDispatcher();

  // Data
  let stats: any = null;
  let nostr: any = null;
  let timer: any = null;
  let refreshMs = 1000;

  // UI State
  type Tab = 'overview' | 'kinds' | 'index' | 'performance' | 'config' | 'json';
  let activeTab: Tab = 'overview';

  // Kinds table state
  let kindFilter = '';
  let kindSortKey: 'kind' | 'count' = 'count';
  let kindSortDir: 'asc' | 'desc' = 'desc';

  const KIND_LABELS: Record<number, string> = {
    0: 'Profiles',
    1: 'Notes',
    3: 'Contacts',
    4: 'DMs',
    6: 'Reposts',
    7: 'Reactions',
    10002: 'Relay List',
    1059: 'Gift Wrap',
    30023: 'Article'
  };
  function getKindLabel(k: number): string { return KIND_LABELS[k] || ''; }

  function getKindsRows() {
    const entries = Object.entries((stats?.byKind) || {}).map(([k, v]) => ({ kind: Number(k), label: getKindLabel(Number(k)), count: Number(v as any) }));
    let rows = entries;
    const f = kindFilter.trim();
    if (f) {
      const tokens = f.split(/[ ,;]+/).map(t => t.trim()).filter(Boolean);
      rows = rows.filter(r => {
        return tokens.some(tok => {
          const t = tok.toLowerCase();
          // numeric
          if (/^\d+$/.test(t)) return r.kind === Number(t);
          // range a-b
          const mRange = t.match(/^(\d+)-(\d+)$/);
          if (mRange) { const a = Number(mRange[1]); const b = Number(mRange[2]); return r.kind >= Math.min(a,b) && r.kind <= Math.max(a,b); }
          // comparators
          const mCmp = t.match(/^(>=|<=|>|<)(\d+)$/);
          if (mCmp) {
            const op = mCmp[1]; const n = Number(mCmp[2]);
            if (op === '>=') return r.kind >= n;
            if (op === '<=') return r.kind <= n;
            if (op === '>') return r.kind > n;
            if (op === '<') return r.kind < n;
          }
          // label contains
          return (r.label || '').toLowerCase().includes(t);
        });
      });
    }
    rows.sort((a, b) => {
      if (kindSortKey === 'kind') {
        return kindSortDir === 'asc' ? a.kind - b.kind : b.kind - a.kind;
      }
      return kindSortDir === 'asc' ? a.count - b.count : b.count - a.count;
    });
    return rows;
  }

  function toggleKindSort(key: 'kind' | 'count') {
    if (kindSortKey === key) {
      kindSortDir = kindSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      kindSortKey = key;
      kindSortDir = key === 'kind' ? 'asc' : 'desc';
    }
  }

  // Utilities
  function copyJson() {
    try { navigator.clipboard.writeText(JSON.stringify(stats, null, 2)); } catch {}
  }
  function downloadJson() {
    try {
      const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cache-stats.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  function adjustRefresh(ms: number) {
    refreshMs = Math.max(250, Math.min(10_000, ms || 1000));
    try { if (timer) clearInterval(timer); } catch {}
    timer = setInterval(refresh, refreshMs);
  }

  async function refresh() {
    try {
      if (!nostr) { const svc: any = await getService('nostr'); nostr = svc.getInstance(); }
      stats = nostr.getCacheStatistics?.() || nostr.getCache()?.getStatistics?.() || null;
    } catch {}
  }

  onMount(async () => {
    await refresh();
    timer = setInterval(refresh, refreshMs);
    return () => { try { clearInterval(timer); } catch {} };
  });
</script>

<div class="modal-backdrop" on:click={() => dispatch('close')}></div>
<div class="modal" role="dialog" aria-label="Cache Monitor">
  <header class="modal-header">
    <h3>🧠 Cache Monitor</h3>
    <button class="icon" on:click={() => dispatch('close')}>✕</button>
  </header>
  <div class="modal-body">
    {#if !stats}
      <div>Loading…</div>
    {:else}
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" class:active={activeTab==='overview'} on:click={() => activeTab='overview'}>Overview</button>
        <button class="tab" class:active={activeTab==='kinds'} on:click={() => activeTab='kinds'}>Kinds</button>
        <button class="tab" class:active={activeTab==='index'} on:click={() => activeTab='index'}>Index</button>
        <button class="tab" class:active={activeTab==='performance'} on:click={() => activeTab='performance'}>Performance</button>
        <button class="tab" class:active={activeTab==='config'} on:click={() => activeTab='config'}>Config</button>
        <button class="tab" class:active={activeTab==='json'} on:click={() => activeTab='json'}>JSON</button>
      </div>

      <!-- Top actions -->
      <div class="actions">
        <div class="refresh-controls">
          <label>Refresh</label>
          <input class="refresh-input input" type="number" min="250" max="10000" bind:value={refreshMs} on:change={() => adjustRefresh(refreshMs)} />
          <span>ms</span>
          <div class="segmented">
            <button class="seg-btn" class:active={refreshMs===250} on:click={() => (refreshMs=250, adjustRefresh(250))}>250</button>
            <button class="seg-btn" class:active={refreshMs===500} on:click={() => (refreshMs=500, adjustRefresh(500))}>500</button>
            <button class="seg-btn" class:active={refreshMs===1000} on:click={() => (refreshMs=1000, adjustRefresh(1000))}>1000</button>
            <button class="seg-btn" class:active={refreshMs===2000} on:click={() => (refreshMs=2000, adjustRefresh(2000))}>2000</button>
          </div>
        </div>
        <div class="spacer"></div>
        <button class="icon" on:click={copyJson} title="Copy JSON">📋</button>
        <button class="icon" on:click={downloadJson} title="Download JSON">⬇️</button>
      </div>

      {#if activeTab === 'overview'}
        <div class="grid">
          <div class="card"><div class="label">Total Events</div><div class="value">{stats.totalEvents ?? '-'}</div></div>
          <div class="card"><div class="label">Memory Usage</div><div class="value">{stats.memoryUsageMB?.toFixed ? stats.memoryUsageMB.toFixed(2) + ' MB' : '-'}</div></div>
          <div class="card"><div class="label">Active Subscribers</div><div class="value">{stats.subscribersCount ?? '-'}</div></div>
          <div class="card"><div class="label">Kinds Indexed</div><div class="value">{stats.kindIndexSize ?? Object.keys(stats.byKind||{}).length}</div></div>
          <div class="card"><div class="label">Authors Indexed</div><div class="value">{stats.authorIndexSize ?? '-'}</div></div>
          <div class="card"><div class="label">Tag Types</div><div class="value">{stats.tagIndexSize ?? '-'}</div></div>
        </div>
      {/if}

      {#if activeTab === 'kinds'}
        <div class="toolbar">
          <input class="filter" placeholder="Filter kind…" bind:value={kindFilter} />
          <div class="segmented">
            <button class="seg-btn" class:active={kindSortKey==='kind'} on:click={() => toggleKindSort('kind')}>Sort Kind {kindSortKey==='kind' ? (kindSortDir==='asc'?'↑':'↓') : ''}</button>
            <button class="seg-btn" class:active={kindSortKey==='count'} on:click={() => toggleKindSort('count')}>Sort Count {kindSortKey==='count' ? (kindSortDir==='asc'?'↑':'↓') : ''}</button>
          </div>
        </div>
        <div class="table">
          <div class="row head"><div>Label</div><div>Kind</div><div>Count</div></div>
          {#each getKindsRows() as row}
            <div class="row kinds"><div>{row.label || '-'}</div><div class="mono">{row.kind}</div><div class="mono">{row.count}</div></div>
          {/each}
          {#if Object.keys(stats.byKind||{}).length === 0}
            <div class="row"><div class="mono">No data</div></div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'index'}
        <div class="grid">
          <div class="card"><div class="label">Kind Index</div><div class="value">{stats.kindIndexSize ?? '-'}</div></div>
          <div class="card"><div class="label">Author Index</div><div class="value">{stats.authorIndexSize ?? '-'}</div></div>
          <div class="card"><div class="label">Tag Index</div><div class="value">{stats.tagIndexSize ?? '-'}</div></div>
        </div>
      {/if}

      {#if activeTab === 'performance'}
        <div class="grid">
          <div class="card"><div class="label">Query Count</div><div class="value">{stats.queryCount ?? '-'}</div></div>
          <div class="card"><div class="label">Avg Query Time</div><div class="value">{stats.avgQueryTime?.toFixed ? stats.avgQueryTime.toFixed(2) + ' ms' : '-'}</div></div>
          <div class="card"><div class="label">Evicted Events</div><div class="value">{stats.evictedCount ?? '-'}</div></div>
        </div>
      {/if}

      {#if activeTab === 'config'}
        <div class="grid">
          <div class="card span-2"><div class="label">Configuration</div><div class="value-small">Max: {stats.maxEvents?.toLocaleString?.() || stats.maxEvents || '-'} events, {stats.maxMemoryMB ?? '-'}MB<br>Policy: {(stats.evictionPolicy || '-').toString().toUpperCase()}<br>Age: {stats.cacheAge ? Math.floor(stats.cacheAge/1000) + 's' : '-'}</div></div>
        </div>
      {/if}

      {#if activeTab === 'json'}
        <div class="json-view"><pre class="json-content">{JSON.stringify(stats, null, 2)}</pre></div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset:0; background: rgba(0,0,0,.5); }
  .modal { position: fixed; top:10%; left:50%; transform: translateX(-50%); width: min(720px, 94vw); max-height: 90vh; background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
  .modal-header { display:flex; align-items:center; justify-content: space-between; padding:.6rem .75rem; border-bottom:1px solid var(--color-border); }
  .modal-body { padding:.75rem; display:flex; flex-direction:column; gap:.75rem; }
  .icon { background: transparent; border:1px solid rgba(255,255,255,.1); border-radius:8px; color:#e2e8f0; cursor:pointer; padding:.25rem .5rem; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap:.5rem; }
  .card { border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:.5rem; background: rgba(255,255,255,.04); }
  .label { color:#94a3b8; font-size:.8rem; }
  .value { font-size:1.1rem; font-weight:600; }
  .list { margin:0; padding-left: 1rem; }

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

  /* Table */
  .toolbar { display:flex; align-items:center; gap:.5rem; }
  .filter { flex:1; padding:.4rem .6rem; border:1px solid var(--color-border); border-radius:8px; background: var(--color-background); color: var(--color-text); }
  .table { display:flex; flex-direction:column; gap:.25rem; border-top:1px solid rgba(255,255,255,.08); padding-top:.5rem; max-height: 48vh; overflow:auto; }
  .row { display:grid; grid-template-columns: 1fr 0.6fr 0.6fr; gap:.5rem; align-items:flex-start; padding:.25rem .25rem; }
  .row.head { position: sticky; top: 0; background: var(--color-surface); z-index: 1; color:#94a3b8; font-weight:600; }
  .table::-webkit-scrollbar { height: 8px; width: 8px; }
  .table::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 9999px; }
  .table::-webkit-scrollbar-track { background: rgba(255,255,255,.06); }
  .mono { font-family: var(--font-mono); }
  .segmented { display:inline-flex; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; background: rgba(255,255,255,0.04); }
  .seg-btn { padding:.35rem .6rem; background: transparent; color: var(--color-text); border: none; cursor: pointer; font-size:.9rem; }
  .seg-btn.active { background: var(--color-primary); color: var(--color-primary-text); }

  /* JSON */
  .json-view { background: var(--color-surface); border:1px solid var(--color-border); border-radius:10px; overflow:hidden; }
  .json-content { padding:.6rem; margin:0; font-family: var(--font-mono); font-size:.85rem; line-height:1.5; color: var(--color-text-muted); max-height: 60vh; overflow:auto; }
</style>


