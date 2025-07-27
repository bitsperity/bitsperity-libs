/**
 * Test Setup for nostr-unchained-app
 * 
 * Global test configuration and mocks for Vitest.
 * Follows Bitsperity test-driven development standards.
 */

import { vi } from 'vitest';

// Global test utilities
global.vi = vi;

// Mock browser APIs that aren't available in jsdom
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock crypto.subtle for Nostr key operations
Object.defineProperty(global.crypto, 'subtle', {
	value: {
		importKey: vi.fn(),
		exportKey: vi.fn(),
		generateKey: vi.fn(),
		encrypt: vi.fn(),
		decrypt: vi.fn(),
		sign: vi.fn(),
		verify: vi.fn()
	}
});

// Mock navigator for PWA features
Object.defineProperty(global.navigator, 'serviceWorker', {
	value: {
		register: vi.fn(),
		ready: Promise.resolve({
			unregister: vi.fn()
		})
	}
});

// Mock WebSocket for Nostr relay connections
global.WebSocket = vi.fn().mockImplementation(() => ({
	send: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	readyState: 1, // OPEN
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3
}));

// Test environment indicator
process.env.NODE_ENV = 'test';