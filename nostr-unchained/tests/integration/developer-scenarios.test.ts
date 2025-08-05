/**
 * Developer Scenarios Tests
 * 
 * Tests real developer usage patterns with the NostrUnchained API.
 * NO mocks, NO fakes - only real developer workflow scenarios.
 * 
 * Focus: Real developer experience and usage patterns
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '@/index';
import { EventBuilder } from '../../src/core/EventBuilder.js';

describe('Developer Scenarios', () => {
  let nostr: NostrUnchained;

  beforeEach(() => {
    nostr = new NostrUnchained({
      relays: [
        'ws://umbrel.local:4848',
        'wss://relay.damus.io'
      ],
      debug: true,
      timeout: 30000
    });
  });

  afterEach(async () => {
    await nostr.disconnect();
  });

  describe('Complex Query Patterns', () => {
    it('should support complex real-world query patterns', async () => {
      // Simulate complex social media feed query
      const store = nostr.query()
        .kinds([1, 6]) // Notes and reposts
        .since(Math.floor(Date.now() / 1000) - 7200) // Last 2 hours
        .limit(30)
        .execute();

      const events = store.current;
      
      // Validate event structure
      events.forEach(event => {
        expect(event.id).toMatch(/^[a-f0-9]{64}$/);
        expect(event.pubkey).toMatch(/^[a-f0-9]{64}$/);
        expect([1, 6]).toContain(event.kind);
        expect(typeof event.content).toBe('string');
        expect(typeof event.created_at).toBe('number');
      });

      // Performance check
      expect(Array.isArray(events)).toBe(true);
      
      console.log(`✅ Complex query: ${events.length} events (kinds 1,6) from last 2 hours`);
    }, 25000);
  });

  describe('Long-Running Subscriptions', () => {
    it('should maintain long-running subscription stability', async () => {
      let eventCount = 0;
      const eventIds = new Set<string>();

      // Test subscription stability over extended period
      const handle = await nostr.sub()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 1800) // Last 30 minutes
        .execute();

      expect(handle.isActive()).toBe(true);

      // Monitor for 10 seconds
      const startTime = Date.now();
      while (Date.now() - startTime < 10000) {
        const currentEvents = handle.store.current;
        currentEvents.forEach(event => {
          if (!eventIds.has(event.id)) {
            eventIds.add(event.id);
            eventCount++;
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify subscription remains active
        expect(handle.isActive()).toBe(true);
      }

      console.log(`✅ Long-running subscription: ${eventCount} unique events over 10s`);
      
      await handle.stop();
      expect(handle.isActive()).toBe(false);
    }, 15000);
  });

  describe('Error Recovery', () => {
    it('should handle real error recovery in production conditions', async () => {
      // Test with unreliable relay setup
      const unreliableNostr = new NostrUnchained({
        relays: [
          'ws://umbrel.local:4848',        // Reliable local relay
          'ws://nonexistent.relay:4848',   // Non-existent relay
          'wss://relay.damus.io'           // Reliable public relay
        ],
        debug: true,
        timeout: 20000
      });

      // Initialize signing and connect
      await unreliableNostr.initializeSigning();
      await unreliableNostr.connect();

      // Should still work despite some relay failures
      const testMessage = `Error recovery test: ${Date.now()}`;
      const pubkey = await unreliableNostr.getPublicKey();
      const event = EventBuilder.createTextNote(testMessage, pubkey);
      const publishResult = await unreliableNostr.publish(event);

      expect(publishResult.success).toBe(true);
      expect(publishResult.eventId).toBeDefined();

      // Check relay results breakdown
      const successfulRelays = publishResult.relayResults.filter(r => r.success);
      const failedRelays = publishResult.relayResults.filter(r => !r.success);

      expect(successfulRelays.length).toBeGreaterThan(0);
      console.log(`✅ Error recovery: ${successfulRelays.length} successful, ${failedRelays.length} failed relays`);

      // Test query resilience
      const store = unreliableNostr.query()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 300)
        .limit(20)
        .execute();

      const events = store.current;
      expect(Array.isArray(events)).toBe(true);
      
      console.log(`✅ Query resilience: ${events.length} events despite relay failures`);

      await unreliableNostr.disconnect();
    }, 30000);
  });

  describe('Store Integration', () => {
    it('should integrate query builder with real store composition', async () => {
      // Test advanced query + store integration
      const baseStore = nostr.query()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 1200) // Last 20 minutes
        .execute();

      const baseEvents = baseStore.current;

      // Create subscription for real-time updates
      const liveHandle = await nostr.sub()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 300) // Last 5 minutes
        .limit(10)
        .execute();

      // Wait for live updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      const liveEvents = liveHandle.store.current;

      // Both should work
      expect(Array.isArray(baseEvents)).toBe(true);
      expect(Array.isArray(liveEvents)).toBe(true);

      console.log(`✅ Store composition: ${baseEvents.length} cached + ${liveEvents.length} live events`);

      await liveHandle.stop();
    }, 15000);
  });

  describe('Developer Experience Validation', () => {
    it('should provide helpful error handling for developers', async () => {
      // Test graceful handling of common developer errors
      
      // Invalid relay URL should be handled gracefully
      const invalidRelayNostr = new NostrUnchained({
        relays: ['invalid-url', 'ws://umbrel.local:4848'],
        debug: true,
        timeout: 10000
      });

      // Initialize signing and connect
      await invalidRelayNostr.initializeSigning();
      await invalidRelayNostr.connect();

      // Should still work with valid relay
      const testMessage = `Developer error handling test: ${Date.now()}`;
      const pubkey = await invalidRelayNostr.getPublicKey();
      const event = EventBuilder.createTextNote(testMessage, pubkey);
      const result = await invalidRelayNostr.publish(event);

      // At least one relay should succeed
      const workingRelays = result.relayResults.filter(r => r.success);
      expect(workingRelays.length).toBeGreaterThan(0);

      console.log(`✅ Error handling: ${workingRelays.length} working relays despite invalid URL`);

      await invalidRelayNostr.disconnect();
    }, 15000);
  });
});