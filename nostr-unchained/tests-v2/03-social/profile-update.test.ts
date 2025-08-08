import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Profile - Update (kind 0)', () => {
  let alice: any;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('Alice');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can update profile name and see change via ProfileModule.get()', async () => {
    const name1 = 'Alice ' + Math.random().toString(36).slice(2, 6);
    const name2 = 'Alice ' + Math.random().toString(36).slice(2, 6);

    // First update
    const res1 = await alice.nostr.profile.edit().name(name1).publish();
    expect(res1.success).toBe(true);
    await testEnv.waitForPropagation(300);

    const pStore1 = alice.nostr.profile.get(alice.publicKey);
    await testEnv.waitForSubscription(700);
    expect(pStore1.current?.metadata?.name).toBe(name1);

    // Second update
    const res2 = await alice.nostr.profile.edit().name(name2).publish();
    expect(res2.success).toBe(true);
    await testEnv.waitForPropagation(300);

    const pStore2 = alice.nostr.profile.get(alice.publicKey);
    await testEnv.waitForSubscription(900);
    expect(pStore2.current?.metadata?.name).toBe(name2);
  }, 25000);
});


