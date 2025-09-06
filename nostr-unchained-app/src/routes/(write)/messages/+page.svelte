<script lang="ts">
  import { onMount } from 'svelte';
  import DMChat from '$lib/components/terminal/DMChat.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';

  let nostr: any = null;
  let authState: any = { publicKey: '', isAuthenticated: false, signerType: 'extension', user: null, signingMethod: 'extension' };

  onMount(async () => {
    try {
      const svc: any = await getService('nostr');
      nostr = svc.getInstance();
      await nostr.connect?.();
      try { const pk = await nostr.getPublicKey?.(); if (pk) { authState.publicKey = pk; authState.isAuthenticated = true; } } catch {}
    } catch {}

    // Optional: auto-open conversation if ?with=<pubkey|npub>
    try {
      const p = new URLSearchParams(location.search);
      const withParam = p.get('with');
      if (withParam && nostr && authState.publicKey) {
        // normalize to hex pubkey
        let target = withParam.trim();
        if (target.startsWith('npub')) {
          try { target = nostr.utils?.npubToHex?.(target) || target; } catch {}
        }
        // Dispatch custom event to DMChat root to open conversation
        setTimeout(() => {
          try {
            const el = document.querySelector('.dm-chat');
            if (el) el.dispatchEvent(new CustomEvent('openConversation', { detail: { pubkey: target } }));
          } catch {}
        }, 50);
      }
    } catch {}
  });
</script>

<div class="messages-page">
  {#if nostr}
    <DMChat {nostr} {authState} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>

<style>
  .messages-page { padding: 0.5rem; }
</style>


