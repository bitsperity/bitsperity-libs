/**
 * REAL Thread Reading API Test - Test if our API can read the real threads
 */

import { describe, it, expect } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

describe('Thread Reading API Test', () => {
  const testRelay = 'ws://umbrel.local:4848';

  it('should read the real thread we created using the ThreadManager API', async () => {
    console.log('=== Testing ThreadManager API against real relay data ===');
    
    // Initialize NostrUnchained
    const nostr = new NostrUnchained({
      relays: [testRelay],
      debug: true
    });
    
    // Set up signing provider (needed for initialization)
    const signer = new TemporarySigner();
    await nostr.social.updateSigningProvider(signer);
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // The root thread ID from our previous test
    const rootThreadId = '2f754dc208563b750132f21390edd6969878da543150d6805edfd1392d88e406';
    
    console.log(`Attempting to read thread: ${rootThreadId}`);
    
    // Try to read the thread using our API
    const thread = await nostr.social.threads.get(rootThreadId, {
      useCache: false,
      timeout: 15000,
      limit: 50
    });
    
    console.log('Thread result:', thread);
    
    if (thread) {
      console.log('\\n🎉 SUCCESS! ThreadManager API can read real threads!');
      console.log(`Thread ID: ${thread.rootEventId}`);
      console.log(`Message count: ${thread.messageCount}`);
      console.log(`Last activity: ${new Date(thread.lastActivity * 1000).toISOString()}`);
      console.log(`Is watched: ${thread.isWatched}`);
      
      expect(thread.rootEventId).toBe(rootThreadId);
      expect(thread.messageCount).toBeGreaterThanOrEqual(4); // Root + 3 replies
      expect(thread.messages.length).toBe(thread.messageCount);
      
      console.log('\\n=== Thread Messages ===');
      for (let i = 0; i < thread.messages.length; i++) {
        const msg = thread.messages[i];
        console.log(`${i + 1}. Event: ${msg.eventId}`);
        console.log(`   Author: ${msg.authorPubkey}`);
        console.log(`   Content: "${msg.content.substring(0, 60)}..."`);
        console.log(`   Depth: ${msg.depth}`);
        console.log(`   Reply to: ${msg.replyToEventId || 'ROOT'}`);
        console.log(`   Mentions: ${msg.mentionedPubkeys.length} users`);
        console.log(`   Is own: ${msg.isOwn}`);
        console.log('');
      }
      
      // Verify thread structure
      const rootMessage = thread.messages.find(m => m.eventId === rootThreadId);
      expect(rootMessage).toBeDefined();
      expect(rootMessage!.depth).toBe(0);
      expect(rootMessage!.replyToEventId).toBeNull();
      expect(rootMessage!.content).toContain('REAL THREAD TEST');
      
      // Verify replies
      const directReplies = thread.messages.filter(m => m.replyToEventId === rootThreadId);
      expect(directReplies.length).toBeGreaterThanOrEqual(2); // Bob and Charlie
      
      // Verify nested replies  
      const nestedReplies = thread.messages.filter(m => m.depth >= 2);
      expect(nestedReplies.length).toBeGreaterThanOrEqual(1); // Alice's nested reply
      
      // Check depth progression
      const depthCounts = new Map<number, number>();
      for (const msg of thread.messages) {
        const count = depthCounts.get(msg.depth) || 0;
        depthCounts.set(msg.depth, count + 1);
      }
      
      console.log('=== Depth Distribution ===');
      for (const [depth, count] of depthCounts.entries()) {
        console.log(`Depth ${depth}: ${count} messages`);
      }
      
      expect(depthCounts.get(0)).toBe(1); // Exactly one root
      expect(depthCounts.get(1)).toBeGreaterThanOrEqual(2); // At least 2 direct replies
      
      // Verify chronological order
      for (let i = 1; i < thread.messages.length; i++) {
        expect(thread.messages[i].createdAt).toBeGreaterThanOrEqual(
          thread.messages[i - 1].createdAt
        );
      }
      
      console.log('✅ All thread structure validations passed!');
      
    } else {
      console.log('❌ Thread not found - API could not read the real thread data');
      expect(thread).toBeDefined(); // This will fail and show the issue
    }
    
    await nostr.disconnect();
  }, 30000);

  it('should find and read multiple threads from the relay', async () => {
    console.log('=== Finding all threads on relay ===');
    
    const nostr = new NostrUnchained({
      relays: [testRelay],
      debug: true
    });
    
    const signer = new TemporarySigner();
    await nostr.social.updateSigningProvider(signer);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for events with e-tags (thread participants)
    const threadEvents = await new Promise<any[]>((resolve) => {
      const events: any[] = [];
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(events);
        }
      }, 10000);

      nostr.subscriptionManager.subscribe([{
        kinds: [1],
        limit: 50,
        since: Math.floor(Date.now() / 1000) - 3600 // Last hour
      }], {
        onEvent: (event: any) => {
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
    
    console.log(`Found ${threadEvents.length} events with e-tags`);
    
    // Find unique root event IDs
    const potentialRoots = new Set<string>();
    for (const event of threadEvents) {
      const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
      for (const eTag of eTags) {
        const rootMarker = eTag[3];
        if (rootMarker === 'root' || rootMarker === 'reply') {
          potentialRoots.add(eTag[1]);
        }
      }
    }
    
    console.log(`Found ${potentialRoots.size} potential thread roots`);
    
    // Test reading each thread
    const threadResults = [];
    for (const rootId of Array.from(potentialRoots).slice(0, 3)) { // Test first 3
      console.log(`\\nTesting thread: ${rootId}`);
      
      const thread = await nostr.social.threads.get(rootId, {
        useCache: false,
        timeout: 10000,
        limit: 20
      });
      
      if (thread) {
        threadResults.push({
          rootId,
          messageCount: thread.messageCount,
          maxDepth: Math.max(...thread.messages.map(m => m.depth)),
          hasRealContent: thread.messages.some(m => 
            m.content.includes('REAL THREAD') || 
            m.content.includes('Bob replying') || 
            m.content.includes('Charlie here')
          )
        });
        console.log(`✅ Thread ${rootId}: ${thread.messageCount} messages, max depth ${Math.max(...thread.messages.map(m => m.depth))}`);
      } else {
        console.log(`❌ Could not read thread ${rootId}`);
      }
    }
    
    console.log('\\n=== Thread Reading Results ===');
    for (const result of threadResults) {
      console.log(`Thread ${result.rootId}:`);
      console.log(`  Messages: ${result.messageCount}`);
      console.log(`  Max depth: ${result.maxDepth}`);
      console.log(`  Real test content: ${result.hasRealContent ? 'YES' : 'NO'}`);
    }
    
    expect(threadResults.length).toBeGreaterThan(0);
    const realTestThread = threadResults.find(r => r.hasRealContent);
    if (realTestThread) {
      expect(realTestThread.messageCount).toBeGreaterThanOrEqual(4);
      expect(realTestThread.maxDepth).toBeGreaterThanOrEqual(2);
      console.log('✅ Found and validated our real test thread!');
    }
    
    await nostr.disconnect();
  }, 45000);
});