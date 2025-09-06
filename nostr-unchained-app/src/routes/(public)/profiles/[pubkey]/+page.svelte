<script lang="ts">
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import ProfileView from '$lib/components/profile/ProfileView.svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import BackHeader from '$lib/components/ui/BackHeader.svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/AuthStore.js';
  export let params: { pubkey: string };

  let nostr: any = null;
  // Effective auth view state (merges AuthStore and signer fallback)
  let authState: any = { publicKey: '', isAuthenticated: false, signerType: null, user: null, signingMethod: null };
  let unsubAuth: (() => void) | null = null;

  onMount(async () => {
    try {
      const svc: any = await getService('nostr');
      nostr = svc.getInstance();
      try { await nostr.connect?.(); } catch {}
      // Subscribe to global auth store for reactive state
      try {
        unsubAuth = (authStore as any).subscribe((s: any) => {
          if (s && typeof s === 'object') {
            authState = {
              publicKey: s.publicKey || authState.publicKey || '',
              isAuthenticated: !!s.isAuthenticated,
              signerType: s.method || authState.signerType || null,
              user: s.profile || null,
              signingMethod: s.method || authState.signingMethod || null
            };
          }
        });
      } catch {}
      // Fallback: if store not authenticated but signer is present, resolve pk
      if (!authState.isAuthenticated) {
        try {
          const pk = await nostr.getPublicKey?.();
          if (pk) {
            authState.publicKey = pk;
            authState.isAuthenticated = true;
          }
        } catch {}
      }
    } catch {}
  });

  // Cleanup
  onDestroy(() => { try { unsubAuth && unsubAuth(); } catch {} });
</script>

<div class="profile-page">
  <BackHeader title="Profile" fallbackHref="/explore" sticky />
  {#if nostr}
    <ProfileView {nostr} {authState} pubkey={params.pubkey} onDMClick={(pk) => { try { goto(`/messages?with=${pk}`); } catch { location.assign(`/messages?with=${pk}`); } }} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>

<style>
  .profile-page { padding: 1rem; }
  /* Header styles moved to BackHeader */
</style>


