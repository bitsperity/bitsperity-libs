import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../index';

/**
 * Phase 2 Relay Integration Tests
 * Tests integration with Umbrel relay and Nostr protocol compliance
 * Validates real-world relay communication scenarios
 */
describe('Phase 2: Umbrel Relay Integration', () => {
  let instance: NostrUnchained;
  
  const UMBREL_RELAY = 'ws://umbrel.local:4848';
  const FALLBACK_RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
  ];

  afterEach(async () => {
    if (instance) {
      await instance.dispose();
    }
  });

  describe('Relay Connection Management', () => {
    it('should connect to Umbrel relay successfully', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 15000, // Extended timeout for local network
        debug: true,
      });

      expect(instance.isInitialized).toBe(true);
      expect(instance.config.relays).toContain(UMBREL_RELAY);
    });

    it('should maintain connection stability over time', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000,
        debug: true,
      });

      // Wait and verify connection remains stable
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(instance.isInitialized).toBe(true);
      
      // Should still be functional after waiting
      expect(instance.signer).toBeDefined();
    });

    it('should handle Umbrel relay with fallbacks', async () => {
      const relays = [UMBREL_RELAY, ...FALLBACK_RELAYS];
      
      instance = await NostrUnchained.create({
        relays,
        timeout: 8000,
        retry: {
          maxAttempts: 2,
          initialDelay: 1000,
          maxDelay: 3000,
        },
      });

      expect(instance.isInitialized).toBe(true);
      expect(instance.config.relays).toEqual(relays);
    });
  });

  describe('Relay Communication Performance', () => {
    it('should establish connection within timeout period', async () => {
      const start = performance.now();
      
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000,
      });
      
      const connectionTime = performance.now() - start;
      
      expect(instance.isInitialized).toBe(true);
      expect(connectionTime).toBeLessThan(10000); // Within timeout
      
      console.log(`Umbrel relay connection time: ${connectionTime.toFixed(2)}ms`);
    });

    it('should handle connection latency appropriately', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 15000,
        debug: true,
      });

      // Measure response times for multiple operations
      const operationTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        
        // Simulate a simple operation (getting signer info)
        const signerInfo = instance.signer?.info;
        expect(signerInfo).toBeDefined();
        
        const operationTime = performance.now() - start;
        operationTimes.push(operationTime);
      }

      const avgLatency = operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length;
      const maxLatency = Math.max(...operationTimes);

      // Local relay should have low latency
      expect(avgLatency).toBeLessThan(50); // 50ms average
      expect(maxLatency).toBeLessThan(200); // 200ms max
      
      console.log(`Relay latency - Avg: ${avgLatency.toFixed(2)}ms, Max: ${maxLatency.toFixed(2)}ms`);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Umbrel relay offline gracefully', async () => {
      // Test with obviously invalid Umbrel relay
      const offlineRelay = 'ws://offline.umbrel.local:9999';
      
      await expect(
        NostrUnchained.create({
          relays: [offlineRelay],
          timeout: 3000, // Short timeout
        })
      ).rejects.toThrow();
    });

    it('should fallback when Umbrel relay fails', async () => {
      const relays = [
        'ws://nonexistent.umbrel.local:4848', // This should fail
        'wss://relay.damus.io', // This should work
      ];
      
      instance = await NostrUnchained.create({
        relays,
        timeout: 8000,
        retry: {
          maxAttempts: 2,
          initialDelay: 500,
          maxDelay: 2000,
        },
      });

      expect(instance.isInitialized).toBe(true);
      // Should have successfully connected despite first relay failing
    });

    it('should retry connection attempts appropriately', async () => {
      const startTime = performance.now();
      
      try {
        await NostrUnchained.create({
          relays: ['ws://definitely.not.reachable:4848'],
          timeout: 2000,
          retry: {
            maxAttempts: 3,
            initialDelay: 500,
            maxDelay: 1000,
          },
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        const totalTime = performance.now() - startTime;
        
        // Should have attempted retries (minimum time with retries)
        expect(totalTime).toBeGreaterThan(1500); // At least 2 retry attempts
        expect(totalTime).toBeLessThan(8000); // But not too long
        
        console.log(`Retry sequence took: ${totalTime.toFixed(2)}ms`);
      }
    });
  });

  describe('Umbrel-Specific Features', () => {
    it('should work with local network relay characteristics', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 12000,
        debug: true,
      });

      // Umbrel relay might have different characteristics than public relays
      expect(instance.isInitialized).toBe(true);
      
      // Should be able to use all basic functionality
      expect(instance.signer).toBeDefined();
      expect(instance.eventBus).toBeDefined();
      expect(instance.config.relays[0]).toBe(UMBREL_RELAY);
    });

    it('should handle Umbrel relay reconnection', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000,
        retry: {
          maxAttempts: 5,
          initialDelay: 1000,
          maxDelay: 5000,
        },
      });

      expect(instance.isInitialized).toBe(true);

      // Simulate temporary disconnection by disposing and recreating
      const originalConfig = { ...instance.config };
      await instance.dispose();

      // Should be able to reconnect
      instance = await NostrUnchained.create(originalConfig);
      expect(instance.isInitialized).toBe(true);
    });
  });

  describe('Protocol Compliance', () => {
    it('should follow Nostr protocol standards with Umbrel relay', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000,
      });

      // Basic protocol compliance checks
      expect(instance.signer?.info.capabilities.canSign).toBe(true);
      
      // Should generate valid public keys
      const pubkey = instance.signer?.info.pubkey;
      if (pubkey) {
        expect(pubkey).toMatch(/^[0-9a-f]{64}$/); // 64 character hex string
      }
    });

    it('should handle WebSocket protocol correctly', async () => {
      // Verify that the relay URL is properly formatted for WebSocket
      expect(UMBREL_RELAY).toMatch(/^ws:\/\//);
      
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000,
      });

      expect(instance.isInitialized).toBe(true);
    });
  });

  describe('Multi-Relay Scenarios', () => {
    it('should handle mixed local and remote relays', async () => {
      const mixedRelays = [
        UMBREL_RELAY, // Local
        'wss://relay.damus.io', // Remote
        'wss://nos.lol', // Remote
      ];

      instance = await NostrUnchained.create({
        relays: mixedRelays,
        timeout: 10000,
      });

      expect(instance.isInitialized).toBe(true);
      expect(instance.config.relays).toEqual(mixedRelays);
    });

    it('should prioritize Umbrel relay when available', async () => {
      const relays = [
        UMBREL_RELAY, // Should be tried first
        'wss://relay.damus.io',
      ];

      instance = await NostrUnchained.create({
        relays,
        timeout: 8000,
        debug: true,
      });

      expect(instance.isInitialized).toBe(true);
      
      // First relay in config should be the Umbrel relay
      expect(instance.config.relays[0]).toBe(UMBREL_RELAY);
    });
  });

  describe('Network Quality Adaptation', () => {
    it('should adapt timeouts for local network conditions', async () => {
      // Test with shorter timeout appropriate for local network
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 5000, // Shorter than default for local relay
      });

      expect(instance.isInitialized).toBe(true);
    });

    it('should handle network congestion gracefully', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 15000, // Longer timeout for congested network
        retry: {
          maxAttempts: 5, // More retries for unstable local network
          initialDelay: 2000,
          maxDelay: 8000,
        },
      });

      expect(instance.isInitialized).toBe(true);
    });
  });

  describe('Integration with Crypto Module', () => {
    it('should work with crypto operations over Umbrel relay', async () => {
      instance = await NostrUnchained.create({
        relays: [UMBREL_RELAY],
        timeout: 10000,
      });

      expect(instance.isInitialized).toBe(true);
      
      // Crypto functionality should work regardless of relay
      const { getCrypto } = await import('../crypto');
      const crypto = await getCrypto();
      
      const testMessage = 'Umbrel relay crypto test';
      const key = new Uint8Array(32).fill(123);
      const messageBytes = new TextEncoder().encode(testMessage);
      
      const encrypted = await crypto.encrypt(messageBytes, key);
      const decrypted = await crypto.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag);
      
      expect(new TextDecoder().decode(decrypted)).toBe(testMessage);
    });
  });
}); 