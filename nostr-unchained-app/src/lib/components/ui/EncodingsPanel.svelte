<script lang="ts">
  import { normalizeRecipientToHex } from '../../utils/nostr.js';
  import KeyDisplay from './KeyDisplay.svelte';

  let input = $state('');
  let result: { ok: boolean; hex?: string; source?: string; errorCode?: string } = $state({ ok: false });

  function convert() {
    result = normalizeRecipientToHex(input);
  }
</script>

<div class="enc-panel">
  <div class="row">
    <input class="enc-input" type="text" bind:value={input} placeholder="npub1... oder hex pubkey" onkeydown={(e)=> e.key==='Enter' && convert()} />
    <button class="ghost-btn" onclick={convert}>Convert</button>
  </div>
  {#if result.ok}
    <div class="ok">
      <span class="label">HEX</span>
      <KeyDisplay hexKey={result.hex || ''} variant="compact" copyable={true} />
      <span class="hint">source: {result.source}</span>
    </div>
  {:else if result.errorCode}
    <div class="err">Ungültiges Format</div>
  {/if}
</div>

<style>
  .enc-panel { display:flex; flex-direction: column; gap:.5rem; border:1px solid rgba(255,255,255,0.08); border-radius:12px; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); padding:.75rem; }
  .row { display:flex; gap:.5rem; }
  .enc-input { flex:1; padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); font-family: var(--font-mono); }
  .ghost-btn { padding:8px 12px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .ok { display:flex; align-items:center; gap:.5rem; color:#cbd5e1; }
  .ok .label { font-size:.75rem; opacity:.8; }
  .ok .hint { font-size:.75rem; opacity:.6; }
  .err { color:#fecaca; font-size:.85rem; }
</style>


