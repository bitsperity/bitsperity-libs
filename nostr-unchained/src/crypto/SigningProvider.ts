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
  private cachedPublicKey?: string;

  async getPublicKey(): Promise<string> {
    if (!window.nostr) {
      throw new Error(ERROR_MESSAGES.NO_EXTENSION);
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      this.cachedPublicKey = pubkey; // Cache for sync access
      return pubkey;
    } catch (error) {
      throw new Error(`Extension signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getPublicKeySync(): string | null {
    return this.cachedPublicKey || null;
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

  // Optional capabilities for NIP-44
  async capabilities(): Promise<{ nip44Encrypt: boolean; nip44Decrypt: boolean; rawKey: boolean }> {
    const hasNip44 = typeof window !== 'undefined' && !!window.nostr?.nip44 &&
      typeof window.nostr.nip44.encrypt === 'function' && typeof window.nostr.nip44.decrypt === 'function';
    return { nip44Encrypt: hasNip44, nip44Decrypt: hasNip44, rawKey: false };
  }

  async nip44Encrypt(peerPubkey: string, plaintext: string): Promise<string> {
    if (!window.nostr?.nip44?.encrypt) throw new Error('NIP-44 encrypt not supported by extension');
    return window.nostr.nip44.encrypt(peerPubkey, plaintext);
  }

  async nip44Decrypt(peerPubkey: string, ciphertext: string): Promise<string> {
    if (!window.nostr?.nip44?.decrypt) throw new Error('NIP-44 decrypt not supported by extension');
    return window.nostr.nip44.decrypt(peerPubkey, ciphertext);
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

  getPublicKeySync(): string | null {
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

  async capabilities(): Promise<{ nip44Encrypt: boolean; nip44Decrypt: boolean; rawKey: boolean }> {
    return { nip44Encrypt: true, nip44Decrypt: true, rawKey: true };
  }

  async nip44Encrypt(peerPubkey: string, plaintext: string): Promise<string> {
    const { NIP44Crypto } = await import('../dm/crypto/NIP44Crypto.js');
    const key = NIP44Crypto.deriveConversationKey(this.privateKey, peerPubkey);
    const res = NIP44Crypto.encrypt(plaintext, key);
    if (!res || !res.isValid) throw new Error('NIP-44 encrypt failed');
    return res.ciphertext;
  }

  async nip44Decrypt(peerPubkey: string, ciphertext: string): Promise<string> {
    const { NIP44Crypto } = await import('../dm/crypto/NIP44Crypto.js');
    const key = NIP44Crypto.deriveConversationKey(this.privateKey, peerPubkey);
    const res = NIP44Crypto.decrypt(ciphertext, key);
    if (!res || !res.isValid) throw new Error('NIP-44 decrypt failed');
    return res.plaintext;
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