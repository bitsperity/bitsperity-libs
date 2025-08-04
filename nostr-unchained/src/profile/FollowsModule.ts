/**
 * FollowsModule - Follow List Management API
 * 
 * TODO: Convert to clean architecture using base layer
 * For now, simplified to prevent breaking changes
 */

import { FollowBuilder } from './FollowBuilder.js';
import { FollowBatchBuilder } from './FollowBatchBuilder.js';
import { EventBuilder } from '../core/EventBuilder.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { RelayManager } from '../relay/RelayManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { Follow, PublishResult } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';
import type { NostrUnchained } from '../core/NostrUnchained.js';
import type { UniversalNostrStore } from '../store/UniversalNostrStore.js';

/**
 * Enhanced follow list store with count property for frontend compatibility
 * Provides both direct subscribe (for follow array) and separate .follows/.count properties
 */
class FollowListStore {
  private baseStore: UniversalNostrStore<Follow[]>;
  public count: CountStore;
  public follows: UniversalNostrStore<Follow[]>; // Frontend expects this

  constructor(baseStore: UniversalNostrStore<Follow[]>) {
    this.baseStore = baseStore;
    // Create a derived store for the count
    this.count = new CountStore(baseStore);
    // Expose follows as expected by frontend
    this.follows = baseStore;
  }

  // Delegate to base store (for direct usage)
  subscribe(run: (value: Follow[]) => void, invalidate?: () => void) {
    return this.baseStore.subscribe(run, invalidate);
  }

  get current(): Follow[] {
    return this.baseStore.current;
  }
}

/**
 * Simple count store that derives count from a Follow[] store
 */
class CountStore {
  private sourceStore: UniversalNostrStore<Follow[]>;
  private _count: number = 0;
  private subscribers = new Set<(count: number) => void>();

  constructor(sourceStore: UniversalNostrStore<Follow[]>) {
    this.sourceStore = sourceStore;
    this._count = sourceStore.current?.length || 0;
    
    // Subscribe to source changes
    sourceStore.subscribe((follows: Follow[]) => {
      const newCount = follows?.length || 0;
      if (newCount !== this._count) {
        this._count = newCount;
        this.notifySubscribers();
      }
    });
  }

  subscribe(run: (count: number) => void) {
    run(this._count); // Call immediately
    this.subscribers.add(run);
    
    return () => {
      this.subscribers.delete(run);
    };
  }

  get current(): number {
    return this._count;
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this._count));
  }
}

export interface FollowsModuleConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider?: SigningProvider;
  debug?: boolean;
  // REQUIRED: NostrUnchained instance for clean base layer access
  nostr: NostrUnchained;
}

export class FollowsModule {
  private config: FollowsModuleConfig;

  constructor(config: FollowsModuleConfig) {
    this.config = config;
  }

  /**
   * Get own follow list as a reactive store
   * CLEAN ARCHITECTURE: Uses base layer directly
   */
  async mine(): Promise<FollowListStore> {
    if (!this.config.signingProvider) {
      throw new Error('Cannot access own follow list: No signing provider available. Initialize signing first.');
    }

    // Try synchronous first, fallback to async
    let myPubkey = this.config.signingProvider.getPublicKeySync?.();
    if (!myPubkey) {
      myPubkey = await this.config.signingProvider.getPublicKey();
    }

    return this.of(myPubkey);
  }

  /**
   * Get follow list for any pubkey as a reactive store  
   * CLEAN ARCHITECTURE: Uses base layer directly with smart deduplication
   */
  of(pubkey: string): FollowListStore {
    // Start subscription to populate cache - deduplication handled by SubscriptionManager
    this.config.nostr.sub()
      .kinds([3])
      .authors([pubkey])
      .limit(1)
      .execute()
      .catch(error => {
        if (this.config.debug) {
          console.warn('Failed to start follow list subscription:', error);
        }
      });
    
    // Get base store with live updates - this uses clean deduplication
    const baseStore = this.config.nostr.query()
      .kinds([3])
      .authors([pubkey])
      .limit(1)
      .execute()
      .map(events => this.parseFollowListEvents(events));

    // Return enhanced store with count property
    return new FollowListStore(baseStore);
  }

  /**
   * Get followers for any pubkey - WHO FOLLOWS THIS USER
   * Returns count of users who have this pubkey in their follow list
   */
  followers(pubkey: string): CountStore {
    // Start subscription to load followers data into cache first
    this.config.nostr.sub()
      .kinds([3])
      .tags('p', [pubkey])
      .limit(100)
      .execute()
      .catch(error => {
        if (this.config.debug) {
          console.warn('Failed to start followers subscription:', error);
        }
      });

    // Query for all follow lists that include this pubkey
    const followersStore = this.config.nostr.query()
      .kinds([3])
      .tags('p', [pubkey])
      .limit(100) // Get up to 100 followers
      .execute()
      .map(events => {
        // Each event represents someone who follows this pubkey
        // Return array of follower pubkeys (deduplicated)
        const followerPubkeys = new Set<string>();
        events.forEach(event => {
          if (event.kind === 3) {
            // Check if this follow list actually contains our target pubkey
            const hasTargetPubkey = event.tags.some(
              tag => tag[0] === 'p' && tag[1] === pubkey
            );
            if (hasTargetPubkey) {
              followerPubkeys.add(event.pubkey);
            }
          }
        });
        return Array.from(followerPubkeys);
      });

    return new CountStore(followersStore);
  }

  /**
   * Phase 4: Add a user to follow list
   * Returns FollowBuilder for fluent API configuration
   */
  add(pubkey: string): FollowBuilder {
    if (!this.config.signingProvider) {
      throw new Error('Cannot add follow: No signing provider available. Initialize signing first.');
    }

    return new FollowBuilder({
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug ?? false,
      nostr: this.config.nostr
    }, pubkey);
  }

  /**
   * Phase 4: Remove a user from follow list
   */
  async remove(pubkey: string): Promise<PublishResult> {
    if (!this.config.signingProvider) {
      throw new Error('Cannot remove follow: No signing provider available. Initialize signing first.');
    }

    try {
      const myPubkey = await this.config.signingProvider.getPublicKey();
      
      if (this.config.debug) {
        console.log('FollowsModule: Removing follow for', pubkey.substring(0, 16) + '...');
      }

      // Get current follow list
      const currentFollows = await this.getCurrentFollows();
      
      // Check if following
      const isFollowing = currentFollows.some(follow => follow.pubkey === pubkey);
      if (!isFollowing) {
        if (this.config.debug) {
          console.log('FollowsModule: Not following', pubkey.substring(0, 16) + '...');
        }
        return {
          success: false,
          error: 'Not following this user'
        };
      }

      // Remove from follow list
      const updatedFollows = currentFollows.filter(follow => follow.pubkey !== pubkey);
      
      // Create kind 3 follow list event
      const tags: string[][] = updatedFollows.map(follow => {
        const tag = ['p', follow.pubkey];
        if (follow.relayUrl) tag.push(follow.relayUrl);
        if (follow.petname) tag.push(follow.petname);
        return tag;
      });

      // Create and sign the event
      const unsignedEvent = {
        kind: 3,
        content: '', // Follow lists typically have empty content
        tags,
        created_at: Math.floor(Date.now() / 1000),
        pubkey: myPubkey
      };

      // Add event ID and sign
      const eventWithId = EventBuilder.addEventId(unsignedEvent);
      const signature = await this.config.signingProvider.signEvent(unsignedEvent);
      
      const signedEvent: NostrEvent = {
        ...eventWithId,
        sig: signature
      };

      // Publish to all relays
      const publishResults = await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (relayUrl) => {
          try {
            // Send event to relay
            await this.config.relayManager.sendToRelay(relayUrl, ['EVENT', signedEvent]);
            return { success: true, relay: relayUrl };
          } catch (error) {
            return { 
              success: false, 
              relay: relayUrl, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      const successfulRelays = publishResults
        .filter((result): result is PromiseFulfilledResult<{success: true, relay: string}> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.relay);

      const success = successfulRelays.length > 0;

      if (success) {
        if (this.config.debug) {
          console.log(`FollowsModule: Published updated follow list to ${successfulRelays.length} relays`);
        }
        return {
          success: true,
          eventId: signedEvent.id
        };
      } else {
        return {
          success: false,
          error: 'Failed to publish to any relay'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove follow'
      };
    }
  }

  /**
   * Phase 5: Batch follow operations
   * Returns FollowBatchBuilder for bulk add/remove operations
   */
  batch(): FollowBatchBuilder {
    if (!this.config.signingProvider) {
      throw new Error('Cannot batch follow operations: No signing provider available. Initialize signing first.');
    }

    return new FollowBatchBuilder({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug ?? false,
      nostr: this.config.nostr // CLEAN ARCHITECTURE: Pass nostr instance
    });
  }

  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    // No cleanup needed for clean architecture
  }

  // Private helper methods

  /**
   * Start subscription for follow list updates
   */
  private async startFollowListSubscription(pubkey: string): Promise<void> {
    try {
      await this.config.nostr.sub()
        .kinds([3])
        .authors([pubkey])
        .limit(1)
        .execute();
    } catch (error) {
      if (this.config.debug) {
        console.warn(`Failed to start follow list subscription for ${pubkey}:`, error);
      }
    }
  }

  /**
   * Parse NostrEvent[] to Follow[]
   */
  private parseFollowListEvents(events: NostrEvent[]): Follow[] {
    if (events.length === 0) {
      return [];
    }

    const event = events[0];
    if (!event || event.kind !== 3) {
      return [];
    }

    return this.parseFollowListEvent(event);
  }

  private async getCurrentFollows(): Promise<Follow[]> {
    try {
      const myPubkey = await this.config.signingProvider!.getPublicKey();
      
      // CLEAN ARCHITECTURE: Use base layer for cache-first follow list loading
      const followStore = this.config.nostr.query()
        .kinds([3])
        .authors([myPubkey])
        .limit(1)
        .execute();

      // Try cache first (instant!)
      const currentFollowList = followStore.current;
      if (currentFollowList && currentFollowList.length > 0) {
        const follows = this.parseFollowListEvent(currentFollowList[0]);
        if (this.config.debug) {
          console.log('FollowsModule: Using cached follow list with', follows.length, 'follows');
        }
        return follows;
      }

      // If not in cache, start subscription and wait briefly
      if (this.config.debug) {
        console.log('FollowsModule: No cached follow list found, querying relays...');
      }

      await this.config.nostr.sub()
        .kinds([3])
        .authors([myPubkey])
        .limit(1)
        .execute();

      // Wait a bit for subscription to populate cache
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check cache again
      const updatedFollowList = followStore.current;
      if (updatedFollowList && updatedFollowList.length > 0) {
        const follows = this.parseFollowListEvent(updatedFollowList[0]);
        if (this.config.debug) {
          console.log('FollowsModule: Found follow list from relay with', follows.length, 'follows');
        }
        return follows;
      }

      if (this.config.debug) {
        console.log('FollowsModule: No follow list found on relays, using empty array');
      }
      return [];
    } catch (error) {
      if (this.config.debug) {
        console.error('FollowsModule: Error getting current follows:', error);
      }
      return []; // Return empty array on error
    }
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
      
      return follows;
    } catch (error) {
      if (this.config.debug) {
        console.error('FollowsModule: Failed to parse follow list event:', error);
      }
      return [];
    }
  }
}