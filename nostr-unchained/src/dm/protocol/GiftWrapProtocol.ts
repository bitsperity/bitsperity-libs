/**
 * NIP-59 Gift Wrap Protocol Implementation
 * 
 * Main orchestrator for the 3-layer encryption system:
 * 1. Rumor (unsigned event) - The actual message content
 * 2. Seal (kind 13) - NIP-44 encrypted rumor, signed by sender
 * 3. Gift Wrap (kind 1059) - NIP-44 encrypted seal with ephemeral key
 * 
 * This class provides the high-level API for creating and decrypting
 * gift-wrapped direct messages according to NIP-59 specification.
 */

import * as secp256k1 from '@noble/secp256k1';
import { SealCreator } from './SealCreator.js';
import { GiftWrapCreator } from './GiftWrapCreator.js';
import { EphemeralKeyManager } from './EphemeralKeyManager.js';
import { TimestampRandomizer } from './TimestampRandomizer.js';
import { 
  Rumor,
  Seal,
  GiftWrap,
  GiftWrapConfig,
  GiftWrapRecipient,
  GiftWrapProtocolResult,
  GiftWrapDecryptionResult,
  GiftWrapResult,
  NIP59Error,
  NIP59ErrorCode
} from '../types/nip59-types.js';

export class GiftWrapProtocol {
  
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(
    message: string,
    senderPublicKey: string,
    config: GiftWrapConfig,
    subject?: string,
    signer?: { nip44Encrypt: (peer: string, plaintext: string) => Promise<string>; signEvent: (event: any) => Promise<string> }
  ): Promise<GiftWrapProtocolResult> {
    try {
      // Validate inputs
      this.validateCreateDMInputs(message, senderPublicKey, config);
      
      // Step 1: Create the rumor (unsigned event with the actual message)
      const rumor = this.createRumor(message, senderPublicKey, subject);
      
      // Step 2: Create seals for each recipient
      // Each recipient needs their own seal due to different conversation keys
      const giftWrapResults: GiftWrapResult[] = [];
      
      for (const recipient of config.recipients) {
        // Create seal encrypted for this specific recipient
        const seal = await SealCreator.createSealWithSigner(rumor, signer as any, recipient.pubkey);
        
        // Create gift wrap for this recipient
        // For testing, use current timestamp if maxTimestampAge is 0
        const customTimestamp = config.maxTimestampAge === 0 
          ? Math.floor(Date.now() / 1000) 
          : undefined;
          
        const giftWrapResult = await GiftWrapCreator.createGiftWrap(
          seal,
          {
            pubkey: recipient.pubkey,
            relayHint: recipient.relayHint || config.relayHint
          },
          undefined, // ephemeral key pair (auto-generated)
          customTimestamp // pass current timestamp for test compatibility
        );
        
        giftWrapResults.push(giftWrapResult);
      }
      
      // For the protocol result, we return the seal from the first recipient
      // (all seals are identical except for encryption to different recipients)
      const firstSeal = await SealCreator.createSealWithSigner(rumor, signer as any, config.recipients[0].pubkey);
      
      return {
        rumor,
        seal: firstSeal,
        giftWraps: giftWrapResults,
        senderPrivateKey: undefined as any
      };
      
    } catch (error) {
      if (error instanceof NIP59Error) throw error;
      throw new NIP59Error(
        `Gift wrap protocol failed: ${error.message}`,
        NIP59ErrorCode.GIFT_WRAP_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Decrypt a gift-wrapped direct message
   * Returns the original rumor and verification status
   */
  // Raw-key decryption path removed in P1. Decryption is performed upstream via signer decryptor injection.

  /**
   * Create a rumor (unsigned event) containing the message
   */
  private static createRumor(message: string, senderPublicKey: string, subject?: string): Rumor {
    
    // Build tags array - add subject tag if provided (per NIP-17)
    const tags: string[][] = [];
    if (subject) {
      tags.push(['subject', subject]);
    }
    
    return {
      pubkey: senderPublicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 14, // Chat message kind (NIP-17, not 4)
      tags,
      content: message
    };
  }

  /**
   * Create gift wraps for a batch of messages to multiple recipients
   * Useful for sending the same message to multiple people
   */
  static async createBatchGiftWraps(
    messages: Array<{
      message: string;
      senderPrivateKey: string;
      config: GiftWrapConfig;
    }>
  ): Promise<GiftWrapProtocolResult[]> {
    const results: GiftWrapProtocolResult[] = [];
    
    for (const messageData of messages) {
      const result = await this.createGiftWrappedDM(
        messageData.message,
        messageData.senderPrivateKey,
        messageData.config
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * Extract all gift wraps that are meant for a specific recipient
   * Useful for filtering gift wraps from a relay
   */
  static filterGiftWrapsForRecipient(
    giftWraps: GiftWrap[],
    recipientPubkey: string
  ): GiftWrap[] {
    return giftWraps.filter(giftWrap => {
      const recipient = GiftWrapCreator.getRecipientFromGiftWrap(giftWrap);
      return recipient === recipientPubkey;
    });
  }

  /**
   * Decrypt multiple gift wraps for a recipient
   * Returns successful decryptions and filters out invalid ones
   */
  static async decryptMultipleGiftWraps(
    giftWraps: GiftWrap[],
    recipientPrivateKey: string
  ): Promise<GiftWrapDecryptionResult[]> {
    const results: GiftWrapDecryptionResult[] = [];
    
    for (const giftWrap of giftWraps) {
      const result = await this.decryptGiftWrappedDM(giftWrap, recipientPrivateKey);
      if (result.isValid) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Validate inputs for creating gift-wrapped DMs
   */
  private static validateCreateDMInputs(
    message: string,
    senderPrivateKey: string,
    config: GiftWrapConfig
  ): void {
    if (typeof message !== 'string') {
      throw new NIP59Error(
        'Message must be a string',
        NIP59ErrorCode.INVALID_RUMOR
      );
    }
    
    if (typeof senderPrivateKey !== 'string' || !/^[0-9a-f]{64}$/i.test(senderPrivateKey)) {
      throw new NIP59Error(
        'Invalid sender private key format',
        NIP59ErrorCode.SEAL_CREATION_FAILED
      );
    }
    
    if (!config || !Array.isArray(config.recipients) || config.recipients.length === 0) {
      throw new NIP59Error(
        'At least one recipient is required',
        NIP59ErrorCode.NO_RECIPIENTS
      );
    }
    
    // Validate each recipient
    for (const recipient of config.recipients) {
      if (!recipient || typeof recipient.pubkey !== 'string' || 
          !/^[0-9a-f]{64}$/i.test(recipient.pubkey)) {
        throw new NIP59Error(
          'Invalid recipient public key format',
          NIP59ErrorCode.INVALID_RECIPIENT
        );
      }
    }
  }

  /**
   * Get public key from private key
   */
  private static getPublicKeyFromPrivate(privateKey: string): string {
    try {
      // Convert hex private key to bytes for secp256k1
      const privateKeyBytes = new Uint8Array(
        privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
      // Convert bytes to hex without using Buffer (browser-compatible)
      const publicKeySlice = publicKeyBytes.slice(1, 33);
      const result = Array.from(publicKeySlice)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return result;
    } catch (error) {
      throw new NIP59Error(
        'Failed to derive public key from private key',
        NIP59ErrorCode.SEAL_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Utility: Create a simple gift wrap configuration for single recipient
   */
  static createSimpleConfig(
    recipientPubkey: string,
    relayHint?: string
  ): GiftWrapConfig {
    return {
      recipients: [{
        pubkey: recipientPubkey,
        relayHint
      }],
      relayHint
    };
  }

  /**
   * Utility: Create a multi-recipient gift wrap configuration
   */
  static createMultiRecipientConfig(
    recipientPubkeys: string[],
    globalRelayHint?: string
  ): GiftWrapConfig {
    return {
      recipients: recipientPubkeys.map(pubkey => ({
        pubkey,
        relayHint: globalRelayHint
      })),
      relayHint: globalRelayHint
    };
  }

  /**
   * Get protocol statistics for monitoring and debugging
   */
  static getProtocolStats(results: GiftWrapProtocolResult[]): {
    totalMessages: number;
    totalGiftWraps: number;
    averageTimestampAge: number;
    uniqueRecipients: number;
  } {
    const totalMessages = results.length;
    const totalGiftWraps = results.reduce((sum, result) => sum + result.giftWraps.length, 0);
    
    const now = Math.floor(Date.now() / 1000);
    const timestampAges = results.flatMap(result => 
      result.giftWraps.map(gw => now - gw.giftWrap.created_at)
    );
    const averageTimestampAge = timestampAges.length > 0 
      ? timestampAges.reduce((sum, age) => sum + age, 0) / timestampAges.length 
      : 0;
    
    const recipientSet = new Set(
      results.flatMap(result => result.giftWraps.map(gw => gw.recipient))
    );
    
    return {
      totalMessages,
      totalGiftWraps,
      averageTimestampAge,
      uniqueRecipients: recipientSet.size
    };
  }

  /**
   * Unwrap any gift-wrapped event to reveal the actual content
   * This is the core method for transparent caching of any encrypted event type
   * DMs are just one use case - this works for ANY event kind wrapped in gift wrap
   */
  static async unwrapGiftWrap(giftWrapEvent: NostrEvent, recipientPrivateKey: string): Promise<NostrEvent | null> {
    try {
      // Validate input
      if (!giftWrapEvent || giftWrapEvent.kind !== 1059) {
        return null;
      }

      // If decrypt capability exists on provider, we will use it upstream (cache),
      // here we only validate hex if we actually got a key string.
      if (recipientPrivateKey && recipientPrivateKey.startsWith('0x')) {
        recipientPrivateKey = recipientPrivateKey.slice(2);
      }
      if (!/^[0-9a-f]{64}$/i.test(recipientPrivateKey)) {
        throw new NIP59Error(
          'Invalid recipient private key format',
          NIP59ErrorCode.INVALID_PRIVATE_KEY
        );
      }

      // Import seal unwrapping functionality
      const { SealCreator } = await import('./SealCreator.js');
      const { NIP44Crypto } = await import('../crypto/NIP44Crypto.js');

      // First, unwrap the gift wrap to get the seal
      const conversationKey = NIP44Crypto.deriveConversationKey(
        recipientPrivateKey,
        giftWrapEvent.pubkey
      );
      
      const unwrappedSealResult = NIP44Crypto.decrypt(
        giftWrapEvent.content,
        conversationKey
      );

      if (!unwrappedSealResult || !unwrappedSealResult.isValid) {
        return null;
      }

      // Parse the seal event
      const sealEvent = JSON.parse(unwrappedSealResult.plaintext);
      
      if (!sealEvent || sealEvent.kind !== 13) {
        return null;
      }

      // Now unwrap the seal to get the actual rumor (DM)
      const sealConversationKey = NIP44Crypto.deriveConversationKey(
        recipientPrivateKey,
        sealEvent.pubkey
      );
      
      const rumorContentResult = NIP44Crypto.decrypt(
        sealEvent.content,
        sealConversationKey
      );

      if (!rumorContentResult || !rumorContentResult.isValid) {
        return null;
      }

      // Parse the rumor (actual encrypted content - can be ANY event kind!)
      const rumorEvent = JSON.parse(rumorContentResult.plaintext);
      
      // Validate it's a valid event structure (no kind restrictions - this is the power!)
      if (!rumorEvent || typeof rumorEvent.kind !== 'number') {
        return null;
      }

      return rumorEvent;

    } catch (error) {
      console.error('Failed to unwrap gift wrapped DM:', error);
      return null;
    }
  }
}