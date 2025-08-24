<script lang="ts">
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import type { NostrService } from '$lib/services/NostrService.js';
  import EventCard from '../terminal/EventCard.svelte';

  let { nostr }: any = $props();
  let nostrService: NostrService | null = null;
  let loading = $state(true);
  let items: string[] = $state([]);
  let events: any[] = $state([]);

  async function load() {
    nostrService = await getService<NostrService>('nostr');
    const snap = await nostrService.syncBookmarks();
    items = snap.items || [];

    // Ensure the events are in cache; subscribe by ids
    if (items.length > 0) {
      try {
        const sub = nostr.sub().ids(items).limit(items.length);
        await sub.execute();
      } catch {}
      try {
        const q = nostr.query().ids(items).limit(items.length).execute();
        const unsub = q.subscribe((evs: any[]) => { events = evs || []; });
      } catch {}
    } else {
      events = [];
    }
    loading = false;
  }

  onMount(load);
</script>

<div class="bookmarks-view">
  <h2>🔖 Bookmarks</h2>
  {#if loading}
    <div class="loading">Lade…</div>
  {:else if events.length === 0}
    <div class="empty">Keine Bookmarks</div>
  {:else}
    <div class="list">
      {#each events as ev (ev.id)}
        <EventCard event={ev} {nostr} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .bookmarks-view { display:flex; flex-direction: column; gap: .75rem; padding: 1rem; }
  .list { display:flex; flex-direction: column; gap:.75rem; }
  .loading, .empty { color:#94a3b8; font-style: italic; padding:.5rem 0; }
</style>
