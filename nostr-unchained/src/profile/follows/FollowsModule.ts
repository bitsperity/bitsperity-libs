/**
 * FollowsModule - Follow List Management
 * 
 * Provides comprehensive follow list management with reactive stores
 */

import { FollowListStore } from './FollowListStore.js';
import { FollowBuilder } from './FollowBuilder.js';
import { FollowBatchBuilder } from './FollowBatchBuilder.js';
import { FollowAnalysisBuilder } from './FollowAnalysisBuilder.js';
import type { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { EventBuilder } from '../../core/EventBuilder.js';

export interface FollowsModuleConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider?: SigningProvider;
  eventBuilder: EventBuilder;
  debug?: boolean;
}

export class FollowsModule {
  private config: FollowsModuleConfig;
  private followStores = new Map<string, FollowListStore>();

  constructor(config: FollowsModuleConfig) {
    this.config = config;
  }

  /**
   * Get own follow list
   */
  mine(): FollowListStore {
    if (!this.config.signingProvider) {
      throw new Error('No signing provider available. Please login first.');
    }

    // Use a special key for own follows
    return this.of('__mine__');
  }

  /**
   * Get follow list for any user
   */
  of(pubkey: string): FollowListStore {
    // Return existing store if available
    if (this.followStores.has(pubkey)) {
      return this.followStores.get(pubkey)!;
    }

    // Create new follow list store
    const store = new FollowListStore({
      pubkey: pubkey === '__mine__' ? undefined : pubkey, // undefined means own follows
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
    });

    this.followStores.set(pubkey, store);
    return store;
  }

  /**
   * Add a single follow
   */
  add(pubkey: string): FollowBuilder {
    if (!this.config.signingProvider) {
      throw new Error('No signing provider available. Please login first.');
    }

    return new FollowBuilder({
      targetPubkey: pubkey,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      followListStore: this.mine(),
      debug: this.config.debug
    });
  }

  /**
   * Remove a follow
   */
  async remove(pubkey: string): Promise<{ success: boolean; error?: string }> {
    if (!this.config.signingProvider) {
      return { success: false, error: 'No signing provider available' };
    }

    try {
      const myFollows = this.mine();
      await myFollows.removeFollow(pubkey);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove follow'
      };
    }
  }

  /**
   * Batch follow operations
   */
  batch(): FollowBatchBuilder {
    if (!this.config.signingProvider) {
      throw new Error('No signing provider available. Please login first.');
    }

    return new FollowBatchBuilder({
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      followListStore: this.mine(),
      debug: this.config.debug
    });
  }

  /**
   * Follow analysis and suggestions
   */
  analyze(): FollowAnalysisBuilder {
    return new FollowAnalysisBuilder({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
    });
  }

  /**
   * Update signing provider
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    
    // Update all active follow stores
    for (const store of this.followStores.values()) {
      await store.updateSigningProvider(signingProvider);
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    // Close all follow stores
    for (const store of this.followStores.values()) {
      await store.close();
    }
    this.followStores.clear();
  }
}