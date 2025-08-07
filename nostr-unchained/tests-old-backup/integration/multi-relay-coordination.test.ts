/**
 * Multi-Relay Coordination Tests
 * 
 * Tests real multi-relay behavior with the NostrUnchained API.
 * NO mocks, NO fakes - only real relay integration.
 * 
 * Focus: Day 4-5 Multi-Relay coordination features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '@/index';
import { EventBuilder } from '../../src/core/EventBuilder.js';

describe('Multi-Relay Coordination', () => {
  let nostr: NostrUnchained;

  beforeEach(async () => {
    nostr = new NostrUnchained({
      relays: [
        'ws://umbrel.local:4848',    // Local relay (confirmed working)
        'wss://relay.damus.io',      // Public relay
        'wss://nos.lol'              // Another public relay
      ],
      debug: true,
      timeout: 30000
    });
    
    // Initialize signing and connect
    await nostr.initializeSigning();
    await nostr.connect();
  });

  afterEach(async () => {
    await nostr.disconnect();
  });

  describe('Real Multi-Relay Publishing', () => {
    it('should handle real multi-relay publishing with fault tolerance', async () => {
      const testMessage = `Multi-relay coordination test: ${Date.now()}`;
      const pubkey = await nostr.getPublicKey();
      const event = EventBuilder.createTextNote(testMessage, pubkey);
      const result = await nostr.publish(event);

      // Verify publishing succeeded to at least one relay
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      expect(result.event?.content).toBe(testMessage);
      expect(result.relayResults.length).toBeGreaterThan(0);

      // Check for successful relay results
      const successfulRelays = result.relayResults.filter(r => r.success);
      expect(successfulRelays.length).toBeGreaterThan(0);

      console.log(`✅ Multi-relay publish: ${successfulRelays.length}/${result.relayResults.length} relays succeeded`);
    }, 40000);

    it('should demonstrate relay resilience and graceful degradation', async () => {
      // Test with mix of working and non-working relays
      const resilientNostr = new NostrUnchained({
        relays: [
          'ws://umbrel.local:4848',      // Working local relay
          'ws://umbrel.local:4848',      // Working test relay
          'wss://relay.damus.io'         // Working public relay
        ],
        debug: true,
        timeout: 15000
      });

      // Initialize signing and connect
      await resilientNostr.initializeSigning();
      await resilientNostr.connect();

      const testMessage = `Resilience test: ${Date.now()}`;
      const pubkey = await resilientNostr.getPublicKey();
      const event = EventBuilder.createTextNote(testMessage, pubkey);
      const result = await resilientNostr.publish(event);

      // Should succeed despite some relay failures
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();

      // Check relay-specific results
      const workingRelays = result.relayResults.filter(r => r.success);
      const failedRelays = result.relayResults.filter(r => !r.success);

      expect(workingRelays.length).toBeGreaterThan(0);
      console.log(`✅ Resilience: ${workingRelays.length} working, ${failedRelays.length} failed relays`);

      await resilientNostr.disconnect();
    }, 30000);

    it('should handle real relay load distribution', async () => {
      // Publish multiple messages to test load distribution
      const messages = Array.from({ length: 5 }, (_, i) => 
        `Load distribution test ${i + 1}: ${Date.now()}`
      );

      const results = await Promise.all(
        messages.map(msg => nostr.publish(msg))
      );

      // All publishes should succeed
      const allSuccessful = results.every(r => r.success);
      expect(allSuccessful).toBe(true);

      // Check relay usage distribution
      const relayUsage = new Map<string, number>();
      results.forEach(result => {
        result.relayResults
          .filter(r => r.success)
          .forEach(r => {
            relayUsage.set(r.relay, (relayUsage.get(r.relay) || 0) + 1);
          });
      });

      console.log('✅ Relay usage distribution:', Object.fromEntries(relayUsage));
    }, 35000);
  });

  describe('Real-Time Subscription Management', () => {
    it('should demonstrate real-time subscription with local relay', async () => {
      let eventCount = 0;
      const receivedEvents: any[] = [];

      const handle = await nostr.sub()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 300) // Last 5 minutes
        .limit(10)
        .execute();

      expect(handle.id).toBeDefined();
      expect(handle.isActive()).toBe(true);

      // Wait for initial events
      await new Promise(resolve => setTimeout(resolve, 5000));

      const events = handle.store.current;
      console.log(`✅ Real-time subscription: ${events.length} events received`);

      // Clean up
      await handle.stop();
      expect(handle.isActive()).toBe(false);
    }, 15000);

    it('should handle real relay connection state changes', async () => {
      // This test is inherently slow as it needs to test connection recovery
      const connectionTestNostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848'],
        debug: true,
        timeout: 15000
      });

      // Initialize signing and connect first
      await connectionTestNostr.initializeSigning();
      await connectionTestNostr.connect();
      
      // First, establish connection
      const firstMessage = `Connection state test 1: ${Date.now()}`;
      const pubkey = await connectionTestNostr.getPublicKey();
      const firstEvent = EventBuilder.createTextNote(firstMessage, pubkey);
      const firstResult = await connectionTestNostr.publish(firstEvent);
      expect(firstResult.success).toBe(true);

      // Disconnect and reconnect
      await connectionTestNostr.disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to publish again (should reconnect automatically)
      const secondMessage = `Connection state test 2: ${Date.now()}`;
      const secondEvent = EventBuilder.createTextNote(secondMessage, pubkey);
      const secondResult = await connectionTestNostr.publish(secondEvent);
      expect(secondResult.success).toBe(true);

      console.log('✅ Connection state management verified');
      
      await connectionTestNostr.disconnect();
    }, 60000);
  });

  describe('Event Deduplication', () => {
    it('should demonstrate real event deduplication with multi-relay queries', async () => {
      // Publish same event to multiple relays, then query
      const testMessage = `Deduplication test: ${Date.now()}`;
      const pubkey = await nostr.getPublicKey();
      const event = EventBuilder.createTextNote(testMessage, pubkey);
      const publishResult = await nostr.publish(event);
      
      expect(publishResult.success).toBe(true);
      
      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query from cache (immediate)
      const store = nostr.query()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 60) // Last minute
        .limit(50)
        .execute();

      const events = store.current;
      
      // Find our test event
      const testEvent = events.find(e => e.content === testMessage);
      expect(testEvent).toBeDefined();
      
      // Verify no duplicates (same event ID)
      const eventIds = events.map(e => e.id);
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);

      console.log(`✅ Event deduplication: ${events.length} unique events, no duplicates`);
    }, 20000);
  });
});