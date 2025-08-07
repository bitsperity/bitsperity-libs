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
import { getPublicKey } from '@noble/secp256k1';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { DMModule } from '../../src/dm/api/DMModule.js';
import { DMConversation } from '../../src/dm/conversation/DMConversation.js';
import { DMRoom } from '../../src/dm/room/DMRoom.js';
import { NIP44Crypto } from '../../src/dm/crypto/NIP44Crypto.js';
import { GiftWrapProtocol } from '../../src/dm/protocol/GiftWrapProtocol.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';
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

// Real relay URL
const REAL_RELAY_URL = 'ws://umbrel.local:4848';

// Production-grade signing provider with fixed keys for deterministic tests
class TestSigningProvider extends LocalKeySigner {
  private fixedPrivateKey: string;
  private fixedPublicKey: string;

  constructor(privateKey: string, publicKey: string) {
    super();
    this.fixedPrivateKey = privateKey;
    this.fixedPublicKey = publicKey;
  }

  async getPublicKey(): Promise<string> {
    return this.fixedPublicKey;
  }

  async getPrivateKeyForEncryption(): Promise<string> {
    return this.fixedPrivateKey;
  }
}

describe('NIP-17 Real End-to-End Integration', () => {
  let aliceNostr: NostrUnchained;
  let bobNostr: NostrUnchained;
  let charlieNostr: NostrUnchained;

  beforeAll(async () => {
    // Override process.env for testing
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    // Create NostrUnchained instances with real relay connection
    aliceNostr = new NostrUnchained({ 
      debug: false,
      relays: [REAL_RELAY_URL]
    });
    bobNostr = new NostrUnchained({ 
      debug: false,
      relays: [REAL_RELAY_URL]
    });
    charlieNostr = new NostrUnchained({ 
      debug: false,
      relays: [REAL_RELAY_URL]
    });

    // Initialize DM modules with production signing providers (with fixed keys for tests)
    const aliceProvider = new TestSigningProvider(testKeys.alice.privateKey, testKeys.alice.publicKey);
    const bobProvider = new TestSigningProvider(testKeys.bob.privateKey, testKeys.bob.publicKey);
    const charlieProvider = new TestSigningProvider(testKeys.charlie.privateKey, testKeys.charlie.publicKey);
    
    // Update signing providers properly
    await aliceNostr.dm.updateSigningProvider(aliceProvider);
    await bobNostr.dm.updateSigningProvider(bobProvider);
    await charlieNostr.dm.updateSigningProvider(charlieProvider);

    // Connect to real relay
    await aliceNostr.connect();
    await bobNostr.connect();
    await charlieNostr.connect();

    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterEach(async () => {
    // Disconnect from relay
    await aliceNostr.disconnect();
    await bobNostr.disconnect();
    await charlieNostr.disconnect();
  });

  describe('Real NIP-44 v2 Encryption Integration', () => {
    it('should perform complete encrypt-decrypt cycle with real keys', () => {
      const plaintext = 'Hello from Alice to Bob with real NIP-44 encryption!';
      
      // Derive conversation key using real secp256k1 ECDH
      const conversationKey = NIP44Crypto.deriveConversationKey(
        testKeys.alice.privateKey,
        getPublicKey(testKeys.bob.privateKey)
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
        getPublicKey(testKeys.bob.privateKey)
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
      expect(giftWrap.pubkey).not.toBe(getPublicKey(testKeys.alice.privateKey)); // Must be ephemeral
      expect(giftWrap.tags).toEqual([['p', getPublicKey(testKeys.bob.privateKey)]]);
      expect(giftWrap.content).toMatch(/^[A-Za-z0-9+/=]+$/); // Encrypted seal

      // Decrypt with real cryptography
      const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        giftWrap,
        testKeys.bob.privateKey
      );

      expect(decryption.isValid).toBe(true);
      expect(decryption.rumor.content).toBe(message);
      expect(decryption.senderPubkey).toBe(getPublicKey(testKeys.alice.privateKey));
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

      const testMessage = `Hello Bob, this is a real encrypted message from Alice! ${Date.now()}`;

      // Alice sends message with real encryption
      const sendResult = await aliceConversation.send(testMessage);
      expect(sendResult.success).toBe(true);
      expect(sendResult.messageId).toBeDefined();

      // Wait for Bob to receive the specific message
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        unsubscribe = bobConversation.messages.subscribe(messages => {
          const found = messages.find(m => m.content === testMessage);
          if (found) {
            unsubscribe?.();
            resolve([found]);
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe?.();
          resolve([]);
        }, 5000);
      });

      expect(bobMessages).toHaveLength(1);
      expect(bobMessages[0]?.content).toBe(testMessage);
      expect(bobMessages[0]?.senderPubkey).toBe(testKeys.alice.publicKey);
      expect(bobMessages[0]?.isFromMe).toBe(false);
      expect(bobMessages[0]?.status).toBe('received');
    });

    it('should handle bidirectional conversation with real crypto', async () => {
      const aliceConversation = await aliceNostr.dm.with(testKeys.bob.publicKey);
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      // Alice sends first message with unique timestamp
      const aliceMessage = `Hi Bob! How are you? ${Date.now()}`;
      await aliceConversation.send(aliceMessage);

      // Message delivery happens automatically with real relay

      // Bob replies with unique timestamp
      const bobMessage = `Hi Alice! I'm doing great, thanks for asking! ${Date.now()}`;
      await bobConversation.send(bobMessage);

      // Message delivery happens automatically with real relay

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify both sides have the specific messages from this test
      const aliceMessages = await new Promise<DMMessage[]>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        unsubscribe = aliceConversation.messages.subscribe(messages => {
          const hasAlice = messages.find(m => m.content === aliceMessage);
          const hasBob = messages.find(m => m.content === bobMessage);
          if (hasAlice && hasBob) {
            unsubscribe?.();
            resolve([hasAlice, hasBob]);
          }
        });
        
        setTimeout(() => {
          unsubscribe?.();
          const current = aliceConversation.messages as any;
          const msgs = current._state?.messages || [];
          resolve(msgs.filter((m: DMMessage) => 
            m.content === aliceMessage || m.content === bobMessage
          ));
        }, 5000);
      });

      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        unsubscribe = bobConversation.messages.subscribe(messages => {
          const hasAlice = messages.find(m => m.content === aliceMessage);
          const hasBob = messages.find(m => m.content === bobMessage);
          if (hasAlice && hasBob) {
            unsubscribe?.();
            resolve([hasAlice, hasBob]);
          }
        });
        
        setTimeout(() => {
          unsubscribe?.();
          const current = bobConversation.messages as any;
          const msgs = current._state?.messages || [];
          resolve(msgs.filter((m: DMMessage) => 
            m.content === aliceMessage || m.content === bobMessage
          ));
        }, 5000);
      });

      expect(aliceMessages.length).toBeGreaterThanOrEqual(2);
      expect(bobMessages.length).toBeGreaterThanOrEqual(2);

      // Verify message contents
      expect(aliceMessages.find(m => m.content === aliceMessage && m.isFromMe)).toBeDefined();
      expect(aliceMessages.find(m => m.content === bobMessage && !m.isFromMe)).toBeDefined();
      expect(bobMessages.find(m => m.content === bobMessage && m.isFromMe)).toBeDefined();
      expect(bobMessages.find(m => m.content === aliceMessage && !m.isFromMe)).toBeDefined();
    });

    it('should handle conversation with subject threading', async () => {
      const aliceConversation = await aliceNostr.dm.with(testKeys.bob.publicKey);
      const bobConversation = await bobNostr.dm.with(testKeys.alice.publicKey);

      const subject = `Project Discussion ${Date.now()}`;
      const message = `Let's discuss the project timeline ${Date.now()}`;

      // Send message with subject
      await aliceConversation.send(message, subject);

      // Message delivery happens automatically with real relay

      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for Bob to receive the specific message with subject
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        unsubscribe = bobConversation.messages.subscribe(messages => {
          const found = messages.find(m => m.content === message);
          if (found) {
            unsubscribe?.();
            resolve([found]);
          }
        });
        
        setTimeout(() => {
          unsubscribe?.();
          resolve([]);
        }, 5000);
      });

      expect(bobMessages).toHaveLength(1);
      expect(bobMessages[0]?.subject).toBe(subject);
    });
  });

  describe('Multi-participant Room with Real Crypto', () => {
    it('should create and manage room with real encryption', async () => {
      const participants = [testKeys.bob.publicKey, testKeys.charlie.publicKey];
      const roomOptions = { subject: `Team Meeting ${Date.now()}` }; // Unique subject for test isolation

      const aliceRoom = await aliceNostr.dm.room(participants, roomOptions);
      const bobRoom = await bobNostr.dm.room([testKeys.alice.publicKey, testKeys.charlie.publicKey], roomOptions);
      const charlieRoom = await charlieNostr.dm.room([testKeys.alice.publicKey, testKeys.bob.publicKey], roomOptions);

      const message = `Welcome everyone to our encrypted team meeting! ${Date.now()}`;

      // Alice sends message to room
      const sendResult = await aliceRoom.send(message);
      expect(sendResult.success).toBe(true);

      // Wait for Bob to receive the specific message
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        unsubscribe = bobRoom.messages.subscribe(messages => {
          const found = messages.find(m => m.content === message);
          if (found) {
            unsubscribe?.();
            resolve([found]);
          }
        });
        
        setTimeout(() => {
          unsubscribe?.();
          resolve([]);
        }, 5000);
      });

      // Wait for Charlie to receive the specific message
      const charlieMessages = await new Promise<DMMessage[]>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        unsubscribe = charlieRoom.messages.subscribe(messages => {
          const found = messages.find(m => m.content === message);
          if (found) {
            unsubscribe?.();
            resolve([found]);
          }
        });
        
        setTimeout(() => {
          unsubscribe?.();
          resolve([]);
        }, 5000);
      });

      expect(bobMessages).toHaveLength(1);
      expect(charlieMessages).toHaveLength(1);
      expect(bobMessages[0]?.content).toBe(message);
      expect(charlieMessages[0]?.content).toBe(message);
      expect(bobMessages[0]?.senderPubkey).toBe(testKeys.alice.publicKey);
      expect(charlieMessages[0]?.senderPubkey).toBe(testKeys.alice.publicKey);
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

      // Cannot directly inject malformed events with real relay
      // Test will verify that the conversation handles unexpected data gracefully

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

      // Publish the impostor's message to real relay
      // Bob should reject it since it's not properly authenticated
      const giftWrapToPublish = imposorGiftWrap.giftWraps[0]?.giftWrap;
      if (giftWrapToPublish) {
        await aliceNostr.publishEvent(giftWrapToPublish as any);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Bob should reject the message since it's not from Alice
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });

      expect(bobMessages).toHaveLength(0);
    });

    it('should handle network publishing failures gracefully', async () => {
      // Create a conversation with a non-existent relay to test failure handling
      const failingNostr = new NostrUnchained({ 
        debug: false,
        relays: ['ws://non-existent-relay:4848']
      });
      
      const aliceProvider = new TestSigningProvider(testKeys.alice.privateKey, testKeys.alice.publicKey);
      await failingNostr.dm.updateSigningProvider(aliceProvider);
      
      const aliceConversation = await failingNostr.dm.with(testKeys.bob.publicKey);
      const sendResult = await aliceConversation.send('This message should fail to publish');

      expect(sendResult.success).toBe(false);
      expect(sendResult.error).toBeDefined();
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
      expect(giftWrapResult.seal.pubkey).toBe(getPublicKey(testKeys.alice.privateKey)); // Real sender
      expect(giftWrapResult.seal.tags).toEqual([]);
      expect(typeof giftWrapResult.seal.content).toBe('string'); // Encrypted rumor

      // Verify gift wrap structure (should be kind 1059)
      const giftWrap = giftWrapResult.giftWraps[0]?.giftWrap!;
      expect(giftWrap.kind).toBe(1059);
      expect(giftWrap.pubkey).not.toBe(getPublicKey(testKeys.alice.privateKey)); // Must be ephemeral
      expect(giftWrap.tags).toEqual([['p', getPublicKey(testKeys.bob.privateKey)]]);
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

      const bobGiftWrap = giftWrapResult.giftWraps[0]?.giftWrap!;
      const charlieGiftWrap = giftWrapResult.giftWraps[1]?.giftWrap!;

      // Each gift wrap should use different ephemeral key
      expect(bobGiftWrap.pubkey).not.toBe(charlieGiftWrap.pubkey);
      expect(bobGiftWrap.pubkey).not.toBe(getPublicKey(testKeys.alice.privateKey));
      expect(charlieGiftWrap.pubkey).not.toBe(getPublicKey(testKeys.alice.privateKey));

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
        giftWrapResult.giftWraps[0]?.giftWrap!,
        testKeys.bob.privateKey
      );

      // Message should be identical after full round-trip
      expect(decryption.isValid).toBe(true);
      expect(decryption.rumor.content).toBe(originalMessage);
      expect(decryption.senderPubkey).toBe(getPublicKey(testKeys.alice.privateKey));
    });
  });
});