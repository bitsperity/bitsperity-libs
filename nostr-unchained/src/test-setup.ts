/**
 * Global test setup for Nostr Unchained
 * 
 * This file runs before all tests to set up the test environment
 */

// Global test utilities
global.testUtils = {
  generateMockPubkey: () => 'npub1test123456789abcdef...',
  generateMockEventId: () => 'event123456789abcdef...',
  createMockNostrEvent: (overrides = {}) => ({
    id: 'mock-event-id',
    pubkey: 'mock-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: 'Mock event content',
    sig: 'mock-signature',
    ...overrides
  })
};

// Mock console for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  // Suppress console.log in tests unless explicitly needed
  log: process.env.TEST_VERBOSE ? originalConsole.log : () => {},
  // Keep errors and warnings
  error: originalConsole.error,
  warn: originalConsole.warn,
  info: process.env.TEST_VERBOSE ? originalConsole.info : () => {}
};

// Global test timeout
import { vi } from 'vitest';

vi.setConfig({
  testTimeout: 10000
});

declare global {
  const testUtils: {
    generateMockPubkey: () => string;
    generateMockEventId: () => string;
    createMockNostrEvent: (overrides?: any) => any;
  };
}