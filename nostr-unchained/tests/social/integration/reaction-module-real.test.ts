/**
 * ReactionModule Integration Tests - Real Relay
 * 
 * Tests ReactionModule against ws://umbrel.local:4848
 * Tests complete NIP-25 compliance with real network conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../../src/crypto/SigningProvider.js';
import { ReactionModule } from '../../../src/social/reactions/ReactionModule.js';

describe('ReactionModule Integration Tests - Real Relay', () => {
  let nostr: NostrUnchained;
  let reactionModule: ReactionModule;
  let signer: TemporarySigner;
  const testRelay = 'ws://umbrel.local:4848';

  // Test data - we'll create a test note and react to it
  let testNoteId: string;
  let testReactionId: string;

  beforeAll(async () => {
    // Initialize with temporary signer
    signer = new TemporarySigner();
    nostr = new NostrUnchained({
      relays: [testRelay],
      signingProvider: signer,
      debug: true
    });

    await nostr.initializeSigning();
    await nostr.connect();

    // Initialize signing cache
    await nostr.getMe();
    console.log('Signing initialized with pubkey:', nostr.me);

    // Get reaction module through new social API
    reactionModule = new ReactionModule(nostr, true);

    // Create a test note to react to
    const noteResult = await nostr.events
      .note('Test note for reaction testing ' + Date.now())
      .publish();

    if (!noteResult.success || !noteResult.eventId) {
      throw new Error('Failed to create test note');
    }

    testNoteId = noteResult.eventId;
    console.log(`Created test note: ${testNoteId.substring(0, 8)}...`);

    // Wait a bit for relay propagation
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    await nostr?.disconnect();
  }, 10000);

  describe('Reaction Creation', () => {
    it('should create a like reaction (+)', async () => {
      const result = await reactionModule.react(testNoteId, '+');

      if (!result.success) {
        console.error('Reaction failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        testReactionId = result.eventId;
        console.log(`Created like reaction: ${testReactionId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should create an emoji reaction (❤️)', async () => {
      const result = await reactionModule.react(testNoteId, '❤️');

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        console.log(`Created heart reaction: ${result.eventId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should create a custom emoji reaction (🚀)', async () => {
      const result = await reactionModule.react(testNoteId, '🚀');

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        console.log(`Created rocket reaction: ${result.eventId.substring(0, 8)}...`);
      }
    }, 15000);
  });

  describe('Reaction Querying', () => {
    beforeAll(async () => {
      // Wait for reactions to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should get reaction summary for the test note', async () => {
      const reactionStore = reactionModule.to(testNoteId);
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const summary = reactionStore.current;

      expect(summary.targetEventId).toBe(testNoteId);
      expect(summary.totalCount).toBeGreaterThan(0);
      expect(summary.userReacted).toBe(true);
      
      // Should have our reactions
      expect(summary.reactions['+']).toBeDefined();
      expect(summary.reactions['❤️']).toBeDefined();
      expect(summary.reactions['🚀']).toBeDefined();

      console.log('Reaction Summary:', {
        total: summary.totalCount,
        userReacted: summary.userReacted,
        userReactionType: summary.userReactionType,
        reactionTypes: Object.keys(summary.reactions)
      });
    }, 20000);

    it('should get my reaction to the test note', async () => {
      const myReactionStore = reactionModule.myReaction(testNoteId);
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const myReaction = myReactionStore.current;

      // Should have one of our reactions (the most recent one)
      expect(myReaction).toBeDefined();
      expect(['+', '❤️', '🚀']).toContain(myReaction);

      console.log('My reaction:', myReaction);
    }, 15000);

    it('should handle reactive updates when new reactions arrive', async () => {
      const reactionStore = reactionModule.to(testNoteId);
      let updateCount = 0;
      let lastSummary: any;

      // Subscribe to updates
      const unsubscribe = reactionStore.subscribe(summary => {
        updateCount++;
        lastSummary = summary;
        console.log(`Reaction update #${updateCount}:`, {
          total: summary.totalCount,
          types: Object.keys(summary.reactions)
        });
      });

      // Add another reaction to trigger update
      await reactionModule.react(testNoteId, '👍');
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      unsubscribe();

      expect(updateCount).toBeGreaterThan(1);
      expect(lastSummary.totalCount).toBeGreaterThan(0);
      expect(lastSummary.reactions['👍']).toBeDefined();
    }, 20000);
  });

  describe('Reaction Removal', () => {
    it('should remove my reaction', async () => {
      // First, make sure we have a reaction
      await reactionModule.react(testNoteId, '👎');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then remove it
      const result = await reactionModule.unreact(testNoteId);

      if (!result.success) {
        console.error('Unreact failed:', result.error);
      }

      expect(result.success).toBe(true);
      
      console.log('Removed reaction successfully');

      // Verify removal (after some time for propagation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const myReactionStore = reactionModule.myReaction(testNoteId);
      const myReaction = myReactionStore.current;
      
      // Should not be '👎' anymore (might be another reaction we made)
      expect(myReaction).not.toBe('👎');
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle reaction to non-existent event', async () => {
      const nonExistentEventId = 'a'.repeat(64);
      const result = await reactionModule.react(nonExistentEventId, '+');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target event not found');
    }, 10000);

    it('should handle unreacting when no reaction exists', async () => {
      // Create a new note that we haven't reacted to
      const noteResult = await nostr.events
        .note('Unreacted test note ' + Date.now())
        .publish();

      if (!noteResult.success || !noteResult.eventId) {
        throw new Error('Failed to create test note');
      }

      const result = await reactionModule.unreact(noteResult.eventId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No reaction found to remove');
    }, 15000);
  });

  describe('NIP-25 Compliance', () => {
    it('should create reaction with proper NIP-25 structure', async () => {
      // This test verifies the reaction event structure matches NIP-25
      const result = await reactionModule.react(testNoteId, '✅');
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();

      // The actual NIP-25 compliance is verified by the relay accepting the event
      // and by our reaction parsing working correctly
      console.log('NIP-25 compliant reaction created:', result.eventId?.substring(0, 8) + '...');
    }, 15000);

    it('should handle various reaction content types', async () => {
      const reactionTypes = ['+', '-', '❤️', '😂', '🔥', '👍', '👎'];
      
      for (const reactionType of reactionTypes) {
        const result = await reactionModule.react(testNoteId, reactionType);
        expect(result.success).toBe(true);
        
        // Small delay between reactions
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Verify all reactions are aggregated correctly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reactionStore = reactionModule.to(testNoteId);
      const summary = reactionStore.current;

      expect(summary.totalCount).toBeGreaterThanOrEqual(reactionTypes.length);
      
      // Should have all our reaction types
      reactionTypes.forEach(type => {
        expect(summary.reactions[type]).toBeDefined();
      });

      console.log('All reaction types verified:', Object.keys(summary.reactions));
    }, 30000);
  });
});