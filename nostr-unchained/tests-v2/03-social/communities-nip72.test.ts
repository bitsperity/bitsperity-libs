import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-72: Moderated Communities (clean implementation, no legacy kind 1)', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceCommunities');
    bob = await testEnv.createTestUser('BobCommunities');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('create community, post, reply, and approve', async () => {
    const aliceN: any = alice.nostr;
    const bobN: any = bob.nostr;
    const alicePub = alice.publicKey;

    // Create community by Alice
    const cid = 'dev-community';
    const createRes = await aliceN.communities
      .create(alicePub)
      .identifier(cid)
      .name('Dev Community')
      .description('All about Nostr dev')
      .moderator(alicePub)
      .publish();
    expect(createRes.success).toBe(true);
    await testEnv.waitForPropagation(200);

    // Post top-level by Bob into community
    const postRes = await bobN.communities
      .postTo(alicePub, cid)
      .content('Hello community!')
      .publish();
    expect(postRes.success).toBe(true);
    await testEnv.waitForSubscription(800);

    // Fetch community and posts reactively (simple check)
    const communityStore = aliceN.communities.getCommunity(alicePub, cid);
    const postsStore = aliceN.communities.posts(alicePub, cid);

    // naive wait loop
    // Wait for community definition and first post to appear via subscription-first
    for (let i = 0; i < 30; i++) {
      if (communityStore.current && postsStore.current && postsStore.current.length > 0) break;
      await new Promise(res => setTimeout(res, 200));
    }
    const community = communityStore.current;
    expect(community?.kind).toBe(34550);

    const posts = postsStore.current;
    expect(posts.length >= 1).toBe(true);
    const post = posts[0];

    // Alice approves Bob's post
    const approveRes = await aliceN.communities
      .approve({ authorPubkey: alicePub, identifier: cid })
      .post(post)
      .publish();
    expect(approveRes.success).toBe(true);

    // Approvals list should include the approval for that post
    const approvalsStore = aliceN.communities.approvals(alicePub, cid, post.id);
    for (let i = 0; i < 20; i++) {
      if (approvalsStore.current.some(e => e.kind === 4550 && e.tags.some(t => t[0]==='e' && t[1]===post.id))) break;
      await new Promise(res => setTimeout(res, 200));
    }
    const approvals = approvalsStore.current;
    expect(approvals.some(e => e.kind === 4550 && e.tags.some(t => t[0]==='e' && t[1]===post.id))).toBe(true);

    // Bob replies to his post inside community
    const replyRes = await bobN.communities
      .replyTo({ authorPubkey: alicePub, identifier: cid }, { id: post.id, pubkey: post.pubkey, kind: post.kind })
      .content('Thanks!')
      .publish();
    expect(replyRes.success).toBe(true);
    await new Promise(res => setTimeout(res, 500));
  });
});


