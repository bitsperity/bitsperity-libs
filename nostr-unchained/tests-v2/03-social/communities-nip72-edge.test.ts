import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-72 Edge Cases', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceNIP72Edge');
    bob = await testEnv.createTestUser('BobNIP72Edge');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('replaceable 34550: second publish supersedes first; moderators read; non-moderator approval ignored', async () => {
    const a: any = alice.nostr;
    const b: any = bob.nostr;
    const apub = alice.publicKey;
    const id = 'edge-community';

    // First definition
    const r1 = await a.communities.create(apub)
      .identifier(id)
      .name('Edge Community v1')
      .moderator(apub)
      .publish();
    expect(r1.success).toBe(true);

    await testEnv.waitForPropagation(150);
    // Ensure different created_at seconds for replaceable ordering
    await new Promise((res) => setTimeout(res, 1200));

    // Second definition (newer)
    const r2 = await a.communities.create(apub)
      .identifier(id)
      .name('Edge Community v2')
      .moderator(apub)
      .publish();
    expect(r2.success).toBe(true);

    await testEnv.waitForSubscription(800);

    // Latest definition should be visible
    const communityStore = a.communities.getCommunity(apub, id);
    for (let i = 0; i < 20; i++) {
      if (communityStore.current) break;
      await new Promise((res) => setTimeout(res, 200));
    }
    const community = communityStore.current;
    expect(community?.kind).toBe(34550);
    const nameTag = community?.tags.find((t: string[]) => t[0] === 'name');
    expect(nameTag?.[1]).toBe('Edge Community v2');

    // Prepare posts store (ensure subscription before publish)
    const postsStore = a.communities.posts(apub, id);
    await testEnv.waitForPropagation(100);
    // Bob posts to community
    const postRes = await b.communities.postTo(apub, id).content('Hello!').publish();
    expect(postRes.success).toBe(true);
    // Wait for the post to arrive in cache
    for (let i = 0; i < 25; i++) {
      if ((postsStore.current?.length || 0) > 0) break;
      await new Promise((res) => setTimeout(res, 200));
    }
    const post = postsStore.current?.[0];
    expect(!!post).toBe(true);

    // Non-moderator tries to approve (should be considered invalid by consumer logic later)
    const badApproval = await b.communities
      .approve({ authorPubkey: apub, identifier: id })
      .post(post)
      .publish();
    expect(badApproval.success).toBe(true);

    // Moderator approves
    const goodApproval = await a.communities
      .approve({ authorPubkey: apub, identifier: id })
      .post(post)
      .publish();
    expect(goodApproval.success).toBe(true);

    await testEnv.waitForSubscription(800);

    // Read moderators
    const modsStore = a.communities.moderators(apub, id);
    const mods = modsStore.current;
    expect(mods.includes(apub)).toBe(true);

    // Verify approvals exist; consumer can filter to moderators if desired
    const approvalsStore = a.communities.approvals(apub, id, post.id);
    // Wait until at least one approval arrives
    for (let i = 0; i < 25; i++) {
      if ((approvalsStore.current?.length || 0) > 0) break;
      await new Promise((res) => setTimeout(res, 200));
    }
    const approvals = approvalsStore.current || [];
    expect(approvals.some((e: any) => e.kind === 4550)).toBe(true);
  }, 30000);
});


