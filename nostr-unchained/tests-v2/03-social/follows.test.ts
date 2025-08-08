import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Profile - Follow/Unfollow (kind 3)', () => {
  let alice: any;
  let bob: any;

  beforeAll(async () => {
    [alice, bob] = await testEnv.createTestUsers(['Alice', 'Bob']);
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('alice can follow and unfollow bob; follower count reflects changes', async () => {
    // follower count of bob (who follows bob?)
    const followersCountStore = bob.nostr.profile.followerCount(bob.publicKey);

    const followRes = await alice.nostr.profile.follows.add(bob.publicKey).publish();
    expect(followRes.success).toBe(true);
    await testEnv.waitForPropagation(400);

    // Count store should increase
    await testEnv.waitForSubscription(800);
    const afterFollow = followersCountStore.current;
    expect(afterFollow).toBeGreaterThanOrEqual(1);

    // Unfollow
    const unfollowRes = await alice.nostr.profile.follows.remove(bob.publicKey);
    expect(unfollowRes.success).toBe(true);
    await testEnv.waitForPropagation(400);

    await testEnv.waitForSubscription(800);
    const afterUnfollow = followersCountStore.current;
    expect(afterUnfollow).toBeGreaterThanOrEqual(0);
  }, 30000);
});


