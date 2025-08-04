/**
 * Test Setup for Vitest
 * Global test configuration and utilities
 */

// Polyfill WebSocket for Node.js testing
import WebSocket from 'ws';

// Make WebSocket available globally for tests
global.WebSocket = WebSocket as any;

// Setup test timeout defaults
export const TEST_TIMEOUT = 15000;
export const RELAY_TIMEOUT = 10000;