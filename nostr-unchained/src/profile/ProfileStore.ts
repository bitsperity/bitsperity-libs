/**
 * ProfileStore - Reactive Profile State Management
 * 
 * Provides a Svelte-compatible reactive store for profile data.
 * Automatically subscribes to profile updates and manages state.
 */

import { writable, derived, type Readable, type Writable } from '../store/NostrStore.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { UserProfile } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';
// Phase 8: Cache optimization imports
import { ProfileCacheInterface } from './ProfileCacheInterface.js';
import type { UniversalEventCache } from '../cache/UniversalEventCache.js';

export interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  verified: boolean;
  lastUpdated: Date | null;
}

export interface ProfileStoreConfig {
  pubkey: string;
  subscriptionManager: SubscriptionManager;
  cache?: UniversalEventCache; // Phase 8: Optional cache for optimization
  debug?: boolean;
}

export class ProfileStore implements Readable<ProfileState> {
  private config: ProfileStoreConfig;
  private store: Writable<ProfileState>;
  private subscriptionId?: string;
  private subscriptionResult?: any;
  private cacheInterface?: ProfileCacheInterface; // Phase 8: Cache interface
  
  // Derived stores for easy access
  public readonly profile: Readable<UserProfile | null>;
  public readonly loading: Readable<boolean>;
  public readonly error: Readable<Error | null>;

  constructor(config: ProfileStoreConfig) {
    this.config = config;
    
    // Phase 8: Initialize cache interface if cache is provided
    if (config.cache) {
      this.cacheInterface = new ProfileCacheInterface(config.cache);
      if (config.debug) {
        console.log('📦 ProfileStore: Cache interface initialized for', config.pubkey.substring(0, 16) + '...');
      }
    }
    
    // Initialize store with default state
    this.store = writable<ProfileState>({
      profile: null,
      loading: true,
      error: null,
      verified: false,
      lastUpdated: null
    });

    // Create derived stores
    this.profile = derived(this.store, $state => $state.profile);
    this.loading = derived(this.store, $state => $state.loading);
    this.error = derived(this.store, $state => $state.error);

    // Start profile subscription
    this.initialize();
  }

  /**
   * Subscribe to store changes (Svelte store interface)
   */
  subscribe(run: (value: ProfileState) => void): () => void {
    return this.store.subscribe(run);
  }

  /**
   * Refresh profile data - Phase 8: Cache-first strategy
   */
  async refresh(): Promise<void> {
    // Phase 8: Try cache first if available
    if (this.cacheInterface) {
      const cachedMetadata = this.cacheInterface.getCachedProfile(this.config.pubkey);
      const hasRecent = this.cacheInterface.hasRecentProfile(this.config.pubkey, 30); // 30 minutes
      
      if (cachedMetadata && hasRecent) {
        // Cache hit with recent data - return immediately
        const profile: UserProfile = {
          pubkey: this.config.pubkey,
          metadata: cachedMetadata
        };
        
        const verified = await this.checkNip05Verification(profile);
        
        this.store.set({
          profile,
          loading: false,
          error: null,
          verified,
          lastUpdated: new Date()
        });
        
        if (this.config.debug) {
          console.log('📦 ProfileStore: Cache hit for', this.config.pubkey.substring(0, 16) + '...');
        }
        return; // Fast return - no relay query needed
      } else if (this.config.debug) {
        console.log('🔄 ProfileStore: Cache miss or stale for', this.config.pubkey.substring(0, 16) + '...');
      }
    }
    
    // Cache miss or no cache - fall back to relay query
    this.store.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      // Directly query for profile events (kind 0)
      const filter: Filter = {
        kinds: [0],
        authors: [this.config.pubkey],
        limit: 1
      };

      // Use subscription manager to fetch profile
      let profileFound = false;
      let profile: UserProfile | null = null;

      const subscriptionResult = await this.config.subscriptionManager.subscribe([filter], {
        onEvent: async (event: NostrEvent) => {
          if (event.kind === 0 && event.pubkey === this.config.pubkey && !profileFound) {
            profileFound = true;
            profile = await this.parseProfileEvent(event);
            
            const verified = await this.checkNip05Verification(profile);
            
            this.store.set({
              profile,
              loading: false,
              error: null,
              verified,
              lastUpdated: new Date()
            });
          }
        },
        onEose: () => {
          if (!profileFound) {
            this.store.set({
              profile: null,
              loading: false,
              error: null,
              verified: false,
              lastUpdated: new Date()
            });
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
        if (!profileFound) {
          this.store.set({
            profile: null,
            loading: false,
            error: null,
            verified: false,
            lastUpdated: new Date()
          });
        }
      }, 3000);

    } catch (error) {
      this.store.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch profile')
      }));
    }
  }

  /**
   * Subscribe to real-time profile updates
   */
  async startSubscription(): Promise<void> {
    if (this.subscriptionId) return; // Already subscribed
    
    const filter: Filter = {
      kinds: [0],
      authors: [this.config.pubkey],
      limit: 1
    };

    try {
      const result = await this.config.subscriptionManager.subscribe([filter], {
        onEvent: (event: NostrEvent) => {
          if (event.kind === 0 && event.pubkey === this.config.pubkey) {
            this.handleProfileUpdate(event);
          }
        },
        onError: (error: Error) => {
          this.store.update(state => ({ ...state, error }));
        }
      });

      if (result.success && result.subscription) {
        this.subscriptionId = result.subscription.id;
        this.subscriptionResult = result;
        
        if (this.config.debug) {
          console.log(`ProfileStore: Subscribed to profile updates for ${this.config.pubkey}`);
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
   * Unsubscribe from profile updates
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId) {
      await this.config.subscriptionManager.close(this.subscriptionId);
      this.subscriptionId = undefined;
      this.subscriptionResult = undefined;
      
      if (this.config.debug) {
        console.log(`ProfileStore: Unsubscribed from profile updates for ${this.config.pubkey}`);
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
    // Phase 8: Cache-first approach
    if (this.cacheInterface) {
      // First, try to get cached data immediately (no loading state)
      const cachedMetadata = this.cacheInterface.getCachedProfile(this.config.pubkey);
      if (cachedMetadata) {
        const profile: UserProfile = {
          pubkey: this.config.pubkey,
          metadata: cachedMetadata
        };
        
        // Set cached data immediately (instant UI update)
        this.store.set({
          profile,
          loading: false, // No loading spinner for cached data
          error: null,
          verified: false, // Will be updated async
          lastUpdated: new Date()
        });
        
        // Verify NIP-05 async (doesn't block UI)
        this.checkNip05Verification(profile).then(verified => {
          this.store.update(state => ({ ...state, verified }));
        }).catch(() => {
          // Ignore verification errors
        });
        
        if (this.config.debug) {
          console.log('⚡ ProfileStore: Instant load from cache for', this.config.pubkey.substring(0, 16) + '...');
        }
      }
    }
    
    // Always do initial fetch (either to populate cache or get fresh data)
    await this.refresh();
    
    // Subscribe to updates
    this.startSubscription();
  }

  private async parseProfileEvent(event: NostrEvent): Promise<UserProfile> {
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
      throw new Error('Failed to parse profile event');
    }
  }

  private async handleProfileUpdate(event: NostrEvent): Promise<void> {
    try {
      const profile = await this.parseProfileEvent(event);

      // Check verification
      const verified = await this.checkNip05Verification(profile);

      this.store.set({
        profile,
        loading: false,
        error: null,
        verified,
        lastUpdated: new Date()
      });

      if (this.config.debug) {
        console.log(`ProfileStore: Profile updated for ${this.config.pubkey}`);
      }
    } catch (error) {
      this.store.update(state => ({
        ...state,
        error: error instanceof Error ? error : new Error('Failed to parse profile update')
      }));
    }
  }

  private async checkNip05Verification(profile: UserProfile): Promise<boolean> {
    if (!profile.metadata.nip05) return false;
    
    try {
      // Extract local and domain parts
      const [local, domain] = profile.metadata.nip05.split('@');
      if (!local || !domain) return false;

      // Fetch .well-known/nostr.json
      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${local}`);
      if (!response.ok) return false;

      const data = await response.json();
      const expectedPubkey = data.names?.[local];
      
      // Verify the pubkey matches
      return expectedPubkey === profile.pubkey;
    } catch (error) {
      if (this.config.debug) {
        console.error('NIP-05 verification failed:', error);
      }
      return false;
    }
  }
}