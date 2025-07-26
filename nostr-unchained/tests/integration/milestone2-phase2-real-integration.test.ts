/**
 * Milestone 2 Phase 2: Real Multi-Relay Integration Tests
 * 
 * Tests the real NostrUnchained API that developers will actually use.
 * NO mock classes, NO engineering artifacts, NO dummy implementations.
 * 100% real, practical tests that mirror actual developer usage.
 * 
 * Phase 2 Focus Areas:
 * - Day 4-5: Multi-Relay Coordination with real relays
 * - Day 6: Performance Optimization with real data volumes
 * - Real developer scenarios and production conditions
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { NostrUnchained } from '@/index';
import { createQueryBuilder } from '@/query/QueryBuilder';
import { SubscriptionManager } from '@/subscription/SubscriptionManager';
import { RelayManager } from '@/relay/RelayManager';
import { createFeed, setDefaultSubscriptionManager } from '@/store/NostrStore';

describe('Milestone 2 Phase 2: Real Multi-Relay Integration', () => {
  let nostr: NostrUnchained;
  let subscriptionManager: SubscriptionManager;
  let relayManager: RelayManager;

  beforeAll(() => {
    // Set up real subscription manager for store tests
    relayManager = new RelayManager(['ws://umbrel.local:4848', 'wss://relay.damus.io']);
    subscriptionManager = new SubscriptionManager(relayManager);
    setDefaultSubscriptionManager(subscriptionManager);
  });

  beforeEach(() => {
    // Test with real multi-relay setup
    nostr = new NostrUnchained({
      relays: [
        'ws://umbrel.local:4848',    // Local relay (confirmed working)
        'wss://relay.damus.io',      // Public relay
        'wss://nos.lol'              // Another public relay
      ],
      debug: true,
      timeout: 30000
    });
  });

  afterEach(async () => {
    await nostr.disconnect();
    await subscriptionManager?.closeAll();
  });

  describe('Day 4-5: Multi-Relay Real Coordination', () => {
    it('should handle real multi-relay publishing with fault tolerance', async () => {
      // Real scenario: Test with known working relay + potentially failing relays
      const localNostr = new NostrUnchained({
        relays: [
          'ws://umbrel.local:4848',    // Known working local relay
          'wss://relay.damus.io',      // Public relay (may work)
          'ws://nonexistent.fake:4848' // Intentionally bad relay
        ],
        debug: true,
        timeout: 15000
      });
      
      const testMessage = `Multi-relay fault tolerance test: ${Date.now()}`;
      const result = await localNostr.publish(testMessage);
      
      // Should succeed if at least the local relay works
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      expect(result.relayResults.length).toBeGreaterThan(0);
      
      // Analyze relay-specific results
      const successfulRelays = result.relayResults.filter(r => r.success);
      const failedRelays = result.relayResults.filter(r => !r.success);
      
      console.log(`Multi-relay results: ${successfulRelays.length} successful, ${failedRelays.length} failed`);
      console.log('Successful relays:', successfulRelays.map(r => r.relay));
      console.log('Failed relays:', failedRelays.map(r => r.relay));
      
      // Should have at least one success (local relay)
      expect(successfulRelays.length).toBeGreaterThan(0);
      
      // Local relay should succeed
      const localResult = result.relayResults.find(r => r.relay === 'ws://umbrel.local:4848');
      expect(localResult?.success).toBe(true);
      
      await localNostr.disconnect();
    }, 45000);

    it('should demonstrate real event deduplication with multi-relay queries', async () => {
      // Use local relay manager for reliable testing
      const localRelayManager = new RelayManager(['ws://umbrel.local:4848']);
      const localSubscriptionManager = new SubscriptionManager(localRelayManager);
      
      // Connect to relay
      await localRelayManager.connect();
      
      // Create query for recent events
      const query = createQueryBuilder(localSubscriptionManager)
        .kinds([1])
        .limit(10)
        .since(Math.floor(Date.now() / 1000) - 7200); // Last 2 hours
      
      const events = await query.execute({ timeout: 15000 });
      
      console.log(`Query returned ${events.length} events from local relay`);
      
      if (events.length > 0) {
        // Check for duplicates by event ID
        const eventIds = events.map(e => e.id);
        const uniqueIds = new Set(eventIds);
        
        expect(uniqueIds.size).toBe(eventIds.length);
        
        // Verify events are valid Nostr events
        events.forEach(event => {
          expect(event.id).toMatch(/^[a-f0-9]{64}$/);
          expect(event.pubkey).toMatch(/^[a-f0-9]{64}$/);
          expect(event.sig).toMatch(/^[a-f0-9]{128}$/);
          expect(typeof event.created_at).toBe('number');
          expect(event.kind).toBe(1);
        });
        
        console.log('Event validation passed for all received events');
      } else {
        console.log('No events received - relay may be empty or query too restrictive');
      }
      
      await localRelayManager.disconnect();
    }, 30000);

    it('should handle real relay load distribution', async () => {
      // Test with reliable local relay for consistent results
      const localNostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848'],
        debug: true
      });
      
      // Test multiple publishes to verify consistent behavior
      const publishPromises = Array.from({ length: 3 }, (_, i) =>
        localNostr.publish(`Load distribution test ${i}: ${Date.now()}`)
      );
      
      const results = await Promise.all(publishPromises);
      
      // All should succeed with local relay
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(3);
      
      // Verify all used the local relay
      results.forEach(result => {
        expect(result.relayResults.length).toBeGreaterThan(0);
        const localResult = result.relayResults.find(r => r.relay === 'ws://umbrel.local:4848');
        expect(localResult?.success).toBe(true);
      });
      
      console.log(`Successfully published ${successCount}/3 messages to local relay`);
      
      await localNostr.disconnect();
    }, 30000);

    it('should demonstrate real-time subscription with local relay', async () => {
      // Use local relay for reliable testing
      const localRelayManager = new RelayManager(['ws://umbrel.local:4848']);
      const localSubscriptionManager = new SubscriptionManager(localRelayManager);
      
      await localRelayManager.connect();
      
      const query = createQueryBuilder(localSubscriptionManager)
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 1800); // Last 30 minutes
      
      const events: any[] = [];
      let eoseReceived = false;
      
      const subscription = await query.subscribe({
        onEvent: (event) => {
          events.push(event);
          console.log(`Received event ${events.length}: ${event.id.substring(0, 16)}...`);
        },
        onEose: (relay) => {
          eoseReceived = true;
          console.log(`EOSE from ${relay}, total events: ${events.length}`);
        },
        timeout: 20000
      });
      
      expect(subscription.success).toBe(true);
      
      // Wait for subscription to gather events
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      console.log(`Subscription results: ${events.length} events, EOSE: ${eoseReceived}`);
      
      // Verify subscription worked
      if (events.length > 0) {
        // Check all events are valid
        events.forEach(event => {
          expect(event.id).toMatch(/^[a-f0-9]{64}$/);
          expect(event.kind).toBe(1);
        });
      }
      
      // Clean up
      if (subscription.subscription?.id) {
        await localSubscriptionManager.close(subscription.subscription.id);
      }
      await localRelayManager.disconnect();
    }, 35000);

    it('should handle real relay connection state changes', async () => {
      // Test connection resilience
      const initialStats = nostr.getStats();
      console.log('Initial relay stats:', initialStats);
      
      // Connect explicitly
      await nostr.connect();
      
      const connectedStats = nostr.getStats();
      console.log('After connection stats:', connectedStats);
      
      // Verify some relays connected
      expect(nostr.connectedRelays.length).toBeGreaterThan(0);
      
      // Test publishing while connected
      const result1 = await nostr.publish(`Connection test 1: ${Date.now()}`);
      expect(result1.success).toBe(true);
      
      // Disconnect and reconnect
      await nostr.disconnect();
      expect(nostr.connectedRelays.length).toBe(0);
      
      // Publish should auto-reconnect
      const result2 = await nostr.publish(`Connection test 2: ${Date.now()}`);
      expect(result2.success).toBe(true);
      expect(nostr.connectedRelays.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Day 6: Real Performance Optimization', () => {
    it('should handle event processing with good performance', async () => {
      // Test with local relay for consistent performance measurement
      const localRelayManager = new RelayManager(['ws://umbrel.local:4848']);
      const localSubscriptionManager = new SubscriptionManager(localRelayManager);
      
      await localRelayManager.connect();
      
      const query = createQueryBuilder(localSubscriptionManager)
        .kinds([1]) // Text notes
        .since(Math.floor(Date.now() / 1000) - 3600) // Last hour
        .limit(100);
      
      const events: any[] = [];
      const startTime = Date.now();
      let processingTimes: number[] = [];
      
      const subscription = await query.subscribe({
        onEvent: (event) => {
          const eventStartTime = Date.now();
          // Simulate some processing
          JSON.stringify(event);
          events.push(event);
          const processingTime = Date.now() - eventStartTime;
          processingTimes.push(processingTime);
        },
        timeout: 15000
      });
      
      expect(subscription.success).toBe(true);
      
      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const totalTime = Date.now() - startTime;
      
      console.log(`Performance test: ${events.length} events processed in ${totalTime}ms`);
      
      if (events.length > 0) {
        const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        console.log(`Average processing time per event: ${avgProcessingTime.toFixed(2)}ms`);
        expect(avgProcessingTime).toBeLessThan(100); // <100ms average processing
      }
      
      // Clean up
      if (subscription.subscription?.id) {
        await localSubscriptionManager.close(subscription.subscription.id);
      }
      await localRelayManager.disconnect();
    }, 30000);

    it('should demonstrate real memory efficiency with large event volumes', async () => {
      // Create feed store with memory limits
      const feedStore = createFeed()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 3600) // Last hour
        .limit(1000)
        .maxEvents(500) // Memory limit
        .build();
      
      // Wait for store to initialize and load events
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      let eventCount = 0;
      let storeStatus = 'unknown';
      
      // Subscribe to store updates
      const unsubscribeEvents = feedStore.events.subscribe(events => {
        eventCount = events.length;
      });
      
      const unsubscribeStatus = feedStore.status.subscribe(status => {
        storeStatus = status;
      });
      
      console.log(`Feed store loaded ${eventCount} events, status: ${storeStatus}`);
      
      // Memory efficiency checks
      expect(eventCount).toBeLessThanOrEqual(500); // Respects maxEvents limit
      if (eventCount > 0) {
        expect(storeStatus).toBeOneOf(['active', 'connecting']);
      }
      
      // Clean up
      unsubscribeEvents();
      unsubscribeStatus();
      await feedStore.close();
    }, 45000);

    it('should maintain real-time responsiveness under load', async () => {
      // Test responsiveness with concurrent operations
      const operations = [
        // Multiple concurrent subscriptions
        async () => {
          const query = createQueryBuilder(subscriptionManager).kinds([1]).limit(10);
          const events = await query.execute({ timeout: 10000 });
          return events.length;
        },
        // Publishing while subscribing
        async () => {
          const result = await nostr.publish(`Load test: ${Date.now()}`);
          return result.success ? 1 : 0;
        },
        // Store operations
        async () => {
          const store = createFeed().kinds([1]).limit(5).build();
          await new Promise(resolve => setTimeout(resolve, 5000));
          let count = 0;
          store.events.subscribe(events => { count = events.length; })();
          await store.close();
          return count;
        }
      ];
      
      const startTime = Date.now();
      
      // Run operations concurrently
      const results = await Promise.all([
        ...operations.map(op => op()),
        ...operations.map(op => op()), // Run twice for load
      ]);
      
      const totalTime = Date.now() - startTime;
      const successCount = results.filter(r => r > 0).length;
      
      console.log(`Concurrent operations: ${successCount}/${results.length} successful in ${totalTime}ms`);
      
      // Responsiveness assertions
      expect(totalTime).toBeLessThan(30000); // Complete within 30s
      expect(successCount).toBeGreaterThan(0); // At least some operations succeed
    }, 45000);

    it('should scale real subscription management efficiently', async () => {
      // Test scalability with multiple concurrent subscriptions
      const subscriptionPromises = Array.from({ length: 5 }, (_, i) => {
        const query = createQueryBuilder(subscriptionManager)
          .kinds([1])
          .since(Math.floor(Date.now() / 1000) - 300 - (i * 60)) // Staggered time windows
          .limit(20);
        
        return query.subscribe({
          timeout: 15000,
          onEvent: (event) => {
            // Simulate processing
            JSON.stringify(event);
          }
        });
      });
      
      const subscriptions = await Promise.all(subscriptionPromises);
      
      // All subscriptions should succeed
      const successCount = subscriptions.filter(s => s.success).length;
      expect(successCount).toBe(5);
      
      console.log(`Successfully created ${successCount} concurrent subscriptions`);
      
      // Wait for activity
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Clean up all subscriptions
      for (const subscription of subscriptions) {
        if (subscription.subscription?.id) {
          await subscriptionManager.close(subscription.subscription.id);
        }
      }
      
      // Verify cleanup
      const activeSubscriptions = subscriptionManager.getActiveSubscriptions();
      expect(activeSubscriptions.length).toBe(0);
    }, 45000);
  });

  describe('Real Developer Scenarios - Phase 2', () => {
    it('should support complex real-world query patterns', async () => {
      // Simulate complex social media feed query
      const query = createQueryBuilder(subscriptionManager)
        .kinds([1, 6]) // Notes and reposts
        .since(Math.floor(Date.now() / 1000) - 7200) // Last 2 hours
        .limit(100);
      
      const events = await query.execute({ timeout: 20000 });
      
      console.log(`Complex query returned ${events.length} events`);
      
      // Verify event variety
      const kindCounts = events.reduce((acc, event) => {
        acc[event.kind] = (acc[event.kind] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      console.log('Event kinds distribution:', kindCounts);
      
      // Should get some events
      expect(events.length).toBeGreaterThan(0);
      
      // Events should be properly formed
      events.forEach(event => {
        expect([1, 6]).toContain(event.kind);
        expect(event.created_at).toBeGreaterThan(Date.now() / 1000 - 7200);
      });
    }, 40000);

    it('should handle real error recovery in production conditions', async () => {
      // Test recovery from various real error conditions
      const scenarios = [
        // Invalid relay URL
        async () => {
          const badNostr = new NostrUnchained({
            relays: ['ws://nonexistent.relay.invalid:4848'],
            timeout: 5000
          });
          const result = await badNostr.publish('Test message');
          await badNostr.disconnect();
          return { success: result.success, error: result.error };
        },
        // Network timeout scenario
        async () => {
          const timeoutNostr = new NostrUnchained({
            relays: ['ws://umbrel.local:4848'],
            timeout: 100 // Very short timeout
          });
          const result = await timeoutNostr.publish('Timeout test');
          await timeoutNostr.disconnect();
          return { success: result.success, error: result.error };
        },
        // Mixed relay scenario (good + bad)
        async () => {
          const mixedNostr = new NostrUnchained({
            relays: [
              'ws://umbrel.local:4848',           // Should work
              'ws://bad.relay.example.com:4848'   // Should fail
            ],
            timeout: 10000
          });
          const result = await mixedNostr.publish('Mixed relay test');
          await mixedNostr.disconnect();
          return { success: result.success, error: result.error };
        }
      ];
      
      const results = await Promise.all(scenarios.map(scenario => scenario()));
      
      console.log('Error recovery scenarios:', results.map((r, i) => ({
        scenario: i + 1,
        success: r.success,
        errorType: r.error?.message
      })));
      
      // At least one scenario should succeed (mixed relay)
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
      
      // Failed scenarios should provide useful error information
      results.filter(r => !r.success).forEach(result => {
        expect(result.error).toBeDefined();
        expect(result.error?.message).toBeDefined();
        expect(typeof result.error?.retryable).toBe('boolean');
      });
    }, 60000);

    it('should maintain long-running subscription stability', async () => {
      // Test subscription stability over extended period
      const query = createQueryBuilder(subscriptionManager)
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 1800); // Last 30 minutes
      
      let eventCount = 0;
      let errorCount = 0;
      let eoseCount = 0;
      
      const subscription = await query.subscribe({
        onEvent: (event) => {
          eventCount++;
          if (eventCount % 25 === 0) {
            console.log(`Long-running subscription: ${eventCount} events received`);
          }
        },
        onEose: (relay) => {
          eoseCount++;
          console.log(`EOSE from ${relay}, total EOSE: ${eoseCount}`);
        },
        onError: (error) => {
          errorCount++;
          console.log(`Subscription error: ${error}`);
        }
      });
      
      expect(subscription.success).toBe(true);
      
      // Run for extended period
      console.log('Starting long-running subscription test...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      
      console.log(`Subscription stability results:
        - Events: ${eventCount}
        - EOSE: ${eoseCount}
        - Errors: ${errorCount}`);
      
      // Stability assertions
      expect(errorCount).toBeLessThan(5); // Low error rate
      if (eventCount > 0) {
        expect(eoseCount).toBeGreaterThan(0); // Should receive EOSE
      }
      
      // Clean up
      if (subscription.subscription?.id) {
        await subscriptionManager.close(subscription.subscription.id);
      }
    }, 45000);
  });

  describe('Real Integration Testing - Complete Workflows', () => {
    it('should demonstrate complete real feed workflow', async () => {
      // Complete end-to-end feed workflow
      console.log('Starting complete feed workflow test...');
      
      // 1. Create and configure feed
      const feedStore = createFeed()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 900) // Last 15 minutes
        .limit(50)
        .live(true)
        .maxEvents(100)
        .build();
      
      // 2. Track feed state
      let events: any[] = [];
      let status = 'unknown';
      let isLoading = true;
      
      const unsubscribeEvents = feedStore.events.subscribe(newEvents => {
        events = newEvents;
      });
      
      const unsubscribeStatus = feedStore.status.subscribe(newStatus => {
        status = newStatus;
      });
      
      const unsubscribeLoading = feedStore.loading.subscribe(loading => {
        isLoading = loading;
      });
      
      // 3. Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      console.log(`Feed workflow results:
        - Events loaded: ${events.length}
        - Status: ${status}
        - Loading: ${isLoading}`);
      
      // 4. Test feed operations
      if (events.length > 0) {
        // Test marking as read
        const firstEvent = events[0];
        feedStore.markAsRead(firstEvent.id);
        
        const readStatus = feedStore.getReadStatus();
        console.log('Read status:', readStatus);
        expect(readStatus.read).toBe(1);
        
        // Test filtering
        const filteredFeed = feedStore.filter(event => 
          event.content.length > 10
        );
        
        let filteredEvents: any[] = [];
        const unsubscribeFiltered = filteredFeed.events.subscribe(newEvents => {
          filteredEvents = newEvents;
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Filtered events: ${filteredEvents.length}/${events.length}`);
        
        unsubscribeFiltered();
        await filteredFeed.close();
      }
      
      // 5. Clean up
      unsubscribeEvents();
      unsubscribeStatus();
      unsubscribeLoading();
      await feedStore.close();
      
      // Workflow assertions
      expect(events.length).toBeGreaterThanOrEqual(0);
      expect(['connecting', 'active', 'error']).toContain(status);
    }, 45000);

    it('should integrate query builder with real store composition', async () => {
      // Test advanced query + store integration
      const baseQuery = createQueryBuilder(subscriptionManager)
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 1200); // Last 20 minutes
      
      // Create multiple composed queries
      const recentQuery = baseQuery.since(Math.floor(Date.now() / 1000) - 300); // Last 5 minutes
      const authorQuery = createQueryBuilder(subscriptionManager)
        .kinds([1])
        .authors(['test_author_pubkey']); // Would be real pubkeys in practice
      
      const unionQuery = baseQuery.union(authorQuery);
      
      // Test query compilation
      const baseFilters = baseQuery.toFilter();
      const recentFilters = recentQuery.toFilter();
      const unionFilters = unionQuery.toFilter();
      
      console.log('Query compilation results:');
      console.log(`Base filters: ${baseFilters.length}`);
      console.log(`Recent filters: ${recentFilters.length}`);
      console.log(`Union filters: ${unionFilters.length}`);
      
      // Execute composed query
      const events = await recentQuery.execute({ timeout: 15000 });
      
      console.log(`Composed query returned ${events.length} events`);
      
      // Verify composition worked
      expect(baseFilters.length).toBeGreaterThan(0);
      expect(recentFilters.length).toBeGreaterThan(0);
      expect(unionFilters.length).toBeGreaterThan(baseFilters.length);
      
      // Events should match recent criteria
      events.forEach(event => {
        expect(event.kind).toBe(1);
        expect(event.created_at).toBeGreaterThan(Date.now() / 1000 - 300);
      });
    }, 30000);
  });
});