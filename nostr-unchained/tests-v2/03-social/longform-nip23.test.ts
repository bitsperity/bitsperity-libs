import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-23: Long-form Content (kind 30023)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceLongform');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish and read an article; latest replaceable version wins; naddr helper works', async () => {
    const a: any = alice.nostr;
    const apub = alice.publicKey;
    const d = 'my-article';

    const first = await a.content.article()
      .identifier(d)
      .title('First Title')
      .summary('First summary')
      .image('https://example.com/img1.jpg')
      .content('Hello Nostr - v1')
      .hashtag('nostr')
      .publish();
    expect(first.success).toBe(true);

    // Wait minimal propagation
    await testEnv.waitForSubscription(500);

    const second = await a.content.article()
      .identifier(d)
      .title('Second Title')
      .summary('Second summary')
      .image('https://example.com/img2.jpg')
      .content('Hello Nostr - v2')
      .publish();
    expect(second.success).toBe(true);

    const store = a.content.getArticle(apub, d);
    for (let i = 0; i < 20; i++) {
      if (store.current) break;
      await new Promise(res => setTimeout(res, 200));
    }
    const article = store.current;
    expect(article?.kind).toBe(30023);
    expect(article?.tags.find((t: string[]) => t[0] === 'title')?.[1]).toBe('Second Title');

    const naddr = await a.content.naddrForArticle(apub, d);
    expect(naddr.startsWith('naddr1')).toBe(true);
  }, 30000);
});


