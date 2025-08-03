/**
 * ProfileModule - Clean Profile Management API
 * 
 * Pure clean architecture implementation using base layer directly:
 * - Uses nostr.query() for cache-first profile loading
 * - Returns UniversalNostrStore for reactive profile data
 * - ProfileBuilder for fluent profile editing
 * - Batch operations for efficiency
 * - Follow list management
 * - Profile discovery
 */

import { ProfileBuilder } from './ProfileBuilder.js';
import { ProfileBatchBuilder } from './ProfileBatchBuilder.js';
import { ProfileDiscoveryBuilder } from './ProfileDiscoveryBuilder.js';
import { FollowsModule } from './FollowsModule.js';
// Clean architecture imports
import type { NostrUnchained } from '../core/NostrUnchained.js';
import type { UserProfile } from './types.js';
import type { NostrEvent } from '../core/types.js';
import type { UniversalNostrStore } from '../store/UniversalNostrStore.js';
// Required for builders
import type { RelayManager } from '../relay/RelayManager.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { EventBuilder } from '../core/EventBuilder.js';

export interface ProfileModuleConfig {
  relayManager: RelayManager;
  subscriptionManager: SubscriptionManager;
  signingProvider?: SigningProvider;
  eventBuilder: EventBuilder;
  debug?: boolean;
  // REQUIRED: NostrUnchained instance for clean base layer access
  nostr: NostrUnchained;
}

export class ProfileModule {
  private config: ProfileModuleConfig;
  private _follows?: FollowsModule;

  constructor(config: ProfileModuleConfig) {
    this.config = config;
  }

  /**
   * Get a reactive profile store for any pubkey
   * 
   * CLEAN ARCHITECTURE: Uses base layer directly for perfect DX
   * Returns UniversalNostrStore with automatic caching and live updates
   */
  get(pubkey: string): UniversalNostrStore<UserProfile | null> {
    // Start subscription for live updates - deduplication handled by SubscriptionManager
    this.startProfileSubscription(pubkey);
    
    // Return reactive store based on cache
    return this.config.nostr.query()
      .kinds([0])
      .authors([pubkey])
      .limit(1)
      .execute()
      .map(events => this.parseProfileEvents(events, pubkey));
  }

  /**
   * Start subscription for profile updates
   */
  private async startProfileSubscription(pubkey: string): Promise<void> {
    try {
      await this.config.nostr.sub()
        .kinds([0])
        .authors([pubkey])
        .limit(1)
        .execute();
    } catch (error) {
      if (this.config.debug) {
        console.warn(`Failed to start profile subscription for ${pubkey}:`, error);
      }
    }
  }

  /**
   * Parse NostrEvent[] to UserProfile | null
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
      if (this.config.debug) {
        console.warn(`Failed to parse profile event for ${pubkey}:`, error);
      }
      return null;
    }
  }

  /**
   * Phase 2: Profile Creation & Updates - Fluent Builder API
   * Creates a ProfileBuilder for updating profiles with field preservation
   */
  edit(): ProfileBuilder {
    if (!this.config.signingProvider) {
      throw new Error('Cannot edit profile: No signing provider available. Initialize signing first.');
    }

    return new ProfileBuilder({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
    });
  }

  /**
   * Phase 3: Follow List Operations - Access to follow lists
   * Get access to follow list management (mine() and of() methods)
   */
  get follows(): FollowsModule {
    if (!this._follows) {
      this._follows = new FollowsModule({
        subscriptionManager: this.config.subscriptionManager,
        relayManager: this.config.relayManager,
        signingProvider: this.config.signingProvider,
        debug: this.config.debug,
        nostr: this.config.nostr
      });
    }
    return this._follows;
  }

  /**
   * Get follower count for any pubkey
   * Returns reactive count of users who follow this pubkey
   */
  followerCount(pubkey: string) {
    return this.follows.followers(pubkey);
  }

  /**
   * Phase 5: Batch Profile Operations - Efficient multiple profile fetching
   * Creates a ProfileBatchBuilder for bulk profile operations
   */
  batch(): ProfileBatchBuilder {
    return new ProfileBatchBuilder({
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
  }

  /**
   * Phase 6: Profile Discovery - Search and discover profiles
   * Creates a ProfileDiscoveryBuilder for profile search operations
   */
  discover(): ProfileDiscoveryBuilder {
    return new ProfileDiscoveryBuilder({
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
  }

  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    
    // Update follows module if initialized
    if (this._follows) {
      await this._follows.updateSigningProvider(signingProvider);
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    // Close follows module if initialized
    if (this._follows) {
      await this._follows.close();
    }
  }
}