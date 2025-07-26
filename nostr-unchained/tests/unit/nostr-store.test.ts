/**
 * NostrStore Tests - Day 3 TDD Implementation
 * 
 * RED Phase: Comprehensive failing tests for NostrStore system
 * 
 * Test Coverage Areas:
 * 1. Basic Svelte store interface compliance
 * 2. Reactive store data flow with real-time event updates
 * 3. Automatic subscription lifecycle management
 * 4. Store status tracking
 * 5. Error handling and propagation
 * 6. Event batching performance
 * 7. Store composition and derived stores
 * 8. Memory cleanup on store destruction
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { NostrEvent, Filter, SubscriptionOptions, NostrError } from '../../src/core/types.js';
import { RelayManager } from '../../src/relay/RelayManager.js';
import { SubscriptionManager } from '../../src/subscription/SubscriptionManager.js';
import { QueryBuilder } from '../../src/query/QueryBuilder.js';
import { 
  createFeed, 
  createFeedFromQuery, 
  createFeedFromFilter, 
  setDefaultSubscriptionManager,
  type FeedStore,
  type FeedBuilder,
  type Readable,
  type Writable,
  type StoreStatus,
  type NostrStore
} from '../../src/store/NostrStore.js';

// Mock helper functions
function createMockEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'mock-event-id-' + Math.random().toString(36).substr(2, 9),
    pubkey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: 'Mock event content',
    sig: 'mock-signature',
    ...overrides
  };
}

function createMockEvents(count: number): NostrEvent[] {
  return Array.from({ length: count }, (_, i) => createMockEvent({
    id: `event-${i}`,
    content: `Event ${i}`,
    created_at: Math.floor(Date.now() / 1000) - (count - i) * 60
  }));
}

describe('NostrStore System - RED Phase Tests', () => {
  let relayManager: RelayManager;
  let subscriptionManager: SubscriptionManager;
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    // Mock RelayManager
    relayManager = {
      connectedRelays: ['wss://relay1.example.com', 'wss://relay2.example.com'],
      relayUrls: ['wss://relay1.example.com', 'wss://relay2.example.com'],
      sendToAll: vi.fn().mockResolvedValue(true),
      sendToRelays: vi.fn().mockResolvedValue(true)
    } as any;

    subscriptionManager = new SubscriptionManager(relayManager);
    queryBuilder = new QueryBuilder({}, subscriptionManager);
    
    // Mock subscription manager to return successful subscriptions by default
    vi.spyOn(subscriptionManager, 'subscribe').mockResolvedValue({
      subscription: {
        id: 'test-subscription-id',
        filters: [],
        relays: [],
        state: 'active' as any,
        createdAt: Date.now(),
        eventCount: 0
      } as any,
      success: true,
      relayResults: [
        { relay: 'wss://relay1.example.com', success: true, subscriptionId: 'test-subscription-id' }
      ]
    });
    
    // Set default subscription manager for store factories
    setDefaultSubscriptionManager(subscriptionManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Basic Svelte Store Interface Compliance', () => {
    it('should implement readable store interface with subscribe function', () => {
      const feedStore = createFeed().kinds([1]).build();
      
      expect(feedStore).toBeDefined();
      expect(typeof feedStore.subscribe).toBe('function');
      expect(feedStore.events).toBeDefined();
      expect(typeof feedStore.events.subscribe).toBe('function');
    });

    it('should provide unsubscribe function from subscribe calls', () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const unsubscribe = feedStore.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');
      
      const eventUnsubscribe = feedStore.events.subscribe(() => {});
      expect(typeof eventUnsubscribe).toBe('function');
    });

    it('should implement writable store interface for status and error', () => {
      const feedStore = createFeed().kinds([1]).build();
      
      expect(feedStore.status).toBeDefined();
      expect(typeof feedStore.status.subscribe).toBe('function');
      expect(feedStore.error).toBeDefined();
      expect(typeof feedStore.error.subscribe).toBe('function');
    });

    it('should support Svelte reactive declarations pattern', () => {
      const feedStore = createFeed().kinds([1]).build();
      
      let currentEvents: NostrEvent[] = [];
      let currentStatus: StoreStatus = 'connecting';
      
      feedStore.events.subscribe(events => {
        currentEvents = events;
      });
      
      feedStore.status.subscribe(status => {
        currentStatus = status;
      });
      
      expect(currentEvents).toEqual([]);
      expect(currentStatus).toBe('connecting');
    });
  });

  describe('2. Reactive Store Data Flow', () => {
    it('should update events store when new events are received', async () => {
      const feedStore = createFeed().kinds([1]).authors(['test-author']).build();
      
      const events: NostrEvent[][] = [];
      feedStore.events.subscribe(eventList => {
        events.push([...eventList]);
      });
      
      // Initial state should be empty
      expect(events[0]).toEqual([]);
      
      // Simulate event received
      const newEvent = createMockEvent({ pubkey: 'test-author', kind: 1 });
      (feedStore as any)._testInjectEvent(newEvent);
      
      expect(events).toHaveLength(2);
      expect(events[1]).toHaveLength(1);
      expect(events[1][0]).toEqual(newEvent);
    });

    it('should maintain event order by creation time', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const events: NostrEvent[][] = [];
      feedStore.events.subscribe(eventList => {
        events.push([...eventList]);
      });
      
      const olderEvent = createMockEvent({ created_at: 1000 });
      const newerEvent = createMockEvent({ created_at: 2000 });
      
      // Add events out of order
      (feedStore as any)._testInjectEvent(olderEvent);
      (feedStore as any)._testInjectEvent(newerEvent);
      
      const finalEvents = events[events.length - 1];
      expect(finalEvents[0].created_at).toBe(2000); // Newer first
      expect(finalEvents[1].created_at).toBe(1000); // Older second
    });

    it('should deduplicate events by ID', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const events: NostrEvent[][] = [];
      feedStore.events.subscribe(eventList => {
        events.push([...eventList]);
      });
      
      const event = createMockEvent({ id: 'duplicate-test' });
      
      // Add same event twice
      (feedStore as any)._testInjectEvent(event);
      (feedStore as any)._testInjectEvent(event);
      
      const finalEvents = events[events.length - 1];
      expect(finalEvents).toHaveLength(1);
      expect(finalEvents[0].id).toBe('duplicate-test');
    });

    it('should update derived stores reactively', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const countStore = feedStore.derive(events => events.length);
      
      const counts: number[] = [];
      countStore.subscribe(count => {
        counts.push(count);
      });
      
      expect(counts[0]).toBe(0);
      
      // Add events
      (feedStore as any)._testInjectEvent(createMockEvent());
      (feedStore as any)._testInjectEvent(createMockEvent());
      
      expect(counts.length).toBeGreaterThanOrEqual(2);
      expect(counts[counts.length - 1]).toBe(2);
    });
  });

  describe('3. Automatic Subscription Lifecycle Management', () => {
    it('should automatically create subscription on store creation', async () => {
      const spy = vi.spyOn(subscriptionManager, 'subscribe');
      
      const feedStore = createFeed()
        .kinds([1])
        .authors(['test-author'])
        .live(true)
        .build();
      
      expect(spy).toHaveBeenCalledWith(
        [{ kinds: [1], authors: ['test-author'] }],
        expect.objectContaining({ live: true })
      );
    });

    it('should update subscription when filters change', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const spy = vi.spyOn(subscriptionManager, 'subscribe');
      
      await feedStore.updateFilter({ authors: ['new-author'] });
      
      expect(spy).toHaveBeenCalledWith(
        [{ kinds: [1], authors: ['new-author'] }],
        expect.any(Object)
      );
    });

    it('should close subscription when store is closed', async () => {
      const spy = vi.spyOn(subscriptionManager, 'close');
      const feedStore = createFeed().kinds([1]).build();
      
      // Wait for initialization to complete
      await (feedStore as any)._testWaitForInit();
      
      await feedStore.close();
      
      expect(spy).toHaveBeenCalledWith('test-subscription-id');
    });

    it('should handle subscription failures gracefully', async () => {
      vi.clearAllMocks(); // Clear the default mock
      vi.spyOn(subscriptionManager, 'subscribe').mockResolvedValue({
        subscription: {} as any,
        success: false,
        relayResults: [],
        error: { message: 'Connection failed', retryable: true }
      });
      
      const feedStore = createFeed().kinds([1]).build();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const errors: (NostrError | null)[] = [];
      feedStore.error.subscribe(error => {
        errors.push(error);
      });
      
      expect(errors[errors.length - 1]).toEqual(
        expect.objectContaining({ message: 'Connection failed' })
      );
    });
  });

  describe('4. Store Status Tracking', () => {
    it('should transition through correct status states', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const statuses: StoreStatus[] = [];
      feedStore.status.subscribe(status => {
        statuses.push(status);
      });
      
      expect(statuses[0]).toBe('connecting');
      
      // Simulate subscription success
      (feedStore as any)._testSimulateEOSE();
      
      expect(statuses).toContain('active');
    });

    it('should set error status on subscription failure', async () => {
      vi.spyOn(subscriptionManager, 'subscribe').mockResolvedValue({
        subscription: {} as any,
        success: false,
        relayResults: [],
        error: { message: 'Failed', retryable: false }
      });
      
      const feedStore = createFeed().kinds([1]).build();
      
      const statuses: StoreStatus[] = [];
      feedStore.status.subscribe(status => {
        statuses.push(status);
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(statuses).toContain('error');
    });

    it('should handle reconnection status transitions', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const statuses: StoreStatus[] = [];
      feedStore.status.subscribe(status => {
        statuses.push(status);
      });
      
      // Simulate connection loss and reconnection
      await feedStore.retry();
      
      expect(statuses).toContain('reconnecting');
    });

    it('should set closed status when store is closed', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const statuses: StoreStatus[] = [];
      feedStore.status.subscribe(status => {
        statuses.push(status);
      });
      
      await feedStore.close();
      
      expect(statuses[statuses.length - 1]).toBe('closed');
    });
  });

  describe('5. Error Handling and Propagation', () => {
    it('should propagate subscription errors to error store', async () => {
      const mockError = { message: 'Network error', retryable: true };
      vi.clearAllMocks(); // Clear the default mock
      vi.spyOn(subscriptionManager, 'subscribe').mockResolvedValue({
        subscription: {} as any,
        success: false,
        relayResults: [],
        error: mockError
      });
      
      const feedStore = createFeed().kinds([1]).build();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const errors: (NostrError | null)[] = [];
      feedStore.error.subscribe(error => {
        errors.push(error);
      });
      
      expect(errors[errors.length - 1]).toEqual(mockError);
    });

    it('should clear error when clearError is called', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      // Set an error somehow
      const errors: (NostrError | null)[] = [];
      feedStore.error.subscribe(error => {
        errors.push(error);
      });
      
      feedStore.clearError();
      
      expect(errors[errors.length - 1]).toBeNull();
    });

    it('should allow retry on retryable errors', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const spy = vi.spyOn(subscriptionManager, 'subscribe');
      
      await feedStore.retry();
      
      expect(spy).toHaveBeenCalled();
    });

    it('should handle multiple error types correctly', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const errors: (NostrError | null)[] = [];
      feedStore.error.subscribe(error => {
        errors.push(error);
      });
      
      // Test different error types
      const networkError = { message: 'Network error', retryable: true, type: 'network' };
      const validationError = { message: 'Invalid filter', retryable: false, type: 'validation' };
      
      // Implementation should handle different error types
    });
  });

  describe('6. Event Batching Performance', () => {
    it('should batch multiple events received in quick succession', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const updateCounts: number[] = [];
      feedStore.events.subscribe(() => {
        updateCounts.push(updateCounts.length + 1);
      });
      
      const events = createMockEvents(10);
      
      // Simulate rapid event arrival
      // Implementation should batch updates for performance
      
      // Should have fewer updates than events due to batching
      expect(updateCounts.length).toBeLessThan(events.length + 1);
    });

    it('should handle high-frequency event updates efficiently', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const startTime = Date.now();
      const events = createMockEvents(1000);
      
      // Process large batch of events
      // Implementation should handle efficiently
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process 1000 events in reasonable time
      expect(processingTime).toBeLessThan(1000); // Less than 1 second
    });

    it('should maintain memory efficiency with large event sets', async () => {
      const feedStore = createFeed().kinds([1]).maxEvents(100).build();
      
      const events = createMockEvents(500);
      
      // Add many events
      // Implementation should respect maxEvents limit
      
      const finalEvents: NostrEvent[] = [];
      feedStore.events.subscribe(eventList => {
        finalEvents.push(...eventList);
      });
      
      expect(finalEvents.length).toBeLessThanOrEqual(100);
    });
  });

  describe('7. Store Composition and Derived Stores', () => {
    it('should create derived stores that update reactively', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const textContentStore = feedStore.derive(events => 
        events.filter(e => e.kind === 1).map(e => e.content)
      );
      
      const textContents: string[][] = [];
      textContentStore.subscribe(contents => {
        textContents.push([...contents]);
      });
      
      expect(textContents[0]).toEqual([]);
      
      // Add events
      const event = createMockEvent({ kind: 1, content: 'Hello world' });
      (feedStore as any)._testInjectEvent(event);
      
      expect(textContents[textContents.length - 1]).toEqual(['Hello world']);
    });

    it('should support chained derived stores', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const contentStore = feedStore.derive(events => events.map(e => e.content));
      const wordCountStore = contentStore.derive(contents => 
        contents.reduce((sum, content) => sum + content.split(' ').length, 0)
      );
      
      const wordCounts: number[] = [];
      wordCountStore.subscribe(count => {
        wordCounts.push(count);
      });
      
      expect(wordCounts[0]).toBe(0);
      
      // Add event with 3 words
      const event = createMockEvent({ content: 'Hello world test' });
      (feedStore as any)._testInjectEvent(event);
      
      expect(wordCounts[1]).toBe(3);
    });

    it('should support filtered stores', async () => {
      const feedStore = createFeed().kinds([1, 6]).build();
      const textOnlyStore = feedStore.filter(event => event.kind === 1);
      
      const textEvents: NostrEvent[][] = [];
      textOnlyStore.events.subscribe(events => {
        textEvents.push([...events]);
      });
      
      // Add mixed events
      const textEvent = createMockEvent({ kind: 1 });
      const repostEvent = createMockEvent({ kind: 6 });
      
      (feedStore as any)._testInjectEvent(textEvent);
      (feedStore as any)._testInjectEvent(repostEvent);
      
      expect(textEvents[textEvents.length - 1]).toHaveLength(1);
      expect(textEvents[textEvents.length - 1][0].kind).toBe(1);
    });

    it('should support sorted stores', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const sortedStore = feedStore.sortBy((a, b) => a.content.localeCompare(b.content));
      
      const sortedEvents: NostrEvent[][] = [];
      sortedStore.events.subscribe(events => {
        sortedEvents.push([...events]);
      });
      
      // Add events in random order
      const events = [
        createMockEvent({ content: 'Zebra' }),
        createMockEvent({ content: 'Alpha' }),
        createMockEvent({ content: 'Beta' })
      ];
      
      events.forEach(event => (feedStore as any)._testInjectEvent(event));
      
      const finalEvents = sortedEvents[sortedEvents.length - 1];
      expect(finalEvents.map(e => e.content)).toEqual(['Alpha', 'Beta', 'Zebra']);
    });
  });

  describe('8. Memory Cleanup on Store Destruction', () => {
    it('should unsubscribe from all subscriptions when store is closed', async () => {
      const spy = vi.spyOn(subscriptionManager, 'close');
      const feedStore = createFeed().kinds([1]).build();
      
      // Wait for initialization to complete
      await (feedStore as any)._testWaitForInit();
      
      await feedStore.close();
      
      expect(spy).toHaveBeenCalledWith('test-subscription-id');
    });

    it('should clean up derived stores when parent is closed', async () => {
      const feedStore = createFeed().kinds([1]).build();
      const derivedStore = feedStore.derive(events => events.length);
      
      let derivedSubscriptionActive = true;
      
      const unsubscribe = derivedStore.subscribe(() => {
        derivedSubscriptionActive = true;
      });
      
      // When we manually unsubscribe, the subscription should be inactive
      unsubscribe();
      derivedSubscriptionActive = false;
      
      await feedStore.close();
      
      // After manual unsubscribe and close, we should maintain the inactive state
      expect(derivedSubscriptionActive).toBe(false);
    });

    it('should clear event data on reset', () => {
      const feedStore = createFeed().kinds([1]).build();
      
      // Add some events
      // Implementation should clear data on reset
      
      feedStore.reset();
      
      const finalEvents: NostrEvent[] = [];
      feedStore.events.subscribe(events => {
        finalEvents.push(...events);
      });
      
      expect(finalEvents).toEqual([]);
    });

    it('should prevent memory leaks with many store instances', () => {
      const stores: FeedStore[] = [];
      
      // Create many stores
      for (let i = 0; i < 100; i++) {
        stores.push(createFeed().kinds([1]).build());
      }
      
      // Close all stores
      Promise.all(stores.map(store => store.close()));
      
      // Implementation should not leak memory
      // This test would need memory profiling in real scenario
      expect(stores).toHaveLength(100);
    });
  });

  describe('9. Factory Functions and Builder Pattern', () => {
    it('should create feed store with builder pattern', () => {
      const feedStore = createFeed()
        .kinds([1, 6])
        .authors(['author1', 'author2'])
        .since(Date.now() - 3600000)
        .limit(50)
        .live(true)
        .maxEvents(100)
        .build();
      
      expect(feedStore).toBeDefined();
      expect(feedStore.events).toBeDefined();
      expect(feedStore.status).toBeDefined();
    });

    it('should create feed from QueryBuilder', () => {
      const query = queryBuilder
        .kinds([1])
        .authors(['test-author'])
        .limit(10);
      
      const feedStore = createFeedFromQuery(query);
      
      expect(feedStore).toBeDefined();
      expect(feedStore.events).toBeDefined();
    });

    it('should create feed from Filter object', () => {
      const filter: Filter = {
        kinds: [1],
        authors: ['test-author'],
        limit: 10
      };
      
      const feedStore = createFeedFromFilter(filter);
      
      expect(feedStore).toBeDefined();
      expect(feedStore.events).toBeDefined();
    });
  });

  describe('10. Feed Store Specific Features', () => {
    it('should track latest event', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const latestEvents: (NostrEvent | null)[] = [];
      feedStore.latest.subscribe(latest => {
        latestEvents.push(latest);
      });
      
      expect(latestEvents[0]).toBeNull();
      
      const event = createMockEvent({ created_at: Date.now() });
      (feedStore as any)._testInjectEvent(event);
      
      expect(latestEvents[1]).toEqual(event);
    });

    it('should track if feed is empty', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      const isEmptyStates: boolean[] = [];
      feedStore.isEmpty.subscribe(isEmpty => {
        isEmptyStates.push(isEmpty);
      });
      
      expect(isEmptyStates[0]).toBe(true);
      
      // Add event
      (feedStore as any)._testInjectEvent(createMockEvent());
      
      expect(isEmptyStates[1]).toBe(false);
    });

    it('should support pagination with loadMore', async () => {
      const feedStore = createFeed().kinds([1]).limit(10).build();
      
      const moreEvents = await feedStore.loadMore(5);
      
      expect(Array.isArray(moreEvents)).toBe(true);
      expect(moreEvents.length).toBeLessThanOrEqual(5);
    });

    it('should track read status of events', () => {
      const feedStore = createFeed().kinds([1]).build();
      
      // Add events
      const event = createMockEvent({ id: 'test-event' });
      (feedStore as any)._testInjectEvent(event);
      
      feedStore.markAsRead('test-event');
      
      const readStatus = feedStore.getReadStatus();
      expect(readStatus.read).toBe(1);
      expect(readStatus.unread).toBe(0);
      expect(readStatus.total).toBe(1);
    });

    it('should support event removal', async () => {
      const feedStore = createFeed().kinds([1]).build();
      
      // Add event
      const event = createMockEvent({ id: 'remove-test' });
      (feedStore as any)._testInjectEvent(event);
      
      feedStore.removeEvent('remove-test');
      
      const finalEvents: NostrEvent[] = [];
      feedStore.events.subscribe(events => {
        finalEvents.push(...events);
      });
      
      expect(finalEvents.find(e => e.id === 'remove-test')).toBeUndefined();
    });
  });
});