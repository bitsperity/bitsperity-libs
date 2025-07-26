/**
 * Direct Message Module for Nostr Unchained
 * 
 * Provides NIP-44 v2 encryption and NIP-59 gift wrap protocols
 * for secure, private direct messaging.
 */

// NIP-44 v2 Encryption
export { NIP44Crypto } from './crypto/NIP44Crypto.js';
export type {
  MessageKeys,
  EncryptionResult,
  DecryptionResult,
  ConversationKey,
  NIP44Error,
  NIP44ErrorCode,
  NIP44_V2_CONFIG
} from './types/crypto-types.js';

// NIP-59 Gift Wrap Protocol
export {
  GiftWrapProtocol,
  SealCreator,
  GiftWrapCreator,
  EphemeralKeyManager,
  TimestampRandomizer
} from './protocol/index.js';

export type {
  Rumor,
  Seal,
  GiftWrap,
  EphemeralKeyPair,
  GiftWrapConfig,
  GiftWrapRecipient,
  GiftWrapResult,
  GiftWrapProtocolResult,
  GiftWrapDecryptionResult,
  NIP59Error,
  NIP59ErrorCode,
  NIP59_CONFIG
} from './types/nip59-types.js';

// NIP-17 Direct Message API
export { DMModule } from './api/DMModule.js';
export { DMConversation } from './conversation/DMConversation.js';
export { DMRoom } from './room/DMRoom.js';
export type {
  DMMessage,
  DMConversationState,
  ConversationStatus
} from './conversation/DMConversation.js';
export type {
  DMRoomOptions,
  DMRoomState,
  DMRoomConfig
} from './room/DMRoom.js';
export type {
  ConversationSummary
} from './api/DMModule.js';