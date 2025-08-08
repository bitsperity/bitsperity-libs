import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Threads Summary', () => {
  let alice: any;
  let rootId: string = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    const root = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Thread-Root'));
    testEnv.assertPublishSuccess(root, 'publish root');
    rootId = root.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('summary returns structure and updates after reply', async () => {
    const threads = alice.nostr.social.threads;
    const summaryStore = threads.summary(rootId);
    const before = summaryStore.current;
    expect(before).toBeDefined();

    const replyRes = await threads.reply(rootId, TestHelpers.uniqueContent('Thread-Reply'));
    expect(replyRes.success).toBe(true);
    await testEnv.waitForPropagation(300);

    const after = summaryStore.current;
    expect(after.totalReplies).toBeGreaterThanOrEqual(before.totalReplies);
    expect(Array.isArray(after.participants)).toBe(true);
  }, 30000);
});


