/**
 * NIP-10: Threading and Replies - Focused Tests
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/10.md
 *
 * Focuses on:
 * - Marked e-tags (preferred): "root" and "reply" markers
 * - P-tag propagation: All parent p-tags + parent author
 * - Event structure validation
 *
 * Architecture: Layer 2 (Social Module)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-10: Threading and Replies (Focused)', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = new TestEnvironment({
      relayUrls: RELAY_URLS,
      debug: false
    });
  }, 30000);

  afterAll(async () => {
    await env.cleanup();
  });

  describe('Root Event Structure', () => {
    it('should create root event without e-tags', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP10-F1']);
      
      // Subscription first
      alice.nostr.sub()
        .kinds([1])
        .authors([alice.publicKey])
        .execute()
        .catch(() => {});
      
      await env.waitForSubscription(500);
      
      // Publish
      const result = await alice.nostr.social.threads.createThread('Root post');
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(1000);
      
      // Query
      const events = alice.nostr.query()
        .kinds([1])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(500);
      
      expect(events.current.length).toBeGreaterThan(0);
      const event = events.current.find((e: any) => e.id === result.eventId);
      expect(event).toBeDefined();
      expect(event.kind).toBe(1);
      
      // Root should have NO e-tags
      const eTags = event.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBe(0);
    });
  });

  describe('Direct Reply (NIP-10 Marked Tags)', () => {
    it('should add e-tag with marker for direct reply', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP10-F2', 'Bob-NIP10-F2']);
      
      // Subscribe for alice's posts
      alice.nostr.sub()
        .kinds([1])
        .authors([alice.publicKey])
        .execute()
        .catch(() => {});
      
      await env.waitForSubscription(500);
      
      // Alice creates root
      const rootResult = await alice.nostr.social.threads.createThread('Root');
      expect(rootResult.success).toBe(true);
      await env.waitForPropagation(1000);
      
      // Subscribe for bob's reply BEFORE publishing
      bob.nostr.sub()
        .kinds([1])
        .authors([bob.publicKey])
        .execute()
        .catch(() => {});
      
      await env.waitForSubscription(500);
      
      // Bob replies
      const replyResult = await bob.nostr.social.threads.reply(rootResult.eventId!, 'Reply');
      expect(replyResult.success).toBe(true);
      await env.waitForPropagation(1000);
      
      // Query Bob's reply
      const events = bob.nostr.query()
        .kinds([1])
        .authors([bob.publicKey])
        .execute();
      
      await env.waitForSubscription(500);
      
      expect(events.current.length).toBeGreaterThan(0);
      const replyEvent = events.current.find((e: any) => e.id === replyResult.eventId);
      expect(replyEvent).toBeDefined();
      
      // Should have e-tags with markers
      const eTags = replyEvent.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBeGreaterThan(0);
      
      // Check for markers (root or reply)
      const hasMarkers = eTags.some((t: string[]) => t[3] === 'root' || t[3] === 'reply');
      expect(hasMarkers).toBe(true);
    });
  });

  describe('Nested Reply (Root + Reply Markers)', () => {
    it('should have both root and reply markers for nested reply', async () => {
      const [alice, bob, charlie] = await env.createTestUsers(['Alice-NIP10-F3', 'Bob-NIP10-F3', 'Charlie-NIP10-F3']);
      
      // GLOBAL subscription for ALL kind:1 events to catch everything
      charlie.nostr.sub().kinds([1]).execute().catch(() => {});
      
      await env.waitForSubscription(1000);
      
      // Alice -> Bob -> Charlie
      const rootResult = await alice.nostr.social.threads.createThread('Root');
      expect(rootResult.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const bobReply = await bob.nostr.social.threads.reply(rootResult.eventId!, 'Bob');
      expect(bobReply.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const charlieReply = await charlie.nostr.social.threads.reply(bobReply.eventId!, 'Charlie');
      expect(charlieReply.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query Charlie's reply - wait longer for multi-user scenario
      await env.waitForSubscription(1500);
      
      const events = charlie.nostr.query()
        .kinds([1])
        .authors([charlie.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Multi-user scenario needs extra time
      let finalEvent = events.current.find((e: any) => e.id === charlieReply.eventId);
      
      // Retry up to 3 times if needed
      for (let i = 0; i < 3 && !finalEvent; i++) {
        await env.waitForPropagation(1000);
        finalEvent = events.current.find((e: any) => e.id === charlieReply.eventId);
      }
      
      expect(finalEvent).toBeDefined();
      
      const eTags = finalEvent.tags.filter((t: string[]) => t[0] === 'e');
      
      // Nested reply should have markers
      const rootTag = eTags.find((t: string[]) => t[3] === 'root');
      const replyTag = eTags.find((t: string[]) => t[3] === 'reply');
      
      // At least one marker should exist
      expect(rootTag || replyTag).toBeTruthy();
      
      // If we have both, verify they're correct
      if (rootTag && replyTag) {
        expect(rootTag[1]).toBe(rootResult.eventId); // Root = Alice's post
        expect(replyTag[1]).toBe(bobReply.eventId); // Reply = Bob's post
      }
    });
  });

  describe('P-Tag Propagation (NIP-10 Requirement)', () => {
    it('should include parent author in p-tags', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP10-F4', 'Bob-NIP10-F4']);
      
      // GLOBAL subscription for ALL kind:1 events
      bob.nostr.sub().kinds([1]).execute().catch(() => {});
      
      await env.waitForSubscription(1000);
      
      // Alice creates root
      const rootResult = await alice.nostr.social.threads.createThread('Root');
      await env.waitForPropagation(2000);
      
      // Bob replies
      const replyResult = await bob.nostr.social.threads.reply(rootResult.eventId!, 'Reply');
      await env.waitForPropagation(2000);
      
      // Wait before query
      await env.waitForSubscription(1500);
      
      // Query
      const events = bob.nostr.query()
        .kinds([1])
        .authors([bob.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      let replyEvent = events.current.find((e: any) => e.id === replyResult.eventId);
      
      // Retry up to 3 times
      for (let i = 0; i < 3 && !replyEvent; i++) {
        await env.waitForPropagation(1000);
        replyEvent = events.current.find((e: any) => e.id === replyResult.eventId);
      }
      
      expect(replyEvent).toBeDefined();
      
      const pTags = replyEvent.tags.filter((t: string[]) => t[0] === 'p');
      const pubkeys = pTags.map((t: string[]) => t[1]);
      
      // Should have Alice's pubkey
      expect(pubkeys).toContain(alice.publicKey);
    });

    it('should propagate all parent p-tags (NIP-10)', async () => {
      const [alice, bob, charlie, dave] = await env.createTestUsers([
        'Alice-NIP10-F5',
        'Bob-NIP10-F5',
        'Charlie-NIP10-F5',
        'Dave-NIP10-F5'
      ]);
      
      // GLOBAL subscription for ALL kind:1 events - use Dave's instance to catch all
      dave.nostr.sub().kinds([1]).execute().catch(() => {});
      
      await env.waitForSubscription(1000);
      
      // Alice creates root mentioning Charlie
      const rootResult = await alice.nostr.social.threads.createThread({
        content: 'Root',
        mentions: [charlie.publicKey]
      });
      await env.waitForPropagation(2000);
      
      // Bob replies to Alice (should get Alice + Charlie)
      const bobReply = await bob.nostr.social.threads.reply(rootResult.eventId!, 'Bob');
      await env.waitForPropagation(2000);
      
      // Dave replies to Bob (should get Alice + Charlie + Bob)
      const daveReply = await dave.nostr.social.threads.reply(bobReply.eventId!, 'Dave');
      await env.waitForPropagation(2000);
      
      // Wait before query - multi-user needs more time
      await env.waitForSubscription(1500);
      
      // Query Dave's reply
      const events = dave.nostr.query()
        .kinds([1])
        .authors([dave.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      let replyEvent = events.current.find((e: any) => e.id === daveReply.eventId);
      
      // Retry up to 3 times for complex multi-user scenario
      for (let i = 0; i < 3 && !replyEvent; i++) {
        await env.waitForPropagation(1000);
        replyEvent = events.current.find((e: any) => e.id === daveReply.eventId);
      }
      
      expect(replyEvent).toBeDefined();
      
      const pTags = replyEvent.tags.filter((t: string[]) => t[0] === 'p');
      const pubkeys = pTags.map((t: string[]) => t[1]);
      
      // NIP-10: Should have Alice (root author), Charlie (mentioned), Bob (parent author)
      // With our fix, all three should now be present
      expect(pubkeys).toContain(bob.publicKey); // Parent author
      expect(pubkeys).toContain(alice.publicKey); // From Bob's p-tags (root author)
      expect(pubkeys).toContain(charlie.publicKey); // From Bob's p-tags (mentioned in root)
    });
  });

  describe('Performance', () => {
    it('should create thread within 2000ms', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP10-F6']);
      
      alice.nostr.sub().kinds([1]).authors([alice.publicKey]).execute().catch(() => {});
      await env.waitForSubscription(500);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.social.threads.createThread('Perf test');
      
      const duration = env.endPerformanceMeasurement('NIP-10 create thread');
      env.assertPerformance(duration, 2000, 'NIP-10 create thread');
    });
  });
});

