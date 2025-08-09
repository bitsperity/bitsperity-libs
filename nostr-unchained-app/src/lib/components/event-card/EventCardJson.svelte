<script lang="ts">
  export let event: any;
  let open = false;
  let copied = false;
  let timer: any;
  async function copy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      copied = true; clearTimeout(timer); timer = setTimeout(()=>copied=false, 1200);
    } catch {}
  }
</script>

<div class="json-wrap">
  <div class="bar">
    <button class="ghost" on:click={() => (open = !open)} aria-expanded={open} aria-label={open ? 'Hide JSON' : 'Show JSON'}>
      <svg class="icon {open ? 'rot' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M8 9h8M8 15h8" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 7c0-2 2-3 6-3s6 1 6 3v10c0 2-2 3-6 3s-6-1-6-3V7z" opacity=".35" />
      </svg>
      <span class="label">JSON</span>
    </button>
    {#if open}
      <button class="ghost" on:click={copy} aria-label="Copy JSON">
        <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="9" y="9" width="10" height="10" rx="2"/>
          <rect x="5" y="5" width="10" height="10" rx="2" opacity=".4"/>
        </svg>
        <span class="label">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    {/if}
  </div>
  <div class="panel {open ? 'open' : ''}">
    <pre class="json"><code>{JSON.stringify(event, null, 2)}</code></pre>
  </div>
</div>

<style>
  .json-wrap { margin-top: 0.35rem; }
  .bar { display: flex; align-items: center; gap: 0.25rem; justify-content: flex-end; }
  .ghost { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.5rem; border-radius: 9999px; 
           background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer;
           backdrop-filter: blur(6px); transition: transform .15s ease, background .15s ease, border-color .15s ease; }
  .ghost:hover { transform: translateY(-1px); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
  .icon { transition: transform .2s ease; }
  .icon.rot { transform: rotate(90deg); }
  .label { font-size: 0.72rem; }

  .panel { max-height: 0; overflow: hidden; transition: max-height .25s ease; }
  .panel.open { max-height: 320px; }
  .json { margin-top: 0.35rem; max-height: 280px; overflow: auto; border-radius: 0.6rem; padding: 0.6rem;
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.08); color: #e5e7eb; box-shadow: 0 8px 24px rgba(0,0,0,0.18) inset; }
</style>


