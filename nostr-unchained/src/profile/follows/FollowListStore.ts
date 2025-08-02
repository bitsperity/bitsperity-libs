/**
 * FollowListStore - Reactive Follow List Management
 * 
 * Provides reactive state for follow lists (kind 3 events)
 */

import { writable, derived, type Readable, type Writable } from '../../store/NostrStore.js';
import type { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { NostrEvent, Filter } from '../../core/types.js';

export interface Follow {
  pubkey: string;
  relay?: string;
  petname?: string;
}

export interface FollowListState {
  follows: Follow[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export interface FollowListStoreConfig {
  pubkey?: string; // undefined means own follows
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider?: SigningProvider;
  debug?: boolean;
}

export class FollowListStore implements Readable<FollowListState> {
  private config: FollowListStoreConfig;
  private store: Writable<FollowListState>;
  private subscriptionId?: string;
  
  // Derived stores for easy access
  public readonly follows: Readable<Follow[]>;
  public readonly count: Readable<number>;
  public readonly loading: Readable<boolean>;

  constructor(config: FollowListStoreConfig) {
    this.config = config;
    
    // Initialize store with default state
    this.store = writable<FollowListState>({
      follows: [],
      loading: true,
      error: null,
      lastUpdated: null
    });

    // Create derived stores
    this.follows = derived(this.store, $state => $state.follows);
    this.count = derived(this.store, $state => $state.follows.length);
    this.loading = derived(this.store, $state => $state.loading);

    // Start follow list subscription
    this.initialize();
  }

  /**
   * Subscribe to store changes (Svelte store interface)
   */
  subscribe(run: (value: FollowListState) => void): () => void {
    return this.store.subscribe(run);
  }

  /**
   * Check if following a specific pubkey (reactive)
   */
  isFollowing(pubkey: string): Readable<boolean> {
    return derived(this.follows, $follows => 
      $follows.some(follow => follow.pubkey === pubkey)
    );
  }

  /**
   * Add a follow (optimistic update)
   */
  async addFollow(follow: Follow): Promise<void> {
    // Optimistic update
    this.store.update(state => ({
      ...state,
      follows: [...state.follows.filter(f => f.pubkey !== follow.pubkey), follow]
    }));

    // TODO: Publish to relay
    // This will be implemented in the FollowBuilder
  }

  /**
   * Remove a follow (optimistic update)
   */
  async removeFollow(pubkey: string): Promise<void> {
    // Optimistic update
    this.store.update(state => ({
      ...state,
      follows: state.follows.filter(f => f.pubkey !== pubkey)
    }));

    // TODO: Publish to relay
    // This will be implemented in the remove logic
  }

  /**
   * Refresh follow list from relay
   */
  async refresh(): Promise<void> {
    this.store.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const targetPubkey = this.config.pubkey || 
        (this.config.signingProvider ? await this.config.signingProvider.getPublicKey() : null);
      
      if (!targetPubkey) {
        this.store.set({
          follows: [],
          loading: false,
          error: new Error('No pubkey available'),
          lastUpdated: new Date()
        });
        return;
      }

      // Fetch follow list (kind 3 event)
      const filter: Filter = {
        kinds: [3],
        authors: [targetPubkey],
        limit: 1
      };

      // This is a simplified implementation
      // In production, this would use the subscription manager properly
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.store.set({
            follows: [],
            loading: false,
            error: null,
            lastUpdated: new Date()
          });
          resolve();
        }, 2000);

        // TODO: Implement proper subscription
        clearTimeout(timeout);
        resolve();
      });

    } catch (error) {
      this.store.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch follow list')
      }));
    }
  }

  /**
   * Update signing provider
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    // Refresh if this is our own follow list
    if (!this.config.pubkey) {
      await this.refresh();
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.subscriptionId) {
      await this.config.subscriptionManager.close(this.subscriptionId);
      this.subscriptionId = undefined;
    }
  }

  // Private helper methods

  private async initialize(): Promise<void> {
    await this.refresh();
    // TODO: Set up real-time subscription
  }

  private parseFollowList(event: NostrEvent): Follow[] {
    const follows: Follow[] = [];
    
    for (const tag of event.tags) {
      if (tag[0] === 'p' && tag[1]) {
        follows.push({
          pubkey: tag[1],
          relay: tag[2] || undefined,
          petname: tag[3] || undefined
        });
      }
    }
    
    return follows;
  }
}