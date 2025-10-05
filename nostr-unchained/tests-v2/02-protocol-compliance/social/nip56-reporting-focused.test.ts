/**
 * NIP-56: Reporting - Focused Tests
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/56.md
 *
 * Covers:
 * - kind 1984 Report events
 * - Event structure validation (p-tag, e-tag, report types)
 * - Standard report types (nudity, malware, profanity, illegal, spam, impersonation, other)
 * - Content/reason field
 * - NIP-32 label integration (L/l tags)
 * - Reactive queries (forUser, forEvent, byReporter)
 *
 * Architecture: Layer 2 (Social Module - Reports)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

// Multi-Relay Environment
const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-56: Reporting (Focused)', () => {
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

  describe('Kind 1984 Report Event Structure', () => {
    it('should create kind 1984 report with correct structure', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F1', 'Bob-NIP56-F1']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Report Bob for spam
      const result = await alice.nostr.social.reports
        .create()
        .user(bob.publicKey)
        .type('spam')
        .reason('Spamming my feed')
        .publish();
      
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      await env.waitForPropagation(2000);
      
      // Query the report
      const events = alice.nostr.query()
        .kinds([1984])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const report = events.current.find((e: any) => e.id === result.eventId);
      expect(report).toBeDefined();
      expect(report.kind).toBe(1984);
      expect(report.content).toBe('Spamming my feed');
      
      // Must have p-tag with report type
      const pTags = report.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBeGreaterThan(0);
      expect(pTags[0][1]).toBe(bob.publicKey);
      expect(pTags[0][2]).toBe('spam');
    });

    it('should report event with e-tag', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F2', 'Bob-NIP56-F2']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Bob creates a note
      const note = await bob.nostr.social.content.publishNote('Bad content');
      await env.waitForPropagation(2000);
      
      // Alice reports it
      const result = await alice.nostr.social.reports
        .create()
        .user(bob.publicKey)
        .event(note.eventId!)
        .type('illegal')
        .reason('Illegal content')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1984])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const report = events.current.find((e: any) => e.id === result.eventId);
      expect(report).toBeDefined();
      
      // Check e-tag with report type
      const eTags = report.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBeGreaterThan(0);
      expect(eTags[0][1]).toBe(note.eventId);
      expect(eTags[0][2]).toBe('illegal');
    });
  });

  describe('Standard Report Types', () => {
    const reportTypes: Array<'nudity' | 'malware' | 'profanity' | 'illegal' | 'spam' | 'impersonation' | 'other'> = [
      'nudity',
      'malware',
      'profanity',
      'illegal',
      'spam',
      'impersonation',
      'other'
    ];

    reportTypes.forEach(type => {
      it(`should handle "${type}" report type`, async () => {
        const [alice, bob] = await env.createTestUsers([`Alice-NIP56-${type}`, `Bob-NIP56-${type}`]);
        
        // Global subscription
        alice.nostr.sub().kinds([1984]).execute().catch(() => {});
        await env.waitForSubscription(1000);
        
        const result = await alice.nostr.social.reports
          .reportUser(bob.publicKey, type, `Report for ${type}`);
        
        expect(result.success).toBe(true);
        await env.waitForPropagation(2000);
        
        const events = alice.nostr.query()
          .kinds([1984])
          .authors([alice.publicKey])
          .execute();
        
        await env.waitForSubscription(1000);
        
        const report = events.current.find((e: any) => e.id === result.eventId);
        expect(report).toBeDefined();
        
        const pTags = report.tags.filter((t: string[]) => t[0] === 'p');
        expect(pTags[0][2]).toBe(type);
      });
    });
  });

  describe('NIP-32 Label Integration', () => {
    it('should include NIP-32 labels in reports', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F3', 'Bob-NIP56-F3']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.social.reports
        .create()
        .user(bob.publicKey)
        .type('nudity')
        .label('social.nos.ontology', 'NS-nud')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1984])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const report = events.current.find((e: any) => e.id === result.eventId);
      expect(report).toBeDefined();
      
      // Check L and l tags
      const LTags = report.tags.filter((t: string[]) => t[0] === 'L');
      const lTags = report.tags.filter((t: string[]) => t[0] === 'l');
      
      expect(LTags.length).toBe(1);
      expect(LTags[0][1]).toBe('social.nos.ontology');
      expect(lTags.length).toBe(1);
      expect(lTags[0][1]).toBe('NS-nud');
      expect(lTags[0][2]).toBe('social.nos.ontology');
    });
  });

  describe('Simplified APIs', () => {
    it('should report user with simplified API', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F4', 'Bob-NIP56-F4']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.social.reports.reportUser(
        bob.publicKey,
        'spam',
        'Annoying spam'
      );
      
      expect(result.success).toBe(true);
    });

    it('should report event with simplified API', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F5', 'Bob-NIP56-F5']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const note = await bob.nostr.social.content.publishNote('Inappropriate');
      await env.waitForPropagation(2000);
      
      const result = await alice.nostr.social.reports.reportEvent(
        note.eventId!,
        bob.publicKey,
        'profanity',
        'Bad language'
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('Reactive Queries', () => {
    it('should query reports for a user', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F6', 'Bob-NIP56-F6']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create report
      await alice.nostr.social.reports.reportUser(bob.publicKey, 'spam');
      await env.waitForPropagation(2000);
      
      // Query reports for Bob
      const reportsStore = alice.nostr.social.reports.forUser(bob.publicKey);
      await env.waitForSubscription(1000);
      
      expect(reportsStore.current.length).toBeGreaterThanOrEqual(1);
      
      const report = reportsStore.current[0];
      const pTags = report.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.some((t: string[]) => t[1] === bob.publicKey)).toBe(true);
    });

    it('should query reports for an event', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F7', 'Bob-NIP56-F7']);
      
      // Global subscription
      alice.nostr.sub().kinds([1, 1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create and report note
      const note = await bob.nostr.social.content.publishNote('Content');
      await env.waitForPropagation(2000);
      
      await alice.nostr.social.reports.reportEvent(note.eventId!, bob.publicKey, 'spam');
      await env.waitForPropagation(2000);
      
      // Query reports for event
      const reportsStore = alice.nostr.social.reports.forEvent(note.eventId!);
      await env.waitForSubscription(1000);
      
      expect(reportsStore.current.length).toBeGreaterThanOrEqual(1);
      
      const report = reportsStore.current[0];
      const eTags = report.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.some((t: string[]) => t[1] === note.eventId)).toBe(true);
    });

    it('should query reports by reporter', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F8', 'Bob-NIP56-F8']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Alice makes multiple reports
      await alice.nostr.social.reports.reportUser(bob.publicKey, 'spam');
      await env.waitForPropagation(1000);
      await alice.nostr.social.reports.reportUser(bob.publicKey, 'profanity');
      await env.waitForPropagation(2000);
      
      // Query Alice's reports
      const reportsStore = alice.nostr.social.reports.byReporter(alice.publicKey);
      await env.waitForSubscription(1000);
      
      expect(reportsStore.current.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty reason', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F9', 'Bob-NIP56-F9']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await alice.nostr.social.reports
        .create()
        .user(bob.publicKey)
        .type('spam')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(2000);
      
      const events = alice.nostr.query()
        .kinds([1984])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const report = events.current.find((e: any) => e.id === result.eventId);
      expect(report).toBeDefined();
      expect(report.content).toBe('');
    });

    it('should handle report without user', async () => {
      const [alice] = await env.createTestUsers(['Alice-NIP56-F10']);
      
      const result = await alice.nostr.social.reports
        .create()
        .type('spam')
        .publish();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Pubkey is required');
    });

    it('should handle report without type', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F11', 'Bob-NIP56-F11']);
      
      const result = await alice.nostr.social.reports
        .create()
        .user(bob.publicKey)
        .publish();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Report type is required');
    });
  });

  describe('Performance', () => {
    it('should create report within 2000ms', async () => {
      const [alice, bob] = await env.createTestUsers(['Alice-NIP56-F12', 'Bob-NIP56-F12']);
      
      // Global subscription
      alice.nostr.sub().kinds([1984]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      env.startPerformanceMeasurement();
      
      await alice.nostr.social.reports.reportUser(bob.publicKey, 'spam');
      
      const duration = env.endPerformanceMeasurement('NIP-56 report');
      env.assertPerformance(duration, 2000, 'NIP-56 report');
    });
  });
});

