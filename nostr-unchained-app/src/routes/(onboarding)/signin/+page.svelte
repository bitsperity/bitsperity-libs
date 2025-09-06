<script lang="ts">
  import { getService } from '$lib/services/ServiceContainer.js';

  let isInitializing = false;
  let error: string | null = null;

  async function choose(type: 'extension' | 'temporary') {
    isInitializing = true; error = null;
    try {
      const svc: any = await getService('nostr');
      if (type === 'extension') {
        const res = await svc.useExtensionSigner();
        if (!res?.success) throw new Error(res?.error?.message || 'Extension Signer fehlgeschlagen');
        try {
          document.cookie = `signer_selected=extension; Path=/; SameSite=Lax`;
          sessionStorage.setItem('selected_signer', 'extension');
          sessionStorage.removeItem('temp_signer_active');
        } catch {}
      } else {
        const res = await svc.createTemporaryAccount();
        if (!res?.success) throw new Error(res?.error?.message || 'Temporary Signer fehlgeschlagen');
        try {
          document.cookie = `signer_selected=temporary; Path=/; SameSite=Lax`;
          document.cookie = 'temp_signer_active=true; Path=/; SameSite=Lax';
          sessionStorage.setItem('selected_signer', 'temporary');
          sessionStorage.setItem('temp_signer_active', 'true');
        } catch {}
      }
      try { localStorage.setItem('auth_changed', String(Date.now())); } catch {}
      const params = new URLSearchParams(location.search);
      const rt = params.get('rt') || '/';
      location.replace(rt);
    } catch (e: any) {
      error = e?.message || 'Failed to initialize signer';
    } finally {
      isInitializing = false;
    }
  }
</script>

<main class="signin">
  <h1>Anmelden, um zu schreiben</h1>
  <p>Die App ist im Read‑Only‑Modus gestartet. Wähle eine Signiermethode, um Schreibfunktionen zu aktivieren.</p>

  <div class="options">
    <button class="opt" disabled={isInitializing} onclick={() => choose('extension')}>
      🔌 Browser‑Extension
      <span>Alby / nos2x</span>
    </button>
    <button class="opt" disabled={isInitializing} onclick={() => choose('temporary')}>
      ⚡ Temporärkonto
      <span>Ephemere Schlüssel (Test)</span>
    </button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}
</main>

<style>
  .signin { min-height: 60vh; display:flex; flex-direction:column; align-items:center; gap:1rem; padding:2rem; text-align:center; }
  .options { display:flex; gap:1rem; flex-wrap:wrap; justify-content:center; }
  .opt { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem 1.25rem; color: var(--color-text); cursor:pointer; min-width: 220px; display:flex; flex-direction:column; gap:.25rem; }
  .opt span { color: var(--color-text-muted); font-size:.9rem; }
  .error { color: var(--color-danger); }
</style>


