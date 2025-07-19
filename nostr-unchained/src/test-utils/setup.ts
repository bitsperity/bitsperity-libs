import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

// Global state für window.nostr Mock
let originalWindowNostr: any;

beforeEach(() => {
  // Save original window.nostr if it exists
  if (typeof window !== 'undefined') {
    originalWindowNostr = (window as any).nostr;
  }
});

// Cleanup nach jedem Test
afterEach(() => {
  // Restore original window.nostr
  if (typeof window !== 'undefined') {
    if (originalWindowNostr) {
      (window as any).nostr = originalWindowNostr;
    } else {
      delete (window as any).nostr;
    }
  }
});

// Test-Utilities mit korrekten Mocks
export const TestUtils = {
  mockNip07Extension: (hasExtension = true) => {
    if (typeof window === 'undefined') {
      // Create minimal window object for Node.js tests
      (global as any).window = {};
    }

    if (hasExtension) {
      // Mock complete NIP-07 interface
      (window as any).nostr = {
        getPublicKey: () => Promise.resolve('test-pubkey-' + Date.now()),
        signEvent: (event: any) => Promise.resolve({
          ...event,
          sig: 'test-signature-' + Date.now()
        }),
        nip04: {
          encrypt: (pubkey: string, plaintext: string) => Promise.resolve('encrypted-' + plaintext),
          decrypt: (pubkey: string, ciphertext: string) => Promise.resolve('decrypted-' + ciphertext),
        }
      };
    } else {
      // Remove or disable window.nostr
      delete (window as any).nostr;
    }
    return hasExtension;
  },

  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  createTestEvent: (kind = 1, content = 'test content', extraData: any = {}) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = TestUtils.generateEventId();
    
    return {
      id: eventId,
      pubkey: extraData.pubkey || 'test-pubkey-' + timestamp,
      created_at: timestamp,
      kind,
      tags: extraData.tags || [],
      content,
      sig: 'test-signature-' + timestamp,
      ...extraData
    };
  },

  // Generate deterministic but unique event IDs
  generateEventId: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `test-event-${timestamp}-${random}`;
  },

  // Create proper Nostr event with all required fields
  createValidNostrEvent: (overrides: any = {}) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = TestUtils.generateEventId();
    
    return {
      id: eventId,
      pubkey: overrides.pubkey || 'npub1test' + timestamp,
      created_at: overrides.created_at || timestamp,
      kind: overrides.kind || 1,
      tags: overrides.tags || [],
      content: overrides.content || 'Test message content',
      sig: overrides.sig || 'test-sig-' + timestamp,
      ...overrides
    };
  },
}; 