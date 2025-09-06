<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte';
  import FeedView from '$lib/components/feed/FeedView.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';

  let nostr: any = null;
  onMount(async () => { try { const svc: any = await getService('nostr'); nostr = svc.getInstance(); await nostr.connect?.(); } catch {} });
</script>

{#if nostr}
  <FeedView {nostr} />
{:else}
  <div style="padding:1rem;">Loading…</div>
{/if}


