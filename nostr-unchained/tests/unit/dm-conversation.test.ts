/**
 * DMConversation Unit Tests
 * 
 * Comprehensive unit tests for the DMConversation class covering:
 * - Reactive store interface (messages, status, latest, subject)
 * - Message sending and optimistic updates
 * - Message receiving and decryption handling
 * - Subscription management and error handling
 * - Subject management and NIP-17 compliance
 * - Connection state management and retry logic
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { 
  DMConversation, 
  type DMConversationConfig, 
  type DMMessage,
  type ConversationStatus 
} from '../../src/dm/conversation/DMConversation.js';
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
  createSimpleConfig: vi.fn(),
  createGiftWrappedDM: vi.fn(),
  decryptGiftWrappedDM: vi.fn()
};

// Mock the GiftWrapProtocol module
vi.mock('../../src/dm/protocol/GiftWrapProtocol.js', () => ({
  GiftWrapProtocol: mockGiftWrapProtocol
}));

describe('DMConversation', () => {
  let conversation: DMConversation;
  let config: DMConversationConfig;

  const testSenderPubkey = 'sender-pubkey-64char-abcdef1234567890abcdef1234567890abcdef12';
  const testRecipientPubkey = 'recipient-pubkey-64char-fedcba0987654321fedcba0987654321fedcba';
  const testSenderPrivateKey = 'sender-private-key-64char-1234567890abcdef1234567890abcdef12345';

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      recipientPubkey: testRecipientPubkey,
      senderPrivateKey: testSenderPrivateKey,
      senderPubkey: testSenderPubkey,
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      debug: true
    };

    // Mock successful subscription
    mockSubscriptionManager.subscribe.mockResolvedValue({
      success: true,
      subscription: { id: 'test-subscription-id' }
    });

    conversation = new DMConversation(config);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(conversation).toBeInstanceOf(DMConversation);
      expect(conversation.messages).toBeDefined();
      expect(conversation.status).toBeDefined();
      expect(conversation.latest).toBeDefined();
      expect(conversation.error).toBeDefined();
      expect(conversation.subject).toBeDefined();
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
      conversation.messages.subscribe(messages => {
        expect(messages).toEqual([]);
        done();
      });
    });

    it('should initialize with connecting status', (done) => {
      conversation.status.subscribe(status => {
        expect(status).toBe('connecting');
        done();
      });
    });

    it('should initialize with no latest message', (done) => {
      conversation.latest.subscribe(latest => {
        expect(latest).toBeNull();
        done();
      });
    });

    it('should initialize with no error', (done) => {
      conversation.error.subscribe(error => {
        expect(error).toBeNull();
        done();
      });
    });

    it('should initialize with optional subject', () => {
      const configWithSubject = {
        ...config,
        subject: 'Test Subject'
      };
      
      const conversationWithSubject = new DMConversation(configWithSubject);
      
      conversationWithSubject.subject.subscribe(subject => {
        expect(subject).toBe('Test Subject');
      });
    });
  });

  describe('Reactive Store Interface', () => {
    it('should provide Svelte-compatible subscribe method', () => {
      expect(typeof conversation.subscribe).toBe('function');
      
      const unsubscribe = conversation.subscribe(messages => {
        expect(Array.isArray(messages)).toBe(true);
      });
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should emit status changes', (done) => {
      let statusUpdates: ConversationStatus[] = [];
      
      const unsubscribe = conversation.status.subscribe(status => {
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

    it('should emit message list changes', (done) => {
      let messageUpdates: DMMessage[][] = [];
      
      const unsubscribe = conversation.messages.subscribe(messages => {
        messageUpdates.push([...messages]);
        
        if (messageUpdates.length === 2) {
          expect(messageUpdates[0]).toHaveLength(0);
          expect(messageUpdates[1]).toHaveLength(1);
          unsubscribe();
          done();
        }
      });

      // Add a message
      setTimeout(() => {
        const testMessage: DMMessage = {
          id: 'test-msg-1',
          content: 'Test message',
          senderPubkey: testSenderPubkey,
          recipientPubkey: testRecipientPubkey,
          timestamp: Math.floor(Date.now() / 1000),
          isFromMe: true,
          status: 'sent'
        };
        
        (conversation as any).addMessage(testMessage);
      }, 10);
    });

    it('should emit latest message changes', (done) => {
      let latestUpdates: (DMMessage | null)[] = [];
      
      const unsubscribe = conversation.latest.subscribe(latest => {
        latestUpdates.push(latest);
        
        if (latestUpdates.length === 2) {
          expect(latestUpdates[0]).toBeNull();
          expect(latestUpdates[1]?.content).toBe('Test message');
          unsubscribe();
          done();
        }
      });

      // Add a message
      setTimeout(() => {
        const testMessage: DMMessage = {
          id: 'test-msg-1',
          content: 'Test message',
          senderPubkey: testSenderPubkey,
          recipientPubkey: testRecipientPubkey,
          timestamp: Math.floor(Date.now() / 1000),
          isFromMe: true,
          status: 'sent'
        };
        
        (conversation as any).addMessage(testMessage);
      }, 10);
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      mockGiftWrapProtocol.createSimpleConfig.mockReturnValue({
        recipients: [{ pubkey: testRecipientPubkey }]
      });

      mockGiftWrapProtocol.createGiftWrappedDM.mockResolvedValue({
        rumor: {
          content: 'Test message',
          pubkey: testSenderPubkey
        },
        giftWraps: [{
          giftWrap: {
            id: 'gift-wrap-id',
            kind: 1059,
            content: 'encrypted-content'
          },
          recipient: testRecipientPubkey
        }]
      });

      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test.relay' }
      ]);
    });

    it('should send message successfully', async () => {
      const result = await conversation.send('Hello, World!');
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockGiftWrapProtocol.createGiftWrappedDM).toHaveBeenCalledWith(
        'Hello, World!',
        testSenderPrivateKey,
        expect.any(Object)
      );
      expect(mockRelayManager.publishToAll).toHaveBeenCalled();
    });

    it('should add optimistic message immediately', (done) => {
      let messageCount = 0;
      
      const unsubscribe = conversation.messages.subscribe(messages => {
        messageCount++;
        
        if (messageCount === 2) {
          // Second update should include the optimistic message
          expect(messages).toHaveLength(1);
          expect(messages[0].content).toBe('Test optimistic');
          expect(messages[0].status).toBe('sending');
          expect(messages[0].isFromMe).toBe(true);
          unsubscribe();
          done();
        }
      });

      conversation.send('Test optimistic');
    });

    it('should update message status after successful publish', async () => {
      const result = await conversation.send('Test status update');
      
      expect(result.success).toBe(true);
      
      // Check that message status was updated
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      const sentMessage = messages.find(m => m.id === result.messageId);
      expect(sentMessage?.status).toBe('sent');
    });

    it('should handle publishing failure', async () => {
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: false, error: 'Relay error' }
      ]);

      const result = await conversation.send('Failed message');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Message should be marked as failed
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      const failedMessage = messages.find(m => m.id === result.messageId);
      expect(failedMessage?.status).toBe('failed');
    });

    it('should handle gift wrap creation failure', async () => {
      mockGiftWrapProtocol.createGiftWrappedDM.mockRejectedValue(new Error('Encryption failed'));

      const result = await conversation.send('Encryption fail');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Encryption failed');
    });

    it('should include subject in messages when provided', async () => {
      await conversation.send('Message with subject', 'Important Topic');
      
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages[0].subject).toBe('Important Topic');
    });

    it('should use current conversation subject when no subject provided', async () => {
      conversation.updateSubject('Conversation Subject');
      await conversation.send('Message without explicit subject');
      
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages[0].subject).toBe('Conversation Subject');
    });
  });

  describe('Message Receiving', () => {
    beforeEach(() => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockResolvedValue({
        isValid: true,
        rumor: {
          content: 'Received message',
          created_at: Math.floor(Date.now() / 1000),
          pubkey: testRecipientPubkey,
          tags: [['subject', 'Test Subject']]
        },
        senderPubkey: testRecipientPubkey
      });
    });

    it('should handle incoming gift wrap events', async () => {
      // Simulate receiving an event
      const incomingEvent: NostrEvent = {
        id: 'event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-gift-wrap',
        sig: 'signature'
      };

      // Get the event handler from subscription
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Check that message was added
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      const receivedMessage = messages.find(m => m.content === 'Received message');
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage?.isFromMe).toBe(false);
      expect(receivedMessage?.status).toBe('received');
      expect(receivedMessage?.senderPubkey).toBe(testRecipientPubkey);
      expect(receivedMessage?.subject).toBe('Test Subject');
    });

    it('should ignore events from wrong senders', async () => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockResolvedValue({
        isValid: true,
        rumor: { content: 'Wrong sender message' },
        senderPubkey: 'wrong-sender-pubkey'
      });

      const incomingEvent: NostrEvent = {
        id: 'event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-gift-wrap',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Message should not be added
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages).toHaveLength(0);
    });

    it('should ignore invalid decryption results', async () => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockResolvedValue({
        isValid: false
      });

      const incomingEvent: NostrEvent = {
        id: 'event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-gift-wrap',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Message should not be added
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages).toHaveLength(0);
    });

    it('should ignore non-gift-wrap events', async () => {
      const incomingEvent: NostrEvent = {
        id: 'event-id',
        pubkey: testRecipientPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // Wrong kind
        tags: [],
        content: 'Regular message',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      await options.onEvent(incomingEvent);

      // Should not attempt decryption
      expect(mockGiftWrapProtocol.decryptGiftWrappedDM).not.toHaveBeenCalled();
    });

    it('should prevent duplicate messages', async () => {
      const incomingEvent: NostrEvent = {
        id: 'duplicate-event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-gift-wrap',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      // Process same event twice
      await options.onEvent(incomingEvent);
      await options.onEvent(incomingEvent);

      // Should only have one message
      const messages = await new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });
      
      expect(messages).toHaveLength(1);
    });

    it('should handle decryption errors gracefully', async () => {
      mockGiftWrapProtocol.decryptGiftWrappedDM.mockRejectedValue(new Error('Decryption failed'));

      const incomingEvent: NostrEvent = {
        id: 'error-event-id',
        pubkey: 'ephemeral-key',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testSenderPubkey]],
        content: 'encrypted-gift-wrap',
        sig: 'signature'
      };

      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      // Should not throw
      await expect(options.onEvent(incomingEvent)).resolves.not.toThrow();
    });
  });

  describe('Subject Management', () => {
    it('should update subject correctly', (done) => {
      let subjectUpdates: (string | undefined)[] = [];
      
      const unsubscribe = conversation.subject.subscribe(subject => {
        subjectUpdates.push(subject);
        
        if (subjectUpdates.length === 2) {
          expect(subjectUpdates[0]).toBeUndefined();
          expect(subjectUpdates[1]).toBe('New Subject');
          unsubscribe();
          done();
        }
      });

      conversation.updateSubject('New Subject');
    });

    it('should preserve subject across message operations', async () => {
      conversation.updateSubject('Persistent Subject');
      
      // Add a message
      const testMessage: DMMessage = {
        id: 'test-msg-1',
        content: 'Test message',
        senderPubkey: testSenderPubkey,
        recipientPubkey: testRecipientPubkey,
        timestamp: Math.floor(Date.now() / 1000),
        isFromMe: true,
        status: 'sent'
      };
      
      (conversation as any).addMessage(testMessage);

      const currentSubject = await new Promise<string | undefined>((resolve) => {
        conversation.subject.subscribe(subject => resolve(subject));
      });
      
      expect(currentSubject).toBe('Persistent Subject');
    });
  });

  describe('Connection Management', () => {
    it('should handle subscription success', (done) => {
      conversation.status.subscribe(status => {
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
        error: new Error('Subscription failed')
      });

      const failedConversation = new DMConversation(config);

      const status = await new Promise<ConversationStatus>((resolve) => {
        failedConversation.status.subscribe(status => {
          if (status === 'error') resolve(status);
        });
      });

      expect(status).toBe('error');
    });

    it('should handle subscription close', (done) => {
      let statusUpdates: ConversationStatus[] = [];
      
      conversation.status.subscribe(status => {
        statusUpdates.push(status);
        
        if (statusUpdates.length === 3) {
          expect(statusUpdates).toEqual(['connecting', 'active', 'disconnected']);
          done();
        }
      });

      // Simulate connection and then close
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[0];
      const options = subscribeCall[1];
      
      setTimeout(() => options.onEose(), 10);
      setTimeout(() => options.onClose('Connection lost'), 20);
    });

    it('should retry connection correctly', async () => {
      await conversation.retry();
      
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('test-subscription-id');
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledTimes(2); // Initial + retry
    });

    it('should close conversation correctly', async () => {
      await conversation.close();
      
      expect(mockSubscriptionManager.close).toHaveBeenCalledWith('test-subscription-id');
      
      const status = await new Promise<ConversationStatus>((resolve) => {
        conversation.status.subscribe(status => resolve(status));
      });
      
      expect(status).toBe('disconnected');
    });
  });

  describe('Message Ordering', () => {
    it('should sort messages by timestamp', () => {
      const message1: DMMessage = {
        id: 'msg-1',
        content: 'First message',
        senderPubkey: testSenderPubkey,
        recipientPubkey: testRecipientPubkey,
        timestamp: 1000,
        isFromMe: true,
        status: 'sent'
      };

      const message2: DMMessage = {
        id: 'msg-2',
        content: 'Second message',
        senderPubkey: testSenderPubkey,
        recipientPubkey: testRecipientPubkey,
        timestamp: 2000,
        isFromMe: true,
        status: 'sent'
      };

      // Add in reverse order
      (conversation as any).addMessage(message2);
      (conversation as any).addMessage(message1);

      const messages = new Promise<DMMessage[]>((resolve) => {
        conversation.messages.subscribe(msgs => resolve(msgs));
      });

      messages.then(msgs => {
        expect(msgs[0].timestamp).toBe(1000);
        expect(msgs[1].timestamp).toBe(2000);
      });
    });
  });

  describe('History Management', () => {
    it('should clear history correctly', (done) => {
      // Add a message first
      const testMessage: DMMessage = {
        id: 'test-msg-1',
        content: 'Test message',
        senderPubkey: testSenderPubkey,
        recipientPubkey: testRecipientPubkey,
        timestamp: Math.floor(Date.now() / 1000),
        isFromMe: true,
        status: 'sent'
      };
      
      (conversation as any).addMessage(testMessage);

      let messageUpdates: DMMessage[][] = [];
      let latestUpdates: (DMMessage | null)[] = [];
      
      const unsubMessages = conversation.messages.subscribe(messages => {
        messageUpdates.push([...messages]);
      });
      
      const unsubLatest = conversation.latest.subscribe(latest => {
        latestUpdates.push(latest);
        
        if (latestUpdates.length === 3) {
          // null (initial) -> message -> null (after clear)
          expect(latestUpdates[0]).toBeNull();
          expect(latestUpdates[1]?.content).toBe('Test message');
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
      setTimeout(() => conversation.clearHistory(), 20);
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
        expect.stringContaining('DM conversation subscription active')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      const configNoDebug = { ...config, debug: false };
      const conversationNoDebug = new DMConversation(configNoDebug);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      // Trigger would-be debug logging
      const subscribeCall = mockSubscriptionManager.subscribe.mock.calls[1]; // Second call
      const options = subscribeCall[1];
      options.onEose();
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});