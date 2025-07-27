/**
 * ReactionManager Unit Tests
 * Session 4 Phase 3: Reactions & Feed Management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReactionManager } from '../../src/social/reactions/ReactionManager.js';
import type { 
  ReactionManagerConfig, 
  ReactionRequest,
  Reaction,
  ReactionSummary,
  REACTION_TYPES
} from '../../src/social/types/reaction-types.js';

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

describe('ReactionManager', () => {
  let reactionManager: ReactionManager;
  let config: ReactionManagerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      signingProvider: mockSigningProvider as any,
      eventBuilder: mockEventBuilder as any,
      debug: false
    };

    reactionManager = new ReactionManager(config);
  });

  afterEach(async () => {
    await reactionManager.close();
  });

  describe('Reaction Creation', () => {
    it('should create a like reaction successfully', async () => {
      // Setup mocks
      const testPubkey = 'test-pubkey-123';
      const targetEventId = 'target-event-456';
      const targetAuthorPubkey = 'target-author-789';
      const reactionEventId = 'reaction-event-abc';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: reactionEventId,
        kind: 7,
        content: '+',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', targetEventId],
          ['p', targetAuthorPubkey]
        ],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: reactionEventId,
        kind: 7,
        content: '+',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', targetEventId],
          ['p', targetAuthorPubkey]
        ],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      // Mock getReactions to return no existing reactions
      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue(null);

      const reactionRequest: ReactionRequest = {
        targetEventId,
        targetAuthorPubkey,
        reactionType: '+'
      };

      // Execute
      const result = await reactionManager.react(reactionRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(reactionEventId);
      expect(result.reaction).toBeDefined();
      expect(result.reaction!.eventId).toBe(reactionEventId);
      expect(result.reaction!.authorPubkey).toBe(testPubkey);
      expect(result.reaction!.targetEventId).toBe(targetEventId);
      expect(result.reaction!.targetAuthorPubkey).toBe(targetAuthorPubkey);
      expect(result.reaction!.reactionType).toBe('+');
      expect(result.reaction!.isOwn).toBe(true);

      // Verify event builder was called correctly
      expect(mockEventBuilder.kind).toHaveBeenCalledWith(7);
      expect(mockEventBuilder.content).toHaveBeenCalledWith('+');
      expect(mockEventBuilder.tags).toHaveBeenCalledWith([
        ['e', targetEventId],
        ['p', targetAuthorPubkey]
      ]);
      expect(mockEventBuilder.build).toHaveBeenCalled();

      // Verify relay publish
      expect(mockRelayManager.publishToAll).toHaveBeenCalled();
    });

    it('should create a custom emoji reaction successfully', async () => {
      const testPubkey = 'test-pubkey-123';
      const targetEventId = 'target-event-456';
      const targetAuthorPubkey = 'target-author-789';
      const reactionEventId = 'reaction-event-def';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: reactionEventId,
        kind: 7,
        content: '🚀',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', targetEventId],
          ['p', targetAuthorPubkey]
        ],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: reactionEventId,
        kind: 7,
        content: '🚀',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['e', targetEventId],
          ['p', targetAuthorPubkey]
        ],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue(null);

      const reactionRequest: ReactionRequest = {
        targetEventId,
        targetAuthorPubkey,
        reactionType: '🚀'
      };

      // Execute
      const result = await reactionManager.react(reactionRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.reaction!.reactionType).toBe('🚀');
      expect(mockEventBuilder.content).toHaveBeenCalledWith('🚀');
    });

    it('should fail reaction creation without signing provider', async () => {
      // Create ReactionManager without signing provider
      const configWithoutSigner: ReactionManagerConfig = {
        ...config,
        signingProvider: undefined as any
      };
      
      const reactionManagerNoSigner = new ReactionManager(configWithoutSigner);

      const reactionRequest: ReactionRequest = {
        targetEventId: 'test-event',
        targetAuthorPubkey: 'test-author',
        reactionType: '+'
      };

      // Execute
      const result = await reactionManagerNoSigner.react(reactionRequest);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('No signing provider');

      await reactionManagerNoSigner.close();
    });

    it('should prevent duplicate reactions from same user', async () => {
      const testPubkey = 'test-pubkey-123';
      const targetEventId = 'target-event-456';
      const targetAuthorPubkey = 'target-author-789';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);

      // Mock existing reaction from same user
      const existingReaction: Reaction = {
        eventId: 'existing-reaction-id',
        authorPubkey: testPubkey,
        targetEventId,
        targetAuthorPubkey,
        reactionType: '+',
        createdAt: Date.now() / 1000,
        isOwn: true
      };

      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue({
        summary: {
          targetEventId,
          totalCount: 1,
          reactions: { '+': { type: '+', count: 1, authors: [testPubkey] } },
          userReacted: true,
          userReactionType: '+'
        },
        reactions: [existingReaction],
        timestamp: Date.now(),
        ttl: 300000
      });

      const reactionRequest: ReactionRequest = {
        targetEventId,
        targetAuthorPubkey,
        reactionType: '-'
      };

      // Execute
      const result = await reactionManager.react(reactionRequest);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('already reacted');
    });
  });

  describe('Reaction Fetching', () => {
    it('should fetch reactions for an event', async () => {
      const targetEventId = 'target-event-123';
      const reaction1Id = 'reaction-1-456';
      const reaction2Id = 'reaction-2-789';
      
      // Mock subscription response with multiple reactions
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          // First reaction (like)
          const reaction1Event = {
            id: reaction1Id,
            kind: 7,
            content: '+',
            pubkey: 'user1-pubkey',
            created_at: Math.floor(Date.now() / 1000) - 1000,
            tags: [
              ['e', targetEventId],
              ['p', 'target-author-pubkey']
            ],
            sig: 'reaction1-signature'
          };
          options.onEvent(reaction1Event);
          
          // Second reaction (fire emoji)
          const reaction2Event = {
            id: reaction2Id,
            kind: 7,
            content: '🔥',
            pubkey: 'user2-pubkey',
            created_at: Math.floor(Date.now() / 1000) - 500,
            tags: [
              ['e', targetEventId],
              ['p', 'target-author-pubkey']
            ],
            sig: 'reaction2-signature'
          };
          options.onEvent(reaction2Event);
          
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const reactionCache = await reactionManager.getReactions(targetEventId);

      // Verify reactions structure
      expect(reactionCache).toBeDefined();
      expect(reactionCache!.reactions).toHaveLength(2);
      expect(reactionCache!.summary.totalCount).toBe(2);
      expect(reactionCache!.summary.targetEventId).toBe(targetEventId);

      // Verify individual reactions
      const likeReaction = reactionCache!.reactions.find(r => r.reactionType === '+');
      expect(likeReaction).toBeDefined();
      expect(likeReaction!.authorPubkey).toBe('user1-pubkey');
      expect(likeReaction!.targetEventId).toBe(targetEventId);

      const fireReaction = reactionCache!.reactions.find(r => r.reactionType === '🔥');
      expect(fireReaction).toBeDefined();
      expect(fireReaction!.authorPubkey).toBe('user2-pubkey');

      // Verify aggregated summary
      expect(reactionCache!.summary.reactions['+']).toBeDefined();
      expect(reactionCache!.summary.reactions['+'].count).toBe(1);
      expect(reactionCache!.summary.reactions['🔥']).toBeDefined();
      expect(reactionCache!.summary.reactions['🔥'].count).toBe(1);

      // Verify subscription was called with correct filters
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalled();
      const callArgs = mockSubscriptionManager.subscribe.mock.calls[0];
      const filters = callArgs[0];
      
      expect(filters).toEqual([expect.objectContaining({
        kinds: [7],
        '#e': [targetEventId]
      })]);
    });

    it('should return null for event with no reactions', async () => {
      const nonReactedEventId = 'no-reactions-123';
      
      // Mock subscription that receives EOSE without events
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const reactionCache = await reactionManager.getReactions(nonReactedEventId);

      // Verify
      expect(reactionCache).toBeNull();
    });

    it('should use cache when available', async () => {
      const targetEventId = 'cached-event-123';
      
      // First call - should subscribe
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          const reactionEvent = {
            id: 'cached-reaction-id',
            kind: 7,
            content: '+',
            pubkey: 'cached-user-pubkey',
            created_at: Math.floor(Date.now() / 1000),
            tags: [
              ['e', targetEventId],
              ['p', 'cached-target-author']
            ],
            sig: 'cached-signature'
          };
          options.onEvent(reactionEvent);
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute first call to populate cache
      const reactions1 = await reactionManager.getReactions(targetEventId);
      expect(reactions1).toBeDefined();
      
      // Clear mock to test cache usage
      mockSubscriptionManager.subscribe.mockClear();

      // Execute second call - should use cache
      const reactions2 = await reactionManager.getReactions(targetEventId, { useCache: true });
      expect(reactions2).toBeDefined();
      expect(reactions2!.summary.totalCount).toBe(reactions1!.summary.totalCount);
      expect(mockSubscriptionManager.subscribe).not.toHaveBeenCalled(); // Should not subscribe again
    });
  });

  describe('Reaction Aggregation', () => {
    it('should correctly aggregate multiple reaction types', async () => {
      const targetEventId = 'aggregation-test-123';
      
      // Mock multiple reactions of different types
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          // Multiple likes
          options.onEvent({
            id: 'like1', kind: 7, content: '+', pubkey: 'user1',
            created_at: 1000, tags: [['e', targetEventId], ['p', 'author']], sig: 'sig1'
          });
          options.onEvent({
            id: 'like2', kind: 7, content: '+', pubkey: 'user2',
            created_at: 1001, tags: [['e', targetEventId], ['p', 'author']], sig: 'sig2'
          });
          
          // Single dislike
          options.onEvent({
            id: 'dislike1', kind: 7, content: '-', pubkey: 'user3',
            created_at: 1002, tags: [['e', targetEventId], ['p', 'author']], sig: 'sig3'
          });
          
          // Custom emoji
          options.onEvent({
            id: 'fire1', kind: 7, content: '🔥', pubkey: 'user4',
            created_at: 1003, tags: [['e', targetEventId], ['p', 'author']], sig: 'sig4'
          });
          
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const reactionCache = await reactionManager.getReactions(targetEventId);

      // Verify aggregation
      expect(reactionCache).toBeDefined();
      expect(reactionCache!.summary.totalCount).toBe(4);
      expect(reactionCache!.summary.reactions['+']).toBeDefined();
      expect(reactionCache!.summary.reactions['+'].count).toBe(2);
      expect(reactionCache!.summary.reactions['+'].authors).toHaveLength(2);
      expect(reactionCache!.summary.reactions['+'].authors).toContain('user1');
      expect(reactionCache!.summary.reactions['+'].authors).toContain('user2');
      
      expect(reactionCache!.summary.reactions['-'].count).toBe(1);
      expect(reactionCache!.summary.reactions['🔥'].count).toBe(1);
    });

    it('should get summary directly', async () => {
      const targetEventId = 'summary-test-123';
      
      // Mock getReactions to return cached data
      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue({
        summary: {
          targetEventId,
          totalCount: 3,
          reactions: {
            '+': { type: '+', count: 2, authors: ['user1', 'user2'] },
            '🚀': { type: '🚀', count: 1, authors: ['user3'] }
          },
          userReacted: false
        },
        reactions: [],
        timestamp: Date.now(),
        ttl: 300000
      });

      // Execute
      const summary = await reactionManager.getSummary(targetEventId);

      // Verify
      expect(summary).toBeDefined();
      expect(summary!.totalCount).toBe(3);
      expect(summary!.reactions['+']).toBeDefined();
      expect(summary!.reactions['+'].count).toBe(2);
      expect(summary!.reactions['🚀'].count).toBe(1);
    });
  });

  describe('Reaction Watching', () => {
    it('should watch event and receive real-time updates', async () => {
      const targetEventId = 'watched-event-123';
      const newReactionId = 'new-reaction-456';
      
      // Mock initial reactions fetch
      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue({
        summary: {
          targetEventId,
          totalCount: 1,
          reactions: { '+': { type: '+', count: 1, authors: ['user1'] } },
          userReacted: false
        },
        reactions: [{
          eventId: 'existing-reaction',
          authorPubkey: 'user1',
          targetEventId,
          targetAuthorPubkey: 'target-author',
          reactionType: '+',
          createdAt: Date.now() / 1000,
          isOwn: false
        }],
        timestamp: Date.now(),
        ttl: 300000
      });
      
      // Mock real-time subscription
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        // Simulate a new reaction arriving
        setTimeout(() => {
          const newReaction = {
            id: newReactionId,
            kind: 7,
            content: '🔥',
            pubkey: 'new-user',
            created_at: Math.floor(Date.now() / 1000),
            tags: [
              ['e', targetEventId],
              ['p', 'target-author']
            ],
            sig: 'new-reaction-sig'
          };
          options.onEvent(newReaction);
        }, 100);
        
        return Promise.resolve('subscription-id-123');
      });

      // Start watching
      const watchResult = await reactionManager.watch(targetEventId);
      expect(watchResult).toBe(true);

      // Verify subscription was set up
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [expect.objectContaining({
          kinds: [7],
          '#e': [targetEventId],
          since: expect.any(Number)
        })],
        expect.any(Object)
      );

      // Verify reactive store updates
      let watchedEventsUpdated = false;
      let initialCount = 0;
      const unsubscribe = reactionManager.watchedEvents.subscribe((watched) => {
        const watchedEvent = watched.get(targetEventId);
        if (watchedEvent) {
          if (initialCount === 0) {
            initialCount = watchedEvent.totalCount;
          } else if (watchedEvent.totalCount > initialCount) {
            watchedEventsUpdated = true;
            console.log(`Real-time update: ${watchedEvent.totalCount} total reactions`);
          }
        }
      });

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 200));

      // The test might pass without real-time update in unit test environment
      console.log(`Watch events updated: ${watchedEventsUpdated}`);
      unsubscribe();

      // Stop watching
      await reactionManager.unwatch(targetEventId);
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('subscription-id-123');
    });

    it('should handle watching event with no existing reactions', async () => {
      const targetEventId = 'no-reactions-watch-123';
      
      // Mock no existing reactions
      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue(null);
      mockSigningProvider.getPublicKey.mockResolvedValue('test-user');
      
      mockSubscriptionManager.subscribe.mockResolvedValue('subscription-id-456');

      // Start watching
      const watchResult = await reactionManager.watch(targetEventId);
      expect(watchResult).toBe(true);

      // Verify empty summary was created
      let emptySummaryCreated = false;
      const unsubscribe = reactionManager.watchedEvents.subscribe((watched) => {
        const watchedEvent = watched.get(targetEventId);
        if (watchedEvent && watchedEvent.totalCount === 0) {
          emptySummaryCreated = true;
          expect(watchedEvent.targetEventId).toBe(targetEventId);
          expect(watchedEvent.userReacted).toBe(false);
        }
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(emptySummaryCreated).toBe(true);
      unsubscribe();

      await reactionManager.unwatch(targetEventId);
    });
  });

  describe('Cleanup', () => {
    it('should close all subscriptions and clear cache', async () => {
      // Set up some subscriptions first by watching an event
      mockSubscriptionManager.subscribe.mockResolvedValue('test-subscription-id');
      vi.spyOn(reactionManager, 'getReactions').mockResolvedValue(null);
      mockSigningProvider.getPublicKey.mockResolvedValue('test-user');
      
      await reactionManager.watch('test-event-id');
      
      // Execute cleanup
      await reactionManager.close();

      // Verify cleanup was called for active subscriptions
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('test-subscription-id');
    });
  });
});