import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Deletion (NIP-09)', () => {
  let alice: any;
  let noteId = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    const pub = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('DeleteMe'));
    testEnv.assertPublishSuccess(pub, 'publish note');
    noteId = pub.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish a deletion event for a previous note', async () => {
    // make sure target note is present in cache
    await alice.nostr.sub().ids([noteId]).limit(1).execute();
    await testEnv.waitForPropagation(200);

    const res = await alice.nostr.events
      .deletion(noteId, 'cleanup')
      .publish();

    expect(res.success).toBe(true);
    expect(res.eventId).toMatch(/^[a-f0-9]{64}$/);

    await testEnv.waitForPropagation(300);

    // Verify deletion event is present (kind 5 with e-tag)
    // kick sub for deletions, then query
    await alice.nostr.sub().kinds([5]).authors([alice.publicKey]).tags('e', [noteId]).limit(5).execute();
    const delStore = alice.nostr.query()
      .kinds([5])
      .authors([alice.publicKey])
      .tags('e', [noteId])
      .limit(5)
      .execute();

    await testEnv.waitForSubscription(600);
    const dels = delStore.current;
    const hasDeletion = dels.some(e => e.kind === 5 && e.tags.some(t => t[0] === 'e' && t[1] === noteId));
    expect(hasDeletion).toBe(true);
  }, 20000);
});


