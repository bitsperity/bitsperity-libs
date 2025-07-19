import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DMConversationStore } from '@/stores/dm-conversation';
import type { ConversationState, ConversationStoreConfig } from '@/stores/types';
import { 
  createMockNostrEvent, 
  createMockConversationEvents,
  createTestEventBus,
  PerformanceTracker,
  MemoryTracker,
  waitForStoreUpdate,
  TEST_CONFIG 
} from '@/test-utils/setup-phase3';

describe('DMConversationStore - Phase 3 Core Tests', () => {
  let eventBus: ReturnType<typeof createTestEventBus>;
  let store: DMConversationStore;
  let performanceTracker: PerformanceTracker;
  let memoryTracker: MemoryTracker;

  const conversationId = 'test-conversation-123';
  const testConfig: Partial<ConversationStoreConfig> = {
    maxMessages: 10,
    debounceMs: 0, // No debouncing for tests
    syncAcrossTabs: false // Disable for basic tests
  };

  beforeEach(() => {
    eventBus = createTestEventBus();
    store = new DMConversationStore(conversationId, eventBus, testConfig);
    performanceTracker = new PerformanceTracker();
    memoryTracker = new MemoryTracker();
    memoryTracker.setBaseline();
  });

  afterEach(async () => {
    await store.dispose();
    eventBus.dispose();
  });

  describe('Svelte Readable Contract', () => {
    it('should implement Svelte Readable interface correctly', () => {
      expect(typeof store.subscribe).toBe('function');
      expect(store.conversationId).toBe(conversationId);
    });

    it('should support native $store syntax subscription', () => {
      let callCount = 0;
      let lastState: ConversationState | null = null;

      const unsubscribe = store.subscribe((state) => {
        callCount++;
        lastState = state;
      });

      // Should be called immediately with initial state
      expect(callCount).toBe(1);
      expect(lastState).not.toBeNull();
      expect(lastState!.conversationId).toBe(conversationId);
      expect(lastState!.messages).toEqual([]);
      expect(lastState!.unreadCount).toBe(0);

      unsubscribe();
    });

    it('should notify subscribers when state changes', async () => {
      const states: ConversationState[] = [];
      const unsubscribe = store.subscribe((state) => {
        states.push(state);
      });

      // Add a message
      const message = createMockNostrEvent();
      await store.addMessage(message);

      // Should have initial state + updated state
      expect(states.length).toBeGreaterThanOrEqual(2);
      expect(states[states.length - 1].messages).toHaveLength(1);
      expect(states[states.length - 1].messages[0].id).toBe(message.id);

      unsubscribe();
    });

    it('should clean up subscriptions properly', () => {
      const unsubscribe1 = store.subscribe(() => {});
      const unsubscribe2 = store.subscribe(() => {});

      expect(store.metrics.subscriptionCount).toBe(2);

      unsubscribe1();
      expect(store.metrics.subscriptionCount).toBe(1);

      unsubscribe2();
      expect(store.metrics.subscriptionCount).toBe(0);
    });
  });

  describe('Message Management', () => {
    it('should add messages correctly', async () => {
      const message = createMockNostrEvent({
        content: 'Hello World',
        pubkey: 'test-pubkey-1'
      });

      performanceTracker.start();
      await store.addMessage(message);
      performanceTracker.mark('addMessage');

      const state = store.state;
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].id).toBe(message.id);
      expect(state.lastMessage?.id).toBe(message.id);
      expect(state.unreadCount).toBe(1);
      expect(state.participants).toContain('test-pubkey-1');

      // Verify performance
      performanceTracker.expectLatencyUnder('addMessage', TEST_CONFIG.PERFORMANCE_TIMEOUT_MS);
    });

    it('should handle duplicate messages correctly', async () => {
      const message = createMockNostrEvent();

      await store.addMessage(message);
      await store.addMessage(message); // Add same message again

      const state = store.state;
      expect(state.messages).toHaveLength(1); // Should not duplicate
      expect(state.unreadCount).toBe(1); // Should not increment twice
    });

    it('should maintain chronological order', async () => {
      const messages = createMockConversationEvents(5);
      
      // Add messages in random order
      const shuffled = [...messages].sort(() => Math.random() - 0.5);
      
      for (const message of shuffled) {
        await store.addMessage(message);
      }

      const state = store.state;
      expect(state.messages).toHaveLength(5);

      // Verify chronological order
      for (let i = 1; i < state.messages.length; i++) {
        expect(state.messages[i].created_at).toBeGreaterThanOrEqual(
          state.messages[i - 1].created_at
        );
      }
    });

    it('should remove messages correctly', async () => {
      const messages = createMockConversationEvents(3);
      
      for (const message of messages) {
        await store.addMessage(message);
      }

      const messageToRemove = messages[1];
      const removed = await store.removeMessage(messageToRemove.id);

      expect(removed).toBe(true);
      
      const state = store.state;
      expect(state.messages).toHaveLength(2);
      expect(state.messages.find(m => m.id === messageToRemove.id)).toBeUndefined();
    });

    it('should update messages correctly', async () => {
      const message = createMockNostrEvent({ content: 'Original content' });
      await store.addMessage(message);

      const updated = await store.updateMessage(message.id, { 
        content: 'Updated content' 
      });

      expect(updated).toBe(true);
      
      const state = store.state;
      expect(state.messages[0].content).toBe('Updated content');
      expect(state.messages[0].id).toBe(message.id); // ID should remain same
    });

    it('should handle message update errors correctly', async () => {
      const nonExistentId = 'non-existent-message-id';
      
      await expect(store.updateMessage(nonExistentId, { content: 'new' }))
        .rejects.toThrow('Message non-existent-message-id not found');
    });
  });

  describe('Memory Management & LRU', () => {
    it('should respect maxMessages limit', async () => {
      const maxMessages = testConfig.maxMessages!;
      const messages = createMockConversationEvents(maxMessages + 5);

      for (const message of messages) {
        await store.addMessage(message);
      }

      const state = store.state;
      expect(state.messages).toHaveLength(maxMessages);
      
      // Should contain the most recent messages
      const lastMessage = messages[messages.length - 1];
      expect(state.messages.find(m => m.id === lastMessage.id)).toBeDefined();
    });

    it('should maintain memory usage within limits', async () => {
      const messages = createMockConversationEvents(100);
      
      for (const message of messages) {
        await store.addMessage(message);
      }

      // Check memory increase
      memoryTracker.expectMemoryIncreaseUnder(TEST_CONFIG.MEMORY_LIMIT_BYTES);
      
      // Check store metrics
      const metrics = store.metrics;
      expect(metrics.memoryUsage).toBeLessThan(TEST_CONFIG.MEMORY_LIMIT_BYTES);
    });

    it('should handle large conversation histories efficiently', async () => {
      const largeMessageCount = 500;
      const messages = createMockConversationEvents(largeMessageCount);

      performanceTracker.start();
      
      for (const message of messages) {
        await store.addMessage(message);
      }
      
      performanceTracker.mark('addLargeConversation');

      // Should complete within reasonable time
      performanceTracker.expectLatencyUnder('addLargeConversation', 5000); // 5 seconds

      const state = store.state;
      expect(state.messages).toHaveLength(testConfig.maxMessages!); // Limited by LRU
    });
  });

  describe('State Management', () => {
    it('should mark conversation as read correctly', async () => {
      const messages = createMockConversationEvents(3);
      
      for (const message of messages) {
        await store.addMessage(message);
      }

      expect(store.state.unreadCount).toBe(3);

      await store.markAsRead();
      
      expect(store.state.unreadCount).toBe(0);
    });

    it('should handle loading state correctly', () => {
      expect(store.state.isLoading).toBe(false);

      store.setLoading(true);
      expect(store.state.isLoading).toBe(true);

      store.setLoading(false);
      expect(store.state.isLoading).toBe(false);
    });

    it('should handle error state correctly', () => {
      expect(store.state.error).toBeNull();

      const error = new Error('Test error');
      store.setError(error);
      
      expect(store.state.error).toBe(error);
      expect(store.state.isLoading).toBe(false); // Should stop loading on error

      store.setError(null);
      expect(store.state.error).toBeNull();
    });

    it('should reset state correctly', async () => {
      const messages = createMockConversationEvents(3);
      
      for (const message of messages) {
        await store.addMessage(message);
      }

      store.setError(new Error('test'));
      
      await store.reset();

      const state = store.state;
      expect(state.messages).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
      expect(state.lastMessage).toBeNull();
      expect(state.error).toBeNull();
      expect(state.participants).toHaveLength(0);
    });
  });

  describe('Event Bus Integration', () => {
    it('should emit events when messages are added', async () => {
      const events: any[] = [];
      eventBus.on('message:added', (event) => {
        events.push(event);
      });

      const message = createMockNostrEvent();
      await store.addMessage(message);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('message:added');
      expect(events[0].conversationId).toBe(conversationId);
      expect(events[0].payload.messageId).toBe(message.id);
    });

    it('should emit events when messages are removed', async () => {
      const events: any[] = [];
      eventBus.on('message:removed', (event) => {
        events.push(event);
      });

      const message = createMockNostrEvent();
      await store.addMessage(message);
      await store.removeMessage(message.id);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('message:removed');
      expect(events[0].payload.messageId).toBe(message.id);
    });

    it('should emit lifecycle events correctly', async () => {
      const events: any[] = [];
      
      eventBus.on('conversation:created', (event) => events.push(event));
      eventBus.on('conversation:disposed', (event) => events.push(event));

      await store.initialize();
      await store.dispose();

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('conversation:created');
      expect(events[1].type).toBe('conversation:disposed');
    });
  });

  describe('Performance Requirements', () => {
    it('should update state within 100ms', async () => {
      const message = createMockNostrEvent();

      performanceTracker.start();
      await store.addMessage(message);
      performanceTracker.mark('stateUpdate');

      performanceTracker.expectLatencyUnder('stateUpdate', 100);
    });

    it('should handle concurrent operations efficiently', async () => {
      const messages = createMockConversationEvents(10);

      performanceTracker.start();
      
      // Add messages concurrently
      await Promise.all(
        messages.map(message => store.addMessage(message))
      );
      
      performanceTracker.mark('concurrentOperations');

      const state = store.state;
      expect(state.messages).toHaveLength(testConfig.maxMessages!);
      
      performanceTracker.expectLatencyUnder('concurrentOperations', 500);
    });

    it('should maintain responsive UI updates', async () => {
      const updateLatencies: number[] = [];
      
      store.subscribe(() => {
        updateLatencies.push(store.metrics.updateLatency);
      });

      const messages = createMockConversationEvents(5);
      
      for (const message of messages) {
        await store.addMessage(message);
      }

      // All UI updates should be fast
      const slowUpdates = updateLatencies.filter(latency => latency > 16); // 60fps
      expect(slowUpdates).toHaveLength(0);
    });
  });

  describe('Lifecycle Management', () => {
    it('should initialize correctly', async () => {
      await store.initialize();
      
      expect(store.state.conversationId).toBe(conversationId);
      expect(store.metrics.subscriptionCount).toBe(0); // No subscribers yet
    });

    it('should dispose correctly', async () => {
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);

      await store.dispose();

      // Should throw error when trying to use disposed store
      await expect(store.addMessage(createMockNostrEvent()))
        .rejects.toThrow('disposed store');

      expect(() => store.subscribe(() => {}))
        .toThrow('disposed store');
    });

    it('should prevent operations on disposed store', async () => {
      await store.dispose();

      await expect(store.addMessage(createMockNostrEvent()))
        .rejects.toThrow('STORE_DISPOSED');
      
      await expect(store.removeMessage('test'))
        .rejects.toThrow('STORE_DISPOSED');
      
      await expect(store.reset())
        .rejects.toThrow('STORE_DISPOSED');
    });
  });

  describe('Configuration', () => {
    it('should respect custom configuration', () => {
      const customConfig = {
        maxMessages: 50,
        debounceMs: 32,
        syncAcrossTabs: true
      };

      const customStore = new DMConversationStore(
        'custom-conversation',
        eventBus,
        customConfig
      );

      expect(customStore.config.maxMessages).toBe(50);
      expect(customStore.config.debounceMs).toBe(32);
      expect(customStore.config.syncAcrossTabs).toBe(true);

      customStore.dispose();
    });

    it('should use default configuration when not specified', () => {
      const defaultStore = new DMConversationStore(
        'default-conversation',
        eventBus
      );

      expect(defaultStore.config.maxMessages).toBe(1000);
      expect(defaultStore.config.autoCleanup).toBe(true);
      expect(defaultStore.config.persistState).toBe(true);

      defaultStore.dispose();
    });
  });
}); 