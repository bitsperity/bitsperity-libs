/**
 * NIP-72: Relay Routing Validation - CRITICAL TESTS
 *
 * THIS TESTS THE ACTUAL RELAY ROUTING - NOT JUST TAG STRUCTURE!
 *
 * Validates that events actually land on the correct relays:
 * - Community Definition → author relay
 * - Posts → requests relay
 * - Approvals → approvals relay
 *
 * Strategy:
 * 1. Create community with specific relay markers
 * 2. Publish events (posts, approvals)
 * 3. Subscribe to SPECIFIC relays to verify event presence/absence
 * 4. Validate events are on correct relays, NOT on wrong relays
 *
 * Architecture: Layer 2 (Social Module - Communities) + Relay Validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment - CRITICAL!
const RELAY_URLS = [
  'ws://localhost:7777',  // author relay
  'ws://localhost:7778',  // requests relay
  'ws://localhost:7779'   // approvals relay
];

describe('NIP-72: Relay Routing VALIDATION (CRITICAL!)', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = new TestEnvironment({
      relayUrls: RELAY_URLS,
      debug: false
    });
  }, 30000);

  afterAll(async () => {
    await env.cleanup();
  });

  describe('Community Definition on Author Relay', () => {
    it('should publish community definition to author relay', async () => {
      const [owner] = await env.createTestUsers(['Owner-Relay-1']);
      
      // Subscribe to author relay ONLY
      owner.nostr.sub()
        .kinds([34550])
        .authors([owner.publicKey])
        .relays([RELAY_URLS[0]])  // ONLY author relay
        .execute().catch(() => {});
      
      await env.waitForSubscription(1000);
      
      // Create community with author relay marker
      const result = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('author-relay-test')
        .name('Author Relay Test')
        .relay(RELAY_URLS[0], 'author')
        .relay(RELAY_URLS[1], 'requests')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query - should find it because we subscribed to author relay
      const events = owner.nostr.query()
        .kinds([34550])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const community = events.current.find((e: any) => e.id === result.eventId);
      expect(community).toBeDefined();
      expect(community.kind).toBe(34550);
    });

    it('should NOT find community on wrong relay (requests relay)', async () => {
      const [owner] = await env.createTestUsers(['Owner-Relay-2']);
      
      // Create NEW nostr instance that ONLY connects to requests relay
      const requestsOnlyUser = await env.createTestUser('RequestsOnly-2', RELAY_URLS.slice(1, 2)); // Only relay 2
      
      // Create community on author relay (relay 1)
      const result = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('author-only-community')
        .name('Author Only')
        .relay(RELAY_URLS[0], 'author')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Subscribe from requests relay ONLY
      requestsOnlyUser.nostr.sub()
        .kinds([34550])
        .authors([owner.publicKey])
        .relays([RELAY_URLS[1]])  // ONLY requests relay (wrong one!)
        .execute().catch(() => {});
      
      await env.waitForSubscription(1500);
      
      // Query - should NOT find it (wrong relay)
      const events = requestsOnlyUser.nostr.query()
        .kinds([34550])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const community = events.current.find((e: any) => e.id === result.eventId);
      // Should NOT find it on wrong relay
      expect(community).toBeUndefined();
    });
  });

  describe('Posts on Requests Relay', () => {
    it('should publish post to requests relay', async () => {
      const [owner, member] = await env.createTestUsers([
        'Owner-Relay-3',
        'Member-Relay-3'
      ]);
      
      // Subscribe to ALL relays for community definition
      owner.nostr.sub().kinds([34550]).authors([owner.publicKey]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create community
      const community = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('requests-test')
        .name('Requests Test')
        .relay(RELAY_URLS[0], 'author')
        .relay(RELAY_URLS[1], 'requests')
        .publish();
      
      expect(community.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Now subscribe to requests relay ONLY for posts
      member.nostr.sub()
        .kinds([1111])
        .authors([member.publicKey])
        .relays([RELAY_URLS[1]])  // ONLY requests relay
        .execute().catch(() => {});
      
      await env.waitForSubscription(1000);
      
      // Create post (should go to requests relay)
      const post = await member.nostr.communities
        .postTo(owner.publicKey, 'requests-test', RELAY_URLS[1])
        .content('Post on requests relay')
        .publish();
      
      expect(post.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query - should find post
      const events = member.nostr.query()
        .kinds([1111])
        .authors([member.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const postEvent = events.current.find((e: any) => e.id === post.eventId);
      expect(postEvent).toBeDefined();
      expect(postEvent.kind).toBe(1111);
    });

    it('should NOT find post on wrong relay (author relay)', async () => {
      const [owner, member] = await env.createTestUsers([
        'Owner-Relay-4',
        'Member-Relay-4'
      ]);
      
      // Global sub for community
      owner.nostr.sub().kinds([34550]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create community with requests=relay2
      const community = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('no-post-on-author')
        .name('No Post On Author')
        .relay(RELAY_URLS[0], 'author')
        .relay(RELAY_URLS[1], 'requests')
        .publish();
      
      expect(community.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Create NEW user that ONLY connects to author relay
      const authorOnlyUser = await env.createTestUser('AuthorOnly-4', [RELAY_URLS[0]]);
      
      // Member creates post (goes to requests relay)
      const post = await member.nostr.communities
        .postTo(owner.publicKey, 'no-post-on-author', RELAY_URLS[1])
        .content('This should NOT be on author relay')
        .publish();
      
      expect(post.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // AuthorOnly user subscribes (ONLY to author relay)
      authorOnlyUser.nostr.sub()
        .kinds([1111])
        .authors([member.publicKey])
        .relays([RELAY_URLS[0]])  // ONLY author relay (wrong!)
        .execute().catch(() => {});
      
      await env.waitForSubscription(1500);
      
      // Query - should NOT find it
      const events = authorOnlyUser.nostr.query()
        .kinds([1111])
        .authors([member.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const postEvent = events.current.find((e: any) => e.id === post.eventId);
      // Should NOT find it on wrong relay
      expect(postEvent).toBeUndefined();
    });
  });

  describe('Approvals on Approvals Relay', () => {
    it('should publish approval to approvals relay', async () => {
      const [owner, moderator, member] = await env.createTestUsers([
        'Owner-Relay-5',
        'Moderator-Relay-5',
        'Member-Relay-5'
      ]);
      
      // Global sub for community
      owner.nostr.sub().kinds([34550, 1111]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create community
      const community = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('approvals-test')
        .name('Approvals Test')
        .moderator(moderator.publicKey)
        .relay(RELAY_URLS[0], 'author')
        .relay(RELAY_URLS[1], 'requests')
        .relay(RELAY_URLS[2], 'approvals')
        .publish();
      
      expect(community.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Member creates post
      const post = await member.nostr.communities
        .postTo(owner.publicKey, 'approvals-test', RELAY_URLS[1])
        .content('Post to approve')
        .publish();
      
      expect(post.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Get post event
      const postEvents = owner.nostr.query()
        .kinds([1111])
        .authors([member.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const postEvent = postEvents.current.find((e: any) => e.id === post.eventId);
      expect(postEvent).toBeDefined();
      
      // Subscribe to approvals relay ONLY
      moderator.nostr.sub()
        .kinds([4550])
        .authors([moderator.publicKey])
        .relays([RELAY_URLS[2]])  // ONLY approvals relay
        .execute().catch(() => {});
      
      await env.waitForSubscription(1000);
      
      // Moderator approves (should go to approvals relay)
      const approval = await moderator.nostr.communities
        .approve({
          authorPubkey: owner.publicKey,
          identifier: 'approvals-test',
          relay: RELAY_URLS[2]
        })
        .post(postEvent)
        .publish();
      
      expect(approval.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query - should find approval
      const events = moderator.nostr.query()
        .kinds([4550])
        .authors([moderator.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const approvalEvent = events.current.find((e: any) => e.id === approval.eventId);
      expect(approvalEvent).toBeDefined();
      expect(approvalEvent.kind).toBe(4550);
    });
  });

  describe('Multi-Relay Isolation', () => {
    it('should isolate events by relay type (comprehensive)', async () => {
      const [owner, member, moderator] = await env.createTestUsers([
        'Owner-Relay-6',
        'Member-Relay-6',
        'Moderator-Relay-6'
      ]);
      
      // Global sub for setup
      owner.nostr.sub().kinds([34550, 1111, 4550]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create community with ALL relay markers
      const community = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('full-isolation-test')
        .name('Full Isolation Test')
        .moderator(moderator.publicKey)
        .relay(RELAY_URLS[0], 'author')
        .relay(RELAY_URLS[1], 'requests')
        .relay(RELAY_URLS[2], 'approvals')
        .publish();
      
      expect(community.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Create post
      const post = await member.nostr.communities
        .postTo(owner.publicKey, 'full-isolation-test', RELAY_URLS[1])
        .content('Test post')
        .publish();
      
      expect(post.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Get post for approval
      const postEvents = owner.nostr.query()
        .kinds([1111])
        .authors([member.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      const postEvent = postEvents.current.find((e: any) => e.id === post.eventId);
      expect(postEvent).toBeDefined();
      
      // Create approval
      const approval = await moderator.nostr.communities
        .approve({
          authorPubkey: owner.publicKey,
          identifier: 'full-isolation-test',
          relay: RELAY_URLS[2]
        })
        .post(postEvent)
        .publish();
      
      expect(approval.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Now validate isolation:
      // 1. Create user that ONLY sees author relay (relay 0)
      const authorOnlyUser = await env.createTestUser('AuthorOnly-6', [RELAY_URLS[0]]);
      
      authorOnlyUser.nostr.sub()
        .kinds([34550, 1111, 4550])
        .relays([RELAY_URLS[0]])
        .execute().catch(() => {});
      
      await env.waitForSubscription(1500);
      
      const authorRelayEvents = authorOnlyUser.nostr.query()
        .kinds([34550, 1111, 4550])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have community (kind 34550)
      const communityOnAuthor = authorRelayEvents.current.find((e: any) => e.id === community.eventId);
      expect(communityOnAuthor).toBeDefined();
      
      // Should NOT have post (kind 1111) - it's on requests relay!
      const postOnAuthor = authorRelayEvents.current.find((e: any) => e.id === post.eventId);
      expect(postOnAuthor).toBeUndefined();
      
      // Should NOT have approval (kind 4550) - it's on approvals relay!
      const approvalOnAuthor = authorRelayEvents.current.find((e: any) => e.id === approval.eventId);
      expect(approvalOnAuthor).toBeUndefined();
      
      // 2. Create user that ONLY sees requests relay (relay 1)
      const requestsOnlyUser = await env.createTestUser('RequestsOnly-6', [RELAY_URLS[1]]);
      
      requestsOnlyUser.nostr.sub()
        .kinds([34550, 1111, 4550])
        .relays([RELAY_URLS[1]])
        .execute().catch(() => {});
      
      await env.waitForSubscription(1500);
      
      const requestsRelayEvents = requestsOnlyUser.nostr.query()
        .kinds([34550, 1111, 4550])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have post (kind 1111)
      const postOnRequests = requestsRelayEvents.current.find((e: any) => e.id === post.eventId);
      expect(postOnRequests).toBeDefined();
      
      // Should NOT have community (it's on author relay!)
      const communityOnRequests = requestsRelayEvents.current.find((e: any) => e.id === community.eventId);
      expect(communityOnRequests).toBeUndefined();
      
      // Should NOT have approval (it's on approvals relay!)
      const approvalOnRequests = requestsRelayEvents.current.find((e: any) => e.id === approval.eventId);
      expect(approvalOnRequests).toBeUndefined();
      
      // 3. Create user that ONLY sees approvals relay (relay 2)
      const approvalsOnlyUser = await env.createTestUser('ApprovalsOnly-6', [RELAY_URLS[2]]);
      
      approvalsOnlyUser.nostr.sub()
        .kinds([34550, 1111, 4550])
        .relays([RELAY_URLS[2]])
        .execute().catch(() => {});
      
      await env.waitForSubscription(1500);
      
      const approvalsRelayEvents = approvalsOnlyUser.nostr.sub()
        .kinds([34550, 1111, 4550])
        .relays([RELAY_URLS[2]])
        .execute().catch(() => {});
      
      await env.waitForSubscription(1500);
      
      const approvalsQuery = approvalsOnlyUser.nostr.query()
        .kinds([34550, 1111, 4550])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have approval (kind 4550)
      const approvalOnApprovals = approvalsQuery.current.find((e: any) => e.id === approval.eventId);
      expect(approvalOnApprovals).toBeDefined();
      
      // Should NOT have community (it's on author relay!)
      const communityOnApprovals = approvalsQuery.current.find((e: any) => e.id === community.eventId);
      expect(communityOnApprovals).toBeUndefined();
      
      // Should NOT have post (it's on requests relay!)
      const postOnApprovals = approvalsQuery.current.find((e: any) => e.id === post.eventId);
      expect(postOnApprovals).toBeUndefined();
    });
  });
});

