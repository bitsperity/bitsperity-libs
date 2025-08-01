/**
 * Milestone 1: End-to-End Integration Tests
 * 
 * These tests validate real-world scenarios and integration with actual relays.
 * Tests run against actual relay infrastructure to ensure production readiness.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '@/index';

describe('Milestone 1: E2E Integration Tests', () => {
  let nostr: NostrUnchained;

  beforeEach(() => {
    nostr = new NostrUnchained();
  });

  afterEach(async () => {
    // Cleanup connections
    await nostr.disconnect();
  });

  describe('Real Relay Integration', () => {
    it('should connect to and publish to umbrel.local:4848', async () => {
      // Test with actual local relay
      const nostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848']
      });

      // Connection test
      await nostr.connect();
      expect(nostr.connectedRelays).toContain('ws://umbrel.local:4848');

      // Publishing test
      const content = `E2E test message: ${Date.now()}`;
      const result = await nostr.publish(content);

      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);

      // Verify it reached the local relay
      const localResult = result.relayResults.find(
        r => r.relay === 'ws://umbrel.local:4848'
      );
      expect(localResult?.success).toBe(true);
    }, 30000); // 30 second timeout for real network

    it('should handle multiple relay scenarios', async () => {
      const nostr = new NostrUnchained({
        relays: [
          'ws://umbrel.local:4848',    // Local relay (should work)
          'wss://relay.damus.io',      // Public relay (may work or timeout)
        ]
      });

      const result = await nostr.publish(`Multi-relay test: ${Date.now()}`);

      // Should succeed overall if at least one relay works  
      expect(result.success).toBe(true);
      expect(result.relayResults.length).toBeGreaterThan(0);

      // At least one relay should succeed (likely the local one)
      const successCount = result.relayResults.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
      
      // Note: We don't require failures anymore as both relays might succeed
    }, 45000);
  });

  describe('Developer Experience Scenarios', () => {
    it('should handle "cold start" developer experience', async () => {
      // Simulate a developer trying the library for the first time
      const startTime = Date.now();

      // Step 1: Install and import (simulated)
      const nostr = new NostrUnchained();

      // Step 2: First publish attempt
      const result = await nostr.publish("My first Nostr message!");

      const totalTime = Date.now() - startTime;

      // Success criteria for "magic moment"
      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(120000); // 2 minutes max
      expect(result.eventId).toBeDefined();

      console.log(`Cold start completed in ${totalTime}ms`);
    }, 150000);

    it('should provide helpful debugging information', async () => {
      const debugNostr = new NostrUnchained({
        debug: true, // Enable debug mode
        relays: ['ws://umbrel.local:4848'] // Use working relay
      });

      const result = await debugNostr.publish("Debug info test");

      // Should provide debugging information
      expect(result.debug).toBeDefined();
      expect(result.debug?.connectionAttempts).toBeDefined();
      expect(result.debug?.relayLatencies).toBeDefined();
      expect(result.debug?.totalTime).toBeDefined();
    }, 120000); // 2 minute timeout
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from temporary network issues', async () => {
      // Test resilience to network problems
      const nostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848'],
        retryAttempts: 3,
        retryDelay: 1000
      });

      // First attempt might fail due to timing
      const result1 = await nostr.publish("Network resilience test 1");

      // Should eventually succeed or provide clear error
      if (!result1.success) {
        expect(result1.error?.retryable).toBe(true);
        expect(result1.error?.suggestion).toBeDefined();
      }

      // Second attempt should have better chance
      const result2 = await nostr.publish("Network resilience test 2");
      
      // At least one should succeed in normal conditions
      expect(result1.success || result2.success).toBe(true);
    }, 60000);

    it('should handle relay overload gracefully', async () => {
      // Simulate relay overload by sending many requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        nostr.publish(`Load test message ${i}`)
      );

      const results = await Promise.all(promises);

      // Should handle concurrent requests
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);

      // Failed requests should have helpful errors
      results.filter(r => !r.success).forEach(result => {
        expect(result.error?.message).toBeDefined();
        expect(result.error?.retryable).toBeDefined();
      });
    }, 60000);
  });

  describe('Browser Extension Scenarios', () => {
    it('should fallback gracefully when no extension available', async () => {
      // Ensure no extension is available
      (globalThis as any).window = undefined;
      (global as any).window = undefined;

      const nostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848'], // Use working relay
        debug: true
      });
      
      // Should fallback to temporary keys and still work
      const result = await nostr.publish("No extension test");

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.event?.pubkey).toBeDefined();
      // Should use temporary signing method
      expect(result.debug?.signingMethod).toBe('temporary');
    }, 120000); // 2 minute timeout
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance requirements under load', async () => {
      // Use local relay for reliable performance testing
      const testNostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848']
      });

      const metrics = {
        connectionTime: 0,
        publishTimes: [] as number[]
      };

      // Measure connection time
      const connectStart = Date.now();
      await testNostr.connect();
      metrics.connectionTime = Date.now() - connectStart;

      // Measure publish times
      for (let i = 0; i < 5; i++) {
        const publishStart = Date.now();
        const result = await testNostr.publish(`Performance test ${i}`);
        const publishTime = Date.now() - publishStart;

        if (result.success) {
          metrics.publishTimes.push(publishTime);
        }
      }

      // Performance assertions
      expect(metrics.connectionTime).toBeLessThan(10000); // 10s connection
      expect(metrics.publishTimes.length).toBeGreaterThan(0);
      
      const avgPublishTime = metrics.publishTimes.reduce((a, b) => a + b, 0) / metrics.publishTimes.length;
      expect(avgPublishTime).toBeLessThan(30000); // 30s avg publish

      console.log('Performance metrics:', metrics);
    }, 180000); // 3 minute timeout
  });

  describe('Real-World Usage Patterns', () => {
    it('should handle typical social media posting workflow', async () => {
      // Use local relay for reliable testing
      const socialNostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848']
      });

      // Simulate real social media usage
      const posts = [
        "Hello Nostr! This is my first post.",
        "Really enjoying this decentralized experience! 🚀",
        "Testing out nostr-unchained library - so far so good!",
        "The future is decentralized ⚡"
      ];

      const results = [];
      
      for (const post of posts) {
        // Realistic delay between posts
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay
        
        const result = await socialNostr.publish(post);
        results.push(result);
        
        // Should succeed for typical usage
        expect(result.success).toBe(true);
      }

      // All posts should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Should have unique event IDs
      const eventIds = results.map(r => r.eventId);
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);
    }, 120000);
  });
});