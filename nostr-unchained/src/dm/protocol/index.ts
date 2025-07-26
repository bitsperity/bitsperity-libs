/**
 * NIP-59 Gift Wrap Protocol Exports
 * 
 * Main entry point for the 3-layer encryption system implementation.
 */

// Main protocol orchestrator
export { GiftWrapProtocol } from './GiftWrapProtocol.js';

// Individual component creators
export { SealCreator } from './SealCreator.js';
export { GiftWrapCreator } from './GiftWrapCreator.js';

// Utility components
export { EphemeralKeyManager } from './EphemeralKeyManager.js';
export { TimestampRandomizer } from './TimestampRandomizer.js';

// Types and interfaces
export * from '../types/nip59-types.js';

// Re-export NIP-44 crypto for convenience
export { NIP44Crypto } from '../crypto/NIP44Crypto.js';
export * from '../types/crypto-types.js';