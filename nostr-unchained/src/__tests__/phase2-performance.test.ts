import { describe, it, expect, beforeAll } from 'vitest';
import { getCrypto } from '../crypto';
import type { CryptoModule } from '../crypto/types';

/**
 * Phase 2 Performance Tests
 * Validates crypto operations meet Phase 2 performance requirements
 * Tests are designed to run in both development and container environments
 */
describe('Phase 2: Crypto Performance Validation', () => {
  let crypto: CryptoModule;

  beforeAll(async () => {
    crypto = await getCrypto();
  });

  describe('Encryption Performance Requirements', () => {
    it('should encrypt 1KB message in <50ms (Phase 2 requirement)', async () => {
      const message = 'A'.repeat(1024); // 1KB message
      const key = new Uint8Array(32).fill(1);
      const messageBytes = new TextEncoder().encode(message);

      const start = performance.now();
      const encrypted = await crypto.encrypt(messageBytes, key);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(encrypted.ciphertext.length).toBeGreaterThan(0);
      expect(encrypted.tag.length).toBe(16); // AES-GCM tag length
    });

    it('should decrypt 1KB message in <50ms (Phase 2 requirement)', async () => {
      const message = 'B'.repeat(1024);
      const key = new Uint8Array(32).fill(2);
      const messageBytes = new TextEncoder().encode(message);

      const encrypted = await crypto.encrypt(messageBytes, key);

      const start = performance.now();
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(new TextDecoder().decode(decrypted)).toBe(message);
    });

    it('should handle varying message sizes efficiently', async () => {
      const sizes = [
        { name: '100B', size: 100, maxTime: 10 },
        { name: '1KB', size: 1024, maxTime: 50 },
        { name: '10KB', size: 10240, maxTime: 200 },
        { name: '100KB', size: 102400, maxTime: 1000 },
      ];

      for (const testCase of sizes) {
        const message = 'X'.repeat(testCase.size);
        const key = new Uint8Array(32).fill(Math.floor(Math.random() * 256));
        const messageBytes = new TextEncoder().encode(message);

        const encryptStart = performance.now();
        const encrypted = await crypto.encrypt(messageBytes, key);
        const encryptTime = performance.now() - encryptStart;

        const decryptStart = performance.now();
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        const decryptTime = performance.now() - decryptStart;

        expect(encryptTime).toBeLessThan(testCase.maxTime);
        expect(decryptTime).toBeLessThan(testCase.maxTime);
        expect(new TextDecoder().decode(decrypted)).toBe(message);

        console.log(`${testCase.name}: Encrypt ${encryptTime.toFixed(2)}ms, Decrypt ${decryptTime.toFixed(2)}ms`);
      }
    });
  });

  describe('Throughput Performance', () => {
    it('should achieve >10 operations/second for 1KB messages', async () => {
      const message = 'T'.repeat(1024);
      const key = new Uint8Array(32).fill(123);
      const messageBytes = new TextEncoder().encode(message);
      const iterations = 20; // Test 20 operations

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const encrypted = await crypto.encrypt(messageBytes, key);
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        expect(new TextDecoder().decode(decrypted)).toBe(message);
      }

      const totalTime = performance.now() - start;
      const operationsPerSecond = (iterations * 1000) / totalTime;

      expect(operationsPerSecond).toBeGreaterThan(10);
      console.log(`Throughput: ${operationsPerSecond.toFixed(2)} operations/second`);
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentOperations = 10;
      const message = 'C'.repeat(512); // 512B message
      const messageBytes = new TextEncoder().encode(message);

      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        const key = new Uint8Array(32).fill(i);
        
        const start = performance.now();
        const encrypted = await crypto.encrypt(messageBytes, key);
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        const duration = performance.now() - start;

        return {
          index: i,
          duration,
          success: new TextDecoder().decode(decrypted) === message,
        };
      });

      const results = await Promise.all(operations);

      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true);

      // No operation should take too long
      const maxDuration = Math.max(...results.map(r => r.duration));
      expect(maxDuration).toBeLessThan(100); // 100ms max for 512B under load

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      console.log(`Concurrent average: ${avgDuration.toFixed(2)}ms, max: ${maxDuration.toFixed(2)}ms`);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not accumulate memory during repeated operations', async () => {
      const message = 'M'.repeat(1024);
      const key = new Uint8Array(32).fill(200);
      const messageBytes = new TextEncoder().encode(message);

      // Baseline memory
      const baseline = process.memoryUsage();
      
      // Warm up
      for (let i = 0; i < 10; i++) {
        const encrypted = await crypto.encrypt(messageBytes, key);
        await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      }

      const afterWarmup = process.memoryUsage();

      // Main test
      for (let i = 0; i < 100; i++) {
        const encrypted = await crypto.encrypt(messageBytes, key);
        const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
        expect(new TextDecoder().decode(decrypted)).toBe(message);
      }

      const final = process.memoryUsage();

      // Memory growth should be minimal after warmup
      const warmupGrowth = afterWarmup.heapUsed - baseline.heapUsed;
      const testGrowth = final.heapUsed - afterWarmup.heapUsed;

      console.log(`Memory - Warmup: +${(warmupGrowth / 1024).toFixed(2)}KB, Test: +${(testGrowth / 1024).toFixed(2)}KB`);

      // Test operations should not cause significant additional memory growth
      expect(testGrowth).toBeLessThan(warmupGrowth * 2); // Allow some variance
    });

    it('should handle large messages without excessive memory usage', async () => {
      const largeMessage = 'L'.repeat(1024 * 100); // 100KB
      const key = new Uint8Array(32).fill(250);
      const messageBytes = new TextEncoder().encode(largeMessage);

      const before = process.memoryUsage();

      const encrypted = await crypto.encrypt(messageBytes, key);
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);

      const after = process.memoryUsage();
      const memoryUsed = after.heapUsed - before.heapUsed;

      expect(new TextDecoder().decode(decrypted)).toBe(largeMessage);
      
      // Memory usage should be reasonable (not more than 5x the message size)
      expect(memoryUsed).toBeLessThan(messageBytes.length * 5);
      
      console.log(`Large message (100KB): ${(memoryUsed / 1024).toFixed(2)}KB memory used`);
    });
  });

  describe('Nonce Generation Performance', () => {
    it('should generate nonces quickly and uniquely', async () => {
      const iterations = 10000;
      const nonces = new Set<string>();

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const nonce = crypto.generateNonce();
        const nonceHex = Array.from(nonce)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        expect(nonce.length).toBe(12);
        expect(nonces.has(nonceHex)).toBe(false);
        nonces.add(nonceHex);
      }

      const duration = performance.now() - start;
      const noncesPerSecond = (iterations * 1000) / duration;

      expect(nonces.size).toBe(iterations); // All unique
      expect(noncesPerSecond).toBeGreaterThan(1000); // Should be very fast

      console.log(`Nonce generation: ${noncesPerSecond.toFixed(0)} nonces/second`);
    });
  });

  describe('Bundle Size Impact Testing', () => {
    it('should load crypto module efficiently', async () => {
      // Test that lazy loading works efficiently
      const start = performance.now();
      
      const cryptoModule = await getCrypto();
      
      const loadTime = performance.now() - start;
      
      expect(cryptoModule).toBeDefined();
      expect(loadTime).toBeLessThan(100); // Should load quickly
      
      console.log(`Crypto module load time: ${loadTime.toFixed(2)}ms`);
    });

    it('should not impact main bundle significantly', async () => {
      // This test verifies that crypto operations don't slow down
      // other parts of the application
      
      const nonCryptoOperation = () => {
        return Array.from({ length: 1000 }, (_, i) => i * 2)
          .reduce((sum, val) => sum + val, 0);
      };

      // Baseline without crypto
      const baselineStart = performance.now();
      const baselineResult = nonCryptoOperation();
      const baselineTime = performance.now() - baselineStart;

      // With crypto operations running
      const cryptoPromise = crypto.encrypt(
        new TextEncoder().encode('Background crypto'),
        new Uint8Array(32).fill(42)
      );

      const withCryptoStart = performance.now();
      const withCryptoResult = nonCryptoOperation();
      const withCryptoTime = performance.now() - withCryptoStart;

      await cryptoPromise; // Ensure crypto completes

      expect(baselineResult).toBe(withCryptoResult);
      
      // Crypto shouldn't significantly impact other operations
      expect(withCryptoTime).toBeLessThan(baselineTime * 2);
      
      console.log(`Non-crypto operation: baseline ${baselineTime.toFixed(2)}ms, with crypto ${withCryptoTime.toFixed(2)}ms`);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty messages efficiently', async () => {
      const emptyMessage = new Uint8Array(0);
      const key = new Uint8Array(32).fill(1);

      const start = performance.now();
      const encrypted = await crypto.encrypt(emptyMessage, key);
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Should be very fast
      expect(decrypted.length).toBe(0);
    });

    it('should handle maximum practical message sizes', async () => {
      // Test with 1MB message (practical maximum for browser)
      const largeMessage = new Uint8Array(1024 * 1024).fill(65); // 1MB of 'A'
      const key = new Uint8Array(32).fill(255);

      const start = performance.now();
      const encrypted = await crypto.encrypt(largeMessage, key);
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // 5 seconds max for 1MB
      expect(decrypted).toEqual(largeMessage);
      
      console.log(`1MB message: ${duration.toFixed(2)}ms`);
    });
  });
}); 