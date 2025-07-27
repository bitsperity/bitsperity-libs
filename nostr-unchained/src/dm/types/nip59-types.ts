/**
 * NIP-59 Gift Wrap Protocol Types
 * 
 * Implements the 3-layer encryption system:
 * 1. Rumor (unsigned event) - The actual message content
 * 2. Seal (kind 13) - NIP-44 encrypted rumor, signed by sender
 * 3. Gift Wrap (kind 1059) - NIP-44 encrypted seal with random ephemeral key
 */

import { NostrEvent, UnsignedEvent } from '../../core/types.js';

/**
 * Rumor - Unsigned event containing the actual message
 * This is what gets encrypted in the seal
 */
export interface Rumor extends Omit<UnsignedEvent, 'id' | 'sig'> {
  // No id or sig - it's unsigned
}

/**
 * Seal - Kind 13 event containing encrypted rumor
 * Signed by the real author's key
 */
export interface Seal extends NostrEvent {
  kind: 13;
  content: string; // NIP-44 encrypted rumor (base64)
  tags: never[]; // Always empty array
}

/**
 * Gift Wrap - Kind 1059 event containing encrypted seal
 * Signed by ephemeral key, sent to recipient
 */
export interface GiftWrap extends NostrEvent {
  kind: 1059;
  content: string; // NIP-44 encrypted seal (base64)
  tags: [['p', string, string?]]; // Recipient pubkey + optional relay hint
  pubkey: string; // Ephemeral public key
  created_at: number; // Randomized timestamp (up to 2 days in past)
}

/**
 * Ephemeral key pair for gift wrap creation
 */
export interface EphemeralKeyPair {
  privateKey: string; // 32-byte hex private key
  publicKey: string;  // 32-byte hex public key (x-coordinate)
}

/**
 * Gift wrap creation configuration
 */
export interface GiftWrapConfig {
  recipients: GiftWrapRecipient[];
  relayHint?: string; // Optional relay hint for all recipients
  maxTimestampAge?: number; // Max age in seconds (default: 2 days)
}

/**
 * Individual recipient configuration
 */
export interface GiftWrapRecipient {
  pubkey: string; // Recipient's public key (32-byte hex)
  relayHint?: string; // Optional relay hint for this recipient
}

/**
 * Result of gift wrap creation for a single recipient
 */
export interface GiftWrapResult {
  giftWrap: GiftWrap;
  ephemeralKeyPair: EphemeralKeyPair;
  recipient: string; // Recipient pubkey
}

/**
 * Complete gift wrap protocol result
 */
export interface GiftWrapProtocolResult {
  rumor: Rumor;
  seal: Seal;
  giftWraps: GiftWrapResult[];
  senderPrivateKey: string; // Used for seal creation
}

/**
 * Gift wrap decryption result
 */
export interface GiftWrapDecryptionResult {
  rumor: Rumor;
  seal: Seal;
  isValid: boolean;
  senderPubkey: string; // Original sender from seal
}

/**
 * Error types for NIP-59 operations
 */
export class NIP59Error extends Error {
  constructor(
    message: string,
    public code: NIP59ErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'NIP59Error';
  }
}

export enum NIP59ErrorCode {
  INVALID_RUMOR = 'INVALID_RUMOR',
  SEAL_CREATION_FAILED = 'SEAL_CREATION_FAILED',
  GIFT_WRAP_CREATION_FAILED = 'GIFT_WRAP_CREATION_FAILED',
  EPHEMERAL_KEY_GENERATION_FAILED = 'EPHEMERAL_KEY_GENERATION_FAILED',
  TIMESTAMP_RANDOMIZATION_FAILED = 'TIMESTAMP_RANDOMIZATION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_GIFT_WRAP = 'INVALID_GIFT_WRAP',
  INVALID_SEAL = 'INVALID_SEAL',
  NO_RECIPIENTS = 'NO_RECIPIENTS',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY'
}

/**
 * Configuration constants for NIP-59
 */
export const NIP59_CONFIG = {
  SEAL_KIND: 13,
  GIFT_WRAP_KIND: 1059,
  MAX_TIMESTAMP_AGE_SECONDS: 2 * 24 * 60 * 60, // 2 days
  MIN_TIMESTAMP_AGE_SECONDS: 0 // Can be current time
} as const;