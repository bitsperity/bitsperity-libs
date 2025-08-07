/**
 * Fluent Event Builder API Integration Tests
 * 
 * Tests the new event builder API against real relays to ensure
 * the fluent API works correctly for complex event creation and publishing.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/index.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';

describe('Fluent Event Builder API - Real Integration Tests', () => {
  let nostr: NostrUnchained;

  beforeAll(async () => {
    // Use umbrel.local:4848 for testing
    nostr = new NostrUnchained({
      relays: ['ws://umbrel.local:4848'],
      debug: true
    });

    // Initialize signing provider
    await nostr.initializeSigning();
    
    // Connect to relay
    await nostr.connect();
  });

  afterAll(async () => {
    await nostr.disconnect();
  });

  beforeEach(() => {
    // Clean state for each test
  });

  describe('Basic Fluent API', () => {
    it('should create a simple text note using fluent API', async () => {
      const result = await nostr.events.create()
        .kind(1)
        .content("Hello from Fluent Event Builder API!")
        .publish();

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.event?.kind).toBe(1);
      expect(result.event?.content).toBe("Hello from Fluent Event Builder API!");
    }, 15000);

    it('should create a text note with tags', async () => {
      const result = await nostr.events.create()
        .kind(1)
        .content("Testing tags in fluent API")
        .tag('t', 'testing')
        .tag('t', 'fluent-api')
        .tag('client', 'nostr-unchained')
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.tags).toContainEqual(['t', 'testing']);
      expect(result.event?.tags).toContainEqual(['t', 'fluent-api']);
      expect(result.event?.tags).toContainEqual(['client', 'nostr-unchained']);
    }, 15000);

    it('should create a reply using replyTo', async () => {
      // First create an original event to reply to
      const originalResult = await nostr.events.create()
        .kind(1)
        .content("Original post for reply test")
        .publish();

      expect(originalResult.success).toBe(true);
      const originalEventId = originalResult.eventId!;

      // Now create a reply
      const replyResult = await nostr.events.create()
        .kind(1)
        .content("This is a reply using fluent API")
        .replyTo(originalEventId)
        .tag('t', 'reply-test')
        .publish();

      expect(replyResult.success).toBe(true);
      expect(replyResult.event?.tags).toContainEqual(['e', originalEventId, '', 'reply']);
      expect(replyResult.event?.tags).toContainEqual(['t', 'reply-test']);
    }, 20000);
  });

  describe('Job Posting Example', () => {
    it('should create a complex job posting event', async () => {
      const result = await nostr.events.create()
        .kind(30023)
        .content("Looking for TypeScript developer with Nostr experience")
        .tag('t', 'jobs')
        .tag('location', 'remote')
        .tag('salary', '100k-150k')
        .tag('d', `job-${Date.now()}`) // Unique identifier
        .tag('company', 'Nostr Unchained Inc')
        .tag('experience', 'senior')
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.kind).toBe(30023);
      expect(result.event?.content).toBe("Looking for TypeScript developer with Nostr experience");
      expect(result.event?.tags).toContainEqual(['t', 'jobs']);
      expect(result.event?.tags).toContainEqual(['location', 'remote']);
      expect(result.event?.tags).toContainEqual(['salary', '100k-150k']);
      expect(result.event?.tags).toContainEqual(['company', 'Nostr Unchained Inc']);
      expect(result.event?.tags).toContainEqual(['experience', 'senior']);
      
      // Check that 'd' tag exists and starts with 'job-'
      const dTag = result.event?.tags.find(tag => tag[0] === 'd');
      expect(dTag).toBeDefined();
      expect(dTag![1]).toMatch(/^job-\d+$/);
    }, 15000);
  });

  describe('Advanced Features', () => {
    it('should support explicit signing before publish', async () => {
      const builder = nostr.events.create()
        .kind(1)
        .content("Testing explicit signing")
        .tag('t', 'signing-test');

      // Explicitly sign
      await builder.sign();

      // Get the built event for inspection
      const event = await builder.build();
      expect(event.id).toBeDefined();
      expect(event.sig).toBeDefined();

      // Publish the pre-signed event
      const result = await builder.publish();
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(event.id);
    }, 15000);

    it('should support custom timestamps', async () => {
      const customTimestamp = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
      
      const result = await nostr.events.create()
        .kind(1)
        .content("Testing custom timestamp")
        .timestamp(customTimestamp)
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.created_at).toBe(customTimestamp);
    }, 15000);

    it('should support mentions', async () => {
      const testPubkey = '0'.repeat(64); // Dummy pubkey for testing
      
      const result = await nostr.events.create()
        .kind(1)
        .content("Testing mentions in fluent API")
        .mention(testPubkey)
        .tag('t', 'mention-test')
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.tags).toContainEqual(['p', testPubkey]);
      expect(result.event?.tags).toContainEqual(['t', 'mention-test']);
    }, 15000);

    it('should support subject tags', async () => {
      const result = await nostr.events.create()
        .kind(1)
        .content("Testing subject functionality")
        .subject("Important announcement")
        .tag('t', 'subject-test')
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.tags).toContainEqual(['subject', 'Important announcement']);
      expect(result.event?.tags).toContainEqual(['t', 'subject-test']);
    }, 15000);
  });

  describe('Helper Methods', () => {
    it('should create quick text note using note() helper', async () => {
      const result = await nostr.events.note("Quick note using helper method")
        .tag('t', 'helper-test')
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.kind).toBe(1);
      expect(result.event?.content).toBe("Quick note using helper method");
      expect(result.event?.tags).toContainEqual(['t', 'helper-test']);
    }, 15000);

    it('should create quick job posting using job() helper', async () => {
      const result = await nostr.events.job("Quick job posting using helper")
        .tag('location', 'San Francisco')
        .tag('d', `quick-job-${Date.now()}`)
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.kind).toBe(30023);
      expect(result.event?.content).toBe("Quick job posting using helper");
      expect(result.event?.tags).toContainEqual(['t', 'jobs']); // Auto-added by helper
      expect(result.event?.tags).toContainEqual(['location', 'San Francisco']);
    }, 15000);

    it('should create reaction using reaction() helper', async () => {
      // First create an event to react to
      const originalResult = await nostr.events.create()
        .kind(1)
        .content("Original post for reaction test")
        .publish();

      expect(originalResult.success).toBe(true);
      const originalEventId = originalResult.eventId!;

      // Now create a reaction
      const reactionResult = await nostr.events.reaction(originalEventId, '🔥')
        .publish();

      expect(reactionResult.success).toBe(true);
      expect(reactionResult.event?.kind).toBe(7);
      expect(reactionResult.event?.content).toBe('🔥');
      expect(reactionResult.event?.tags).toContainEqual(['e', originalEventId]);
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should fail when publishing without content', async () => {
      await expect(async () => {
        await nostr.events.create()
          .kind(1)
          .publish();
      }).rejects.toThrow('Content is required before publishing');
    });

    it('should fail when signing without content', async () => {
      await expect(async () => {
        await nostr.events.create()
          .kind(1)
          .sign();
      }).rejects.toThrow('Content is required before signing');
    });
  });

  describe('Method Chaining', () => {
    it('should support complex method chaining', async () => {
      const result = await nostr.events.create()
        .kind(1)
        .content("Complex method chaining test")
        .tag('t', 'chaining')
        .tag('t', 'testing')
        .tag('client', 'nostr-unchained')
        .subject("Method Chaining Test")
        .mention('0'.repeat(64))
        .publish();

      expect(result.success).toBe(true);
      expect(result.event?.content).toBe("Complex method chaining test");
      expect(result.event?.tags).toHaveLength(5); // t, t, client, subject, p
      expect(result.event?.tags).toContainEqual(['t', 'chaining']);
      expect(result.event?.tags).toContainEqual(['t', 'testing']);
      expect(result.event?.tags).toContainEqual(['client', 'nostr-unchained']);
      expect(result.event?.tags).toContainEqual(['subject', 'Method Chaining Test']);
      expect(result.event?.tags).toContainEqual(['p', '0'.repeat(64)]);
    }, 15000);
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with simple publish API', async () => {
      const pubkey = await nostr.getPublicKey();
      const event = EventBuilder.createTextNote("Simple publish still works!", pubkey);
      const result = await nostr.publish(event);

      expect(result.success).toBe(true);
      expect(result.event?.kind).toBe(1);
      expect(result.event?.content).toBe("Simple publish still works!");
      expect(result.event?.tags).toEqual([]);
    }, 15000);
  });
});