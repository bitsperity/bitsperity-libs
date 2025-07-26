/**
 * NIP-44 v2 Cryptography Tests
 * 
 * Tests for complete NIP-44 v2 specification compliance
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NIP44Crypto } from '../../src/dm/crypto/NIP44Crypto.js';
import { NIP44Error, NIP44ErrorCode } from '../../src/dm/types/crypto-types.js';

describe('NIP-44 v2 Cryptography', () => {
  let testVectors: any;

  beforeAll(() => {
    const vectorsPath = join(process.cwd(), 'test-vectors', 'nip44-official-vectors.json');
    testVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));
  });

  describe('Conversation Key Derivation', () => {
    it('should derive conversation keys correctly', () => {
      const vectors = testVectors.v2.valid.get_conversation_key;
      
      for (const vector of vectors) {
        const result = NIP44Crypto.deriveConversationKey(
          vector.sec1,
          vector.pub2
        );
        
        expect(Buffer.from(result).toString('hex')).toBe(vector.conversation_key);
      }
    });

    it('should be bidirectional (same key for A->B and B->A)', () => {
      const privKeyA = '0000000000000000000000000000000000000000000000000000000000000001';
      const pubKeyA = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
      const privKeyB = '0000000000000000000000000000000000000000000000000000000000000002';
      const pubKeyB = '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5';

      const keyAB = NIP44Crypto.deriveConversationKey(privKeyA, pubKeyB);
      const keyBA = NIP44Crypto.deriveConversationKey(privKeyB, pubKeyA);

      expect(Buffer.from(keyAB).toString('hex')).toBe(
        Buffer.from(keyBA).toString('hex')
      );
    });

    it('should throw error for invalid private key', () => {
      expect(() => {
        NIP44Crypto.deriveConversationKey(
          'invalid_key',
          '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
        );
      }).toThrow(NIP44Error);
    });

    it('should throw error for invalid public key', () => {
      expect(() => {
        NIP44Crypto.deriveConversationKey(
          '0000000000000000000000000000000000000000000000000000000000000001',
          'invalid_public_key'
        );
      }).toThrow(NIP44Error);
    });
  });

  describe('Message Key Derivation', () => {
    it('should derive message keys correctly from test case', () => {
      // Use first encrypt_decrypt vector to test key derivation
      const vector = testVectors.v2.valid.encrypt_decrypt[0];
      const conversationKey = new Uint8Array(Buffer.from(vector.conversation_key, 'hex'));
      const nonce = new Uint8Array(Buffer.from(vector.nonce, 'hex'));
      
      const messageKeys = NIP44Crypto.deriveMessageKeys(conversationKey, nonce);
      
      // Test that we can derive keys without errors
      expect(messageKeys.chachaKey).toHaveLength(32);
      expect(messageKeys.chachaNonce).toHaveLength(12);
      expect(messageKeys.hmacKey).toHaveLength(32);
    });

    it('should throw error for invalid conversation key length', () => {
      const invalidKey = new Uint8Array(16); // Wrong length
      const validNonce = new Uint8Array(32);
      
      expect(() => {
        NIP44Crypto.deriveMessageKeys(invalidKey, validNonce);
      }).toThrow(NIP44Error);
    });

    it('should throw error for invalid nonce length', () => {
      const validKey = new Uint8Array(32);
      const invalidNonce = new Uint8Array(16); // Wrong length
      
      expect(() => {
        NIP44Crypto.deriveMessageKeys(validKey, invalidNonce);
      }).toThrow(NIP44Error);
    });
  });

  describe('Padding Algorithm', () => {
    it('should calculate padding lengths correctly', () => {
      const vectors = testVectors.v2.valid.calc_padded_len;
      
      for (const [unpaddedLen, expectedPaddedLen] of vectors) {
        const result = NIP44Crypto.calculatePaddedLength(unpaddedLen);
        expect(result).toBe(expectedPaddedLen);
      }
    });

    it('should apply and remove padding correctly', () => {
      const testText = 'Hello, World!';
      const textBytes = new TextEncoder().encode(testText);
      
      const padded = NIP44Crypto.applyPadding(textBytes);
      expect(padded.length).toBeGreaterThanOrEqual(textBytes.length);
      expect(padded.length).toBe(NIP44Crypto.calculatePaddedLength(textBytes.length));
      
      const unpadded = NIP44Crypto.removePadding(padded);
      expect(Buffer.from(unpadded).toString()).toBe(testText);
    });

    it('should throw error for invalid plaintext length', () => {
      expect(() => {
        NIP44Crypto.calculatePaddedLength(-1); // Negative
      }).toThrow(NIP44Error);
      
      expect(() => {
        NIP44Crypto.calculatePaddedLength(65537); // Too long
      }).toThrow(NIP44Error);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt correctly with test vectors', () => {
      const vectors = testVectors.v2.valid.encrypt_decrypt;
      
      for (const vector of vectors) {
        const conversationKey = new Uint8Array(Buffer.from(vector.conversation_key, 'hex'));
        const nonce = new Uint8Array(Buffer.from(vector.nonce, 'hex'));
        
        // Test encryption with known nonce
        const encrypted = NIP44Crypto.encryptWithNonce(
          vector.plaintext,
          conversationKey,
          nonce
        );
        
        expect(encrypted).toBe(vector.payload);
        
        // Test decryption
        const decrypted = NIP44Crypto.decrypt(vector.payload, conversationKey);
        
        expect(decrypted.isValid).toBe(true);
        expect(decrypted.plaintext).toBe(vector.plaintext);
      }
    });

    it('should encrypt and decrypt round-trip correctly', () => {
      const plaintext = 'This is a test message for NIP-44 encryption!';
      const conversationKey = new Uint8Array(Buffer.from(
        'c41c775356fd92eadc63ff5a0dc1da211b268cbea22316767095b2871ea1412d',
        'hex'
      ));
      
      const encrypted = NIP44Crypto.encrypt(plaintext, conversationKey);
      const decrypted = NIP44Crypto.decrypt(encrypted.payload, conversationKey);
      
      expect(decrypted.isValid).toBe(true);
      expect(decrypted.plaintext).toBe(plaintext);
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const plaintext = 'Same message';
      const conversationKey = new Uint8Array(Buffer.from(
        'c41c775356fd92eadc63ff5a0dc1da211b268cbea22316767095b2871ea1412d',
        'hex'
      ));
      
      const encrypted1 = NIP44Crypto.encrypt(plaintext, conversationKey);
      const encrypted2 = NIP44Crypto.encrypt(plaintext, conversationKey);
      
      // Different nonces should produce different ciphertexts
      expect(encrypted1.payload).not.toBe(encrypted2.payload);
      
      // But both should decrypt to same plaintext
      const decrypted1 = NIP44Crypto.decrypt(encrypted1.payload, conversationKey);
      const decrypted2 = NIP44Crypto.decrypt(encrypted2.payload, conversationKey);
      
      expect(decrypted1.plaintext).toBe(plaintext);
      expect(decrypted2.plaintext).toBe(plaintext);
    });

    it('should handle empty string encryption', () => {
      const conversationKey = new Uint8Array(32);
      conversationKey.fill(1);
      
      const encrypted = NIP44Crypto.encrypt('', conversationKey);
      const decrypted = NIP44Crypto.decrypt(encrypted.payload, conversationKey);
      
      expect(decrypted.isValid).toBe(true);
      expect(decrypted.plaintext).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const conversationKey = new Uint8Array(32);
      conversationKey.fill(1); // Fill with test data
      
      const encrypted = NIP44Crypto.encrypt(longMessage, conversationKey);
      const decrypted = NIP44Crypto.decrypt(encrypted.payload, conversationKey);
      
      expect(decrypted.isValid).toBe(true);
      expect(decrypted.plaintext).toBe(longMessage);
    });
  });

  describe('MAC Verification', () => {
    it('should fail MAC verification for tampered ciphertext', () => {
      const plaintext = 'Test message';
      const conversationKey = new Uint8Array(32);
      conversationKey.fill(1);
      
      const encrypted = NIP44Crypto.encrypt(plaintext, conversationKey);
      
      // Tamper with the payload
      const tamperedPayload = encrypted.payload.slice(0, -4) + 'XXXX';
      
      const decrypted = NIP44Crypto.decrypt(tamperedPayload, conversationKey);
      expect(decrypted.isValid).toBe(false);
    });

    it('should fail MAC verification for wrong conversation key', () => {
      const plaintext = 'Test message';
      const conversationKey1 = new Uint8Array(32);
      const conversationKey2 = new Uint8Array(32);
      conversationKey1.fill(1);
      conversationKey2.fill(2);
      
      const encrypted = NIP44Crypto.encrypt(plaintext, conversationKey1);
      const decrypted = NIP44Crypto.decrypt(encrypted.payload, conversationKey2);
      
      expect(decrypted.isValid).toBe(false);
    });
  });

  describe('Payload Validation', () => {
    it('should validate correct payload format', () => {
      const validPayload = 'AgABAgMEBQYHCAkQERITFBUWFxgZICEiIyQlJicoKTA15r4S9CWfB2q5cE5OlmBVj+dYWnz7zZc=';
      expect(NIP44Crypto.validatePayload(validPayload)).toBe(true);
    });

    it('should reject invalid payload format', () => {
      expect(NIP44Crypto.validatePayload('invalid')).toBe(false);
      expect(NIP44Crypto.validatePayload('')).toBe(false);
      expect(NIP44Crypto.validatePayload('AAAA')).toBe(false); // Too short
    });

    it('should reject wrong version', () => {
      // Create payload with version 1 instead of 2
      const wrongVersionPayload = 'AQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQABAQE=';
      expect(NIP44Crypto.validatePayload(wrongVersionPayload)).toBe(false);
    });
  });

  describe('Nonce Generation', () => {
    it('should generate 32-byte nonces', () => {
      const nonce = NIP44Crypto.generateNonce();
      expect(nonce.length).toBe(32);
    });

    it('should generate different nonces', () => {
      const nonce1 = NIP44Crypto.generateNonce();
      const nonce2 = NIP44Crypto.generateNonce();
      
      expect(Buffer.from(nonce1).toString('hex')).not.toBe(
        Buffer.from(nonce2).toString('hex')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed base64', () => {
      const conversationKey = new Uint8Array(32);
      const result = NIP44Crypto.decrypt('invalid_base64!', conversationKey);
      expect(result.isValid).toBe(false);
    });

    it('should handle truncated payload', () => {
      const conversationKey = new Uint8Array(32);
      const result = NIP44Crypto.decrypt('AgAB', conversationKey); // Too short
      expect(result.isValid).toBe(false);
    });
  });

  describe('Unicode Support', () => {
    it('should handle Unicode characters correctly', () => {
      const unicodeText = '🚀 Nostr with 中文 and émojis! 🎉';
      const conversationKey = new Uint8Array(32);
      conversationKey.fill(42);
      
      const encrypted = NIP44Crypto.encrypt(unicodeText, conversationKey);
      const decrypted = NIP44Crypto.decrypt(encrypted.payload, conversationKey);
      
      expect(decrypted.isValid).toBe(true);
      expect(decrypted.plaintext).toBe(unicodeText);
    });
  });
});