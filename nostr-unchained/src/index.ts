/**
 * Nostr Unchained - Main Export
 * 
 * SQL-ähnliche Eleganz für dezentralisierte Event-Graphen
 * Simple, zero-config Nostr publishing for everyone.
 */

// Main class
export { NostrUnchained } from './core/NostrUnchained.js';

// Types for advanced usage
export type {
  NostrEvent,
  UnsignedEvent,
  NostrUnchainedConfig,
  PublishResult,
  RelayResult,
  NostrError,
  RelayInfo,
  SigningProvider,
  // Milestone 2 types
  Filter,
  Subscription,
  SubscriptionOptions,
  SubscriptionResult,
  QueryBuilder,
  FeedStore
} from './core/types.js';

// Utilities for advanced usage
export { EventBuilder } from './core/EventBuilder.js';
export { RelayManager } from './relay/RelayManager.js';
export { SigningProviderFactory, ExtensionSigner, LocalKeySigner, QuickSigner, TemporarySigner } from './crypto/SigningProvider.js';
export { ErrorHandler } from './utils/errors.js';

// Event Builder API
export { FluentEventBuilder, EventsModule } from './events/FluentEventBuilder.js';

// Milestone 2 exports
export { SubscriptionManager } from './subscription/SubscriptionManager.js';
export { QueryBuilder, SubBuilder } from './query/QueryBuilder.js';
export type { SubscriptionHandle } from './query/QueryBuilder.js';

// Day 3 Store exports - Reactive NostrStore system
export { 
  createFeed, 
  createFeedFromQuery, 
  createFeedFromFilter, 
  setDefaultSubscriptionManager,
  FeedStoreImpl,
  writable,
  derived
} from './store/NostrStore.js';
export type { 
  NostrStore, 
  FeedStore, 
  FeedBuilder, 
  Readable, 
  Writable, 
  StoreStatus 
} from './store/NostrStore.js';

// Direct Message Module (NIP-44 & NIP-59)
export * as DM from './dm/index.js';

// Profile Module (Enhanced Profile Management)
export * as Profile from './profile/index.js';

// Constants
export { DEFAULT_RELAYS, EVENT_KINDS } from './utils/constants.js';

// NIP-19 Encoding Utilities
export {
  // Basic conversion functions
  hexToNpub,
  hexToNsec,
  hexToNote,
  npubToHex,
  nsecToHex,
  noteToHex,
  // Extended entities
  createNprofile,
  createNevent,
  createNaddr,
  // Low-level encoding functions
  npubEncode,
  nsecEncode,
  noteEncode,
  nprofileEncode,
  neventEncode,
  naddrEncode,
  // Universal decoder
  decode,
  // Validation helpers
  isValidHexKey,
  isValidNpub,
  isValidNsec,
  isValidNote,
  // Types
  type NPub,
  type NSec,
  type Note,
  type NProfile,
  type NEvent,
  type NAddr,
  type ProfilePointer,
  type EventPointer,
  type AddressPointer,
  type DecodedResult,
  type DecodedNpub,
  type DecodedNsec,
  type DecodedNote,
  type DecodedNprofile,
  type DecodedNevent,
  type DecodedNaddr
} from './utils/encoding-utils.js';

// Version (will be updated by build process)
export const VERSION = '0.2.0';