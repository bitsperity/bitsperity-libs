// ===== Core Crypto Types =====

export interface CryptoModule {
  encrypt(plaintext: Uint8Array, key: Uint8Array, nonce?: Uint8Array): Promise<EncryptionResult>;
  decrypt(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array, tag?: Uint8Array): Promise<Uint8Array>;
  deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array>;
  deriveConversationKey(sharedSecret: Uint8Array): Promise<Uint8Array>;
  generateNonce(): Uint8Array;
  constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean;
}

export interface EncryptionResult {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  tag: Uint8Array;
}

// ===== NIP-44 Specific Types =====

export interface NIP44EncryptionResult {
  ciphertext: string; // Base64 encoded
  format: 'nip44-v2';
}

export interface NIP44ConversationKeys {
  chacha_key: Uint8Array; // 32 bytes for ChaCha20
  chacha_nonce: Uint8Array; // 12 bytes for ChaCha20
  hmac_key: Uint8Array; // 32 bytes for Poly1305
}

export interface NIP44Padding {
  unpad(padded: Uint8Array): Uint8Array;
  pad(message: Uint8Array): Uint8Array;
}

// ===== ChaCha20-Poly1305 Types =====

export interface ChaCha20Poly1305 {
  encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
    additionalData?: Uint8Array
  ): Promise<EncryptionResult>;
  
  decrypt(
    ciphertext: Uint8Array,
    tag: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
    additionalData?: Uint8Array
  ): Promise<Uint8Array>;
}

// ===== Key Derivation Types =====

export interface KeyDerivation {
  hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array>;
  hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array>;
  deriveNIP44Keys(sharedSecret: Uint8Array): Promise<NIP44ConversationKeys>;
}

// ===== Error Types =====

export class CryptoError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

export class NIP44ComplianceError extends CryptoError {
  constructor(message: string) {
    super(message, 'NIP44_COMPLIANCE');
  }
}

export class InvalidKeyError extends CryptoError {
  constructor(message: string) {
    super(message, 'INVALID_KEY');
  }
}

export class DecryptionError extends CryptoError {
  constructor(message: string) {
    super(message, 'DECRYPTION_FAILED');
  }
}

// ===== Configuration Types =====

export interface CryptoConfig {
  backend: 'custom' | 'noble' | 'auto';
  bundleOptimization: boolean;
  lazyLoading: boolean;
  securityLevel: 'standard' | 'high' | 'maximum';
  timingAttackResistance: boolean;
}

export const DEFAULT_CRYPTO_CONFIG: CryptoConfig = {
  backend: 'auto',
  bundleOptimization: true,
  lazyLoading: true,
  securityLevel: 'high',
  timingAttackResistance: true,
};

// ===== Utility Types =====

export type HexString = string;
export type Base64String = string;
export type PrivateKey = Uint8Array;
export type PublicKey = Uint8Array;
export type SharedSecret = Uint8Array;

// ===== Constants =====

export const CRYPTO_CONSTANTS = {
  CHACHA20_KEY_LENGTH: 32,
  CHACHA20_NONCE_LENGTH: 12,
  POLY1305_TAG_LENGTH: 16,
  NIP44_SALT: 'nip44-v2',
  HKDF_LENGTH: 76, // 32 + 32 + 12 bytes for ChaCha key + HMAC key + nonce
} as const; 