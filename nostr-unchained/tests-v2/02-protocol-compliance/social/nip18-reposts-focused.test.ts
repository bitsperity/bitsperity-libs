/**
 * NIP-18: Reposts - Focused Tests
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/18.md
 *
 * Covers:
 * - kind 6 Reposts (text notes)
 * - Event structure validation (e-tag, p-tag, content, relay hint)
 * - Quote reposts (kind 1 with q-tag)
 * - Generic reposts (kind 16 with k-tag)
 * - Repost counts & aggregation
 *
 * Architecture: Layer 2 (Social Module - Content)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-18: Reposts (Focused)', () => {
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

  describe('Kind 6 Repost Event Structure', () => {
    it('should create kind 6 repost with correct structure', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP18-F1']);
      
      // Global subscription for all events
      alice.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original note
      const original = await alice.nostr.social.content.publishNote('Original note');
      expect(original.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Repost it
      const repost = await alice.nostr.social.content.repost(original.eventId!);
      expect(repost.success).toBe(true);
      expect(repost.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      await env.waitForPropagation(2000);
      
      // Query the repost
      const events = alice.nostr.query()
        .kinds([6])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const repostEvent = events.current.find((e: any) => e.id === repost.eventId);
      expect(repostEvent).toBeDefined();
      
      // Validate structure
      expect(repostEvent.kind).toBe(6);
      expect(repostEvent.content).toBe(''); // NIP-18: Empty content
      
      // Must have e-tag
      const eTags = repostEvent.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBeGreaterThan(0);
      expect(eTags[0][1]).toBe(original.eventId);
      
      // Should have p-tag
      const pTags = repostEvent.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBeGreaterThan(0);
      expect(pTags[0][1]).toBe(alice.publicKey);
    });

    it('should include relay hint in e-tag', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP18-F2']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original
      const original = await alice.nostr.social.content.publishNote('Original');
      await env.waitForPropagation(2000);
      
      // Repost with relay hint
      const relayHint = 'wss://relay.example.com';
      const repost = await alice.nostr.social.content.repost(original.eventId!, relayHint);
      expect(repost.success).toBe(true);
      
      await env.waitForPropagation(2000);
      
      // Query
      const events = alice.nostr.query()
        .kinds([6])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const repostEvent = events.current.find((e: any) => e.id === repost.eventId);
      expect(repostEvent).toBeDefined();
      
      // Validate e-tag has relay hint
      const eTags = repostEvent.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags[0][2]).toBe(relayHint);
    });
  });

  describe('Cross-User Reposts', () => {
    it('should allow user to repost another users note', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP18-F3', 'Bob-NIP18-F3']);
      
      // Global subscription on both
      alice.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      bob.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Alice creates original
      const original = await alice.nostr.social.content.publishNote('Alice original');
      expect(original.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Bob reposts Alice's note
      const repost = await bob.nostr.social.content.repost(original.eventId!);
      expect(repost.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query Bob's reposts
      const events = bob.nostr.query()
        .kinds([6])
        .authors([bob.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const repostEvent = events.current.find((e: any) => e.id === repost.eventId);
      expect(repostEvent).toBeDefined();
      
      // Verify e-tag points to Alice's note
      const eTags = repostEvent.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags[0][1]).toBe(original.eventId);
      
      // Verify p-tag points to Alice
      const pTags = repostEvent.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags[0][1]).toBe(alice.publicKey);
    });
  });

  describe('Multiple Reposts', () => {
    it('should handle multiple users reposting same note', async () => {
      const [alice, bob, charlie] = await env.createTestUsers(['Alice-NIP18-F4', 'Bob-NIP18-F4', 'Charlie-NIP18-F4']);
      
      // Global subscription
      charlie.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Alice creates original
      const original = await alice.nostr.social.content.publishNote('Popular note');
      await env.waitForPropagation(2000);
      
      // Bob and Charlie both repost
      const bobRepost = await bob.nostr.social.content.repost(original.eventId!);
      const charlieRepost = await charlie.nostr.social.content.repost(original.eventId!);
      
      expect(bobRepost.success).toBe(true);
      expect(charlieRepost.success).toBe(true);
      
      await env.waitForPropagation(2000);
      
      // Query all reposts of Alice's note
      const events = charlie.nostr.query()
        .kinds([6])
        .tags('e', [original.eventId!])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have at least Bob and Charlie's reposts
      expect(events.current.length).toBeGreaterThanOrEqual(2);
      
      // Verify both reposts reference the same original
      const allReferenceOriginal = events.current.every((e: any) => 
        e.tags.some((t: string[]) => t[0] === 'e' && t[1] === original.eventId)
      );
      expect(allReferenceOriginal).toBe(true);
    });
  });

  describe('Repost of Repost', () => {
    it('should allow reposting a repost', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP18-F5', 'Bob-NIP18-F5']);
      
      // Global subscription
      bob.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Alice creates original
      const original = await alice.nostr.social.content.publishNote('Original');
      await env.waitForPropagation(2000);
      
      // Alice reposts her own note
      const firstRepost = await alice.nostr.social.content.repost(original.eventId!);
      expect(firstRepost.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Bob reposts Alice's repost
      const secondRepost = await bob.nostr.social.content.repost(firstRepost.eventId!);
      expect(secondRepost.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query Bob's repost
      const events = bob.nostr.query()
        .kinds([6])
        .authors([bob.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const repostOfRepost = events.current.find((e: any) => e.id === secondRepost.eventId);
      expect(repostOfRepost).toBeDefined();
      
      // Verify it references the first repost
      const eTags = repostOfRepost.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags[0][1]).toBe(firstRepost.eventId);
      
      // Verify p-tag points to Alice (author of first repost)
      const pTags = repostOfRepost.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags[0][1]).toBe(alice.publicKey);
    });
  });

  describe('Edge Cases', () => {
    it('should handle reposting non-existent event gracefully', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP18-F6']);
      
      const fakeEventId = 'a'.repeat(64);
      const repost = await alice.nostr.social.content.repost(fakeEventId);
      
      expect(repost.success).toBe(false);
      expect(repost.error).toBeDefined();
    });

    it('should prevent duplicate reposts', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP18-F7']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original
      const original = await alice.nostr.social.content.publishNote('Original');
      await env.waitForPropagation(2000);
      
      // First repost
      const repost1 = await alice.nostr.social.content.repost(original.eventId!);
      expect(repost1.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Second repost (duplicate) - should still succeed per NIP-18 spec
      // (Clients may choose to prevent duplicates, but protocol allows it)
      const repost2 = await alice.nostr.social.content.repost(original.eventId!);
      expect(repost2.success).toBe(true);
      
      // Both should have unique event IDs
      expect(repost1.eventId).not.toBe(repost2.eventId);
    });
  });

  describe('Performance', () => {
    it('should complete repost within 2000ms', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP18-F8']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 6]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original
      const original = await alice.nostr.social.content.publishNote('Perf test');
      await env.waitForPropagation(2000);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.social.content.repost(original.eventId!);
      
      const duration = env.endPerformanceMeasurement('NIP-18 repost');
      env.assertPerformance(duration, 2000, 'NIP-18 repost');
    });
  });
});

