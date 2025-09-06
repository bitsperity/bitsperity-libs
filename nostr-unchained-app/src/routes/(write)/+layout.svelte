<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  let hasSigner = false;
  onMount(async () => {
    try {
      const svc: any = await getService('nostr');
      hasSigner = !!svc?.hasSigner?.();
    } catch { hasSigner = false; }
  });
</script>

<slot />
{#if !hasSigner}
  <div class="write-hint">Schreibfunktionen sind deaktiviert. Bitte <a href="/signin?rt=">anmelden</a>, um fortzufahren.</div>
{/if}

<style>
  .write-hint { margin:.75rem; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:.5rem 1rem; border-radius:8px; }
  .write-hint a { color:#7dd3fc; }
</style>


