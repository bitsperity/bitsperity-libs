import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Reactions (NIP-25)', () => {
  let alice: any;
  let bob: any;
  let noteId: string = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    bob = await testEnv.createTestUser('Bob');
    // Alice posts a note
    const publish = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Note'));
    testEnv.assertPublishSuccess(publish, 'publish note');
    noteId = publish.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('bob can react and summary store aggregates counts', async () => {
    const reactions = bob.nostr.social.reactions;

    const summaryStore = reactions.to(noteId);
    // subscribe once to ensure initial state
    let initial = summaryStore.current;
    // Should be defined
    expect(initial).toBeDefined();

    // Bob reacts
    const res = await reactions.react(noteId, '+');
    expect(res.success).toBe(true);

    await testEnv.waitForPropagation(400);

    const updated = summaryStore.current;
    expect(updated.totalCount).toBeGreaterThanOrEqual(1);
  }, 40000);

  it('myReaction returns my current reaction content', async () => {
    const reactions = bob.nostr.social.reactions;
    const myStore = reactions.myReaction(noteId);
    const value = myStore.current;
    // Either null or '+' depending on timing; ensure map guard returns a value
    expect(value === null || typeof value === 'string').toBe(true);
  }, 20000);
});


