<script lang="ts">
  import { onMount } from 'svelte';
  import EventThread from '$lib/components/thread/EventThread.svelte';
  import BackHeader from '$lib/components/ui/BackHeader.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  let { params }: { params: { id: string } } = $props();

  let nostr: any = null;
  onMount(async () => { try { const svc: any = await getService('nostr'); nostr = svc.getInstance(); await nostr.connect?.(); } catch {} });
</script>

<div class="thread-page">
  <BackHeader title="Thread" fallbackHref="/explore" sticky />
  {#if nostr}
    <EventThread {nostr} rootId={params.id} showToolbar={false}
      on:back={() => { try { history.back(); } catch {} }}
    />
  {:else}
    <div>Loading…</div>
  {/if}
  
</div>

<style>
  .thread-page { padding: 0.5rem; }
</style>


