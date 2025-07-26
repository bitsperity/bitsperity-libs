/**
 * Default configuration and constants
 * 
 * Based on test requirements and best practices
 */

// Default relay configuration
// Prioritizes local relay for testing, with public relays as fallbacks
export const DEFAULT_RELAYS = [
  'ws://umbrel.local:4848',      // Local testing relay (highest priority)
  'wss://relay.damus.io'         // Single public relay fallback
];

// Timeouts and retry configuration
export const DEFAULT_CONFIG = {
  RELAY_TIMEOUT: 10000,          // 10 seconds
  PUBLISH_TIMEOUT: 30000,        // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,             // 1 second
  MAX_CONTENT_LENGTH: 8192,      // Reasonable content limit
  CONNECTION_TIMEOUT: 10000      // 10 seconds for initial connection
};

// Event kinds (NIP-01)
export const EVENT_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  ENCRYPTED_DM: 4,
  DELETE: 5
} as const;

// Error messages
export const ERROR_MESSAGES = {
  EMPTY_CONTENT: 'Content cannot be empty',
  CONTENT_TOO_LONG: 'Content too long',
  NO_RELAYS: 'No relays configured',
  CONNECTION_FAILED: 'Failed to connect to relay',
  SIGNING_FAILED: 'Failed to sign event',
  PUBLISH_FAILED: 'Failed to publish to any relay',
  NO_EXTENSION: 'No browser extension available',
  INVALID_EVENT: 'Invalid event structure'
};

// Success messages and suggestions
export const SUGGESTIONS = {
  EMPTY_CONTENT: 'Add some content to your message',
  CONTENT_TOO_LONG: `Keep your message under ${DEFAULT_CONFIG.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: 'Check your internet connection and try again',
  NO_EXTENSION: 'Install a Nostr browser extension or the library will use a temporary key',
  PUBLISH_FAILED: 'Try again or check if your relays are accessible'
};

// Regex patterns for validation
export const VALIDATION_PATTERNS = {
  HEX_64: /^[a-f0-9]{64}$/,      // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,    // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/  // WebSocket URLs
};