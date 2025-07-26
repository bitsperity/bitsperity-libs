/**
 * NIP-59 Gift Wrap Protocol Tests
 * 
 * Comprehensive tests for the 3-layer encryption system:
 * - Rumor creation and validation
 * - Seal creation and decryption (kind 13)
 * - Gift wrap creation and decryption (kind 1059)
 * - Full protocol end-to-end testing
 * - Multi-recipient scenarios
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  GiftWrapProtocol,
  SealCreator,
  GiftWrapCreator,
  EphemeralKeyManager,
  TimestampRandomizer,
  NIP59_CONFIG,
  NIP59Error,
  NIP59ErrorCode
} from '../../src/dm/protocol/index.js';

describe('NIP-59 Gift Wrap Protocol', () => {
  // Test keys - properly derived public keys from private keys
  const senderPrivateKey = 'a'.repeat(64);
  const senderPublicKey = '6a04ab98d9e4774ad806e302dddeb63bea16b5cb5f223ee77478e861bb583eb3';
  
  const recipientPrivateKey = 'b'.repeat(64);
  const recipientPublicKey = '68680737c76dabb801cb2204f57dbe4e4579e4f710cd67dc1b4227592c81e9b5';
  
  // Additional test keys for multi-recipient scenarios
  const testKey1Private = '1'.repeat(64);
  const testKey1Public = '4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa';
  
  const testKey2Private = '2'.repeat(64);
  const testKey2Public = '466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27';
  
  const testKey3Private = '3'.repeat(64);
  const testKey3Public = '3c72addb4fdf09af94f0c94d7fe92a386a7e70cf8a1d85916386bb2535c7b1b1';
  
  const testMessage = 'Hello, this is a secret message!';

  describe('EphemeralKeyManager', () => {
    it('should generate valid ephemeral key pairs', () => {
      const keyPair = EphemeralKeyManager.generateEphemeralKeyPair();
      
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]{64}$/i);
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]{64}$/i);
      expect(EphemeralKeyManager.validateEphemeralKeyPair(keyPair)).toBe(true);
    });

    it('should generate multiple unique key pairs', () => {
      const keyPairs = EphemeralKeyManager.generateMultipleEphemeralKeyPairs(3);
      
      expect(keyPairs).toHaveLength(3);
      
      // All keys should be unique
      const privateKeys = keyPairs.map(kp => kp.privateKey);
      const publicKeys = keyPairs.map(kp => kp.publicKey);
      
      expect(new Set(privateKeys).size).toBe(3);
      expect(new Set(publicKeys).size).toBe(3);
      
      // All key pairs should be valid
      keyPairs.forEach(keyPair => {
        expect(EphemeralKeyManager.validateEphemeralKeyPair(keyPair)).toBe(true);
      });
    });

    it('should validate key pair format correctly', () => {
      const validKeyPair = EphemeralKeyManager.generateEphemeralKeyPair();
      expect(EphemeralKeyManager.validateEphemeralKeyPair(validKeyPair)).toBe(true);
      
      // Invalid formats
      expect(EphemeralKeyManager.validateEphemeralKeyPair({
        privateKey: 'invalid',
        publicKey: validKeyPair.publicKey
      })).toBe(false);
      
      expect(EphemeralKeyManager.validateEphemeralKeyPair({
        privateKey: validKeyPair.privateKey,
        publicKey: 'invalid'
      })).toBe(false);
    });
  });

  describe('TimestampRandomizer', () => {
    it('should generate randomized timestamps within range', () => {
      const maxAge = 24 * 60 * 60; // 1 day
      const timestamp = TimestampRandomizer.generateRandomizedTimestamp(maxAge);
      const now = Math.floor(Date.now() / 1000);
      
      expect(timestamp).toBeLessThanOrEqual(now);
      expect(timestamp).toBeGreaterThanOrEqual(now - maxAge);
    });

    it('should generate multiple different timestamps', () => {
      const timestamps = TimestampRandomizer.generateMultipleRandomizedTimestamps(5);
      
      expect(timestamps).toHaveLength(5);
      
      // Should have some variation (not all identical)
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBeGreaterThan(1);
    });

    it('should validate timestamp ranges correctly', () => {
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 24 * 60 * 60;
      
      expect(TimestampRandomizer.validateGiftWrapTimestamp(now, maxAge)).toBe(true);
      expect(TimestampRandomizer.validateGiftWrapTimestamp(now - maxAge + 100, maxAge)).toBe(true);
      expect(TimestampRandomizer.validateGiftWrapTimestamp(now - maxAge - 100, maxAge)).toBe(false);
      expect(TimestampRandomizer.validateGiftWrapTimestamp(now + 3600, maxAge)).toBe(false);
    });
  });

  describe('SealCreator', () => {
    it('should create valid seals', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      
      expect(seal.kind).toBe(NIP59_CONFIG.SEAL_KIND);
      expect(seal.pubkey).toBe(senderPublicKey);
      expect(seal.tags).toEqual([]);
      expect(seal.content).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 encrypted content
      expect(seal.id).toMatch(/^[0-9a-f]{64}$/);
      expect(seal.sig).toMatch(/^[0-9a-f]{128}$/);
    });

    it('should decrypt seals correctly', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const decryption = SealCreator.decryptSeal(seal, recipientPrivateKey);
      
      expect(decryption.isValid).toBe(true);
      expect(decryption.rumor.content).toBe(testMessage);
      expect(decryption.rumor.pubkey).toBe(senderPublicKey);
      expect(decryption.rumor.kind).toBe(4);
    });

    it('should fail decryption with wrong private key', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const wrongPrivateKey = testKey1Private;
      const decryption = SealCreator.decryptSeal(seal, wrongPrivateKey);
      
      expect(decryption.isValid).toBe(false);
    });
  });

  describe('GiftWrapCreator', () => {
    it('should create valid gift wraps', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const recipient = { pubkey: recipientPublicKey };
      
      const result = await GiftWrapCreator.createGiftWrap(seal, recipient);
      
      expect(result.giftWrap.kind).toBe(NIP59_CONFIG.GIFT_WRAP_KIND);
      expect(result.giftWrap.pubkey).toMatch(/^[0-9a-f]{64}$/); // Ephemeral key
      expect(result.giftWrap.pubkey).not.toBe(senderPublicKey); // Should be ephemeral
      expect(result.giftWrap.tags).toHaveLength(1);
      expect(result.giftWrap.tags[0]).toEqual(['p', recipientPublicKey]);
      expect(result.giftWrap.content).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(result.recipient).toBe(recipientPublicKey);
    });

    it('should create gift wraps with relay hints', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const recipient = { 
        pubkey: recipientPublicKey,
        relayHint: 'wss://relay.example.com'
      };
      
      const result = await GiftWrapCreator.createGiftWrap(seal, recipient);
      
      expect(result.giftWrap.tags[0]).toEqual(['p', recipientPublicKey, 'wss://relay.example.com']);
    });

    it('should decrypt gift wraps correctly', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const recipient = { pubkey: recipientPublicKey };
      
      const result = await GiftWrapCreator.createGiftWrap(seal, recipient);
      const decryption = GiftWrapCreator.decryptGiftWrap(result.giftWrap, recipientPrivateKey);
      
      expect(decryption.isValid).toBe(true);
      expect(decryption.seal.kind).toBe(NIP59_CONFIG.SEAL_KIND);
      expect(decryption.seal.pubkey).toBe(senderPublicKey);
    });

    it('should create multiple gift wraps for multiple recipients', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const recipients = [
        { pubkey: recipientPublicKey },
        { pubkey: testKey1Public },
        { pubkey: testKey2Public }
      ];
      
      const results = await GiftWrapCreator.createMultipleGiftWraps(seal, recipients);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.recipient).toBe(recipients[index].pubkey);
        expect(result.giftWrap.kind).toBe(NIP59_CONFIG.GIFT_WRAP_KIND);
        // Each should have unique ephemeral key
        expect(result.ephemeralKeyPair.publicKey).toBe(result.giftWrap.pubkey);
      });
      
      // All ephemeral keys should be unique
      const ephemeralKeys = results.map(r => r.ephemeralKeyPair.publicKey);
      expect(new Set(ephemeralKeys).size).toBe(3);
    });
  });

  describe('GiftWrapProtocol - Full Integration', () => {
    it('should create and decrypt gift-wrapped DMs end-to-end', async () => {
      const config = {
        recipients: [{ pubkey: recipientPublicKey }]
      };
      
      // Create gift-wrapped DM
      const result = await GiftWrapProtocol.createGiftWrappedDM(
        testMessage,
        senderPrivateKey,
        config
      );
      
      expect(result.rumor.content).toBe(testMessage);
      expect(result.rumor.pubkey).toBe(senderPublicKey);
      expect(result.giftWraps).toHaveLength(1);
      
      const giftWrap = result.giftWraps[0].giftWrap;
      
      // Decrypt gift-wrapped DM
      const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        giftWrap,
        recipientPrivateKey
      );
      
      expect(decryption.isValid).toBe(true);
      expect(decryption.rumor.content).toBe(testMessage);
      expect(decryption.senderPubkey).toBe(senderPublicKey);
    });

    it('should handle multi-recipient scenarios', async () => {
      const recipients = [
        { pubkey: recipientPublicKey },
        { pubkey: testKey1Public },
        { pubkey: testKey2Public }
      ];
      
      const config = { recipients };
      
      const result = await GiftWrapProtocol.createGiftWrappedDM(
        testMessage,
        senderPrivateKey,
        config
      );
      
      expect(result.giftWraps).toHaveLength(3);
      
      // Each gift wrap should be for the correct recipient
      result.giftWraps.forEach((giftWrapResult, index) => {
        expect(giftWrapResult.recipient).toBe(recipients[index].pubkey);
        const extractedRecipient = GiftWrapCreator.getRecipientFromGiftWrap(
          giftWrapResult.giftWrap
        );
        expect(extractedRecipient).toBe(recipients[index].pubkey);
      });
    });

    it('should filter gift wraps for specific recipients', async () => {
      const recipients = [
        { pubkey: recipientPublicKey },
        { pubkey: testKey1Public },
        { pubkey: testKey2Public }
      ];
      
      const config = { recipients };
      
      const result = await GiftWrapProtocol.createGiftWrappedDM(
        testMessage,
        senderPrivateKey,
        config
      );
      
      const allGiftWraps = result.giftWraps.map(r => r.giftWrap);
      const filteredGiftWraps = GiftWrapProtocol.filterGiftWrapsForRecipient(
        allGiftWraps,
        recipientPublicKey
      );
      
      expect(filteredGiftWraps).toHaveLength(1);
      expect(GiftWrapCreator.getRecipientFromGiftWrap(filteredGiftWraps[0])).toBe(recipientPublicKey);
    });

    it('should provide utility configuration helpers', () => {
      const simpleConfig = GiftWrapProtocol.createSimpleConfig(
        recipientPublicKey,
        'wss://relay.example.com'
      );
      
      expect(simpleConfig.recipients).toHaveLength(1);
      expect(simpleConfig.recipients[0].pubkey).toBe(recipientPublicKey);
      expect(simpleConfig.recipients[0].relayHint).toBe('wss://relay.example.com');
      
      const multiConfig = GiftWrapProtocol.createMultiRecipientConfig(
        [recipientPublicKey, testKey1Public],
        'wss://relay.example.com'
      );
      
      expect(multiConfig.recipients).toHaveLength(2);
      expect(multiConfig.recipients[0].pubkey).toBe(recipientPublicKey);
      expect(multiConfig.recipients[1].pubkey).toBe(testKey1Public);
    });

    it('should calculate protocol statistics', async () => {
      const config = {
        recipients: [
          { pubkey: recipientPublicKey },
          { pubkey: testKey1Public }
        ]
      };
      
      const result1 = await GiftWrapProtocol.createGiftWrappedDM(testMessage, senderPrivateKey, config);
      const result2 = await GiftWrapProtocol.createGiftWrappedDM('Another message', senderPrivateKey, config);
      
      const stats = GiftWrapProtocol.getProtocolStats([result1, result2]);
      
      expect(stats.totalMessages).toBe(2);
      expect(stats.totalGiftWraps).toBe(4); // 2 messages × 2 recipients each
      expect(stats.uniqueRecipients).toBe(2);
      expect(stats.averageTimestampAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should validate input parameters', async () => {
      await expect(
        GiftWrapProtocol.createGiftWrappedDM('', 'invalid-key', { recipients: [] })
      ).rejects.toThrow(NIP59Error);
      
      await expect(
        GiftWrapProtocol.createGiftWrappedDM(testMessage, senderPrivateKey, { recipients: [] })
      ).rejects.toThrow(NIP59Error);
      
      await expect(
        GiftWrapProtocol.createGiftWrappedDM(testMessage, senderPrivateKey, {
          recipients: [{ pubkey: 'invalid' }]
        })
      ).rejects.toThrow(NIP59Error);
    });

    it('should handle decryption failures gracefully', async () => {
      const config = { recipients: [{ pubkey: recipientPublicKey }] };
      const result = await GiftWrapProtocol.createGiftWrappedDM(testMessage, senderPrivateKey, config);
      
      // Try to decrypt with wrong key
      const wrongPrivateKey = testKey1Private;
      const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        result.giftWraps[0].giftWrap,
        wrongPrivateKey
      );
      
      expect(decryption.isValid).toBe(false);
    });

    it('should handle malformed gift wraps', async () => {
      const malformedGiftWrap = {
        id: senderPrivateKey,
        pubkey: recipientPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [['p', recipientPublicKey]],
        content: 'invalid-base64-!@#$',
        sig: 'c'.repeat(128)
      } as any;
      
      const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(
        malformedGiftWrap,
        recipientPrivateKey
      );
      
      expect(decryption.isValid).toBe(false);
    });
  });

  describe('Compliance with NIP-59 Specification', () => {
    it('should create seals with exact kind 13 structure', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      
      // Exact NIP-59 compliance
      expect(seal.kind).toBe(13);
      expect(seal.tags).toEqual([]);
      expect(seal.pubkey).toBe(senderPublicKey); // Real author's pubkey
      expect(typeof seal.content).toBe('string'); // NIP-44 encrypted rumor
      expect(seal.id).toMatch(/^[0-9a-f]{64}$/);
      expect(seal.sig).toMatch(/^[0-9a-f]{128}$/);
    });

    it('should create gift wraps with exact kind 1059 structure', async () => {
      const rumor = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 4,
        tags: [],
        content: testMessage
      };
      
      const seal = await SealCreator.createSeal(rumor, senderPrivateKey, recipientPublicKey);
      const recipient = { 
        pubkey: recipientPublicKey,
        relayHint: 'wss://relay.example.com'
      };
      
      const result = await GiftWrapCreator.createGiftWrap(seal, recipient);
      const giftWrap = result.giftWrap;
      
      // Exact NIP-59 compliance
      expect(giftWrap.kind).toBe(1059);
      expect(giftWrap.pubkey).toMatch(/^[0-9a-f]{64}$/); // Ephemeral pubkey
      expect(giftWrap.pubkey).not.toBe(senderPublicKey); // Must be ephemeral
      expect(giftWrap.tags).toHaveLength(1);
      expect(giftWrap.tags[0][0]).toBe('p');
      expect(giftWrap.tags[0][1]).toBe(recipientPublicKey);
      expect(giftWrap.tags[0][2]).toBe('wss://relay.example.com');
      expect(typeof giftWrap.content).toBe('string'); // NIP-44 encrypted seal
      
      // Timestamp should be randomized (past timestamp)
      const now = Math.floor(Date.now() / 1000);
      expect(giftWrap.created_at).toBeLessThanOrEqual(now);
      expect(giftWrap.created_at).toBeGreaterThan(now - NIP59_CONFIG.MAX_TIMESTAMP_AGE_SECONDS);
    });

    it('should use different ephemeral keys for each gift wrap', async () => {
      const config = {
        recipients: [
          { pubkey: recipientPublicKey },
          { pubkey: testKey1Public }
        ]
      };
      
      const result = await GiftWrapProtocol.createGiftWrappedDM(testMessage, senderPrivateKey, config);
      
      const ephemeralKey1 = result.giftWraps[0].giftWrap.pubkey;
      const ephemeralKey2 = result.giftWraps[1].giftWrap.pubkey;
      
      expect(ephemeralKey1).not.toBe(ephemeralKey2);
      expect(ephemeralKey1).not.toBe(senderPublicKey);
      expect(ephemeralKey2).not.toBe(senderPublicKey);
    });
  });
});