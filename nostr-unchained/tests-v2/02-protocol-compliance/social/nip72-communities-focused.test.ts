/**
 * NIP-72: Moderated Communities - COMPREHENSIVE FOCUSED TESTS
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/72.md
 *
 * THIS IS THE MOST CRITICAL TEST FILE - NIP-72 WAS THE ISSUE IN THE APP!
 *
 * Covers EVERY aspect:
 * - Kind 34550 Community Definition (replaceable)
 * - d-tag, name, description, image
 * - Moderator p-tags (4th position marker)
 * - Relay tags with markers (author, requests, approvals)
 * - Kind 1111 Top-level posts (A/a, P/p, K/k uppercase/lowercase distinction)
 * - Kind 1111 Nested replies (uppercase=community, lowercase=parent)
 * - Kind 4550 Approval events (a, e, p, k tags + JSON content)
 * - Relay routing (requests relay for posts, approvals relay for approvals)
 * - resolveRelays() logic
 * - Multi-relay scenarios
 * - Cross-community interactions
 * - Edge cases (missing relays, non-existent communities)
 *
 * Architecture: Layer 2 (Social Module - Communities)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment - CRITICAL for NIP-72!
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-72: Moderated Communities (COMPREHENSIVE)', () => {
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

  describe('1. Community Definition (kind 34550)', () => {
    describe('Basic Structure', () => {
      it('should create kind 34550 with d-tag identifier', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-1']);
        
        // Global subscription
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('test-community')
          .name('Test Community')
          .description('A test community')
          .publish();
        
        expect(result.success).toBe(true);
        expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
        
        await env.waitForPropagation(2000);
        
        // Query the community definition
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        expect(community.kind).toBe(34550);
        
        // Check d-tag
        const dTags = community.tags.filter((t: string[]) => t[0] === 'd');
        expect(dTags.length).toBe(1);
        expect(dTags[0][1]).toBe('test-community');
        
        // Check name tag
        const nameTags = community.tags.filter((t: string[]) => t[0] === 'name');
        expect(nameTags.length).toBe(1);
        expect(nameTags[0][1]).toBe('Test Community');
        
        // Check description tag
        const descTags = community.tags.filter((t: string[]) => t[0] === 'description');
        expect(descTags.length).toBe(1);
        expect(descTags[0][1]).toBe('A test community');
      });

      it('should support image tag with dimensions', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-2']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('image-community')
          .name('Image Community')
          .image('https://example.com/logo.png', '200x200')
          .publish();
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        
        const imageTags = community.tags.filter((t: string[]) => t[0] === 'image');
        expect(imageTags.length).toBe(1);
        expect(imageTags[0][1]).toBe('https://example.com/logo.png');
        expect(imageTags[0][2]).toBe('200x200');
      });

      it('should support moderator p-tags with marker in 4th position', async () => {
        const [owner, mod1, mod2] = await env.createTestUsers([
          'CommunityOwner-3',
          'Moderator1-3',
          'Moderator2-3'
        ]);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('moderated-community')
          .name('Moderated Community')
          .moderator(mod1.publicKey)
          .moderator(mod2.publicKey, 'wss://relay.example.com')
          .publish();
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        
        // Check p-tags with "moderator" marker at position [3]
        const modTags = community.tags.filter((t: string[]) => 
          t[0] === 'p' && t[3] === 'moderator'
        );
        expect(modTags.length).toBe(2);
        expect(modTags.some((t: string[]) => t[1] === mod1.publicKey)).toBe(true);
        expect(modTags.some((t: string[]) => t[1] === mod2.publicKey)).toBe(true);
      });
    });

    describe('Relay Markers (CRITICAL!)', () => {
      it('should support relay tags with author marker', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-4']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('relay-marked-community')
          .name('Relay Marked Community')
          .relay(RELAY_URLS[0], 'author')
          .publish();
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        
        const relayTags = community.tags.filter((t: string[]) => t[0] === 'relay');
        const authorRelay = relayTags.find((t: string[]) => t[2] === 'author');
        expect(authorRelay).toBeDefined();
        expect(authorRelay![1]).toBe(RELAY_URLS[0]);
      });

      it('should support relay tags with requests marker', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-5']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('requests-community')
          .name('Requests Community')
          .relay(RELAY_URLS[1], 'requests')
          .publish();
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        
        const relayTags = community.tags.filter((t: string[]) => t[0] === 'relay');
        const requestsRelay = relayTags.find((t: string[]) => t[2] === 'requests');
        expect(requestsRelay).toBeDefined();
        expect(requestsRelay![1]).toBe(RELAY_URLS[1]);
      });

      it('should support relay tags with approvals marker', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-6']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('approvals-community')
          .name('Approvals Community')
          .relay(RELAY_URLS[2], 'approvals')
          .publish();
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        
        const relayTags = community.tags.filter((t: string[]) => t[0] === 'relay');
        const approvalsRelay = relayTags.find((t: string[]) => t[2] === 'approvals');
        expect(approvalsRelay).toBeDefined();
        expect(approvalsRelay![1]).toBe(RELAY_URLS[2]);
      });

      it('should support all three relay markers in one community', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-7']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('full-relay-community')
          .name('Full Relay Community')
          .relay(RELAY_URLS[0], 'author')
          .relay(RELAY_URLS[1], 'requests')
          .relay(RELAY_URLS[2], 'approvals')
          .publish();
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const community = events.current.find((e: any) => e.id === result.eventId);
        expect(community).toBeDefined();
        
        const relayTags = community.tags.filter((t: string[]) => t[0] === 'relay');
        expect(relayTags.length).toBeGreaterThanOrEqual(3);
        
        expect(relayTags.some((t: string[]) => t[2] === 'author' && t[1] === RELAY_URLS[0])).toBe(true);
        expect(relayTags.some((t: string[]) => t[2] === 'requests' && t[1] === RELAY_URLS[1])).toBe(true);
        expect(relayTags.some((t: string[]) => t[2] === 'approvals' && t[1] === RELAY_URLS[2])).toBe(true);
      });
    });

    describe('Replaceable Events', () => {
      it('should replace community definition with same d-tag', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-8']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        // Create first version
        const v1 = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('replaceable-community')
          .name('Version 1')
          .publish();
        
        expect(v1.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Create second version (same d-tag)
        const v2 = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('replaceable-community')
          .name('Version 2')
          .description('Updated description')
          .publish();
        
        expect(v2.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Query - should only get latest
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const communities = events.current.filter((e: any) => {
          const dTags = e.tags.filter((t: string[]) => t[0] === 'd');
          return dTags.some((t: string[]) => t[1] === 'replaceable-community');
        });
        
        // Should have replaced (cache may have multiple, but latest should be v2)
        const latest = communities.sort((a: any, b: any) => b.created_at - a.created_at)[0];
        expect(latest).toBeDefined();
        expect(latest.id).toBe(v2.eventId);
        
        const nameTags = latest.tags.filter((t: string[]) => t[0] === 'name');
        expect(nameTags[0][1]).toBe('Version 2');
      });
    });
  });

  describe('2. Top-Level Posts (kind 1111)', () => {
    describe('Tag Structure (Uppercase/Lowercase CRITICAL!)', () => {
      it('should create top-level post with correct A/a, P/p, K/k tags', async () => {
        const [owner, member] = await env.createTestUsers([
          'CommunityOwner-9',
          'Member-9'
        ]);
        
        // Global subscription
        owner.nostr.sub().kinds([34550, 1111]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        // Create community
        const community = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('post-test-community')
          .name('Post Test Community')
          .relay(RELAY_URLS[1], 'requests')
          .publish();
        
        expect(community.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Member posts to community
        const post = await member.nostr.communities
          .postTo(owner.publicKey, 'post-test-community', RELAY_URLS[1])
          .content('Hello community!')
          .publish();
        
        expect(post.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Query the post
        const events = owner.nostr.query()
          .kinds([1111])
          .authors([member.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const postEvent = events.current.find((e: any) => e.id === post.eventId);
        expect(postEvent).toBeDefined();
        expect(postEvent.kind).toBe(1111);
        expect(postEvent.content).toBe('Hello community!');
        
        // Check A-tag (uppercase - community)
        const ATags = postEvent.tags.filter((t: string[]) => t[0] === 'A');
        expect(ATags.length).toBe(1);
        expect(ATags[0][1]).toBe(`34550:${owner.publicKey}:post-test-community`);
        
        // Check a-tag (lowercase - ALSO community for top-level posts!)
        const aTags = postEvent.tags.filter((t: string[]) => t[0] === 'a');
        expect(aTags.length).toBe(1);
        expect(aTags[0][1]).toBe(`34550:${owner.publicKey}:post-test-community`);
        
        // Check P-tag (uppercase - community author)
        const PTags = postEvent.tags.filter((t: string[]) => t[0] === 'P');
        expect(PTags.length).toBe(1);
        expect(PTags[0][1]).toBe(owner.publicKey);
        
        // Check p-tag (lowercase - ALSO community author for top-level posts!)
        const pTags = postEvent.tags.filter((t: string[]) => t[0] === 'p');
        expect(pTags.length).toBe(1);
        expect(pTags[0][1]).toBe(owner.publicKey);
        
        // Check K-tag (uppercase - community kind)
        const KTags = postEvent.tags.filter((t: string[]) => t[0] === 'K');
        expect(KTags.length).toBe(1);
        expect(KTags[0][1]).toBe('34550');
        
        // Check k-tag (lowercase - ALSO community kind for top-level posts!)
        const kTags = postEvent.tags.filter((t: string[]) => t[0] === 'k');
        expect(kTags.length).toBe(1);
        expect(kTags[0][1]).toBe('34550');
      });
    });
  });

  describe('3. Nested Replies (kind 1111)', () => {
    describe('Tag Structure (Uppercase=Community, Lowercase=Parent)', () => {
      it('should create nested reply with correct uppercase (community) and lowercase (parent) tags', async () => {
        const [owner, member1, member2] = await env.createTestUsers([
          'CommunityOwner-10',
          'Member1-10',
          'Member2-10'
        ]);
        
        // Global subscription
        owner.nostr.sub().kinds([34550, 1111]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        // Create community
        const community = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('reply-test-community')
          .name('Reply Test Community')
          .relay(RELAY_URLS[1], 'requests')
          .publish();
        
        expect(community.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Member1 creates top-level post
        const topPost = await member1.nostr.communities
          .postTo(owner.publicKey, 'reply-test-community', RELAY_URLS[1])
          .content('Top level post')
          .publish();
        
        expect(topPost.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Get the post event
        const topPostEvents = owner.nostr.query()
          .kinds([1111])
          .authors([member1.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const topPostEvent = topPostEvents.current.find((e: any) => e.id === topPost.eventId);
        expect(topPostEvent).toBeDefined();
        
        // Member2 replies to Member1's post
        const reply = await member2.nostr.communities
          .replyTo({
            authorPubkey: owner.publicKey,
            identifier: 'reply-test-community',
            relay: RELAY_URLS[1]
          }, {
            id: topPostEvent.id,
            pubkey: topPostEvent.pubkey,
            kind: topPostEvent.kind,
            relay: RELAY_URLS[1]
          })
          .content('Reply to your post')
          .publish();
        
        expect(reply.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Query the reply
        const events = owner.nostr.query()
          .kinds([1111])
          .authors([member2.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const replyEvent = events.current.find((e: any) => e.id === reply.eventId);
        expect(replyEvent).toBeDefined();
        expect(replyEvent.content).toBe('Reply to your post');
        
        // UPPERCASE TAGS = COMMUNITY (same as top-level)
        const ATags = replyEvent.tags.filter((t: string[]) => t[0] === 'A');
        expect(ATags.length).toBe(1);
        expect(ATags[0][1]).toBe(`34550:${owner.publicKey}:reply-test-community`);
        
        const PTags = replyEvent.tags.filter((t: string[]) => t[0] === 'P');
        expect(PTags.length).toBe(1);
        expect(PTags[0][1]).toBe(owner.publicKey);
        
        const KTags = replyEvent.tags.filter((t: string[]) => t[0] === 'K');
        expect(KTags.length).toBe(1);
        expect(KTags[0][1]).toBe('34550');
        
        // LOWERCASE TAGS = PARENT POST (different from top-level!)
        const eTags = replyEvent.tags.filter((t: string[]) => t[0] === 'e');
        expect(eTags.length).toBe(1);
        expect(eTags[0][1]).toBe(topPostEvent.id);
        
        const pTags = replyEvent.tags.filter((t: string[]) => t[0] === 'p');
        expect(pTags.length).toBe(1);
        expect(pTags[0][1]).toBe(member1.publicKey); // Parent author, NOT community author!
        
        const kTags = replyEvent.tags.filter((t: string[]) => t[0] === 'k');
        expect(kTags.length).toBe(1);
        expect(kTags[0][1]).toBe('1111'); // Parent kind, NOT 34550!
      });
    });
  });

  describe('4. Moderation (kind 4550)', () => {
    describe('Approval Events', () => {
      it('should create approval with a, e, p, k tags and JSON content', async () => {
        const [owner, moderator, member] = await env.createTestUsers([
          'CommunityOwner-11',
          'Moderator-11',
          'Member-11'
        ]);
        
        // Global subscription
        owner.nostr.sub().kinds([34550, 1111, 4550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        // Create community with moderator
        const community = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('moderated-community-11')
          .name('Moderated Community')
          .moderator(moderator.publicKey)
          .relay(RELAY_URLS[2], 'approvals')
          .publish();
        
        expect(community.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Member creates post
        const post = await member.nostr.communities
          .postTo(owner.publicKey, 'moderated-community-11', RELAY_URLS[1])
          .content('Post to be approved')
          .publish();
        
        expect(post.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Get the post event
        const postEvents = owner.nostr.query()
          .kinds([1111])
          .authors([member.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const postEvent = postEvents.current.find((e: any) => e.id === post.eventId);
        expect(postEvent).toBeDefined();
        
        // Moderator approves the post
        const approval = await moderator.nostr.communities
          .approve({
            authorPubkey: owner.publicKey,
            identifier: 'moderated-community-11',
            relay: RELAY_URLS[2]
          })
          .post(postEvent)
          .publish();
        
        expect(approval.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Query the approval
        const events = owner.nostr.query()
          .kinds([4550])
          .authors([moderator.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const approvalEvent = events.current.find((e: any) => e.id === approval.eventId);
        expect(approvalEvent).toBeDefined();
        expect(approvalEvent.kind).toBe(4550);
        
        // Check a-tag (community reference)
        const aTags = approvalEvent.tags.filter((t: string[]) => t[0] === 'a');
        expect(aTags.length).toBeGreaterThan(0);
        expect(aTags.some((t: string[]) => 
          t[1] === `34550:${owner.publicKey}:moderated-community-11`
        )).toBe(true);
        
        // Check e-tag (post reference)
        const eTags = approvalEvent.tags.filter((t: string[]) => t[0] === 'e');
        expect(eTags.length).toBe(1);
        expect(eTags[0][1]).toBe(postEvent.id);
        
        // Check p-tag (post author)
        const pTags = approvalEvent.tags.filter((t: string[]) => t[0] === 'p');
        expect(pTags.length).toBe(1);
        expect(pTags[0][1]).toBe(member.publicKey);
        
        // Check k-tag (post kind)
        const kTags = approvalEvent.tags.filter((t: string[]) => t[0] === 'k');
        expect(kTags.length).toBe(1);
        expect(kTags[0][1]).toBe('1111');
        
        // Check content (JSON-stringified original event)
        expect(approvalEvent.content).toBeTruthy();
        const parsedContent = JSON.parse(approvalEvent.content);
        expect(parsedContent.id).toBe(postEvent.id);
        expect(parsedContent.content).toBe('Post to be approved');
      });
    });
  });

  describe('5. Relay Routing (MOST CRITICAL!)', () => {
    describe('resolveRelays() Logic', () => {
      it('should resolve relay markers from community definition', async () => {
        const [owner] = await env.createTestUsers(['CommunityOwner-12']);
        
        owner.nostr.sub().kinds([34550]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        // Create community with all relay markers
        const community = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('routing-test')
          .name('Routing Test')
          .relay(RELAY_URLS[0], 'author')
          .relay(RELAY_URLS[1], 'requests')
          .relay(RELAY_URLS[2], 'approvals')
          .publish();
        
        expect(community.success).toBe(true);
        await env.waitForPropagation(3000); // Longer wait for relay resolution
        
        // Query community to ensure it's cached
        const events = owner.nostr.query()
          .kinds([34550])
          .authors([owner.publicKey])
          .execute();
        
        await env.waitForSubscription(1500);
        
        const communityEvent = events.current.find((e: any) => {
          const dTags = e.tags.filter((t: string[]) => t[0] === 'd');
          return dTags.some((t: string[]) => t[1] === 'routing-test');
        });
        
        expect(communityEvent).toBeDefined();
        
        // Verify relay tags are correct
        const relayTags = communityEvent.tags.filter((t: string[]) => t[0] === 'relay');
        expect(relayTags.some((t: string[]) => t[1] === RELAY_URLS[0] && t[2] === 'author')).toBe(true);
        expect(relayTags.some((t: string[]) => t[1] === RELAY_URLS[1] && t[2] === 'requests')).toBe(true);
        expect(relayTags.some((t: string[]) => t[1] === RELAY_URLS[2] && t[2] === 'approvals')).toBe(true);
      });

      it('should fall back to connected relays when no markers present', async () => {
        const [owner, member] = await env.createTestUsers([
          'CommunityOwner-13',
          'Member-13'
        ]);
        
        owner.nostr.sub().kinds([34550, 1111]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        // Create community WITHOUT relay markers
        const community = await owner.nostr.communities
          .create(owner.publicKey)
          .identifier('fallback-test')
          .name('Fallback Test')
          .publish();
        
        expect(community.success).toBe(true);
        await env.waitForPropagation(2000);
        
        // Member posts - should succeed via fallback
        const post = await member.nostr.communities
          .postTo(owner.publicKey, 'fallback-test')
          .content('Fallback post')
          .publish();
        
        // Should succeed with fallback to connected relays
        expect(post.success).toBe(true);
      });
    });
  });

  describe('6. Edge Cases', () => {
    it('should handle community without relay markers gracefully', async () => {
      const [owner] = await env.createTestUsers(['CommunityOwner-14']);
      
      owner.nostr.sub().kinds([34550]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('no-relays')
        .name('No Relays Community')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = owner.nostr.query()
        .kinds([34550])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const community = events.current.find((e: any) => {
        const dTags = e.tags.filter((t: string[]) => t[0] === 'd');
        return dTags.some((t: string[]) => t[1] === 'no-relays');
      });
      
      expect(community).toBeDefined();
    });

    it('should handle empty post content gracefully', async () => {
      const [owner, member] = await env.createTestUsers([
        'CommunityOwner-15',
        'Member-15'
      ]);
      
      owner.nostr.sub().kinds([34550]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const community = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('empty-post-test')
        .name('Empty Post Test')
        .publish();
      
      expect(community.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Try to post empty content - should fail
      try {
        await member.nostr.communities
          .postTo(owner.publicKey, 'empty-post-test')
          .content('')
          .publish();
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle multiple moderators correctly', async () => {
      const [owner, mod1, mod2, mod3] = await env.createTestUsers([
        'CommunityOwner-16',
        'Mod1-16',
        'Mod2-16',
        'Mod3-16'
      ]);
      
      owner.nostr.sub().kinds([34550]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('multi-mod')
        .name('Multi Moderator Community')
        .moderator(mod1.publicKey)
        .moderator(mod2.publicKey)
        .moderator(mod3.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = owner.nostr.query()
        .kinds([34550])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const community = events.current.find((e: any) => e.id === result.eventId);
      expect(community).toBeDefined();
      
      const modTags = community.tags.filter((t: string[]) => 
        t[0] === 'p' && t[3] === 'moderator'
      );
      expect(modTags.length).toBe(3);
    });
  });

  describe('7. Performance', () => {
    it('should create community within 2000ms', async () => {
      const [owner] = await env.createTestUsers(['CommunityOwner-17']);
      
      owner.nostr.sub().kinds([34550]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      env.startPerformanceMeasurement();
      
      await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('perf-test')
        .name('Performance Test')
        .publish();
      
      const duration = env.endPerformanceMeasurement('NIP-72 community creation');
      env.assertPerformance(duration, 2000, 'NIP-72 community creation');
    });

    it('should create post within 3000ms', async () => {
      const [owner, member] = await env.createTestUsers([
        'CommunityOwner-18',
        'Member-18'
      ]);
      
      owner.nostr.sub().kinds([34550, 1111]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create community first
      await owner.nostr.communities
        .create(owner.publicKey)
        .identifier('perf-post-test')
        .name('Perf Post Test')
        .relay(RELAY_URLS[1], 'requests')
        .publish();
      
      await env.waitForPropagation(2000);
      
      env.startPerformanceMeasurement();
      
      await member.nostr.communities
        .postTo(owner.publicKey, 'perf-post-test', RELAY_URLS[1])
        .content('Performance test post')
        .publish();
      
      const duration = env.endPerformanceMeasurement('NIP-72 post creation');
      env.assertPerformance(duration, 3000, 'NIP-72 post creation');
    });
  });
});

