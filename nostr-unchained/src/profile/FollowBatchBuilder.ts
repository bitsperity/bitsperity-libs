/**
 * FollowBatchBuilder - Bulk Follow List Operations
 * 
 * Provides efficient batch operations for adding/removing multiple follows
 * in a single atomic operation.
 */

import { EventBuilder } from '../core/EventBuilder.js';
import type { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import type { RelayManager } from '../relay/RelayManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { Follow, PublishResult } from './types.js';
import type { NostrEvent } from '../core/types.js';
import type { NostrUnchained } from '../core/NostrUnchained.js';

export interface FollowBatchBuilderConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  debug?: boolean;
  // CLEAN ARCHITECTURE: Use base layer instead of direct cache
  nostr: NostrUnchained;
}

export class FollowBatchBuilder {
  private config: FollowBatchBuilderConfig;
  private toAdd: string[] = [];
  private toRemove: string[] = [];

  constructor(config: FollowBatchBuilderConfig) {
    this.config = config;
  }

  /**
   * Add multiple pubkeys to follow list
   */
  add(pubkeys: string[]): this {
    this.toAdd.push(...pubkeys);
    return this;
  }

  /**
   * Remove multiple pubkeys from follow list
   */
  remove(pubkeys: string[]): this {
    this.toRemove.push(...pubkeys);
    return this;
  }

  /**
   * Publish the batch follow list update
   */
  async publish(): Promise<PublishResult> {
    if (this.toAdd.length === 0 && this.toRemove.length === 0) {
      return {
        success: false,
        error: 'No follow operations specified'
      };
    }

    try {
      const myPubkey = await this.config.signingProvider.getPublicKey();
      
      if (this.config.debug) {
        console.log(`FollowBatchBuilder: Batch operation - adding ${this.toAdd.length}, removing ${this.toRemove.length}`);
      }

      // Get current follow list
      const currentFollows = await this.getCurrentFollows();
      
      // Apply batch operations
      let updatedFollows = [...currentFollows];
      
      // Remove first (to handle add+remove of same pubkey correctly)
      if (this.toRemove.length > 0) {
        updatedFollows = updatedFollows.filter(follow => 
          !this.toRemove.includes(follow.pubkey)
        );
        
        if (this.config.debug) {
          console.log(`FollowBatchBuilder: Removed ${this.toRemove.length} follows`);
        }
      }
      
      // Add new follows
      if (this.toAdd.length > 0) {
        const newFollows: Follow[] = this.toAdd
          .filter(pubkey => !updatedFollows.some(f => f.pubkey === pubkey)) // Avoid duplicates
          .map(pubkey => ({ pubkey }));
        
        updatedFollows.push(...newFollows);
        
        if (this.config.debug) {
          console.log(`FollowBatchBuilder: Added ${newFollows.length} new follows (${this.toAdd.length - newFollows.length} were duplicates)`);
        }
      }

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
          console.log(`FollowBatchBuilder: Published batch update to ${successfulRelays.length} relays`);
          console.log(`FollowBatchBuilder: Final follow list has ${updatedFollows.length} follows`);
          console.log(`FollowBatchBuilder: Event will be received via subscription and cached properly`);
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
        error: error instanceof Error ? error.message : 'Failed to publish batch update'
      };
    }
  }

  // Private helper methods

  private async getCurrentFollows(): Promise<Follow[]> {
    try {
      const myPubkey = await this.config.signingProvider.getPublicKey();
      
      // CLEAN ARCHITECTURE: Use base layer for cache-first follow list loading
      const followStore = this.config.nostr.query()
        .kinds([3])
        .authors([myPubkey])
        .limit(1)
        .execute();

      // Try cache first (instant!)
      const cachedEvents = followStore.current;
      if (this.config.debug) {
        console.log('FollowBatchBuilder: Cache query returned', cachedEvents.length, 'events');
        if (cachedEvents.length > 0) {
          const latestEvent = cachedEvents[0];
          console.log('FollowBatchBuilder: Latest cached event:', {
            id: latestEvent?.id,
            created_at: latestEvent?.created_at,
            tags: latestEvent?.tags.filter((t: any[]) => t[0] === 'p')
          });
        }
      }
      if (cachedEvents.length > 0) {
        const latestEvent = cachedEvents[0]; // Most recent event
        if (latestEvent && this.config.debug) {
          console.log('FollowBatchBuilder: Using cached follow list with', latestEvent.tags.filter((t: any[]) => t[0] === 'p').length, 'follows');
        }
        if (latestEvent) {
          return this.parseFollowListEvent(latestEvent);
        }
      }

      // If not in cache, start subscription and wait briefly
      if (this.config.debug) {
        console.log('FollowBatchBuilder: No cached follow list found, querying relays...');
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
          console.log('FollowBatchBuilder: Found follow list from relay with', follows.length, 'follows');
        }
        return follows;
      }

      if (this.config.debug) {
        console.log('FollowBatchBuilder: No follow list found on relays, using empty array');
      }
      return [];
      
    } catch (error) {
      if (this.config.debug) {
        console.error('FollowBatchBuilder: Error getting current follows:', error);
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
        console.error('FollowBatchBuilder: Failed to parse follow list event:', error);
      }
      return [];
    }
  }
}