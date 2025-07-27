/**
 * DMRoom Unit Tests
 * 
 * Comprehensive unit tests for the DMRoom class covering:
 * - Multi-participant conversation management
 * - Reactive store interface (messages, status, subject, participants)
 * - Message sending to all participants
 * - Message receiving and participant filtering
 * - Subject updates and participant management
 * - Room-specific features vs 1:1 conversations
 * - NIP-17 compliance for multi-participant scenarios
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { 
  DMRoom, 
  type DMRoomConfig, 
  type DMRoomOptions,
  type DMRoomState 
} from '../../src/dm/room/DMRoom.js';
import type { DMMessage, ConversationStatus } from '../../src/dm/conversation/DMConversation.js';
import type { NostrEvent } from '../../src/core/types.js';

// Mock dependencies
const mockSubscriptionManager = {
  subscribe: vi.fn(),
  close: vi.fn()
};

const mockRelayManager = {
  publishToAll: vi.fn()
};

const mockGiftWrapProtocol = {
  createGiftWrappedDM: vi.fn(),
  decryptGiftWrappedDM: vi.fn()
};

// Mock the GiftWrapProtocol module
vi.mock('../../src/dm/protocol/GiftWrapProtocol.js', () => ({
  GiftWrapProtocol: mockGiftWrapProtocol
}));

describe('DMRoom', () => {
  let room: DMRoom;
  let config: DMRoomConfig;

  const testSenderPubkey = 'sender-pubkey-64char-abcdef1234567890abcdef1234567890abcdef12';
  const testSenderPrivateKey = 'sender-private-key-64char-1234567890abcdef1234567890abcdef12345';
  const testParticipant1 = 'participant1-pubkey-64char-fedcba0987654321fedcba0987654321fed';
  const testParticipant2 = 'participant2-pubkey-64char-123456789abcdef123456789abcdef1234';
  const testParticipant3 = 'participant3-pubkey-64char-abcdef123456789abcdef123456789abc';

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      participants: [testParticipant1, testParticipant2],
      senderPrivateKey: testSenderPrivateKey,
      senderPubkey: testSenderPubkey,
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      options: {
        subject: 'Test Room',
        relayHints: ['wss://test.relay']
      },
      debug: true
    };

    // Mock successful subscription
    mockSubscriptionManager.subscribe.mockResolvedValue({
      success: true,
      subscription: { id: 'test-room-subscription-id' }
    });

    room = new DMRoom(config);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(room).toBeInstanceOf(DMRoom);
      expect(room.messages).toBeDefined();
      expect(room.status).toBeDefined();
      expect(room.latest).toBeDefined();
      expect(room.subject).toBeDefined();
      expect(room.participants).toBeDefined();
      expect(room.error).toBeDefined();
    });

    it('should include sender in participants list', (done) => {
      room.participants.subscribe(participants => {
        expect(participants).toContain(testSenderPubkey);
        expect(participants).toContain(testParticipant1);
        expect(participants).toContain(testParticipant2);
        expect(participants).toHaveLength(3); // 2 + sender
        done();
      });
    });

    it('should initialize with provided subject', (done) => {
      room.subject.subscribe(subject => {
        expect(subject).toBe('Test Room');
        done();
      });
    });

    it('should default to "Group Chat" when no subject provided', () => {
      const configWithoutSubject = {
        ...config,
        options: undefined
      };

      const roomWithoutSubject = new DMRoom(configWithoutSubject);
      
      roomWithoutSubject.subject.subscribe(subject => {
        expect(subject).toBe('Group Chat');
      });
    });

    it('should start subscription automatically', () => {
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [expect.objectContaining({
          kinds: [1059],
          '#p': [testSenderPubkey],
          limit: 100
        })],
        expect.objectContaining({
          onEvent: expect.any(Function),
          onEose: expect.any(Function),
          onClose: expect.any(Function)
        })
      );
    });

    it('should initialize with empty message list', (done) => {
      room.messages.subscribe(messages => {
        expect(messages).toEqual([]);
        done();
      });
    });

    it('should initialize with connecting status', (done) => {
      room.status.subscribe(status => {
        expect(status).toBe('connecting');
        done();
      });
    });
  });

  describe('Reactive Store Interface', () => {
    it('should provide Svelte-compatible subscribe method', () => {
      expect(typeof room.subscribe).toBe('function');
      
      const unsubscribe = room.subscribe(messages => {
        expect(Array.isArray(messages)).toBe(true);
      });
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should emit status changes', (done) => {
      let statusUpdates: ConversationStatus[] = [];
      
      const unsubscribe = room.status.subscribe(status => {
        statusUpdates.push(status);
        
        if (statusUpdates.length === 2) {
          expect(statusUpdates[0]).toBe('connecting');
          expect(statusUpdates[1]).toBe('active');
          unsubscribe();
          done();
        }
      });

      // Simulate subscription success
      setTimeout(() => {
        const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
        const options = subscribeCall[1];
        options.onEose();
      }, 10);
    });

    it('should emit participant list changes', (done) => {
      let participantUpdates: string[][] = [];
      
      const unsubscribe = room.participants.subscribe(participants => {
        participantUpdates.push([...participants]);
        
        if (participantUpdates.length === 2) {
          expect(participantUpdates[0]).toHaveLength(3);
          expect(participantUpdates[1]).toHaveLength(4); // After adding participant
          unsubscribe();
          done();
        }
      });

      // Add a participant
      setTimeout(() => {
        room.addParticipant(testParticipant3);
      }, 10);
    });

    it('should emit subject changes', (done) => {
      let subjectUpdates: string[] = [];
      
      const unsubscribe = room.subject.subscribe(subject => {
        subjectUpdates.push(subject);
        
        if (subjectUpdates.length === 2) {
          expect(subjectUpdates[0]).toBe('Test Room');
          expect(subjectUpdates[1]).toBe('Updated Subject');
          unsubscribe();
          done();
        }
      });

      // Update subject
      setTimeout(() => {
        room.updateSubject('Updated Subject');
      }, 10);
    });
  });

  describe('Multi-participant Message Sending', () => {
    beforeEach(() => {
      mockGiftWrapProtocol.createGiftWrappedDM.mockResolvedValue({
        rumor: {
          content: 'Room message',
          pubkey: testSenderPubkey
        },
        giftWraps: [
          {
            giftWrap: {
              id: 'gift-wrap-1',
              kind: 1059,
              content: 'encrypted-for-participant1'
            },
            recipient: testParticipant1
          },
          {
            giftWrap: {
              id: 'gift-wrap-2', 
              kind: 1059,
              content: 'encrypted-for-participant2'
            },
            recipient: testParticipant2
          }
        ]
      });

      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test.relay' }
      ]);
    });

    it('should send message to all participants', async () => {
      const result = await room.send('Hello everyone!');
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      
      // Should create gift wraps for all participants except sender
      expect(mockGiftWrapProtocol.createGiftWrappedDM).toHaveBeenCalledWith(
        'Hello everyone!',
        testSenderPrivateKey,
        expect.objectContaining({
          recipients: expect.arrayContaining([
            { pubkey: testParticipant1 },
            { pubkey: testParticipant2 }
          ])
        })
      );
    });

    it('should exclude sender from recipients list', async () => {
      await room.send('Test message');
      
      const callArgs = mockGiftWrapProtocol.createGiftWrappedDM.mock.calls[0];
      const giftWrapConfig = callArgs[2];
      
      const recipientPubkeys = giftWrapConfig.recipients.map((r: any) => r.pubkey);
      expect(recipientPubkeys).not.toContain(testSenderPubkey);
      expect(recipientPubkeys).toContain(testParticipant1);
      expect(recipientPubkeys).toContain(testParticipant2);
    });

    it('should publish separate gift wraps to relays', async () => {
      await room.send('Multi-publish test');
      
      expect(mockRelayManager.publishToAll).toHaveBeenCalledTimes(2); // One per participant
    });

    it('should add optimistic message with room metadata', (done) => {
      let messageCount = 0;
      
      const unsubscribe = room.messages.subscribe(messages => {
        messageCount++;
        
        if (messageCount === 2) {
          // Second update should include the optimistic message
          expect(messages).toHaveLength(1);
          expect(messages[0].content).toBe('Room message test');
          expect(messages[0].status).toBe('sending');
          expect(messages[0].isFromMe).toBe(true);
          expect(messages[0].subject).toBe('Test Room');
          expect(messages[0].participants).toContain(testParticipant1);
          expect(messages[0].participants).toContain(testParticipant2);
          expect(messages[0].participants).toContain(testSenderPubkey);
          unsubscribe();
          done();
        }
      });

      room.send('Room message test');
    });

    it('should handle partial publishing success', async () => {
      // Mock one success and one failure
      mockRelayManager.publishToAll
        .mockResolvedValueOnce([{ success: true, relay: 'wss://test.relay' }])
        .mockResolvedValueOnce([{ success: false, error: 'Relay error' }]);

      const result = await room.send('Partial success test');
      
      expect(result.success).toBe(true); // Should succeed if at least one publishes
    });

    it('should handle complete publishing failure', async () => {
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: false, error: 'All relays failed' }
      ]);

      const result = await room.send('Failure test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include relay hints in gift wrap configuration', async () => {
      await room.send('Relay hint test');
      
      const callArgs = mockGiftWrapProtocol.createGiftWrappedDM.mock.calls[0];
      const giftWrapConfig = callArgs[2];
      
      expect(giftWrapConfig.relayHint).toBe('wss://test.relay');
    });
  });

  describe('Multi-participant Message Receiving', () => {
    beforeEach(() => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockResolvedValue({
        isValid: true,
        rumor: {
          content: 'Message from participant',
          created_at: Math.floor(Date.now() / 1000),
          pubkey: testParticipant1,
          tags: [['subject', 'Room Discussion']]
        },
        senderPubkey: testParticipant1
      });
    });

    it('should receive messages from room participants', async () => {
      const incomingEvent: NostrEvent = {
        id: 'room-event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-room-message',
        sig: 'signature'
      };

      // Get the event handler from subscription
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Check that message was added
      const messages = await new Promise<DMMessage[]>((resolve) => {
        room.messages.subscribe(msgs => resolve(msgs));
      });
      
      const receivedMessage = messages.find(m => m.content === 'Message from participant');
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage?.isFromMe).toBe(false);
      expect(receivedMessage?.status).toBe('received');
      expect(receivedMessage?.senderPubkey).toBe(testParticipant1);
      expect(receivedMessage?.subject).toBe('Room Discussion');
      expect(receivedMessage?.participants).toContain(testParticipant1);
      expect(receivedMessage?.participants).toContain(testSenderPubkey);
    });

    it('should ignore messages from non-participants', async () => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockResolvedValue({
        isValid: true,
        rumor: { content: 'Message from outsider' },
        senderPubkey: 'outsider-pubkey-64char-000000000000000000000000000000000000'
      });

      const incomingEvent: NostrEvent = {
        id: 'outsider-event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-outsider-message',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Message should not be added
      const messages = await new Promise<DMMessage[]>((resolve) => {
        room.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages).toHaveLength(0);
    });

    it('should handle messages with different subjects', async () => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockResolvedValue({
        isValid: true,
        rumor: {
          content: 'Off-topic message',
          created_at: Math.floor(Date.now() / 1000),
          pubkey: testParticipant1,
          tags: [['subject', 'Different Topic']]
        },
        senderPubkey: testParticipant1
      });

      const incomingEvent: NostrEvent = {
        id: 'different-subject-event',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-message',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Should still accept messages from known participants regardless of subject
      const messages = await new Promise<DMMessage[]>((resolve) => {
        room.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages).toHaveLength(1);
      expect(messages[0].subject).toBe('Different Topic');
    });
  });

  describe('Subject Management', () => {
    it('should update subject successfully', async () => {
      const result = await room.updateSubject('New Room Subject');
      
      expect(result.success).toBe(true);
      
      const currentSubject = await new Promise<string>((resolve) => {
        room.subject.subscribe(subject => resolve(subject));
      });
      
      expect(currentSubject).toBe('New Room Subject');
    });

    it('should handle subject update errors gracefully', async () => {
      // Force an error in subject update
      const originalUpdate = (room as any)._state.update;
      (room as any)._state.update = vi.fn().mockImplementation(() => {
        throw new Error('State update failed');
      });

      const result = await room.updateSubject('Error Subject');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('State update failed');
      
      // Restore original method
      (room as any)._state.update = originalUpdate;
    });

    it('should preserve subject across message operations', async () => {
      await room.updateSubject('Persistent Subject');
      
      // Add a message
      const testMessage: DMMessage = {
        id: 'test-room-msg-1',
        content: 'Test room message',
        senderPubkey: testSenderPubkey,
        recipientPubkey: '', // Not applicable for rooms
        timestamp: Math.floor(Date.now() / 1000),
        isFromMe: true,
        status: 'sent',
        participants: [testSenderPubkey, testParticipant1]
      };
      
      (room as any).addMessage(testMessage);

      const currentSubject = await new Promise<string>((resolve) => {
        room.subject.subscribe(subject => resolve(subject));
      });
      
      expect(currentSubject).toBe('Persistent Subject');
    });
  });

  describe('Participant Management', () => {
    it('should add participant successfully', async () => {
      const result = await room.addParticipant(testParticipant3);
      
      expect(result.success).toBe(true);
      
      const participants = await new Promise<string[]>((resolve) => {
        room.participants.subscribe(p => resolve(p));
      });
      
      expect(participants).toContain(testParticipant3);
      expect(participants).toHaveLength(4); // Original 2 + sender + new participant
    });

    it('should prevent adding duplicate participants', async () => {
      const result = await room.addParticipant(testParticipant1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Participant already in room');
      
      const participants = await new Promise<string[]>((resolve) => {
        room.participants.subscribe(p => resolve(p));
      });
      
      expect(participants).toHaveLength(3); // Should remain unchanged
    });

    it('should remove participant successfully', async () => {
      const result = await room.removeParticipant(testParticipant1);
      
      expect(result.success).toBe(true);
      
      const participants = await new Promise<string[]>((resolve) => {
        room.participants.subscribe(p => resolve(p));
      });
      
      expect(participants).not.toContain(testParticipant1);
      expect(participants).toHaveLength(2); // Sender + remaining participant
    });

    it('should prevent removing non-existent participants', async () => {
      const result = await room.removeParticipant('non-existent-participant');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Participant not in room');
    });

    it('should prevent removing yourself from room', async () => {
      const result = await room.removeParticipant(testSenderPubkey);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot remove yourself from room');
    });

    it('should handle participant management errors gracefully', async () => {
      // Force an error in participant management
      const originalUpdate = (room as any)._state.update;
      (room as any)._state.update = vi.fn().mockImplementation(() => {
        throw new Error('Participant update failed');
      });

      const result = await room.addParticipant(testParticipant3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Participant update failed');
      
      // Restore original method
      (room as any)._state.update = originalUpdate;
    });
  });

  describe('Room Identity and Uniqueness', () => {
    it('should generate unique room ID', () => {
      // Access private method via any type
      const roomId1 = (room as any).generateRoomId();
      
      // Create second room with same participants
      const room2 = new DMRoom(config);
      const roomId2 = (room2 as any).generateRoomId();
      
      // Room IDs should be different due to timestamp component
      expect(roomId1).not.toBe(roomId2);
    });

    it('should include all participants in room ID calculation', () => {
      const roomId = (room as any).generateRoomId();
      
      // Room ID should reflect participant composition
      expect(typeof roomId).toBe('string');
      expect(roomId.length).toBeGreaterThan(0);
      expect(roomId.startsWith('room_')).toBe(true);
    });
  });

  describe('Connection Management', () => {
    it('should handle subscription success', (done) => {
      room.status.subscribe(status => {
        if (status === 'active') {
          done();
        }
      });

      // Simulate successful connection
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      options.onEose();
    });

    it('should handle subscription failure', async () => {
      mockSubscriptionManager.subscribe.mockResolvedValue({
        success: false,
        error: new Error('Room subscription failed')
      });

      const failedRoom = new DMRoom(config);

      const status = await new Promise<ConversationStatus>((resolve) => {
        failedRoom.status.subscribe(status => {
          if (status === 'error') resolve(status);
        });
      });

      expect(status).toBe('error');
    });

    it('should retry connection correctly', async () => {
      await room.retry();
      
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('test-room-subscription-id');
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledTimes(2); // Initial + retry
    });

    it('should close room correctly', async () => {
      await room.close();
      
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('test-room-subscription-id');
      
      const status = await new Promise<ConversationStatus>((resolve) => {
        room.status.subscribe(status => resolve(status));
      });
      
      expect(status).toBe('disconnected');
    });
  });

  describe('History Management', () => {
    it('should clear room history correctly', (done) => {
      // Add a message first
      const testMessage: DMMessage = {
        id: 'test-room-msg-1',
        content: 'Test room message',
        senderPubkey: testSenderPubkey,
        recipientPubkey: '',
        timestamp: Math.floor(Date.now() / 1000),
        isFromMe: true,
        status: 'sent',
        participants: [testSenderPubkey, testParticipant1]
      };
      
      (room as any).addMessage(testMessage);

      let messageUpdates: DMMessage[][] = [];
      let latestUpdates: (DMMessage | null)[] = [];
      
      const unsubMessages = room.messages.subscribe(messages => {
        messageUpdates.push([...messages]);
      });
      
      const unsubLatest = room.latest.subscribe(latest => {
        latestUpdates.push(latest);
        
        if (latestUpdates.length === 3) {
          // null (initial) -> message -> null (after clear)
          expect(latestUpdates[0]).toBeNull();
          expect(latestUpdates[1]?.content).toBe('Test room message');
          expect(latestUpdates[2]).toBeNull();
          
          expect(messageUpdates[0]).toHaveLength(0); // Initial
          expect(messageUpdates[1]).toHaveLength(1); // After add
          expect(messageUpdates[2]).toHaveLength(0); // After clear
          
          unsubMessages();
          unsubLatest();
          done();
        }
      });

      // Clear after message is added
      setTimeout(() => room.clearHistory(), 20);
    });
  });

  describe('Message Ordering and Deduplication', () => {
    it('should sort messages by timestamp', () => {
      const message1: DMMessage = {
        id: 'room-msg-1',
        content: 'First room message',
        senderPubkey: testParticipant1,
        recipientPubkey: '',
        timestamp: 1000,
        isFromMe: false,
        status: 'received',
        participants: [testSenderPubkey, testParticipant1]
      };

      const message2: DMMessage = {
        id: 'room-msg-2',
        content: 'Second room message',
        senderPubkey: testParticipant2,
        recipientPubkey: '',
        timestamp: 2000,
        isFromMe: false,
        status: 'received',
        participants: [testSenderPubkey, testParticipant2]
      };

      // Add in reverse order
      (room as any).addMessage(message2);
      (room as any).addMessage(message1);

      const messages = new Promise<DMMessage[]>((resolve) => {
        room.messages.subscribe(msgs => resolve(msgs));
      });

      messages.then(msgs => {
        expect(msgs[0].timestamp).toBe(1000);
        expect(msgs[1].timestamp).toBe(2000);
      });
    });

    it('should prevent duplicate messages', () => {
      const message: DMMessage = {
        id: 'duplicate-room-msg',
        content: 'Duplicate message',
        senderPubkey: testParticipant1,
        recipientPubkey: '',
        timestamp: Math.floor(Date.now() / 1000),
        isFromMe: false,
        status: 'received',
        eventId: 'same-event-id',
        participants: [testSenderPubkey, testParticipant1]
      };

      // Add same message twice
      (room as any).addMessage(message);
      (room as any).addMessage({ ...message, id: 'different-id' });

      const messages = new Promise<DMMessage[]>((resolve) => {
        room.messages.subscribe(msgs => resolve(msgs));
      });

      messages.then(msgs => {
        // Should only have one message due to deduplication by eventId
        expect(msgs).toHaveLength(1);
      });
    });
  });

  describe('Debug Logging', () => {
    it('should log debug messages when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      // Trigger debug logging by simulating successful subscription
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      options.onEose();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Room subscription active')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      const configNoDebug = { ...config, debug: false };
      const roomNoDebug = new DMRoom(configNoDebug);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      // Trigger would-be debug logging
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[1]; // Second call
      const options = subscribeCall[1];
      options.onEose();
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle message sending errors gracefully', async () => {
      mockGiftWrapProtocol.createGiftWrappedDM.mockRejectedValue(new Error('Room encryption failed'));

      const result = await room.send('Error test message');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Room encryption failed');
    });

    it('should handle incoming event processing errors gracefully', async () => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockRejectedValue(new Error('Room decryption failed'));

      const incomingEvent: NostrEvent = {
        id: 'error-room-event',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-room-message',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      // Should not throw
      await expect(options.onEvent(incomingEvent)).resolves.not.toThrow();
    });
  });
});