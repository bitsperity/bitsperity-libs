import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import * as secp256k1 from '@noble/secp256k1';
import type { KeyDerivation, NIP44ConversationKeys, SharedSecret, PrivateKey, PublicKey } from '../types';
import { CRYPTO_CONSTANTS, CryptoError, InvalidKeyError } from '../types';

/**
 * NIP-44 Key Derivation Implementation
 * Based on HKDF-SHA256 with "nip44-v2" salt
 * Implements conversation key derivation für secure DM encryption
 */
export class NIP44KeyDerivation implements KeyDerivation {

  /**
   * HKDF Extract Phase
   * Extract pseudorandom key from input keying material
   */
  async hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
    try {
      // HKDF-Extract(salt, IKM) = HMAC-Hash(salt, IKM)
      return hmac(sha256, salt, ikm);
    } catch (error) {
      throw new CryptoError(
        `HKDF extract failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HKDF_EXTRACT_FAILED'
      );
    }
  }

  /**
   * HKDF Expand Phase  
   * Expand pseudorandom key to desired output length
   */
  async hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    try {
      const maxLength = 255 * sha256.outputLen; // RFC 5869 limit
      if (length > maxLength) {
        throw new CryptoError(`HKDF expand length ${length} exceeds maximum ${maxLength}`, 'HKDF_LENGTH_INVALID');
      }

      const output = new Uint8Array(length);
      const numBlocks = Math.ceil(length / sha256.outputLen);
      let offset = 0;

      for (let i = 1; i <= numBlocks; i++) {
        // T(i) = HMAC-Hash(PRK, T(i-1) | info | i)
        const hmacInstance = hmac.create(sha256, prk);
        
        if (i > 1) {
          // Add T(i-1) für i > 1
          const prevBlock = output.slice(offset - sha256.outputLen, offset);
          hmac.update(prevBlock);
        }
        
        hmac.update(info);
        hmac.update(new Uint8Array([i])); // Counter byte
        
        const block = hmac.digest();
        const copyLength = Math.min(block.length, length - offset);
        output.set(block.slice(0, copyLength), offset);
        offset += copyLength;
      }

      return output;
    } catch (error) {
      throw new CryptoError(
        `HKDF expand failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HKDF_EXPAND_FAILED'
      );
    }
  }

  /**
   * Derive NIP-44 conversation keys from shared secret
   * Uses HKDF with "nip44-v2" salt according to NIP-44 specification
   */
  async deriveNIP44Keys(sharedSecret: Uint8Array): Promise<NIP44ConversationKeys> {
    try {
      this.validateSharedSecret(sharedSecret);

      // NIP-44 salt: "nip44-v2"
      const salt = new TextEncoder().encode(CRYPTO_CONSTANTS.NIP44_SALT);
      
      // HKDF-Extract
      const prk = await this.hkdfExtract(salt, sharedSecret);
      
      // HKDF-Expand to get 76 bytes: 32 + 32 + 12
      const keyMaterial = await this.hkdfExpand(
        prk, 
        new Uint8Array(0), // Empty info für NIP-44
        CRYPTO_CONSTANTS.HKDF_LENGTH
      );

      // Split derived key material
      return {
        chacha_key: keyMaterial.slice(0, 32),    // ChaCha20 key
        hmac_key: keyMaterial.slice(32, 64),     // Poly1305 key (via HMAC)
        chacha_nonce: keyMaterial.slice(64, 76), // ChaCha20 nonce
      };
    } catch (error) {
      throw new CryptoError(
        `NIP-44 key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NIP44_KEY_DERIVATION_FAILED'
      );
    }
  }

  /**
   * Derive shared secret using ECDH with secp256k1
   * Used as input für conversation key derivation
   */
  async deriveSharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<SharedSecret> {
    try {
      this.validatePrivateKey(privateKey);
      this.validatePublicKey(publicKey);

      // Use Noble secp256k1 für ECDH
      const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey, true); // compressed
      
      // Extract x-coordinate (32 bytes) from compressed point
      // Remove first byte (compression flag) to get x-coordinate
      const sharedSecret = sharedPoint.slice(1, 33);
      
      return sharedSecret;
    } catch (error) {
      throw new InvalidKeyError(
        `ECDH shared secret derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * High-level function: Derive conversation keys directly from keypair
   * Combines ECDH and NIP-44 key derivation
   */
  async deriveConversationKeys(
    privateKey: PrivateKey, 
    publicKey: PublicKey
  ): Promise<NIP44ConversationKeys> {
    try {
      const sharedSecret = await this.deriveSharedSecret(privateKey, publicKey);
      return await this.deriveNIP44Keys(sharedSecret);
    } catch (error) {
      throw new CryptoError(
        `Conversation key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONVERSATION_KEY_DERIVATION_FAILED'
      );
    }
  }

  // ===== Validation Methods =====

  private validateSharedSecret(sharedSecret: Uint8Array): void {
    if (sharedSecret.length !== 32) {
      throw new InvalidKeyError(`Shared secret must be 32 bytes, got ${sharedSecret.length}`);
    }
    
    // Check für all-zero shared secret (weak case)
    if (this.isAllZeros(sharedSecret)) {
      throw new InvalidKeyError('Shared secret cannot be all zeros');
    }
  }

  private validatePrivateKey(privateKey: Uint8Array): void {
    if (privateKey.length !== 32) {
      throw new InvalidKeyError(`Private key must be 32 bytes, got ${privateKey.length}`);
    }
    
    try {
      // Validate with Noble secp256k1
      secp256k1.utils.isValidPrivateKey(privateKey);
    } catch {
      throw new InvalidKeyError('Invalid secp256k1 private key');
    }
  }

  private validatePublicKey(publicKey: Uint8Array): void {
    if (publicKey.length !== 33 && publicKey.length !== 65) {
      throw new InvalidKeyError(`Public key must be 33 (compressed) or 65 (uncompressed) bytes, got ${publicKey.length}`);
    }
    
    try {
      // Validate with Noble secp256k1
      const point = secp256k1.Point.fromHex(publicKey);
      if (!point.hasEvenY()) {
        // For NIP-44, we typically use even Y coordinates
        // But this is not strictly required, just validate point is on curve
      }
    } catch {
      throw new InvalidKeyError('Invalid secp256k1 public key');
    }
  }

  private isAllZeros(bytes: Uint8Array): boolean {
    return bytes.every(byte => byte === 0);
  }

  // ===== Utility Methods für Testing =====

  /**
   * Generate test vectors für HKDF validation
   * Used in compliance testing
   */
  async generateHKDFTestVector(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number) {
    const prk = await this.hkdfExtract(salt, ikm);
    const okm = await this.hkdfExpand(prk, info, length);
    
    return {
      ikm: this.bytesToHex(ikm),
      salt: this.bytesToHex(salt),
      info: this.bytesToHex(info),
      length,
      prk: this.bytesToHex(prk),
      okm: this.bytesToHex(okm),
    };
  }

  /**
   * Validate against NIP-44 reference test vectors
   * Ensures compliance with specification
   */
  async validateNIP44TestVector(testVector: {
    privateKeyA: string;
    publicKeyB: string;
    sharedSecret: string;
    conversationKey: string;
  }): Promise<boolean> {
    try {
      const privateKey = this.hexToBytes(testVector.privateKeyA);
      const publicKey = this.hexToBytes(testVector.publicKeyB);
      const expectedSharedSecret = this.hexToBytes(testVector.sharedSecret);
      const expectedConversationKey = this.hexToBytes(testVector.conversationKey);

      const actualSharedSecret = await this.deriveSharedSecret(privateKey, publicKey);
      const actualKeys = await this.deriveNIP44Keys(actualSharedSecret);
      
      // For test vector validation, concatenate all derived keys
      const actualConversationKey = new Uint8Array(76);
      actualConversationKey.set(actualKeys.chacha_key, 0);
      actualConversationKey.set(actualKeys.hmac_key, 32);
      actualConversationKey.set(actualKeys.chacha_nonce, 64);

      return (
        this.constantTimeEquals(actualSharedSecret, expectedSharedSecret) &&
        this.constantTimeEquals(actualConversationKey, expectedConversationKey)
      );
    } catch {
      return false;
    }
  }

  // ===== Helper Methods =====

  private constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i]! ^ b[i]!;
    }
    
    return result === 0;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      throw new Error('Invalid hex string length');
    }
    
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const hexByte = hex.substr(i * 2, 2);
      bytes[i] = parseInt(hexByte, 16);
    }
    
    return bytes;
  }
} 