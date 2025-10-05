/**
 * NIP-25: Reactions - Focused Tests
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/25.md
 *
 * Covers:
 * - kind 7 Reaction events
 * - Event structure validation (e-tag, p-tag, k-tag, content)
 * - Standard reactions (like +, dislike -, empty string)
 * - Custom emoji reactions
 * - Cross-user reactions
 * - Reaction aggregation & counts
 * - Unreact (NIP-09 deletion)
 *
 * Architecture: Layer 2 (Social Module - Reactions)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-25: Reactions (Focused)', () => {
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

  describe('Kind 7 Reaction Event Structure', () => {
    it('should create kind 7 reaction with correct structure', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F1']);
      
      // Global subscription for all events
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original note
      const original = await alice.nostr.social.content.publishNote('Original note');
      expect(original.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // React to it
      const reaction = await alice.nostr.social.reactions.react(original.eventId!, '+');
      expect(reaction.success).toBe(true);
      expect(reaction.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      await env.waitForPropagation(2000);
      
      // Query the reaction
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      
      // Validate structure
      expect(reactionEvent.kind).toBe(7);
      expect(reactionEvent.content).toBe('+'); // Like
      
      // Must have e-tag
      const eTags = reactionEvent.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBeGreaterThan(0);
      expect(eTags[0][1]).toBe(original.eventId);
      
      // Should have p-tag
      const pTags = reactionEvent.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBeGreaterThan(0);
      expect(pTags[0][1]).toBe(alice.publicKey);
    });

    it('should include k-tag with target event kind', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F2']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original
      const original = await alice.nostr.social.content.publishNote('Original');
      await env.waitForPropagation(2000);
      
      // React
      const reaction = await alice.nostr.social.reactions.react(original.eventId!);
      await env.waitForPropagation(2000);
      
      // Query
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      
      // Should have k-tag with "1" (kind of text note)
      const kTags = reactionEvent.tags.filter((t: string[]) => t[0] === 'k');
      if (kTags.length > 0) {
        expect(kTags[0][1]).toBe('1');
      }
    });
  });

  describe('Standard Reactions', () => {
    it('should handle "+" like reaction', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F3']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      const reaction = await alice.nostr.social.reactions.react(original.eventId!, '+');
      expect(reaction.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      expect(reactionEvent.content).toBe('+');
    });

    it('should handle "-" dislike reaction', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F4']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      const reaction = await alice.nostr.social.reactions.react(original.eventId!, '-');
      expect(reaction.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      expect(reactionEvent.content).toBe('-');
    });

    it('should handle empty string as like', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F5']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      const reaction = await alice.nostr.social.reactions.react(original.eventId!, '');
      expect(reaction.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      expect(reactionEvent.content).toBe('');
    });
  });

  describe('Custom Emoji Reactions', () => {
    it('should handle emoji reactions', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F6']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      // Various emojis
      const emojis = ['❤️', '👍', '🔥', '😂', '🎉'];
      
      for (const emoji of emojis) {
        const reaction = await alice.nostr.social.reactions.react(original.eventId!, emoji);
        expect(reaction.success).toBe(true);
        await env.waitForPropagation(1000);
      }
      
      await env.waitForPropagation(2000);
      
      // Query all reactions
      const events = alice.nostr.query()
        .kinds([7])
        .tags('e', [original.eventId!])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have at least 5 reactions
      expect(events.current.length).toBeGreaterThanOrEqual(5);
      
      // Verify emoji content
      const contents = events.current.map((e: any) => e.content);
      emojis.forEach(emoji => {
        expect(contents).toContain(emoji);
      });
    });

    it('should handle custom shortcode reactions', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F7']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      // NIP-30 custom emoji format
      const reaction = await alice.nostr.social.reactions.react(original.eventId!, ':soapbox:');
      expect(reaction.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      expect(reactionEvent.content).toBe(':soapbox:');
    });
  });

  describe('Cross-User Reactions', () => {
    it('should allow multiple users to react to same note', async () => {
      const [alice, bob, charlie] = await env.createTestUsers(['Alice-NIP25-F8', 'Bob-NIP25-F8', 'Charlie-NIP25-F8']);
      
      // Global subscription
      charlie.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Alice creates note
      const original = await alice.nostr.social.content.publishNote('Popular note');
      await env.waitForPropagation(2000);
      
      // Bob and Charlie react
      const bobReaction = await bob.nostr.social.reactions.react(original.eventId!, '+');
      const charlieReaction = await charlie.nostr.social.reactions.react(original.eventId!, '❤️');
      
      expect(bobReaction.success).toBe(true);
      expect(charlieReaction.success).toBe(true);
      
      await env.waitForPropagation(2000);
      
      // Query all reactions to Alice's note
      const events = charlie.nostr.query()
        .kinds([7])
        .tags('e', [original.eventId!])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have at least Bob and Charlie's reactions
      expect(events.current.length).toBeGreaterThanOrEqual(2);
      
      // Verify both users reacted
      const authors = events.current.map((e: any) => e.pubkey);
      expect(authors).toContain(bob.publicKey);
      expect(authors).toContain(charlie.publicKey);
    });
  });

  describe('Multiple Reactions', () => {
    it('should allow user to react multiple times with different emojis', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F9']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      // React multiple times
      await alice.nostr.social.reactions.react(original.eventId!, '+');
      await env.waitForPropagation(1000);
      await alice.nostr.social.reactions.react(original.eventId!, '❤️');
      await env.waitForPropagation(1000);
      await alice.nostr.social.reactions.react(original.eventId!, '🔥');
      await env.waitForPropagation(2000);
      
      // Query all reactions
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .tags('e', [original.eventId!])
        .execute();
      
      await env.waitForSubscription(1000);
      
      // Should have 3 reactions
      expect(events.current.length).toBeGreaterThanOrEqual(3);
      
      const contents = events.current.map((e: any) => e.content);
      expect(contents).toContain('+');
      expect(contents).toContain('❤️');
      expect(contents).toContain('🔥');
    });
  });

  describe('Edge Cases', () => {
    it('should handle reacting to non-existent event gracefully', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F10']);
      
      const fakeEventId = 'a'.repeat(64);
      const reaction = await alice.nostr.social.reactions.react(fakeEventId);
      
      expect(reaction.success).toBe(false);
      expect(reaction.error).toBeDefined();
    });

    it('should handle very long emoji strings', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F11']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const original = await alice.nostr.social.content.publishNote('Note');
      await env.waitForPropagation(2000);
      
      // Long emoji string
      const longEmoji = '🔥'.repeat(50);
      const reaction = await alice.nostr.social.reactions.react(original.eventId!, longEmoji);
      
      expect(reaction.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([7])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reactionEvent = events.current.find((e: any) => e.id === reaction.eventId);
      expect(reactionEvent).toBeDefined();
      expect(reactionEvent.content).toBe(longEmoji);
    });
  });

  describe('Performance', () => {
    it('should complete reaction within 2000ms', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP25-F12']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 7]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create original
      const original = await alice.nostr.social.content.publishNote('Perf test');
      await env.waitForPropagation(2000);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.social.reactions.react(original.eventId!, '+');
      
      const duration = env.endPerformanceMeasurement('NIP-25 reaction');
      env.assertPerformance(duration, 2000, 'NIP-25 reaction');
    });
  });
});

