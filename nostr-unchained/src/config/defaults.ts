import type { NostrUnchainedConfigDefaults } from '@/types';

/**
 * Default configuration for NostrUnchained
 * Optimized for production use with sensible defaults
 */
export const DEFAULT_CONFIG: NostrUnchainedConfigDefaults = {
  relays: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social',
    'wss://relay.nostr.info',
  ] as const,
  
  timeout: 5000, // 5 seconds
  debug: false,
  
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  } as const,
  
  limits: {
    maxConnections: 10,
    maxMessageHistory: 1000,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  } as const,
} as const;

/**
 * Validate configuration values
 */
export function validateConfig(config: Partial<NostrUnchainedConfigDefaults>): void {
  if (config.relays) {
    if (!Array.isArray(config.relays)) {
      throw new Error('relays must be an array');
    }
    
    if (config.relays.length === 0) {
      throw new Error('at least one relay must be specified');
    }
    
    for (const relay of config.relays) {
      if (typeof relay !== 'string') {
        throw new Error('relay must be a string');
      }
      
      if (!relay.startsWith('wss://') && !relay.startsWith('ws://')) {
        throw new Error('relay must be a valid WebSocket URL');
      }
    }
  }
  
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      throw new Error('timeout must be a positive number');
    }
  }
  
  if (config.debug !== undefined) {
    if (typeof config.debug !== 'boolean') {
      throw new Error('debug must be a boolean');
    }
  }
  
  if (config.retry) {
    if (typeof config.retry.maxAttempts !== 'number' || config.retry.maxAttempts < 1) {
      throw new Error('retry.maxAttempts must be a positive number');
    }
    
    if (typeof config.retry.initialDelay !== 'number' || config.retry.initialDelay < 0) {
      throw new Error('retry.initialDelay must be a non-negative number');
    }
    
    if (typeof config.retry.maxDelay !== 'number' || config.retry.maxDelay < config.retry.initialDelay) {
      throw new Error('retry.maxDelay must be greater than or equal to initialDelay');
    }
  }
  
  if (config.limits) {
    if (typeof config.limits.maxConnections !== 'number' || config.limits.maxConnections < 1) {
      throw new Error('limits.maxConnections must be a positive number');
    }
    
    if (typeof config.limits.maxMessageHistory !== 'number' || config.limits.maxMessageHistory < 1) {
      throw new Error('limits.maxMessageHistory must be a positive number');
    }
    
    if (typeof config.limits.maxMemoryUsage !== 'number' || config.limits.maxMemoryUsage < 1) {
      throw new Error('limits.maxMemoryUsage must be a positive number');
    }
  }
}

/**
 * Merge user configuration with defaults
 */
export function mergeConfig(userConfig: Partial<NostrUnchainedConfigDefaults> = {}): NostrUnchainedConfigDefaults {
  validateConfig(userConfig);
  
  return {
    relays: userConfig.relays ?? DEFAULT_CONFIG.relays,
    timeout: userConfig.timeout ?? DEFAULT_CONFIG.timeout,
    debug: userConfig.debug ?? DEFAULT_CONFIG.debug,
    retry: {
      maxAttempts: userConfig.retry?.maxAttempts ?? DEFAULT_CONFIG.retry.maxAttempts,
      initialDelay: userConfig.retry?.initialDelay ?? DEFAULT_CONFIG.retry.initialDelay,
      maxDelay: userConfig.retry?.maxDelay ?? DEFAULT_CONFIG.retry.maxDelay,
    },
    limits: {
      maxConnections: userConfig.limits?.maxConnections ?? DEFAULT_CONFIG.limits.maxConnections,
      maxMessageHistory: userConfig.limits?.maxMessageHistory ?? DEFAULT_CONFIG.limits.maxMessageHistory,
      maxMemoryUsage: userConfig.limits?.maxMemoryUsage ?? DEFAULT_CONFIG.limits.maxMemoryUsage,
    },
  };
} 