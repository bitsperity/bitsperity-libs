import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained, createBuilder } from '../index';
import { TestUtils } from '../test-utils/setup';

describe('NostrUnchained Foundation Layer', () => {
  let instance: NostrUnchained;

  afterEach(async () => {
    if (instance) {
      await instance.dispose();
    }
  });

  describe('Basic Initialization', () => {
    it('should initialize with default configuration', async () => {
      instance = await NostrUnchained.create();
      
      expect(instance.isInitialized).toBe(true);
      expect(instance.config).toBeDefined();
      expect(instance.config.relays).toEqual([
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.snort.social',
        'wss://relay.nostr.info',
      ]);
      expect(instance.config.timeout).toBe(5000);
      expect(instance.config.debug).toBe(false);
    });

    it('should initialize with custom configuration', async () => {
      const customConfig = {
        relays: ['wss://custom.relay'],
        timeout: 10000,
        debug: true,
      };

      instance = await NostrUnchained.create(customConfig);
      
      expect(instance.config.relays).toEqual(['wss://custom.relay']);
      expect(instance.config.timeout).toBe(10000);
      expect(instance.config.debug).toBe(true);
    });

    it('should initialize in <200ms', async () => {
      const start = performance.now();
      instance = await NostrUnchained.create();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(200);
      expect(instance.isInitialized).toBe(true);
    });
  });

  describe('Builder Pattern', () => {
    it('should create instance with builder pattern', async () => {
      instance = await createBuilder()
        .withRelays(['wss://test.relay'])
        .withTimeout(3000)
        .withDebug(true)
        .create();

      expect(instance.config.relays).toEqual(['wss://test.relay']);
      expect(instance.config.timeout).toBe(3000);
      expect(instance.config.debug).toBe(true);
    });

    it('should chain builder methods fluently', async () => {
      const builder = createBuilder();
      
      const result = builder
        .withRelays(['wss://relay1.com', 'wss://relay2.com'])
        .withTimeout(8000)
        .withDebug(false)
        .withRetry({ maxAttempts: 5, initialDelay: 2000, maxDelay: 15000 })
        .withLimits({ maxConnections: 15, maxMessageHistory: 2000, maxMemoryUsage: 100 * 1024 * 1024 });

      expect(result).toBe(builder); // Fluent interface
      
      instance = await result.create();
      expect(instance.config.retry.maxAttempts).toBe(5);
      expect(instance.config.limits.maxConnections).toBe(15);
    });
  });

  describe('Signer Management', () => {
    it('should use NIP-07 signer when available', async () => {
      TestUtils.mockNip07Extension(true);
      
      instance = await NostrUnchained.create();
      
      expect(instance.signer).toBeDefined();
      expect(instance.signer!.info.type).toBe('nip07');
      expect(instance.signer!.info.capabilities.supportsNip07).toBe(true);
    });

    it('should fallback to temporary signer when NIP-07 not available', async () => {
      TestUtils.mockNip07Extension(false);
      
      instance = await NostrUnchained.create();
      
      expect(instance.signer).toBeDefined();
      expect(instance.signer!.info.type).toBe('temporary');
      expect(instance.signer!.info.capabilities.supportsNip07).toBe(false);
    });

    it('should provide signer capabilities', async () => {
      TestUtils.mockNip07Extension(true);
      
      instance = await NostrUnchained.create();
      
      const capabilities = instance.signer!.info.capabilities;
      expect(capabilities.canSign).toBe(true);
      expect(capabilities.canEncrypt).toBeDefined();
      expect(capabilities.canDecrypt).toBeDefined();
    });
  });

  describe('Event Bus', () => {
    it('should emit initialization events', async () => {
      const events: string[] = [];
      
      instance = new NostrUnchained();
      
      instance.eventBus.on('initialization:started', () => {
        events.push('started');
      });
      
      instance.eventBus.on('initialization:completed', () => {
        events.push('completed');
      });
      
      await instance.initialize();
      
      expect(events).toEqual(['started', 'completed']);
    });

    it('should provide signer information in events', async () => {
      TestUtils.mockNip07Extension(true);
      
      let signerInfo: any;
      instance = new NostrUnchained();
      
      instance.eventBus.on('signer:initialized', (data) => {
        signerInfo = data;
      });
      
      await instance.initialize();
      
      expect(signerInfo).toBeDefined();
      expect(signerInfo.type).toBe('nip07');
      expect(signerInfo.capabilities).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', async () => {
      instance = await NostrUnchained.create();
      
      expect(instance.isInitialized).toBe(true);
      
      await instance.dispose();
      
      expect(instance.isInitialized).toBe(false);
      expect(instance.signer).toBeNull();
    });

    it('should handle multiple dispose calls gracefully', async () => {
      instance = await NostrUnchained.create();
      
      await instance.dispose();
      await instance.dispose(); // Second dispose should not throw
      
      expect(instance.isInitialized).toBe(false);
    });

    it('should emit disposal events', async () => {
      const events: string[] = [];
      
      instance = await NostrUnchained.create();
      
      instance.eventBus.on('disposal:started', () => {
        events.push('disposal:started');
      });
      
      await instance.dispose();
      
      expect(events).toContain('disposal:started');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate relay URLs', async () => {
      await expect(
        NostrUnchained.create({ relays: ['invalid-url'] })
      ).rejects.toThrow('relay must be a valid WebSocket URL');
    });

    it('should validate timeout values', async () => {
      await expect(
        NostrUnchained.create({ timeout: -1 })
      ).rejects.toThrow('timeout must be a positive number');
    });

    it('should validate retry configuration', async () => {
      await expect(
        NostrUnchained.create({ 
          retry: { maxAttempts: 0, initialDelay: 1000, maxDelay: 5000 } 
        })
      ).rejects.toThrow('retry.maxAttempts must be a positive number');
    });

    it('should validate limits configuration', async () => {
      await expect(
        NostrUnchained.create({ 
          limits: { maxConnections: 0, maxMessageHistory: 1000, maxMemoryUsage: 1000 } 
        })
      ).rejects.toThrow('limits.maxConnections must be a positive number');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock a failing signer
      TestUtils.mockNip07Extension(false);
      
      // Override crypto.getRandomValues to simulate failure
      const originalGetRandomValues = global.crypto.getRandomValues;
      global.crypto.getRandomValues = () => {
        throw new Error('Crypto not available');
      };
      
      try {
        await expect(NostrUnchained.create()).rejects.toThrow('Failed to initialize NostrUnchained');
      } finally {
        global.crypto.getRandomValues = originalGetRandomValues;
      }
    });
  });
}); 