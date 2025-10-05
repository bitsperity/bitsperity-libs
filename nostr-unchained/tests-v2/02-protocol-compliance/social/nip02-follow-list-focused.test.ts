/**
 * NIP-02: Follow Lists - Focused Core Tests
 * 
 * Reference: https://github.com/nostr-protocol/nips/blob/master/02.md
 * 
 * This is a FOCUSED test suite that validates core NIP-02 functionality
 * without the complexity of full integration testing.
 * 
 * Tests:
 * - Event structure (kind:3)
 * - P-tag format (pubkey, relay, petname)
 * - Single operations (add/remove)
 * - Basic parsing
 * 
 * Architecture: Layer 2 (High-level APIs)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-02: Follow Lists (Focused)', () => {
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

  describe('Core Event Structure', () => {
    it('should create kind:3 follow list event with correct structure', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test1', 'Bob-Test1']);
      
      const result = await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      await env.waitForPropagation(1000);
      
      // Verify event structure via query
      const followListEvents = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      expect(followListEvents.current.length).toBeGreaterThan(0);
      
      const event = followListEvents.current[0];
      expect(event.kind).toBe(3);
      expect(event.pubkey).toBe(alice.publicKey);
      expect(event.tags).toBeDefined();
      expect(Array.isArray(event.tags)).toBe(true);
      
      // Should have at least one p-tag
      const pTags = event.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBeGreaterThan(0);
    });

    it('should store pubkey in p-tag[1]', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test2', 'Bob-Test2']);
      
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await env.waitForPropagation(1000);
      
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      const event = events.current[0];
      
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
      expect(bobTag[1]).toBe(bob.publicKey);
    });
  });

  describe('P-Tag Format (NIP-02 Spec)', () => {
    it('should support relay hint in p-tag[2]', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test3', 'Bob-Test3']);
      
      const relayUrl = 'wss://custom-relay.example.com';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(relayUrl)
        .publish();
      
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      const event = events.current[0];
      
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
      expect(bobTag[2]).toBe(relayUrl);
    });

    it('should support petname in p-tag[3]', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test4', 'Bob-Test4']);
      
      const petname = 'Best Friend Bob';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(petname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      const event = events.current[0];
      
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
      expect(bobTag[3]).toBe(petname);
    });

    it('should support both relay and petname in p-tag', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test5', 'Bob-Test5']);
      
      const relayUrl = 'wss://bob-relay.example.com';
      const petname = 'Bob The Builder';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .relay(relayUrl)
        .petname(petname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      const event = events.current[0];
      
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
      expect(bobTag[2]).toBe(relayUrl);
      expect(bobTag[3]).toBe(petname);
    });
  });

  describe('Multi-Relay Publishing', () => {
    it('should publish follow list to multiple relays', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test6', 'Bob-Test6']);
      
      const result = await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      await env.waitForPropagation(1000);
      
      // Verify event is retrievable from at least one relay
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      
      expect(events.current.length).toBeGreaterThan(0);
      const event = events.current[0];
      expect(event.id).toBe(result.eventId);
      
      // Verify the follow was added
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
    });
  });

  describe('Single Operations', () => {
    it('should add a follow', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test7', 'Bob-Test7']);
      
      // Add
      const result = await alice.nostr.profile.follows.add(bob.publicKey).publish();
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      // Verify via raw event query (not .mine() to avoid API issues)
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      
      expect(events.current.length).toBeGreaterThan(0);
      const event = events.current[0];
      const hasBob = event.tags.some((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(hasBob).toBe(true);
    });

    it('should remove a follow', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test8', 'Bob-Test8']);
      
      // First add
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await env.waitForPropagation(1000);
      
      // Then remove
      const result = await alice.nostr.profile.follows.remove(bob.publicKey);
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      // Verify via raw event query
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      
      expect(events.current.length).toBeGreaterThan(0);
      const event = events.current[0];
      const hasBob = event.tags.some((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(hasBob).toBe(false);
    });

    it('should prevent duplicate follows', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test9', 'Bob-Test9']);
      
      // Add once
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      await env.waitForPropagation(1000);
      
      // Try to add again
      const result = await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Already following');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long petnames', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test10', 'Bob-Test10']);
      
      const longPetname = 'A'.repeat(500);
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(longPetname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      const event = events.current[0];
      
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
      expect(bobTag[3]).toBe(longPetname);
    });

    it('should handle special characters in petnames', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test11', 'Bob-Test11']);
      
      const specialPetname = 'Bob 🔥 <>&"\' Test';
      
      const result = await alice.nostr.profile.follows
        .add(bob.publicKey)
        .petname(specialPetname)
        .publish();
      
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      const events = alice.nostr.query()
        .kinds([3])
        .authors([alice.publicKey])
        .limit(1)
        .execute();
      
      await env.waitForSubscription(1000);
      const event = events.current[0];
      
      const bobTag = event.tags.find((t: string[]) => t[0] === 'p' && t[1] === bob.publicKey);
      expect(bobTag).toBeDefined();
      expect(bobTag[3]).toBe(specialPetname);
    });
  });

  describe('Performance', () => {
    it('should complete follow operation within 2000ms', async () => {
      // Create unique users for this test
      const [alice, bob] = await env.createTestUsers(['Alice-Test12', 'Bob-Test12']);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.profile.follows.add(bob.publicKey).publish();
      
      const duration = env.endPerformanceMeasurement('NIP-02 follow operation');
      env.assertPerformance(duration, 2000, 'NIP-02 follow operation');
    });
  });
});

