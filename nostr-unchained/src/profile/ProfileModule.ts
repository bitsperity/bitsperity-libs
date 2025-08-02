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
// ProfileManager removed - using direct relay queries
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
   */
  get(pubkey: string): ProfileStore {
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