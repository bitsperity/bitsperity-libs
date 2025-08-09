import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Social - Comments (NIP-22)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceComments');
    bob = await testEnv.createTestUser('BobComments');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish a comment (kind 1111) to an addressable root and read it reactively', async () => {
    const a = alice.nostr as any;

    // Alice publishes an addressable article (30023) and then comments on it
    const article = await a.events
      .create()
      .kind(30023)
      .tag('d', 'article-1')
      .content('My first article')
      .sign();
    const articleRes = await a.publishSigned(await article.build());
    expect(articleRes.success).toBe(true);

    // Build comment per NIP-22 (A/K/P for root, and a/k/p for parent)
    const pubkey = await a.getPublicKey();
    const commentRes = await a.comments
      .create()
      .onAddressableRoot(30023, pubkey, 'article-1')
      .replyToAddress(30023, pubkey, 'article-1')
      .content('Great article!')
      .publish();

    expect(commentRes.success).toBe(true);

    // Reactive read of comments for the address
    const store = a.comments.getForAddressable(30023, pubkey, 'article-1');
    await testEnv.waitForSubscription(800);
    const comments = store.current || [];
    expect(Array.isArray(comments)).toBe(true);
    const found = comments.find((ev: any) => ev.kind === 1111 && ev.content.includes('Great article!'));
    expect(!!found).toBe(true);
  }, 25000);
});


