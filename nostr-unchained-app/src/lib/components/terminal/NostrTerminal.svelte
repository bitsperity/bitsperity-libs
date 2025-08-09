<!--
  Clean Nostr Terminal
  
  Developer-first Nostr explorer powered by DevExplorer
  Simple wrapper that just handles connection status
-->

<script lang="ts">
    // logger not needed here
	import { createEventDispatcher } from 'svelte';
  import DevExplorer from './DevExplorer.svelte';
  import RelayInspector from './RelayInspector.svelte';
  // (no external types needed here)

  let { nostr, showRelayInspector = false }: {
		nostr: any; // NostrUnchained instance
    showRelayInspector?: boolean;
	} = $props();
	
  const dispatch = createEventDispatcher<{
    profileNavigate: { pubkey: string };
    openThread: { id: string };
  }>();

  // logger intentionally removed to avoid unused warnings
</script>

<div class="nostr-terminal">
    <!-- Developer Explorer (handles everything) -->
    <div class="explorer-container">
        <DevExplorer 
            {nostr} 
            on:profileNavigate={(e) => dispatch('profileNavigate', e.detail)}
            on:openThread={(e) => dispatch('openThread', e.detail)}
        />
    {#if showRelayInspector}
      <div class="relay-inspector-wrapper">
        <RelayInspector />
      </div>
    {/if}
    </div>
</div>

<style>
	.nostr-terminal {
		min-height: 100vh;
		background: var(--color-background);
		color: var(--color-text);
		display: flex;
		flex-direction: column;
	}

	/* ===== EXPLORER CONTAINER ===== */
	.explorer-container {
		flex: 1;
		overflow: hidden;
	}


</style>