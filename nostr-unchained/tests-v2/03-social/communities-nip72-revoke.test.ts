import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-72: Revoke Approval via NIP-09', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceNIP72Revoke');
    bob = await testEnv.createTestUser('BobNIP72Revoke');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('removes post from approvedOnly results after approval deletion', async () => {
    const a: any = alice.nostr;
    const b: any = bob.nostr;
    const apub = alice.publicKey;
    const cid = 'revoke-community';

    // Community
    const c = await a.communities.create(apub).identifier(cid).name('Revoke Community').moderator(apub).publish();
    expect(c.success).toBe(true);

    const postsAny = a.communities.posts(apub, cid);
    const postsApproved = a.communities.posts(apub, cid, { approvedOnly: true, moderatorsOnly: true });

    // Post
    const postRes = await b.communities.postTo(apub, cid).content('To be approved, then revoked').publish();
    expect(postRes.success).toBe(true);

    // Wait visible
    for (let i = 0; i < 25; i++) {
      if ((postsAny.current?.length || 0) >= 1) break;
      await new Promise(res => setTimeout(res, 200));
    }
    const post = postsAny.current?.[0];
    expect(!!post).toBe(true);

    // Approve
    const ok = await a.communities.approve({ authorPubkey: apub, identifier: cid }).post(post).publish();
    expect(ok.success).toBe(true);

    // Wait approved visible
    for (let i = 0; i < 25; i++) {
      if ((postsApproved.current?.length || 0) >= 1) break;
      await new Promise(res => setTimeout(res, 200));
    }
    expect(postsApproved.current!.some((e: any) => e.id === post.id)).toBe(true);

    // Find approval event id
    const approvalsStore = a.communities.approvals(apub, cid, post.id);
    for (let i = 0; i < 25; i++) {
      if ((approvalsStore.current?.length || 0) >= 1) break;
      await new Promise(res => setTimeout(res, 200));
    }
    const approval = approvalsStore.current?.[0];
    expect(!!approval).toBe(true);

    // Revoke via NIP-09
    const del = await a.communities.revokeApproval(approval.id, 'moderation update');
    expect(del.success).toBe(true);

    // After revocation, approvedOnly should exclude the post
    for (let i = 0; i < 25; i++) {
      const list = postsApproved.current || [];
      if (!list.some((e: any) => e.id === post.id)) break;
      await new Promise(res => setTimeout(res, 200));
    }
    expect((postsApproved.current || []).some((e: any) => e.id === post.id)).toBe(false);
  }, 40000);
});


