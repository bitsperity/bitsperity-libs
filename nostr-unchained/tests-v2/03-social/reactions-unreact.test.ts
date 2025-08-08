import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Reactions Unreact (NIP-25 + NIP-09)', () => {
  let alice: any;
  let bob: any;
  let noteId: string = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    bob = await testEnv.createTestUser('Bob');
    const pub = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Note-Unreact'));
    testEnv.assertPublishSuccess(pub, 'publish note');
    noteId = pub.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('react then unreact publishes deletion successfully', async () => {
    const reactions = bob.nostr.social.reactions;

    const reactRes = await reactions.react(noteId, '👎');
    expect(reactRes.success).toBe(true);

    await testEnv.waitForPropagation(300);

    const unreactRes = await reactions.unreact(noteId);
    expect(unreactRes.success).toBe(true);
  }, 30000);
});


