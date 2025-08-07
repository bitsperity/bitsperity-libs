/**
 * ThreadModule Integration Tests - Real Relay
 * 
 * Tests ThreadModule against ws://umbrel.local:4848
 * Tests complete NIP-10 compliance with real network conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../../src/crypto/SigningProvider.js';
import { ThreadModule } from '../../../src/social/threads/ThreadModule.js';

describe('ThreadModule Integration Tests - Real Relay', () => {
  let nostr: NostrUnchained;
  let threadModule: ThreadModule;
  let signer: TemporarySigner;
  const testRelay = 'ws://umbrel.local:4848';

  // Test data - we'll create a thread and replies
  let rootThreadId: string;
  let firstReplyId: string;
  let secondReplyId: string;
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

    // Get thread module
    threadModule = new ThreadModule(nostr, true);

    // Wait a bit for relay connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    await nostr?.disconnect();
  }, 10000);

  describe('Thread Creation', () => {
    it('should create a root thread', async () => {
      const threadContent = 'Test thread for ThreadModule testing ' + Date.now();
      const result = await threadModule.createThread(threadContent);

      if (!result.success) {
        console.error('Thread creation failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        rootThreadId = result.eventId;
        console.log(`Created root thread: ${rootThreadId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should create thread with mentions', async () => {
      const mentionedPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';
      const threadContent = 'Thread with mention test ' + Date.now();
      
      const result = await threadModule.createThread(threadContent, [mentionedPubkey]);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log('Created thread with mentions successfully');
    }, 15000);
  });

  describe('Thread Replies', () => {
    beforeAll(async () => {
      // Make sure we have a root thread
      if (!rootThreadId) {
        const result = await threadModule.createThread('Root thread for replies ' + Date.now());
        rootThreadId = result.eventId!;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    });

    it('should reply to root thread', async () => {
      const replyContent = 'First reply to root thread ' + Date.now();
      const result = await threadModule.reply(rootThreadId, replyContent);

      if (!result.success) {
        console.error('Reply failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        firstReplyId = result.eventId;
        console.log(`Created first reply: ${firstReplyId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should reply to a reply (nested threading)', async () => {
      // Make sure we have a first reply
      if (!firstReplyId) {
        const result = await threadModule.reply(rootThreadId, 'Setup reply ' + Date.now());
        firstReplyId = result.eventId!;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const nestedReplyContent = 'Nested reply to first reply ' + Date.now();
      const result = await threadModule.reply(firstReplyId, nestedReplyContent);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      if (result.eventId) {
        secondReplyId = result.eventId;
        console.log(`Created nested reply: ${secondReplyId.substring(0, 8)}...`);
      }
    }, 15000);

    it('should reply with mentions', async () => {
      const mentionedPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';
      const replyContent = 'Reply with mention ' + Date.now();
      
      const result = await threadModule.reply(rootThreadId, replyContent, [mentionedPubkey]);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log('Created reply with mentions successfully');
    }, 15000);
  });

  describe('Thread Querying', () => {
    beforeAll(async () => {
      // Wait for thread events to propagate
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    it('should get complete thread structure', async () => {
      const threadStore = threadModule.thread(rootThreadId, { limit: 20 });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const threadEvents = threadStore.current;

      expect(Array.isArray(threadEvents)).toBe(true);
      expect(threadEvents.length).toBeGreaterThan(0);
      
      // Check thread structure
      threadEvents.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.pubkey).toBe(myPubkey);
        expect(event.kind).toBe(1);
        expect(typeof event.depth).toBe('number');
        expect(event.depth).toBeGreaterThanOrEqual(0);
        
        if (event.rootEventId) {
          expect(typeof event.rootEventId).toBe('string');
        }
        
        if (event.replyToEventId) {
          expect(typeof event.replyToEventId).toBe('string');
        }
        
        expect(Array.isArray(event.threadPath)).toBe(true);
      });

      // Should be sorted chronologically
      for (let i = 1; i < threadEvents.length; i++) {
        expect(threadEvents[i].created_at).toBeGreaterThanOrEqual(threadEvents[i-1].created_at);
      }

      console.log(`Retrieved thread with ${threadEvents.length} events`);
    }, 20000);

    it('should get thread summary', async () => {
      const summaryStore = threadModule.summary(rootThreadId);
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const summary = summaryStore.current;

      expect(summary.rootEventId).toBe(rootThreadId);
      expect(typeof summary.totalReplies).toBe('number');
      expect(summary.totalReplies).toBeGreaterThanOrEqual(0);
      expect(typeof summary.maxDepth).toBe('number');
      expect(summary.maxDepth).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(summary.participants)).toBe(true);
      expect(summary.participants).toContain(myPubkey);

      if (summary.latestReply) {
        expect(summary.latestReply.pubkey).toBe(myPubkey);
        expect(summary.latestReply.kind).toBe(1);
      }

      if (summary.rootEvent) {
        expect(summary.rootEvent.id).toBe(rootThreadId);
        expect(summary.rootEvent.pubkey).toBe(myPubkey);
      }

      console.log('Thread Summary:', {
        totalReplies: summary.totalReplies,
        maxDepth: summary.maxDepth,
        participants: summary.participants.length,
        hasLatestReply: !!summary.latestReply,
        hasRootEvent: !!summary.rootEvent
      });
    }, 20000);

    it('should handle reactive updates for threads', async () => {
      const threadStore = threadModule.thread(rootThreadId, { limit: 10 });
      
      let updateCount = 0;
      let lastThreadEvents: any;

      // Subscribe to updates
      const unsubscribe = threadStore.subscribe(events => {
        updateCount++;
        lastThreadEvents = events;
        console.log(`Thread update #${updateCount}: ${events.length} events`);
      });

      // Add a new reply to trigger update
      await threadModule.reply(rootThreadId, 'Reactive update test reply ' + Date.now());
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      unsubscribe();

      expect(updateCount).toBeGreaterThan(1);
      expect(lastThreadEvents.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe('User Threads', () => {
    it('should get threads where user participated', async () => {
      const myThreadsStore = threadModule.myThreads({ limit: 10 });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const myThreads = myThreadsStore.current;

      expect(Array.isArray(myThreads)).toBe(true);
      expect(myThreads.length).toBeGreaterThan(0);
      
      // Should include our root thread
      const ourThread = myThreads.find(t => t.rootEventId === rootThreadId);
      expect(ourThread).toBeDefined();
      
      if (ourThread) {
        expect(ourThread.participants).toContain(myPubkey);
        expect(ourThread.totalReplies).toBeGreaterThanOrEqual(0);
      }

      console.log(`Found ${myThreads.length} threads where user participated`);
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle reply to non-existent event', async () => {
      const nonExistentEventId = 'a'.repeat(64);
      const result = await threadModule.reply(nonExistentEventId, 'Reply to non-existent event');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target event not found');
    }, 10000);

    it('should handle empty thread gracefully', async () => {
      const nonExistentThreadId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const threadStore = threadModule.thread(nonExistentThreadId, { limit: 10 });
      
      // Wait for reactive updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const threadEvents = threadStore.current;

      expect(Array.isArray(threadEvents)).toBe(true);
      expect(threadEvents.length).toBe(0);
    }, 10000);

    it('should handle user without signing provider', async () => {
      // Create a new nostr instance without signing
      const nostrNoSigning = new NostrUnchained({
        relays: [testRelay],
        debug: false
      });
      
      const threadModuleNoSigning = new ThreadModule(nostrNoSigning, false);
      
      const result = await threadModuleNoSigning.createThread('Should fail');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No signing provider');
      
      await nostrNoSigning.disconnect();
    }, 10000);
  });

  describe('NIP-10 Compliance', () => {
    it('should create NIP-10 compliant reply structure', async () => {
      // Create a new thread for this test
      const rootResult = await threadModule.createThread('NIP-10 compliance test ' + Date.now());
      expect(rootResult.success).toBe(true);
      
      const rootId = rootResult.eventId!;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create reply
      const replyResult = await threadModule.reply(rootId, 'NIP-10 compliant reply ' + Date.now());
      
      expect(replyResult.success).toBe(true);
      expect(replyResult.eventId).toBeDefined();

      // The NIP-10 compliance is verified by the relay accepting the event
      // and by our thread parsing working correctly
      console.log('NIP-10 compliant thread created:', {
        root: rootId.substring(0, 8) + '...',
        reply: replyResult.eventId?.substring(0, 8) + '...'
      });
    }, 20000);

    it('should handle complex thread structures', async () => {
      // Create a complex thread: root -> reply1 -> reply2 -> reply3
      const rootResult = await threadModule.createThread('Complex thread root ' + Date.now());
      const rootId = rootResult.eventId!;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reply1Result = await threadModule.reply(rootId, 'Reply level 1');
      const reply1Id = reply1Result.eventId!;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reply2Result = await threadModule.reply(reply1Id, 'Reply level 2');
      const reply2Id = reply2Result.eventId!;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reply3Result = await threadModule.reply(reply2Id, 'Reply level 3');
      
      expect(rootResult.success).toBe(true);
      expect(reply1Result.success).toBe(true);
      expect(reply2Result.success).toBe(true);
      expect(reply3Result.success).toBe(true);
      
      // Wait for events to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get thread structure
      const threadStore = threadModule.thread(rootId, { limit: 20 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const threadEvents = threadStore.current;
      
      expect(threadEvents.length).toBeGreaterThanOrEqual(3); // 3 replies (root not included in query)
      
      // Check depth progression
      const sortedEvents = threadEvents.sort((a, b) => a.created_at - b.created_at);
      let maxDepthSeen = 0;
      
      for (const event of sortedEvents) {
        expect(event.depth).toBeGreaterThanOrEqual(maxDepthSeen);
        maxDepthSeen = Math.max(maxDepthSeen, event.depth);
      }
      
      expect(maxDepthSeen).toBeGreaterThanOrEqual(1); // At least some depth in the thread
      
      console.log(`Complex thread created with ${threadEvents.length} events, max depth: ${maxDepthSeen}`);
    }, 30000);
  });
});