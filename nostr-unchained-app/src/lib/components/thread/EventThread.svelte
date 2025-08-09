<script lang="ts">
  import { onMount } from 'svelte';
  import EventCard from '../terminal/EventCard.svelte';

  let { nostr, rootId }: { nostr: any; rootId: string } = $props();

  let rootEvent: any = $state(null);
  let replies: any[] = $state([]);
  let loading = $state(false);
  // (no handle kept; subscriptions are GC'd with component lifecycle)

  async function load() {
    if (!nostr || !rootId) return;
    loading = true;
    try {
      // Fetch root
      const rootHandle = await nostr.sub().ids([rootId]).limit(1).execute();
      rootHandle.store.subscribe((list: any[]) => {
        rootEvent = (list || [])[0] || null;
      });
      // no-op

      // Subscribe replies (NIP-10: kind 1 with #e rootId)
      const rep = await nostr.sub().kinds([1]).tags('e', [rootId]).limit(1000).execute();
      rep.store.subscribe((list: any[]) => {
        replies = (list || []).slice().sort((a,b) => a.created_at - b.created_at);
        loading = false;
      });
    } catch (e) {
      loading = false;
      console.error('Thread load failed', e);
    }
  }

  onMount(load);
</script>

<div class="thread">
  {#if loading}
    <div class="loading"><div class="spinner"></div> <span>lädt…</span></div>
  {:else}
    {#if rootEvent}
      <EventCard event={rootEvent} {nostr} />
      <div class="replies">
        {#each replies as ev (ev.id)}
          <EventCard event={ev} {nostr} />
        {/each}
      </div>
    {:else}
      <div class="empty">Kein Root‑Event gefunden</div>
    {/if}
  {/if}
</div>

<style>
  .thread { display:flex; flex-direction: column; gap:1rem; padding: 1rem; }
  .replies { display:flex; flex-direction: column; gap:.75rem; padding-left:.5rem; border-left:1px dashed rgba(255,255,255,0.12); }
  .loading { display:flex; align-items:center; gap:.5rem; padding:1rem; color:#cbd5e1; }
  .spinner { width:20px; height:20px; border:2px solid var(--color-border); border-top:2px solid var(--color-primary); border-radius:50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
  .empty { padding: 1rem; color: var(--color-text-muted); }
</style>


