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
export { QueryBuilder, query, createQueryBuilder } from './query/QueryBuilder.js';
export type { IQueryBuilder } from './query/QueryBuilder.js';

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

// Constants
export { DEFAULT_RELAYS, EVENT_KINDS } from './utils/constants.js';

// Version (will be updated by build process)
export const VERSION = '0.1.0';