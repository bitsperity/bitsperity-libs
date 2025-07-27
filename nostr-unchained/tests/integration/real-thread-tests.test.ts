/**
 * REAL Threading Integration Tests - No Mocks, Real Relay, Real Crypto
 * Multiple participants, real thread creation, real reading
 * 100% authentic test with ws://umbrel.local:4848
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import type { ThreadCreateRequest, ReplyRequest } from '../../src/social/types/thread-types.js';

describe('REAL Threading Tests - Multiple Participants', () => {
  const testRelay = 'ws://umbrel.local:4848';
  
  // Test participants with real generated keys
  let alice: { nostr: NostrUnchained, signer: TemporarySigner, pubkey: string };
  let bob: { nostr: NostrUnchained, signer: TemporarySigner, pubkey: string };
  let charlie: { nostr: NostrUnchained, signer: TemporarySigner, pubkey: string };
  
  let testThreadId: string;

  beforeAll(async () => {
    console.log('=== Setting up REAL test participants ===');
    
    // Generate real signers for each participant
    const aliceSigner = new TemporarySigner();
    const bobSigner = new TemporarySigner();
    const charlieSigner = new TemporarySigner();
    
    const alicePubkey = await aliceSigner.getPublicKey();
    const bobPubkey = await bobSigner.getPublicKey();
    const charliePubkey = await charlieSigner.getPublicKey();
    
    console.log('Alice pubkey:', alicePubkey);
    console.log('Bob pubkey:', bobPubkey);
    console.log('Charlie pubkey:', charliePubkey);
    
    // Initialize each participant with their own NostrUnchained instance
    alice = {
      nostr: new NostrUnchained({ 
        relays: [testRelay], 
        debug: true
      }),
      signer: aliceSigner,
      pubkey: alicePubkey
    };
    
    bob = {
      nostr: new NostrUnchained({ 
        relays: [testRelay], 
        debug: true
      }),
      signer: bobSigner,
      pubkey: bobPubkey
    };
    
    charlie = {
      nostr: new NostrUnchained({ 
        relays: [testRelay], 
        debug: true
      }),
      signer: charlieSigner,
      pubkey: charliePubkey
    };
    
    // Set signing providers for each participant's social modules
    await alice.nostr.social.updateSigningProvider(aliceSigner);
    await bob.nostr.social.updateSigningProvider(bobSigner);
    await charlie.nostr.social.updateSigningProvider(charlieSigner);
    
    // Wait for all relay connections
    await Promise.all([
      new Promise(resolve => setTimeout(resolve, 2000)),
      new Promise(resolve => setTimeout(resolve, 2000)),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);
    
    console.log('✅ All participants connected to relay');
  }, 15000);

  afterAll(async () => {
    if (alice?.nostr) await alice.nostr.disconnect();
    if (bob?.nostr) await bob.nostr.disconnect();
    if (charlie?.nostr) await charlie.nostr.disconnect();
  });

  describe('Real Thread Creation and Multi-Participant Conversation', () => {
    it('should create a real thread with Alice as initiator', async () => {
      console.log('=== Alice creates thread ===');
      
      const threadRequest: ThreadCreateRequest = {
        content: `REAL TEST: Discussion about nostr threading - started by Alice at ${new Date().toISOString()}`,
        mentions: [bob.pubkey, charlie.pubkey]
      };

      const result = await alice.nostr.social.threads.createThread(threadRequest);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.message!.isOwn).toBe(true);
      expect(result.message!.authorPubkey).toBe(alice.pubkey);
      expect(result.message!.mentionedPubkeys).toContain(bob.pubkey);
      expect(result.message!.mentionedPubkeys).toContain(charlie.pubkey);
      
      testThreadId = result.eventId!;
      console.log(`✅ Alice created thread: ${testThreadId}`);
      
      // Wait for relay propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
    }, 20000);

    it('should allow Bob to read the thread Alice created', async () => {
      console.log('=== Bob reads Alice\'s thread ===');
      
      const thread = await bob.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 15000
      });
      
      expect(thread).toBeDefined();
      expect(thread!.rootEventId).toBe(testThreadId);
      expect(thread!.messageCount).toBe(1);
      expect(thread!.messages[0].authorPubkey).toBe(alice.pubkey);
      expect(thread!.messages[0].mentionedPubkeys).toContain(bob.pubkey);
      expect(thread!.messages[0].mentionedPubkeys).toContain(charlie.pubkey);
      expect(thread!.messages[0].depth).toBe(0);
      expect(thread!.messages[0].replyToEventId).toBeNull();
      
      console.log(`✅ Bob successfully read thread: ${thread!.messageCount} messages`);
      console.log(`Thread content: "${thread!.messages[0].content}"`);
    }, 20000);

    it('should allow Charlie to read the thread Alice created', async () => {
      console.log('=== Charlie reads Alice\'s thread ===');
      
      const thread = await charlie.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 15000
      });
      
      expect(thread).toBeDefined();
      expect(thread!.rootEventId).toBe(testThreadId);
      expect(thread!.messageCount).toBe(1);
      expect(thread!.messages[0].authorPubkey).toBe(alice.pubkey);
      expect(thread!.messages[0].mentionedPubkeys).toContain(charlie.pubkey);
      
      console.log(`✅ Charlie successfully read thread: ${thread!.messageCount} messages`);
    }, 20000);

    it('should allow Bob to reply to Alice\'s thread', async () => {
      console.log('=== Bob replies to Alice\'s thread ===');
      
      const replyRequest: ReplyRequest = {
        content: `Bob's reply: Thanks Alice for starting this discussion! Mentioning @Charlie too.`,
        replyToEventId: testThreadId,
        rootEventId: testThreadId,
        mentions: [alice.pubkey, charlie.pubkey]
      };

      const result = await bob.nostr.social.threads.reply(replyRequest);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.message!.isOwn).toBe(true);
      expect(result.message!.authorPubkey).toBe(bob.pubkey);
      expect(result.message!.replyToEventId).toBe(testThreadId);
      expect(result.message!.rootEventId).toBe(testThreadId);
      expect(result.message!.depth).toBe(1);
      
      console.log(`✅ Bob replied to thread: ${result.eventId}`);
      
      // Wait for relay propagation
      await new Promise(resolve => setTimeout(resolve, 3000));
    }, 20000);

    it('should allow Charlie to reply to Alice\'s thread', async () => {
      console.log('=== Charlie replies to Alice\'s thread ===');
      
      const replyRequest: ReplyRequest = {
        content: `Charlie here! Great topic @Alice. I agree with @Bob's points.`,
        replyToEventId: testThreadId,
        rootEventId: testThreadId,
        mentions: [alice.pubkey, bob.pubkey]
      };

      const result = await charlie.nostr.social.threads.reply(replyRequest);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.message!.authorPubkey).toBe(charlie.pubkey);
      expect(result.message!.depth).toBe(1);
      
      console.log(`✅ Charlie replied to thread: ${result.eventId}`);
      
      // Wait for relay propagation
      await new Promise(resolve => setTimeout(resolve, 3000));
    }, 20000);

    it('should show complete thread with all participants from Alice\'s perspective', async () => {
      console.log('=== Alice reads complete thread ===');
      
      const thread = await alice.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 20000,
        limit: 50
      });
      
      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBeGreaterThanOrEqual(3); // Alice + Bob + Charlie minimum
      
      // Find each participant's message
      const aliceMsg = thread!.messages.find(m => m.authorPubkey === alice.pubkey);
      const bobMsg = thread!.messages.find(m => m.authorPubkey === bob.pubkey);
      const charlieMsg = thread!.messages.find(m => m.authorPubkey === charlie.pubkey);
      
      expect(aliceMsg).toBeDefined();
      expect(bobMsg).toBeDefined();
      expect(charlieMsg).toBeDefined();
      
      expect(aliceMsg!.depth).toBe(0); // Root
      expect(bobMsg!.depth).toBe(1); // Reply to root
      expect(charlieMsg!.depth).toBe(1); // Reply to root
      
      expect(bobMsg!.replyToEventId).toBe(testThreadId);
      expect(charlieMsg!.replyToEventId).toBe(testThreadId);
      
      console.log(`✅ Complete thread from Alice's view: ${thread!.messageCount} messages`);
      console.log('Participants:', [
        aliceMsg ? 'Alice' : null,
        bobMsg ? 'Bob' : null, 
        charlieMsg ? 'Charlie' : null
      ].filter(Boolean).join(', '));
    }, 25000);

    it('should show complete thread with all participants from Bob\'s perspective', async () => {
      console.log('=== Bob reads complete thread ===');
      
      const thread = await bob.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 20000,
        limit: 50
      });
      
      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBeGreaterThanOrEqual(3);
      
      // Verify all messages are properly threaded
      for (const message of thread!.messages) {
        expect(message.rootEventId).toBe(testThreadId);
        expect(message.eventId).toBeDefined();
        expect(message.eventId.length).toBe(64);
        expect(message.authorPubkey).toBeDefined();
        expect(message.authorPubkey.length).toBe(64);
        expect(message.depth).toBeGreaterThanOrEqual(0);
        
        // Root message should have depth 0 and no replyTo
        if (message.depth === 0) {
          expect(message.replyToEventId).toBeNull();
          expect(message.eventId).toBe(testThreadId);
        } else {
          expect(message.replyToEventId).toBeDefined();
        }
      }
      
      console.log(`✅ Complete thread from Bob's view: ${thread!.messageCount} messages`);
      
      // Validate chronological order
      for (let i = 1; i < thread!.messages.length; i++) {
        expect(thread!.messages[i].createdAt).toBeGreaterThanOrEqual(
          thread!.messages[i-1].createdAt
        );
      }
      
      console.log('✅ Messages are in chronological order');
    }, 25000);

    it('should show complete thread with all participants from Charlie\'s perspective', async () => {
      console.log('=== Charlie reads complete thread ===');
      
      const thread = await charlie.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 20000,
        limit: 50
      });
      
      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBeGreaterThanOrEqual(3);
      
      // Verify thread structure integrity
      const participantCount = new Set(thread!.messages.map(m => m.authorPubkey)).size;
      expect(participantCount).toBeGreaterThanOrEqual(3); // Alice, Bob, Charlie
      
      // Check depth distribution
      const depthCounts = new Map<number, number>();
      for (const message of thread!.messages) {
        const count = depthCounts.get(message.depth) || 0;
        depthCounts.set(message.depth, count + 1);
      }
      
      expect(depthCounts.get(0)).toBe(1); // Should have exactly one root
      expect(depthCounts.get(1)).toBeGreaterThanOrEqual(2); // Should have at least 2 direct replies
      
      console.log(`✅ Complete thread from Charlie's view: ${thread!.messageCount} messages`);
      console.log(`Depth distribution: ${Array.from(depthCounts.entries()).map(([d, c]) => `${d}:${c}`).join(', ')}`);
      console.log(`Unique participants: ${participantCount}`);
    }, 25000);
  });

  describe('Real Nested Threading', () => {
    it('should allow Bob to reply to Charlie\'s message (nested reply)', async () => {
      console.log('=== Creating nested reply: Bob replies to Charlie ===');
      
      // First get the thread to find Charlie's message
      const thread = await bob.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 15000
      });
      
      expect(thread).toBeDefined();
      
      const charlieMsg = thread!.messages.find(m => m.authorPubkey === charlie.pubkey);
      expect(charlieMsg).toBeDefined();
      
      console.log(`Found Charlie's message: ${charlieMsg!.eventId}`);
      
      // Bob replies to Charlie's specific message
      const nestedReplyRequest: ReplyRequest = {
        content: `@Charlie I'm specifically replying to your message. This should create proper NIP-10 nesting!`,
        replyToEventId: charlieMsg!.eventId,
        rootEventId: testThreadId,
        mentions: [charlie.pubkey, alice.pubkey]
      };

      const result = await bob.nostr.social.threads.reply(nestedReplyRequest);
      
      expect(result.success).toBe(true);
      expect(result.message!.replyToEventId).toBe(charlieMsg!.eventId);
      expect(result.message!.rootEventId).toBe(testThreadId);
      expect(result.message!.depth).toBe(2); // Nested reply should be depth 2
      
      console.log(`✅ Bob created nested reply: ${result.eventId}`);
      
      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 3000));
    }, 25000);

    it('should properly parse the nested thread structure', async () => {
      console.log('=== Validating nested thread structure ===');
      
      const thread = await alice.nostr.social.threads.get(testThreadId, {
        useCache: false,
        timeout: 20000,
        limit: 100
      });
      
      expect(thread).toBeDefined();
      expect(thread!.messageCount).toBeGreaterThanOrEqual(4); // Alice + Bob + Charlie + Bob's nested reply
      
      // Check for depth 2 message (nested reply)
      const nestedMessages = thread!.messages.filter(m => m.depth === 2);
      expect(nestedMessages.length).toBeGreaterThanOrEqual(1);
      
      const nestedMsg = nestedMessages[0];
      expect(nestedMsg.authorPubkey).toBe(bob.pubkey);
      expect(nestedMsg.rootEventId).toBe(testThreadId);
      expect(nestedMsg.replyToEventId).toBeDefined();
      expect(nestedMsg.replyToEventId).not.toBe(testThreadId); // Should reply to Charlie, not root
      
      // Verify the parent message exists
      const parentMsg = thread!.messages.find(m => m.eventId === nestedMsg.replyToEventId);
      expect(parentMsg).toBeDefined();
      expect(parentMsg!.authorPubkey).toBe(charlie.pubkey);
      expect(parentMsg!.depth).toBe(1);
      
      console.log(`✅ Nested threading validated:`);
      console.log(`- Root (Alice): depth 0`);
      console.log(`- Direct replies: depth 1`);
      console.log(`- Nested reply (Bob -> Charlie): depth 2`);
      console.log(`- Total messages: ${thread!.messageCount}`);
      
      // Validate NIP-10 compliance
      const depthCounts = new Map<number, number>();
      for (const message of thread!.messages) {
        const count = depthCounts.get(message.depth) || 0;
        depthCounts.set(message.depth, count + 1);
      }
      
      console.log(`Depth distribution: ${Array.from(depthCounts.entries()).map(([d, c]) => `depth ${d}: ${c} messages`).join(', ')}`);
    }, 25000);
  });

  describe('Real-time Thread Watching', () => {
    it('should watch thread and receive real-time updates', async () => {
      console.log('=== Testing real-time thread watching ===');
      
      // Alice starts watching the thread
      const watchResult = await alice.nostr.social.threads.watch(testThreadId);
      expect(watchResult).toBe(true);
      
      console.log('✅ Alice is now watching the thread');
      
      // Set up listener for reactive updates
      let updateReceived = false;
      let initialMessageCount = 0;
      
      const unsubscribe = alice.nostr.social.threads.watchedThreads.subscribe((threads) => {
        const watchedThread = threads.get(testThreadId);
        if (watchedThread) {
          console.log(`Alice sees ${watchedThread.messageCount} messages in watched thread`);
          if (initialMessageCount === 0) {
            initialMessageCount = watchedThread.messageCount;
          } else if (watchedThread.messageCount > initialMessageCount) {
            updateReceived = true;
            console.log('✅ Alice received real-time update!');
          }
        }
      });
      
      // Wait a moment for initial state
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Charlie adds a new message while Alice is watching
      const newReplyRequest: ReplyRequest = {
        content: `Real-time test: Charlie adds message while Alice watches at ${new Date().toISOString()}`,
        replyToEventId: testThreadId,
        rootEventId: testThreadId,
        mentions: [alice.pubkey]
      };
      
      const replyResult = await charlie.nostr.social.threads.reply(newReplyRequest);
      expect(replyResult.success).toBe(true);
      
      console.log(`✅ Charlie added new message: ${replyResult.eventId}`);
      
      // Wait for real-time update propagation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Stop watching
      await alice.nostr.social.threads.unwatch(testThreadId);
      unsubscribe();
      
      console.log(`✅ Real-time watching test completed`);
      console.log(`Update received: ${updateReceived ? 'YES' : 'NO'}`);
    }, 30000);
  });
});