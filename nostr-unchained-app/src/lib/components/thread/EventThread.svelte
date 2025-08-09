<script lang="ts">
  import { onMount } from 'svelte';
  import EventCard from '../terminal/EventCard.svelte';
  import { createEventDispatcher } from 'svelte';

  let { nostr, rootId }: { nostr: any; rootId: string } = $props();

  let rootEvent: any = $state(null);
  let replies: any[] = $state([]);
  let loading = $state(false);
  // Cleanup management for re-navigation
  let cleanupFns: Array<() => void> = [];
  const dispatch = createEventDispatcher<{ back: {}; openThread: { id: string } }>();

  function cleanup() {
    for (const fn of cleanupFns.splice(0)) {
      try { fn(); } catch {}
    }
  }

  async function load() {
    if (!nostr || !rootId) return;
    loading = true;
    cleanup();
    try {
      // Fetch root
      const rootHandle = await nostr.sub().ids([rootId]).limit(1).execute();
      const unsubRoot = rootHandle.store.subscribe((list: any[]) => {
        rootEvent = (list || [])[0] || null;
      });
      cleanupFns.push(() => { try { unsubRoot?.(); } catch {} });
      cleanupFns.push(() => { try { rootHandle.stop?.(); } catch {} });

      // Subscribe replies (NIP-10: kind 1 with #e rootId)
      const rep = await nostr.sub().kinds([1]).tags('e', [rootId]).limit(1000).execute();
      const unsubRep = rep.store.subscribe((list: any[]) => {
        replies = (list || []).slice().sort((a,b) => a.created_at - b.created_at);
        loading = false;
      });
      cleanupFns.push(() => { try { unsubRep?.(); } catch {} });
      cleanupFns.push(() => { try { rep.stop?.(); } catch {} });
    } catch (e) {
      loading = false;
      console.error('Thread load failed', e);
    }
  }

  onMount(load);

  function openThreadLocal(id: string) {
    if (!id) return;
    dispatch('openThread', { id });
  }

  // Reload when parent updates the rootId (navigating deeper)
  $effect(() => {
    if (nostr && rootId) {
      load();
    }
  });
</script>

<div class="thread">
  <div class="thread-toolbar">
    <button class="ghost-btn" onclick={() => dispatch('back', {})} title="Zurück">← Back</button>
    {#if rootEvent}
      <div class="toolbar-title">Thread · {rootEvent.id.slice(0,8)}…</div>
    {/if}
  </div>
  {#if loading}
    <div class="loading"><div class="spinner"></div> <span>lädt…</span></div>
  {:else}
    {#if rootEvent}
      <EventCard event={rootEvent} {nostr} on:openThread={(e)=>openThreadLocal(e.detail.id)} />
      <div class="replies">
        {#each replies as ev (ev.id)}
          <EventCard event={ev} {nostr} on:openThread={(e)=>openThreadLocal(e.detail.id)} />
        {/each}
      </div>
    {:else}
      <div class="empty">Kein Root‑Event gefunden</div>
    {/if}
  {/if}
</div>

<style>
  .thread { display:flex; flex-direction: column; gap:1rem; padding: 1rem; }
  .thread-toolbar { display:flex; justify-content:space-between; align-items:center; }
  .toolbar-title { font-family: var(--font-mono); color:#94a3b8; font-size:.85rem; }
  .ghost-btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .replies { display:flex; flex-direction: column; gap:.75rem; padding-left:.5rem; border-left:1px dashed rgba(255,255,255,0.12); }
  .loading { display:flex; align-items:center; gap:.5rem; padding:1rem; color:#cbd5e1; }
  .spinner { width:20px; height:20px; border:2px solid var(--color-border); border-top:2px solid var(--color-primary); border-radius:50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
  .empty { padding: 1rem; color: var(--color-text-muted); }
</style>


