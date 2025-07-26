/**
 * NIP-44 v2 Cryptographic Types
 */

export interface MessageKeys {
  chachaKey: Uint8Array;    // 32 bytes - ChaCha20 encryption key
  chachaNonce: Uint8Array;  // 12 bytes - ChaCha20 nonce
  hmacKey: Uint8Array;      // 32 bytes - HMAC-SHA256 authentication key
}

export interface EncryptionResult {
  payload: string;          // Base64-encoded final payload
  nonce: Uint8Array;        // 32-byte random nonce used
}

export interface DecryptionResult {
  plaintext: string;        // Decrypted UTF-8 message
  isValid: boolean;         // MAC verification result
}

export interface ConversationKey {
  key: Uint8Array;          // 32-byte derived conversation key
  pubkeyA: string;          // First participant (hex)
  pubkeyB: string;          // Second participant (hex)
}

export interface NIP44Config {
  version: number;          // Always 2 for NIP-44 v2
  saltInfo: string;         // HKDF salt info - "nip44-v2"
  paddingBlockSize: number; // Padding block size for length hiding
}

export const NIP44_V2_CONFIG: NIP44Config = {
  version: 2,
  saltInfo: 'nip44-v2',
  paddingBlockSize: 16
};

export class NIP44Error extends Error {
  constructor(
    message: string, 
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NIP44Error';
  }
}

export enum NIP44ErrorCode {
  INVALID_KEY = 'INVALID_KEY',
  INVALID_NONCE = 'INVALID_NONCE', 
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  MAC_VERIFICATION_FAILED = 'MAC_VERIFICATION_FAILED',
  INVALID_PLAINTEXT_LENGTH = 'INVALID_PLAINTEXT_LENGTH',
  PADDING_ERROR = 'PADDING_ERROR'
}