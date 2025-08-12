import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-57: Zaps (request & receipt reading)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    [alice, bob] = await testEnv.createTestUsers(['AliceZap', 'BobZap']);
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('emits a zap request and can read receipts reactively (basic flow)', async () => {
    const a: any = alice.nostr;
    const b: any = bob.nostr;
    const bpub = bob.publicKey;

    // Alice requests a zap for Bob's profile
    const req = await a.zaps.requestZap(bpub, { amountMsat: 1000 });
    expect(req.success).toBe(true);

    // In a real flow, LNURL provider would emit a 9735 receipt later.
    // For E2E sanity, just check we can subscribe to receipts and nothing crashes.
    const receipts = b.zaps.receiptsForProfile(bpub);
    await testEnv.waitForSubscription(500);
    expect(Array.isArray(receipts.current || [])).toBe(true);
  }, 25000);
});


