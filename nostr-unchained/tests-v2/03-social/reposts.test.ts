import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Social - Reposts (NIP-18)', () => {
  let alice: any;
  let originalId = '';

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    const pub = await testEnv.createTestEvent(alice, TestHelpers.uniqueContent('Original'));
    testEnv.assertPublishSuccess(pub, 'publish original');
    originalId = pub.event.id;
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish a repost and it appears in reposts() and feed()', async () => {
    const content = alice.nostr.social.content;

    // ensure original is in cache
    await alice.nostr.sub().ids([originalId]).limit(1).execute();
    await testEnv.waitForPropagation(200);

    const res = await content.repost(originalId);
    expect(res.success).toBe(true);
    expect(res.eventId).toMatch(/^[a-f0-9]{64}$/);

    await testEnv.waitForPropagation(300);

    const repostsStore = content.reposts({ authors: [alice.publicKey], limit: 10 });
    const feedStore = content.feed({ authors: [alice.publicKey], limit: 10 });

    // Kick live subs to ensure ingestion
    await alice.nostr.sub().kinds([6]).authors([alice.publicKey]).limit(10).execute();
    await alice.nostr.sub().kinds([1,6]).authors([alice.publicKey]).limit(10).execute();
    await testEnv.waitForSubscription(600);

    const reposts = repostsStore.current;
    const feed = feedStore.current;

    const hasRepost = reposts.some(e => e.kind === 6 && e.tags.some(t => t[0] === 'e' && t[1] === originalId));
    const hasRepostInFeed = feed.some(e => e.kind === 6 && e.tags.some(t => t[0] === 'e' && t[1] === originalId));

    expect(hasRepost).toBe(true);
    expect(hasRepostInFeed).toBe(true);
  }, 20000);
});


