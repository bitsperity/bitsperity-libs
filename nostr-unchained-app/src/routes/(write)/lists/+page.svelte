<script lang="ts">
  import { onMount } from 'svelte';
  import ListsView from '$lib/components/lists/ListsView.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';

  let nostr: any = null;
  onMount(async () => { try { const svc: any = await getService('nostr'); nostr = svc.getInstance(); await nostr.connect?.(); } catch {} });
</script>

<div class="lists-page">
  {#if nostr}
    <ListsView {nostr} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>

<style>
  .lists-page { padding: 0.5rem; }
</style>


