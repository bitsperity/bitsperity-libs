<script lang="ts">
  import { onMount } from 'svelte';
  import NostrTerminal from '$lib/components/terminal/NostrTerminal.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';

  let nostr: any = null;
  let showRelayInspector = false;
  onMount(async () => { try { const svc: any = await getService('nostr'); nostr = svc.getInstance(); await nostr.connect?.(); } catch {} });
</script>

<div class="terminal-page">
  {#if nostr}
    <NostrTerminal {nostr} {showRelayInspector} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>

<style>
  .terminal-page { padding: 0.5rem; }
</style>


