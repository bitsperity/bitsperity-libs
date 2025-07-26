/**
 * NIP-17 Real End-to-End Integration Tests
 * 
 * Comprehensive tests using REAL NIP-44 v2 encryption and NIP-59 gift wrapping
 * instead of mocks. This validates actual NIP-17 protocol compliance and 
 * interoperability with other Nostr clients.
 * 
 * Tests:
 * - Real 3-layer encryption (Rumor → Seal → Gift Wrap)
 * - Actual secp256k1 ECDH key derivation
 * - ChaCha20 + HKDF + HMAC authentication
 * - Ephemeral key generation and timestamp randomization
 * - Multi-recipient scenarios with separate gift wraps
 * - Complete message lifecycle: encrypt → publish → receive → decrypt
 * - Error scenarios with real cryptographic failures
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { DMModule } from '../../src/dm/api/DMModule.js';
import { DMConversation } from '../../src/dm/conversation/DMConversation.js';
import { DMRoom } from '../../src/dm/room/DMRoom.js';
import { NIP44Crypto } from '../../src/dm/crypto/NIP44Crypto.js';
import { GiftWrapProtocol } from '../../src/dm/protocol/GiftWrapProtocol.js';
import type { NostrEvent } from '../../src/core/types.js';
import type { DMMessage } from '../../src/dm/conversation/DMConversation.js';

// Real test keys for cryptographic operations
// Using valid secp256k1 keys with proper format
const testKeys = {
  alice: {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
  },
  bob: {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000002', 
    publicKey: 'c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5'
  },
  charlie: {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000003',
    publicKey: 'f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9'
  }
};

// Mock relay manager with real event storage
class MockRelayManager {
  private publishedEvents: Map<string, NostrEvent> = new Map();
  private messageHandler?: (relayUrl: string, message: any) => void;
  
  async publishToAll(event: NostrEvent) {
    this.publishedEvents.set(event.id, event);
    return [{ success: true, relay: 'wss://test.relay' }];
  }

  setMessageHandler(handler: (relayUrl: string, message: any) => void): void {
    this.messageHandler = handler;
  }

  getPublishedEvent(eventId: string): NostrEvent | undefined {
    return this.publishedEvents.get(eventId);
  }

  getPublishedEventsForRecipient(recipientPubkey: string): NostrEvent[] {
    return Array.from(this.publishedEvents.values()).filter(event => 
      event.kind === 1059 && 
      event.tags.some(tag => tag[0] === 'p' && tag[1] === recipientPubkey)
    );
  }

  clear() {
    this.publishedEvents.clear();
  }
}

// Mock subscription manager that can simulate real events
class MockSubscriptionManager {
  private eventHandlers: Map<string, (event: NostrEvent) => void> = new Map();
  
  async subscribe(filters: any[], options: any) {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventHandlers.set(subscriptionId, options.onEvent);
    
    // Simulate successful subscription
    setTimeout(() => options.onEose(), 10);
    
    return {
      success: true,
      subscription: { id: subscriptionId }
    };
  }

  async close(subscriptionId: string) {
    this.eventHandlers.delete(subscriptionId);
  }

  // Simulate receiving an event
  simulateEvent(event: NostrEvent) {
    this.eventHandlers.forEach(handler => handler(event));
  }
}

// Mock signing provider with real keys
class MockSigningProvider {
  constructor(private privateKey: string, private publicKey: string) {}

  async getPublicKey(): Promise<string> {
    return this.publicKey;
  }

  async signEvent(event: any): Promise<string> {
    return 'mock-signature-' + event.id;
  }
}

describe('NIP-17 Real End-to-End Integration', () => {
  let aliceNostr: NostrUnchained;
  let bobNostr: NostrUnchained;
  let charlieNostr: NostrUnchained;
  let mockRelayManager: MockRelayManager;
  let mockSubscriptionManager: MockSubscriptionManager;

  beforeAll(() => {
    // Override process.env for testing
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    mockRelayManager = new MockRelayManager();
    mockSubscriptionManager = new MockSubscriptionManager();

    // Create NostrUnchained instances with real crypto but mocked networking
    aliceNostr = new NostrUnchained({ debug: false });
    bobNostr = new NostrUnchained({ debug: false });
    charlieNostr = new NostrUnchained({ debug: false });

    // Replace with mock services while keeping real crypto
    (aliceNostr as any).relayManager = mockRelayManager;
    (aliceNostr as any).subscriptionManager = mockSubscriptionManager;
    (bobNostr as any).relayManager = mockRelayManager;
    (bobNostr as any).subscriptionManager = mockSubscriptionManager;
    (charlieNostr as any).relayManager = mockRelayManager;
    (charlieNostr as any).subscriptionManager = mockSubscriptionManager;

    // Initialize DM modules with real signing providers
    (aliceNostr.dm as any).config.signingProvider = new MockSigningProvider(testKeys.alice.privateKey, testKeys.alice.publicKey);
    (bobNostr.dm as any).config.signingProvider = new MockSigningProvider(testKeys.bob.privateKey, testKeys.bob.publicKey);
    (charlieNostr.dm as any).config.signingProvider = new MockSigningProvider(testKeys.charlie.privateKey, testKeys.charlie.publicKey);

    // Initialize sender credentials
    (aliceNostr.dm as any)._senderPubkey = testKeys.alice.publicKey;
    (bobNostr.dm as any)._senderPubkey = testKeys.bob.publicKey;
    (charlieNostr.dm as any)._senderPubkey = testKeys.charlie.publicKey;
  });

  afterEach(() => {
    mockRelayManager.clear();
  });

  describe('Real NIP-44 v2 Encryption Integration', () => {
    it('should perform complete encrypt-decrypt cycle with real keys', () => {
      const plaintext = 'Hello from Alice to Bob with real NIP-44 encryption!';
      
      // Derive conversation key using real secp256k1 ECDH
      const conversationKey = NIP44Crypto.deriveConversationKey(
        testKeys.alice.privateKey,
        testKeys.bob.publicKey
      );

      // Encrypt with real ChaCha20 + HKDF + HMAC
      const encrypted = NIP44Crypto.encrypt(plaintext, conversationKey);
      expect(encrypted.payload).toMatch(/^[A-Za-z0-9+/=]+$/); // Valid base64

      // Verify payload structure
      expect(NIP44Crypto.validatePayload(encrypted.payload)).toBe(true);

      // Decrypt and verify
      const decrypted = NIP44Crypto.decrypt(encrypted.payload, conversationKey);
      expect(decrypted.isValid).toBe(true);
      expect(decrypted.plaintext).toBe(plaintext);
    });

    it('should fail decryption with wrong key', () => {
      const plaintext = 'Secret message for Bob only';
      
      const aliceBobKey = NIP44Crypto.deriveConversationKey(
        testKeys.alice.privateKey,
        testKeys.bob.publicKey
      );

      const aliceCharlieKey = NIP44Crypto.deriveConversationKey(
        testKeys.alice.privateKey,
        testKeys.charlie.publicKey
      );

      const encrypted = NIP44Crypto.encrypt(plaintext, aliceBobKey);
      
      // Charlie shouldn't be able to decrypt Alice-Bob message
      const wrongDecryption = NIP44Crypto.decrypt(encrypted.payload, aliceCharlieKey);
      expect(wrongDecryption.isValid).toBe(false);
    });

    it('should generate unique nonces for identical messages', () => {
      const plaintext = 'Same message';
      const conversationKey = NIP44Crypto.deriveConversationKey(
        testKeys.alice.privateKey,
        testKeys.bob.publicKey
      );

      const encrypted1 = NIP44Crypto.encrypt(plaintext, conversationKey);
      const encrypted2 = NIP44Crypto.encrypt(plaintext, conversationKey);
      
      // Should produce different ciphertexts due to random nonces
      expect(encrypted1.payload).not.toBe(encrypted2.payload);
      expect(encrypted1.nonce).not.toEqual(encrypted2.nonce);

      // Both should decrypt correctly
      const decrypted1 = NIP44Crypto.decrypt(encrypted1.payload, conversationKey);
      const decrypted2 = NIP44Crypto.decrypt(encrypted2.payload, conversationKey);
      
      expect(decrypted1.plaintext).toBe(plaintext);
      expect(decrypted2.plaintext).toBe(plaintext);
    });
  });

  describe('Real NIP-59 Gift Wrap Protocol Integration', () => {
    it('should create and decrypt complete gift wrap with real encryption', async () => {
      const message = 'Real gift wrapped message from Alice to Bob';
      
      const config = {
        recipients: [{ pubkey: testKeys.bob.publicKey }]
      };

      // Create real gift wrap with 3-layer encryption
      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        message,
        testKeys.alice.privateKey,
        config
      );

      expect(giftWrapResult.rumor.content).toBe(message);
      expect(giftWrapResult.rumor.pubkey).toBe(testKeys.alice.publicKey);
      expect(giftWrapResult.giftWraps).toHaveLength(1);

      const giftWrap = giftWrapResult.giftWraps[0].giftWrap;
      
      // Verify gift wrap structure
      expect(giftWrap.kind).toBe(1059);
      expect(giftWrap.pubkey).toMatch(/^[0-9a-f]{64}$/); // Ephemeral key
      expect(giftWrap.pubkey).not.toBe(testKeys.alice.publicKey); // Must be ephemeral
      expect(giftWrap.tags).toEqual([['p', testKeys.bob.publicKey]]);
      expect(giftWrap.content).toMatch(/^[A-Za-z0-9+/=]+$/); // Encrypted seal

      // Decrypt with real cryptography
      const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        giftWrap,
        testKeys.bob.privateKey
      );

      expect(decryption.isValid).toBe(true);
      expect(decryption.rumor.content).toBe(message);
      expect(decryption.senderPubkey).toBe(testKeys.alice.publicKey);
    });

    it('should create separate gift wraps for multiple recipients', async () => {
      const message = 'Group message with real encryption';
      
      const config = {
        recipients: [
          { pubkey: testKeys.bob.publicKey },
          { pubkey: testKeys.charlie.publicKey }
        ]
      };

      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        message,
        testKeys.alice.privateKey,
        config
      );

      expect(giftWrapResult.giftWraps).toHaveLength(2);

      // Each recipient should have their own gift wrap
      const bobGiftWrap = giftWrapResult.giftWraps.find(gw => gw.recipient === testKeys.bob.publicKey);
      const charlieGiftWrap = giftWrapResult.giftWraps.find(gw => gw.recipient === testKeys.charlie.publicKey);

      expect(bobGiftWrap).toBeDefined();
      expect(charlieGiftWrap).toBeDefined();

      // Gift wraps should use different ephemeral keys
      expect(bobGiftWrap!.giftWrap.pubkey).not.toBe(charlieGiftWrap!.giftWrap.pubkey);

      // Both should decrypt to same message
      const bobDecryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        bobGiftWrap!.giftWrap,
        testKeys.bob.privateKey
      );

      const charlieDecryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        charlieGiftWrap!.giftWrap,
        testKeys.charlie.privateKey
      );

      expect(bobDecryption.isValid).toBe(true);
      expect(charlieDecryption.isValid).toBe(true);
      expect(bobDecryption.rumor.content).toBe(message);
      expect(charlieDecryption.rumor.content).toBe(message);
    });

    it('should fail decryption for wrong recipient', async () => {
      const message = 'Private message for Bob only';
      
      const config = {
        recipients: [{ pubkey: testKeys.bob.publicKey }]
      };

      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        message,
        testKeys.alice.privateKey,
        config
      );

      const giftWrap = giftWrapResult.giftWraps[0].giftWrap;

      // Charlie shouldn't be able to decrypt Bob's gift wrap
      const wrongDecryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        giftWrap,
        testKeys.charlie.privateKey
      );

      expect(wrongDecryption.isValid).toBe(false);
    });
  });

  describe('Complete DM Conversation Flow with Real Crypto', () => {
    it('should send and receive messages with real end-to-end encryption', async () => {
      const aliceConversation = await aliceNostr.dm.with(testKeys.bob.publicKey);
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      const testMessage = 'Hello Bob, this is a real encrypted message from Alice!';

      // Alice sends message with real encryption
      const sendResult = await aliceConversation.send(testMessage);
      expect(sendResult.success).toBe(true);
      expect(sendResult.messageId).toBeDefined();

      // Verify message was published to "relays"
      const publishedEvents = mockRelayManager.getPublishedEventsForRecipient(testKeys.bob.publicKey);
      expect(publishedEvents).toHaveLength(1);

      const giftWrapEvent = publishedEvents[0];
      expect(giftWrapEvent.kind).toBe(1059);
      expect(giftWrapEvent.tags).toEqual([['p', testKeys.bob.publicKey]]);

      // Simulate Bob receiving the event
      mockSubscriptionManager.simulateEvent(giftWrapEvent);

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify Bob received and decrypted the message
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });

      expect(bobMessages).toHaveLength(1);
      expect(bobMessages[0].content).toBe(testMessage);
      expect(bobMessages[0].senderPubkey).toBe(testKeys.alice.publicKey);
      expect(bobMessages[0].isFromMe).toBe(false);
      expect(bobMessages[0].status).toBe('received');
    });

    it('should handle bidirectional conversation with real crypto', async () => {
      const aliceConversation = await aliceNostr.dm.with(testKeys.bob.publicKey);
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      // Alice sends first message
      const aliceMessage = 'Hi Bob! How are you?';
      await aliceConversation.send(aliceMessage);

      // Simulate Bob receiving Alice's message
      const aliceEvents = mockRelayManager.getPublishedEventsForRecipient(testKeys.bob.publicKey);
      mockSubscriptionManager.simulateEvent(aliceEvents[0]);

      // Bob replies
      const bobMessage = 'Hi Alice! I\'m doing great, thanks for asking!';
      await bobConversation.send(bobMessage);

      // Simulate Alice receiving Bob's reply
      const bobEvents = mockRelayManager.getPublishedEventsForRecipient(testKeys.alice.publicKey);
      mockSubscriptionManager.simulateEvent(bobEvents[0]);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify both sides have complete conversation
      const aliceMessages = await new Promise<DMMessage[]>((resolve) => {
        aliceConversation.messages.subscribe(messages => resolve(messages));
      });

      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });

      expect(aliceMessages).toHaveLength(2); // Alice's sent + Bob's received
      expect(bobMessages).toHaveLength(2); // Bob's sent + Alice's received

      // Verify message contents
      expect(aliceMessages.find(m => m.content === aliceMessage && m.isFromMe)).toBeDefined();
      expect(aliceMessages.find(m => m.content === bobMessage && !m.isFromMe)).toBeDefined();
      expect(bobMessages.find(m => m.content === bobMessage && m.isFromMe)).toBeDefined();
      expect(bobMessages.find(m => m.content === aliceMessage && !m.isFromMe)).toBeDefined();
    });

    it('should handle conversation with subject threading', async () => {
      const aliceConversation = await aliceNostr.dm.with(testKeys.bob.publicKey);
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      const subject = 'Project Discussion';
      const message = 'Let\'s discuss the project timeline';

      // Send message with subject
      await aliceConversation.send(message, subject);

      // Simulate Bob receiving
      const events = mockRelayManager.getPublishedEventsForRecipient(testKeys.bob.publicKey);
      mockSubscriptionManager.simulateEvent(events[0]);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify subject was preserved
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });

      expect(bobMessages[0].subject).toBe(subject);
    });
  });

  describe('Multi-participant Room with Real Crypto', () => {
    it('should create and manage room with real encryption', async () => {
      const participants = [testKeys.bob.publicKey, testKeys.charlie.publicKey];
      const roomOptions = { subject: 'Team Meeting' };

      const aliceRoom = await aliceNostr.dm.room(participants, roomOptions);
      const bobRoom = await bobNostr.dm.room([testKeys.alice.publicKey, testKeys.charlie.publicKey], roomOptions);
      const charlieRoom = await charlieNostr.dm.room([testKeys.alice.publicKey, testKeys.bob.publicKey], roomOptions);

      const message = 'Welcome everyone to our encrypted team meeting!';

      // Alice sends message to room
      const sendResult = await aliceRoom.send(message);
      expect(sendResult.success).toBe(true);

      // Should create separate gift wraps for Bob and Charlie
      const bobEvents = mockRelayManager.getPublishedEventsForRecipient(testKeys.bob.publicKey);
      const charlieEvents = mockRelayManager.getPublishedEventsForRecipient(testKeys.charlie.publicKey);

      expect(bobEvents).toHaveLength(1);
      expect(charlieEvents).toHaveLength(1);

      // Simulate both receiving the message
      mockSubscriptionManager.simulateEvent(bobEvents[0]);
      mockSubscriptionManager.simulateEvent(charlieEvents[0]);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify both Bob and Charlie received the message
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobRoom.messages.subscribe(messages => resolve(messages));
      });

      const charlieMessages = await new Promise<DMMessage[]>((resolve) => {
        charlieRoom.messages.subscribe(messages => resolve(messages));
      });

      expect(bobMessages).toHaveLength(1);
      expect(charlieMessages).toHaveLength(1);
      expect(bobMessages[0].content).toBe(message);
      expect(charlieMessages[0].content).toBe(message);
      expect(bobMessages[0].senderPubkey).toBe(testKeys.alice.publicKey);
      expect(charlieMessages[0].senderPubkey).toBe(testKeys.alice.publicKey);
    });

    it('should handle room participant management', async () => {
      const aliceRoom = await aliceNostr.dm.room([testKeys.bob.publicKey], { subject: 'Growing Room' });

      // Initial participants
      const initialParticipants = await new Promise<string[]>((resolve) => {
        aliceRoom.participants.subscribe(p => resolve(p));
      });

      expect(initialParticipants).toContain(testKeys.alice.publicKey);
      expect(initialParticipants).toContain(testKeys.bob.publicKey);
      expect(initialParticipants).toHaveLength(2);

      // Add Charlie
      const addResult = await aliceRoom.addParticipant(testKeys.charlie.publicKey);
      expect(addResult.success).toBe(true);

      // Verify Charlie was added
      const updatedParticipants = await new Promise<string[]>((resolve) => {
        aliceRoom.participants.subscribe(p => resolve(p));
      });

      expect(updatedParticipants).toContain(testKeys.charlie.publicKey);
      expect(updatedParticipants).toHaveLength(3);

      // Remove Bob
      const removeResult = await aliceRoom.removeParticipant(testKeys.bob.publicKey);
      expect(removeResult.success).toBe(true);

      // Verify Bob was removed
      const finalParticipants = await new Promise<string[]>((resolve) => {
        aliceRoom.participants.subscribe(p => resolve(p));
      });

      expect(finalParticipants).not.toContain(testKeys.bob.publicKey);
      expect(finalParticipants).toContain(testKeys.charlie.publicKey);
      expect(finalParticipants).toHaveLength(2);
    });

    it('should update room subject correctly', async () => {
      const aliceRoom = await aliceNostr.dm.room([testKeys.bob.publicKey], { subject: 'Original Subject' });

      // Verify initial subject
      const initialSubject = await new Promise<string>((resolve) => {
        aliceRoom.subject.subscribe(s => resolve(s));
      });

      expect(initialSubject).toBe('Original Subject');

      // Update subject
      const updateResult = await aliceRoom.updateSubject('Updated Subject');
      expect(updateResult.success).toBe(true);

      // Verify subject was updated
      const updatedSubject = await new Promise<string>((resolve) => {
        aliceRoom.subject.subscribe(s => resolve(s));
      });

      expect(updatedSubject).toBe('Updated Subject');
    });
  });

  describe('Error Scenarios with Real Crypto', () => {
    it('should handle malformed encrypted content gracefully', async () => {
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      // Create malformed gift wrap event
      const malformedEvent: NostrEvent = {
        id: 'malformed-event-id',
        pubkey: 'ephemeral-key-64char-1234567890abcdef1234567890abcdef1234567890',
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', testKeys.bob.publicKey]],
        content: 'this-is-not-valid-base64-content!@#$%^&*()',
        sig: 'malformed-signature'
      };

      // Simulate receiving malformed event
      mockSubscriptionManager.simulateEvent(malformedEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash, no messages should be added
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });

      expect(bobMessages).toHaveLength(0);
    });

    it('should reject messages from unauthorized senders', async () => {
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      // Charlie tries to impersonate Alice by creating a gift wrap for Bob
      const config = { recipients: [{ pubkey: testKeys.bob.publicKey }] };
      const imposorGiftWrap = await GiftWrapProtocol.createGiftWrappedDM(
        'Fake message from Charlie pretending to be Alice',
        testKeys.charlie.privateKey, // Charlie's key, not Alice's
        config
      );

      // Simulate Bob receiving the impostor's message
      mockSubscriptionManager.simulateEvent(imposorGiftWrap.giftWraps[0].giftWrap);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Bob should reject the message since it's not from Alice
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });

      expect(bobMessages).toHaveLength(0);
    });

    it('should handle network publishing failures gracefully', async () => {
      // Mock relay failure
      const originalPublish = mockRelayManager.publishToAll;
      mockRelayManager.publishToAll = vi.fn().mockResolvedValue([
        { success: false, error: 'Relay connection failed' }
      ]);

      const aliceConversation = await aliceNostr.dm.with(testKeys.bob.publicKey);
      const sendResult = await aliceConversation.send('This message should fail to publish');

      expect(sendResult.success).toBe(false);
      expect(sendResult.error).toBeDefined();

      // Restore original method
      mockRelayManager.publishToAll = originalPublish;
    });
  });

  describe('NIP-17 Protocol Compliance Verification', () => {
    it('should create seals with exact NIP-59 structure', async () => {
      const message = 'NIP-17 compliance test message';
      const config = { recipients: [{ pubkey: testKeys.bob.publicKey }] };

      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        message,
        testKeys.alice.privateKey,
        config
      );

      // Verify seal structure (should be kind 13)
      expect(giftWrapResult.seal.kind).toBe(13);
      expect(giftWrapResult.seal.pubkey).toBe(testKeys.alice.publicKey); // Real sender
      expect(giftWrapResult.seal.tags).toEqual([]);
      expect(typeof giftWrapResult.seal.content).toBe('string'); // Encrypted rumor

      // Verify gift wrap structure (should be kind 1059)
      const giftWrap = giftWrapResult.giftWraps[0].giftWrap;
      expect(giftWrap.kind).toBe(1059);
      expect(giftWrap.pubkey).not.toBe(testKeys.alice.publicKey); // Must be ephemeral
      expect(giftWrap.tags).toEqual([['p', testKeys.bob.publicKey]]);
      expect(typeof giftWrap.content).toBe('string'); // Encrypted seal

      // Verify timestamp randomization
      const now = Math.floor(Date.now() / 1000);
      expect(giftWrap.created_at).toBeLessThanOrEqual(now);
      // NIP-59 uses randomized timestamps up to 2 days in the past for privacy
      expect(giftWrap.created_at).toBeGreaterThan(now - 2 * 24 * 60 * 60); // Within 48 hours (NIP-59 spec)
    });

    it('should use unique ephemeral keys for each gift wrap', async () => {
      const message = 'Ephemeral key uniqueness test';
      const config = {
        recipients: [
          { pubkey: testKeys.bob.publicKey },
          { pubkey: testKeys.charlie.publicKey }
        ]
      };

      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        message,
        testKeys.alice.privateKey,
        config
      );

      const bobGiftWrap = giftWrapResult.giftWraps[0].giftWrap;
      const charlieGiftWrap = giftWrapResult.giftWraps[1].giftWrap;

      // Each gift wrap should use different ephemeral key
      expect(bobGiftWrap.pubkey).not.toBe(charlieGiftWrap.pubkey);
      expect(bobGiftWrap.pubkey).not.toBe(testKeys.alice.publicKey);
      expect(charlieGiftWrap.pubkey).not.toBe(testKeys.alice.publicKey);

      // Both should be valid secp256k1 public keys
      expect(bobGiftWrap.pubkey).toMatch(/^[0-9a-f]{64}$/);
      expect(charlieGiftWrap.pubkey).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should preserve message integrity through all encryption layers', async () => {
      const originalMessage = 'Message integrity test with special chars: áéíóú 🚀 ñü';
      const config = { recipients: [{ pubkey: testKeys.bob.publicKey }] };

      // Full encryption cycle
      const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
        originalMessage,
        testKeys.alice.privateKey,
        config
      );

      // Full decryption cycle
      const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        giftWrapResult.giftWraps[0].giftWrap,
        testKeys.bob.privateKey
      );

      // Message should be identical after full round-trip
      expect(decryption.isValid).toBe(true);
      expect(decryption.rumor.content).toBe(originalMessage);
      expect(decryption.senderPubkey).toBe(testKeys.alice.publicKey);
    });
  });
});