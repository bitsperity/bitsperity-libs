import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Social - Attachments (NIP-92)', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('Nip92User');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish a note with image URL and imeta tag, then read it', async () => {
    const nostr: any = user.nostr;
    const imageUrl = 'https://nostr.build/i/test-image.jpg';

    const builder = await nostr.events
      .create()
      .kind(1)
      .content('Post with image')
      .attachMedia(imageUrl, {
        mimeType: 'image/jpeg',
        alt: 'Scenic view',
        dim: '1200x800'
      })
      .sign();

    const res = await nostr.publishSigned(await builder.build());
    expect(res.success).toBe(true);

    // Reactive read from cache via subscription-first
    const sub = nostr.sub().kinds([1]).authors([await nostr.getPublicKey()]).execute();
    await testEnv.waitForSubscription(800);
    const q = nostr.query().kinds([1]).authors([await nostr.getPublicKey()]).execute();
    const events = q.current || [];
    const found = events.find((e: any) => e.tags?.some((t: any) => t[0] === 'imeta'));
    expect(!!found).toBe(true);
    expect(found.content.includes(imageUrl)).toBe(true);
  }, 20000);
});


