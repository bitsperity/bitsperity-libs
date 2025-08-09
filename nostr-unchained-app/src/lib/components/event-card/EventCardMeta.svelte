<script lang="ts">
  interface RelayResult { relay: string; success: boolean; error?: string; latencyMs?: number }
  let { result, event, nostr }: { result: { success: boolean; eventId?: string; error?: string; relayResults?: RelayResult[] } | null; event: any; nostr: any } = $props();

  let working = $state(false);
  let localResult: typeof result = $state(null);

  $effect(() => {
    localResult = result;
  });

  function getRows(): RelayResult[] {
    return (localResult?.relayResults || []) as RelayResult[];
  }

  function failedRelays(): string[] {
    return getRows().filter(r => !r.success).map(r => r.relay);
  }

  async function retry(relays?: string[]) {
    if (!nostr || !event) return;
    const targetRelays: string[] | undefined = relays && relays.length > 0 ? relays : undefined;
    working = true;
    try {
      // Try a few well-known shapes conservatively
      let publishResult: any = null;
      if (nostr.events?.republish) {
        publishResult = await nostr.events.republish(event, targetRelays);
      } else if (nostr.events?.publish) {
        publishResult = await nostr.events.publish(event, targetRelays);
      } else if (nostr.publishToRelays) {
        publishResult = await nostr.publishToRelays(event, targetRelays);
      }
      if (publishResult) {
        localResult = publishResult;
      }
    } catch (e) {
      // surface minimal error
      localResult = {
        success: false,
        error: (e as any)?.message || 'Republish failed',
        relayResults: (localResult?.relayResults || []).slice()
      } as any;
    } finally {
      working = false;
    }
  }
  const retryAll = () => retry(failedRelays());
  const retryOne = (relay: string) => retry([relay]);
</script>

{#if localResult}
  <div class="publish-result">
    <div class="result-title">Publish Result</div>
    <div class="result-row {localResult.success ? 'ok' : 'fail'}">
      {localResult.success ? '✅' : '❌'} {localResult.eventId || localResult.error}
    </div>
    {#if localResult.relayResults}
      <div class="relay-results">
        <div class="relay-toolbar">
          <button class="ghost" onclick={retryAll} disabled={working || failedRelays().length === 0} aria-busy={working} title="Retry failed relays">↻ Retry failed</button>
        </div>
        <div class="relay-table">
          {#each getRows() as r}
            <div class="relay-row {r.success ? 'ok' : 'fail'}">
              <span class="relay-url">{r.relay}</span>
              <span class="relay-status">{r.success ? 'OK' : (r.error || 'FAIL')}</span>
              <span class="relay-latency">{r.latencyMs ? `${r.latencyMs}ms` : ''}</span>
              {#if !r.success}
                <button class="ghost small" onclick={() => retryOne(r.relay)} disabled={working} aria-busy={working} title="Retry this relay">↻</button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .publish-result { margin-top: 0.5rem; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 0.5rem; }
  .result-title { font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem; }
  .relay-results { display: flex; flex-direction: column; gap: 0.5rem; }
  .relay-toolbar { display:flex; justify-content:flex-end; }
  .relay-table { display: flex; flex-direction: column; gap: 0.25rem; }
  .relay-row { display: grid; grid-template-columns: 1fr auto auto auto; align-items:center; gap: .5rem; font-size: 0.75rem; background: rgba(255,255,255,0.03); padding: 0.25rem 0.5rem; border-radius: 0.375rem; }
  .relay-row.ok { color: #10b981; }
  .relay-row.fail { color: #ef4444; }
  .relay-url { overflow:hidden; text-overflow: ellipsis; white-space:nowrap; }
  .relay-status { justify-self: end; }
  .relay-latency { color:#94a3b8; font-family: var(--font-mono); }
  .ghost { padding: 4px 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .ghost.small { padding: 2px 8px; }
</style>


