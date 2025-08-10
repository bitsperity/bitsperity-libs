import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-66: Relay Discovery & Liveness (basic)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceNIP66');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('discovers relays from NIP-65 and kind 2; health check returns ok for local relay', async () => {
    const a: any = alice.nostr;
    const apub = alice.publicKey;

    // Publish a recommend relay (kind 2)
    await a.events.create().kind(2).content('ws://localhost:7777').publish();

    // Publish NIP-65 list
    await a.relayList.edit().both('ws://localhost:7777').publish();

    // Wait for subscription-first cache to fill
    let discovered: string[] = [];
    for (let i = 0; i < 20; i++) {
      discovered = a.relayDiscovery.discoverForUser(apub);
      if (discovered.some((u: string) => u.includes('localhost:7777'))) break;
      await new Promise(res => setTimeout(res, 200));
    }
    expect(discovered.some((u: string) => u.includes('localhost:7777'))).toBe(true);

    // Health
    const res = await a.relayHealth.check('ws://localhost:7777', 2000);
    expect(res.ok).toBe(true);
  }, 30000);
});


