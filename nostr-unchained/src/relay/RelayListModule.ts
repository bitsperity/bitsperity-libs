/**
 * RelayListModule - NIP-65 Relay List Metadata (kind 10002)
 *
 * Provides a clean API to publish and read relay list metadata.
 * - Publish: creates kind 10002 with `r` tags and optional markers 'read'/'write'
 * - Read: reactive store that parses latest kind 10002 from an author
 */

import type { UniversalNostrStore } from '../store/UniversalNostrStore.js';
import type { NostrEvent } from '../core/types.js';

export interface RelayListEntry {
  url: string;
  mode: 'read' | 'write' | 'both';
}

export interface RelayList {
  author: string;
  entries: RelayListEntry[];
  read: string[];
  write: string[];
  both: string[];
  updatedAt: number | null;
}

export class RelayListBuilder {
  private list: RelayListEntry[] = [];
  constructor(private nostr: any) {}

  read(url: string): RelayListBuilder {
    this.list.push({ url, mode: 'read' });
    return this;
  }

  write(url: string): RelayListBuilder {
    this.list.push({ url, mode: 'write' });
    return this;
  }

  both(url: string): RelayListBuilder {
    this.list.push({ url, mode: 'both' });
    return this;
  }

  urls(urls: string[], mode: 'read' | 'write' | 'both' = 'both'): RelayListBuilder {
    urls.forEach((u) => this.list.push({ url: u, mode }));
    return this;
  }

  async publish(): Promise<any> {
    // Build kind 10002 with r tags
    const builder = this.nostr.events.kind(10002).content('');
    for (const entry of this.list) {
      if (entry.mode === 'read') builder.tag('r', entry.url, 'read');
      else if (entry.mode === 'write') builder.tag('r', entry.url, 'write');
      else builder.tag('r', entry.url);
    }
    return builder.publish();
  }
}

export class RelayListModule {
  constructor(private nostr: any, private debug?: boolean) {}

  /** Create a fluent builder for publishing a NIP-65 relay list */
  edit(): RelayListBuilder {
    return new RelayListBuilder(this.nostr);
  }

  /** Get reactive relay list for an author (kind 10002) */
  get(pubkey: string): UniversalNostrStore<RelayList> {
    // Ensure subscription so cache fills (subscription-first)
    this.nostr
      .sub()
      .kinds([10002])
      .authors([pubkey])
      .limit(1)
      .execute()
      .catch(() => {});

    const store = this.nostr
      .query()
      .kinds([10002])
      .authors([pubkey])
      .limit(1)
      .execute()
      .map((events: NostrEvent[]) => this.parseRelayList(pubkey, events));

    return store as unknown as UniversalNostrStore<RelayList>;
  }

  private parseRelayList(author: string, events: NostrEvent[]): RelayList {
    const latest = Array.isArray(events) && events.length > 0 ? events[0] : null;
    const entries: RelayListEntry[] = [];
    if (latest && Array.isArray(latest.tags)) {
      for (const tag of latest.tags) {
        if (!Array.isArray(tag) || tag[0] !== 'r') continue;
        const url = tag[1] || '';
        const marker = (tag[2] || '').toLowerCase();
        const mode: 'read' | 'write' | 'both' = marker === 'read' ? 'read' : marker === 'write' ? 'write' : 'both';
        if (url) entries.push({ url, mode });
      }
    }
    const read = entries.filter(e => e.mode === 'read').map(e => e.url);
    const write = entries.filter(e => e.mode === 'write').map(e => e.url);
    const both = entries.filter(e => e.mode === 'both').map(e => e.url);
    return {
      author,
      entries,
      read,
      write,
      both,
      updatedAt: latest ? latest.created_at : null
    };
  }
}


