/**
 * ProfileBatchBuilder - Efficient Multiple Profile Operations
 * 
 * Provides batch operations for fetching multiple profiles with a single
 * relay subscription, improving performance for bulk operations.
 */

import { writable, derived, type Readable, type Writable } from '../store/NostrStore.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { UserProfile, BatchProfileResult, BatchProfileState } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface ProfileBatchBuilderConfig {
  subscriptionManager: SubscriptionManager;
  debug?: boolean;
}

export class ProfileBatchBuilder {
  private config: ProfileBatchBuilderConfig;
  private pubkeys: string[] = [];

  constructor(config: ProfileBatchBuilderConfig) {
    this.config = config;
  }

  /**
   * Set the list of pubkeys to fetch profiles for
   */
  get(pubkeys: string[]): this {
    this.pubkeys = [...pubkeys]; // Copy array to avoid mutations
    return this;
  }

  /**
   * Execute batch profile fetch
   */
  async execute(): Promise<BatchProfileResult> {
    if (this.pubkeys.length === 0) {
      return {
        profiles: new Map(),
        success: true,
        errors: new Map(),
        totalRequested: 0,
        totalFound: 0
      };
    }

    if (this.config.debug) {
      console.log(`ProfileBatchBuilder: Fetching ${this.pubkeys.length} profiles`);
    }

    try {
      // Single filter for all profiles (efficient!)
      const filter: Filter = {
        kinds: [0],
        authors: this.pubkeys,
        limit: this.pubkeys.length
      };

      const profiles = new Map<string, UserProfile | null>();
      const errors = new Map<string, string>();
      let foundCount = 0;

      // Initialize all profiles as null (not found)
      this.pubkeys.forEach(pubkey => {
        profiles.set(pubkey, null);
      });

      return new Promise((resolve) => {
        let subscriptionComplete = false;
        
        const timeoutId = setTimeout(() => {
          if (!subscriptionComplete) {
            subscriptionComplete = true;
            resolve({
              profiles,
              success: true,
              errors,
              totalRequested: this.pubkeys.length,
              totalFound: foundCount
            });
          }
        }, 5000); // 5 second timeout for batch

        this.config.subscriptionManager.subscribe([filter], {
          onEvent: (event: NostrEvent) => {
            if (event.kind === 0 && this.pubkeys.includes(event.pubkey)) {
              try {
                const metadata = JSON.parse(event.content);
                const profile: UserProfile = {
                  pubkey: event.pubkey,
                  metadata,
                  lastUpdated: event.created_at,
                  eventId: event.id,
                  isOwn: false // Batch operations are typically for other users
                };
                profiles.set(event.pubkey, profile);
                foundCount++;

                if (this.config.debug) {
                  console.log(`ProfileBatchBuilder: Found profile for ${event.pubkey.substring(0, 16)}...`);
                }
              } catch (error) {
                errors.set(event.pubkey, 'Failed to parse profile data');
                if (this.config.debug) {
                  console.error(`ProfileBatchBuilder: Parse error for ${event.pubkey}:`, error);
                }
              }
            }
          },
          onEose: () => {
            if (!subscriptionComplete) {
              subscriptionComplete = true;
              clearTimeout(timeoutId);
              
              if (this.config.debug) {
                console.log(`ProfileBatchBuilder: Batch complete - found ${foundCount}/${this.pubkeys.length} profiles`);
              }
              
              resolve({
                profiles,
                success: true,
                errors,
                totalRequested: this.pubkeys.length,
                totalFound: foundCount
              });
            }
          },
          onError: (error: Error) => {
            if (!subscriptionComplete) {
              subscriptionComplete = true;
              clearTimeout(timeoutId);
              
              // Mark all as failed
              this.pubkeys.forEach(pubkey => {
                errors.set(pubkey, error.message);
              });
              
              resolve({
                profiles,
                success: false,
                errors,
                totalRequested: this.pubkeys.length,
                totalFound: foundCount
              });
            }
          }
        });
      });

    } catch (error) {
      // Mark all as failed
      const errors = new Map<string, string>();
      this.pubkeys.forEach(pubkey => {
        errors.set(pubkey, error instanceof Error ? error.message : 'Unknown error');
      });

      return {
        profiles: new Map(),
        success: false,
        errors,
        totalRequested: this.pubkeys.length,
        totalFound: 0
      };
    }
  }

  /**
   * Create a reactive store for batch profile operations
   */
  asStore(): Readable<BatchProfileState> {
    if (this.pubkeys.length === 0) {
      // Return empty store
      return writable({
        profiles: new Map(),
        loading: false,
        loadingStates: new Map(),
        errors: new Map(),
        lastUpdated: new Date()
      });
    }

    const store = writable<BatchProfileState>({
      profiles: new Map(),
      loading: true,
      loadingStates: new Map(),
      errors: new Map(),
      lastUpdated: null
    });

    // Initialize loading states
    const initialLoadingStates = new Map<string, boolean>();
    this.pubkeys.forEach(pubkey => {
      initialLoadingStates.set(pubkey, true);
    });
    
    store.update(state => ({
      ...state,
      loadingStates: initialLoadingStates
    }));

    // Execute batch fetch and update store
    this.executeBatchForStore(store);

    return store;
  }

  // Private helper methods

  private async executeBatchForStore(store: Writable<BatchProfileState>): Promise<void> {
    if (this.config.debug) {
      console.log(`ProfileBatchBuilder: Creating reactive store for ${this.pubkeys.length} profiles`);
    }

    try {
      const filter: Filter = {
        kinds: [0],
        authors: this.pubkeys,
        limit: this.pubkeys.length
      };

      const profiles = new Map<string, UserProfile | null>();
      const loadingStates = new Map<string, boolean>();
      const errors = new Map<string, Error>();

      // Initialize all profiles as null and loading
      this.pubkeys.forEach(pubkey => {
        profiles.set(pubkey, null);
        loadingStates.set(pubkey, true);
      });

      // Set initial state
      store.set({
        profiles,
        loading: true,
        loadingStates,
        errors,
        lastUpdated: null
      });

      let subscriptionComplete = false;
      
      const timeoutId = setTimeout(() => {
        if (!subscriptionComplete) {
          subscriptionComplete = true;
          
          // Mark all still-loading profiles as no longer loading
          this.pubkeys.forEach(pubkey => {
            loadingStates.set(pubkey, false);
          });
          
          store.update(state => ({
            ...state,
            loading: false,
            loadingStates,
            lastUpdated: new Date()
          }));
        }
      }, 5000);

      const result = await this.config.subscriptionManager.subscribe([filter], {
        onEvent: (event: NostrEvent) => {
          if (event.kind === 0 && this.pubkeys.includes(event.pubkey)) {
            try {
              const metadata = JSON.parse(event.content);
              const profile: UserProfile = {
                pubkey: event.pubkey,
                metadata,
                lastUpdated: event.created_at,
                eventId: event.id,
                isOwn: false
              };
              
              profiles.set(event.pubkey, profile);
              loadingStates.set(event.pubkey, false);
              
              store.update(state => ({
                ...state,
                profiles: new Map(profiles),
                loadingStates: new Map(loadingStates)
              }));

              if (this.config.debug) {
                console.log(`ProfileBatchBuilder Store: Updated profile for ${event.pubkey.substring(0, 16)}...`);
              }
            } catch (error) {
              errors.set(event.pubkey, error instanceof Error ? error : new Error('Parse error'));
              loadingStates.set(event.pubkey, false);
              
              store.update(state => ({
                ...state,
                loadingStates: new Map(loadingStates),
                errors: new Map(errors)
              }));
            }
          }
        },
        onEose: () => {
          if (!subscriptionComplete) {
            subscriptionComplete = true;
            clearTimeout(timeoutId);
            
            // Mark all still-loading profiles as complete
            this.pubkeys.forEach(pubkey => {
              loadingStates.set(pubkey, false);
            });
            
            store.update(state => ({
              ...state,
              loading: false,
              loadingStates: new Map(loadingStates),
              lastUpdated: new Date()
            }));

            if (this.config.debug) {
              const foundCount = Array.from(profiles.values()).filter(p => p !== null).length;
              console.log(`ProfileBatchBuilder Store: Batch complete - ${foundCount}/${this.pubkeys.length} profiles`);
            }
          }
        },
        onError: (error: Error) => {
          if (!subscriptionComplete) {
            subscriptionComplete = true;
            clearTimeout(timeoutId);
            
            // Mark all as failed
            this.pubkeys.forEach(pubkey => {
              errors.set(pubkey, error);
              loadingStates.set(pubkey, false);
            });
            
            store.update(state => ({
              ...state,
              loading: false,
              loadingStates: new Map(loadingStates),
              errors: new Map(errors),
              lastUpdated: new Date()
            }));
          }
        }
      });

      // Close subscription after timeout to avoid memory leaks
      setTimeout(async () => {
        if (result.success && result.subscription) {
          await this.config.subscriptionManager.close(result.subscription.id);
        }
      }, 10000);

    } catch (error) {
      // Handle subscription creation error
      const loadingStates = new Map<string, boolean>();
      const errors = new Map<string, Error>();
      
      this.pubkeys.forEach(pubkey => {
        loadingStates.set(pubkey, false);
        errors.set(pubkey, error instanceof Error ? error : new Error('Subscription error'));
      });
      
      store.update(state => ({
        ...state,
        loading: false,
        loadingStates,
        errors,
        lastUpdated: new Date()
      }));
    }
  }
}