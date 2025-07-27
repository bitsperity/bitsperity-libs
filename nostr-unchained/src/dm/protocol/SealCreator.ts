/**
 * Seal Creator for NIP-59 Gift Wrap Protocol
 * 
 * Creates kind 13 seals containing NIP-44 encrypted rumors.
 * The seal is signed by the real sender's private key.
 */

import { sha256 } from '@noble/hashes/sha256';
import * as secp256k1 from '@noble/secp256k1';
import { NIP44Crypto } from '../crypto/NIP44Crypto.js';
import { 
  Rumor, 
  Seal, 
  NIP59Error, 
  NIP59ErrorCode, 
  NIP59_CONFIG 
} from '../types/nip59-types.js';

export class SealCreator {
  
  /**
   * Create a kind 13 seal containing the encrypted rumor
   * The seal is signed by the sender's real private key
   */
  static async createSeal(
    rumor: Rumor,
    senderPrivateKey: string,
    recipientPublicKey: string
  ): Promise<Seal> {
    try {
      // Validate inputs
      this.validateRumor(rumor);
      this.validatePrivateKey(senderPrivateKey);
      this.validatePublicKey(recipientPublicKey);
      
      // Serialize the rumor for encryption
      const rumorJson = JSON.stringify(rumor);
      
      // Derive conversation key for NIP-44 encryption
      const conversationKey = NIP44Crypto.deriveConversationKey(
        senderPrivateKey,
        recipientPublicKey
      );
      
      // Encrypt the rumor using NIP-44
      const encryptionResult = NIP44Crypto.encrypt(rumorJson, conversationKey);
      
      // Get sender's public key
      const senderPublicKey = this.getPublicKeyFromPrivate(senderPrivateKey);
      
      // Create the unsigned seal
      const unsignedSeal = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: NIP59_CONFIG.SEAL_KIND,
        tags: [], // Always empty for seals
        content: encryptionResult.payload
      };
      
      // Calculate event ID
      const eventId = this.calculateEventId(unsignedSeal);
      
      // Sign the event
      const signature = await this.signEvent(unsignedSeal, eventId, senderPrivateKey);
      
      // Create the complete seal
      const seal: Seal = {
        id: eventId,
        pubkey: senderPublicKey,
        created_at: unsignedSeal.created_at,
        kind: NIP59_CONFIG.SEAL_KIND,
        tags: [],
        content: encryptionResult.payload,
        sig: signature
      };
      
      return seal;
      
    } catch (error) {
      if (error instanceof NIP59Error) throw error;
      throw new NIP59Error(
        `Seal creation failed: ${error.message}`,
        NIP59ErrorCode.SEAL_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Decrypt a seal to recover the original rumor
   */
  static decryptSeal(
    seal: Seal,
    recipientPrivateKey: string
  ): { rumor: Rumor; isValid: boolean } {
    try {
      // Validate seal format
      if (seal.kind !== NIP59_CONFIG.SEAL_KIND) {
        return { rumor: null as any, isValid: false };
      }
      
      if (seal.tags.length !== 0) {
        return { rumor: null as any, isValid: false };
      }
      
      // Derive conversation key
      const conversationKey = NIP44Crypto.deriveConversationKey(
        recipientPrivateKey,
        seal.pubkey
      );
      
      // Decrypt the seal content
      const decryptionResult = NIP44Crypto.decrypt(seal.content, conversationKey);
      
      if (!decryptionResult.isValid) {
        return { rumor: null as any, isValid: false };
      }
      
      // Parse the rumor
      const rumor: Rumor = JSON.parse(decryptionResult.plaintext);
      
      // Validate rumor structure
      if (!this.isValidRumor(rumor)) {
        return { rumor: null as any, isValid: false };
      }
      
      return { rumor, isValid: true };
      
    } catch {
      return { rumor: null as any, isValid: false };
    }
  }

  /**
   * Validate rumor structure
   */
  private static validateRumor(rumor: Rumor): void {
    if (!rumor || typeof rumor !== 'object') {
      throw new NIP59Error(
        'Rumor must be a valid object',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
    
    if (typeof rumor.pubkey !== 'string' || !/^[0-9a-f]{64}$/i.test(rumor.pubkey)) {
      throw new NIP59Error(
        'Rumor must have valid pubkey',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
    
    if (typeof rumor.created_at !== 'number' || rumor.created_at <= 0) {
      throw new NIP59Error(
        'Rumor must have valid created_at timestamp',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
    
    if (typeof rumor.kind !== 'number' || rumor.kind < 0 || rumor.kind > 65535) {
      throw new NIP59Error(
        'Rumor must have valid kind',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
    
    if (!Array.isArray(rumor.tags)) {
      throw new NIP59Error(
        'Rumor must have valid tags array',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
    
    if (typeof rumor.content !== 'string') {
      throw new NIP59Error(
        'Rumor must have valid content string',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
  }

  /**
   * Check if an object is a valid rumor (more lenient for decryption)
   */
  private static isValidRumor(obj: any): obj is Rumor {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.pubkey === 'string' &&
      typeof obj.created_at === 'number' &&
      typeof obj.kind === 'number' &&
      Array.isArray(obj.tags) &&
      typeof obj.content === 'string';
  }

  /**
   * Validate private key format
   */
  private static validatePrivateKey(privateKey: string): void {
    if (typeof privateKey !== 'string' || !/^[0-9a-f]{64}$/i.test(privateKey)) {
      throw new NIP59Error(
        'Invalid private key format',
        NIP59ErrorCode.SEAL_CREATION_FAILED
      );
    }
  }

  /**
   * Validate public key format
   */
  private static validatePublicKey(publicKey: string): void {
    if (typeof publicKey !== 'string' || !/^[0-9a-f]{64}$/i.test(publicKey)) {
      throw new NIP59Error(
        'Invalid public key format',
        NIP59ErrorCode.SEAL_CREATION_FAILED
      );
    }
  }

  /**
   * Get public key from private key
   */
  private static getPublicKeyFromPrivate(privateKey: string): string {
    try {
      console.log('🔍 SealCreator.getPublicKeyFromPrivate called with:', {
        privateKeyLength: privateKey?.length,
        privateKeyType: typeof privateKey,
        privateKeyPrefix: privateKey?.substring(0, 8) + '...'
      });
      
      // Convert hex private key to bytes for secp256k1
      const privateKeyBytes = new Uint8Array(
        privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      console.log('📊 privateKeyBytes:', {
        length: privateKeyBytes.length,
        type: privateKeyBytes.constructor.name,
        first4: Array.from(privateKeyBytes.slice(0, 4))
      });
      
      const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
      // Convert bytes to hex without using Buffer (browser-compatible)
      const publicKeySlice = publicKeyBytes.slice(1, 33);
      const result = Array.from(publicKeySlice)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      console.log('✅ Successfully derived public key:', result.substring(0, 8) + '...');
      
      return result;
    } catch (error) {
      console.error('❌ SealCreator getPublicKeyFromPrivate error:', {
        error,
        message: error.message,
        stack: error.stack,
        privateKeyInfo: {
          type: typeof privateKey,
          length: privateKey?.length
        }
      });
      throw new NIP59Error(
        'Failed to derive public key from private key',
        NIP59ErrorCode.SEAL_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Calculate event ID according to NIP-01
   */
  private static calculateEventId(event: any): string {
    const serialized = JSON.stringify([
      0, // Reserved for future use
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);
    
    const hash = sha256(new TextEncoder().encode(serialized));
    return Array.from(hash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  private static async signEvent(event: any, eventId: string, privateKey: string): Promise<string> {
    try {
      const signature = await secp256k1.schnorr.sign(eventId, privateKey);
      return Array.from(signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      throw new NIP59Error(
        'Failed to sign seal event',
        NIP59ErrorCode.SEAL_CREATION_FAILED,
        error
      );
    }
  }
}