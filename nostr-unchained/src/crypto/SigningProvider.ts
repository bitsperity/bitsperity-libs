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
 * Temporary Key Signer (Development/Testing)
 * 
 * Generates a temporary private key for signing when no extension is available.
 * Uses @noble/secp256k1 for secure cryptographic operations.
 * WARNING: This is only for development/testing. Keys are not persistent.
 */
export class TemporarySigner implements SigningProvider {
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
}

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

    // Fallback to temporary signer
    return {
      provider: new TemporarySigner(),
      method: 'temporary'
    };
  }
}