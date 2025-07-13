import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, validateConfig, mergeConfig } from '../config/defaults';
import { ConfigurationError } from '../types';

describe('Configuration Management', () => {
  describe('Default Configuration', () => {
    it('should provide sensible defaults', () => {
      expect(DEFAULT_CONFIG.relays).toHaveLength(4);
      expect(DEFAULT_CONFIG.timeout).toBe(5000);
      expect(DEFAULT_CONFIG.debug).toBe(false);
      expect(DEFAULT_CONFIG.retry.maxAttempts).toBe(3);
      expect(DEFAULT_CONFIG.limits.maxConnections).toBe(10);
    });

    it('should have valid relay URLs', () => {
      for (const relay of DEFAULT_CONFIG.relays) {
        expect(relay).toMatch(/^wss:\/\//);
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should validate relay URLs', () => {
      expect(() => validateConfig({ relays: ['invalid'] }))
        .toThrow('relay must be a valid WebSocket URL');
      
      expect(() => validateConfig({ relays: ['http://invalid.com'] }))
        .toThrow('relay must be a valid WebSocket URL');
      
      expect(() => validateConfig({ relays: ['wss://valid.com'] }))
        .not.toThrow();
    });

    it('should validate relay array', () => {
      expect(() => validateConfig({ relays: [] }))
        .toThrow('at least one relay must be specified');
      
      expect(() => validateConfig({ relays: 'invalid' as any }))
        .toThrow('relays must be an array');
      
      expect(() => validateConfig({ relays: [123] as any }))
        .toThrow('relay must be a string');
    });

    it('should validate timeout', () => {
      expect(() => validateConfig({ timeout: -1 }))
        .toThrow('timeout must be a positive number');
      
      expect(() => validateConfig({ timeout: 0 }))
        .toThrow('timeout must be a positive number');
      
      expect(() => validateConfig({ timeout: 'invalid' as any }))
        .toThrow('timeout must be a positive number');
      
      expect(() => validateConfig({ timeout: 5000 }))
        .not.toThrow();
    });

    it('should validate debug flag', () => {
      expect(() => validateConfig({ debug: 'invalid' as any }))
        .toThrow('debug must be a boolean');
      
      expect(() => validateConfig({ debug: true }))
        .not.toThrow();
      
      expect(() => validateConfig({ debug: false }))
        .not.toThrow();
    });

    it('should validate retry configuration', () => {
      expect(() => validateConfig({ 
        retry: { maxAttempts: 0, initialDelay: 1000, maxDelay: 5000 } 
      })).toThrow('retry.maxAttempts must be a positive number');
      
      expect(() => validateConfig({ 
        retry: { maxAttempts: 3, initialDelay: -1, maxDelay: 5000 } 
      })).toThrow('retry.initialDelay must be a non-negative number');
      
      expect(() => validateConfig({ 
        retry: { maxAttempts: 3, initialDelay: 5000, maxDelay: 1000 } 
      })).toThrow('retry.maxDelay must be greater than or equal to initialDelay');
    });

    it('should validate limits configuration', () => {
      expect(() => validateConfig({ 
        limits: { maxConnections: 0, maxMessageHistory: 1000, maxMemoryUsage: 1000 } 
      })).toThrow('limits.maxConnections must be a positive number');
      
      expect(() => validateConfig({ 
        limits: { maxConnections: 10, maxMessageHistory: 0, maxMemoryUsage: 1000 } 
      })).toThrow('limits.maxMessageHistory must be a positive number');
      
      expect(() => validateConfig({ 
        limits: { maxConnections: 10, maxMessageHistory: 1000, maxMemoryUsage: 0 } 
      })).toThrow('limits.maxMemoryUsage must be a positive number');
    });
  });

  describe('Configuration Merging', () => {
    it('should merge with defaults', () => {
      const config = mergeConfig({ timeout: 8000 });
      
      expect(config.timeout).toBe(8000);
      expect(config.debug).toBe(DEFAULT_CONFIG.debug);
      expect(config.relays).toEqual(DEFAULT_CONFIG.relays);
    });

    it('should merge nested objects', () => {
      const config = mergeConfig({ 
        retry: { maxAttempts: 5, initialDelay: 2000, maxDelay: 20000 } 
      });
      
      expect(config.retry.maxAttempts).toBe(5);
      expect(config.retry.initialDelay).toBe(2000);
      expect(config.retry.maxDelay).toBe(20000);
    });

    it('should merge partial nested objects', () => {
      const config = mergeConfig({ 
        retry: { maxAttempts: 5 } 
      });
      
      expect(config.retry.maxAttempts).toBe(5);
      expect(config.retry.initialDelay).toBe(DEFAULT_CONFIG.retry.initialDelay);
      expect(config.retry.maxDelay).toBe(DEFAULT_CONFIG.retry.maxDelay);
    });

    it('should validate merged configuration', () => {
      expect(() => mergeConfig({ timeout: -1 }))
        .toThrow('timeout must be a positive number');
    });

    it('should handle empty configuration', () => {
      const config = mergeConfig({});
      
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should handle undefined configuration', () => {
      const config = mergeConfig(undefined);
      
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });
}); 