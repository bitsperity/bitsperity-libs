import type { NostrEvent } from '../core/types.js';

export class RelayHealthMonitor {
  constructor(private nostr: any) {}

  async check(relayUrl: string, timeoutMs: number = 3000): Promise<{ relay: string; ok: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      // Light-touch: open a temp connection via RelayManager and immediately close
      await this.nostr.getSubscriptionManager()?.ensureConnection?.(relayUrl, timeoutMs);
      const latency = Date.now() - start;
      return { relay: relayUrl, ok: true, latencyMs: latency };
    } catch (e: any) {
      return { relay: relayUrl, ok: false, error: e?.message || 'connect failed' };
    }
  }

  async bulkCheck(relays: string[], timeoutMs: number = 3000): Promise<Array<{ relay: string; ok: boolean; latencyMs?: number; error?: string }>> {
    return await Promise.all(relays.map(r => this.check(r, timeoutMs)));
  }
}

export class RelayDiscovery {
  constructor(private nostr: any) {}

  /**
   * Discover relays for a user by combining:
   * - NIP-65 relay list (kind 10002)
   * - Recommend relay events (kind 2)
   * Returns a de-duplicated set.
   */
  discoverForUser(pubkey: string): string[] {
    // Ensure subscriptions
    this.nostr.sub().kinds([10002]).authors([pubkey]).execute().catch(() => {});
    this.nostr.sub().kinds([2]).authors([pubkey]).execute().catch(() => {});

    const relays = new Set<string>();

    // Read from cache
    const nip65 = this.nostr.query().kinds([10002]).authors([pubkey]).execute().current as NostrEvent[] | undefined;
    for (const ev of nip65 || []) {
      for (const t of ev.tags) {
        if (t[0] === 'r' && t[1]) relays.add(normalize(t[1]));
      }
    }

    const recommend = this.nostr.query().kinds([2]).authors([pubkey]).execute().current as NostrEvent[] | undefined;
    for (const ev of recommend || []) {
      const url = (ev.content || '').trim();
      if (url) relays.add(normalize(url));
    }

    return Array.from(relays);
  }
}

function normalize(url: string): string {
  let u = url.trim();
  if (!/^wss?:\/\//i.test(u)) u = 'wss://' + u.replace(/^\/*/, '');
  return u.replace(/\/+$/, '');
}


