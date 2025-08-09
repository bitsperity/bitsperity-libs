<script lang="ts">
  import { normalizeRecipientToHex, isValidPubkey } from '../../utils/nostr.js';
  import KeyDisplay from './KeyDisplay.svelte';

  let input = $state('');
  let outputHex = $state<string>('');
  let inputHex = $state<string>('');
  let errorMsg = $state<string>('');

  function convert() {
    const trimmed = (input || '').trim();
    outputHex = '';
    inputHex = '';
    errorMsg = '';

    if (isValidPubkey(trimmed)) {
      // hex → npub (Anzeige über KeyDisplay)
      inputHex = trimmed.toLowerCase();
      return;
    }

    // Fallback auf vorhandenen Normalizer (liefert hex, falls möglich)
    const res = normalizeRecipientToHex(trimmed);
    if (res.ok && res.hex) {
      outputHex = res.hex;
    } else {
      errorMsg = 'Ungültiges Format (npub oder hex erwartet)';
    }
  }

  async function copy(text?: string) {
    try { if (text) await navigator.clipboard.writeText(text); } catch {}
  }
</script>

<div class="enc-panel">
  <div class="row">
    <input class="enc-input" type="text" bind:value={input} placeholder="npub1... oder hex pubkey" onkeydown={(e)=> e.key==='Enter' && convert()} />
    <button class="ghost-btn" onclick={convert}>Convert</button>
  </div>
  {#if outputHex}
    <div class="ok">
      <span class="label">HEX</span>
      <code class="hex">{outputHex}</code>
      <button class="ghost-btn" onclick={() => copy(outputHex)} title="copy hex">📋</button>
    </div>
  {/if}
  {#if inputHex}
    <div class="ok">
      <span class="label">NPUB</span>
      <KeyDisplay hexKey={inputHex} variant="full" copyable={true} />
    </div>
  {/if}
  {#if errorMsg}
    <div class="err">{errorMsg}</div>
  {/if}
</div>

<style>
  .enc-panel { display:flex; flex-direction: column; gap:.5rem; border:1px solid rgba(255,255,255,0.08); border-radius:12px; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); padding:.75rem; }
  .row { display:flex; gap:.5rem; }
  .enc-input { flex:1; padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); font-family: var(--font-mono); }
  .ghost-btn { padding:8px 12px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .ok { display:flex; align-items:center; gap:.5rem; color:#cbd5e1; }
  .ok .label { font-size:.75rem; opacity:.8; }
  .ok .hex { font-family: var(--font-mono); padding:4px 6px; background: rgba(2,6,23,0.35); border:1px solid rgba(255,255,255,0.1); border-radius:8px; }
  .err { color:#fecaca; font-size:.85rem; }
</style>


