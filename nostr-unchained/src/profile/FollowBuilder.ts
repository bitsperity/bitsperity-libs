/**
 * FollowBuilder - Fluent API for Adding Follows
 * 
 * Provides a builder pattern API for adding follows to follow lists
 * with optional relay and petname configuration.
 */

import { EventBuilder } from '../core/EventBuilder.js';
import type { NostrUnchained } from '../core/NostrUnchained.js';
import type { RelayManager } from '../relay/RelayManager.js';
import type { SigningProvider } from '../crypto/SigningProvider.js';
import type { Follow, PublishResult } from './types.js';
import type { NostrEvent, Filter } from '../core/types.js';

export interface FollowBuilderConfig {
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  debug?: boolean;
  // CLEAN ARCHITECTURE: Use base layer instead of direct SubscriptionManager
  nostr: NostrUnchained;
}

export class FollowBuilder {
  private config: FollowBuilderConfig;
  private targetPubkey: string;
  private relayUrl?: string;
  private petnameValue?: string;

  constructor(config: FollowBuilderConfig, targetPubkey: string) {
    this.config = config;
    this.targetPubkey = targetPubkey;
  }

  /**
   * Set preferred relay for this follow
   */
  relay(url: string): this {
    this.relayUrl = url;
    return this;
  }

  /**
   * Set pet name for this follow
   */
  petname(name: string): this {
    this.petnameValue = name;
    return this;
  }

  /**
   * Publish the updated follow list
   */
  async publish(): Promise<PublishResult> {
    try {
      const myPubkey = await this.config.signingProvider.getPublicKey();
      
      if (this.config.debug) {
        console.log('FollowBuilder: Adding follow for', this.targetPubkey.substring(0, 16) + '...');
      }

      // Get current follow list
      const currentFollows = await this.getCurrentFollows();
      
      // Check if already following
      const alreadyFollowing = currentFollows.some(follow => follow.pubkey === this.targetPubkey);
      if (alreadyFollowing) {
        if (this.config.debug) {
          console.log('FollowBuilder: Already following', this.targetPubkey.substring(0, 16) + '...');
        }
        return {
          success: false,
          error: 'Already following this user'
        };
      }

      // Add new follow to existing list
      const newFollow: Follow = {
        pubkey: this.targetPubkey,
        relayUrl: this.relayUrl,
        petname: this.petnameValue
      };
      
      const updatedFollows = [...currentFollows, newFollow];
      
      // Create kind 3 follow list event
      // NIP-02 spec: ["p", <pubkey>, <relay>, <petname>]
      // relay and petname are optional, but relay MUST come before petname
      const tags: string[][] = updatedFollows.map(follow => {
        const tag = ['p', follow.pubkey];
        
        // If petname is set without relay, add empty string for relay position
        if (follow.petname && !follow.relayUrl) {
          tag.push(''); // Reserve position [2] for relay
          tag.push(follow.petname); // Petname at position [3]
        } else if (follow.relayUrl && !follow.petname) {
          tag.push(follow.relayUrl); // Relay at position [2]
        } else if (follow.relayUrl && follow.petname) {
          tag.push(follow.relayUrl); // Relay at position [2]
          tag.push(follow.petname); // Petname at position [3]
        }
        // If neither is set, just ["p", pubkey]
        
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
          console.log(`FollowBuilder: Published follow list to ${successfulRelays.length} relays`);
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
        error: error instanceof Error ? error.message : 'Failed to add follow'
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
      const currentFollowList = followStore.current;
      if (currentFollowList && currentFollowList.length > 0) {
        const follows = this.parseFollowListEvent(currentFollowList[0]);
        if (this.config.debug) {
          console.log('FollowBuilder: Using cached follow list with', follows.length, 'follows');
        }
        return follows;
      }

      // If not in cache, start subscription and wait briefly
      if (this.config.debug) {
        console.log('FollowBuilder: No cached follow list, querying relays...');
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
          console.log('FollowBuilder: Found follow list from relay with', follows.length, 'follows');
        }
        return follows;
      }

      if (this.config.debug) {
        console.log('FollowBuilder: No follow list found, using empty array');
      }
      return [];
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
        console.error('FollowBuilder: Failed to parse follow list event:', error);
      }
      return [];
    }
  }
}