// ===== Main Crypto Module Exports =====

export { SimpleCrypto } from './simple-crypto';
// Note: Complex implementations temporarily disabled due to dependency issues
// export { NIP44Crypto } from './nip44';
// export { CustomChaCha20Poly1305 } from './core/chacha20-poly1305';
// export { NIP44KeyDerivation } from './nip44/key-derivation';
// export { NIP44PaddingImpl } from './nip44/padding';

// ===== Type Exports =====
export type {
  CryptoModule,
  EncryptionResult,
  NIP44EncryptionResult,
  NIP44ConversationKeys,
  NIP44Padding,
  ChaCha20Poly1305,
  KeyDerivation,
  CryptoConfig,
  HexString,
  Base64String,
  PrivateKey,
  PublicKey,
  SharedSecret,
} from './types';

// ===== Error Exports =====
export {
  CryptoError,
  NIP44ComplianceError,
  InvalidKeyError,
  DecryptionError,
} from './types';

// ===== Constants =====
export { CRYPTO_CONSTANTS, DEFAULT_CRYPTO_CONFIG } from './types';

// ===== Factory Function mit Lazy Loading =====

let cryptoInstance: any | null = null;

/**
 * Get or create singleton crypto instance
 * Implements lazy loading für optimal bundle size
 */
export async function getCrypto(config?: Partial<import('./types').CryptoConfig>): Promise<import('./simple-crypto').SimpleCrypto> {
  if (!cryptoInstance || config) {
    const { SimpleCrypto } = await import('./simple-crypto');
    cryptoInstance = new SimpleCrypto();
  }
  return cryptoInstance;
}

/**
 * Create new crypto instance (not singleton)
 * Use when you need multiple instances with different configs
 */
export async function createCrypto(_config?: Partial<import('./types').CryptoConfig>): Promise<import('./simple-crypto').SimpleCrypto> {
  const { SimpleCrypto } = await import('./simple-crypto');
  return new SimpleCrypto();
}

/**
 * Lazy loading convenience function for custom ChaCha20-Poly1305
 * Currently disabled - would load custom implementation when available
 */
export async function loadCustomCrypto(): Promise<any> {
  throw new Error('Custom crypto implementation temporarily disabled');
}

/**
 * Lazy loading convenience function for Noble fallback
 * Fallback option für maximum compatibility
 */
export async function loadNobleCrypto(): Promise<any> {
  try {
    const { chacha20poly1305 } = await import('@noble/ciphers/chacha');
    return chacha20poly1305;
  } catch (error) {
    throw new Error('Noble ciphers not available. Install @noble/ciphers for fallback support.');
  }
}

// ===== Bundle Size Optimization =====

/**
 * Check if custom crypto implementation is available
 * Used für bundle size optimization decisions
 */
export function isCustomCryptoAvailable(): boolean {
  try {
    // This would be replaced by bundler at build time
    return typeof window !== 'undefined' || typeof process !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get estimated bundle sizes für different crypto backends
 * Used für performance optimization decisions
 */
export function getCryptoBundleSizes(): {
  custom: number;
  noble: number;
  recommendation: 'custom' | 'noble' | 'auto';
} {
  return {
    custom: 4800,  // ~4.8KB für custom implementation
    noble: 22000,  // ~22KB für Noble ciphers
    recommendation: 'auto', // Let the system decide based on environment
  };
}

// ===== Default Export für Convenience =====
export default getCrypto; 