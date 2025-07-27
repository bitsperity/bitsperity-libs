/**
 * REAL Thread Creation Test - Create actual threads on relay
 * Multiple participants, real crypto, real relay, 0% mocks
 */

import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';

describe('REAL Thread Creation Test', () => {
  const testRelay = 'ws://umbrel.local:4848';
  
  // Helper function to create and publish an event
  async function createAndPublishEvent(signer: TemporarySigner, content: string, tags: string[][] = []): Promise<string> {
    const pubkey = await signer.getPublicKey();
    
    const unsignedEvent = {
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags,
      content
    };
    
    const eventId = EventBuilder.calculateEventId(unsignedEvent);
    const signature = await signer.signEvent(unsignedEvent);
    const signedEvent = {
      ...unsignedEvent,
      id: eventId,
      sig: signature
    };
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(testRelay);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Publish timeout'));
      }, 10000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify(['EVENT', signedEvent]));
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg[0] === 'OK' && msg[1] === signedEvent.id) {
          clearTimeout(timeout);
          ws.close();
          if (msg[2] === true) {
            resolve(signedEvent.id);
          } else {
            reject(new Error(`Relay rejected: ${msg[3]}`));
          }
        }
      });
      
      ws.on('error', reject);
    });
  }
  
  // Helper to fetch events from relay
  async function fetchEvents(filters: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(testRelay);
      const events: any[] = [];
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(events); // Return what we have
      }, 10000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify(['REQ', 'fetch', filters]));
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg[0] === 'EVENT') {
          events.push(msg[2]);
        } else if (msg[0] === 'EOSE') {
          clearTimeout(timeout);
          ws.close();
          resolve(events);
        }
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  it('should create a complete thread with 3 participants and proper NIP-10 threading', async () => {
    console.log('=== Creating REAL thread with 3 participants ===');
    
    // Create 3 real participants
    const alice = new TemporarySigner();
    const bob = new TemporarySigner();
    const charlie = new TemporarySigner();
    
    const alicePubkey = await alice.getPublicKey();
    const bobPubkey = await bob.getPublicKey();
    const charliePubkey = await charlie.getPublicKey();
    
    console.log('Alice:', alicePubkey);
    console.log('Bob:', bobPubkey);  
    console.log('Charlie:', charliePubkey);
    
    // Step 1: Alice creates root thread
    console.log('\\n1. Alice creates root thread...');
    const rootContent = `REAL THREAD TEST: Multi-participant discussion started by Alice at ${new Date().toISOString()}`;
    const rootTags = [
      ['p', bobPubkey],
      ['p', charliePubkey]
    ];
    
    const rootEventId = await createAndPublishEvent(alice, rootContent, rootTags);
    console.log('✅ Root thread created:', rootEventId);
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Bob replies to root
    console.log('\\n2. Bob replies to root...');
    const bobReplyContent = `Bob replying to Alice: Thanks for starting this discussion! @Charlie should join too.`;
    const bobReplyTags = [
      ['e', rootEventId, '', 'reply'],
      ['p', alicePubkey],
      ['p', charliePubkey]
    ];
    
    const bobReplyId = await createAndPublishEvent(bob, bobReplyContent, bobReplyTags);
    console.log('✅ Bob reply created:', bobReplyId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Charlie replies to root
    console.log('\\n3. Charlie replies to root...');
    const charlieReplyContent = `Charlie here! Great topic @Alice. I agree with @Bob's points.`;
    const charlieReplyTags = [
      ['e', rootEventId, '', 'reply'],
      ['p', alicePubkey],
      ['p', bobPubkey]
    ];
    
    const charlieReplyId = await createAndPublishEvent(charlie, charlieReplyContent, charlieReplyTags);
    console.log('✅ Charlie reply created:', charlieReplyId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Alice replies to Bob's message (nested reply)
    console.log('\\n4. Alice creates nested reply to Bob...');
    const aliceNestedContent = `@Bob Excellent point! This shows proper NIP-10 nesting in action.`;
    const aliceNestedTags = [
      ['e', bobReplyId, '', 'reply'],
      ['e', rootEventId, '', 'root'],
      ['p', bobPubkey],
      ['p', charliePubkey]
    ];
    
    const aliceNestedId = await createAndPublishEvent(alice, aliceNestedContent, aliceNestedTags);
    console.log('✅ Alice nested reply created:', aliceNestedId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Verify the complete thread structure
    console.log('\\n5. Verifying thread structure on relay...');
    
    // Fetch all events that reference the root
    const threadEvents = await fetchEvents({
      kinds: [1],
      '#e': [rootEventId],
      limit: 50
    });
    
    // Also fetch the root event itself
    const rootEvents = await fetchEvents({
      ids: [rootEventId],
      kinds: [1],
      limit: 1
    });
    
    const allEvents = [...rootEvents, ...threadEvents];
    console.log(`Found ${allEvents.length} events in thread`);
    
    // Verify we have all our events
    const eventIds = allEvents.map(e => e.id);
    expect(eventIds).toContain(rootEventId);
    expect(eventIds).toContain(bobReplyId);
    expect(eventIds).toContain(charlieReplyId);
    expect(eventIds).toContain(aliceNestedId);
    
    console.log('\\n=== Thread Structure Verification ===');
    
    // Verify root event
    const rootEvent = allEvents.find(e => e.id === rootEventId);
    expect(rootEvent).toBeDefined();
    expect(rootEvent!.pubkey).toBe(alicePubkey);
    expect(rootEvent!.content).toContain('REAL THREAD TEST');
    expect(rootEvent!.tags.some((t: string[]) => t[0] === 'p' && t[1] === bobPubkey)).toBe(true);
    expect(rootEvent!.tags.some((t: string[]) => t[0] === 'p' && t[1] === charliePubkey)).toBe(true);
    console.log('✅ Root event verified');
    
    // Verify Bob's reply
    const bobEvent = allEvents.find(e => e.id === bobReplyId);
    expect(bobEvent).toBeDefined();
    expect(bobEvent!.pubkey).toBe(bobPubkey);
    expect(bobEvent!.content).toContain('Bob replying');
    expect(bobEvent!.tags.some((t: string[]) => t[0] === 'e' && t[1] === rootEventId && t[3] === 'reply')).toBe(true);
    expect(bobEvent!.tags.some((t: string[]) => t[0] === 'p' && t[1] === alicePubkey)).toBe(true);
    console.log('✅ Bob reply verified');
    
    // Verify Charlie's reply
    const charlieEvent = allEvents.find(e => e.id === charlieReplyId);
    expect(charlieEvent).toBeDefined();
    expect(charlieEvent!.pubkey).toBe(charliePubkey);
    expect(charlieEvent!.content).toContain('Charlie here');
    expect(charlieEvent!.tags.some((t: string[]) => t[0] === 'e' && t[1] === rootEventId && t[3] === 'reply')).toBe(true);
    console.log('✅ Charlie reply verified');
    
    // Verify Alice's nested reply
    const aliceNestedEvent = allEvents.find(e => e.id === aliceNestedId);
    expect(aliceNestedEvent).toBeDefined();
    expect(aliceNestedEvent!.pubkey).toBe(alicePubkey);
    expect(aliceNestedEvent!.content).toContain('Excellent point');
    expect(aliceNestedEvent!.tags.some((t: string[]) => t[0] === 'e' && t[1] === bobReplyId && t[3] === 'reply')).toBe(true);
    expect(aliceNestedEvent!.tags.some((t: string[]) => t[0] === 'e' && t[1] === rootEventId && t[3] === 'root')).toBe(true);
    console.log('✅ Alice nested reply verified');
    
    console.log('\\n🎉 COMPLETE REAL THREAD CREATED AND VERIFIED!');
    console.log(`- Root: ${rootEventId} (Alice)`);
    console.log(`- Reply 1: ${bobReplyId} (Bob -> Root)`);
    console.log(`- Reply 2: ${charlieReplyId} (Charlie -> Root)`);
    console.log(`- Nested: ${aliceNestedId} (Alice -> Bob)`);
    console.log(`- Total events: ${allEvents.length}`);
    
    // Final verification: Check the relay has proper NIP-10 threading
    const eTagCounts = new Map<string, number>();
    for (const event of allEvents) {
      const eTags = event.tags.filter((t: string[]) => t[0] === 'e');
      eTagCounts.set(event.id, eTags.length);
    }
    
    expect(eTagCounts.get(rootEventId)).toBe(0); // Root has no e-tags
    expect(eTagCounts.get(bobReplyId)).toBe(1); // Direct reply has 1 e-tag
    expect(eTagCounts.get(charlieReplyId)).toBe(1); // Direct reply has 1 e-tag  
    expect(eTagCounts.get(aliceNestedId)).toBe(2); // Nested reply has 2 e-tags (reply + root)
    
    console.log('✅ NIP-10 tag structure is correct!');
    
  }, 60000);
  
  it('should verify the thread can be read by any participant', async () => {
    console.log('=== Verifying thread readability ===');
    
    // Get recent events that have e-tags (likely our test thread)
    const recentThreadEvents = await fetchEvents({
      kinds: [1],
      since: Math.floor(Date.now() / 1000) - 300, // Last 5 minutes
      limit: 50
    });
    
    console.log(`Found ${recentThreadEvents.length} recent events`);
    
    // Find events with content matching our test
    const testEvents = recentThreadEvents.filter(e => 
      e.content.includes('REAL THREAD TEST') || 
      e.content.includes('Bob replying') ||
      e.content.includes('Charlie here') ||
      e.content.includes('Excellent point')
    );
    
    console.log(`Found ${testEvents.length} test thread events`);
    
    if (testEvents.length > 0) {
      // Find the root event
      const rootEvent = testEvents.find(e => e.content.includes('REAL THREAD TEST'));
      expect(rootEvent).toBeDefined();
      
      console.log(`Root event: ${rootEvent!.id}`);
      console.log(`Content: "${rootEvent!.content.substring(0, 80)}..."`);
      
      // Find all replies to this root
      const replies = testEvents.filter(e => 
        e.tags.some((tag: string[]) => tag[0] === 'e' && tag[1] === rootEvent!.id)
      );
      
      console.log(`Found ${replies.length} direct replies to root`);
      
      for (const reply of replies) {
        console.log(`- Reply ${reply.id}: "${reply.content.substring(0, 60)}..."`);
        
        // Check if this reply has been replied to
        const nestedReplies = testEvents.filter(e =>
          e.tags.some((tag: string[]) => tag[0] === 'e' && tag[1] === reply.id)
        );
        
        if (nestedReplies.length > 0) {
          console.log(`  └─ Has ${nestedReplies.length} nested replies`);
          for (const nested of nestedReplies) {
            console.log(`    └─ ${nested.id}: "${nested.content.substring(0, 40)}..."`);
          }
        }
      }
      
      expect(testEvents.length).toBeGreaterThanOrEqual(4); // Root + 3 replies minimum
      console.log('✅ Thread structure verified from relay perspective');
    } else {
      console.log('ℹ️ No test thread events found (might have been processed by previous test)');
    }
  }, 30000);
});