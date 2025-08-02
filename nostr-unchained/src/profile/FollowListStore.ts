/**
 * FollowListStore - Reactive Follow List State Management
 * 
 * Provides a Svelte-compatible reactive store for follow list data.
 * Automatically subscribes to follow list updates and manages state.
 */

import { writable, derived, type Readable, type Writable } from '../store/NostrStore.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { Follow, FollowListState } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface FollowListStoreConfig {
  pubkey: string;
  subscriptionManager: SubscriptionManager;
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
  public readonly error: Readable<Error | null>;

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
    this.error = derived(this.store, $state => $state.error);

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
   * Check if a pubkey is being followed
   */
  isFollowing(pubkey: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.follows.some(follow => follow.pubkey === pubkey)
    );
  }

  /**
   * Refresh follow list data by querying relays directly
   */
  async refresh(): Promise<void> {
    this.store.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      // Query for follow list events (kind 3)
      const filter: Filter = {
        kinds: [3],
        authors: [this.config.pubkey],
        limit: 1
      };

      let followListFound = false;
      let follows: Follow[] = [];

      const subscriptionResult = await this.config.subscriptionManager.subscribe([filter], {
        onEvent: async (event: NostrEvent) => {
          if (event.kind === 3 && event.pubkey === this.config.pubkey && !followListFound) {
            followListFound = true;
            follows = this.parseFollowListEvent(event);
            
            this.store.set({
              follows,
              loading: false,
              error: null,
              lastUpdated: new Date(),
              eventId: event.id
            });

            if (this.config.debug) {
              console.log(`FollowListStore: Found ${follows.length} follows for ${this.config.pubkey}`);
            }
          }
        },
        onEose: () => {
          if (!followListFound) {
            this.store.set({
              follows: [],
              loading: false,
              error: null,
              lastUpdated: new Date()
            });

            if (this.config.debug) {
              console.log(`FollowListStore: No follow list found for ${this.config.pubkey}`);
            }
          }
        },
        onError: (error: Error) => {
          this.store.update(state => ({
            ...state,
            loading: false,
            error: error
          }));
        }
      });

      // Close subscription after 3 seconds if no response
      setTimeout(async () => {
        if (subscriptionResult.success && subscriptionResult.subscription) {
          await this.config.subscriptionManager.close(subscriptionResult.subscription.id);
        }
        if (!followListFound) {
          this.store.set({
            follows: [],
            loading: false,
            error: null,
            lastUpdated: new Date()
          });
        }
      }, 3000);

    } catch (error) {
      this.store.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch follow list')
      }));
    }
  }

  /**
   * Subscribe to real-time follow list updates
   */
  async startSubscription(): Promise<void> {
    if (this.subscriptionId) return; // Already subscribed
    
    const filter: Filter = {
      kinds: [3],
      authors: [this.config.pubkey],
      limit: 1
    };

    try {
      const result = await this.config.subscriptionManager.subscribe([filter], {
        onEvent: (event: NostrEvent) => {
          if (event.kind === 3 && event.pubkey === this.config.pubkey) {
            this.handleFollowListUpdate(event);
          }
        },
        onError: (error: Error) => {
          this.store.update(state => ({ ...state, error }));
        }
      });

      if (result.success && result.subscription) {
        this.subscriptionId = result.subscription.id;
        
        if (this.config.debug) {
          console.log(`FollowListStore: Subscribed to follow list updates for ${this.config.pubkey}`);
        }
      }
    } catch (error) {
      this.store.update(state => ({ 
        ...state, 
        error: error instanceof Error ? error : new Error('Failed to subscribe') 
      }));
    }
  }

  /**
   * Unsubscribe from follow list updates
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId) {
      await this.config.subscriptionManager.close(this.subscriptionId);
      this.subscriptionId = undefined;
      
      if (this.config.debug) {
        console.log(`FollowListStore: Unsubscribed from follow list updates for ${this.config.pubkey}`);
      }
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    await this.unsubscribe();
  }

  // Private helper methods

  private async initialize(): Promise<void> {
    // Initial fetch
    await this.refresh();
    
    // Subscribe to updates
    this.startSubscription();
  }

  private parseFollowListEvent(event: NostrEvent): Follow[] {
    const follows: Follow[] = [];
    
    try {
      // Parse p-tags from the follow list event
      for (const tag of event.tags) {
        if (tag[0] === 'p' && tag[1]) {
          const follow: Follow = {
            pubkey: tag[1]
          };
          
          // Optional relay URL (3rd element)
          if (tag[2]) {
            follow.relayUrl = tag[2];
          }
          
          // Optional pet name (4th element)
          if (tag[3]) {
            follow.petname = tag[3];
          }
          
          follows.push(follow);
        }
      }

      if (this.config.debug) {
        console.log(`FollowListStore: Parsed ${follows.length} follows from event ${event.id}`);
      }
      
      return follows;
    } catch (error) {
      if (this.config.debug) {
        console.error('FollowListStore: Failed to parse follow list event:', error);
      }
      return [];
    }
  }

  private handleFollowListUpdate(event: NostrEvent): void {
    try {
      const follows = this.parseFollowListEvent(event);

      this.store.set({
        follows,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        eventId: event.id
      });

      if (this.config.debug) {
        console.log(`FollowListStore: Follow list updated for ${this.config.pubkey} (${follows.length} follows)`);
      }
    } catch (error) {
      this.store.update(state => ({
        ...state,
        error: error instanceof Error ? error : new Error('Failed to parse follow list update')
      }));
    }
  }
}