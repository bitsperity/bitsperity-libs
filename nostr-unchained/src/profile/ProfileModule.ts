/**
 * ProfileModule - Enhanced Profile Management API
 * 
 * Provides the fluent, builder-pattern API for profile operations
 * as specified in the Profile DX proposal.
 * 
 * This module wraps the existing ProfileManager with enhanced functionality:
 * - Reactive profile stores with get() method
 * - ProfileBuilder for fluent profile editing
 * - Batch operations for efficiency
 * - Follow list management
 * - Profile discovery
 */

import { ProfileStore } from './ProfileStore.js';
import { ProfileBuilder } from './ProfileBuilder.js';
import { ProfileBatchBuilder } from './ProfileBatchBuilder.js';
import { ProfileDiscoveryBuilder } from './ProfileDiscoveryBuilder.js';
import { FollowsModule } from './FollowsModule.js';
// Clean architecture imports
import type { NostrUnchained } from '../core/NostrUnchained.js';
import type { UserProfile } from './types.js';
import type { NostrEvent } from '../core/types.js';
import type { UniversalNostrStore } from '../store/UniversalNostrStore.js';
// Legacy imports
import type { RelayManager } from '../relay/RelayManager.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { EventBuilder } from '../core/EventBuilder.js';
// Phase 8: Cache optimization
import type { UniversalEventCache } from '../cache/UniversalEventCache.js';

export interface ProfileModuleConfig {
  relayManager: RelayManager;
  subscriptionManager: SubscriptionManager;
  signingProvider?: SigningProvider;
  eventBuilder: EventBuilder;
  cache?: UniversalEventCache; // Phase 8: Optional cache for optimization
  debug?: boolean;
  // New: NostrUnchained instance for clean base layer access
  nostr?: NostrUnchained;
}

export class ProfileModule {
  private config: ProfileModuleConfig;
  private profileStores = new Map<string, ProfileStore>();
  private _follows?: FollowsModule;

  constructor(config: ProfileModuleConfig) {
    this.config = config;
  }

  /**
   * Get a reactive profile store for any pubkey
   * This is the main entry point for profile subscriptions
   * 
   * NEW: Uses clean base layer architecture when NostrUnchained instance is available
   * LEGACY: Falls back to ProfileStore for backward compatibility
   */
  get(pubkey: string): ProfileStore | UniversalNostrStore<UserProfile | null> {
    // NEW: Use clean base layer architecture if available
    if (this.config.nostr) {
      return this.getClean(pubkey);
    }

    // LEGACY: Backward compatibility with ProfileStore
    return this.getLegacy(pubkey);
  }

  /**
   * NEW: Clean base layer implementation
   */
  private getClean(pubkey: string): UniversalNostrStore<UserProfile | null> {
    if (!this.config.nostr) {
      throw new Error('NostrUnchained instance required for clean architecture');
    }

    // Start subscription for live updates
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
   * LEGACY: Original ProfileStore implementation
   */
  private getLegacy(pubkey: string): ProfileStore {
    // Return existing store if available
    if (this.profileStores.has(pubkey)) {
      return this.profileStores.get(pubkey)!;
    }

    // Create new profile store (Phase 8: with cache support)
    const store = new ProfileStore({
      pubkey,
      subscriptionManager: this.config.subscriptionManager,
      cache: this.config.cache, // Phase 8: Pass cache to ProfileStore
      debug: this.config.debug
    });

    // CRITICAL FIX: Start loading profile data immediately
    store.refresh().catch(err => {
      if (this.config.debug) {
        console.error('Failed to start profile loading:', err);
      }
    });

    this.profileStores.set(pubkey, store);
    return store;
  }

  /**
   * Start subscription for profile updates (Clean architecture)
   */
  private async startProfileSubscription(pubkey: string): Promise<void> {
    if (!this.config.nostr) return;
    
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
   * Parse NostrEvent[] to UserProfile | null (Clean architecture)
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
        debug: this.config.debug
      });
    }
    return this._follows;
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
    // Close all profile stores
    for (const store of this.profileStores.values()) {
      await store.close();
    }
    this.profileStores.clear();

    // Close follows module if initialized
    if (this._follows) {
      await this._follows.close();
    }
  }
}