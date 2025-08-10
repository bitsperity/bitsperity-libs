import { describe, expect, test } from 'vitest';
import { UniversalEventCache } from '../../src/cache/UniversalEventCache.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';
import type { NostrEvent } from '../../src/core/types.js';

describe('NIP-50: search() filter (local cache support)', () => {
  test('cache.query({ search }) performs case-insensitive substring match on content', async () => {
    const cache = new UniversalEventCache(undefined);

    const makeEvent = (content: string): NostrEvent => {
      const unsigned = {
        pubkey: 'f'.repeat(64),
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [] as string[][],
        content
      } as any;
      const id = EventBuilder.calculateEventId(unsigned as any);
      return { ...(unsigned as any), id, sig: '' } as NostrEvent;
    };

    const e1 = makeEvent('Hello Nostr world');
    const e2 = makeEvent('searchable content here');
    const e3 = makeEvent('Nothing relevant');

    await cache.addEvent(e1);
    await cache.addEvent(e2);
    await cache.addEvent(e3);

    const results = cache.query({ kinds: [1], search: 'content', limit: 100 });
    expect(results.some(e => e.content.includes('searchable content here'))).toBe(true);
    expect(results.some(e => e.content.includes('Hello Nostr world'))).toBe(false);
  });
});


