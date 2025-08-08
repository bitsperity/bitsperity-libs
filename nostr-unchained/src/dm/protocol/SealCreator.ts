/**
 * Seal Creator for NIP-59 Gift Wrap Protocol
 * 
 * Creates kind 13 seals containing NIP-44 encrypted rumors.
 * The seal is signed by the real sender's private key.
 */

import { sha256 } from '@noble/hashes/sha256';
import { 
  Rumor, 
  Seal, 
  NIP59Error, 
  NIP59ErrorCode, 
  NIP59_CONFIG 
} from '../types/nip59-types.js';

export class SealCreator {

  /**
   * Create a kind 13 seal using a signer (no raw private key exposure)
   * Requires signer.nip44Encrypt and signer.signEvent
   */
  static async createSealWithSigner(
    rumor: Rumor,
    signer: { nip44Encrypt: (peerPubkey: string, plaintext: string) => Promise<string>; signEvent?: (event: any) => Promise<string>; getPublicKeySync?: () => string | null; getPublicKey?: () => Promise<string> },
    recipientPublicKey: string
  ): Promise<Seal> {
    try {
      // Validate inputs
      this.validateRumor(rumor);
      this.validatePublicKey(recipientPublicKey);

      if (!signer || typeof signer.nip44Encrypt !== 'function') {
        throw new NIP59Error(
          'Signer must provide nip44Encrypt capability',
          NIP59ErrorCode.SEAL_CREATION_FAILED
        );
      }
      if (typeof signer.signEvent !== 'function') {
        throw new NIP59Error(
          'Signer must provide signEvent capability',
          NIP59ErrorCode.SEAL_CREATION_FAILED
        );
      }

      // Serialize rumor and encrypt using signer
      const rumorJson = JSON.stringify(rumor);
      const payload = await signer.nip44Encrypt(recipientPublicKey, rumorJson);

      // Determine sender public key (prefer rumor.pubkey)
      const senderPublicKey = rumor.pubkey;

      // Build unsigned seal
      const unsignedSeal = {
        pubkey: senderPublicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: NIP59_CONFIG.SEAL_KIND,
        tags: [],
        content: payload
      };

      // Calculate id and sign via signer
      const eventId = this.calculateEventId(unsignedSeal);
      // Some signers expect `id` precomputed; ensure property exists for signature context
      const signTarget = { ...unsignedSeal, id: eventId };
      const signature = await signer.signEvent!(signTarget);

      // Return complete seal
      const seal: Seal = {
        id: eventId,
        pubkey: senderPublicKey,
        created_at: unsignedSeal.created_at,
        kind: NIP59_CONFIG.SEAL_KIND,
        tags: [],
        content: payload,
        sig: signature
      };

      return seal;
    } catch (error) {
      if (error instanceof NIP59Error) throw error;
      throw new NIP59Error(
        `Seal creation (with signer) failed: ${error.message}`,
        NIP59ErrorCode.SEAL_CREATION_FAILED,
        error
      );
    }
  }

  // Raw-key decrypt path removed in P1

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
  // Raw-key validation removed in P1

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
  // Raw-key public key derivation removed in P1

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
  // Raw-key Schnorr signing removed in P1
}