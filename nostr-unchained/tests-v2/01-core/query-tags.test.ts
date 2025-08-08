import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Core - Query tags()', () => {
  let alice: any;
  let targetId = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    const pub = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Tag-Target'));
    testEnv.assertPublishSuccess(pub, 'publish note');
    targetId = pub.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('tags("e", [id]) returns events referencing the target', async () => {
    // create a reaction referencing the target note
    const reaction = await alice.nostr.events.reaction(targetId, '+').publish();
    expect(reaction.success).toBe(true);
    await testEnv.waitForPropagation(300);

    // kick a live sub to ingest reaction
    await alice.nostr.sub().kinds([7]).tags('e', [targetId]).limit(10).execute();

    const store = alice.nostr.query()
      .kinds([7])
      .tags('e', [targetId])
      .limit(10)
      .execute();

    await testEnv.waitForSubscription(600);
    const list = store.current;
    const ok = list.some(e => e.kind === 7 && e.tags.some(t => t[0] === 'e' && t[1] === targetId));
    expect(ok).toBe(true);
  }, 20000);
});


