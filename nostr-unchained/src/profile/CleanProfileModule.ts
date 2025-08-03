/**
 * CleanProfileModule - Base Layer Integration
 * 
 * Clean architecture implementation using the base layer:
 * - Uses nostr.query() for cache-first profile loading
 * - Returns UniversalNostrStore for reactive profile data
 * - No ProfileStore dependency - direct base layer usage
 */

import type { NostrUnchained } from '../core/NostrUnchained.js';
import type { UserProfile } from './types.js';
import type { NostrEvent } from '../core/types.js';
import type { UniversalNostrStore } from '../store/UniversalNostrStore.js';

export class CleanProfileModule {
  constructor(private nostr: NostrUnchained) {}

  /**
   * Get reactive profile store for a pubkey
   * Returns UniversalNostrStore that provides:
   * - Immediate cache access via .current
   * - Reactive updates via .subscribe()
   * - Svelte store compatibility
   * 
   * This method automatically:
   * 1. Returns cached data immediately if available
   * 2. Starts a subscription for live updates
   * 3. Handles all subscription lifecycle management
   */
  get(pubkey: string): UniversalNostrStore<UserProfile | null> {
    // Start subscription for live updates
    this.startProfileSubscription(pubkey);
    
    // Return reactive store based on cache
    return this.nostr.query()
      .kinds([0])
      .authors([pubkey])
      .limit(1)
      .execute()
      .map(events => this.parseProfileEvents(events, pubkey));
  }

  /**
   * Start subscription for profile updates
   * Uses the enhanced subscription manager with deduplication
   */
  private async startProfileSubscription(pubkey: string): Promise<void> {
    try {
      await this.nostr.sub()
        .kinds([0])
        .authors([pubkey])
        .limit(1)
        .execute();
    } catch (error) {
      console.warn(`Failed to start profile subscription for ${pubkey}:`, error);
    }
  }

  /**
   * Parse NostrEvent[] to UserProfile | null
   * Handles the transformation from raw events to domain objects
   */
  private parseProfileEvents(events: NostrEvent[], pubkey: string): UserProfile | null {
    if (events.length === 0) {
      return null;
    }

    const event = events[0];
    if (event.kind !== 0 || event.pubkey !== pubkey) {
      return null;
    }

    try {
      const metadata = JSON.parse(event.content);
      return {
        pubkey: event.pubkey,
        metadata,
        lastUpdated: event.created_at,
        eventId: event.id,
        isOwn: false // Will be determined by caller if needed
      };
    } catch (error) {
      console.warn(`Failed to parse profile event for ${pubkey}:`, error);
      return null;
    }
  }
}