<script lang="ts">
  interface RelayResult { relay: string; success: boolean; error?: string }
  export let result: { success: boolean; eventId?: string; error?: string; relayResults?: RelayResult[] } | null = null;
</script>

{#if result}
  <div class="publish-result">
    <div class="result-title">Publish Result</div>
    <div class="result-row {result.success ? 'ok' : 'fail'}">
      {result.success ? '✅' : '❌'} {result.eventId || result.error}
    </div>
    {#if result.relayResults}
      <div class="relay-results">
        {#each result.relayResults as r}
          <div class="relay-row {r.success ? 'ok' : 'fail'}">
            <span class="relay-url">{r.relay}</span>
            <span class="relay-status">{r.success ? 'OK' : 'FAIL'}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .publish-result { margin-top: 0.5rem; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 0.5rem; }
  .result-title { font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem; }
  .relay-results { display: flex; flex-direction: column; gap: 0.25rem; }
  .relay-row { display: flex; justify-content: space-between; font-size: 0.75rem; background: rgba(255,255,255,0.03); padding: 0.25rem 0.5rem; border-radius: 0.375rem; }
  .relay-row.ok { color: #10b981; }
  .relay-row.fail { color: #ef4444; }
</style>


