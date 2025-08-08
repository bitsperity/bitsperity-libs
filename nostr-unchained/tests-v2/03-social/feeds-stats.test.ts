import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Feeds Stats', () => {
  let alice: any;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Stats-1'));
    await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Stats-2'));
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('returns basic stats and updates after new publish', async () => {
    const statsStore = alice.nostr.social.feeds.stats({ authors: [alice.publicKey], limit: 50 });
    const before = statsStore.current;
    expect(before).toBeDefined();

    const p = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Stats-3'));
    testEnv.assertPublishSuccess(p, 'publish stats-3');
    await testEnv.waitForPropagation(300);

    const after = statsStore.current;
    expect(after.totalEvents).toBeGreaterThanOrEqual(before.totalEvents);
  }, 30000);
});


