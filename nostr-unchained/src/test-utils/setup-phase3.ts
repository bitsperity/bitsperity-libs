import { vi, beforeEach, afterEach } from 'vitest';
import type { NostrEvent } from '@/types';
import { SimpleEventBus } from '@/core/event-bus';

// Environment setup für Phase 3 tests
export const UMBREL_RELAY = process.env.UMBREL_RELAY || 'ws://umbrel.local:4848';
export const STORE_TEST_RELAY = process.env.STORE_TEST_RELAY || UMBREL_RELAY;

// Mock Svelte environment for testing
Object.defineProperty(global, 'window', {
  value: {
    BroadcastChannel: class MockBroadcastChannel {
      name: string;
      onmessage: ((event: MessageEvent) => void) | null = null;
      
      constructor(name: string) {
        this.name = name;
      }
      
      postMessage(data: any): void {
        // Simulate async broadcast
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { data }));
          }
        }, 10);
      }
      
      addEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') {
          this.onmessage = listener;
        }
      }
      
      removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') {
          this.onmessage = null;
        }
      }
      
      close(): void {
        this.onmessage = null;
      }
    },
    
    // Mock performance API
    performance: {
      now: () => Date.now()
    }
  },
  writable: true
});

// Mock console for cleaner test output
beforeEach(() => {
  vi.clearAllMocks();
  
  // Suppress console.debug in tests
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Test utilities for store testing
export function createMockNostrEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  const defaultEvent: NostrEvent = {
    id: `test_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pubkey: '2e7c5e9e4fcae077233a2bd44c9d2dfb010ba4d6b76d6e4b58e1c4b5e5f6e7c8',
    created_at: Math.floor(Date.now() / 1000),
    kind: 4, // DM kind
    tags: [],
    content: 'Test message content',
    sig: 'mock_signature_' + Math.random().toString(36).substr(2, 16)
  };

  return { ...defaultEvent, ...overrides };
}

export function createMockConversationEvents(count: number, participantPubkeys: string[] = []): NostrEvent[] {
  const events: NostrEvent[] = [];
  const participants = participantPubkeys.length > 0 
    ? participantPubkeys 
    : ['pubkey1', 'pubkey2'];

  for (let i = 0; i < count; i++) {
    const authorIndex = i % participants.length;
    events.push(createMockNostrEvent({
      pubkey: participants[authorIndex],
      content: `Message ${i + 1} from ${participants[authorIndex]}`,
      created_at: Math.floor(Date.now() / 1000) - (count - i) // Earlier messages have lower timestamps
    }));
  }

  return events;
}

export function createTestEventBus(): SimpleEventBus {
  return new SimpleEventBus();
}

// Relay connection testing utilities
export async function testUmbrelRelayConnection(): Promise<boolean> {
  if (typeof window === 'undefined' || !('WebSocket' in global)) {
    console.warn('WebSocket not available in test environment');
    return false;
  }

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(UMBREL_RELAY);
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          resolve(false);
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      };
    } catch (error) {
      console.warn('Failed to test Umbrel relay connection:', error);
      resolve(false);
    }
  });
}

// Performance testing utilities
export class PerformanceTracker {
  private startTime: number = 0;
  private measurements: Array<{ name: string; duration: number }> = [];

  start(): void {
    this.startTime = performance.now();
  }

  mark(name: string): void {
    const duration = performance.now() - this.startTime;
    this.measurements.push({ name, duration });
  }

  getResults(): Array<{ name: string; duration: number }> {
    return [...this.measurements];
  }

  reset(): void {
    this.measurements = [];
    this.startTime = 0;
  }

  expectLatencyUnder(name: string, maxMs: number): void {
    const measurement = this.measurements.find(m => m.name === name);
    if (!measurement) {
      throw new Error(`No measurement found for "${name}"`);
    }
    
    if (measurement.duration > maxMs) {
      throw new Error(
        `Performance expectation failed: ${name} took ${measurement.duration}ms, expected <${maxMs}ms`
      );
    }
  }
}

// Memory testing utilities
export class MemoryTracker {
  private baseline: number = 0;

  setBaseline(): void {
    // Force garbage collection if available (Node.js testing)
    if (global.gc) {
      global.gc();
    }
    this.baseline = this.getCurrentMemoryUsage();
  }

  getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Fallback for browser environment
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    return 0; // Unable to measure
  }

  getMemoryIncrease(): number {
    return this.getCurrentMemoryUsage() - this.baseline;
  }

  expectMemoryIncreaseUnder(maxBytes: number): void {
    const increase = this.getMemoryIncrease();
    if (increase > maxBytes) {
      throw new Error(
        `Memory expectation failed: memory increased by ${increase} bytes, expected <${maxBytes} bytes`
      );
    }
  }
}

// Store testing utilities
export function waitForStoreUpdate<T>(
  store: { subscribe: (callback: (value: T) => void) => () => void },
  predicate: (value: T) => boolean,
  timeoutMs: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        reject(new Error(`Store update timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    const unsubscribe = store.subscribe((value) => {
      if (!resolved && predicate(value)) {
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
        resolve(value);
      }
    });
  });
}

// Cross-tab testing utilities
export class MultiTabTester {
  private tabs: Array<{ id: string; store: any }> = [];

  addTab(id: string, store: any): void {
    this.tabs.push({ id, store });
  }

  async broadcastToAllTabs(action: (store: any) => Promise<void>): Promise<void> {
    await Promise.all(this.tabs.map(tab => action(tab.store)));
  }

  async waitForSyncAcrossTabs<T>(
    predicate: (storeValue: T) => boolean,
    timeoutMs: number = 3000
  ): Promise<T[]> {
    const results = await Promise.all(
      this.tabs.map(tab => 
        waitForStoreUpdate(tab.store, predicate, timeoutMs)
      )
    );
    
    return results;
  }

  cleanup(): void {
    this.tabs.forEach(tab => {
      if (tab.store && typeof tab.store.dispose === 'function') {
        tab.store.dispose();
      }
    });
    this.tabs = [];
  }
}

// Export test configuration
export const TEST_CONFIG = {
  UMBREL_RELAY,
  STORE_TEST_RELAY,
  MAX_TEST_MESSAGES: 100,
  PERFORMANCE_TIMEOUT_MS: 100,
  MEMORY_LIMIT_BYTES: 10 * 1024 * 1024, // 10MB
  SYNC_TIMEOUT_MS: 3000
}; 