import { describe, it, expect } from 'vitest';
import { UniversalEventCache } from '../../src/cache/UniversalEventCache.js';

const baseEvent = (suffix: string) => ({
  id: `event-${suffix}`,
  pubkey: `pubkey-${suffix}`,
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [] as string[][],
  content: `content-${suffix}`,
  sig: `sig-${suffix}`
});

const createEvent = (
  suffix: string,
  overrides: Partial<ReturnType<typeof baseEvent>> = {}
) => ({
  ...baseEvent(suffix),
  ...overrides
});

describe('UniversalEventCache – capacity & filtering', () => {
  it('evicts least recently used events when maxEvents is exceeded', async () => {
    const cache = new UniversalEventCache('', {
      maxEvents: 3,
      maxMemoryMB: 50,
      evictionPolicy: 'lru'
    });

    await cache.addEvent(createEvent('a'));
    await cache.addEvent(createEvent('b'));
    await cache.addEvent(createEvent('c'));

    // Touch event-a so it becomes most recently used
    const [eventA] = cache.query({ ids: ['event-a'] });
    expect(eventA?.id).toBe('event-a');

    await cache.addEvent(createEvent('d'));

    const stats = cache.getStatistics();
    expect(stats.totalEvents).toBe(3);
    expect(stats.evictedCount).toBeGreaterThanOrEqual(1);

    // b should have been evicted (oldest & not recently accessed)
    expect(cache.query({ ids: ['event-b'] })).toHaveLength(0);
    expect(cache.query({ ids: ['event-a'] })).toHaveLength(1);
    expect(cache.query({ ids: ['event-d'] })).toHaveLength(1);
  });

  it('combines kind and tag filters correctly', async () => {
    const cache = new UniversalEventCache('', { maxEvents: 10, maxMemoryMB: 50 });

    await cache.addEvent(createEvent('1', { kind: 4, tags: [['p', 'alice']] }));
    await cache.addEvent(createEvent('2', { kind: 14, tags: [['p', 'bob']] }));
    await cache.addEvent(createEvent('3', { kind: 14, tags: [['p', 'alice']] }));
    await cache.addEvent(createEvent('4', { kind: 1059, tags: [['p', 'alice']] }));

    const matching = cache.query({
      kinds: [14],
      '#p': ['alice']
    });

    expect(matching).toHaveLength(1);
    expect(matching[0].id).toBe('event-3');
  });
});

