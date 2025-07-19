import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { NostrUnchained, createBuilder } from '../index';
import { getCrypto } from '../crypto';
import type { CryptoModule } from '../crypto/types';

/**
 * Phase 2 Integration Tests
 * Tests the integration between Foundation Layer and Cryptographic Core
 * Uses local Umbrel relay for realistic testing scenarios
 */
describe('Phase 2: Foundation + Crypto Integration', () => {
  let instance: NostrUnchained;
  let crypto: CryptoModule;
  
  const UMBREL_RELAY = 'ws://umbrel.local:4848';

  beforeAll(async () => {
    // Initialize crypto module for testing
    crypto = await getCrypto();
  });

  afterEach(async () => {
    if (instance) {
      await instance.dispose();
    }
  });

  describe('Crypto-Enhanced Foundation Layer', () => {
    it('should initialize with crypto support and Umbrel relay', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000, // Longer timeout for local relay
        debug: true,
      });

      expect(instance.isInitialized).toBe(true);
      expect(instance.config.relays).toContain(UMBREL_RELAY);
      
      // Crypto should be available
      const cryptoInstance = await getCrypto();
      expect(cryptoInstance).toBeDefined();
      expect(cryptoInstance.generateNonce).toBeDefined();
    });

    it('should perform basic encryption/decryption cycle', async () => {
      const message = 'Hello from Phase 2 testing!';
      const key = new Uint8Array(32).fill(1); // Test key
      const nonce = crypto.generateNonce();

      const encrypted = await crypto.encrypt(
        new TextEncoder().encode(message),
        key,
        nonce
      );

      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce).toEqual(nonce);
      expect(encrypted.tag).toBeInstanceOf(Uint8Array);

      const decrypted = await crypto.decrypt(
        encrypted.ciphertext,
        key,
        encrypted.nonce,
        encrypted.tag
      );

      const decryptedMessage = new TextDecoder().decode(decrypted);
      expect(decryptedMessage).toBe(message);
    });

    it('should meet Phase 2 performance requirements', async () => {
      const message = 'A'.repeat(1024); // 1KB test message
      const key = new Uint8Array(32).fill(42);
      const messageBytes = new TextEncoder().encode(message);

      // Test encryption performance
      const encryptStart = performance.now();
      const encrypted = await crypto.encrypt(messageBytes, key);
      const encryptTime = performance.now() - encryptStart;

      expect(encryptTime).toBeLessThan(50); // Phase 2 requirement: <50ms for 1KB

      // Test decryption performance
      const decryptStart = performance.now();
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      const decryptTime = performance.now() - decryptStart;

      expect(decryptTime).toBeLessThan(50); // Phase 2 requirement: <50ms for 1KB
      expect(new TextDecoder().decode(decrypted)).toBe(message);
    });
  });

  describe('Umbrel Relay Integration', () => {
    it('should connect to Umbrel relay successfully', async () => {
      instance = await createBuilder()
        .withRelays([UMBREL_RELAY])
        .withTimeout(15000) // Extended timeout for local network
        .withDebug(true)
        .create();

      expect(instance.isInitialized).toBe(true);
      expect(instance.config.relays[0]).toBe(UMBREL_RELAY);
    });

    it('should handle Umbrel relay connection errors gracefully', async () => {
      const invalidUmbrelRelay = 'ws://invalid.umbrel.local:4848';
      
      await expect(
        NostrUnchained.create({
          relays: [invalidUmbrelRelay],
          timeout: 2000, // Short timeout to fail fast
        })
      ).rejects.toThrow();
    });

    it('should fallback to default relays when Umbrel unavailable', async () => {
      const relays = [
        'ws://offline.umbrel.local:4848', // Offline Umbrel
        'wss://relay.damus.io', // Fallback
      ];

      instance = await NostrUnchained.create({
        relays,
        timeout: 5000,
      });

      expect(instance.isInitialized).toBe(true);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during crypto operations', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
      });

      const initialMemory = process.memoryUsage();
      const iterations = 100;

      // Perform many crypto operations
      for (let i = 0; i < iterations; i++) {
        const message = `Test message ${i}`;
        const key = new Uint8Array(32).fill(i % 256);
        const messageBytes = new TextEncoder().encode(message);
        
        const encrypted = await crypto.encrypt(messageBytes, key);
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        
        expect(new TextDecoder().decode(decrypted)).toBe(message);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 10MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should cleanup crypto resources on disposal', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
      });

      expect(instance.isInitialized).toBe(true);

      await instance.dispose();

      expect(instance.isInitialized).toBe(false);
      expect(instance.signer).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent crypto operations', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
      });

      const concurrentOperations = Array.from({ length: 10 }, async (_, i) => {
        const message = `Concurrent message ${i}`;
        const key = new Uint8Array(32).fill(i);
        const messageBytes = new TextEncoder().encode(message);
        
        const encrypted = await crypto.encrypt(messageBytes, key);
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        
        return {
          original: message,
          decrypted: new TextDecoder().decode(decrypted),
        };
      });

      const results = await Promise.all(concurrentOperations);

      results.forEach((result, i) => {
        expect(result.decrypted).toBe(`Concurrent message ${i}`);
      });
    });

    it('should maintain data integrity under concurrent load', async () => {
      const heavyLoad = Array.from({ length: 50 }, async (_, i) => {
        const largeMessage = 'X'.repeat(1024 * 5); // 5KB message
        const key = new Uint8Array(32).fill(i % 256); // Different 32-byte key each time
        const messageBytes = new TextEncoder().encode(largeMessage + i);
        
        const start = performance.now();
        const encrypted = await crypto.encrypt(messageBytes, key);
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        const duration = performance.now() - start;
        
        return {
          index: i,
          success: new TextDecoder().decode(decrypted) === largeMessage + i,
          duration,
        };
      });

      const results = await Promise.all(heavyLoad);

      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Average duration should be reasonable
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(100); // 100ms average for 5KB messages
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from crypto operation failures', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
      });

      // Test with invalid inputs
      await expect(
        crypto.decrypt(
          new Uint8Array(0), // Empty ciphertext
          new Uint8Array(32),
          new Uint8Array(12)
        )
      ).rejects.toThrow();

      // Should still work with valid inputs after error
      const validMessage = 'Recovery test';
      const validKey = new Uint8Array(32).fill(123);
      const messageBytes = new TextEncoder().encode(validMessage);
      
      const encrypted = await crypto.encrypt(messageBytes, validKey);
      const decrypted = await crypto.decrypt(encrypted.ciphertext, validKey, encrypted.nonce, encrypted.tag);
      
      expect(new TextDecoder().decode(decrypted)).toBe(validMessage);
    });

    it('should handle Umbrel relay disconnections gracefully', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY, 'wss://relay.damus.io'], // Fallback relay
        timeout: 5000,
      });

      expect(instance.isInitialized).toBe(true);
      
      // Even if Umbrel relay has issues, crypto should still work
      const message = 'Resilience test';
      const key = new Uint8Array(32).fill(200);
      const messageBytes = new TextEncoder().encode(message);
      
      const encrypted = await crypto.encrypt(messageBytes, key);
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      
      expect(new TextDecoder().decode(decrypted)).toBe(message);
    });
  });

  describe('Security Validation', () => {
    it('should generate cryptographically secure nonces', async () => {
      const nonces = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const nonce = crypto.generateNonce();
        const nonceHex = Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('');
        
        expect(nonce.length).toBe(12);
        expect(nonces.has(nonceHex)).toBe(false); // Should be unique
        nonces.add(nonceHex);
      }

      expect(nonces.size).toBe(iterations); // All nonces should be unique
    });

    it('should fail with tampered ciphertext', async () => {
      const message = 'Secret message';
      const key = new Uint8Array(32).fill(111);
      const messageBytes = new TextEncoder().encode(message);
      
      const encrypted = await crypto.encrypt(messageBytes, key);
      
      // Tamper with ciphertext
      const tamperedCiphertext = new Uint8Array(encrypted.ciphertext);
      tamperedCiphertext[0] ^= 0x01; // Flip one bit
      
      await expect(
        crypto.decrypt(tamperedCiphertext, key, encrypted.nonce, encrypted.tag)
      ).rejects.toThrow();
    });

    it('should use constant-time comparison for security', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);
      const c = new Uint8Array([1, 2, 3, 5]);
      
      expect(crypto.constantTimeEquals(a, b)).toBe(true);
      expect(crypto.constantTimeEquals(a, c)).toBe(false);
      expect(crypto.constantTimeEquals(a, new Uint8Array([1, 2, 3]))).toBe(false);
    });
  });
}); 