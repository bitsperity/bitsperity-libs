/**
 * NIP-44 v2 Encryption Implementation
 * 
 * Implements the complete NIP-44 v2 specification:
 * - secp256k1 ECDH key exchange
 * - HKDF-SHA256 key derivation  
 * - ChaCha20 encryption
 * - HMAC-SHA256 authentication
 * - Custom padding scheme
 */

import { getSharedSecret } from '@noble/secp256k1';
import { hkdf } from '@noble/hashes/hkdf';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { chacha20 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';

import { 
  MessageKeys, 
  EncryptionResult, 
  DecryptionResult, 
  ConversationKey,
  NIP44Error,
  NIP44ErrorCode,
  NIP44_V2_CONFIG
} from '../types/crypto-types.js';

export class NIP44Crypto {
  private static readonly VERSION = 2;
  private static readonly SALT = new TextEncoder().encode(NIP44_V2_CONFIG.saltInfo);
  private static readonly NONCE_SIZE = 32;
  private static readonly CHACHA_KEY_SIZE = 32;
  private static readonly CHACHA_NONCE_SIZE = 12;
  private static readonly HMAC_KEY_SIZE = 32;
  private static readonly MAC_SIZE = 32;
  private static readonly VERSION_SIZE = 1;

  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(
    senderPrivateKey: string, 
    recipientPublicKey: string
  ): Uint8Array {
    try {
      // Remove 0x prefix if present
      const privKey = senderPrivateKey.replace(/^0x/, '');
      let pubKey = recipientPublicKey.replace(/^0x/, '');
      
      // Validate key lengths
      if (privKey.length !== 64) {
        throw new NIP44Error(
          'Invalid private key length', 
          NIP44ErrorCode.INVALID_KEY
        );
      }
      // NIP-44 uses 32-byte x-coordinate public keys (64 hex chars)
      // or 33-byte compressed public keys (66 hex chars with 02/03 prefix)
      if (pubKey.length === 64) {
        // 32-byte x-coordinate, prepend 02 for compressed format
        // Note: This assumes even y-coordinate; for full compatibility,
        // the implementation should handle point reconstruction properly
        pubKey = '02' + pubKey;
      } else if (pubKey.length !== 66 || (!pubKey.startsWith('02') && !pubKey.startsWith('03'))) {
        throw new NIP44Error(
          'Invalid public key format', 
          NIP44ErrorCode.INVALID_KEY
        );
      }

      // Perform ECDH - returns 33-byte compressed point
      const sharedPoint = getSharedSecret(privKey, pubKey, true);
      
      // Extract x-coordinate (skip first byte which is compression flag)
      const sharedX = sharedPoint.slice(1);

      // HKDF-Extract with fixed salt  
      const conversationKey = hkdf(sha256, sharedX, this.SALT, new Uint8Array(0), 32);

      return conversationKey;
      
    } catch (error) {
      if (error instanceof NIP44Error) throw error;
      throw new NIP44Error(
        `Key derivation failed: ${error.message}`, 
        NIP44ErrorCode.INVALID_KEY,
        error
      );
    }
  }

  /**
   * Derive per-message keys using HKDF-Expand
   */
  static deriveMessageKeys(
    conversationKey: Uint8Array, 
    nonce: Uint8Array
  ): MessageKeys {
    try {
      if (conversationKey.length !== 32) {
        throw new NIP44Error(
          'Invalid conversation key length', 
          NIP44ErrorCode.INVALID_KEY
        );
      }
      if (nonce.length !== this.NONCE_SIZE) {
        throw new NIP44Error(
          'Invalid nonce length', 
          NIP44ErrorCode.INVALID_NONCE
        );
      }

      // HKDF-Expand: derive 76 bytes total (nonce as info parameter)
      const expandedKeys = hkdf(sha256, conversationKey, new Uint8Array(0), nonce, 76);

      return {
        chachaKey: expandedKeys.slice(0, 32),      // bytes 0-31
        chachaNonce: expandedKeys.slice(32, 44),   // bytes 32-43 (12 bytes)
        hmacKey: expandedKeys.slice(44, 76)        // bytes 44-75
      };
      
    } catch (error) {
      throw new NIP44Error(
        `Message key derivation failed: ${error.message}`, 
        NIP44ErrorCode.ENCRYPTION_FAILED,
        error
      );
    }
  }

  /**
   * Apply NIP-44 custom padding scheme
   * Based on the official algorithm from the specification
   */
  static calculatePaddedLength(unpaddedLength: number): number {
    if (unpaddedLength < 0 || unpaddedLength > 65536) {
      throw new NIP44Error(
        'Invalid plaintext length', 
        NIP44ErrorCode.INVALID_PLAINTEXT_LENGTH
      );
    }
    
    // Handle edge cases
    if (unpaddedLength === 0) {
      return 32; // Minimum padding
    }
    if (unpaddedLength <= 32) {
      return 32;
    }

    // NIP-44 padding algorithm
    const nextPower = 1 << (Math.floor(Math.log2(unpaddedLength - 1)) + 1);
    let chunk: number;
    
    if (nextPower <= 256) {
      chunk = 32;
    } else {
      chunk = nextPower / 8;
    }
    
    return chunk * (Math.floor((unpaddedLength - 1) / chunk) + 1);
  }

  /**
   * Apply padding to plaintext with NIP-44 format:
   * [plaintext_length: u16][plaintext][zero_bytes]
   */
  static applyPadding(plaintext: Uint8Array): Uint8Array {
    const unpaddedLength = plaintext.length;
    const paddedLength = this.calculatePaddedLength(unpaddedLength + 2); // +2 for length prefix
    
    const padded = new Uint8Array(paddedLength);
    
    // Write length as big-endian u16
    padded[0] = (unpaddedLength >>> 8) & 0xff;
    padded[1] = unpaddedLength & 0xff;
    
    // Copy plaintext
    padded.set(plaintext, 2);
    
    // Remainder is already filled with zeros
    return padded;
  }

  /**
   * Remove padding from decrypted data
   * Format: [plaintext_length: u16][plaintext][zero_bytes]
   */
  static removePadding(paddedData: Uint8Array): Uint8Array {
    if (paddedData.length < 2) {
      throw new NIP44Error(
        'Invalid padded data length', 
        NIP44ErrorCode.PADDING_ERROR
      );
    }
    
    // Read length from big-endian u16
    const plaintextLength = (paddedData[0] << 8) | paddedData[1];
    
    if (plaintextLength > paddedData.length - 2) {
      throw new NIP44Error(
        'Invalid plaintext length in padding', 
        NIP44ErrorCode.PADDING_ERROR
      );
    }
    
    return paddedData.slice(2, 2 + plaintextLength);
  }

  /**
   * Generate cryptographically secure random nonce
   */
  static generateNonce(): Uint8Array {
    return randomBytes(this.NONCE_SIZE);
  }

  /**
   * Encrypt plaintext using NIP-44 v2
   */
  static encrypt(
    plaintext: string, 
    conversationKey: Uint8Array,
    customNonce?: Uint8Array
  ): EncryptionResult {
    try {
      // Allow empty string for NIP-44 spec compliance
      if (plaintext === null || plaintext === undefined) {
        throw new NIP44Error(
          'Plaintext cannot be null or undefined', 
          NIP44ErrorCode.INVALID_PLAINTEXT_LENGTH
        );
      }
      
      // Convert to UTF-8 bytes
      const plaintextBytes = new TextEncoder().encode(plaintext);
      
      // Generate or use provided nonce
      const nonce = customNonce || this.generateNonce();
      
      // Derive message-specific keys
      const messageKeys = this.deriveMessageKeys(conversationKey, nonce);
      
      // Apply padding
      const paddedPlaintext = this.applyPadding(plaintextBytes);
      
      // Encrypt with ChaCha20
      const ciphertext = chacha20(
        messageKeys.chachaKey, 
        messageKeys.chachaNonce, 
        paddedPlaintext
      );
      
      // Calculate MAC over nonce + ciphertext
      const macData = new Uint8Array(nonce.length + ciphertext.length);
      macData.set(nonce, 0);
      macData.set(ciphertext, nonce.length);
      
      const mac = hmac(sha256, messageKeys.hmacKey, macData);
      
      // Construct final payload: version(1) + nonce(32) + ciphertext + mac(32)
      const payload = new Uint8Array(
        this.VERSION_SIZE + nonce.length + ciphertext.length + this.MAC_SIZE
      );
      
      let offset = 0;
      payload[offset] = this.VERSION; // Version byte
      offset += this.VERSION_SIZE;
      
      payload.set(nonce, offset);
      offset += nonce.length;
      
      payload.set(ciphertext, offset);
      offset += ciphertext.length;
      
      payload.set(mac, offset);
      
      // Encode to base64
      const payloadBase64 = Buffer.from(payload).toString('base64');
      
      return {
        payload: payloadBase64,
        nonce
      };
      
    } catch (error) {
      if (error instanceof NIP44Error) throw error;
      throw new NIP44Error(
        `Encryption failed: ${error.message}`, 
        NIP44ErrorCode.ENCRYPTION_FAILED,
        error
      );
    }
  }

  /**
   * Decrypt NIP-44 v2 payload
   */
  static decrypt(
    payloadBase64: string, 
    conversationKey: Uint8Array
  ): DecryptionResult {
    try {
      // Decode from base64
      const payload = new Uint8Array(Buffer.from(payloadBase64, 'base64'));
      
      // Validate minimum length
      const minLength = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (payload.length < minLength) {
        throw new NIP44Error(
          'Payload too short', 
          NIP44ErrorCode.INVALID_PAYLOAD
        );
      }
      
      // Extract components
      let offset = 0;
      
      // Version
      const version = payload[offset];
      offset += this.VERSION_SIZE;
      
      if (version !== this.VERSION) {
        throw new NIP44Error(
          `Unsupported version: ${version}`, 
          NIP44ErrorCode.INVALID_PAYLOAD
        );
      }
      
      // Nonce
      const nonce = payload.slice(offset, offset + this.NONCE_SIZE);
      offset += this.NONCE_SIZE;
      
      // Ciphertext (everything except MAC at the end)
      const ciphertext = payload.slice(offset, -this.MAC_SIZE);
      
      // MAC
      const receivedMac = payload.slice(-this.MAC_SIZE);
      
      // Derive message keys
      const messageKeys = this.deriveMessageKeys(conversationKey, nonce);
      
      // Verify MAC
      const macData = new Uint8Array(nonce.length + ciphertext.length);
      macData.set(nonce, 0);
      macData.set(ciphertext, nonce.length);
      
      const calculatedMac = hmac(sha256, messageKeys.hmacKey, macData);
      
      // Constant-time MAC comparison
      let macValid = true;
      for (let i = 0; i < this.MAC_SIZE; i++) {
        if (receivedMac[i] !== calculatedMac[i]) {
          macValid = false;
        }
      }
      
      if (!macValid) {
        return {
          plaintext: '',
          isValid: false
        };
      }
      
      // Decrypt with ChaCha20
      const paddedPlaintext = chacha20(
        messageKeys.chachaKey, 
        messageKeys.chachaNonce, 
        ciphertext
      );
      
      // Remove padding
      const plaintext = this.removePadding(paddedPlaintext);
      
      // Convert back to UTF-8 string
      const plaintextString = new TextDecoder().decode(plaintext);
      
      return {
        plaintext: plaintextString,
        isValid: true
      };
      
    } catch (error) {
      // Return invalid result for any error during decryption
      return {
        plaintext: '',
        isValid: false
      };
    }
  }

  /**
   * Encrypt with specific nonce (for testing)
   */
  static encryptWithNonce(
    plaintext: string,
    conversationKey: Uint8Array,
    nonce: Uint8Array
  ): string {
    const result = this.encrypt(plaintext, conversationKey, nonce);
    return result.payload;
  }

  /**
   * Validate payload format without decrypting
   */
  static validatePayload(payloadBase64: string): boolean {
    try {
      const payload = Buffer.from(payloadBase64, 'base64');
      const minLength = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      
      if (payload.length < minLength) return false;
      if (payload[0] !== this.VERSION) return false;
      
      return true;
    } catch {
      return false;
    }
  }
}

export default NIP44Crypto;