/**
 * ThreadManager Unit Tests
 * Session 4 Phase 2: Threading System (NIP-10)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThreadManager } from '../../src/social/threads/ThreadManager.js';
import type { 
  ThreadManagerConfig, 
  ThreadCreateRequest, 
  ReplyRequest,
  Thread,
  ThreadMessage
} from '../../src/social/types/thread-types.js';

// Mock dependencies
const mockSubscriptionManager = {
  subscribe: vi.fn(),
  close: vi.fn()
};

const mockRelayManager = {
  publishToAll: vi.fn()
};

const mockSigningProvider = {
  getPublicKey: vi.fn(),
  signEvent: vi.fn()
};

const mockEventBuilder = {
  kind: vi.fn().mockReturnThis(),
  content: vi.fn().mockReturnThis(),
  tags: vi.fn().mockReturnThis(),
  build: vi.fn()
};

describe('ThreadManager', () => {
  let threadManager: ThreadManager;
  let config: ThreadManagerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      signingProvider: mockSigningProvider as any,
      eventBuilder: mockEventBuilder as any,
      debug: false
    };

    threadManager = new ThreadManager(config);
  });

  afterEach(async () => {
    await threadManager.close();
  });

  describe('Thread Creation', () => {
    it('should create a new thread successfully', async () => {
      // Setup mocks
      const testPubkey = 'test-pubkey-123';
      const testEventId = 'thread-root-event-456';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: testEventId,
        kind: 1,
        content: 'Test thread root message',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', 'mention-pubkey-789']],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: testEventId,
        kind: 1,
        content: 'Test thread root message',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', 'mention-pubkey-789']],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const threadRequest: ThreadCreateRequest = {
        content: 'Test thread root message',
        mentions: ['mention-pubkey-789']
      };

      // Execute
      const result = await threadManager.createThread(threadRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(testEventId);
      expect(result.message).toBeDefined();
      expect(result.message!.eventId).toBe(testEventId);
      expect(result.message!.content).toBe(threadRequest.content);
      expect(result.message!.depth).toBe(0);
      expect(result.message!.replyToEventId).toBeNull();
      expect(result.message!.rootEventId).toBe(testEventId);
      expect(result.message!.mentionedPubkeys).toContain('mention-pubkey-789');
      expect(result.message!.isOwn).toBe(true);

      // Verify event builder was called correctly
      expect(mockEventBuilder.kind).toHaveBeenCalledWith(1);
      expect(mockEventBuilder.content).toHaveBeenCalledWith(threadRequest.content);
      expect(mockEventBuilder.tags).toHaveBeenCalledWith([['p', 'mention-pubkey-789']]);
      expect(mockEventBuilder.build).toHaveBeenCalled();

      // Verify relay publish
      expect(mockRelayManager.publishToAll).toHaveBeenCalled();
    });

    it('should fail thread creation without signing provider', async () => {
      // Create ThreadManager without signing provider
      const configWithoutSigner: ThreadManagerConfig = {
        ...config,
        signingProvider: undefined as any
      };
      
      const threadManagerNoSigner = new ThreadManager(configWithoutSigner);

      const threadRequest: ThreadCreateRequest = {
        content: 'Test thread',
        mentions: []
      };

      // Execute
      const result = await threadManagerNoSigner.createThread(threadRequest);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('No signing provider');

      await threadManagerNoSigner.close();
    });

    it('should create thread without mentions', async () => {
      const testPubkey = 'test-pubkey-123';
      const testEventId = 'thread-simple-456';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: testEventId,
        kind: 1,
        content: 'Simple thread without mentions',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: testEventId,
        kind: 1,
        content: 'Simple thread without mentions',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const threadRequest: ThreadCreateRequest = {
        content: 'Simple thread without mentions'
      };

      const result = await threadManager.createThread(threadRequest);

      expect(result.success).toBe(true);
      expect(result.message!.mentionedPubkeys).toEqual([]);
      expect(mockEventBuilder.tags).toHaveBeenCalledWith([]);
    });
  });

  describe('Reply Creation', () => {
    it('should create a reply with proper NIP-10 tags', async () => {
      const testPubkey = 'test-pubkey-123';
      const rootEventId = 'root-event-456';
      const replyEventId = 'reply-event-789';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock get() to return a thread for context
      const mockThread: Thread = {
        rootEventId,
        messages: [
          {
            eventId: rootEventId,
            authorPubkey: 'root-author-pubkey',
            content: 'Root message',
            createdAt: Date.now() - 1000,
            replyToEventId: null,
            rootEventId,
            mentionedPubkeys: [],
            depth: 0,
            isOwn: false
          }
        ],
        messageCount: 1,
        lastActivity: Date.now() - 1000,
        isWatched: false
      };
      
      vi.spyOn(threadManager, 'get').mockResolvedValue(mockThread);
      
      mockEventBuilder.build.mockResolvedValue({
        id: replyEventId,
        kind: 1,
        content: 'Reply message',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', rootEventId, '', 'reply'],
          ['p', 'root-author-pubkey']
        ],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: replyEventId,
        kind: 1,
        content: 'Reply message',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', rootEventId, '', 'reply'],
          ['p', 'root-author-pubkey']
        ],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const replyRequest: ReplyRequest = {
        content: 'Reply message',
        replyToEventId: rootEventId,
        rootEventId: rootEventId,
        mentions: []
      };

      // Execute
      const result = await threadManager.reply(replyRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(replyEventId);
      expect(result.message).toBeDefined();
      expect(result.message!.eventId).toBe(replyEventId);
      expect(result.message!.content).toBe(replyRequest.content);
      expect(result.message!.replyToEventId).toBe(rootEventId);
      expect(result.message!.rootEventId).toBe(rootEventId);
      expect(result.message!.depth).toBe(1);
      expect(result.message!.isOwn).toBe(true);

      // Verify proper NIP-10 tags were built
      expect(mockEventBuilder.tags).toHaveBeenCalledWith([
        ['e', rootEventId, '', 'reply'],
        ['p', 'root-author-pubkey']
      ]);
    });

    it('should create nested reply with root and reply markers', async () => {
      const testPubkey = 'test-pubkey-123';
      const rootEventId = 'root-event-456';
      const parentEventId = 'parent-event-789';
      const nestedReplyId = 'nested-reply-012';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock thread with multiple messages
      const mockThread: Thread = {
        rootEventId,
        messages: [
          {
            eventId: rootEventId,
            authorPubkey: 'root-author-pubkey',
            content: 'Root message',
            createdAt: Date.now() - 2000,
            replyToEventId: null,
            rootEventId,
            mentionedPubkeys: [],
            depth: 0,
            isOwn: false
          },
          {
            eventId: parentEventId,
            authorPubkey: 'parent-author-pubkey',
            content: 'Parent reply',
            createdAt: Date.now() - 1000,
            replyToEventId: rootEventId,
            rootEventId,
            mentionedPubkeys: [],
            depth: 1,
            isOwn: false
          }
        ],
        messageCount: 2,
        lastActivity: Date.now() - 1000,
        isWatched: false
      };
      
      vi.spyOn(threadManager, 'get').mockResolvedValue(mockThread);
      
      mockEventBuilder.build.mockResolvedValue({
        id: nestedReplyId,
        kind: 1,
        content: 'Nested reply message',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', parentEventId, '', 'reply'],
          ['e', rootEventId, '', 'root'],
          ['p', 'parent-author-pubkey']
        ],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: nestedReplyId,
        kind: 1,
        content: 'Nested reply message',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', parentEventId, '', 'reply'],
          ['e', rootEventId, '', 'root'],
          ['p', 'parent-author-pubkey']
        ],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const nestedReplyRequest: ReplyRequest = {
        content: 'Nested reply message',
        replyToEventId: parentEventId,
        rootEventId: rootEventId,
        mentions: []
      };

      // Execute
      const result = await threadManager.reply(nestedReplyRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.message!.replyToEventId).toBe(parentEventId);
      expect(result.message!.rootEventId).toBe(rootEventId);
      expect(result.message!.depth).toBe(2);

      // Verify proper NIP-10 nested tags
      expect(mockEventBuilder.tags).toHaveBeenCalledWith([
        ['e', parentEventId, '', 'reply'],
        ['e', rootEventId, '', 'root'],
        ['p', 'parent-author-pubkey']
      ]);
    });

    it('should fail reply without signing provider', async () => {
      const configWithoutSigner: ThreadManagerConfig = {
        ...config,
        signingProvider: undefined as any
      };
      
      const threadManagerNoSigner = new ThreadManager(configWithoutSigner);

      const replyRequest: ReplyRequest = {
        content: 'Reply message',
        replyToEventId: 'some-event-id',
        rootEventId: 'root-event-id',
        mentions: []
      };

      const result = await threadManagerNoSigner.reply(replyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No signing provider');

      await threadManagerNoSigner.close();
    });
  });

  describe('Thread Fetching', () => {
    it('should fetch thread with root and replies', async () => {
      const rootEventId = 'thread-root-123';
      const reply1Id = 'reply-1-456';
      const reply2Id = 'reply-2-789';
      
      // Mock subscription response with multiple events
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          // Root event
          const rootEvent = {
            id: rootEventId,
            kind: 1,
            content: 'Root thread message',
            pubkey: 'root-author-pubkey',
            created_at: Math.floor(Date.now() / 1000) - 2000,
            tags: [['p', 'mentioned-user']],
            sig: 'root-signature'
          };
          options.onEvent(rootEvent);
          
          // First reply
          const reply1Event = {
            id: reply1Id,
            kind: 1,
            content: 'First reply',
            pubkey: 'reply1-author-pubkey',
            created_at: Math.floor(Date.now() / 1000) - 1000,
            tags: [
              ['e', rootEventId, '', 'reply'],
              ['p', 'root-author-pubkey']
            ],
            sig: 'reply1-signature'
          };
          options.onEvent(reply1Event);
          
          // Second reply (nested)
          const reply2Event = {
            id: reply2Id,
            kind: 1,
            content: 'Nested reply to first',
            pubkey: 'reply2-author-pubkey',
            created_at: Math.floor(Date.now() / 1000) - 500,
            tags: [
              ['e', reply1Id, '', 'reply'],
              ['e', rootEventId, '', 'root'],
              ['p', 'reply1-author-pubkey']
            ],
            sig: 'reply2-signature'
          };
          options.onEvent(reply2Event);
          
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const thread = await threadManager.get(rootEventId);

      // Verify thread structure
      expect(thread).toBeDefined();
      expect(thread!.rootEventId).toBe(rootEventId);
      expect(thread!.messageCount).toBe(3);
      expect(thread!.messages).toHaveLength(3);

      // Verify root message
      const rootMessage = thread!.messages.find(m => m.eventId === rootEventId);
      expect(rootMessage).toBeDefined();
      expect(rootMessage!.depth).toBe(0);
      expect(rootMessage!.replyToEventId).toBeNull();
      expect(rootMessage!.content).toBe('Root thread message');
      expect(rootMessage!.mentionedPubkeys).toContain('mentioned-user');

      // Verify first reply
      const reply1Message = thread!.messages.find(m => m.eventId === reply1Id);
      expect(reply1Message).toBeDefined();
      expect(reply1Message!.depth).toBe(1);
      expect(reply1Message!.replyToEventId).toBe(rootEventId);
      expect(reply1Message!.rootEventId).toBe(rootEventId);

      // Verify nested reply
      const reply2Message = thread!.messages.find(m => m.eventId === reply2Id);
      expect(reply2Message).toBeDefined();
      expect(reply2Message!.depth).toBe(2);
      expect(reply2Message!.replyToEventId).toBe(reply1Id);
      expect(reply2Message!.rootEventId).toBe(rootEventId);

      // Verify chronological order
      expect(thread!.messages[0].createdAt).toBeLessThanOrEqual(thread!.messages[1].createdAt);
      expect(thread!.messages[1].createdAt).toBeLessThanOrEqual(thread!.messages[2].createdAt);

      // Verify subscription was called with correct filters
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalled();
      const callArgs = mockSubscriptionManager.subscribe.mock.calls[0];
      const filters = callArgs[0];
      
      // Should have filters for root event and replies
      expect(filters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ids: [rootEventId] }),
          expect.objectContaining({ '#e': [rootEventId] })
        ])
      );
    });

    it('should return null for non-existent thread', async () => {
      const nonExistentId = 'non-existent-thread-123';
      
      // Mock subscription that receives EOSE without events
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const thread = await threadManager.get(nonExistentId);

      // Verify
      expect(thread).toBeNull();
    });

    it('should use cache when available', async () => {
      const rootEventId = 'cached-thread-123';
      
      // First call - should subscribe
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          const rootEvent = {
            id: rootEventId,
            kind: 1,
            content: 'Cached thread message',
            pubkey: 'cached-author-pubkey',
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            sig: 'cached-signature'
          };
          options.onEvent(rootEvent);
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute first call to populate cache
      const thread1 = await threadManager.get(rootEventId);
      expect(thread1).toBeDefined();
      
      // Clear mock to test cache usage
      mockSubscriptionManager.subscribe.mockClear();

      // Execute second call - should use cache
      const thread2 = await threadManager.get(rootEventId, { useCache: true });
      expect(thread2).toBeDefined();
      expect(thread2!.rootEventId).toBe(rootEventId);
      expect(thread2!.messageCount).toBe(thread1!.messageCount);
      expect(mockSubscriptionManager.subscribe).not.toHaveBeenCalled(); // Should not subscribe again
    });

    it('should handle complex NIP-10 tag parsing', async () => {
      const rootEventId = 'complex-root-123';
      const replyId = 'complex-reply-456';
      
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          // Root event
          const rootEvent = {
            id: rootEventId,
            kind: 1,
            content: 'Complex root',
            pubkey: 'root-pubkey',
            created_at: Math.floor(Date.now() / 1000) - 1000,
            tags: [],
            sig: 'root-sig'
          };
          options.onEvent(rootEvent);
          
          // Complex reply with multiple e-tags and markers
          const complexReply = {
            id: replyId,
            kind: 1,
            content: 'Complex reply with proper NIP-10 tags',
            pubkey: 'reply-pubkey',
            created_at: Math.floor(Date.now() / 1000),
            tags: [
              ['e', rootEventId, 'wss://relay.example.com', 'root'],
              ['e', 'some-other-event', 'wss://relay.example.com', 'mention'],
              ['e', rootEventId, 'wss://relay2.example.com', 'reply'],
              ['p', 'root-pubkey'],
              ['p', 'other-mentioned-user']
            ],
            sig: 'complex-sig'
          };
          options.onEvent(complexReply);
          
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      const thread = await threadManager.get(rootEventId);

      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBe(2);

      const replyMessage = thread!.messages.find(m => m.eventId === replyId);
      expect(replyMessage).toBeDefined();
      expect(replyMessage!.replyToEventId).toBe(rootEventId);
      expect(replyMessage!.rootEventId).toBe(rootEventId);
      expect(replyMessage!.mentionedPubkeys).toContain('root-pubkey');
      expect(replyMessage!.mentionedPubkeys).toContain('other-mentioned-user');
    });
  });

  describe('Thread Watching', () => {
    it('should watch thread and receive real-time updates', async () => {
      const rootEventId = 'watched-thread-123';
      const newReplyId = 'new-reply-456';
      
      // Mock initial thread fetch
      vi.spyOn(threadManager, 'get').mockResolvedValue({
        rootEventId,
        messages: [
          {
            eventId: rootEventId,
            authorPubkey: 'root-author',
            content: 'Watched root',
            createdAt: Date.now() - 1000,
            replyToEventId: null,
            rootEventId,
            mentionedPubkeys: [],
            depth: 0,
            isOwn: false
          }
        ],
        messageCount: 1,
        lastActivity: Date.now() - 1000,
        isWatched: false
      });
      
      // Mock real-time subscription
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        // Simulate a new reply arriving
        setTimeout(() => {
          const newReply = {
            id: newReplyId,
            kind: 1,
            content: 'New real-time reply',
            pubkey: 'new-reply-author',
            created_at: Math.floor(Date.now() / 1000),
            tags: [
              ['e', rootEventId, '', 'reply'],
              ['p', 'root-author']
            ],
            sig: 'new-reply-sig'
          };
          options.onEvent(newReply);
        }, 100);
        
        return Promise.resolve('subscription-id-123');
      });

      // Start watching
      const watchResult = await threadManager.watch(rootEventId);
      expect(watchResult).toBe(true);

      // Verify subscription was set up
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [expect.objectContaining({
          kinds: [1],
          '#e': [rootEventId],
          since: expect.any(Number)
        })],
        expect.any(Object)
      );

      // Verify reactive store updates
      let watchedThreadsUpdated = false;
      const unsubscribe = threadManager.watchedThreads.subscribe((threads) => {
        const watchedThread = threads.get(rootEventId);
        if (watchedThread && watchedThread.messageCount > 1) {
          watchedThreadsUpdated = true;
          expect(watchedThread.isWatched).toBe(true);
          expect(watchedThread.messageCount).toBe(2);
        }
      });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(watchedThreadsUpdated).toBe(true);
      unsubscribe();

      // Stop watching
      await threadManager.unwatch(rootEventId);
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('subscription-id-123');
    });

    it('should fail to watch non-existent thread', async () => {
      const nonExistentId = 'non-existent-watch-123';
      
      vi.spyOn(threadManager, 'get').mockResolvedValue(null);
      
      const watchResult = await threadManager.watch(nonExistentId);
      expect(watchResult).toBe(false);
    });
  });

  describe('Reactive Updates', () => {
    it('should provide reactive thread updates via updates store', (done) => {
      const rootEventId = 'reactive-thread-123';
      
      mockSigningProvider.getPublicKey.mockResolvedValue('test-pubkey');
      mockEventBuilder.build.mockResolvedValue({
        id: rootEventId,
        kind: 1,
        content: 'Reactive thread',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'reactive-sig'
      });
      mockSigningProvider.signEvent.mockResolvedValue({
        id: rootEventId,
        kind: 1,
        content: 'Reactive thread',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'reactive-sig'
      });
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      // Subscribe to reactive updates
      let updateCount = 0;
      const unsubscribe = threadManager.updates.subscribe((threads) => {
        updateCount++;
        
        if (updateCount === 1) {
          // First update should be empty map (initial state)
          expect(threads.size).toBe(0);
        } else if (updateCount === 2) {
          // Second update should have the new thread
          expect(threads.size).toBe(1);
          const thread = threads.get(rootEventId);
          expect(thread).toBeDefined();
          expect(thread!.messageCount).toBe(1);
          expect(thread!.messages[0].content).toBe('Reactive thread');
          
          unsubscribe();
          done();
        }
      });

      // Trigger thread creation to test reactive update
      threadManager.createThread({ content: 'Reactive thread' });
    });
  });

  describe('Multi-Phase Fetching', () => {
    it('should perform single-phase fetching for complex threads', async () => {
      const rootEventId = 'complex-root-123';
      const reply1Id = 'complex-reply1-456';
      const reply2Id = 'complex-reply2-789';
      
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          // Return all events in single phase (current implementation)
          const rootEvent = {
            id: rootEventId,
            kind: 1,
            content: 'Complex root',
            pubkey: 'root-author',
            created_at: Math.floor(Date.now() / 1000) - 2000,
            tags: [],
            sig: 'root-sig'
          };
          options.onEvent(rootEvent);
          
          const reply1Event = {
            id: reply1Id,
            kind: 1,
            content: 'First level reply',
            pubkey: 'reply1-author',
            created_at: Math.floor(Date.now() / 1000) - 1000,
            tags: [
              ['e', rootEventId, '', 'reply'],
              ['p', 'root-author']
            ],
            sig: 'reply1-sig'
          };
          options.onEvent(reply1Event);
          
          const reply2Event = {
            id: reply2Id,
            kind: 1,
            content: 'Nested reply to first',
            pubkey: 'reply2-author',
            created_at: Math.floor(Date.now() / 1000) - 500,
            tags: [
              ['e', reply1Id, '', 'reply'],
              ['e', rootEventId, '', 'root'],
              ['p', 'reply1-author']
            ],
            sig: 'reply2-sig'
          };
          options.onEvent(reply2Event);
          
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const thread = await threadManager.get(rootEventId);

      // Verify complete thread was built
      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBe(3);
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledTimes(1); // Single-phase

      // Verify all messages are present with correct depths
      const rootMsg = thread!.messages.find(m => m.eventId === rootEventId);
      const reply1Msg = thread!.messages.find(m => m.eventId === reply1Id);
      const reply2Msg = thread!.messages.find(m => m.eventId === reply2Id);

      expect(rootMsg!.depth).toBe(0);
      expect(reply1Msg!.depth).toBe(1);
      expect(reply2Msg!.depth).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should close all subscriptions and clear cache', async () => {
      // Set up some state first
      await threadManager.get('test-thread-id');
      
      // Execute cleanup
      await threadManager.close();

      // Verify cleanup was called
      expect(mockSubscriptionManager.close).toHaveBeenCalled();
    });
  });
});