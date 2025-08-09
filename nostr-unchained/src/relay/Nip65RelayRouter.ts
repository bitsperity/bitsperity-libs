import type { NostrEvent } from '../core/types.js';
import type { RelayListModule } from './RelayListModule.js';

export interface RelayRoutingContext {
  authorPubkey: string;
  mentionedPubkeys: string[];
}

export interface RelayRoutingStrategy {
  selectRelays(event: NostrEvent, defaultRelays: string[], ctx: RelayRoutingContext): Promise<string[]>;
}

/**
 * NIP-65 compliant routing strategy (opt-in):
 * - Publish to author's write relays (or both)
 * - Additionally publish to each mentioned user's read relays
 * - Fallback to default relays if lists are missing
 */
export class Nip65RelayRouter implements RelayRoutingStrategy {
  constructor(private relayList: RelayListModule, private normalizeUrl: (u: string) => string = (u) => u) {}

  async selectRelays(event: NostrEvent, defaultRelays: string[], ctx: RelayRoutingContext): Promise<string[]> {
    try {
      const targets = new Set<string>();

      // Author relay list
      await this.ensureLoaded(ctx.authorPubkey);
      const authorRL = this.relayList.get(ctx.authorPubkey).current;
      if (authorRL && authorRL.entries.length > 0) {
        // Write + both
        for (const url of [...authorRL.write, ...authorRL.both]) {
          targets.add(this.normalizeUrl(url));
        }
      }

      // Mentioned users read relays
      for (const mp of ctx.mentionedPubkeys || []) {
        await this.ensureLoaded(mp);
        const rl = this.relayList.get(mp).current;
        if (rl && rl.entries.length > 0) {
          for (const url of [...rl.read, ...rl.both]) {
            targets.add(this.normalizeUrl(url));
          }
        }
      }

      // Always include default relays to ensure connectivity
      for (const u of defaultRelays) targets.add(this.normalizeUrl(u));
      return Array.from(targets);
    } catch {
      return defaultRelays;
    }
  }

  private async ensureLoaded(pubkey: string): Promise<void> {
    try {
      // Trigger subscription + cache fill
      this.relayList.get(pubkey);
      // Minimal wait to allow subscription to fetch latest replaceable event
      await new Promise((r) => setTimeout(r, 200));
    } catch {}
  }
}


