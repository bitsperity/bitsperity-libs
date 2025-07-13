import { beforeEach, afterEach, vi } from 'vitest';

// DOM polyfills für jsdom environment
global.crypto = {
  ...global.crypto,
  subtle: {
    digest: vi.fn(),
    generateKey: vi.fn(),
    importKey: vi.fn(),
    exportKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
  },
  getRandomValues: vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
} as unknown as Crypto;

// WebSocket mock für tests
class MockWebSocket {
  public readonly CONNECTING = 0;
  public readonly OPEN = 1;
  public readonly CLOSING = 2;
  public readonly CLOSED = 3;
  public readyState = this.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = this.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  public send(_data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    // Mock implementation
  }

  public close(): void {
    this.readyState = this.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// BroadcastChannel mock für cross-tab testing
class MockBroadcastChannel {
  constructor(public name: string) {}
  
  public postMessage(_data: unknown): void {
    // Mock implementation
  }
  
  public close(): void {
    // Mock implementation
  }
  
  public onmessage: ((event: MessageEvent) => void) | null = null;
}

// Global mocks setup
beforeEach(() => {
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  global.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
  
  // NIP-07 extension mock
  global.window = {
    ...global.window,
    nostr: {
      getPublicKey: vi.fn(),
      signEvent: vi.fn(),
      getRelays: vi.fn(),
      nip04: {
        encrypt: vi.fn(),
        decrypt: vi.fn(),
      },
    },
  } as unknown as Window & typeof globalThis;
});

// Cleanup nach jedem Test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Test utilities
export const TestUtils = {
  // Simuliere NIP-07 extension presence
  mockNip07Extension: (hasExtension = true) => {
    if (hasExtension) {
      global.window.nostr = {
        getPublicKey: vi.fn().mockResolvedValue('test-pubkey'),
        signEvent: vi.fn().mockResolvedValue({ sig: 'test-signature' }),
        getRelays: vi.fn().mockResolvedValue({}),
        nip04: {
          encrypt: vi.fn().mockResolvedValue('encrypted'),
          decrypt: vi.fn().mockResolvedValue('decrypted'),
        },
      };
    } else {
      delete global.window.nostr;
    }
  },

  // Simuliere WebSocket connection
  mockWebSocketConnection: (shouldSucceed = true) => {
    const originalWebSocket = global.WebSocket;
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        if (shouldSucceed) {
          setTimeout(() => {
            this.readyState = this.OPEN;
            this.onopen?.(new Event('open'));
          }, 0);
        } else {
          setTimeout(() => {
            this.readyState = this.CLOSED;
            this.onerror?.(new Event('error'));
          }, 0);
        }
      }
    } as unknown as typeof WebSocket;
    return originalWebSocket;
  },

  // Warte auf async operations
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Generiere test event
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