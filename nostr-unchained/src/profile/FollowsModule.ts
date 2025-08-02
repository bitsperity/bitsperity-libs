/**
 * FollowsModule - Follow List Management API
 * 
 * Provides methods for accessing and managing follow lists
 * according to NIP-02 specification.
 */

import { FollowListStore } from './FollowListStore.js';
import { FollowBuilder } from './FollowBuilder.js';
import { FollowBatchBuilder } from './FollowBatchBuilder.js';
import { EventBuilder } from '../core/EventBuilder.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { RelayManager } from '../relay/RelayManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { Follow, PublishResult } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface FollowsModuleConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider?: SigningProvider;
  debug?: boolean;
}

export class FollowsModule {
  private config: FollowsModuleConfig;
  private followStores = new Map<string, FollowListStore>();

  constructor(config: FollowsModuleConfig) {
    this.config = config;
  }

  /**
   * Get own follow list as a reactive store
   */
  async mine(): Promise<FollowListStore> {
    if (!this.config.signingProvider) {
      throw new Error('Cannot access own follow list: No signing provider available. Initialize signing first.');
    }

    const myPubkey = await this.config.signingProvider.getPublicKey();
    return this.of(myPubkey);
  }

  /**
   * Get follow list for any pubkey as a reactive store
   */
  of(pubkey: string): FollowListStore {
    // Return existing store if available
    if (this.followStores.has(pubkey)) {
      return this.followStores.get(pubkey)!;
    }

    // Create new follow list store
    const store = new FollowListStore({
      pubkey,
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });

    this.followStores.set(pubkey, store);
    return store;
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
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
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
      debug: this.config.debug
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
    // Close all follow list stores
    for (const store of this.followStores.values()) {
      await store.close();
    }
    this.followStores.clear();
  }

  // Private helper methods

  private async getCurrentFollows(): Promise<Follow[]> {
    try {
      const myPubkey = await this.config.signingProvider!.getPublicKey();
      
      // Query for current follow list
      const filter: Filter = {
        kinds: [3],
        authors: [myPubkey],
        limit: 1
      };

      return new Promise((resolve) => {
        let followListFound = false;
        
        const timeoutId = setTimeout(() => {
          if (!followListFound) {
            resolve([]); // Return empty if no follow list found
          }
        }, 3000);

        this.config.subscriptionManager.subscribe([filter], {
          onEvent: (event: NostrEvent) => {
            if (event.kind === 3 && event.pubkey === myPubkey && !followListFound) {
              followListFound = true;
              clearTimeout(timeoutId);
              
              const follows = this.parseFollowListEvent(event);
              resolve(follows);
            }
          },
          onEose: () => {
            if (!followListFound) {
              clearTimeout(timeoutId);
              resolve([]); // No follow list found
            }
          }
        });
      });
    } catch {
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