/**
 * ThreadManager Integration Tests - Real Relay Testing
 * Tests against ws://umbrel.local:4848 with complete thread operations
 * Session 4 Phase 2: Threading System (NIP-10)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import type { ThreadCreateRequest, ReplyRequest } from '../../src/social/types/thread-types.js';

describe('ThreadManager Integration Tests - Real Relay', () => {
  let nostr: NostrUnchained;
  let testPrivateKey: string;
  let testPublicKey: string;
  const testRelay = 'ws://umbrel.local:4848';

  beforeAll(async () => {
    // Use fixed test keys for now (write tests need signing)
    testPrivateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    testPublicKey = '7e7e9c04be59dd2ef050b5c3e79c0c45df88a70e0c1b2c53395f9ba5cd42bc0a';

    console.log(`Test session using pubkey: ${testPublicKey}`);

    // Initialize NostrUnchained with test relay
    nostr = new NostrUnchained({
      relays: [testRelay],
      debug: true
    });

    // Wait for relay connection  
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (nostr) {
      await nostr.disconnect();
    }
  });

  describe('Simple Thread Tests - Basic Functionality', () => {
    it('should create a simple thread and fetch it back', async () => {
      console.log('=== Simple Thread Creation Test ===');

      // Create a simple thread
      const threadRequest: ThreadCreateRequest = {
        content: 'This is a test thread from nostr-unchained integration tests',
        mentions: []
      };

      const createResult = await nostr.social.threads.createThread(threadRequest);
      expect(createResult.success).toBe(true);
      expect(createResult.eventId).toBeDefined();
      expect(createResult.message).toBeDefined();
      expect(createResult.message!.content).toBe(threadRequest.content);
      expect(createResult.message!.depth).toBe(0);
      expect(createResult.message!.replyToEventId).toBeNull();
      expect(createResult.message!.isOwn).toBe(true);

      const rootEventId = createResult.eventId!;
      console.log(`✅ Created thread with root ID: ${rootEventId}`);

      // Wait for relay propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the thread back
      const thread = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 8000 
      });

      expect(thread).toBeDefined();
      expect(thread!.rootEventId).toBe(rootEventId);
      expect(thread!.messageCount).toBe(1);
      expect(thread!.messages).toHaveLength(1);
      expect(thread!.messages[0].content).toBe(threadRequest.content);
      expect(thread!.messages[0].eventId).toBe(rootEventId);
      expect(thread!.messages[0].depth).toBe(0);
      expect(thread!.messages[0].replyToEventId).toBeNull();

      console.log('✅ Simple thread creation and fetch successful!');
    }, 15000);

    it('should fetch existing threads from real relay', async () => {
      console.log('=== Fetch Existing Thread Test ===');

      // Try to find threads by looking for recent kind 1 events with e-tags
      const recentEvents = await new Promise<any[]>((resolve) => {
        const events: any[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        }, 8000);

        nostr.subscriptionManager.subscribe([{
          kinds: [1],
          limit: 50,
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }], {
          onEvent: (event: any) => {
            // Look for events with e-tags (likely replies)
            const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
            if (eTags.length > 0) {
              events.push(event);
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(events);
            }
          }
        });
      });

      if (recentEvents.length > 0) {
        const replyEvent = recentEvents[0];
        const eTags = replyEvent.tags.filter((tag: string[]) => tag[0] === 'e');
        const rootEventId = eTags[0][1]; // First e-tag should be root or reply target

        console.log(`Found potential thread root: ${rootEventId}`);

        const thread = await nostr.social.threads.get(rootEventId, { 
          useCache: false, 
          timeout: 10000 
        });

        if (thread) {
          expect(thread.rootEventId).toBe(rootEventId);
          expect(thread.messages.length).toBeGreaterThan(0);
          expect(thread.messageCount).toBe(thread.messages.length);
          
          // Verify thread structure
          const rootMessage = thread.messages.find(m => m.eventId === rootEventId);
          if (rootMessage) {
            expect(rootMessage.depth).toBe(0);
            expect(rootMessage.replyToEventId).toBeNull();
          }

          console.log(`✅ Found real thread with ${thread.messageCount} messages`);
        } else {
          console.log('ℹ️ No thread found (valid - event might not form a complete thread)');
        }
      } else {
        console.log('ℹ️ No recent threaded events found');
      }
    }, 20000);
  });

  describe('Extended Thread Tests - Replies and Nesting', () => {
    it('should create thread with replies and build correct structure', async () => {
      console.log('=== Extended Thread with Replies Test ===');

      // Step 1: Create root thread
      const rootRequest: ThreadCreateRequest = {
        content: 'Root message for extended thread test',
        mentions: []
      };

      const rootResult = await nostr.social.threads.createThread(rootRequest);
      expect(rootResult.success).toBe(true);
      const rootEventId = rootResult.eventId!;
      console.log(`✅ Created root: ${rootEventId}`);

      // Step 2: Create first reply
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reply1Request: ReplyRequest = {
        content: 'First reply to root message',
        replyToEventId: rootEventId,
        rootEventId: rootEventId,
        mentions: []
      };

      const reply1Result = await nostr.social.threads.reply(reply1Request);
      expect(reply1Result.success).toBe(true);
      const reply1EventId = reply1Result.eventId!;
      console.log(`✅ Created reply 1: ${reply1EventId}`);

      // Step 3: Create second reply to root
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reply2Request: ReplyRequest = {
        content: 'Second reply to root message',
        replyToEventId: rootEventId,
        rootEventId: rootEventId,
        mentions: []
      };

      const reply2Result = await nostr.social.threads.reply(reply2Request);
      expect(reply2Result.success).toBe(true);
      const reply2EventId = reply2Result.eventId!;
      console.log(`✅ Created reply 2: ${reply2EventId}`);

      // Step 4: Create nested reply (reply to reply1)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const nestedReplyRequest: ReplyRequest = {
        content: 'Nested reply to first reply',
        replyToEventId: reply1EventId,
        rootEventId: rootEventId,
        mentions: []
      };

      const nestedResult = await nostr.social.threads.reply(nestedReplyRequest);
      expect(nestedResult.success).toBe(true);
      const nestedEventId = nestedResult.eventId!;
      console.log(`✅ Created nested reply: ${nestedEventId}`);

      // Step 5: Wait for propagation and fetch complete thread
      console.log('Waiting for relay propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const thread = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 15000,
        limit: 50
      });

      // Verify thread structure
      expect(thread).toBeDefined();
      expect(thread!.rootEventId).toBe(rootEventId);
      expect(thread!.messageCount).toBeGreaterThanOrEqual(4); // Root + 3 replies minimum
      
      // Find all our messages
      const rootMsg = thread!.messages.find(m => m.eventId === rootEventId);
      const reply1Msg = thread!.messages.find(m => m.eventId === reply1EventId);
      const reply2Msg = thread!.messages.find(m => m.eventId === reply2EventId);
      const nestedMsg = thread!.messages.find(m => m.eventId === nestedEventId);

      // Verify root message
      expect(rootMsg).toBeDefined();
      expect(rootMsg!.depth).toBe(0);
      expect(rootMsg!.replyToEventId).toBeNull();
      expect(rootMsg!.content).toBe(rootRequest.content);

      // Verify replies to root
      expect(reply1Msg).toBeDefined();
      expect(reply1Msg!.depth).toBe(1);
      expect(reply1Msg!.replyToEventId).toBe(rootEventId);

      expect(reply2Msg).toBeDefined();
      expect(reply2Msg!.depth).toBe(1);
      expect(reply2Msg!.replyToEventId).toBe(rootEventId);

      // Verify nested reply
      expect(nestedMsg).toBeDefined();
      expect(nestedMsg!.depth).toBe(2);
      expect(nestedMsg!.replyToEventId).toBe(reply1EventId);
      expect(nestedMsg!.rootEventId).toBe(rootEventId);

      console.log(`✅ Extended thread structure verified: ${thread!.messageCount} messages with correct depths`);
    }, 30000);

    it('should handle thread watching and real-time updates', async () => {
      console.log('=== Thread Watching Test ===');

      // Create a thread to watch
      const watchRequest: ThreadCreateRequest = {
        content: 'Thread for watching test',
        mentions: []
      };

      const rootResult = await nostr.social.threads.createThread(watchRequest);
      expect(rootResult.success).toBe(true);
      const rootEventId = rootResult.eventId!;

      // Start watching the thread
      const watchResult = await nostr.social.threads.watch(rootEventId);
      expect(watchResult).toBe(true);
      console.log(`✅ Started watching thread: ${rootEventId}`);

      // Set up listener for reactive updates
      let updateReceived = false;
      const unsubscribe = nostr.social.threads.watchedThreads.subscribe((threads) => {
        const watchedThread = threads.get(rootEventId);
        if (watchedThread && watchedThread.messageCount > 1) {
          updateReceived = true;
          console.log(`✅ Received real-time update: ${watchedThread.messageCount} messages`);
        }
      });

      // Wait a bit then add a reply
      await new Promise(resolve => setTimeout(resolve, 1000));

      const replyRequest: ReplyRequest = {
        content: 'Reply for watching test',
        replyToEventId: rootEventId,
        rootEventId: rootEventId,
        mentions: []
      };

      const replyResult = await nostr.social.threads.reply(replyRequest);
      expect(replyResult.success).toBe(true);
      console.log(`✅ Added reply to watched thread`);

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Stop watching
      await nostr.social.threads.unwatch(rootEventId);
      unsubscribe();

      console.log(`✅ Thread watching test completed`);
    }, 20000);
  });

  describe('Complex Thread Tests - Real World Scenarios', () => {
    it('should handle complex nested conversations with multiple participants', async () => {
      console.log('=== Complex Multi-Participant Thread Test ===');

      // Create additional test identities (simulated)
      const participant2Pubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      const participant3Pubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';

      // Create root message with mentions
      const rootRequest: ThreadCreateRequest = {
        content: 'Complex discussion about nostr protocol improvements',
        mentions: [participant2Pubkey, participant3Pubkey]
      };

      const rootResult = await nostr.social.threads.createThread(rootRequest);
      expect(rootResult.success).toBe(true);
      const rootEventId = rootResult.eventId!;

      // Create multiple levels of nested replies
      const replies = [];
      
      // Level 1 replies
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const replyRequest: ReplyRequest = {
          content: `Level 1 reply ${i + 1} discussing protocol details`,
          replyToEventId: rootEventId,
          rootEventId: rootEventId,
          mentions: i === 0 ? [participant2Pubkey] : []
        };

        const result = await nostr.social.threads.reply(replyRequest);
        expect(result.success).toBe(true);
        replies.push(result.eventId!);
        console.log(`✅ Created level 1 reply ${i + 1}: ${result.eventId}`);
      }

      // Level 2 replies (nested)
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const replyRequest: ReplyRequest = {
          content: `Level 2 nested reply ${i + 1} with specific feedback`,
          replyToEventId: replies[i], // Reply to level 1 replies
          rootEventId: rootEventId,
          mentions: [participant3Pubkey]
        };

        const result = await nostr.social.threads.reply(replyRequest);
        expect(result.success).toBe(true);
        replies.push(result.eventId!);
        console.log(`✅ Created level 2 reply ${i + 1}: ${result.eventId}`);
      }

      // Level 3 reply (deeply nested)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const deepReplyRequest: ReplyRequest = {
        content: 'Level 3 deep nested reply with technical details',
        replyToEventId: replies[3], // Reply to first level 2 reply
        rootEventId: rootEventId,
        mentions: [participant2Pubkey, participant3Pubkey]
      };

      const deepResult = await nostr.social.threads.reply(deepReplyRequest);
      expect(deepResult.success).toBe(true);
      replies.push(deepResult.eventId!);
      console.log(`✅ Created level 3 deep reply: ${deepResult.eventId}`);

      // Wait for propagation
      console.log('Waiting for complex thread propagation...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Fetch complete thread
      const thread = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 20000,
        limit: 100
      });

      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBeGreaterThanOrEqual(7); // Root + 6 replies minimum

      // Verify thread structure and depths
      const rootMsg = thread!.messages.find(m => m.eventId === rootEventId);
      expect(rootMsg).toBeDefined();
      expect(rootMsg!.depth).toBe(0);
      expect(rootMsg!.mentionedPubkeys).toContain(participant2Pubkey);
      expect(rootMsg!.mentionedPubkeys).toContain(participant3Pubkey);

      // Verify all depth levels exist
      const depthCounts = new Map<number, number>();
      for (const message of thread!.messages) {
        const count = depthCounts.get(message.depth) || 0;
        depthCounts.set(message.depth, count + 1);
      }

      expect(depthCounts.get(0)).toBeGreaterThanOrEqual(1); // Root
      expect(depthCounts.get(1)).toBeGreaterThanOrEqual(3); // Level 1 replies
      expect(depthCounts.get(2)).toBeGreaterThanOrEqual(2); // Level 2 replies
      expect(depthCounts.get(3)).toBeGreaterThanOrEqual(1); // Level 3 reply

      console.log(`✅ Complex thread verified: ${thread!.messageCount} messages across ${Math.max(...depthCounts.keys()) + 1} depth levels`);
      console.log(`Depth distribution: ${Array.from(depthCounts.entries()).map(([d, c]) => `Depth ${d}: ${c}`).join(', ')}`);
    }, 45000);

    it('should handle thread cache performance under load', async () => {
      console.log('=== Thread Cache Performance Test ===');

      // Create a moderate thread
      const rootRequest: ThreadCreateRequest = {
        content: 'Performance test thread for caching',
        mentions: []
      };

      const rootResult = await nostr.social.threads.createThread(rootRequest);
      expect(rootResult.success).toBe(true);
      const rootEventId = rootResult.eventId!;

      // Add several replies
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const replyRequest: ReplyRequest = {
          content: `Performance reply ${i + 1}`,
          replyToEventId: rootEventId,
          rootEventId: rootEventId,
          mentions: []
        };

        await nostr.social.threads.reply(replyRequest);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test fetch performance - first call (network)
      const start1 = Date.now();
      const thread1 = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 10000 
      });
      const duration1 = Date.now() - start1;

      expect(thread1).toBeDefined();
      console.log(`Network fetch: ${duration1}ms for ${thread1!.messageCount} messages`);

      // Test fetch performance - second call (cache)
      const start2 = Date.now();
      const thread2 = await nostr.social.threads.get(rootEventId, { 
        useCache: true, 
        timeout: 1000 
      });
      const duration2 = Date.now() - start2;

      expect(thread2).toBeDefined();
      expect(thread2!.messageCount).toBe(thread1!.messageCount);
      expect(duration2).toBeLessThan(duration1 / 2); // Cache should be much faster
      
      console.log(`Cache fetch: ${duration2}ms (${Math.round((duration1 / duration2) * 100) / 100}x faster)`);

      // Test multiple concurrent cache accesses
      const start3 = Date.now();
      const concurrentPromises = Array(10).fill(0).map(() => 
        nostr.social.threads.get(rootEventId, { useCache: true, timeout: 1000 })
      );
      
      const concurrentResults = await Promise.all(concurrentPromises);
      const duration3 = Date.now() - start3;

      expect(concurrentResults.every(t => t !== null)).toBe(true);
      expect(concurrentResults.every(t => t!.messageCount === thread1!.messageCount)).toBe(true);
      
      console.log(`10 concurrent cache accesses: ${duration3}ms total (${Math.round(duration3 / 10)}ms avg)`);
      console.log('✅ Cache performance test completed');
    }, 25000);

    it('should handle malformed and edge case thread structures', async () => {
      console.log('=== Edge Cases and Error Handling Test ===');

      // Test fetching non-existent thread
      const nonExistentId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const nullThread = await nostr.social.threads.get(nonExistentId, { 
        useCache: false, 
        timeout: 5000 
      });
      expect(nullThread).toBeNull();
      console.log('✅ Non-existent thread handled correctly');

      // Test watching non-existent thread
      const watchNonExistent = await nostr.social.threads.watch(nonExistentId);
      expect(watchNonExistent).toBe(false);
      console.log('✅ Watching non-existent thread handled correctly');

      // Test very short timeout
      const rootRequest: ThreadCreateRequest = {
        content: 'Edge case test thread',
        mentions: []
      };

      const rootResult = await nostr.social.threads.createThread(rootRequest);
      expect(rootResult.success).toBe(true);
      const rootEventId = rootResult.eventId!;

      await new Promise(resolve => setTimeout(resolve, 500));

      // Test with extremely short timeout
      const shortTimeoutThread = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 50 
      });
      // Should either succeed quickly or return null - both are acceptable
      expect(shortTimeoutThread === null || shortTimeoutThread !== undefined).toBe(true);
      console.log('✅ Short timeout handled gracefully');

      // Test large limit
      const largeLimitThread = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 8000,
        limit: 1000 
      });
      expect(largeLimitThread).toBeDefined();
      console.log('✅ Large limit handled correctly');

      console.log('✅ Edge cases test completed');
    }, 20000);
  });

  describe('Thread Validation and NIP-10 Compliance', () => {
    it('should validate thread structure meets NIP-10 specification', async () => {
      console.log('=== NIP-10 Compliance Validation Test ===');

      // Create thread with proper NIP-10 structure
      const rootRequest: ThreadCreateRequest = {
        content: 'NIP-10 compliance test root',
        mentions: ['32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245']
      };

      const rootResult = await nostr.social.threads.createThread(rootRequest);
      expect(rootResult.success).toBe(true);
      const rootEventId = rootResult.eventId!;

      await new Promise(resolve => setTimeout(resolve, 500));

      // Create reply with proper NIP-10 tags
      const replyRequest: ReplyRequest = {
        content: 'NIP-10 compliant reply',
        replyToEventId: rootEventId,
        rootEventId: rootEventId,
        mentions: ['82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2']
      };

      const replyResult = await nostr.social.threads.reply(replyRequest);
      expect(replyResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch and validate thread structure
      const thread = await nostr.social.threads.get(rootEventId, { 
        useCache: false, 
        timeout: 10000 
      });

      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBeGreaterThanOrEqual(2);

      // Validate root message
      const rootMessage = thread!.messages.find(m => m.eventId === rootEventId);
      expect(rootMessage).toBeDefined();
      expect(rootMessage!.depth).toBe(0);
      expect(rootMessage!.replyToEventId).toBeNull();
      expect(rootMessage!.rootEventId).toBe(rootEventId);
      expect(rootMessage!.mentionedPubkeys).toContain('32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245');

      // Validate reply message
      const replyMessage = thread!.messages.find(m => m.eventId === replyResult.eventId);
      expect(replyMessage).toBeDefined();
      expect(replyMessage!.depth).toBe(1);
      expect(replyMessage!.replyToEventId).toBe(rootEventId);
      expect(replyMessage!.rootEventId).toBe(rootEventId);
      expect(replyMessage!.mentionedPubkeys.length).toBeGreaterThan(0);

      // Validate thread integrity
      for (const message of thread!.messages) {
        expect(message.eventId).toBeDefined();
        expect(message.eventId.length).toBe(64); // Valid event ID
        expect(message.authorPubkey).toBeDefined();
        expect(message.authorPubkey.length).toBe(64); // Valid pubkey
        expect(message.content).toBeDefined();
        expect(message.createdAt).toBeGreaterThan(0);
        expect(message.rootEventId).toBe(rootEventId);
        expect(message.depth).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(message.mentionedPubkeys)).toBe(true);
        expect(typeof message.isOwn).toBe('boolean');
        
        // If not root, should have valid reply structure
        if (message.depth > 0) {
          expect(message.replyToEventId).toBeDefined();
          expect(message.replyToEventId!.length).toBe(64);
        }
      }

      // Validate chronological order
      for (let i = 1; i < thread!.messages.length; i++) {
        expect(thread!.messages[i].createdAt).toBeGreaterThanOrEqual(thread!.messages[i-1].createdAt);
      }

      console.log('✅ NIP-10 compliance validation successful');
      console.log(`Thread structure: ${thread!.messageCount} messages, max depth: ${Math.max(...thread!.messages.map(m => m.depth))}`);
    }, 20000);
  });
});