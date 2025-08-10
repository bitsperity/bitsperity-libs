import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('NIP-72: Approved Posts Filter', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    alice = await testEnv.createTestUser('AliceNIP72Approved');
    bob = await testEnv.createTestUser('BobNIP72Approved');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('returns only approved posts when approvedOnly=true and optionally moderatorsOnly=true', async () => {
    const a: any = alice.nostr;
    const b: any = bob.nostr;
    const apub = alice.publicKey;
    const cid = 'approved-community';

    // Create community with Alice as moderator
    const c = await a.communities.create(apub)
      .identifier(cid)
      .name('Approved Community')
      .moderator(apub)
      .publish();
    expect(c.success).toBe(true);
    await testEnv.waitForPropagation(150);

    // Prepare posts stores
    const postsAny = a.communities.posts(apub, cid);
    const postsApproved = a.communities.posts(apub, cid, { approvedOnly: true });
    const postsApprovedMods = a.communities.posts(apub, cid, { approvedOnly: true, moderatorsOnly: true });

    // Bob posts 2 items
    const r1 = await b.communities.postTo(apub, cid).content('Post 1').publish();
    const r2 = await b.communities.postTo(apub, cid).content('Post 2').publish();
    expect(r1.success && r2.success).toBe(true);

    // Wait posts visible
    for (let i = 0; i < 25; i++) {
      if ((postsAny.current?.length || 0) >= 2) break;
      await new Promise(res => setTimeout(res, 200));
    }
    const [p1, p2] = postsAny.current;
    expect(!!p1 && !!p2).toBe(true);

    // Approve only Post 2 by moderator Alice
    const ok = await a.communities.approve({ authorPubkey: apub, identifier: cid }).post(p2).publish();
    expect(ok.success).toBe(true);

    // Wait approvals to propagate
    for (let i = 0; i < 25; i++) {
      if ((postsApproved.current?.length || 0) >= 1) break;
      await new Promise(res => setTimeout(res, 200));
    }

    const approved = postsApproved.current || [];
    const approvedMods = postsApprovedMods.current || [];

    expect(approved.some((e: any) => e.id === p2.id)).toBe(true);
    expect(approved.some((e: any) => e.id === p1.id)).toBe(false);
    expect(approvedMods.length).toBeGreaterThanOrEqual(1);
  }, 35000);
});


