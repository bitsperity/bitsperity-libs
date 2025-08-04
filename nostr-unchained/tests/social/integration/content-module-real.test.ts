/**
 * ContentModule Integration Tests - Real Relay
 * 
 * Tests ContentModule against ws://umbrel.local:4848
 * Tests complete NIP-01 and NIP-18 compliance with real network conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../../src/crypto/SigningProvider.js';
import { ContentModule } from '../../../src/social/content/ContentModule.js';

describe('ContentModule Integration Tests - Real Relay', () => {
  let nostr: NostrUnchained;
  let contentModule: ContentModule;
  let signer: TemporarySigner;
  const testRelay = 'ws://umbrel.local:4848';

  // Test data - we'll create test notes and reposts
  let testNoteId: string;
  let testRepostId: string;
  let myPubkey: string;

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
    myPubkey = nostr.me!;
    console.log('Signing initialized with pubkey:', myPubkey);

    // Get content module
    contentModule = new ContentModule(nostr, true);

    // Wait a bit for relay connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    await nostr?.disconnect();
  }, 10000);

  describe('Note Publishing (NIP-01)', () => {
    it('should publish a text note', async () => {
      const noteContent = 'Test note for ContentModule testing ' + Date.now();
      const result = await contentModule.publishNote(noteContent);

      if (!result.success) {
        console.error('Note publish failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        testNoteId = result.eventId;
        console.log(`Published test note: ${testNoteId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should publish multiple notes', async () => {
      const notes = [
        'First test note ' + Date.now(),
        'Second test note ' + Date.now(),
        'Third test note ' + Date.now()
      ];

      const results = [];
      for (const note of notes) {
        const result = await contentModule.publishNote(note);
        results.push(result);
        
        // Small delay between notes
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.eventId).toBeDefined();
      });

      console.log(`Published ${results.length} test notes successfully`);
    }, 20000);
  });

  describe('Note Querying (NIP-01)', () => {
    beforeAll(async () => {
      // Wait for notes to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should get notes from specific author', async () => {
      const notesStore = contentModule.notes({
        authors: [myPubkey],
        limit: 10
      });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const notes = notesStore.current;

      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBeGreaterThan(0);
      
      // All notes should be from our author
      notes.forEach(note => {
        expect(note.pubkey).toBe(myPubkey);
        expect(note.kind).toBe(1);
      });

      console.log(`Retrieved ${notes.length} notes from author`);
    }, 20000);

    it('should get notes with time filters', async () => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 3600;
      
      const notesStore = contentModule.notes({
        authors: [myPubkey],
        since: oneHourAgo,
        until: now,
        limit: 20
      });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const notes = notesStore.current;

      expect(Array.isArray(notes)).toBe(true);
      
      // All notes should be within time range
      notes.forEach(note => {
        expect(note.created_at).toBeGreaterThanOrEqual(oneHourAgo);
        expect(note.created_at).toBeLessThanOrEqual(now);
      });

      console.log(`Retrieved ${notes.length} notes within time range`);
    }, 15000);

    it('should handle reactive updates for notes', async () => {
      const notesStore = contentModule.notes({
        authors: [myPubkey],
        limit: 5
      });
      
      let updateCount = 0;
      let lastNotes: any;

      // Subscribe to updates
      const unsubscribe = notesStore.subscribe(notes => {
        updateCount++;
        lastNotes = notes;
        console.log(`Notes update #${updateCount}: ${notes.length} notes`);
      });

      // Publish a new note to trigger update
      await contentModule.publishNote('Reactive update test note ' + Date.now());
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      unsubscribe();

      expect(updateCount).toBeGreaterThan(1);
      expect(lastNotes.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Repost Publishing (NIP-18)', () => {
    beforeAll(async () => {
      // Make sure we have a note to repost
      if (!testNoteId) {
        const result = await contentModule.publishNote('Note to repost ' + Date.now());
        testNoteId = result.eventId!;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    });

    it('should publish a repost', async () => {
      const result = await contentModule.repost(testNoteId);

      if (!result.success) {
        console.error('Repost failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        testRepostId = result.eventId;
        console.log(`Published repost: ${testRepostId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should publish repost with relay hint', async () => {
      const result = await contentModule.repost(testNoteId, testRelay);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log('Published repost with relay hint successfully');
    }, 15000);
  });

  describe('Repost Querying (NIP-18)', () => {
    beforeAll(async () => {
      // Wait for reposts to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should get reposts from specific author', async () => {
      const repostsStore = contentModule.reposts({
        authors: [myPubkey],
        limit: 10
      });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const reposts = repostsStore.current;

      expect(Array.isArray(reposts)).toBe(true);
      expect(reposts.length).toBeGreaterThan(0);
      
      // All reposts should be from our author and kind 6
      reposts.forEach(repost => {
        expect(repost.pubkey).toBe(myPubkey);
        expect(repost.kind).toBe(6);
        
        // Should have e-tag referencing original event
        const eTags = repost.tags.filter(tag => tag[0] === 'e');
        expect(eTags.length).toBeGreaterThan(0);
      });

      console.log(`Retrieved ${reposts.length} reposts from author`);
    }, 20000);
  });

  describe('Combined Feed', () => {
    it('should get combined notes and reposts feed', async () => {
      const feedStore = contentModule.feed({
        authors: [myPubkey],
        limit: 20
      });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const feed = feedStore.current;

      expect(Array.isArray(feed)).toBe(true);
      expect(feed.length).toBeGreaterThan(0);
      
      // Should contain both notes (kind 1) and reposts (kind 6)
      const noteCount = feed.filter(event => event.kind === 1).length;
      const repostCount = feed.filter(event => event.kind === 6).length;
      
      expect(noteCount).toBeGreaterThan(0);
      expect(repostCount).toBeGreaterThan(0);
      
      // Should be sorted by created_at descending
      for (let i = 1; i < feed.length; i++) {
        expect(feed[i-1].created_at).toBeGreaterThanOrEqual(feed[i].created_at);
      }

      console.log(`Retrieved feed: ${noteCount} notes, ${repostCount} reposts`);
    }, 20000);
  });

  describe('Content Summary', () => {
    it('should get content summary for author', async () => {
      const summaryStore = contentModule.summary([myPubkey]);
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const summary = summaryStore.current;

      expect(summary.totalNotes).toBeGreaterThan(0);
      expect(summary.totalReposts).toBeGreaterThan(0);
      expect(summary.latestNote).toBeDefined();
      expect(summary.latestRepost).toBeDefined();
      
      // Latest events should be from our author
      expect(summary.latestNote?.pubkey).toBe(myPubkey);
      expect(summary.latestNote?.kind).toBe(1);
      expect(summary.latestRepost?.pubkey).toBe(myPubkey);
      expect(summary.latestRepost?.kind).toBe(6);

      console.log('Content Summary:', {
        totalNotes: summary.totalNotes,
        totalReposts: summary.totalReposts,
        hasLatestNote: !!summary.latestNote,
        hasLatestRepost: !!summary.latestRepost
      });
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle repost of non-existent event', async () => {
      const fakeEventId = '0'.repeat(64);
      const result = await contentModule.repost(fakeEventId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Original event not found');
    }, 10000);

    it('should handle empty content gracefully', async () => {
      const notesStore = contentModule.notes({
        authors: ['nonexistent-pubkey'],
        limit: 10
      });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const notes = notesStore.current;

      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBe(0);
    }, 10000);
  });

  describe('NIP-01 and NIP-18 Compliance', () => {
    it('should create NIP-01 compliant text notes', async () => {
      const noteContent = 'NIP-01 compliance test ' + Date.now();
      const result = await contentModule.publishNote(noteContent);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();

      // The NIP-01 compliance is verified by the relay accepting the event
      console.log('NIP-01 compliant note created:', result.eventId?.substring(0, 8) + '...');
    }, 15000);

    it('should create NIP-18 compliant reposts', async () => {
      // Create a note to repost
      const noteResult = await contentModule.publishNote('Note for NIP-18 test ' + Date.now());
      expect(noteResult.success).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Repost it
      const repostResult = await contentModule.repost(noteResult.eventId!);
      
      expect(repostResult.success).toBe(true);
      expect(repostResult.eventId).toBeDefined();

      // The NIP-18 compliance is verified by the relay accepting the event
      // and by our repost parsing working correctly
      console.log('NIP-18 compliant repost created:', repostResult.eventId?.substring(0, 8) + '...');
    }, 20000);
  });
});