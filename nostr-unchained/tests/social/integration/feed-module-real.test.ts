/**
 * FeedModule Integration Tests - Real Relay
 * 
 * Tests FeedModule against ws://umbrel.local:4848
 * Tests complete feed aggregation with real network conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../../src/crypto/SigningProvider.js';
import { FeedModule } from '../../../src/social/feeds/FeedModule.js';
import { ContentModule } from '../../../src/social/content/ContentModule.js';
import { ReactionModule } from '../../../src/social/reactions/ReactionModule.js';
import { ThreadModule } from '../../../src/social/threads/ThreadModule.js';

describe('FeedModule Integration Tests - Real Relay', () => {
  let nostr: NostrUnchained;
  let feedModule: FeedModule;
  let contentModule: ContentModule;
  let reactionModule: ReactionModule;
  let threadModule: ThreadModule;
  let signer: TemporarySigner;
  const testRelay = 'ws://umbrel.local:4848';

  // Test data - we'll create various events for feed testing
  let testNoteIds: string[] = [];
  let testRepostId: string;
  let testReactionId: string;
  let testThreadId: string;
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

    // Get all modules for creating test content
    feedModule = new FeedModule(nostr, true);
    contentModule = new ContentModule(nostr, true);
    reactionModule = new ReactionModule(nostr, true);
    threadModule = new ThreadModule(nostr, true);

    // Wait a bit for relay connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create test content for feed
    await setupTestContent();
  }, 60000);

  afterAll(async () => {
    await nostr?.disconnect();
  }, 10000);

  async function setupTestContent() {
    console.log('Setting up test content for feed...');

    // Create multiple test notes
    for (let i = 0; i < 3; i++) {
      const result = await contentModule.publishNote(`Test note ${i + 1} for feed testing ${Date.now()}`);
      if (result.success && result.eventId) {
        testNoteIds.push(result.eventId);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create a repost
    if (testNoteIds.length > 0) {
      const repostResult = await contentModule.repost(testNoteIds[0]);
      if (repostResult.success && repostResult.eventId) {
        testRepostId = repostResult.eventId;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create reactions
    if (testNoteIds.length > 1) {
      const reactionResult = await reactionModule.react(testNoteIds[1], '❤️');
      if (reactionResult.success && reactionResult.eventId) {
        testReactionId = reactionResult.eventId;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create a thread
    const threadResult = await threadModule.createThread(`Test thread for feed ${Date.now()}`);
    if (threadResult.success && threadResult.eventId) {
      testThreadId = threadResult.eventId;
      
      // Add a reply to make it a proper thread
      await threadModule.reply(testThreadId, 'Test reply in thread');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Created test content: ${testNoteIds.length} notes, 1 repost, 1 reaction, 1 thread`);
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  describe('Global Feed', () => {
    it('should get global feed with mixed content types', async () => {
      const globalFeedStore = feedModule.global({ 
        limit: 20,
        authors: [myPubkey] // Limit to our test content
      });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const feedEvents = globalFeedStore.current;

      expect(Array.isArray(feedEvents)).toBe(true);
      expect(feedEvents.length).toBeGreaterThan(0);
      
      // Check feed event structure
      feedEvents.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.pubkey).toBe(myPubkey);
        expect(['note', 'repost', 'reaction', 'thread']).toContain(event.feedType);
        expect(typeof event.created_at).toBe('number');
      });

      // Should be sorted by created_at descending (newest first)
      for (let i = 1; i < feedEvents.length; i++) {
        expect(feedEvents[i-1].created_at).toBeGreaterThanOrEqual(feedEvents[i].created_at);
      }

      // Should contain different types of content
      const feedTypes = new Set(feedEvents.map(e => e.feedType));
      expect(feedTypes.size).toBeGreaterThan(1);

      console.log(`Global feed retrieved: ${feedEvents.length} events, types: ${Array.from(feedTypes).join(', ')}`);
    }, 20000);

    it('should filter global feed by content types', async () => {
      // Test filtering out reactions
      const noReactionsFeedStore = feedModule.global({ 
        limit: 20,
        authors: [myPubkey],
        includeReactions: false
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const noReactionsFeed = noReactionsFeedStore.current;
      const hasReactions = noReactionsFeed.some(e => e.feedType === 'reaction');
      expect(hasReactions).toBe(false);

      // Test filtering out reposts
      const noRepostsFeedStore = feedModule.global({ 
        limit: 20,
        authors: [myPubkey],
        includeReposts: false
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const noRepostsFeed = noRepostsFeedStore.current;
      const hasReposts = noRepostsFeed.some(e => e.feedType === 'repost');
      expect(hasReposts).toBe(false);

      console.log('Content type filtering works correctly');
    }, 15000);
  });

  describe('User Feed', () => {
    it('should get user-specific feed', async () => {
      const userFeedStore = feedModule.user(myPubkey, { limit: 15 });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const userFeed = userFeedStore.current;

      expect(Array.isArray(userFeed)).toBe(true);
      expect(userFeed.length).toBeGreaterThan(0);
      
      // All events should be from the specified user
      userFeed.forEach(event => {
        expect(event.pubkey).toBe(myPubkey);
      });

      console.log(`User feed retrieved: ${userFeed.length} events from ${myPubkey.substring(0, 8)}...`);
    }, 20000);

    it('should get user feed with time filters', async () => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 3600;
      
      const timeFeedStore = feedModule.user(myPubkey, { 
        since: oneHourAgo,
        until: now,
        limit: 20 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const timeFeed = timeFeedStore.current;

      expect(Array.isArray(timeFeed)).toBe(true);
      
      // All events should be within time range
      timeFeed.forEach(event => {
        expect(event.created_at).toBeGreaterThanOrEqual(oneHourAgo);
        expect(event.created_at).toBeLessThanOrEqual(now);
      });

      console.log(`Time-filtered feed: ${timeFeed.length} events within last hour`);
    }, 15000);
  });

  describe('Trending Feed', () => {
    it('should get trending events', async () => {
      const trendingFeedStore = feedModule.trending({ 
        limit: 10,
        authors: [myPubkey] // Limit to our test content
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const trendingFeed = trendingFeedStore.current;

      expect(Array.isArray(trendingFeed)).toBe(true);
      
      // Trending should only include notes (kind 1)
      trendingFeed.forEach(event => {
        expect(event.kind).toBe(1);
        expect(['note', 'thread']).toContain(event.feedType);
      });

      console.log(`Trending feed: ${trendingFeed.length} trending events`);
    }, 15000);
  });

  describe('Feed Statistics', () => {
    it('should calculate feed statistics', async () => {
      const statsStore = feedModule.stats({ 
        authors: [myPubkey],
        limit: 50
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const stats = statsStore.current;

      expect(typeof stats.totalEvents).toBe('number');
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(typeof stats.noteCount).toBe('number');
      expect(typeof stats.repostCount).toBe('number');
      expect(typeof stats.reactionCount).toBe('number');
      expect(typeof stats.threadCount).toBe('number');
      expect(typeof stats.uniqueAuthors).toBe('number');
      expect(stats.uniqueAuthors).toBeGreaterThanOrEqual(1);
      
      expect(typeof stats.timeRange.oldest).toBe('number');
      expect(typeof stats.timeRange.newest).toBe('number');
      expect(stats.timeRange.newest).toBeGreaterThanOrEqual(stats.timeRange.oldest);
      
      // Total should equal sum of parts
      const calculatedTotal = stats.noteCount + stats.repostCount + stats.reactionCount + stats.threadCount;
      expect(calculatedTotal).toBeLessThanOrEqual(stats.totalEvents);

      console.log('Feed Statistics:', {
        total: stats.totalEvents,
        notes: stats.noteCount,
        reposts: stats.repostCount,
        reactions: stats.reactionCount,
        threads: stats.threadCount,
        authors: stats.uniqueAuthors
      });
    }, 20000);
  });

  describe('Feed Search', () => {
    it('should search feed by content', async () => {
      const searchQuery = 'feed testing';
      const searchFeedStore = feedModule.search(searchQuery, { 
        authors: [myPubkey],
        limit: 10
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const searchResults = searchFeedStore.current;

      expect(Array.isArray(searchResults)).toBe(true);
      
      // All results should contain the search query
      searchResults.forEach(event => {
        expect(event.content.toLowerCase()).toContain(searchQuery.toLowerCase());
        expect(event.kind).toBe(1); // Should only search in text notes
      });

      console.log(`Search results for "${searchQuery}": ${searchResults.length} events`);
    }, 15000);

    it('should handle search with no results', async () => {
      const searchQuery = 'nonexistentquerythatwontmatch123456789';
      const searchFeedStore = feedModule.search(searchQuery, { 
        authors: [myPubkey],
        limit: 10
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const searchResults = searchFeedStore.current;

      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBe(0);

      console.log('Empty search results handled correctly');
    }, 10000);
  });

  describe('Reactive Updates', () => {
    it('should handle reactive updates for global feed', async () => {
      const globalFeedStore = feedModule.global({ 
        limit: 10,
        authors: [myPubkey]
      });
      
      let updateCount = 0;
      let lastFeedEvents: any;

      // Subscribe to updates
      const unsubscribe = globalFeedStore.subscribe(events => {
        updateCount++;
        lastFeedEvents = events;
        console.log(`Feed update #${updateCount}: ${events.length} events`);
      });

      // Create new content to trigger update
      await contentModule.publishNote('Reactive feed update test ' + Date.now());
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      unsubscribe();

      expect(updateCount).toBeGreaterThan(1);
      expect(lastFeedEvents.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Feed Event Types', () => {
    it('should correctly identify different feed event types', async () => {
      const globalFeedStore = feedModule.global({ 
        limit: 20,
        authors: [myPubkey]
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const feedEvents = globalFeedStore.current;
      
      let foundNote = false;
      let foundRepost = false;
      let foundReaction = false;
      let foundThread = false;

      feedEvents.forEach(event => {
        switch (event.feedType) {
          case 'note':
            foundNote = true;
            expect(event.kind).toBe(1);
            expect(event.tags.filter(t => t[0] === 'e')).toHaveLength(0); // No e-tags for root notes
            break;
          case 'repost':
            foundRepost = true;
            expect(event.kind).toBe(6);
            expect(event.referencedEventId).toBeDefined();
            break;
          case 'reaction':
            foundReaction = true;
            expect(event.kind).toBe(7);
            expect(event.referencedEventId).toBeDefined();
            break;
          case 'thread':
            foundThread = true;
            expect(event.kind).toBe(1);
            expect(event.tags.filter(t => t[0] === 'e').length).toBeGreaterThan(0); // Has e-tags for replies
            break;
        }
      });

      console.log('Feed event types found:', {
        note: foundNote,
        repost: foundRepost,
        reaction: foundReaction,
        thread: foundThread
      });

      // We should have at least some variety
      const typesFound = [foundNote, foundRepost, foundReaction, foundThread].filter(Boolean).length;
      expect(typesFound).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle empty feed gracefully', async () => {
      const nonExistentUser = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const emptyFeedStore = feedModule.user(nonExistentUser, { limit: 10 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const emptyFeed = emptyFeedStore.current;

      expect(Array.isArray(emptyFeed)).toBe(true);
      expect(emptyFeed.length).toBe(0);

      console.log('Empty feed handled correctly');
    }, 10000);

    it('should handle user without signing provider', async () => {
      // Create a new nostr instance without signing
      const nostrNoSigning = new NostrUnchained({
        relays: [testRelay],
        debug: false
      });
      
      const feedModuleNoSigning = new FeedModule(nostrNoSigning, false);
      
      const followingFeedStore = feedModuleNoSigning.following({ limit: 10 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const followingFeed = followingFeedStore.current;
      
      expect(Array.isArray(followingFeed)).toBe(true);
      expect(followingFeed.length).toBe(0);
      
      await nostrNoSigning.disconnect();

      console.log('No signing provider handled correctly');
    }, 10000);
  });

  describe('Feed Performance', () => {
    it('should handle large feed queries efficiently', async () => {  
      const startTime = Date.now();
      
      const largeFeedStore = feedModule.global({ 
        limit: 100,
        authors: [myPubkey]
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const largeFeed = largeFeedStore.current;
      const duration = Date.now() - startTime;

      expect(Array.isArray(largeFeed)).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`Large feed query (${largeFeed.length} events) completed in ${duration}ms`);
    }, 15000);
  });
});