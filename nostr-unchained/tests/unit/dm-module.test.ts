/**
 * REAL DMModule Tests - NO MOCKS
 * 
 * Comprehensive tests for DMModule with authentic implementations:
 * - Real NostrUnchained integration with live relay
 * - Real TemporarySigner crypto for all participants
 * - Real conversation and room management
 * - Real reactive conversation list updates
 * - Real signing provider integration and updates
 * - Real global inbox subscription handling
 * - Real bidirectional validation between DMModule APIs
 * - Real error handling with authentic edge cases
 * - Real cleanup operations with live subscriptions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import type { DMMessage, ConversationStatus } from '../../src/dm/conversation/DMConversation.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 15000;

// Helper to wait for conditions
async function waitForCondition<T>(
  checkFn: () => T | Promise<T>,
  timeoutMs: number = 10000,
  intervalMs: number = 100
): Promise<T> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await checkFn();
      if (result) {
        return result;
      }
    } catch (error) {
      // Continue trying
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

describe('REAL DMModule - NO MOCKS', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;
  let charlie: NostrUnchained;
  let aliceSigner: TemporarySigner;
  let bobSigner: TemporarySigner;
  let charlieSigner: TemporarySigner;
  let alicePublicKey: string;
  let bobPublicKey: string;
  let charliePublicKey: string;

  beforeEach(async () => {
    // Create real participants with authentic crypto
    aliceSigner = new TemporarySigner();
    bobSigner = new TemporarySigner();
    charlieSigner = new TemporarySigner();
    
    alicePublicKey = await aliceSigner.getPublicKey();
    bobPublicKey = await bobSigner.getPublicKey();
    charliePublicKey = await charlieSigner.getPublicKey();

    console.log(`🔑 Alice: ${alicePublicKey.substring(0, 16)}...`);
    console.log(`🔑 Bob: ${bobPublicKey.substring(0, 16)}...`);
    console.log(`🔑 Charlie: ${charliePublicKey.substring(0, 16)}...`);

    alice = new NostrUnchained({
      relays: [LIVE_RELAY_URL],
      debug: true,
      signingProvider: aliceSigner
    });

    bob = new NostrUnchained({
      relays: [LIVE_RELAY_URL], 
      debug: true,
      signingProvider: bobSigner
    });

    charlie = new NostrUnchained({
      relays: [LIVE_RELAY_URL],
      debug: true,
      signingProvider: charlieSigner
    });

    // Real relay connections and signing initialization
    await Promise.all([
      alice.connect(),
      bob.connect(),
      charlie.connect()
    ]);

    await Promise.all([
      alice.initializeSigning(),
      bob.initializeSigning(),
      charlie.initializeSigning()
    ]);

    await Promise.all([
      alice.dm.updateSigningProvider(aliceSigner),
      bob.dm.updateSigningProvider(bobSigner),
      charlie.dm.updateSigningProvider(charlieSigner)
    ]);

    console.log('✅ All participants connected to live relay');
  }, TEST_TIMEOUT);

  afterEach(async () => {
    try {
      await Promise.all([
        alice?.disconnect(),
        bob?.disconnect(),
        charlie?.disconnect()
      ]);
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Real DMModule Integration and Initialization', () => {
    it('should integrate DMModule correctly within NostrUnchained', () => {
      expect(alice.dm).toBeDefined();
      expect(typeof alice.dm.with).toBe('function');
      expect(typeof alice.dm.room).toBe('function');
      expect(typeof alice.dm.getConversations).toBe('function');
      expect(typeof alice.dm.updateSigningProvider).toBe('function');
      
      console.log('✅ Real DMModule integration verified');
    });

    it('should initialize with real signing provider and relay connections', async () => {
      // DMModule should have access to real components
      expect((alice.dm as any).config.signingProvider).toBe(aliceSigner);
      expect((alice.dm as any).config.relayManager).toBeDefined();
      expect((alice.dm as any).config.subscriptionManager).toBeDefined();
      
      // Should be able to get public key
      const pubkey = await (alice.dm as any).config.signingProvider.getPublicKey();
      expect(pubkey).toBe(alicePublicKey);
      
      console.log('✅ Real DMModule initialization verified');
    });

    it('should handle conversations$ reactive store correctly', () => {
      expect(alice.dm.conversations$).toBeDefined();
      expect(typeof alice.dm.conversations$.subscribe).toBe('function');
      
      let conversations: any[] = [];
      const unsub = alice.dm.conversations$.subscribe(convs => { conversations = convs; });
      
      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBe(0); // Initially empty
      
      unsub();
      
      console.log('✅ Real conversations$ reactive store verified');
    });
  });

  describe('Real Conversation Management', () => {
    it('should create real 1:1 conversations with live crypto', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      expect(conversation).toBeDefined();
      expect(typeof conversation.send).toBe('function');
      expect(conversation.messages).toBeDefined();
      expect(conversation.status).toBeDefined();
      
      // Wait for active connection
      await waitForCondition(() => {
        let status: ConversationStatus = 'connecting';
        const unsub = conversation.status.subscribe(s => { status = s; });
        unsub();
        return status === 'active';
      }, TEST_TIMEOUT);
      
      console.log('✅ Real 1:1 conversation creation verified');
    }, TEST_TIMEOUT);

    it('should return same conversation instance for same pubkey', async () => {
      const conversation1 = await alice.dm.with(bobPublicKey);
      const conversation2 = await alice.dm.with(bobPublicKey);
      
      expect(conversation1).toBe(conversation2);
      
      console.log('✅ Conversation instance reuse verified');
    }, TEST_TIMEOUT);

    it('should create different conversations for different pubkeys', async () => {
      const bobConversation = await alice.dm.with(bobPublicKey);
      const charlieConversation = await alice.dm.with(charliePublicKey);
      
      expect(bobConversation).not.toBe(charlieConversation);
      
      console.log('✅ Multiple conversation management verified');
    }, TEST_TIMEOUT);

    it('should normalize pubkeys correctly in real scenarios', async () => {
      const lowerPubkey = bobPublicKey.toLowerCase();
      const upperPubkey = bobPublicKey.toUpperCase();
      
      const conversation1 = await alice.dm.with(lowerPubkey);
      const conversation2 = await alice.dm.with(upperPubkey);
      
      expect(conversation1).toBe(conversation2);
      
      console.log('✅ Real pubkey normalization verified');
    }, TEST_TIMEOUT);

    it('should validate pubkey format with real validation', async () => {
      await expect(alice.dm.with('invalid-pubkey')).rejects.toThrow('Invalid pubkey format');
      await expect(alice.dm.with('')).rejects.toThrow('Invalid pubkey format');
      await expect(alice.dm.with('short')).rejects.toThrow('Invalid pubkey format');
      
      console.log('✅ Real pubkey validation verified');
    }, TEST_TIMEOUT);

    it('should handle npub format with helpful error', async () => {
      await expect(alice.dm.with('npub1234567890abcdef')).rejects.toThrow('npub format not yet supported');
      
      console.log('✅ Real npub format handling verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Room Management', () => {
    it('should create real multi-participant rooms with live crypto', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const room = await alice.dm.room(participants, { subject: 'Real Test Room' });
      
      expect(room).toBeDefined();
      expect(typeof room.send).toBe('function');
      expect(room.messages).toBeDefined();
      expect(room.participants).toBeDefined();
      expect(room.subject).toBeDefined();
      
      // Verify room-specific methods
      expect(typeof room.addParticipant).toBe('function');
      expect(typeof room.removeParticipant).toBe('function');
      expect(typeof room.updateSubject).toBe('function');
      
      console.log('✅ Real multi-participant room creation verified');
    }, TEST_TIMEOUT);

    it('should return same room instance for same participants', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      
      const room1 = await alice.dm.room(participants, { subject: 'Room 1' });
      const room2 = await alice.dm.room(participants, { subject: 'Room 2' });
      
      expect(room1).toBe(room2);
      
      console.log('✅ Room instance reuse verified');
    }, TEST_TIMEOUT);

    it('should handle participant order independence in real scenarios', async () => {
      const room1 = await alice.dm.room([bobPublicKey, charliePublicKey], { subject: 'Test' });
      const room2 = await alice.dm.room([charliePublicKey, bobPublicKey], { subject: 'Test' });
      
      expect(room1).toBe(room2);
      
      console.log('✅ Real participant order independence verified');
    }, TEST_TIMEOUT);

    it('should normalize participant pubkeys in rooms', async () => {
      const lowerParticipants = [bobPublicKey.toLowerCase(), charliePublicKey.toLowerCase()];
      const upperParticipants = [bobPublicKey.toUpperCase(), charliePublicKey.toUpperCase()];
      
      const room1 = await alice.dm.room(lowerParticipants, { subject: 'Test' });
      const room2 = await alice.dm.room(upperParticipants, { subject: 'Test' });
      
      expect(room1).toBe(room2);
      
      console.log('✅ Real room participant normalization verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Conversation List Management', () => {
    it('should start with empty conversation list', () => {
      const conversations = alice.dm.getConversations();
      expect(conversations).toEqual([]);
      
      console.log('✅ Empty initial conversation list verified');
    });

    it('should include real conversations in list', async () => {
      await alice.dm.with(bobPublicKey);
      
      const conversations = alice.dm.getConversations();
      expect(conversations).toHaveLength(1);
      expect(conversations[0].type).toBe('conversation');
      expect(conversations[0].pubkey).toBe(bobPublicKey);
      
      console.log('✅ Real conversation list inclusion verified');
    }, TEST_TIMEOUT);

    it('should include real rooms in conversation list', async () => {
      await alice.dm.room([bobPublicKey], { subject: 'Test Room' });
      
      const conversations = alice.dm.getConversations();
      const roomSummary = conversations.find(s => s.type === 'room');
      
      expect(roomSummary).toBeDefined();
      expect(roomSummary?.subject).toBe('Test Room');
      expect(roomSummary?.participants).toContain(bobPublicKey);
      expect(roomSummary?.participants).toContain(alicePublicKey); // Room creator included
      
      console.log('✅ Real room list inclusion verified');
    }, TEST_TIMEOUT);

    it('should provide reactive conversation list updates', async () => {
      let updateCount = 0;
      let latestConversations: any[] = [];
      
      const unsub = alice.dm.conversations$.subscribe(conversations => {
        updateCount++;
        latestConversations = conversations;
      });
      
      // Initial state should be empty
      expect(latestConversations).toHaveLength(0);
      
      // Add conversation and verify update
      await alice.dm.with(bobPublicKey);
      
      // Wait for reactive update
      await waitForCondition(() => latestConversations.length > 0, 5000);
      
      expect(latestConversations).toHaveLength(1);
      expect(latestConversations[0].type).toBe('conversation');
      expect(updateCount).toBeGreaterThan(1); // At least initial + update
      
      unsub();
      
      console.log(`✅ Real reactive list updates: ${updateCount} updates`);
    }, TEST_TIMEOUT);

    it('should sort conversations by last activity', async () => {
      // Create conversations (they will have different creation times)
      await alice.dm.with(bobPublicKey);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await alice.dm.with(charliePublicKey);
      
      const conversations = alice.dm.getConversations();
      expect(conversations).toHaveLength(2);
      
      // Most recent should be first (though they may have same timestamp in test)
      expect(conversations[0].lastActivity).toBeGreaterThanOrEqual(conversations[1].lastActivity);
      
      console.log('✅ Real conversation sorting verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Signing Provider Updates', () => {
    it('should update signing provider correctly in real scenarios', async () => {
      const newSigner = new TemporarySigner();
      const newPublicKey = await newSigner.getPublicKey();
      
      await alice.dm.updateSigningProvider(newSigner);
      
      // Verify signing provider was updated
      expect((alice.dm as any).config.signingProvider).toBe(newSigner);
      
      // Should be able to get new public key
      const currentPubkey = await (alice.dm as any).config.signingProvider.getPublicKey();
      expect(currentPubkey).toBe(newPublicKey);
      
      console.log(`✅ Real signing provider update: ${newPublicKey.substring(0, 16)}...`);
    }, TEST_TIMEOUT);

    it('should handle signing provider initialization errors gracefully', async () => {
      const faultySigner = {
        getPublicKey: async () => { throw new Error('Signing failed'); },
        signEvent: async () => { throw new Error('Signing failed'); }
      };

      // Should handle gracefully without throwing
      await expect(alice.dm.updateSigningProvider(faultySigner as any)).resolves.not.toThrow();
      
      console.log('✅ Real signing provider error handling verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Message Flow Integration', () => {
    it('should handle real conversation messaging through DMModule', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      let bobMessages: DMMessage[] = [];
      bobConversation.messages.subscribe(msgs => { bobMessages = msgs; });
      
      // Alice sends message through DMModule
      const testMessage = `DMModule message test ${Date.now()}`;
      const result = await aliceConversation.send(testMessage);
      
      expect(result.success).toBe(true);
      
      // Wait for Bob to receive through his DMModule
      await waitForCondition(
        () => bobMessages.some(msg => msg.content === testMessage),
        TEST_TIMEOUT
      );
      
      const receivedMessage = bobMessages.find(msg => msg.content === testMessage);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage!.senderPubkey).toBe(alicePublicKey);
      expect(receivedMessage!.isFromMe).toBe(false);
      
      console.log('✅ Real DMModule message flow verified');
    }, TEST_TIMEOUT);

    it('should handle real room messaging through DMModule', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const aliceRoom = await alice.dm.room(participants, { subject: 'DMModule Room Test' });
      const bobRoom = await bob.dm.room([alicePublicKey, charliePublicKey], { subject: 'DMModule Room Test' });
      
      let bobMessages: DMMessage[] = [];
      bobRoom.messages.subscribe(msgs => { bobMessages = msgs; });
      
      // Alice sends to room through DMModule
      const roomMessage = `DMModule room message ${Date.now()}`;
      const result = await aliceRoom.send(roomMessage);
      
      expect(result.success).toBe(true);
      
      // Wait for Bob to receive through his DMModule
      await waitForCondition(
        () => bobMessages.some(msg => msg.content === roomMessage),
        TEST_TIMEOUT
      );
      
      const receivedMessage = bobMessages.find(msg => msg.content === roomMessage);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage!.senderPubkey).toBe(alicePublicKey);
      
      console.log('✅ Real DMModule room message flow verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Error Handling', () => {
    it('should handle conversation creation with invalid pubkey', async () => {
      await expect(alice.dm.with('invalid-pubkey')).rejects.toThrow('Invalid pubkey format');
      
      console.log('✅ Real conversation error handling verified');
    }, TEST_TIMEOUT);

    it('should handle room creation with empty participants', async () => {
      // The implementation actually allows empty participants (creates a room with just the creator)
      const room = await alice.dm.room([], { subject: 'Empty Room' });
      
      expect(room).toBeDefined();
      expect(typeof room.send).toBe('function');
      
      // Room should include at least the creator
      let participants: string[] = [];
      const unsub = room.participants.subscribe(p => { participants = p; });
      expect(participants).toContain(alicePublicKey);
      unsub();
      
      console.log('✅ Real empty room creation verified (creator-only room)');
    }, TEST_TIMEOUT);

    it('should handle operations without signing provider gracefully', async () => {
      // Create DMModule-like instance without proper initialization
      const nostrWithoutSigning = new NostrUnchained({
        relays: [LIVE_RELAY_URL],
        debug: true
        // No signingProvider
      });
      
      await nostrWithoutSigning.connect();
      
      // Should fail gracefully
      await expect(nostrWithoutSigning.dm.with(bobPublicKey)).rejects.toThrow(/signing|key/i);
      
      await nostrWithoutSigning.disconnect();
      
      console.log('✅ Real missing signing provider handling verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Cleanup Operations', () => {
    it('should handle conversation disconnection properly', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Wait for active connection
      await waitForCondition(() => {
        let status: ConversationStatus = 'connecting';
        const unsub = conversation.status.subscribe(s => { status = s; });
        unsub();
        return status === 'active';
      }, TEST_TIMEOUT);
      
      // Close conversation
      await conversation.close();
      
      // Status should change to disconnected
      let finalStatus: ConversationStatus = 'active';
      const unsub = conversation.status.subscribe(s => { finalStatus = s; });
      unsub();
      
      expect(finalStatus).toBe('disconnected');
      
      console.log('✅ Real conversation cleanup verified');
    }, TEST_TIMEOUT);

    it('should handle room disconnection properly', async () => {
      const room = await alice.dm.room([bobPublicKey], { subject: 'Cleanup Test' });
      
      // Wait for active connection
      await waitForCondition(() => {
        let status: ConversationStatus = 'connecting';
        const unsub = room.status.subscribe(s => { status = s; });
        unsub();
        return status === 'active';
      }, TEST_TIMEOUT);
      
      // Close room
      await room.close();
      
      // Status should change to disconnected
      let finalStatus: ConversationStatus = 'active';
      const unsub = room.status.subscribe(s => { finalStatus = s; });
      unsub();
      
      expect(finalStatus).toBe('disconnected');
      
      console.log('✅ Real room cleanup verified');
    }, TEST_TIMEOUT);

    it('should handle cleanup errors gracefully in real scenarios', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Disconnect the main NostrUnchained instance first
      await alice.disconnect();
      
      // Cleanup should still work (may warn but not throw)
      await expect(conversation.close()).resolves.not.toThrow();
      
      console.log('✅ Real cleanup error handling verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Integration with NostrUnchained Core', () => {
    it('should share real components with NostrUnchained core', () => {
      // DMModule should use the same managers as the core
      expect((alice.dm as any).config.relayManager).toBe((alice as any).relayManager);
      expect((alice.dm as any).config.subscriptionManager).toBe((alice as any).subscriptionManager);
      expect((alice.dm as any).config.signingProvider).toBe(aliceSigner);
      
      console.log('✅ Real component sharing verified');
    });

    it('should maintain consistent state with NostrUnchained core', async () => {
      // Creating conversations should not interfere with core subscriptions
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Core should still have its subscriptions
      const coreSubscriptions = (alice as any).subscriptionManager.getActiveSubscriptions();
      expect(coreSubscriptions.length).toBeGreaterThan(0);
      
      // DM conversation should add additional subscriptions
      await waitForCondition(() => {
        let status: ConversationStatus = 'connecting';
        const unsub = conversation.status.subscribe(s => { status = s; });
        unsub();
        return status === 'active';
      }, TEST_TIMEOUT);
      
      const subscriptionsAfterDM = (alice as any).subscriptionManager.getActiveSubscriptions();
      expect(subscriptionsAfterDM.length).toBeGreaterThanOrEqual(coreSubscriptions.length);
      
      console.log(`✅ Real state consistency: ${subscriptionsAfterDM.length} total subscriptions`);
    }, TEST_TIMEOUT);
  });
});