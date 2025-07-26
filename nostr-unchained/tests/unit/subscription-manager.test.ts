/**
 * Milestone 2: SubscriptionManager TDD Tests
 * 
 * RED Phase: Comprehensive failing tests for SubscriptionManager
 * Following TDD methodology - these tests define the MUST-HAVE functionality
 * 
 * Test Categories:
 * 1. Basic Subscription Creation & Lifecycle Management  
 * 2. Multi-Relay Coordination & State Management
 * 3. Event Filtering & Query Processing
 * 4. Error Handling & Recovery
 * 5. Performance Requirements (<100ms subscription creation)
 * 6. WebSocket Message Protocol (NIP-01)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { 
  Subscription, 
  SubscriptionState, 
  SubscriptionOptions, 
  SubscriptionResult,
  Filter,
  NostrEvent,
  RelayMessage
} from '@/core/types';

// Import the SubscriptionManager that we'll implement
import { SubscriptionManager } from '@/subscription/SubscriptionManager';
import { RelayManager } from '@/relay/RelayManager';

describe('Milestone 2: SubscriptionManager TDD Tests', () => {
  let subscriptionManager: SubscriptionManager;
  let mockRelayManager: RelayManager;
  let mockWebSocket: any;

  beforeEach(() => {
    // Create mock WebSocket for testing
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1, // OPEN
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock RelayManager with test relays
    mockRelayManager = new RelayManager([
      'ws://test-relay-1.com',
      'ws://test-relay-2.com'
    ], { debug: false });

    // Mock the connect method to avoid actual network calls
    vi.spyOn(mockRelayManager, 'connect').mockResolvedValue();
    vi.spyOn(mockRelayManager, 'connectedRelays', 'get').mockReturnValue([
      'ws://test-relay-1.com',
      'ws://test-relay-2.com'
    ]);

    // Create SubscriptionManager instance
    subscriptionManager = new SubscriptionManager(mockRelayManager);

    // Mock console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Cleanup all subscriptions
    await subscriptionManager.closeAll();
    vi.restoreAllMocks();
  });

  describe('Epic 1: Basic Subscription Creation', () => {
    it('should create subscription with unique ID under 100ms', async () => {
      const startTime = performance.now();

      const filter: Filter = { kinds: [1], limit: 10 };
      const result = await subscriptionManager.subscribe([filter]);

      const duration = performance.now() - startTime;

      // Performance requirement: <100ms
      expect(duration).toBeLessThan(100);

      // Success criteria
      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.subscription.id).toMatch(/^[a-f0-9]{16}$/); // 16-char hex ID
      expect(result.subscription.filters).toEqual([filter]);
      expect(result.subscription.state).toBe('pending');
      expect(result.subscription.createdAt).toBeGreaterThan(Date.now() - 1000);
      expect(result.subscription.eventCount).toBe(0);
    });

    it('should generate unique subscription IDs', async () => {
      const filter: Filter = { kinds: [1] };
      
      const result1 = await subscriptionManager.subscribe([filter]);
      const result2 = await subscriptionManager.subscribe([filter]);

      expect(result1.subscription.id).not.toBe(result2.subscription.id);
      expect(result1.subscription.id).toMatch(/^[a-f0-9]{16}$/);
      expect(result2.subscription.id).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should create subscription with multiple filters', async () => {
      const filters: Filter[] = [
        { kinds: [1], limit: 10 },
        { kinds: [0], authors: ['test-pubkey'] },
        { kinds: [3], since: Date.now() - 86400 }
      ];

      const result = await subscriptionManager.subscribe(filters);

      expect(result.success).toBe(true);
      expect(result.subscription.filters).toEqual(filters);
      expect(result.subscription.filters).toHaveLength(3);
    });

    it('should validate filter structure before creating subscription', async () => {
      const invalidFilters: any[] = [
        null,
        undefined,
        { invalid: 'filter' },
        { kinds: 'not-an-array' }
      ];

      for (const filter of invalidFilters) {
        const result = await subscriptionManager.subscribe([filter]);
        
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Invalid filter');
        expect(result.error?.retryable).toBe(false);
      }
    });
  });

  describe('Epic 2: Subscription Lifecycle Management', () => {
    it('should transition subscription states correctly', async () => {
      const filter: Filter = { kinds: [1], limit: 5 };
      const result = await subscriptionManager.subscribe([filter]);
      
      const subscription = result.subscription;
      
      // Initial state
      expect(subscription.state).toBe('pending');

      // Simulate activation (will be implemented in GREEN phase)
      await subscriptionManager.activate(subscription.id);
      expect(subscription.state).toBe('active');

      // Simulate EOSE
      await subscriptionManager.markEose(subscription.id, 'ws://test-relay-1.com');
      expect(subscription.state).toBe('eose');

      // Close subscription
      await subscriptionManager.close(subscription.id);
      expect(subscription.state).toBe('closed');
    });

    it('should handle subscription callbacks correctly', async () => {
      const onEventMock = vi.fn();
      const onEoseMock = vi.fn();
      const onCloseMock = vi.fn();

      const options: SubscriptionOptions = {
        onEvent: onEventMock,
        onEose: onEoseMock,
        onClose: onCloseMock
      };

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter], options);

      expect(result.subscription.onEvent).toBe(onEventMock);
      expect(result.subscription.onEose).toBe(onEoseMock);
      expect(result.subscription.onClose).toBe(onCloseMock);

      // Test callback invocation (will be implemented)
      const mockEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Date.now(),
        kind: 1,
        tags: [],
        content: 'test content',
        sig: 'test-signature'
      };

      await subscriptionManager.handleEvent(result.subscription.id, mockEvent);
      expect(onEventMock).toHaveBeenCalledWith(mockEvent);
    });

    it('should track event count and timing', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);
      const subscription = result.subscription;

      expect(subscription.eventCount).toBe(0);
      expect(subscription.lastEventAt).toBeUndefined();

      // Simulate receiving events
      const mockEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey', 
        created_at: Date.now(),
        kind: 1,
        tags: [],
        content: 'test',
        sig: 'test-sig'
      };

      await subscriptionManager.handleEvent(subscription.id, mockEvent);
      
      expect(subscription.eventCount).toBe(1);
      expect(subscription.lastEventAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('should manage multiple active subscriptions', async () => {
      const filter1: Filter = { kinds: [1] };
      const filter2: Filter = { kinds: [0] };
      const filter3: Filter = { kinds: [3] };

      const result1 = await subscriptionManager.subscribe([filter1]);
      const result2 = await subscriptionManager.subscribe([filter2]);
      const result3 = await subscriptionManager.subscribe([filter3]);

      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(3);
      expect(subscriptionManager.getSubscription(result1.subscription.id)).toBeDefined();
      expect(subscriptionManager.getSubscription(result2.subscription.id)).toBeDefined();
      expect(subscriptionManager.getSubscription(result3.subscription.id)).toBeDefined();

      // Close one subscription
      await subscriptionManager.close(result2.subscription.id);
      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(2);
    });
  });

  describe('Epic 3: Multi-Relay Coordination', () => {
    it('should send REQ messages to all connected relays', async () => {
      const mockSend = vi.fn();
      vi.spyOn(mockRelayManager, 'sendToAll').mockImplementation(mockSend);

      const filter: Filter = { kinds: [1], limit: 10 };
      const result = await subscriptionManager.subscribe([filter]);

      await subscriptionManager.activate(result.subscription.id);

      // Should send REQ message to all relays
      expect(mockSend).toHaveBeenCalledWith([
        'REQ',
        result.subscription.id,
        filter
      ]);
    });

    it('should send REQ to specific relays when configured', async () => {
      const mockSend = vi.fn();
      vi.spyOn(mockRelayManager, 'sendToRelays').mockImplementation(mockSend);

      const filter: Filter = { kinds: [1] };
      const options: SubscriptionOptions = {
        relays: ['ws://test-relay-1.com']
      };

      const result = await subscriptionManager.subscribe([filter], options);
      await subscriptionManager.activate(result.subscription.id);

      expect(mockSend).toHaveBeenCalledWith(
        ['ws://test-relay-1.com'],
        ['REQ', result.subscription.id, filter]
      );
    });

    it('should track per-relay subscription state', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);
      
      await subscriptionManager.activate(result.subscription.id);

      const stats = subscriptionManager.getSubscriptionStats(result.subscription.id);
      
      expect(stats.relayStates).toHaveProperty('ws://test-relay-1.com');
      expect(stats.relayStates).toHaveProperty('ws://test-relay-2.com');
      expect(stats.relayStates['ws://test-relay-1.com']).toBe('active');
      expect(stats.relayStates['ws://test-relay-2.com']).toBe('active');
    });

    it('should handle partial relay failures gracefully', async () => {
      // Mock one relay failing
      const mockSend = vi.fn().mockImplementation((relays, message) => {
        if (relays.includes('ws://test-relay-1.com')) {
          throw new Error('Relay 1 failed');
        }
        return Promise.resolve();
      });
      vi.spyOn(mockRelayManager, 'sendToRelays').mockImplementation(mockSend);

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);

      // Should still succeed with partial relay success
      expect(result.success).toBe(true);
      expect(result.relayResults.some(r => r.success)).toBe(true);
      expect(result.relayResults.some(r => !r.success)).toBe(true);
    });

    it('should consolidate events from multiple relays', async () => {
      const onEventMock = vi.fn();
      const filter: Filter = { kinds: [1] };
      
      const result = await subscriptionManager.subscribe([filter], {
        onEvent: onEventMock
      });

      const mockEvent: NostrEvent = {
        id: 'duplicate-event-id',
        pubkey: 'test-pubkey',
        created_at: Date.now(),
        kind: 1,
        tags: [],
        content: 'test',
        sig: 'test-sig'
      };

      // Simulate same event from multiple relays
      await subscriptionManager.handleRelayEvent('ws://test-relay-1.com', result.subscription.id, mockEvent);
      await subscriptionManager.handleRelayEvent('ws://test-relay-2.com', result.subscription.id, mockEvent);

      // Should only call onEvent once (deduplication)
      expect(onEventMock).toHaveBeenCalledTimes(1);
      expect(onEventMock).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Epic 4: WebSocket Message Protocol (NIP-01)', () => {
    it('should handle EVENT messages correctly', async () => {
      const onEventMock = vi.fn();
      const filter: Filter = { kinds: [1] };
      
      const result = await subscriptionManager.subscribe([filter], {
        onEvent: onEventMock
      });

      const mockEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Date.now(),
        kind: 1,
        tags: [],
        content: 'test content',
        sig: 'test-signature'
      };

      const relayMessage: RelayMessage = ['EVENT', result.subscription.id, mockEvent];
      
      await subscriptionManager.handleRelayMessage('ws://test-relay-1.com', relayMessage);

      expect(onEventMock).toHaveBeenCalledWith(mockEvent);
      expect(result.subscription.eventCount).toBe(1);
    });

    it('should handle EOSE messages correctly', async () => {
      const onEoseMock = vi.fn();
      const filter: Filter = { kinds: [1] };
      
      const result = await subscriptionManager.subscribe([filter], {
        onEose: onEoseMock
      });

      const relayMessage: RelayMessage = ['EOSE', result.subscription.id];
      
      await subscriptionManager.handleRelayMessage('ws://test-relay-1.com', relayMessage);

      expect(onEoseMock).toHaveBeenCalledWith('ws://test-relay-1.com');
      
      // Should update subscription state when all relays send EOSE
      const stats = subscriptionManager.getSubscriptionStats(result.subscription.id);
      expect(stats.eoseCount).toBe(1);
    });

    it('should send CLOSE messages on subscription close', async () => {
      const mockSend = vi.fn();
      vi.spyOn(mockRelayManager, 'sendToAll').mockImplementation(mockSend);

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);
      
      await subscriptionManager.close(result.subscription.id);

      expect(mockSend).toHaveBeenCalledWith(['CLOSE', result.subscription.id]);
    });

    it('should ignore messages for unknown subscription IDs', async () => {
      const mockEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Date.now(),
        kind: 1,
        tags: [],
        content: 'test',
        sig: 'test-sig'
      };

      const relayMessage: RelayMessage = ['EVENT', 'unknown-subscription-id', mockEvent];
      
      // Should not throw error
      await expect(subscriptionManager.handleRelayMessage('ws://test-relay-1.com', relayMessage))
        .resolves.not.toThrow();
    });
  });

  describe('Epic 5: Error Handling & Recovery', () => {
    it('should handle relay disconnection gracefully', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);
      
      await subscriptionManager.activate(result.subscription.id);

      // Simulate relay disconnection
      await subscriptionManager.handleRelayDisconnection('ws://test-relay-1.com');

      const stats = subscriptionManager.getSubscriptionStats(result.subscription.id);
      expect(stats.relayStates['ws://test-relay-1.com']).toBe('disconnected');
      
      // Subscription should still be active on other relays
      expect(result.subscription.state).toBe('active');
    });

    it('should retry failed subscriptions', async () => {
      const mockSend = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      vi.spyOn(mockRelayManager, 'sendToAll').mockImplementation(mockSend);

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter], {
        retryAttempts: 2,
        retryDelay: 100
      });

      // Should eventually succeed after retry
      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should timeout subscriptions that never receive EOSE', async () => {
      const onCloseMock = vi.fn();
      const filter: Filter = { kinds: [1] };
      
      const result = await subscriptionManager.subscribe([filter], {
        timeout: 1000, // 1 second timeout
        onClose: onCloseMock
      });

      await subscriptionManager.activate(result.subscription.id);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(result.subscription.state).toBe('error');
      expect(onCloseMock).toHaveBeenCalledWith('Subscription timeout');
    });

    it('should provide detailed error information', async () => {
      // Mock all relays failing
      const mockSend = vi.fn().mockRejectedValue(new Error('All relays failed'));
      vi.spyOn(mockRelayManager, 'sendToAll').mockImplementation(mockSend);

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('All relays failed');
      expect(result.error?.retryable).toBe(true);
      expect(result.relayResults.every(r => !r.success)).toBe(true);
    });
  });

  describe('Epic 6: Performance Requirements', () => {
    it('should handle >100 events per second', async () => {
      const receivedEvents: NostrEvent[] = [];
      const filter: Filter = { kinds: [1] };
      
      const result = await subscriptionManager.subscribe([filter], {
        onEvent: (event) => receivedEvents.push(event)
      });

      const startTime = Date.now();
      const eventCount = 150; // >100 events

      // Simulate rapid event delivery
      for (let i = 0; i < eventCount; i++) {
        const mockEvent: NostrEvent = {
          id: `event-${i}`,
          pubkey: 'test-pubkey',
          created_at: Date.now(),
          kind: 1,
          tags: [],
          content: `Event ${i}`,
          sig: 'test-sig'
        };

        await subscriptionManager.handleEvent(result.subscription.id, mockEvent);
      }

      const duration = Date.now() - startTime;
      const eventsPerSecond = (eventCount / duration) * 1000;

      expect(eventsPerSecond).toBeGreaterThan(100);
      expect(receivedEvents).toHaveLength(eventCount);
    });

    it('should efficiently manage memory with large event volumes', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);

      // Simulate processing 1000 events
      for (let i = 0; i < 1000; i++) {
        const mockEvent: NostrEvent = {
          id: `event-${i}`,
          pubkey: 'test-pubkey',
          created_at: Date.now(),
          kind: 1,
          tags: [],
          content: `Event ${i}`,
          sig: 'test-sig'
        };

        await subscriptionManager.handleEvent(result.subscription.id, mockEvent);
      }

      // Memory usage should be reasonable (no memory leaks)
      const memUsage = process.memoryUsage();
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // < 100MB
    });

    it('should batch operations for efficiency', async () => {
      const batchSize = 50;
      const events: NostrEvent[] = [];
      
      for (let i = 0; i < batchSize; i++) {
        events.push({
          id: `event-${i}`,
          pubkey: 'test-pubkey',
          created_at: Date.now(),
          kind: 1,
          tags: [],
          content: `Event ${i}`,
          sig: 'test-sig'
        });
      }

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);

      const startTime = performance.now();
      
      // Process events in batch
      await subscriptionManager.handleEventBatch(result.subscription.id, events);
      
      const duration = performance.now() - startTime;

      // Batch processing should be faster than individual processing
      expect(duration).toBeLessThan(50); // < 50ms for 50 events
    });
  });

  describe('Epic 7: Integration with RelayManager', () => {
    it('should integrate seamlessly with existing RelayManager', async () => {
      // Test that SubscriptionManager works with real RelayManager instance
      const realRelayManager = new RelayManager(['ws://test-relay.com']);
      const subscriptionMgr = new SubscriptionManager(realRelayManager);

      const filter: Filter = { kinds: [1] };
      const result = await subscriptionMgr.subscribe([filter]);

      expect(result.subscription.relays).toEqual(['ws://test-relay.com']);
      expect(subscriptionMgr.relayManager).toBe(realRelayManager);
    });

    it('should handle relay manager connection changes', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);

      // Simulate relay manager connection change
      vi.spyOn(mockRelayManager, 'connectedRelays', 'get').mockReturnValue([
        'ws://test-relay-1.com' // relay-2 disconnected
      ]);

      await subscriptionManager.handleRelayManagerUpdate();

      const stats = subscriptionManager.getSubscriptionStats(result.subscription.id);
      expect(stats.relayStates['ws://test-relay-2.com']).toBe('disconnected');
    });

    it('should respect RelayManager debug settings', async () => {
      const debugRelayManager = new RelayManager(['ws://test-relay.com'], { debug: true });
      const subscriptionMgr = new SubscriptionManager(debugRelayManager);

      const consoleSpy = vi.spyOn(console, 'log');
      
      const filter: Filter = { kinds: [1] };
      await subscriptionMgr.subscribe([filter]);

      // Should log debug information when debug is enabled
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Epic 8: Cleanup & Resource Management', () => {
    it('should cleanup all subscriptions on closeAll', async () => {
      const filters = [
        [{ kinds: [1] }],
        [{ kinds: [0] }],
        [{ kinds: [3] }]
      ];

      const results = await Promise.all(
        filters.map(filter => subscriptionManager.subscribe(filter))
      );

      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(3);

      await subscriptionManager.closeAll();

      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(0);
      
      // All subscriptions should be in closed state
      for (const result of results) {
        const sub = subscriptionManager.getSubscription(result.subscription.id);
        expect(sub?.state).toBe('closed');
      }
    });

    it('should cleanup resources on subscription timeout', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter], {
        timeout: 100 // Very short timeout
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should automatically cleanup timed out subscription
      expect(result.subscription.state).toBe('error');
      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should prevent memory leaks from closed subscriptions', async () => {
      const filter: Filter = { kinds: [1] };
      const result = await subscriptionManager.subscribe([filter]);

      await subscriptionManager.close(result.subscription.id);

      // Closed subscription should not be in active list
      expect(subscriptionManager.getActiveSubscriptions()).toHaveLength(0);
      
      // But should still be accessible for debugging
      const closedSub = subscriptionManager.getSubscription(result.subscription.id);
      expect(closedSub?.state).toBe('closed');
    });
  });
});