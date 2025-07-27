/**
 * Signing Provider Interface and Implementations
 * 
 * Handles event signing with support for:
 * - NIP-07 browser extensions (preferred)  
 * - Temporary keys (fallback for development using @noble/secp256k1)
 */

import * as secp256k1 from '@noble/secp256k1';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';
import { EventBuilder } from '../core/EventBuilder.js';
import type { SigningProvider, UnsignedEvent, NostrEvent } from '../core/types.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * NIP-07 Browser Extension Signer
 */
export class ExtensionSigner implements SigningProvider {
  async getPublicKey(): Promise<string> {
    if (!window.nostr) {
      throw new Error(ERROR_MESSAGES.NO_EXTENSION);
    }

    try {
      return await window.nostr.getPublicKey();
    } catch (error) {
      throw new Error(`Extension signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signEvent(event: UnsignedEvent): Promise<string> {
    if (!window.nostr) {
      throw new Error(ERROR_MESSAGES.NO_EXTENSION);
    }

    try {
      const signedEvent = await window.nostr.signEvent(event);
      return signedEvent.sig;
    } catch (error) {
      throw new Error(`Extension signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 
           typeof window.nostr !== 'undefined' && 
           typeof window.nostr.getPublicKey === 'function' &&
           typeof window.nostr.signEvent === 'function';
  }
}

/**
 * Local Key Signer
 * 
 * Generates a local private key for signing when no extension is available.
 * Uses @noble/secp256k1 for secure cryptographic operations.
 * Perfect for testing, development, or standalone usage.
 */
export class LocalKeySigner implements SigningProvider {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    // Generate a cryptographically secure random private key (32 bytes)
    const privateKeyBytes = randomBytes(32);
    this.privateKey = bytesToHex(privateKeyBytes);
    
    // Derive public key from private key using secp256k1
    this.publicKey = bytesToHex(secp256k1.schnorr.getPublicKey(this.privateKey));
  }

  async getPublicKey(): Promise<string> {
    return this.publicKey;
  }

  async signEvent(event: UnsignedEvent): Promise<string> {
    // Calculate event ID (what we're actually signing)
    const eventId = EventBuilder.calculateEventId(event);
    
    // Sign the event ID with Schnorr signature
    const signature = await secp256k1.schnorr.sign(eventId, this.privateKey);
    
    // Return signature as hex string
    return bytesToHex(signature);
  }

  /**
   * Get private key for NIP-44 encryption
   * WARNING: Only for testing/development. Production should use secure key derivation.
   */
  async getPrivateKeyForEncryption(): Promise<string> {
    return this.privateKey;
  }
}

/**
 * User-friendly alias for LocalKeySigner
 * Perfect for quick starts and demos
 */
export class QuickSigner extends LocalKeySigner {}

/**
 * @deprecated Use LocalKeySigner or QuickSigner instead
 * Kept for backwards compatibility
 */
export class TemporarySigner extends LocalKeySigner {}

/**
 * Signing Provider Factory
 * 
 * Automatically selects the best available signing method
 */
export class SigningProviderFactory {
  static async createBestAvailable(): Promise<{
    provider: SigningProvider;
    method: 'extension' | 'temporary';
  }> {
    // Try extension first
    if (await ExtensionSigner.isAvailable()) {
      try {
        const provider = new ExtensionSigner();
        // Test if it actually works
        await provider.getPublicKey();
        return {
          provider,
          method: 'extension'
        };
      } catch (error) {
        console.warn('Extension detected but failed to initialize:', error);
      }
    }

    // Fallback to local key signer
    return {
      provider: new LocalKeySigner(),
      method: 'temporary'
    };
  }
}