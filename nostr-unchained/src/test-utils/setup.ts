import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Cleanup nach jedem Test
afterEach(() => {
  // Grundlegendes Cleanup - keine React-spezifischen Dependencies nötig
});

// Einfache Test-Utilities ohne komplexe Mocks
export const TestUtils = {
  mockNip07Extension: (hasExtension = true) => {
    return hasExtension;
  },

  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  createTestEvent: (kind = 1, content = 'test content') => ({
    id: 'test-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags: [],
    content,
    sig: 'test-signature',
  }),
}; 