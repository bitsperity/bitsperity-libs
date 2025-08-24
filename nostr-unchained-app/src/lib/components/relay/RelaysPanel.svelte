<script lang="ts">
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import type { NostrService } from '$lib/services/NostrService.js';
  
  let nostrService: NostrService | null = null;
  let relays: string[] = $state([]);
  let newRelay = $state('');
  let routing: 'none' | 'nip65' = $state('none');
  let publishing = $state(false);
  let connecting = $state(false);
  let message: string | null = $state(null);
  let signerMethod: string | null = $state(null);
  let connectedRelays: string[] = $state([]);
  let health: Record<string, { ok: boolean; latencyMs?: number }> = $state({});
  let refreshHandle: any = null;
  let autoAppliedFromNip65 = false;

  onMount(async () => {
    nostrService = await getService<NostrService>('nostr');
    // Initial: Service‑Quelle, danach sofort NIP‑65 übernehmen
    relays = nostrService.getConfiguredRelays();
    try { await (nostrService as any).connect?.(); } catch {}
    try {
      const savedRouting = localStorage.getItem('nostr_routing') as 'none' | 'nip65' | null;
      routing = savedRouting === 'nip65' ? 'nip65' : (nostrService as any).getRoutingMode?.() || 'none';
    } catch {
      routing = (nostrService as any).getRoutingMode?.() || 'none';
    }
    refreshStatus();
    refreshHandle = setInterval(refreshStatus, 1500);

    // Immer NIP‑65 lesen und beim ersten Wert übernehmen (kein LocalStorage mehr)
    try {
      if ((nostrService as any)?.getInstance) {
        const nostr = (nostrService as any).getInstance();
        const info = nostr.getSigningInfo?.();
        const pubkey = info?.pubkey;
        if (pubkey) {
          const listStore = nostr.relayList.get(pubkey);
          const unsub = listStore.subscribe((list: any) => {
            const raw = Array.from(new Set([...(list?.both||[]), ...(list?.read||[]), ...(list?.write||[])]));
            if (!raw || raw.length === 0) return;
            const preferLocalScheme = (u: string) => {
              try {
                const m = u.match(/^wss?:\/\/(.*)$/i);
                const host = (m ? m[1] : u).replace(/\/$/, '');
                const isLocal = /(^localhost(?::\d+)?$)|(^127\.0\.0\.1(?::\d+)?$)|((?:^|\.)local(?::\d+)?$)/i.test(host);
                return (isLocal ? `ws://${host}` : (/^wss?:\/\//i.test(u) ? u : `wss://${host}`)).replace(/\/$/, '');
              } catch { return u; }
            };
            const normalized = raw.map(preferLocalScheme);
            const unique = Array.from(new Set(normalized));
            relays = unique;
            // Optional: auto-apply einmalig beim ersten Abruf
            if (!autoAppliedFromNip65 && nostrService && Array.isArray(unique) && unique.length > 0) {
              autoAppliedFromNip65 = true;
              (async () => { try { await (nostrService as any).setRelays(unique); refreshStatus(); } catch {} })();
            }
            try { unsub && unsub(); } catch {}
          });
        }
      }
    } catch {}
  });
  
  $effect(() => () => { try { if (refreshHandle) clearInterval(refreshHandle); } catch {} });

  function refreshStatus() {
    try {
      const info = (nostrService as any)?.getSigningInfo?.();
      const method = info?.method as string | undefined;
      signerMethod = method && method !== 'unknown' ? method : null;
      connectedRelays = (nostrService as any)?.getConnectedRelays?.() || [];
    } catch {}
  }

  function normalize(url: string): string | null {
    const u = url.trim();
    if (!u) return null;
    if (!/^wss?:\/\//i.test(u)) return `wss://${u}`;
    return u.replace(/\/$/, '');
  }

  async function addRelay() {
    const n = normalize(newRelay);
    if (!n) return;
    if (!relays.includes(n)) relays = [...relays, n];
    newRelay = '';
    // no local storage persistence
  }

  function removeRelay(url: string) {
    relays = relays.filter(r => r !== url);
    // no local storage persistence
  }

  async function applyRelays() {
    if (!nostrService) return;
    if (relays.length === 0) { message = '⚠️ Mindestens ein Relay erforderlich'; return; }
    connecting = true;
    message = null;
    try {
      await (nostrService as any).setRelays(relays);
      // no local storage persistence
      message = '✅ Relays übernommen und neu verbunden';
    } catch (e: any) {
      message = `❌ Fehler beim Anwenden: ${e?.message || e}`;
    } finally {
      connecting = false;
      refreshStatus();
    }
  }

  async function checkHealth() {
    if (!nostrService) return;
    try {
      const results = await (nostrService as any).bulkCheckRelayHealth?.(relays, 2000);
      const map: Record<string, { ok: boolean; latencyMs?: number }> = {};
      for (const r of results || []) {
        map[r.relay] = { ok: !!r.ok, latencyMs: r.latencyMs };
      }
      health = map;
    } catch {}
  }

  async function toggleRouting() {
    if (!nostrService) return;
    connecting = true;
    message = null;
    try {
      const next = routing === 'none' ? 'nip65' : 'none';
      await (nostrService as any).setRoutingMode(next);
      routing = next;
      message = `✅ Routing auf ${next} gesetzt`;
    } catch (e: any) {
      message = `❌ Fehler beim Setzen des Routings: ${e?.message || e}`;
    } finally {
      connecting = false;
      refreshStatus();
    }
  }

  async function publishRelayList() {
    if (!nostrService) return;
    const info = (nostrService as any)?.getSigningInfo?.();
    if (!info?.method) { message = '⚠️ Zum Veröffentlichen wird ein Signer benötigt (z. B. Extension)'; return; }
    publishing = true;
    message = null;
    try {
      const res = await (nostrService as any).publishRelayList({ both: relays });
      message = res?.success ? `✅ Relay‑Liste veröffentlicht: ${res.eventId?.slice(0,8)}…` : '⚠️ Veröffentlichung unklar';
    } catch (e: any) {
      const err = e?.message || String(e);
      // Fallback: falls Lib fälschlich Content verlangt, erzwingen wir content('')
      if (err.includes('Content is required')) {
        try {
          const nostr: any = (nostrService as any)?.getInstance?.();
          if (nostr?.events) {
            const builder = nostr.events.kind(10002).content('');
            for (const url of relays) builder.tag('r', url);
            const alt = await builder.publish();
            message = alt?.success ? `✅ Relay‑Liste veröffentlicht: ${alt.eventId?.slice(0,8)}…` : `⚠️ Veröffentlichung unklar`;
            return;
          }
        } catch (ee: any) {
          message = `❌ Fehler beim Veröffentlichen (Fallback): ${ee?.message || err}`;
          return;
        }
      }
      message = `❌ Fehler beim Veröffentlichen: ${err}`;
    } finally {
      publishing = false;
    }
  }
</script>

<div class="relays-panel">
  <header class="panel-header">
    <h2>Relays & Routing</h2>
    <div class="actions">
      <span class="status">{connectedRelays.length > 0 ? `🟢 ${connectedRelays.length} connected` : '🔴 disconnected'}</span>
      <span class="status">Signer: {signerMethod ?? 'none'}</span>
      <button class="ghost" onclick={toggleRouting} disabled={connecting}>
        {routing === 'nip65' ? 'Disable NIP‑65 routing' : 'Enable NIP‑65 routing'}
      </button>
      <button class="ghost" onclick={applyRelays} disabled={connecting}>
        {connecting ? 'Reconnecting…' : 'Apply & Reconnect'}
      </button>
      <button class="ghost" onclick={checkHealth}>
        Check Health
      </button>
      <button class="primary" onclick={publishRelayList} disabled={publishing}>
        {publishing ? 'Publishing…' : 'Publish Relay List (NIP‑65)'}
      </button>
    </div>
  </header>

  <section class="relay-editor">
    <label for="relay-input">Add relay</label>
    <div class="row">
      <input id="relay-input" placeholder="wss://example.com" bind:value={newRelay} onkeydown={(e)=> e.key==='Enter' && addRelay()} />
      <button class="ghost" onclick={addRelay}>Add</button>
    </div>
    <ul class="relay-list">
      {#each relays as url}
        <li>
          <div class="relay-row">
            <code>{url}</code>
            {#if health[url]}
              <span class="health" class:ok={health[url].ok} class:fail={!health[url].ok}>
                {health[url].ok ? `OK ${health[url].latencyMs ?? '-'}ms` : 'Fail'}
              </span>
            {/if}
          </div>
          <button class="danger" onclick={() => removeRelay(url)}>Remove</button>
        </li>
      {/each}
      {#if relays.length === 0}
        <li class="empty">No relays configured</li>
      {/if}
    </ul>
  </section>

  {#if message}
    <div class="message">{message}</div>
  {/if}
</div>

<style>
  .relays-panel { display:flex; flex-direction: column; gap:1rem; padding:1rem; }
  .panel-header { display:flex; align-items:center; justify-content: space-between; }
  .actions { display:flex; gap:.5rem; }
  .ghost { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .primary { padding:6px 10px; border:1px solid rgba(99,102,241,0.35); border-radius:10px; background: rgba(99,102,241,0.2); color:#e2e8f0; cursor:pointer; }
  .danger { padding:4px 8px; border:1px solid rgba(239,68,68,0.45); border-radius:8px; background: rgba(239,68,68,0.15); color:#fecaca; cursor:pointer; }
  .relay-editor { display:flex; flex-direction: column; gap:.5rem; }
  .row { display:flex; gap:.5rem; align-items:center; }
  input { flex:1; padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); font-family: var(--font-mono); }
  .relay-list { list-style:none; padding:0; margin:.5rem 0 0; display:flex; flex-direction: column; gap:.5rem; }
  .relay-list li { display:flex; align-items:center; justify-content: space-between; gap:.5rem; padding:.5rem .75rem; border:1px solid rgba(255,255,255,0.08); border-radius:10px; }
  .relay-row { display:flex; align-items:center; gap:.5rem; }
  .health { font-family: var(--font-mono); font-size: .85em; padding:2px 6px; border-radius: 8px; }
  .health.ok { background: rgba(34,197,94,.15); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
  .health.fail { background: rgba(239,68,68,.15); color:#fecaca; border:1px solid rgba(239,68,68,.35); }
  .relay-list .empty { opacity:.7; font-style: italic; }
  .message { margin-top: .5rem; padding:.5rem .75rem; border:1px solid rgba(255,255,255,0.12); border-radius:10px; background: rgba(255,255,255,0.06); }
</style>


