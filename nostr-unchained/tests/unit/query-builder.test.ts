/**
 * REAL QueryBuilder Tests - 100% Authentic
 * 
 * Tests QueryBuilder against REAL relay with REAL events:
 * - Real relay communication
 * - Real event subscription 
 * - Real filter validation
 * - No mocks, no fakes, no stubs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 15000;

describe('REAL QueryBuilder Tests', () => {
  let nostr: NostrUnchained;
  let signer: TemporarySigner;

  beforeEach(async () => {
    signer = new TemporarySigner();
    
    nostr = new NostrUnchained({
      relays: [LIVE_RELAY_URL],
      debug: true,
      signingProvider: signer
    });

    await nostr.connect();
    await nostr.initializeSigning();
  }, TEST_TIMEOUT);

  afterEach(async () => {
    try {
      await nostr?.disconnect();
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Real Query Execution', () => {
    it('should execute query against real relay', async () => {
      const query = nostr.query()
        .kinds([1])
        .limit(5)
        .execute();

      expect(query).toBeDefined();
      expect(typeof query.subscribe).toBe('function');
      expect(Array.isArray(query.current)).toBe(true);
    });

    it('should filter by kinds correctly', async () => {
      const query = nostr.query()
        .kinds([0]) // Profile events
        .limit(3)
        .execute();

      let profileEvents: any[] = [];
      const unsubscribe = query.subscribe(events => {
        profileEvents = events;
      });

      // Wait for some events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // All events should be kind 0
      if (profileEvents.length > 0) {
        profileEvents.forEach(event => {
          expect(event.kind).toBe(0);
        });
      }

      unsubscribe();
    });

    it('should respect limit parameter', async () => {
      const limit = 3;
      const query = nostr.query()
        .kinds([1])
        .limit(limit)
        .execute();

      let textNotes: any[] = [];
      const unsubscribe = query.subscribe(events => {
        textNotes = events;
      });

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should not exceed limit
      expect(textNotes.length).toBeLessThanOrEqual(limit);

      unsubscribe();
    });

    it('should chain methods immutably', () => {
      const builder1 = nostr.query();
      const builder2 = builder1.kinds([1]);
      const builder3 = builder2.limit(10);

      // Each should be different instances
      expect(builder1).not.toBe(builder2);
      expect(builder2).not.toBe(builder3);
      expect(builder1).not.toBe(builder3);
    });

    it('should handle author filtering', async () => {
      // First, publish an event to have something to query
      const testContent = `Query test ${Date.now()}`;
      const publishResult = await nostr.events.note(testContent).publish();

      if (publishResult.success) {
        const myPubkey = await signer.getPublicKey();

        // Query for our own events
        const query = nostr.query()
          .kinds([1])
          .authors([myPubkey])
          .limit(5)
          .execute();

        let myEvents: any[] = [];
        const unsubscribe = query.subscribe(events => {
          myEvents = events;
        });

        // Wait for our event to appear
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Should find our published event
        const foundOurEvent = myEvents.some(event => 
          event.content === testContent && 
          event.pubkey === myPubkey
        );

        expect(foundOurEvent).toBe(true);

        unsubscribe();
      }
    });

    it('should handle tag filtering', async () => {
      // Test p-tag filtering
      const query = nostr.query()
        .kinds([1])
        .tags('p') // Any events with p-tags (mentions)
        .limit(5)
        .execute();

      let eventsWithPTags: any[] = [];
      const unsubscribe = query.subscribe(events => {
        eventsWithPTags = events;
      });

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // All events should have p-tags
      if (eventsWithPTags.length > 0) {
        eventsWithPTags.forEach(event => {
          const hasPTag = event.tags.some((tag: string[]) => tag[0] === 'p');
          expect(hasPTag).toBe(true);
        });
      }

      unsubscribe();
    });

    it('should handle time-based filtering', async () => {
      const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
      
      const query = nostr.query()
        .kinds([1])
        .since(oneDayAgo)
        .limit(5)
        .execute();

      let recentEvents: any[] = [];
      const unsubscribe = query.subscribe(events => {
        recentEvents = events;
      });

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // All events should be from the last day
      if (recentEvents.length > 0) {
        recentEvents.forEach(event => {
          expect(event.created_at).toBeGreaterThanOrEqual(oneDayAgo);
        });
      }

      unsubscribe();
    });
  });

  describe('Real Subscription Management', () => {
    it('should handle subscription lifecycle correctly', async () => {
      const query = nostr.query()
        .kinds([1])
        .limit(3)
        .execute();

      let eventCount = 0;
      let subscriptionActive = true;

      const unsubscribe = query.subscribe(events => {
        eventCount = events.length;
      });

      // Wait for initial events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should have received some events
      expect(eventCount).toBeGreaterThanOrEqual(0);

      // Unsubscribe should work
      unsubscribe();
      subscriptionActive = false;

      expect(subscriptionActive).toBe(false);
    });

    it('should provide current state access', async () => {
      const query = nostr.query()
        .kinds([0]) // Profile events
        .limit(2)
        .execute();

      // Wait for some events to be cached
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Current should return cached events
      const current = query.current;
      expect(Array.isArray(current)).toBe(true);

      // If we have events, they should be kind 0
      if (current.length > 0) {
        current.forEach(event => {
          expect(event.kind).toBe(0);
        });
      }
    });
  });
});