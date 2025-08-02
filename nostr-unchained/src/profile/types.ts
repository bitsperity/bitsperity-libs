/**
 * Profile Types - Enhanced Profile Management
 * 
 * Types for the new Profile API that replaces the old social profile implementation
 */

import type { NostrEvent } from '../core/types.js';

/**
 * User Profile Metadata according to NIP-01
 */
export interface ProfileMetadata {
  name?: string;           // Username/display name
  about?: string;          // Bio/description
  picture?: string;        // Avatar URL
  banner?: string;         // Banner image URL
  nip05?: string;          // NIP-05 identifier (e.g., alice@example.com)
  website?: string;        // Personal website
  lud06?: string;          // Lightning address for tips
  lud16?: string;          // Lightning URL for tips
}

/**
 * Complete User Profile with metadata and system fields
 */
export interface UserProfile {
  pubkey: string;          // User's public key
  metadata: ProfileMetadata;
  lastUpdated: number;     // Timestamp of last profile update
  eventId?: string;        // ID of the profile event
  isOwn: boolean;          // Whether this is the current user's profile
}

/**
 * Profile event according to NIP-01
 */
export interface ProfileEvent extends NostrEvent {
  kind: 0;                 // Always kind 0 for profiles
  content: string;         // JSON string of ProfileMetadata
  tags: [];               // Profile events have empty tags array
}

/**
 * Publish result for profile operations
 */
export interface PublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Follow entry in a follow list (NIP-02)
 */
export interface Follow {
  pubkey: string;          // Public key being followed
  relayUrl?: string;       // Preferred relay for this follow
  petname?: string;        // Pet name/alias for this follow
}

/**
 * Follow List State for reactive stores
 */
export interface FollowListState {
  follows: Follow[];       // Array of follows
  loading: boolean;        // Whether currently loading
  error: Error | null;     // Any error that occurred
  lastUpdated: Date | null; // When the follow list was last updated
  eventId?: string;        // ID of the follow list event
}

/**
 * Follow List Event according to NIP-02
 */
export interface FollowListEvent extends NostrEvent {
  kind: 3;                 // Always kind 3 for follow lists
  content: string;         // Usually empty for follow lists
  tags: string[][];        // p-tags with followed pubkeys
}

/**
 * Batch Profile Result for multiple profile operations
 */
export interface BatchProfileResult {
  profiles: Map<string, UserProfile | null>; // pubkey -> profile (null if not found)
  success: boolean;        // Whether batch operation succeeded
  errors: Map<string, string>; // pubkey -> error message for failed profiles
  totalRequested: number;  // Total profiles requested
  totalFound: number;      // Total profiles found
}

/**
 * Batch Profile State for reactive stores
 */
export interface BatchProfileState {
  profiles: Map<string, UserProfile | null>; // pubkey -> profile
  loading: boolean;        // Whether currently loading
  loadingStates: Map<string, boolean>; // Individual loading states per pubkey
  errors: Map<string, Error>; // Individual errors per pubkey
  lastUpdated: Date | null; // When batch was last updated
}

/**
 * Profile Discovery Result
 */
export interface ProfileDiscoveryResult {
  profile: UserProfile;    // The discovered profile
  matchedFields: string[]; // Which fields matched the search criteria
  relevanceScore: number;  // Relevance score for ranking (0-1)
}

/**
 * Profile Discovery Search Criteria
 */
export interface ProfileSearchCriteria {
  nameQuery?: string;      // Search by name (substring match)
  nip05Query?: string;     // Search by NIP-05 identifier
  metadataFilters?: Map<string, any>; // Metadata key-value filters
  verifiedOnly?: boolean;  // Only include NIP-05 verified profiles
  limit?: number;          // Maximum results to return
}