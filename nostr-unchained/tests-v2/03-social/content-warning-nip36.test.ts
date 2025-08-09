import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Social - Content Warning (NIP-36)', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('Nip36User');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish a note with content-warning tag and read it', async () => {
    const nostr: any = user.nostr;
    const note = await nostr.events
      .create()
      .kind(1)
      .content('Sensitive content ⚠️')
      .contentWarning('graphic content')
      .sign();

    const res = await nostr.publishSigned(await note.build());
    expect(res.success).toBe(true);

    const sub = nostr.sub().kinds([1]).authors([await nostr.getPublicKey()]).execute();
    await testEnv.waitForSubscription(800);
    const events = nostr.query().kinds([1]).authors([await nostr.getPublicKey()]).execute().current;
    const found = events.find((e: any) => e.tags?.some((t: any) => t[0] === 'content-warning'));
    expect(!!found).toBe(true);
  }, 20000);
});


