/**
 * Gift Wrap Creator for NIP-59 Gift Wrap Protocol
 * 
 * Creates kind 1059 gift wraps containing NIP-44 encrypted seals.
 * Each gift wrap uses a unique ephemeral key pair and randomized timestamp.
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import * as secp256k1 from '@noble/secp256k1';
import { NIP44Crypto } from '../crypto/NIP44Crypto.js';
import { EphemeralKeyManager } from './EphemeralKeyManager.js';
import { TimestampRandomizer } from './TimestampRandomizer.js';
import { 
  Seal, 
  GiftWrap, 
  EphemeralKeyPair,
  GiftWrapRecipient,
  GiftWrapResult,
  NIP59Error, 
  NIP59ErrorCode, 
  NIP59_CONFIG 
} from '../types/nip59-types.js';

export class GiftWrapCreator {
  
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(
    seal: Seal,
    recipient: GiftWrapRecipient,
    ephemeralKeyPair?: EphemeralKeyPair,
    customTimestamp?: number
  ): Promise<GiftWrapResult> {
    try {
      // Validate inputs
      this.validateSeal(seal);
      this.validateRecipient(recipient);
      
      // Generate ephemeral key pair if not provided
      const keyPair = ephemeralKeyPair || EphemeralKeyManager.generateEphemeralKeyPair();
      
      // Validate ephemeral key pair
      if (!EphemeralKeyManager.validateEphemeralKeyPair(keyPair)) {
        throw new NIP59Error(
          'Invalid ephemeral key pair',
          NIP59ErrorCode.GIFT_WRAP_CREATION_FAILED
        );
      }
      
      // Generate randomized timestamp if not provided
      const timestamp = customTimestamp || TimestampRandomizer.generateRandomizedTimestamp();
      
      // Serialize the seal for encryption
      const sealJson = JSON.stringify(seal);
      
      // Derive conversation key using ephemeral private key and recipient public key
      const conversationKey = NIP44Crypto.deriveConversationKey(
        keyPair.privateKey,
        recipient.pubkey
      );
      
      // Encrypt the seal using NIP-44
      const encryptionResult = NIP44Crypto.encrypt(sealJson, conversationKey);
      
      // Create the p tag for recipient
      const pTag: [string, string, string?] = recipient.relayHint 
        ? ['p', recipient.pubkey, recipient.relayHint]
        : ['p', recipient.pubkey];
      
      // Create the unsigned gift wrap
      const unsignedGiftWrap = {
        pubkey: keyPair.publicKey,
        created_at: timestamp,
        kind: NIP59_CONFIG.GIFT_WRAP_KIND,
        tags: [pTag],
        content: encryptionResult.payload
      };
      
      // Calculate event ID
      const eventId = this.calculateEventId(unsignedGiftWrap);
      
      // Sign the event with ephemeral private key
      const signature = await this.signEvent(unsignedGiftWrap, eventId, keyPair.privateKey);
      
      // Create the complete gift wrap
      const giftWrap: GiftWrap = {
        id: eventId,
        pubkey: keyPair.publicKey,
        created_at: timestamp,
        kind: NIP59_CONFIG.GIFT_WRAP_KIND,
        tags: [pTag],
        content: encryptionResult.payload,
        sig: signature
      };
      
      return {
        giftWrap,
        ephemeralKeyPair: keyPair,
        recipient: recipient.pubkey
      };
      
    } catch (error) {
      if (error instanceof NIP59Error) throw error;
      throw new NIP59Error(
        `Gift wrap creation failed: ${error.message}`,
        NIP59ErrorCode.GIFT_WRAP_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Create multiple gift wraps for multiple recipients
   * Each recipient gets their own gift wrap with unique ephemeral key
   */
  static async createMultipleGiftWraps(
    seal: Seal,
    recipients: GiftWrapRecipient[]
  ): Promise<GiftWrapResult[]> {
    if (!recipients || recipients.length === 0) {
      throw new NIP59Error(
        'At least one recipient is required',
        NIP59ErrorCode.NO_RECIPIENTS
      );
    }
    
    const results: GiftWrapResult[] = [];
    
    // Generate unique ephemeral key pairs for each recipient
    const ephemeralKeyPairs = EphemeralKeyManager.generateMultipleEphemeralKeyPairs(
      recipients.length
    );
    
    // Generate randomized timestamps for each gift wrap
    const timestamps = TimestampRandomizer.generateMultipleRandomizedTimestamps(
      recipients.length
    );
    
    // Create gift wrap for each recipient
    for (let i = 0; i < recipients.length; i++) {
      const result = await this.createGiftWrap(
        seal,
        recipients[i],
        ephemeralKeyPairs[i],
        timestamps[i]
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * Decrypt a gift wrap to recover the original seal
   */
  // Raw-key decrypt path removed in P1

  /**
   * Validate seal structure
   */
  private static validateSeal(seal: Seal): void {
    if (!seal || typeof seal !== 'object') {
      throw new NIP59Error(
        'Seal must be a valid object',
        NIP59ErrorCode.INVALID_SEAL
      );
    }
    
    if (seal.kind !== NIP59_CONFIG.SEAL_KIND) {
      throw new NIP59Error(
        'Seal must have kind 13',
        NIP59ErrorCode.INVALID_SEAL
      );
    }
    
    if (!Array.isArray(seal.tags) || seal.tags.length !== 0) {
      throw new NIP59Error(
        'Seal must have empty tags array',
        NIP59ErrorCode.INVALID_SEAL
      );
    }
    
    if (typeof seal.content !== 'string') {
      throw new NIP59Error(
        'Seal must have valid content string',
        NIP59ErrorCode.INVALID_SEAL
      );
    }
  }

  /**
   * Validate recipient configuration
   */
  private static validateRecipient(recipient: GiftWrapRecipient): void {
    if (!recipient || typeof recipient !== 'object') {
      throw new NIP59Error(
        'Recipient must be a valid object',
        NIP59ErrorCode.INVALID_RECIPIENT
      );
    }
    
    if (typeof recipient.pubkey !== 'string' || !/^[0-9a-f]{64}$/i.test(recipient.pubkey)) {
      throw new NIP59Error(
        'Recipient must have valid pubkey',
        NIP59ErrorCode.INVALID_RECIPIENT
      );
    }
    
    if (recipient.relayHint && typeof recipient.relayHint !== 'string') {
      throw new NIP59Error(
        'Recipient relay hint must be a string if provided',
        NIP59ErrorCode.INVALID_RECIPIENT
      );
    }
  }

  /**
   * Check if an object is a valid gift wrap (for decryption)
   */
  private static isValidGiftWrap(obj: any): obj is GiftWrap {
    return obj &&
      typeof obj === 'object' &&
      obj.kind === NIP59_CONFIG.GIFT_WRAP_KIND &&
      typeof obj.pubkey === 'string' &&
      typeof obj.content === 'string' &&
      Array.isArray(obj.tags) &&
      obj.tags.length > 0 &&
      Array.isArray(obj.tags[0]) &&
      obj.tags[0][0] === 'p' &&
      typeof obj.tags[0][1] === 'string';
  }

  /**
   * Check if an object is a valid seal (for decryption)
   */
  private static isValidSeal(obj: any): obj is Seal {
    return obj &&
      typeof obj === 'object' &&
      obj.kind === NIP59_CONFIG.SEAL_KIND &&
      typeof obj.pubkey === 'string' &&
      typeof obj.content === 'string' &&
      Array.isArray(obj.tags) &&
      obj.tags.length === 0;
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
    
    const eventBytes = new TextEncoder().encode(serialized);
    const hashBytes = sha256(eventBytes);
    
    // Use the same hex conversion as EventBuilder for consistency
    return bytesToHex(hashBytes);
  }

  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  private static async signEvent(event: any, eventId: string, privateKey: string): Promise<string> {
    try {
      const signature = await secp256k1.schnorr.sign(eventId, privateKey);
      // Use the same hex conversion as SigningProvider for consistency
      return bytesToHex(signature);
    } catch (error) {
      throw new NIP59Error(
        'Failed to sign gift wrap event',
        NIP59ErrorCode.GIFT_WRAP_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Extract recipient pubkey from gift wrap p tag
   */
  static getRecipientFromGiftWrap(giftWrap: GiftWrap): string | null {
    try {
      if (giftWrap.tags.length > 0 && giftWrap.tags[0][0] === 'p') {
        return giftWrap.tags[0][1];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract relay hint from gift wrap p tag
   */
  static getRelayHintFromGiftWrap(giftWrap: GiftWrap): string | null {
    try {
      if (giftWrap.tags.length > 0 && 
          giftWrap.tags[0][0] === 'p' && 
          giftWrap.tags[0].length > 2) {
        return giftWrap.tags[0][2];
      }
      return null;
    } catch {
      return null;
    }
  }
}