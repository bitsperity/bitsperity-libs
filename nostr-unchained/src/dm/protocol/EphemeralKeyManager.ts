/**
 * Ephemeral Key Manager for NIP-59 Gift Wrap Protocol
 * 
 * Generates and manages ephemeral key pairs for gift wrap creation.
 * Each gift wrap uses a unique, random key pair that is never reused.
 */

import { randomBytes } from '@noble/hashes/utils';
import * as secp256k1 from '@noble/secp256k1';
import { EphemeralKeyPair, NIP59Error, NIP59ErrorCode } from '../types/nip59-types.js';

export class EphemeralKeyManager {
  
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair(): EphemeralKeyPair {
    try {
      // Generate cryptographically secure random private key
      const privateKeyBytes = randomBytes(32);
      
      // Convert to hex string
      const privateKey = Buffer.from(privateKeyBytes).toString('hex');
      
      // Derive public key from private key using getPublicKey
      const publicKeyBytes = secp256k1.getPublicKey(privateKey, false); // uncompressed
      
      // Extract x-coordinate (32 bytes) as per NIP-44 format  
      const publicKey = Buffer.from(publicKeyBytes.slice(1, 33)).toString('hex');
      
      return {
        privateKey,
        publicKey
      };
      
    } catch (error) {
      throw new NIP59Error(
        `Ephemeral key generation failed: ${error.message}`,
        NIP59ErrorCode.EPHEMERAL_KEY_GENERATION_FAILED,
        error
      );
    }
  }

  /**
   * Generate multiple ephemeral key pairs for multi-recipient scenarios
   * Each recipient gets their own unique ephemeral key pair
   */
  static generateMultipleEphemeralKeyPairs(count: number): EphemeralKeyPair[] {
    if (count <= 0) {
      throw new NIP59Error(
        'Key pair count must be greater than 0',
        NIP59ErrorCode.EPHEMERAL_KEY_GENERATION_FAILED
      );
    }
    
    const keyPairs: EphemeralKeyPair[] = [];
    
    for (let i = 0; i < count; i++) {
      keyPairs.push(this.generateEphemeralKeyPair());
    }
    
    return keyPairs;
  }

  /**
   * Validate that an ephemeral key pair is properly formatted
   */
  static validateEphemeralKeyPair(keyPair: EphemeralKeyPair): boolean {
    try {
      // Validate private key format (64 hex chars)
      if (!/^[0-9a-f]{64}$/i.test(keyPair.privateKey)) {
        return false;
      }
      
      // Validate public key format (64 hex chars - x-coordinate only)
      if (!/^[0-9a-f]{64}$/i.test(keyPair.publicKey)) {
        return false;
      }
      
      // Verify that the public key corresponds to the private key
      const derivedPublicKeyBytes = secp256k1.getPublicKey(keyPair.privateKey, false);
      const expectedPublicKey = Buffer.from(derivedPublicKeyBytes.slice(1, 33)).toString('hex');
      
      return keyPair.publicKey.toLowerCase() === expectedPublicKey.toLowerCase();
      
    } catch {
      return false;
    }
  }

  /**
   * Securely clear ephemeral key material from memory
   * Note: In JavaScript, we can't guarantee memory clearing, but we can
   * overwrite the string values to make them less likely to persist
   */
  static clearEphemeralKeyPair(keyPair: EphemeralKeyPair): void {
    try {
      // Overwrite with random data (best effort in JS)
      const randomHex = randomBytes(32).reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
      
      // Overwrite the key strings (this won't affect all references in JS)
      (keyPair as any).privateKey = randomHex;
      (keyPair as any).publicKey = randomHex;
      
    } catch {
      // Silently fail - memory clearing is best effort in JavaScript
    }
  }

  /**
   * Generate a secure random nonce for gift wrap creation
   * This can be used for additional randomness in the encryption process
   */
  static generateGiftWrapNonce(): Uint8Array {
    return randomBytes(32);
  }
}