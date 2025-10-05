/**
 * NIP-51: Lists - Focused Tests
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/51.md
 *
 * Covers:
 * - Kind 30000: Follow sets (categorized users)
 * - Kind 30001: Generic lists  
 * - Kind 30002: Relay sets
 * - Kind 30003: Bookmark sets
 * - Parametrized replaceable events (d-tag)
 * - List metadata (title, description, image)
 * - CRUD operations (Create, Read, Update, Delete via replacement)
 * - Multiple list types and identifiers
 *
 * Architecture: Layer 2 (Social Module - Lists)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-51: Lists (Focused)', () => {
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

  describe('Kind 30000: Follow Sets', () => {
    it('should create follow set with d-tag and metadata', async () => {
      const [alice, bob, charlie] = await env.createTestUsers(['Alice-NIP51-F1', 'Bob-NIP51-F1', 'Charlie-NIP51-F1']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create follow set
      const result = await alice.nostr.social.lists
        .edit(30000, 'developers')
        .title('Dev Friends')
        .description('My developer friends')
        .image('https://example.com/devs.jpg')
        .addPerson(bob.publicKey, 'wss://relay.example.com', 'Bob')
        .addPerson(charlie.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      // Query the list
      const store = alice.nostr.social.lists.get(alice.publicKey, 30000, 'developers');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list).toBeDefined();
      expect(list.kind).toBe(30000);
      expect(list.identifier).toBe('developers');
      expect(list.title).toBe('Dev Friends');
      expect(list.description).toBe('My developer friends');
      expect(list.image).toBe('https://example.com/devs.jpg');
      expect(list.p.length).toBe(2);
      expect(list.p.some((p: any) => p.pubkey === bob.publicKey)).toBe(true);
      expect(list.p.some((p: any) => p.pubkey === charlie.publicKey)).toBe(true);
    });

    it('should support multiple follow sets with different identifiers', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP51-F2', 'Bob-NIP51-F2']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create family set
      await alice.nostr.social.lists
        .edit(30000, 'family')
        .title('Family')
        .addPerson(bob.publicKey)
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Query family BEFORE creating work
      const familyStore = alice.nostr.social.lists.get(alice.publicKey, 30000, 'family');
      await env.waitForSubscription(1000);
      expect(familyStore.current?.identifier).toBe('family');
      
      // Now create work set
      await alice.nostr.social.lists
        .edit(30000, 'work')
        .title('Work Contacts')
        .addPerson(bob.publicKey)
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Query work separately
      const workStore = alice.nostr.social.lists.get(alice.publicKey, 30000, 'work');
      await env.waitForSubscription(1000);
      
      expect(workStore.current?.identifier).toBe('work');
    });
  });

  describe('Kind 30002: Relay Sets', () => {
    it('should create relay set', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F3']);
      
      // Global subscription
      alice.nostr.sub().kinds([30002]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.social.lists
        .edit(30002, 'favorites')
        .title('Favorite Relays')
        .addRelay('wss://relay1.example.com')
        .addRelay('wss://relay2.example.com')
        .addRelay('wss://relay3.example.com')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const store = alice.nostr.social.lists.get(alice.publicKey, 30002, 'favorites');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list).toBeDefined();
      expect(list.kind).toBe(30002);
      expect(list.relays.length).toBe(3);
      expect(list.relays).toContain('wss://relay1.example.com');
      expect(list.relays).toContain('wss://relay2.example.com');
    });
  });

  describe('Kind 30003: Bookmark Sets', () => {
    it('should create bookmark set with events, addresses, and topics', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F4']);
      
      // Global subscription
      alice.nostr.sub().kinds([30003]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const fakeEventId = 'a'.repeat(64);
      const fakeAddress = `30023:${alice.publicKey}:article1`;
      
      const result = await alice.nostr.social.lists
        .edit(30003, 'important')
        .title('Important Bookmarks')
        .description('Things I want to read later')
        .addEvent(fakeEventId, 'wss://relay.example.com')
        .addAddress(fakeAddress)
        .topic('nostr')
        .topic('bitcoin')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const store = alice.nostr.social.lists.get(alice.publicKey, 30003, 'important');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list).toBeDefined();
      expect(list.kind).toBe(30003);
      expect(list.e.length).toBe(1);
      expect(list.e[0].id).toBe(fakeEventId);
      expect(list.a.length).toBe(1);
      expect(list.a[0].address).toBe(fakeAddress);
      expect(list.topics.length).toBe(2);
      expect(list.topics).toContain('nostr');
      expect(list.topics).toContain('bitcoin');
    });

    it('should support multiple bookmark sets', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F5']);
      
      // Global subscription
      alice.nostr.sub().kinds([30003]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create tech set
      await alice.nostr.social.lists
        .edit(30003, 'tech')
        .title('Tech Articles')
        .topic('technology')
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Query tech BEFORE creating fun
      const techStore = alice.nostr.social.lists.get(alice.publicKey, 30003, 'tech');
      await env.waitForSubscription(1000);
      expect(techStore.current?.title).toBe('Tech Articles');
      
      // Now create fun set
      await alice.nostr.social.lists
        .edit(30003, 'fun')
        .title('Fun Stuff')
        .topic('memes')
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Query fun separately
      const funStore = alice.nostr.social.lists.get(alice.publicKey, 30003, 'fun');
      await env.waitForSubscription(1000);
      
      expect(funStore.current?.title).toBe('Fun Stuff');
    });
  });

  describe('Parametrized Replaceable Events', () => {
    it('should replace list when publishing with same d-tag', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP51-F6', 'Bob-NIP51-F6']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create initial list
      await alice.nostr.social.lists
        .edit(30000, 'friends')
        .title('Friends v1')
        .addPerson(bob.publicKey)
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Update list (replace)
      await alice.nostr.social.lists
        .edit(30000, 'friends')
        .title('Friends v2')
        .addPerson(bob.publicKey)
        .addPerson(alice.publicKey)
        .publish();
      
      await env.waitForPropagation(2000);
      
      const store = alice.nostr.social.lists.get(alice.publicKey, 30000, 'friends');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list?.title).toBe('Friends v2');
      expect(list?.p.length).toBe(2);
    });
  });

  describe('List Metadata', () => {
    it('should handle all metadata fields', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F7']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.social.lists
        .edit(30000, 'test')
        .title('Test List')
        .description('This is a test list with all metadata')
        .image('https://example.com/image.jpg')
        .note('Additional notes about this list')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const store = alice.nostr.social.lists.get(alice.publicKey, 30000, 'test');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list?.title).toBe('Test List');
      expect(list?.description).toBe('This is a test list with all metadata');
      expect(list?.image).toBe('https://example.com/image.jpg');
    });

    it('should work without optional metadata', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP51-F8', 'Bob-NIP51-F8']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Minimal list without title/description/image
      const result = await alice.nostr.social.lists
        .edit(30000, 'minimal')
        .addPerson(bob.publicKey)
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const store = alice.nostr.social.lists.get(alice.publicKey, 30000, 'minimal');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list).toBeDefined();
      expect(list?.identifier).toBe('minimal');
      expect(list?.p.length).toBe(1);
    });
  });

  describe('Cross-User Lists', () => {
    it('should allow querying other users lists', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP51-F9', 'Bob-NIP51-F9']);
      
      // Bob subscribes to all lists
      bob.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Alice creates a list
      await alice.nostr.social.lists
        .edit(30000, 'public')
        .title('Public List')
        .addPerson(bob.publicKey)
        .publish();
      
      await env.waitForPropagation(2000);
      
      // Bob queries Alice's list
      const store = bob.nostr.social.lists.get(alice.publicKey, 30000, 'public');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list).toBeDefined();
      expect(list?.title).toBe('Public List');
    });
  });

  describe('Edge Cases', () => {
    it('should handle list without d-tag identifier', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F10']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // List without identifier should still work (uses empty string internally)
      const result = await alice.nostr.social.lists
        .edit(30000)
        .title('Default List')
        .publish();
      
      expect(result.success).toBe(true);
    });

    it('should handle very long list with many items', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F11']);
      
      // Global subscription
      alice.nostr.sub().kinds([30002]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create list with many relays
      const builder = alice.nostr.social.lists.edit(30002, 'many').title('Many Relays');
      
      for (let i = 0; i < 50; i++) {
        builder.addRelay(`wss://relay${i}.example.com`);
      }
      
      const result = await builder.publish();
      expect(result.success).toBe(true);
      
      await env.waitForPropagation(2000);
      
      const store = alice.nostr.social.lists.get(alice.publicKey, 30002, 'many');
      await env.waitForSubscription(1000);
      
      const list = store.current;
      expect(list?.relays.length).toBe(50);
    });
  });

  describe('Performance', () => {
    it('should create list within 2000ms', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP51-F12']);
      
      // Global subscription
      alice.nostr.sub().kinds([30000]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.social.lists
        .edit(30000, 'perf')
        .title('Perf Test')
        .publish();
      
      const duration = env.endPerformanceMeasurement('NIP-51 list creation');
      env.assertPerformance(duration, 2000, 'NIP-51 list creation');
    });
  });
});

