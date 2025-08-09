import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Social - Lists (NIP-51)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceLists');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can publish and read a bookmark list (kind 30003) with p/e/a tags', async () => {
    const nostr: any = alice.nostr;

    const publishRes = await nostr.lists
      .edit(30003, 'bookmarks')
      .title('Bookmarks')
      .description('Important posts to remember')
      .addEvent('e'.repeat(64))
      .addAddress('30023:' + alice.publicKey + ':article')
      .addPerson(alice.publicKey, 'wss://relay.example', 'Alice')
      .topic('nostr')
      .publish();

    expect(publishRes.success).toBe(true);

    // Reactive read
    const store = nostr.lists.get(alice.publicKey, 30003, 'bookmarks');
    await testEnv.waitForSubscription(800);
    const parsed = store.current;
    expect(parsed?.kind).toBe(30003);
    expect(parsed?.identifier).toBe('bookmarks');
    expect(parsed?.title).toBe('Bookmarks');
    expect(parsed?.p.find((x: any) => x.pubkey === alice.publicKey)).toBeTruthy();
  }, 20000);
});


