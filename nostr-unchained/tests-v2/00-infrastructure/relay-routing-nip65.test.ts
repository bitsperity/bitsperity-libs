import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import { NostrUnchained } from '../../src/index.js';

describe('Infrastructure: NIP-65 Routing (opt-in)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
    bob = await testEnv.createTestUser('Bob');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should route DM publish to recipient read relays when routing is nip65', async () => {
    // Bob publishes a relay list with a custom read relay
    const bobReadRelay = 'wss://read.example.com';
    await (bob.nostr as any).relayList.edit().read(bobReadRelay).publish();

    // Create a new client instance for Alice with routing enabled
    const aliceNostr = new NostrUnchained({
      relays: [testEnv.relayUrl],
      routing: 'nip65',
      debug: true
    } as any);
    await aliceNostr.connect();
    await aliceNostr.useLocalKeySigner();
    // Proaktiv Bob's Relay-Liste in Alice' Cache laden (deterministisch)
    (aliceNostr as any).relayList.get(bob.publicKey);
    await testEnv.waitForSubscription(800);

    // Send a small text note mentioning Bob (to exercise p-tag routing); in real DMs, gift wrap will include p-tag too
    const event = {
      pubkey: await aliceNostr.getPublicKey(),
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [['p', bob.publicKey]],
      content: 'Hello Bob via NIP-65 routing!'
    };

    const result = await (aliceNostr as any).publish(event);
    expect(result.success).toBe(true);
    // Debug info should include targetRelays, and should contain bobReadRelay (normalized)
    const targets = result.debug?.targetRelays || [];
    expect(Array.isArray(targets)).toBe(true);
    // Normalization removes trailing slashes; do a loose includes check
    expect(targets.find((u: string) => typeof u === 'string' && u.includes('read.example.com'))).toBeTruthy();
  }, 30000);
});


