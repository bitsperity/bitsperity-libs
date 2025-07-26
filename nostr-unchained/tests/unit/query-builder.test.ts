/**
 * QueryBuilder TDD Tests - Day 2 Implementation
 * 
 * RED Phase: Comprehensive failing tests for QueryBuilder API
 * - Method chaining immutability
 * - NIP-01 filter compilation
 * - Query execution through SubscriptionManager integration
 * - TypeScript generic constraints
 * - Fluent API with complex filter combinations
 * - Error handling for invalid filters
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import type { 
  NostrEvent, 
  Filter, 
  SubscriptionOptions, 
  SubscriptionResult,
} from '../../src/core/types.js';
import { query, IQueryBuilder } from '../../src/query/QueryBuilder.js';

// Mock SubscriptionManager for testing
const mockSubscriptionManager = {
  subscribe: vi.fn(),
} as any;

// Create query factory with mock SubscriptionManager
const testQuery = () => query(mockSubscriptionManager);

describe('QueryBuilder TDD - RED Phase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Method Chaining Immutability', () => {
    it('should create new instances on each method call', () => {
      // RED: This test will fail until we implement immutable method chaining
      const builder1 = testQuery();
      const builder2 = builder1.kinds([1]);
      const builder3 = builder2.authors(['npub1abc123...']);
      
      // Each builder should be a different instance
      expect(builder1).not.toBe(builder2);
      expect(builder2).not.toBe(builder3);
      expect(builder1).not.toBe(builder3);
    });

    it('should preserve previous builder state when chaining', () => {
      // RED: This will fail until we implement proper immutability
      const baseBuilder = testQuery().kinds([1]);
      const builder1 = baseBuilder.authors(['npub1abc...']);
      const builder2 = baseBuilder.authors(['npub1def...']);
      
      const filter1 = builder1.toFilter();
      const filter2 = builder2.toFilter();
      
      // Both should have kinds=[1] but different authors
      expect(filter1[0].kinds).toEqual([1]);
      expect(filter2[0].kinds).toEqual([1]);
      expect(filter1[0].authors).toEqual(['npub1abc...']);
      expect(filter2[0].authors).toEqual(['npub1def...']);
    });

    it('should allow complex method chaining combinations', () => {
      // RED: This will fail until we implement all methods
      const builder = testQuery()
        .kinds([1, 6])
        .authors(['npub1abc...', 'npub1def...'])
        .since(Date.now() - 86400000)
        .limit(50)
        .tags('e', ['event1', 'event2']);
      
      const filters = builder.toFilter();
      expect(filters).toHaveLength(1);
      expect(filters[0]).toMatchObject({
        kinds: [1, 6],
        authors: ['npub1abc...', 'npub1def...'],
        since: expect.any(Number),
        limit: 50,
        '#e': ['event1', 'event2']
      });
    });
  });

  describe('NIP-01 Filter Compilation', () => {
    it('should compile basic filters correctly', () => {
      // RED: This will fail until we implement toFilter()
      const builder = testQuery()
        .kinds([1])
        .authors(['npub1abc123...'])
        .limit(10);
      
      const filters = builder.toFilter();
      
      expect(filters).toHaveLength(1);
      expect(filters[0]).toEqual({
        kinds: [1],
        authors: ['npub1abc123...'],
        limit: 10
      });
    });

    it('should handle multiple kinds correctly', () => {
      // RED: This will fail until we implement kinds()
      const builder = testQuery().kinds([1, 6, 7]);
      const filters = builder.toFilter();
      
      expect(filters[0].kinds).toEqual([1, 6, 7]);
    });

    it('should handle time-based filters', () => {
      // RED: This will fail until we implement since/until
      const since = Date.now() - 86400000;
      const until = Date.now();
      
      const builder = testQuery()
        .since(since)
        .until(until);
      
      const filters = builder.toFilter();
      expect(filters[0]).toMatchObject({
        since,
        until
      });
    });

    it('should handle tag filters with NIP-01 format', () => {
      // RED: This will fail until we implement tags()
      const builder = testQuery()
        .tags('e', ['event123'])
        .tags('p', ['pubkey456']);
      
      const filters = builder.toFilter();
      expect(filters[0]).toMatchObject({
        '#e': ['event123'],
        '#p': ['pubkey456']
      });
    });

    it('should create multiple filters for complex queries', () => {
      // RED: This will fail until we implement filter splitting logic
      const builder = testQuery()
        .kinds([1])
        .authors(['author1'])
        .union(
          testQuery()
            .kinds([6])
            .authors(['author2'])
        );
      
      const filters = builder.toFilter();
      expect(filters).toHaveLength(2);
      expect(filters[0]).toMatchObject({ kinds: [1], authors: ['author1'] });
      expect(filters[1]).toMatchObject({ kinds: [6], authors: ['author2'] });
    });
  });

  describe('Query Execution through SubscriptionManager', () => {
    it('should execute query and return events', async () => {
      // RED: This will fail until we implement execute()
      const mockEvents = [
        { id: 'event1', kind: 1, content: 'Hello' } as NostrEvent,
        { id: 'event2', kind: 1, content: 'World' } as NostrEvent
      ];

      // Mock that simulates EOSE callback immediately
      mockSubscriptionManager.subscribe.mockImplementation((filters: any, options: any) => {
        // Simulate receiving events
        if (options.onEvent) {
          mockEvents.forEach(event => options.onEvent(event));
        }
        
        // Simulate EOSE
        if (options.onEose) {
          setTimeout(() => options.onEose('wss://relay.example.com'), 0);
        }
        
        return Promise.resolve({
          subscription: { 
            id: 'sub123',
            eventCount: 2,
            state: 'active'
          },
          success: true,
          relayResults: [{
            relay: 'wss://relay.example.com',
            success: true,
            subscriptionId: 'sub123'
          }]
        });
      });

      const builder = testQuery()
        .kinds([1])
        .limit(10);
      
      const events = await builder.execute();
      
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [{ kinds: [1], limit: 10 }],
        expect.objectContaining({
          onEvent: expect.any(Function),
          onEose: expect.any(Function),
          autoClose: true
        })
      );
      
      // Should return events collected during subscription
      expect(events).toHaveLength(2);
      expect(events).toEqual(mockEvents);
    }, 15000);

    it('should pass subscription options correctly', async () => {
      // RED: This will fail until we implement option passing
      // Reset to simple mock for this test
      mockSubscriptionManager.subscribe.mockResolvedValue({
        subscription: { id: 'sub789', eventCount: 0, state: 'active' },
        success: true,
        relayResults: []
      });

      const options: SubscriptionOptions = {
        relays: ['wss://relay1.com', 'wss://relay2.com'],
        timeout: 5000
      };

      const builder = testQuery().kinds([1]);
      await builder.execute(options);
      
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          relays: ['wss://relay1.com', 'wss://relay2.com'],
          timeout: 5000,
          onEvent: expect.any(Function),
          onEose: expect.any(Function),
          autoClose: true
        })
      );
    }, 15000);

    it('should handle subscription errors gracefully', async () => {
      // RED: This will fail until we implement error handling
      // Reset to error mock for this test
      mockSubscriptionManager.subscribe.mockResolvedValue({
        subscription: { id: 'sub123', eventCount: 0, state: 'error' },
        success: false,
        relayResults: [],
        error: { message: 'All relays failed', retryable: true }
      });

      const builder = testQuery().kinds([1]);
      
      await expect(builder.execute()).rejects.toThrow('All relays failed');
    });

    it('should create subscription without auto-closing', async () => {
      // RED: This will fail until we implement subscribe()
      // Reset to simple mock for this test
      mockSubscriptionManager.subscribe.mockResolvedValue({
        subscription: { 
          id: 'sub456',
          eventCount: 0,
          state: 'active'
        },
        success: true,
        relayResults: [{
          relay: 'wss://relay.example.com',
          success: true,
          subscriptionId: 'sub456'
        }]
      });

      const builder = testQuery().kinds([1]);
      
      const result = await builder.subscribe({
        onEvent: vi.fn(),
        onEose: vi.fn()
      });
      
      expect(result.success).toBe(true);
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [{ kinds: [1] }],
        expect.objectContaining({
          onEvent: expect.any(Function),
          onEose: expect.any(Function),
          autoClose: false
        })
      );
    });
  });

  describe('TypeScript Generic Constraints', () => {
    it('should enforce type constraints with kinds', () => {
      // RED: This will fail until we implement proper TypeScript generics
      const textNoteBuilder: QueryBuilder<NostrEvent & { kind: 1 }> = testQuery().kinds([1]);
      const reactionBuilder: QueryBuilder<NostrEvent & { kind: 7 }> = testQuery().kinds([7]);
      const mixedBuilder: QueryBuilder<NostrEvent & { kind: 1 | 6 }> = testQuery().kinds([1, 6]);
      
      // These should compile without errors when properly typed
      expect(textNoteBuilder).toBeDefined();
      expect(reactionBuilder).toBeDefined();
      expect(mixedBuilder).toBeDefined();
    });

    it('should preserve type information through method chaining', () => {
      // RED: This will fail until we implement proper generic preservation
      const typedBuilder = testQuery()
        .kinds([1])
        .authors(['npub1abc...'])
        .since(Date.now() - 86400000);
      
      // The type should be preserved through chaining
      const filters = typedBuilder.toFilter();
      expect(filters[0].kinds).toEqual([1]);
    });

    it('should handle union types correctly', () => {
      // RED: This will fail until we implement union with proper typing
      const textNotes = testQuery().kinds([1]);
      const reactions = testQuery().kinds([7]);
      const combined = textNotes.union(reactions);
      
      const filters = combined.toFilter();
      expect(filters).toHaveLength(2);
    });
  });

  describe('Fluent API Complex Combinations', () => {
    it('should handle complex real-world queries', () => {
      // RED: This will fail until we implement all methods
      const builder = testQuery()
        .kinds([1, 6]) // Text notes and reposts
        .authors(['npub1alice...', 'npub1bob...'])
        .since(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
        .tags('t', ['nostr', 'bitcoin']) // Tagged with nostr or bitcoin
        .limit(100)
        .search('decentralized'); // Contains "decentralized"
      
      const filters = builder.toFilter();
      expect(filters[0]).toMatchObject({
        kinds: [1, 6],
        authors: ['npub1alice...', 'npub1bob...'],
        since: expect.any(Number),
        '#t': ['nostr', 'bitcoin'],
        limit: 100,
        search: 'decentralized'
      });
    });

    it('should support query intersection', () => {
      // RED: This will fail until we implement intersect()
      const recentPosts = testQuery()
        .kinds([1])
        .since(Date.now() - 86400000);
      
      const taggedPosts = testQuery()
        .tags('t', ['nostr']);
      
      const intersection = recentPosts.intersect(taggedPosts);
      const filters = intersection.toFilter();
      
      expect(filters[0]).toMatchObject({
        kinds: [1],
        since: expect.any(Number),
        '#t': ['nostr']
      });
    });

    it('should handle empty filter combinations gracefully', () => {
      // RED: This will fail until we implement proper empty handling
      const emptyBuilder = testQuery();
      const filters = emptyBuilder.toFilter();
      
      expect(filters).toHaveLength(1);
      expect(filters[0]).toEqual({});
    });
  });

  describe('Error Handling for Invalid Filters', () => {
    it('should validate kinds parameter', () => {
      // RED: This will fail until we implement validation
      const builder = testQuery();
      
      expect(() => builder.kinds([])).toThrow('kinds cannot be empty');
      expect(() => (builder as any).kinds([1.5])).toThrow('kinds must be integers');
      expect(() => (builder as any).kinds(['1'])).toThrow('kinds must be numbers');
    });

    it('should validate authors parameter', () => {
      // RED: This will fail until we implement validation
      const builder = testQuery();
      
      expect(() => builder.authors([])).toThrow('authors cannot be empty');
      expect(() => (builder as any).authors([123])).toThrow('authors must be strings');
    });

    it('should validate timestamp parameters', () => {
      // RED: This will fail until we implement validation
      const builder = testQuery();
      
      expect(() => (builder as any).since('invalid')).toThrow('since must be a number');
      expect(() => builder.since(-1)).toThrow('since must be positive');
      expect(() => (builder as any).until('invalid')).toThrow('until must be a number');
    });

    it('should validate limit parameter', () => {
      // RED: This will fail until we implement validation
      const builder = testQuery();
      
      expect(() => builder.limit(0)).toThrow('limit must be positive');
      expect(() => builder.limit(-1)).toThrow('limit must be positive');
      expect(() => (builder as any).limit('10')).toThrow('limit must be a number');
    });

    it('should provide comprehensive validation report', () => {
      // RED: This will fail until we implement validate()
      const builder = testQuery()
        .since(Date.now())
        .until(Date.now() - 86400000); // until before since
      
      const validation = builder.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('until must be after since');
    });

    it('should handle conflicting filters', () => {
      // In an immutable design, the last limit wins (no conflict)
      const builder = testQuery()
        .limit(100)
        .limit(50); // Last limit wins
      
      const filters = builder.toFilter();
      expect(filters[0].limit).toBe(50); // Last limit should win
      
      const validation = builder.validate();
      expect(validation.valid).toBe(true); // No conflict in immutable design
    });
  });

  describe('Filter Optimization', () => {
    it('should optimize redundant filters', () => {
      // RED: This will fail until we implement optimization
      const builder = testQuery()
        .kinds([1, 1, 6]) // Duplicate kinds
        .authors(['npub1abc...', 'npub1abc...']); // Duplicate authors
      
      const filters = builder.toFilter();
      
      expect(filters[0].kinds).toEqual([1, 6]); // Deduplicated
      expect(filters[0].authors).toEqual(['npub1abc...']); // Deduplicated
    });

    it('should merge compatible tag filters', () => {
      // RED: This will fail until we implement tag merging
      const builder = testQuery()
        .tags('e', ['event1'])
        .tags('e', ['event2']);
      
      const filters = builder.toFilter();
      expect(filters[0]['#e']).toEqual(['event1', 'event2']);
    });
  });
});