import { vi, beforeEach, afterEach } from 'vitest';

// Mock WebCrypto API für Node.js Test-Umgebung
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      // Use Node.js crypto für echte Zufallszahlen
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    }
  }
});

// Setup für Crypto-Tests
beforeEach(() => {
  // Clear any mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup
  vi.restoreAllMocks();
});

// Crypto-specific test utilities
export const TEST_VECTORS = {
  // Standard test key (32 bytes)
  testKey: new Uint8Array([
    0x31, 0x5f, 0x80, 0x26, 0x2d, 0x36, 0xb0, 0xb8,
    0x1d, 0x28, 0xf6, 0xca, 0x9f, 0x1e, 0x0e, 0x7a,
    0xc1, 0x3c, 0x05, 0x3f, 0xf1, 0xf7, 0x1e, 0x0f,
    0x35, 0xc0, 0xb1, 0x7c, 0xac, 0x4e, 0x4e, 0x9b
  ]),
  
  // Standard test nonce (12 bytes)
  testNonce: new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
    0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c
  ]),
  
  // Test message
  testMessage: new TextEncoder().encode('Hello, NIP-44 World!')
};