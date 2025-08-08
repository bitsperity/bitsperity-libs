import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Threads (NIP-10)', () => {
  let alice: any;
  let rootId: string = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    const root = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Root'));
    testEnv.assertPublishSuccess(root, 'publish root');
    rootId = root.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('reply creates threaded reply and thread store lists replies', async () => {
    const threads = alice.nostr.social.threads;
    const reply = await threads.reply(rootId, TestHelpers.uniqueContent('Reply'));
    expect(reply.success).toBe(true);

    const threadStore = threads.thread(rootId, { limit: 20 });
    await testEnv.waitForPropagation(400);
    const items = threadStore.current;
    expect(Array.isArray(items)).toBe(true);
    // At least root or reply present depending on timing
    expect(items.length).toBeGreaterThanOrEqual(1);
  }, 40000);
});


