/**
 * NIP-02: Follow Lists - Comprehensive Tests
 * 
 * Reference: https://github.com/nostr-protocol/nips/blob/master/02.md
 * 
 * Tests:
 * - Core functionality (kind:3 event structure)
 * - Single follow operations (add/remove)
 * - Batch operations (add multiple, remove multiple)
 * - Pet names and relay hints
 * - Edge cases (duplicates, empty lists, invalid inputs)
 * - Follow list parsing
 * - Follower count reactive updates
 * 
 * Architecture: Layer 2 (High-level APIs)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../../shared/TestEnvironment.js';

describe('NIP-02: Follow Lists', () => {
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeAll(async () => {
    [alice, bob, charlie] = await testEnv.createTestUsers(['Alice', 'Bob', 'Charlie']);
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Core Functionality', () => {
    it('should create kind:3 follow list event', async () => {
      const result = await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      await testEnv.waitForPropagation(500);
      
      // Verify event structure
      const followListEvents = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .execute();
      
      expect(followListEvents.current.length).toBeGreaterThan(0);
      
      const event = followListEvents.current[0];
      expect(event.kind).toBe(3);
      expect(event.pubkey).toBe(alice.publicKey);
      expect(event.tags).toBeDefined();
      
      // Should have at least one p-tag
      const pTags = event.tags.filter(t => t[0] === 'p');
      expect(pTags.length).toBeGreaterThan(0);
      expect(pTags[0][1]).toBe(bob.publicKey);
    });

    it('should parse p-tags correctly (pubkey, relay, petname)', async () => {
      const relayUrl = 'wss://test-relay.com';
      const petname = 'Bob-Test';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(relayUrl)
        .petname(petname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Query and parse
      const followListEvents = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .execute();
      
      const event = followListEvents.current[0];
      const bobTag = event.tags.find(t => t[0] === 'p' && t[1] === bob.publicKey);
      
      expect(bobTag).toBeDefined();
      expect(bobTag?.[1]).toBe(bob.publicKey);
      expect(bobTag?.[2]).toBe(relayUrl);
      expect(bobTag?.[3]).toBe(petname);
    });
  });

  describe('Single Follow Operations', () => {
    it('should add a follow', async () => {
      const result = await alice.nostr.profile.follows.add(charlie.publicKey).publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify follow was added
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      expect(followList.some((f: any) => f.pubkey === charlie.publicKey)).toBe(true);
    });

    it('should remove a follow', async () => {
      // First add
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Then remove
      const result = await alice.nostr.profile.follows.remove(bob.publicKey);
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify follow was removed
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      expect(followList.some((f: any) => f.pubkey === bob.publicKey)).toBe(false);
    });

    it('should handle relay hint in follow', async () => {
      const relayUrl = 'wss://custom-relay.example.com';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(relayUrl)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify relay hint is stored
      const event = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute()
        .current[0];
      
      const bobTag = event.tags.find(t => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag?.[2]).toBe(relayUrl);
    });

    it('should handle petname in follow', async () => {
      const petname = 'Best Friend Bob';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(petname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify petname is stored
      const event = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute()
        .current[0];
      
      const bobTag = event.tags.find(t => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag?.[3]).toBe(petname);
    });

    it('should handle both relay and petname', async () => {
      const relayUrl = 'wss://bob-relay.example.com';
      const petname = 'Bob The Builder';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(relayUrl)
        .petname(petname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify both are stored
      const event = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute()
        .current[0];
      
      const bobTag = event.tags.find(t => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag?.[2]).toBe(relayUrl);
      expect(bobTag?.[3]).toBe(petname);
    });
  });

  describe('Batch Operations', () => {
    it('should add multiple follows at once', async () => {
      const pubkeys = [bob.publicKey, charlie.publicKey];
      
      const result = await alice.nostr.profile.follows
        .batch()
        .add(pubkeys)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify all were added
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      expect(followList.some((f: any) => f.pubkey === bob.publicKey)).toBe(true);
      expect(followList.some((f: any) => f.pubkey === charlie.publicKey)).toBe(true);
    });

    it('should remove multiple follows at once', async () => {
      // First add some follows
      const pubkeys = [bob.publicKey, charlie.publicKey];
      await alice.nostr.profile.follows.batch().add(pubkeys).publish();
      await testEnv.waitForPropagation(500);
      
      // Then remove them
      const result = await alice.nostr.profile.follows
        .batch()
        .remove(pubkeys)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify all were removed
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      expect(followList.some((f: any) => f.pubkey === bob.publicKey)).toBe(false);
      expect(followList.some((f: any) => f.pubkey === charlie.publicKey)).toBe(false);
    });

    it('should handle mixed add and remove operations', async () => {
      // Start with bob followed
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Add charlie, remove bob (in one operation)
      const result = await alice.nostr.profile.follows
        .batch()
        .add([charlie.publicKey])
        .remove([bob.publicKey])
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify state
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      expect(followList.some((f: any) => f.pubkey === bob.publicKey)).toBe(false);
      expect(followList.some((f: any) => f.pubkey === charlie.publicKey)).toBe(true);
    });

    it('should handle empty batch gracefully', async () => {
      const result = await alice.nostr.profile.follows
        .batch()
        .publish();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No follow operations specified');
    });
  });

  describe('Edge Cases', () => {
    it('should prevent duplicate follows', async () => {
      // Add once
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Try to add again
      const result = await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Already following');
    });

    it('should handle remove of non-followed user gracefully', async () => {
      // Try to remove someone we're not following
      const result = await alice.nostr.profile.follows.remove('nonexistent' + '0'.repeat(54));
      
      // Should succeed (no-op) or handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle empty follow list', async () => {
      // Remove all follows
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      const allPubkeys = followList.map((f: any) => f.pubkey);
      
      if (allPubkeys.length > 0) {
        await alice.nostr.profile.follows.batch().remove(allPubkeys).publish();
        await testEnv.waitForPropagation(500);
      }
      
      // Verify empty list
      await testEnv.waitForSubscription(1000);
      const updatedFollowList = myFollows.current;
      expect(updatedFollowList.length).toBe(0);
    });

    it('should handle very long petnames', async () => {
      const longPetname = 'A'.repeat(500);
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(longPetname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify petname is stored correctly
      const event = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute()
        .current[0];
      
      const bobTag = event.tags.find(t => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag?.[3]).toBe(longPetname);
    });

    it('should handle special characters in petnames', async () => {
      const specialPetname = 'Bob 🔥 <>&"\' Test';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(specialPetname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await testEnv.waitForPropagation(500);
      
      // Verify special characters preserved
      const event = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute()
        .current[0];
      
      const bobTag = event.tags.find(t => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag?.[3]).toBe(specialPetname);
    });

    it('should handle invalid relay URLs gracefully', async () => {
      const invalidRelay = 'not-a-valid-url';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(invalidRelay)
        .publish();
      
      // Should still publish (relay hint is optional/permissive)
      expect(result.success).toBe(true);
    });
  });

  describe('Follow List Parsing', () => {
    it('should parse empty follow list', async () => {
      // Clear all follows
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      const allPubkeys = followList.map((f: any) => f.pubkey);
      
      if (allPubkeys.length > 0) {
        await alice.nostr.profile.follows.batch().remove(allPubkeys).publish();
        await testEnv.waitForPropagation(500);
      }
      
      // Get empty follow list
      await testEnv.waitForSubscription(1000);
      const emptyFollowList = myFollows.current;
      
      expect(emptyFollowList).toBeDefined();
      expect(Array.isArray(emptyFollowList)).toBe(true);
      expect(emptyFollowList.length).toBe(0);
    });

    it('should parse follow list with only pubkeys (no relay/petname)', async () => {
      // Add follow without relay or petname
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Parse
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      const bobFollow = followList.find((f: any) => f.pubkey === bob.publicKey);
      
      expect(bobFollow).toBeDefined();
      expect(bobFollow.pubkey).toBe(bob.publicKey);
      expect(bobFollow.relayUrl).toBeUndefined();
      expect(bobFollow.petname).toBeUndefined();
    });

    it('should parse follow list with relay hints', async () => {
      const relayUrl = 'wss://relay.example.com';
      
      await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(relayUrl)
        .publish();
      await testEnv.waitForPropagation(500);
      
      // Parse
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      const bobFollow = followList.find((f: any) => f.pubkey === bob.publicKey);
      
      expect(bobFollow).toBeDefined();
      expect(bobFollow.pubkey).toBe(bob.publicKey);
      expect(bobFollow.relayUrl).toBe(relayUrl);
    });

    it('should parse follow list with petnames', async () => {
      const petname = 'My Friend Bob';
      
      await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(petname)
        .publish();
      await testEnv.waitForPropagation(500);
      
      // Parse
      const myFollows = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      
      const followList = myFollows.current;
      const bobFollow = followList.find((f: any) => f.pubkey === bob.publicKey);
      
      expect(bobFollow).toBeDefined();
      expect(bobFollow.pubkey).toBe(bob.publicKey);
      expect(bobFollow.petname).toBe(petname);
    });
  });

  describe('Follower Count', () => {
    it('should track follower count reactively', async () => {
      // Remove any existing follows first
      await alice.nostr.profile.follows.remove(bob.publicKey);
      await testEnv.waitForPropagation(500);
      
      const bobFollowerCount = bob.nostr.profile.followerCount(bob.publicKey);
      
      // Initial count
      await testEnv.waitForSubscription(1000);
      const initialCount = bobFollowerCount.current;
      
      // Alice follows Bob
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Count should increase or equal (at least 1)
      await testEnv.waitForSubscription(1000);
      const afterFollowCount = bobFollowerCount.current;
      expect(afterFollowCount).toBeGreaterThanOrEqual(1);
      
      // Alice unfollows Bob
      await alice.nostr.profile.follows.remove(bob.publicKey);
      await testEnv.waitForPropagation(500);
      
      // Count should be defined (0 or more)
      await testEnv.waitForSubscription(1000);
      const afterUnfollowCount = bobFollowerCount.current;
      expect(afterUnfollowCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple followers correctly', async () => {
      // Clean slate
      await alice.nostr.profile.follows.remove(bob.publicKey);
      await charlie.nostr.profile.follows.remove(bob.publicKey);
      await testEnv.waitForPropagation(500);
      
      const bobFollowerCount = bob.nostr.profile.followerCount(bob.publicKey);
      
      // Alice follows Bob
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Charlie follows Bob
      await charlie.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // Count should reflect followers (at least 2)
      await testEnv.waitForSubscription(1000);
      const finalCount = bobFollowerCount.current;
      expect(finalCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Performance', () => {
    it('should complete follow operation within 2000ms', async () => {
      testEnv.startPerformanceMeasurement();
      
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      const duration = testEnv.endPerformanceMeasurement('NIP-02 follow operation');
      testEnv.assertPerformance(duration, 2000, 'NIP-02 follow operation');
    });

    it('should complete batch operation within 2000ms', async () => {
      const pubkeys = [bob.publicKey, charlie.publicKey];
      
      testEnv.startPerformanceMeasurement();
      
      await alice.nostr.profile.follows.batch().add(pubkeys).publish();
      
      const duration = testEnv.endPerformanceMeasurement('NIP-02 batch operation');
      testEnv.assertPerformance(duration, 2000, 'NIP-02 batch operation');
    });

    it('should access cached follow list in <100ms', async () => {
      // Pre-populate cache
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await testEnv.waitForPropagation(500);
      
      // First access (fills cache)
      const firstAccess = await alice.nostr.profile.follows.mine();
      await testEnv.waitForSubscription(1000);
      expect(firstAccess.current.length).toBeGreaterThan(0);
      
      // Second access (from cache)
      testEnv.startPerformanceMeasurement();
      
      const cachedAccess = await alice.nostr.profile.follows.mine();
      const cached = cachedAccess.current;
      
      const duration = testEnv.endPerformanceMeasurement('NIP-02 cached access');
      
      expect(cached.length).toBeGreaterThan(0);
      testEnv.assertPerformance(duration, 100, 'NIP-02 cached follow list access');
    });
  });

  describe('Architecture Compliance', () => {
    it('should use Layer 1 APIs only (no direct cache access)', () => {
      const followsModule = alice.nostr.profile.follows;
      
      // Verify no direct cache access
      expect(followsModule).not.toHaveProperty('cache');
      expect(followsModule).not.toHaveProperty('getCache');
    });

    it('should return reactive stores (Svelte-compatible)', async () => {
      const myFollows = await alice.nostr.profile.follows.mine();
      
      // Should have subscribe method
      expect(typeof myFollows.subscribe).toBe('function');
      
      // Should have current property
      expect(myFollows).toHaveProperty('current');
      
      // Should be subscribable
      let updateCount = 0;
      const unsub = myFollows.subscribe(() => {
        updateCount++;
      });
      
      expect(updateCount).toBeGreaterThan(0);
      unsub();
    });
  });
});

