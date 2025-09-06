<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getService } from '$lib/services/ServiceContainer.js';
  import NostrTerminal from '$lib/components/terminal/NostrTerminal.svelte';

  let nostr: any = null;
  let ready = false;
  let showRelayInspector = false;

  onMount(async () => {
    const svc: any = await getService('nostr');
    nostr = svc.getInstance();
    try { await nostr.connect?.(); } catch {}
    ready = true;
  });
</script>

{#if ready}
  <NostrTerminal {nostr} {showRelayInspector}
    on:openThread={(e) => { try { const id = e.detail?.id; if (id) goto(`/threads/${id}`); } catch {} }}
    on:profileNavigate={(e) => { try { const pk = e.detail?.pubkey; if (pk) goto(`/profiles/${pk}`); } catch {} }}
  />
{:else}
  <div style="padding:1rem">Loading Explorer…</div>
{/if}


