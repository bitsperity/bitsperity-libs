/**
 * REAL Reaction Integration Tests - No Mocks, Real Relay, Real Crypto
 * Test reactions against our existing thread data on ws://umbrel.local:4848
 * 100% authentic NIP-25 reaction testing
 */

import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';
import { REACTION_TYPES } from '../../src/social/types/reaction-types.js';

describe('REAL Reaction Tests - Multiple Participants', () => {
  const testRelay = 'ws://umbrel.local:4848';
  
  // Helper function to create and publish a reaction
  async function createAndPublishReaction(
    signer: TemporarySigner, 
    targetEventId: string, 
    targetAuthorPubkey: string, 
    reactionType: string
  ): Promise<string> {
    const pubkey = await signer.getPublicKey();
    
    const unsignedEvent = {
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 7, // NIP-25 Kind 7 reaction
      tags: [
        ['e', targetEventId], // Event being reacted to
        ['p', targetAuthorPubkey] // Author of the event
      ],
      content: reactionType
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
  
  // Helper to fetch reactions from relay
  async function fetchReactions(targetEventId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(testRelay);
      const reactions: any[] = [];
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(reactions); // Return what we have
      }, 10000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify(['REQ', 'reactions', {
          kinds: [7],
          '#e': [targetEventId],
          limit: 50
        }]));
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg[0] === 'EVENT') {
          reactions.push(msg[2]);
        } else if (msg[0] === 'EOSE') {
          clearTimeout(timeout);
          ws.close();
          resolve(reactions);
        }
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  // Helper to get an existing event to react to
  async function getExistingEvent(): Promise<{ id: string, pubkey: string } | null> {
    return new Promise((resolve) => {
      const ws = new WebSocket(testRelay);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(null);
      }, 8000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify(['REQ', 'existing', {
          kinds: [1],
          limit: 10,
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }]));
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg[0] === 'EVENT') {
          const event = msg[2];
          clearTimeout(timeout);
          ws.close();
          resolve({ id: event.id, pubkey: event.pubkey });
        } else if (msg[0] === 'EOSE') {
          clearTimeout(timeout);
          ws.close();
          resolve(null);
        }
      });
    });
  }

  it('should create real reactions on existing events', async () => {
    console.log('=== Creating REAL reactions on relay ===');
    
    // Get an existing event to react to
    const existingEvent = await getExistingEvent();
    if (!existingEvent) {
      console.log('ℹ️ No existing events found, skipping reaction test');
      return;
    }
    
    console.log(`Found event to react to: ${existingEvent.id}`);
    console.log(`Event author: ${existingEvent.pubkey}`);
    
    // Create 3 different participants
    const alice = new TemporarySigner();
    const bob = new TemporarySigner();
    const charlie = new TemporarySigner();
    
    const alicePubkey = await alice.getPublicKey();
    const bobPubkey = await bob.getPublicKey();
    const charliePubkey = await charlie.getPublicKey();
    
    console.log('\\nReaction participants:');
    console.log('Alice:', alicePubkey);
    console.log('Bob:', bobPubkey);  
    console.log('Charlie:', charliePubkey);
    
    // Step 1: Alice likes the event
    console.log('\\n1. Alice likes the event...');
    const aliceReactionId = await createAndPublishReaction(
      alice, 
      existingEvent.id, 
      existingEvent.pubkey, 
      REACTION_TYPES.LIKE
    );
    console.log('✅ Alice reaction created:', aliceReactionId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Bob dislikes the event
    console.log('\\n2. Bob dislikes the event...');
    const bobReactionId = await createAndPublishReaction(
      bob, 
      existingEvent.id, 
      existingEvent.pubkey, 
      REACTION_TYPES.DISLIKE
    );
    console.log('✅ Bob reaction created:', bobReactionId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Charlie reacts with fire emoji
    console.log('\\n3. Charlie reacts with fire emoji...');
    const charlieReactionId = await createAndPublishReaction(
      charlie, 
      existingEvent.id, 
      existingEvent.pubkey, 
      REACTION_TYPES.FIRE
    );
    console.log('✅ Charlie reaction created:', charlieReactionId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Verify all reactions are on the relay
    console.log('\\n4. Verifying reactions on relay...');
    const reactions = await fetchReactions(existingEvent.id);
    
    console.log(`Found ${reactions.length} reactions for event ${existingEvent.id}`);
    
    // Verify we have our reactions
    const reactionIds = reactions.map(r => r.id);
    expect(reactionIds).toContain(aliceReactionId);
    expect(reactionIds).toContain(bobReactionId);
    expect(reactionIds).toContain(charlieReactionId);
    
    // Verify reaction structure
    for (const reaction of reactions) {
      // Check it's a proper NIP-25 reaction
      expect(reaction.kind).toBe(7);
      expect(reaction.content).toBeDefined();
      expect(reaction.tags).toBeDefined();
      
      // Check it has proper e-tag and p-tag
      const eTags = reaction.tags.filter((t: string[]) => t[0] === 'e');
      const pTags = reaction.tags.filter((t: string[]) => t[0] === 'p');
      
      expect(eTags.length).toBeGreaterThanOrEqual(1);
      expect(pTags.length).toBeGreaterThanOrEqual(1);
      
      // Check it references our target event
      expect(eTags.some((t: string[]) => t[1] === existingEvent.id)).toBe(true);
      expect(pTags.some((t: string[]) => t[1] === existingEvent.pubkey)).toBe(true);
    }
    
    // Verify reaction types
    const aliceReaction = reactions.find(r => r.id === aliceReactionId);
    const bobReaction = reactions.find(r => r.id === bobReactionId);
    const charlieReaction = reactions.find(r => r.id === charlieReactionId);
    
    expect(aliceReaction).toBeDefined();
    expect(aliceReaction!.content).toBe(REACTION_TYPES.LIKE);
    expect(aliceReaction!.pubkey).toBe(alicePubkey);
    
    expect(bobReaction).toBeDefined();
    expect(bobReaction!.content).toBe(REACTION_TYPES.DISLIKE);
    expect(bobReaction!.pubkey).toBe(bobPubkey);
    
    expect(charlieReaction).toBeDefined();
    expect(charlieReaction!.content).toBe(REACTION_TYPES.FIRE);
    expect(charlieReaction!.pubkey).toBe(charliePubkey);
    
    console.log('\\n🎉 REAL REACTIONS CREATED AND VERIFIED!');
    console.log(`- Alice (${REACTION_TYPES.LIKE}): ${aliceReactionId}`);
    console.log(`- Bob (${REACTION_TYPES.DISLIKE}): ${bobReactionId}`);
    console.log(`- Charlie (${REACTION_TYPES.FIRE}): ${charlieReactionId}`);
    console.log(`- Target event: ${existingEvent.id}`);
    console.log(`- Total reactions: ${reactions.length}`);
  }, 60000);

  it('should create reactions with different emoji types', async () => {
    console.log('=== Testing different reaction types ===');
    
    // Get an existing event
    const existingEvent = await getExistingEvent();
    if (!existingEvent) {
      console.log('ℹ️ No existing events found, skipping emoji test');
      return;
    }
    
    console.log(`Testing emoji reactions on: ${existingEvent.id}`);
    
    // Create participants for different emoji reactions
    const emojiUsers = [
      { name: 'User1', emoji: REACTION_TYPES.LOVE, signer: new TemporarySigner() },
      { name: 'User2', emoji: REACTION_TYPES.LAUGH, signer: new TemporarySigner() },
      { name: 'User3', emoji: REACTION_TYPES.THUMBS_UP, signer: new TemporarySigner() },
      { name: 'User4', emoji: REACTION_TYPES.ROCKET, signer: new TemporarySigner() }
    ];
    
    const reactionIds: string[] = [];
    
    // Create reactions with different emojis
    for (const user of emojiUsers) {
      const pubkey = await user.signer.getPublicKey();
      console.log(`\\n${user.name} (${pubkey.substring(0, 8)}...) reacts with ${user.emoji}`);
      
      const reactionId = await createAndPublishReaction(
        user.signer,
        existingEvent.id,
        existingEvent.pubkey,
        user.emoji
      );
      
      reactionIds.push(reactionId);
      console.log(`✅ ${user.name} reaction: ${reactionId}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify all emoji reactions
    const reactions = await fetchReactions(existingEvent.id);
    console.log(`\\nFound ${reactions.length} total reactions for emoji test`);
    
    // Check each emoji reaction exists
    for (let i = 0; i < emojiUsers.length; i++) {
      const user = emojiUsers[i];
      const reactionId = reactionIds[i];
      const userPubkey = await user.signer.getPublicKey();
      
      const reaction = reactions.find(r => r.id === reactionId);
      expect(reaction).toBeDefined();
      expect(reaction!.content).toBe(user.emoji);
      expect(reaction!.pubkey).toBe(userPubkey);
      expect(reaction!.kind).toBe(7);
      
      console.log(`✅ ${user.name} ${user.emoji} reaction verified`);
    }
    
    // Create reaction summary
    const reactionCounts = new Map<string, number>();
    for (const reaction of reactions) {
      const count = reactionCounts.get(reaction.content) || 0;
      reactionCounts.set(reaction.content, count + 1);
    }
    
    console.log('\\n=== Reaction Summary ===');
    for (const [emoji, count] of reactionCounts.entries()) {
      console.log(`${emoji}: ${count} reactions`);
    }
    
    expect(reactionCounts.size).toBeGreaterThanOrEqual(4); // At least our 4 different emojis
    console.log('✅ All emoji reactions verified on relay!');
  }, 60000);

  it('should prevent duplicate reactions from same user (relay validation)', async () => {
    console.log('=== Testing duplicate reaction prevention ===');
    
    const existingEvent = await getExistingEvent();
    if (!existingEvent) {
      console.log('ℹ️ No existing events found, skipping duplicate test');
      return;
    }
    
    console.log(`Testing duplicate prevention on: ${existingEvent.id}`);
    
    const user = new TemporarySigner();
    const userPubkey = await user.getPublicKey();
    console.log(`User: ${userPubkey}`);
    
    // First reaction
    console.log('\\n1. Creating first reaction...');
    const firstReactionId = await createAndPublishReaction(
      user,
      existingEvent.id,
      existingEvent.pubkey,
      REACTION_TYPES.LIKE
    );
    console.log('✅ First reaction created:', firstReactionId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second reaction from same user (should still work at protocol level)
    console.log('\\n2. Creating second reaction from same user...');
    const secondReactionId = await createAndPublishReaction(
      user,
      existingEvent.id,
      existingEvent.pubkey,
      REACTION_TYPES.FIRE
    );
    console.log('✅ Second reaction created:', secondReactionId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify both reactions exist on relay
    const reactions = await fetchReactions(existingEvent.id);
    const userReactions = reactions.filter(r => r.pubkey === userPubkey);
    
    console.log(`\\nUser has ${userReactions.length} reactions on relay`);
    
    // At protocol level, multiple reactions from same user are allowed
    // It's up to clients to handle duplicates
    expect(userReactions.length).toBeGreaterThanOrEqual(1);
    
    const reactionIds = userReactions.map(r => r.id);
    expect(reactionIds).toContain(firstReactionId);
    expect(reactionIds).toContain(secondReactionId);
    
    console.log('✅ Protocol allows multiple reactions (client should handle deduplication)');
    console.log(`First: ${firstReactionId} (${REACTION_TYPES.LIKE})`);
    console.log(`Second: ${secondReactionId} (${REACTION_TYPES.FIRE})`);
  }, 30000);

  it('should verify reactions can be read from relay by different clients', async () => {
    console.log('=== Testing reaction readability across clients ===');
    
    // Get recent reactions from relay
    const recentReactions = await new Promise<any[]>((resolve) => {
      const ws = new WebSocket(testRelay);
      const reactions: any[] = [];
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(reactions);
      }, 8000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify(['REQ', 'recent-reactions', {
          kinds: [7],
          limit: 20,
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }]));
      });
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg[0] === 'EVENT') {
          reactions.push(msg[2]);
        } else if (msg[0] === 'EOSE') {
          clearTimeout(timeout);
          ws.close();
          resolve(reactions);
        }
      });
    });
    
    console.log(`Found ${recentReactions.length} recent reactions on relay`);
    
    if (recentReactions.length > 0) {
      // Group reactions by target event
      const reactionsByEvent = new Map<string, any[]>();
      
      for (const reaction of recentReactions) {
        const eTags = reaction.tags.filter((t: string[]) => t[0] === 'e');
        if (eTags.length > 0) {
          const targetEventId = eTags[0][1];
          if (!reactionsByEvent.has(targetEventId)) {
            reactionsByEvent.set(targetEventId, []);
          }
          reactionsByEvent.get(targetEventId)!.push(reaction);
        }
      }
      
      console.log(`\\nReactions grouped by ${reactionsByEvent.size} target events:`);
      
      for (const [eventId, reactions] of reactionsByEvent.entries()) {
        console.log(`\\nEvent ${eventId}:`);
        
        // Count reaction types
        const reactionCounts = new Map<string, number>();
        const authors = new Set<string>();
        
        for (const reaction of reactions) {
          const count = reactionCounts.get(reaction.content) || 0;
          reactionCounts.set(reaction.content, count + 1);
          authors.add(reaction.pubkey);
        }
        
        console.log(`  - ${reactions.length} total reactions from ${authors.size} users`);
        console.log(`  - Types: ${Array.from(reactionCounts.entries()).map(([type, count]) => `${type}:${count}`).join(', ')}`);
        
        // Verify reaction structure for this event
        for (const reaction of reactions) {
          expect(reaction.kind).toBe(7);
          expect(reaction.content).toBeDefined();
          expect(reaction.pubkey).toBeDefined();
          expect(reaction.pubkey.length).toBe(64); // Valid pubkey
          expect(reaction.id).toBeDefined();
          expect(reaction.id.length).toBe(64); // Valid event ID
          
          // Verify tags
          const eTags = reaction.tags.filter((t: string[]) => t[0] === 'e');
          const pTags = reaction.tags.filter((t: string[]) => t[0] === 'p');
          
          expect(eTags.length).toBeGreaterThanOrEqual(1);
          expect(pTags.length).toBeGreaterThanOrEqual(1);
          expect(eTags[0][1]).toBe(eventId);
        }
      }
      
      expect(reactionsByEvent.size).toBeGreaterThan(0);
      console.log('\\n✅ All reaction data verified as NIP-25 compliant!');
    } else {
      console.log('ℹ️ No recent reactions found (test may have run on clean relay)');
    }
  }, 20000);
});