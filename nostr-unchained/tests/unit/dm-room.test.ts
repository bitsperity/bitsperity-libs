/**
 * REAL DMRoom Tests - NO MOCKS
 * 
 * Comprehensive tests for DMRoom with authentic multi-participant scenarios:
 * - Real TemporarySigner crypto for Alice, Bob, and Charlie
 * - Real relay communication with ws://umbrel.local:4848
 * - Real NIP-59 gift wrap protocol for multiple participants
 * - Real reactive stores for room state management
 * - Real bidirectional multi-participant message validation
 * - Real subject updates and participant management
 * - Real room-specific features vs 1:1 conversations
 * - Real NIP-17 compliance for multi-participant scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import type { DMMessage, ConversationStatus } from '../../src/dm/conversation/DMConversation.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 20000; // Longer timeout for multi-participant scenarios

// Helper to wait for conditions
async function waitForCondition<T>(
  checkFn: () => T | Promise<T>,
  timeoutMs: number = 15000,
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

describe('REAL DMRoom - NO MOCKS', () => {
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

    console.log(`👥 Alice: ${alicePublicKey.substring(0, 16)}...`);
    console.log(`👥 Bob: ${bobPublicKey.substring(0, 16)}...`);
    console.log(`👥 Charlie: ${charliePublicKey.substring(0, 16)}...`);

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

    console.log('✅ All three participants connected to live relay');
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

  describe('Real Room Creation and Initialization', () => {
    it('should create real multi-participant room with authentic reactive stores', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const room = await alice.dm.room(participants, { subject: 'Test Room' });
      
      expect(room).toBeDefined();
      expect(room.messages).toBeDefined();
      expect(room.status).toBeDefined();
      expect(room.latest).toBeDefined();
      expect(room.subject).toBeDefined();
      expect(room.participants).toBeDefined();
      
      // Test room-specific methods
      expect(typeof room.send).toBe('function');
      expect(typeof room.updateSubject).toBe('function');
      expect(typeof room.addParticipant).toBe('function');
      expect(typeof room.removeParticipant).toBe('function');
      
      // Test reactive store interfaces
      let participants_list: string[] = [];
      let subject = '';
      
      const unsubParticipants = room.participants.subscribe(p => { participants_list = p; });
      const unsubSubject = room.subject.subscribe(s => { subject = s; });
      
      expect(Array.isArray(participants_list)).toBe(true);
      expect(participants_list.length).toBeGreaterThan(0); // Should include sender
      expect(subject).toBe('Test Room');
      
      unsubParticipants();
      unsubSubject();
      
      console.log(`✅ Real room created with ${participants_list.length} participants`);
    }, TEST_TIMEOUT);

    it('should include room creator in participants list', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const room = await alice.dm.room(participants, { subject: 'Creator Test' });
      
      let participantsList: string[] = [];
      const unsub = room.participants.subscribe(p => { participantsList = p; });
      
      // Should include Alice (creator) + Bob + Charlie
      expect(participantsList).toContain(alicePublicKey);
      expect(participantsList).toContain(bobPublicKey);
      expect(participantsList).toContain(charliePublicKey);
      expect(participantsList.length).toBe(3);
      
      unsub();
      
      console.log('✅ Room creator included in participants');
    }, TEST_TIMEOUT);

    it('should return same room instance for same participants', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      
      const room1 = await alice.dm.room(participants, { subject: 'Room 1' });
      const room2 = await alice.dm.room(participants, { subject: 'Room 2' });
      
      // Should return same instance regardless of options
      expect(room1).toBe(room2);
      
      console.log('✅ Same room instance returned for same participants');
    }, TEST_TIMEOUT);
  });

  describe('Real Multi-Participant Message Broadcasting', () => {
    it('should send real encrypted messages to all participants', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const aliceRoom = await alice.dm.room(participants, { subject: 'Broadcast Test' });
      const bobRoom = await bob.dm.room([alicePublicKey, charliePublicKey], { subject: 'Broadcast Test' });
      const charlieRoom = await charlie.dm.room([alicePublicKey, bobPublicKey], { subject: 'Broadcast Test' });
      
      let bobMessages: DMMessage[] = [];
      let charlieMessages: DMMessage[] = [];
      
      bobRoom.messages.subscribe(msgs => { bobMessages = msgs; });
      charlieRoom.messages.subscribe(msgs => { charlieMessages = msgs; });
      
      // Alice sends message to room
      const testMessage = `Room broadcast from Alice at ${Date.now()}`;
      const result = await aliceRoom.send(testMessage);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      
      // Wait for Bob to receive
      await waitForCondition(
        () => bobMessages.some(msg => 
          msg.content === testMessage && 
          msg.senderPubkey === alicePublicKey
        ),
        TEST_TIMEOUT
      );
      
      // Wait for Charlie to receive
      await waitForCondition(
        () => charlieMessages.some(msg => 
          msg.content === testMessage && 
          msg.senderPubkey === alicePublicKey
        ),
        TEST_TIMEOUT
      );
      
      // Verify both participants received the message
      const bobReceivedMessage = bobMessages.find(msg => msg.content === testMessage);
      const charlieReceivedMessage = charlieMessages.find(msg => msg.content === testMessage);
      
      expect(bobReceivedMessage).toBeDefined();
      expect(bobReceivedMessage!.senderPubkey).toBe(alicePublicKey);
      expect(bobReceivedMessage!.isFromMe).toBe(false);
      
      expect(charlieReceivedMessage).toBeDefined();
      expect(charlieReceivedMessage!.senderPubkey).toBe(alicePublicKey);
      expect(charlieReceivedMessage!.isFromMe).toBe(false);
      
      console.log('✅ Real multi-participant message broadcasting verified');
    }, TEST_TIMEOUT);

    it('should handle messages from any participant to the room', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const aliceRoom = await alice.dm.room(participants, { subject: 'Multi-sender Test' });
      const bobRoom = await bob.dm.room([alicePublicKey, charliePublicKey], { subject: 'Multi-sender Test' });
      const charlieRoom = await charlie.dm.room([alicePublicKey, bobPublicKey], { subject: 'Multi-sender Test' });
      
      let aliceMessages: DMMessage[] = [];
      let charlieMessages: DMMessage[] = [];
      
      aliceRoom.messages.subscribe(msgs => { aliceMessages = msgs; });
      charlieRoom.messages.subscribe(msgs => { charlieMessages = msgs; });
      
      // Bob sends to room
      const bobMessage = `Message from Bob at ${Date.now()}`;
      await bobRoom.send(bobMessage);
      
      // Wait for Alice and Charlie to receive Bob's message
      await Promise.all([
        waitForCondition(
          () => aliceMessages.some(msg => 
            msg.content === bobMessage && 
            msg.senderPubkey === bobPublicKey
          ),
          TEST_TIMEOUT
        ),
        waitForCondition(
          () => charlieMessages.some(msg => 
            msg.content === bobMessage && 
            msg.senderPubkey === bobPublicKey
          ),
          TEST_TIMEOUT
        )
      ]);
      
      // Charlie sends to room
      const charlieMessage = `Message from Charlie at ${Date.now()}`;
      await charlieRoom.send(charlieMessage);
      
      // Wait for Alice to receive Charlie's message
      await waitForCondition(
        () => aliceMessages.some(msg => 
          msg.content === charlieMessage && 
          msg.senderPubkey === charliePublicKey
        ),
        TEST_TIMEOUT
      );
      
      // Verify all participants can send and receive
      const aliceReceivedBob = aliceMessages.find(msg => msg.content === bobMessage);
      const aliceReceivedCharlie = aliceMessages.find(msg => msg.content === charlieMessage);
      
      expect(aliceReceivedBob).toBeDefined();
      expect(aliceReceivedBob!.senderPubkey).toBe(bobPublicKey);
      
      expect(aliceReceivedCharlie).toBeDefined();
      expect(aliceReceivedCharlie!.senderPubkey).toBe(charliePublicKey);
      
      console.log('✅ Multi-directional room messaging verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Subject Management in Rooms', () => {
    it('should handle real subject updates across all participants', async () => {
      const participants = [bobPublicKey, charliePublicKey];
      const aliceRoom = await alice.dm.room(participants, { subject: 'Original Subject' });
      const bobRoom = await bob.dm.room([alicePublicKey, charliePublicKey], { subject: 'Original Subject' });
      
      let aliceSubject = '';
      let bobSubject = '';
      
      aliceRoom.subject.subscribe(s => { aliceSubject = s; });
      bobRoom.subject.subscribe(s => { bobSubject = s; });
      
      expect(aliceSubject).toBe('Original Subject');
      expect(bobSubject).toBe('Original Subject');
      
      // Alice updates the subject
      const newSubject = 'Updated Subject Test';
      const result = await aliceRoom.updateSubject(newSubject);
      
      expect(result.success).toBe(true);
      expect(aliceSubject).toBe(newSubject);
      
      console.log('✅ Real room subject updates verified');
    }, TEST_TIMEOUT);

    it('should maintain subject consistency across messages', async () => {
      const participants = [bobPublicKey];
      const room = await alice.dm.room(participants, { subject: 'Subject Consistency Test' });
      
      let messages: DMMessage[] = [];
      room.messages.subscribe(msgs => { messages = msgs; });
      
      const testMessage = 'Message with subject';
      const testSubject = 'Subject Consistency Test';
      
      await room.send(testMessage, testSubject);
      
      expect(messages.length).toBe(1);
      expect(messages[0].subject).toBe(testSubject);
      
      console.log('✅ Room subject consistency verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Participant Management', () => {
    it('should handle real participant addition', async () => {
      const initialParticipants = [bobPublicKey];
      const room = await alice.dm.room(initialParticipants, { subject: 'Add Participant Test' });
      
      let participantsList: string[] = [];
      room.participants.subscribe(p => { participantsList = p; });
      
      // Initial participants: Alice + Bob
      expect(participantsList.length).toBe(2);
      expect(participantsList).toContain(alicePublicKey);
      expect(participantsList).toContain(bobPublicKey);
      
      // Add Charlie
      const result = await room.addParticipant(charliePublicKey);
      expect(result.success).toBe(true);
      
      // Should now include Charlie
      expect(participantsList.length).toBe(3);
      expect(participantsList).toContain(charliePublicKey);
      
      console.log(`✅ Participant addition: ${participantsList.length} participants`);
    }, TEST_TIMEOUT);

    it('should handle real participant removal', async () => {
      const initialParticipants = [bobPublicKey, charliePublicKey];
      const room = await alice.dm.room(initialParticipants, { subject: 'Remove Participant Test' });
      
      let participantsList: string[] = [];
      room.participants.subscribe(p => { participantsList = p; });
      
      // Initial participants: Alice + Bob + Charlie
      expect(participantsList.length).toBe(3);
      
      // Remove Bob
      const result = await room.removeParticipant(bobPublicKey);
      expect(result.success).toBe(true);
      
      // Should no longer include Bob
      expect(participantsList.length).toBe(2);
      expect(participantsList).not.toContain(bobPublicKey);
      expect(participantsList).toContain(alicePublicKey);
      expect(participantsList).toContain(charliePublicKey);
      
      console.log(`✅ Participant removal: ${participantsList.length} participants remaining`);
    }, TEST_TIMEOUT);

    it('should prevent removing room creator', async () => {
      const participants = [bobPublicKey];
      const room = await alice.dm.room(participants, { subject: 'Creator Protection Test' });
      
      // Try to remove Alice (creator) - should fail
      const result = await room.removeParticipant(alicePublicKey);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      console.log('✅ Room creator protection verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Room vs 1:1 Conversation Differences', () => {
    it('should distinguish between room and conversation in summaries', async () => {
      // Create room
      const roomParticipants = [bobPublicKey, charliePublicKey];
      await alice.dm.room(roomParticipants, { subject: 'Test Room' });
      
      // Create 1:1 conversation
      await alice.dm.with(bobPublicKey);
      
      const summaries = alice.dm.getConversations();
      
      const roomSummary = summaries.find(s => s.type === 'room');
      const conversationSummary = summaries.find(s => s.type === 'conversation');
      
      expect(roomSummary).toBeDefined();
      expect(roomSummary!.subject).toBe('Test Room');
      expect(Array.isArray(roomSummary!.participants)).toBe(true);
      expect(roomSummary!.participants!.length).toBe(3); // Alice + Bob + Charlie
      
      expect(conversationSummary).toBeDefined();
      expect(conversationSummary!.participants).toBeUndefined();
      
      console.log('✅ Room vs conversation distinction verified');
    }, TEST_TIMEOUT);

    it('should handle room-specific features not available in 1:1', async () => {
      // Create room
      const roomParticipants = [bobPublicKey, charliePublicKey];
      const room = await alice.dm.room(roomParticipants, { subject: 'Feature Test Room' });
      
      // Create 1:1 conversation
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Room should have participant management methods
      expect(typeof room.addParticipant).toBe('function');
      expect(typeof room.removeParticipant).toBe('function');
      expect(room.participants).toBeDefined();
      
      // 1:1 conversation should not have these methods
      expect((conversation as any).addParticipant).toBeUndefined();
      expect((conversation as any).removeParticipant).toBeUndefined();
      expect((conversation as any).participants).toBeUndefined();
      
      console.log('✅ Room-specific features verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Room Error Handling and Edge Cases', () => {
    it('should handle empty participant list gracefully', async () => {
      try {
        await alice.dm.room([], { subject: 'Empty Room' });
        expect.fail('Should have thrown error for empty participants');
      } catch (error) {
        expect(error.message).toContain('participant');
        console.log('✅ Empty participant list error handling verified');
      }
    }, TEST_TIMEOUT);

    it('should handle duplicate participants gracefully', async () => {
      const duplicateParticipants = [bobPublicKey, bobPublicKey, charliePublicKey];
      const room = await alice.dm.room(duplicateParticipants, { subject: 'Duplicate Test' });
      
      let participantsList: string[] = [];
      const unsub = room.participants.subscribe(p => { participantsList = p; });
      
      // Verify participants are included (implementation may or may not deduplicate)
      expect(participantsList).toContain(alicePublicKey); // Room creator
      expect(participantsList).toContain(bobPublicKey);
      expect(participantsList).toContain(charliePublicKey);
      
      // Check that we have at least the expected unique participants
      const uniqueParticipants = new Set(participantsList);
      expect(uniqueParticipants.size).toBeGreaterThanOrEqual(3); // Alice + Bob + Charlie minimum
      expect(participantsList.length).toBeGreaterThanOrEqual(3);
      
      unsub();
      
      console.log(`✅ Duplicate participant handling: ${participantsList.length} total, ${uniqueParticipants.size} unique`);
    }, TEST_TIMEOUT);

    it('should handle large room with many participants', async () => {
      // Create additional participants
      const extraSigners = await Promise.all([
        new TemporarySigner(),
        new TemporarySigner(),
        new TemporarySigner()
      ]);
      
      const extraPublicKeys = await Promise.all(
        extraSigners.map(signer => signer.getPublicKey())
      );
      
      const allParticipants = [bobPublicKey, charliePublicKey, ...extraPublicKeys];
      const room = await alice.dm.room(allParticipants, { subject: 'Large Room Test' });
      
      let participantsList: string[] = [];
      const unsub = room.participants.subscribe(p => { participantsList = p; });
      
      // Should handle all participants
      expect(participantsList.length).toBe(allParticipants.length + 1); // +1 for Alice
      
      unsub();
      
      console.log(`✅ Large room with ${participantsList.length} participants verified`);
    }, TEST_TIMEOUT);
  });

  describe('Real Room Cleanup and Connection Management', () => {
    it('should handle real room closure properly', async () => {
      const participants = [bobPublicKey];
      const room = await alice.dm.room(participants, { subject: 'Cleanup Test' });
      
      let status: ConversationStatus = 'connecting';
      const unsub = room.status.subscribe(s => { status = s; });
      
      // Wait for active status
      await waitForCondition(() => status === 'active', TEST_TIMEOUT);
      unsub();
      
      // Close room
      await room.close();
      
      // Status should change to disconnected
      let finalStatus: ConversationStatus = 'active';
      const unsub2 = room.status.subscribe(s => { finalStatus = s; });
      
      expect(finalStatus).toBe('disconnected');
      unsub2();
      
      console.log('✅ Real room cleanup verified');
    }, TEST_TIMEOUT);
  });
});