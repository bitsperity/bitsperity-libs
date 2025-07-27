/**
 * Contact Types - NIP-02 Kind 3 Contact Lists
 * Session 4 Phase 2: Contact Management
 */

import type { NostrEvent } from '../../core/types.js';

/**
 * Contact entry in a contact list
 * Based on NIP-02 p-tags in Kind 3 events
 */
export interface Contact {
  /** Public key of the contact */
  pubkey: string;
  /** Optional relay URL for this contact */
  relayUrl?: string;
  /** Optional petname (local nickname) */
  petname?: string;
}

/**
 * Full contact list for a user
 * Represents the parsed content of a NIP-02 Kind 3 event
 */
export interface ContactList {
  /** Array of contacts (following) */
  contacts: Contact[];
  /** Owner's public key */
  ownerPubkey: string;
  /** Timestamp when list was last updated */
  lastUpdated: number;
  /** Event ID of the contact list event */
  eventId?: string;
  /** Whether this is the user's own contact list */
  isOwn: boolean;
}

/**
 * NIP-02 Kind 3 contact list event
 */
export interface ContactEvent extends NostrEvent {
  kind: 3;
  /** JSON content - usually empty for contact lists */
  content: string;
  /** p-tags containing contact information */
  tags: string[][];
}

/**
 * Request to follow a new contact
 */
export interface FollowRequest {
  /** Public key to follow */
  pubkey: string;
  /** Optional relay URL for this contact */
  relayUrl?: string;
  /** Optional petname (local nickname) */
  petname?: string;
}

/**
 * Request to unfollow a contact
 */
export interface UnfollowRequest {
  /** Public key to unfollow */
  pubkey: string;
}

/**
 * Result of a follow/unfollow operation
 */
export interface ContactUpdateResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Updated contact list if successful */
  contactList?: ContactList;
  /** Event ID of the published contact list */
  eventId?: string;
}

/**
 * Options for fetching contact lists
 */
export interface ContactFetchOptions {
  /** Whether to use cached data if available */
  useCache?: boolean;
  /** Timeout for the request in milliseconds */
  timeout?: number;
  /** Whether to include relay information */
  includeRelays?: boolean;
}

/**
 * Configuration for ContactManager
 */
export interface ContactManagerConfig {
  subscriptionManager: any;
  relayManager: any;
  signingProvider: any;
  eventBuilder: any;
  debug?: boolean;
}

/**
 * Cache entry for contact lists
 */
export interface ContactCacheEntry {
  contactList: ContactList;
  timestamp: number;
  ttl: number;
}