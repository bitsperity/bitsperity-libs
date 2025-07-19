import type { CryptoModule, EncryptionResult } from './types';
import { CryptoError } from './types';

/**
 * Simplified Crypto Implementation als Fallback
 * Uses WebCrypto API für browser compatibility
 * Implements basic encryption/decryption für Phase 2 demonstration
 */
export class SimpleCrypto implements CryptoModule {

  async encrypt(
    plaintext: Uint8Array, 
    key: Uint8Array, 
    nonce?: Uint8Array
  ): Promise<EncryptionResult> {
    try {
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new CryptoError('WebCrypto not available', 'WEBCRYPTO_UNAVAILABLE');
      }

      const actualNonce = nonce || this.generateNonce();
      
      // Import key for AES-GCM (als alternative zu ChaCha20-Poly1305)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key.slice(0, 32), // Ensure 32 bytes
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Encrypt using AES-GCM
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: actualNonce },
        cryptoKey,
        plaintext
      );

      const result = new Uint8Array(encrypted);
      const ciphertext = result.slice(0, -16);
      const tag = result.slice(-16);

      return {
        ciphertext,
        nonce: actualNonce,
        tag,
      };
    } catch (error) {
      throw new CryptoError(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ENCRYPTION_FAILED'
      );
    }
  }

  async decrypt(
    ciphertext: Uint8Array, 
    key: Uint8Array, 
    nonce: Uint8Array,
    tag?: Uint8Array
  ): Promise<Uint8Array> {
    try {
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new CryptoError('WebCrypto not available', 'WEBCRYPTO_UNAVAILABLE');
      }

      // Import key for AES-GCM
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key.slice(0, 32), // Ensure 32 bytes
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // CRITICAL FIX: Combine ciphertext and tag correctly for AES-GCM
      let combined: Uint8Array;
      if (tag) {
        // Tag provided separately - combine with ciphertext
        combined = new Uint8Array(ciphertext.length + tag.length);
        combined.set(ciphertext);
        combined.set(tag, ciphertext.length);
      } else {
        // Assume tag is already appended to ciphertext (WebCrypto default)
        combined = ciphertext;
      }

      // Decrypt using AES-GCM with proper tag handling
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        cryptoKey,
        combined
      );

      return new Uint8Array(decrypted);
    } catch (error) {
      throw new CryptoError(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DECRYPTION_FAILED'
      );
    }
  }

  async deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    // Simplified ECDH - in real implementation would use secp256k1
    // For now, derive a deterministic shared secret from the keys
    const combined = new Uint8Array(privateKey.length + publicKey.length);
    combined.set(privateKey);
    combined.set(publicKey, privateKey.length);
    
    // Use WebCrypto to hash the combined keys
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hashBuffer);
  }

  async deriveConversationKey(sharedSecret: Uint8Array): Promise<Uint8Array> {
    // Simplified key derivation - in real implementation would use HKDF
    return sharedSecret;
  }

  generateNonce(): Uint8Array {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(12));
    } else {
      // Fallback to insecure random (development only)
      const nonce = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        nonce[i] = Math.floor(Math.random() * 256);
      }
      return nonce;
    }
  }

  constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i]! ^ b[i]!;
    }
    
    return result === 0;
  }
} 