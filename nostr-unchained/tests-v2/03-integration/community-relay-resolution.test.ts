/**
 * Community Relay Resolution Integration Test
 * 
 * Tests the complete community relay resolution flow:
 * 1. Create community with relay markers
 * 2. resolveRelays() finds community across relays
 * 3. Community posts go to correct relay
 * 4. Approvals go to correct relay
 * 
 * Critical for Sprint 1: Validates relay management fixes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment, TestUser } from '../shared/TestEnvironment.js';

describe('Community Relay Resolution', () => {
  let env: TestEnvironment;
  let alice: TestUser;
  let bob: TestUser;
  
  beforeAll(async () => {
    env = new TestEnvironment({ 
      relayUrl: 'ws://localhost:7777',
      debug: true
    });
    
    [alice, bob] = await env.createTestUsers(['Alice', 'Bob']);
  });
  
  afterAll(async () => {
    await env.cleanup();
  });

  describe('Community Creation & Discovery', () => {
    it('should create community and resolve relay markers', async () => {
      const relay = 'ws://localhost:7777';
      
      // 1. Alice creates community with relay markers
      const createResult = await alice.nostr.communities
        .create(alice.publicKey)
        .identifier('test-resolution')
        .name('Test Resolution Community')
        .description('Testing relay resolution')
        .relay(relay, 'author')
        .relay(relay, 'requests')
        .relay(relay, 'approvals')
        .publish();
      
      expect(createResult.success).toBe(true);
      expect(createResult.eventId).toBeDefined();
      
      // 2. Wait for relay propagation
      await env.waitForPropagation(500);
      
      // 3. Resolve relays should find the community
      const resolved = await (alice.nostr.communities as any).resolveRelays(
        alice.publicKey,
        'test-resolution',
        3000  // Generous timeout
      );
      
      // Should find all relay markers
      expect(resolved).toBeDefined();
      expect(resolved.author).toBe(relay);
      expect(resolved.requests).toBe(relay);
      expect(resolved.approvals).toBe(relay);
    });
    
    it('should find community across multiple relays (cache test)', async () => {
      const relay = 'ws://localhost:7777';
      
      // Create community
      const createResult = await alice.nostr.communities
        .create(alice.publicKey)
        .identifier('test-cross-relay')
        .name('Cross-Relay Test')
        .relay(relay, 'author')
        .relay(relay, 'requests')
        .publish();
      
      expect(createResult.success).toBe(true);
      
      // Wait for propagation
      await env.waitForPropagation(500);
      
      // Bob (connected to same relay) should find it
      const resolved = await (bob.nostr.communities as any).resolveRelays(
        alice.publicKey,
        'test-cross-relay',
        3000
      );
      
      expect(resolved.author).toBe(relay);
      expect(resolved.requests).toBe(relay);
    });
  });

  describe('Community Post Routing', () => {
    it('should publish community post to requests relay', async () => {
      const relay = 'ws://localhost:7777';
      const identifier = 'test-post-routing';
      
      // 1. Create community
      const createResult = await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('Post Routing Test')
        .relay(relay, 'author')
        .relay(relay, 'requests')
        .relay(relay, 'approvals')
        .publish();
      
      expect(createResult.success).toBe(true);
      
      // 2. Wait for community to be indexed
      await env.waitForPropagation(500);
      
      // ✅ START SUBSCRIPTION BEFORE POSTING!
      const communityPosts = alice.nostr.communities.posts(alice.publicKey, identifier);
      
      // 3. Post to community
      const postResult = await alice.nostr.communities
        .postTo(alice.publicKey, identifier)
        .content('Test post content')
        .publish();
      
      // Should succeed
      expect(postResult.success).toBe(true);
      expect(postResult.eventId).toBeDefined();
      
      // 4. Verify post appears in community - need longer wait for event to come back from relay
      await env.waitForPropagation(1000);  // ✅ Increased from 300ms to 1000ms
      
      // Should have at least one post
      const posts = communityPosts.current;
      expect(posts.length).toBeGreaterThan(0);
    });
    
    it('should use explicit relay hint when provided', async () => {
      const relay = 'ws://localhost:7777';
      const identifier = 'test-explicit-relay';
      
      // Create community
      await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('Explicit Relay Test')
        .relay(relay, 'requests')
        .publish();
      
      await env.waitForPropagation(500);
      
      // Post with explicit relay hint (should override auto-resolution)
      const postResult = await alice.nostr.communities
        .postTo(alice.publicKey, identifier, relay)
        .content('Post with explicit relay')
        .publish();
      
      expect(postResult.success).toBe(true);
    });
  });

  describe('Community Approval Routing', () => {
    it('should publish approval to approvals relay', async () => {
      const relay = 'ws://localhost:7777';
      const identifier = 'test-approval-routing';
      
      // 1. Create community
      await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('Approval Routing Test')
        .relay(relay, 'author')
        .relay(relay, 'requests')
        .relay(relay, 'approvals')
        .publish();
      
      await env.waitForPropagation(500);
      
      // ✅ START SUBSCRIPTION BEFORE POSTING!
      const posts = bob.nostr.communities.posts(alice.publicKey, identifier);
      
      // 2. Bob posts to community
      const postResult = await bob.nostr.communities
        .postTo(alice.publicKey, identifier)
        .content('Post needing approval')
        .publish();
      
      expect(postResult.success).toBe(true);
      
      await env.waitForPropagation(1000);  // ✅ Increased from 300ms to 1000ms
      
      const bobPost = posts.current.find(p => p.pubkey === bob.publicKey);
      expect(bobPost).toBeDefined();
      
      // 4. Alice approves the post
      const approvalResult = await alice.nostr.communities
        .approve({ authorPubkey: alice.publicKey, identifier })
        .post(bobPost!)
        .publish();
      
      expect(approvalResult.success).toBe(true);
      expect(approvalResult.eventId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout gracefully when community not found', async () => {
      const resolved = await (alice.nostr.communities as any).resolveRelays(
        'nonexistent'.repeat(8),
        'fake-community',
        1000  // Short timeout
      );
      
      // Should return empty object (not throw)
      expect(resolved).toEqual({});
    });
    
    it('should fallback to connected relays when posting to non-existent community', async () => {
      // After our graceful degradation fix, this should succeed (falls back to connected relays)
      const result = await alice.nostr.communities
        .postTo('nonexistent'.repeat(8), 'fake')
        .content('Post to non-existent community')
        .publish();
      
      // Should succeed with fallback to connected relays
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });
    
    it('should handle empty relay markers gracefully', async () => {
      const identifier = 'no-markers';
      
      // Create community WITHOUT relay markers
      const createResult = await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('No Markers Community')
        // NO .relay() calls
        .publish();
      
      // Should still succeed (uses default relays)
      expect(createResult.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should resolve community relays within 3000ms', async () => {
      const relay = 'ws://localhost:7777';
      const identifier = 'performance-test';
      
      // Create community
      await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('Performance Test')
        .relay(relay, 'author')
        .publish();
      
      await env.waitForPropagation(500);
      
      // Measure resolution time
      env.startPerformanceMeasurement();
      
      const resolved = await (alice.nostr.communities as any).resolveRelays(
        alice.publicKey,
        identifier,
        3000
      );
      
      const duration = env.endPerformanceMeasurement('Community relay resolution');
      
      // Should complete within 3 seconds
      env.assertPerformance(duration, 3000, 'Community relay resolution');
      
      expect(resolved.author).toBe(relay);
    });
    
    it('should cache resolved relays for subsequent calls', async () => {
      const relay = 'ws://localhost:7777';
      const identifier = 'cache-test';
      
      // Create community
      await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('Cache Test')
        .relay(relay, 'author')
        .publish();
      
      await env.waitForPropagation(500);
      
      // First resolution (cold)
      const firstResolution = await (alice.nostr.communities as any).resolveRelays(
        alice.publicKey,
        identifier,
        3000
      );
      
      expect(firstResolution.author).toBe(relay);
      
      // Second resolution (should be from cache, much faster)
      env.startPerformanceMeasurement();
      
      const cachedResolution = await (alice.nostr.communities as any).resolveRelays(
        alice.publicKey,
        identifier,
        3000
      );
      
      const duration = env.endPerformanceMeasurement('Cached relay resolution');
      
      // Cached resolution should be very fast (<50ms)
      env.assertPerformance(duration, 50, 'Cached relay resolution');
      
      expect(cachedResolution.author).toBe(relay);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should allow Bob to post to Alice\'s community', async () => {
      const relay = 'ws://localhost:7777';
      const identifier = 'multi-user-test';
      
      // 1. Alice creates community
      await alice.nostr.communities
        .create(alice.publicKey)
        .identifier(identifier)
        .name('Multi-User Community')
        .relay(relay, 'requests')
        .publish();
      
      await env.waitForPropagation(500);
      
      // ✅ START SUBSCRIPTION BEFORE POSTING!
      const posts = alice.nostr.communities.posts(alice.publicKey, identifier);
      
      // 2. Bob posts to Alice's community
      const bobPostResult = await bob.nostr.communities
        .postTo(alice.publicKey, identifier)
        .content('Bob\'s post in Alice\'s community')
        .publish();
      
      expect(bobPostResult.success).toBe(true);
      
      // 3. Verify Bob's post appears in community
      await env.waitForPropagation(1000);  // ✅ Increased from 300ms to 1000ms
      
      const bobPost = posts.current.find(p => p.pubkey === bob.publicKey);
      expect(bobPost).toBeDefined();
      expect(bobPost?.content).toBe('Bob\'s post in Alice\'s community');
    });
  });
});


