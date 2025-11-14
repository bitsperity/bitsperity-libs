import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../../shared/TestEnvironment.js';

describe('Relay Fallback Behaviour', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceRelayFallback');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('publishSigned uses default relay targets when no markers are provided', async () => {
    const builder = alice.nostr.events.create().kind(1111).content('Fallback publish test');
    const signed = await builder.sign();

    const result = await alice.nostr.publishSigned(await signed.build());
    expect(result.success).toBe(true);
    expect(result.relayResults?.length).toBeGreaterThan(0);

    const publishedToLocalRelay = result.relayResults?.some((entry) =>
      entry.relay.includes('localhost') && entry.success
    );
    expect(publishedToLocalRelay).toBe(true);
  });
});

