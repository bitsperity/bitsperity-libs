import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Infrastructure: NIP-65 Relay List', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('RelayListUser');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should publish and read relay list (kind 10002) with markers', async () => {
    const nostr = user.nostr as any;

    // Publish a relay list: one read, one write, one both
    const pubRes = await nostr.relayList
      .edit()
      .read('wss://read.example.com')
      .write('wss://write.example.com')
      .both('ws://localhost:7777')
      .publish();

    expect(pubRes.success).toBe(true);

    // Query reactive relay list
    const rlStore = nostr.relayList.get(user.publicKey);
    // Wait a bit for subscription to fill cache
    await testEnv.waitForSubscription(1000);

    const rl = rlStore.current;
    expect(rl.author).toBe(user.publicKey);
    expect(rl.entries.length).toBeGreaterThan(0);
    expect(rl.read).toContain('wss://read.example.com');
    expect(rl.write).toContain('wss://write.example.com');
    expect(rl.both).toContain('ws://localhost:7777');
  }, 20000);
});


