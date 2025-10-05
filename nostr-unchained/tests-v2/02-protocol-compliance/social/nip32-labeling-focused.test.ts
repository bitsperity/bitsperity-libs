/**
 * NIP-32: Labeling - Focused Tests
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/32.md
 *
 * Covers:
 * - kind 1985 Label events
 * - Event structure validation (L-tag, l-tag, targets)
 * - Label namespaces (ISO, reverse domain notation, ugc)
 * - Label targets (e, p, a, r, t tags)
 * - Self-reporting (labels on other event kinds)
 * - Content/reason field
 * - Reactive queries (forEvent)
 *
 * Architecture: Layer 2 (Social Module - Labels)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-32: Labeling (Focused)', () => {
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

  describe('Kind 1985 Label Event Structure', () => {
    it('should create kind 1985 label with L and l tags', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F1', 'Bob-NIP32-F1']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Label Bob's profile
      const result = await alice.nostr.labels
        .edit()
        .namespace('com.example.ontology')
        .label('VI-hum', 'com.example.ontology')
        .targetAuthor(bob.publicKey)
        .reason('Violence toward humans')
        .publish();
      
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      await env.waitForPropagation(2000);
      
      // Query the label
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      expect(label.kind).toBe(1985);
      expect(label.content).toBe('Violence toward humans');
      
      // Check L-tag (namespace)
      const LTags = label.tags.filter((t: string[]) => t[0] === 'L');
      expect(LTags.length).toBe(1);
      expect(LTags[0][1]).toBe('com.example.ontology');
      
      // Check l-tag (label with namespace mark)
      const lTags = label.tags.filter((t: string[]) => t[0] === 'l');
      expect(lTags.length).toBe(1);
      expect(lTags[0][1]).toBe('VI-hum');
      expect(lTags[0][2]).toBe('com.example.ontology');
      
      // Check p-tag (target)
      const pTags = label.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBe(1);
      expect(pTags[0][1]).toBe(bob.publicKey);
    });

    it('should support label without namespace (implicit ugc)', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F2', 'Bob-NIP32-F2']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Label without explicit namespace (ugc implied)
      const result = await alice.nostr.labels
        .edit()
        .label('cool')
        .targetAuthor(bob.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      // Should have l-tag without L-tag (ugc implied)
      const lTags = label.tags.filter((t: string[]) => t[0] === 'l');
      expect(lTags.length).toBe(1);
      expect(lTags[0][1]).toBe('cool');
    });
  });

  describe('Label Namespaces', () => {
    it('should support ISO standard namespaces', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP32-F3']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // ISO-3166-2 (country codes)
      const result = await alice.nostr.labels
        .edit()
        .namespace('ISO-3166-2')
        .label('IT-MI', 'ISO-3166-2')
        .targetAuthor(alice.publicKey)
        .reason('Located in Milan, Italy')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const LTags = label.tags.filter((t: string[]) => t[0] === 'L');
      expect(LTags[0][1]).toBe('ISO-3166-2');
    });

    it('should support reverse domain notation', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F4', 'Bob-NIP32-F4']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.labels
        .edit()
        .namespace('com.myapp.categories')
        .label('developer', 'com.myapp.categories')
        .targetAuthor(bob.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const LTags = label.tags.filter((t: string[]) => t[0] === 'L');
      expect(LTags[0][1]).toBe('com.myapp.categories');
    });

    it('should support # prefix for tag associations', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F5', 'Bob-NIP32-F5']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // #t indicates association with topic tags
      const result = await alice.nostr.labels
        .edit()
        .namespace('#t')
        .label('permies', '#t')
        .targetAuthor(bob.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const LTags = label.tags.filter((t: string[]) => t[0] === 'L');
      expect(LTags[0][1]).toBe('#t');
    });
  });

  describe('Label Targets', () => {
    it('should label event with e-tag', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F6', 'Bob-NIP32-F6']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Bob creates a note
      const note = await bob.nostr.social.content.publishNote('Test note');
      await env.waitForPropagation(2000);
      
      // Alice labels it
      const result = await alice.nostr.labels
        .edit()
        .namespace('license')
        .label('MIT', 'license')
        .targetEvent(note.eventId!)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const eTags = label.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBe(1);
      expect(eTags[0][1]).toBe(note.eventId);
    });

    it('should label pubkey with p-tag', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F7', 'Bob-NIP32-F7']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.labels
        .edit()
        .label('verified')
        .targetAuthor(bob.publicKey, 'wss://relay.example.com')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const pTags = label.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags[0][1]).toBe(bob.publicKey);
      expect(pTags[0][2]).toBe('wss://relay.example.com');
    });

    it('should label relay with r-tag', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP32-F8']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.labels
        .edit()
        .namespace('relay.quality')
        .label('fast', 'relay.quality')
        .targetRelay('wss://relay.damus.io')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const rTags = label.tags.filter((t: string[]) => t[0] === 'r');
      expect(rTags.length).toBe(1);
      expect(rTags[0][1]).toBe('wss://relay.damus.io');
    });

    it('should label topic with t-tag', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP32-F9']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.labels
        .edit()
        .namespace('topic.category')
        .label('technology', 'topic.category')
        .targetTopic('bitcoin')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const tTags = label.tags.filter((t: string[]) => t[0] === 't');
      expect(tTags.length).toBe(1);
      expect(tTags[0][1]).toBe('bitcoin');
    });

    it('should label addressable event with a-tag', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP32-F10']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const address = `30023:${alice.publicKey}:article-id`;
      
      const result = await alice.nostr.labels
        .edit()
        .namespace('content.rating')
        .label('5-stars', 'content.rating')
        .targetAddress(address)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const aTags = label.tags.filter((t: string[]) => t[0] === 'a');
      expect(aTags.length).toBe(1);
      expect(aTags[0][1]).toBe(address);
    });
  });

  describe('Multiple Targets', () => {
    it('should label multiple pubkeys at once', async () => {
      const [alice, bob, charlie] = await env.createTestUsers(['Alice-NIP32-F11', 'Bob-NIP32-F11', 'Charlie-NIP32-F11']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.labels
        .edit()
        .namespace('#t')
        .label('permies', '#t')
        .targetAuthor(bob.publicKey)
        .targetAuthor(charlie.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      
      const pTags = label.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBe(2);
      expect(pTags.some((t: string[]) => t[1] === bob.publicKey)).toBe(true);
      expect(pTags.some((t: string[]) => t[1] === charlie.publicKey)).toBe(true);
    });
  });

  describe('Reactive Queries', () => {
    it('should query labels for an event', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F12', 'Bob-NIP32-F12']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create and label note
      const note = await bob.nostr.social.content.publishNote('Content');
      await env.waitForPropagation(2000);
      
      await alice.nostr.labels
        .edit()
        .label('interesting')
        .targetEvent(note.eventId!)
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Query labels for event
      const labelsStore = alice.nostr.labels.forEvent(note.eventId!);
      await env.waitForSubscription(1000);
      
      expect(labelsStore.current.length).toBeGreaterThanOrEqual(1);
      
      const label = labelsStore.current[0];
      const eTags = label.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.some((t: string[]) => t[1] === note.eventId)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle label without content/reason', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F13', 'Bob-NIP32-F13']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.labels
        .edit()
        .label('verified')
        .targetAuthor(bob.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1985])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const label = events.current.find((e: any) => e.id === result.eventId);
      expect(label).toBeDefined();
      expect(label.content).toBe('');
    });
  });

  describe('Performance', () => {
    it('should create label within 2000ms', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP32-F14', 'Bob-NIP32-F14']);
      
      // Global subscription
      alice.nostr.sub().kinds([1985]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.labels
        .edit()
        .label('test')
        .targetAuthor(bob.publicKey)
        .publish();
      
      const duration = env.endPerformanceMeasurement('NIP-32 label');
      env.assertPerformance(duration, 2000, 'NIP-32 label');
    });
  });
});

