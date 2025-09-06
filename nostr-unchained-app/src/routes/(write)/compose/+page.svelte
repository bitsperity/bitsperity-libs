<script lang="ts">
  import { onMount } from 'svelte';
  import PublishCard from '$lib/components/terminal/PublishCard.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';

  let nostr: any = null;
  onMount(async () => { try { const svc: any = await getService('nostr'); nostr = svc.getInstance(); await nostr.connect?.(); } catch {} });
</script>

<div class="compose-page">
  {#if nostr}
    <PublishCard {nostr} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>

<style>
  .compose-page { padding: 1rem; display:flex; justify-content:center; }
</style>


