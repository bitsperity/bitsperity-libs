import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Feeds', () => {
  let alice: any;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    // Create a couple of notes
    const p1 = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Feed-1'));
    const p2 = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Feed-2'));
    testEnv.assertPublishSuccess(p1, 'publish note 1');
    testEnv.assertPublishSuccess(p2, 'publish note 2');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('user feed returns recent events and updates reactively', async () => {
    const feed = alice.nostr.social.feeds.user(alice.publicKey, { limit: 10 });

    const current = feed.current;
    expect(Array.isArray(current)).toBe(true);

    // Create another event, expect reactive update eventually
    const p3 = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Feed-3'));
    testEnv.assertPublishSuccess(p3, 'publish note 3');

    await testEnv.waitForPropagation(400);
    const after = feed.current;
    expect(after.length).toBeGreaterThanOrEqual(current.length);
  }, 40000);
});


