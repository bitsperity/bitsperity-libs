/**
 * Profile Types for Social Media Core
 * Based on NIP-01 Kind 0 (User Metadata)
 */

import type { NostrEvent } from '../../core/types.js';

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
 * Profile update request
 */
export interface ProfileUpdate {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  website?: string;
  lud06?: string;
  lud16?: string;
}

/**
 * Profile creation request (extends update with required fields)
 */
export interface ProfileCreateRequest extends ProfileUpdate {
  name: string;            // Name is required for creation
}

/**
 * Profile publish result
 */
export interface ProfilePublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
  profile?: UserProfile;
}

/**
 * Profile fetch options
 */
export interface ProfileFetchOptions {
  relayHints?: string[];   // Specific relays to query
  timeout?: number;        // Fetch timeout in ms
  useCache?: boolean;      // Whether to use cached data
}

/**
 * Profile cache entry
 */
export interface ProfileCacheEntry {
  profile: UserProfile;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Profile validation result
 */
export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Profile event according to NIP-01
 */
export interface ProfileEvent extends NostrEvent {
  kind: 0;                 // Always kind 0 for profiles
  content: string;         // JSON string of ProfileMetadata
  tags: [];               // Profile events have empty tags array
}