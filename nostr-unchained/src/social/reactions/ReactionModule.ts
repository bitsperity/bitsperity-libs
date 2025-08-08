/**
 * ReactionModule - Clean Architecture NIP-25 Reactions
 * 
 * 100% Clean Architecture implementation:
 * - Uses nostr.query() for cache-first reactive data
 * - Uses nostr.sub() for live updates
 * - Returns UniversalNostrStore for all reactive data
 * - No direct cache or SubscriptionManager access
 */

import type { NostrUnchained } from '../../core/NostrUnchained.js';
import type { UniversalNostrStore } from '../../store/UniversalNostrStore.js';
import type { NostrEvent } from '../../core/types.js';
import type { 
  ReactionSummary, 
  ReactionCount,
  StandardReactionType,
  REACTION_TYPES
} from '../types/reaction-types.js';

export class ReactionModule {
  constructor(private nostr: NostrUnchained, private debug?: boolean) {
    if (this.debug) {
      console.log('🎯 ReactionModule initialized with Clean Architecture');
    }
  }

  /**
   * Get reaction summary for an event (reactive)
   * Returns aggregated reactions with counts and user's reaction
   */
  to(eventId: string): UniversalNostrStore<ReactionSummary> {
    // Start subscription for live reaction updates
    this.startReactionSubscription(eventId);
    
    // Return reactive store with aggregated reactions
    return this.nostr.query()
      .kinds([7])
      .tags('e', [eventId])
      .execute()
      .map(events => this.aggregateReactions(events, eventId));
  }

  /**
   * Get my reaction to an event (reactive)
   * Returns the current user's reaction content or null
   */
  myReaction(eventId: string): UniversalNostrStore<string | null> {
    const myPubkey = this.nostr.me;
    if (!myPubkey) {
      // Return store with null if no user signed in
      return this.createNullStore();
    }
    
    // Start subscription for live updates
    this.startMyReactionSubscription(eventId, myPubkey);
    
    return this.nostr.query()
      .kinds([7])
      .authors([myPubkey])
      .tags('e', [eventId])
      .limit(1)
      .execute()
      .map(events => events[0]?.content || null);
  }

  /**
   * React to an event
   * Creates a NIP-25 compliant reaction event
   */
  async react(eventId: string, content = '+'): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Get target event author for p-tag
      const targetEvent = await this.getTargetEvent(eventId);
      if (!targetEvent) {
        return { success: false, error: 'Target event not found' };
      }

      // Create reaction using FluentEventBuilder
      const result = await this.nostr.events
        .reaction(eventId, content)
        .tag('p', targetEvent.pubkey) // NIP-25 requires p-tag for target author
        .publish();

      if (this.debug) {
        console.log(`ReactionModule: Published reaction "${content}" to event ${eventId.substring(0, 8)}...`);
      }

      return { 
        success: result.success, 
        eventId: result.eventId,
        error: result.error?.message 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to publish reaction' 
      };
    }
  }

  /**
   * Remove my reaction to an event
   * Publishes a deletion request for the reaction
   */
  async unreact(eventId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.nostr.me) {
      return { success: false, error: 'No signing provider available' };
    }

    try {
      // Find my current reaction
      const myReactionStore = this.myReaction(eventId);
      const currentReactions = this.nostr.query()
        .kinds([7])
        .authors([this.nostr.me])
        .tags('e', [eventId])
        .execute();

      const reactionEvents = currentReactions.current;
      if (!reactionEvents || reactionEvents.length === 0) {
        return { success: false, error: 'No reaction found to remove' };
      }

      // Delete the most recent reaction (NIP-09 deletion)
      const reactionToDelete = reactionEvents[0];
      const result = await this.nostr.events
        .deletion(reactionToDelete.id, 'User removed reaction')
        .publish();

      if (this.debug) {
        console.log(`ReactionModule: Deleted reaction to event ${eventId.substring(0, 8)}...`);
      }

      return { 
        success: result.success,
        error: result.error?.message 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove reaction'
      };
    }
  }

  // Private helper methods

  private async startReactionSubscription(eventId: string): Promise<void> {
    try {
      await this.nostr.sub()
        .kinds([7])
        .tags('e', [eventId])
        .execute();
    } catch (error) {
      if (this.debug) {
        console.warn(`Failed to start reaction subscription for ${eventId}:`, error);
      }
    }
  }

  private async startMyReactionSubscription(eventId: string, myPubkey: string): Promise<void> {
    try {
      await this.nostr.sub()
        .kinds([7])
        .authors([myPubkey])
        .tags('e', [eventId])
        .limit(1)
        .execute();
    } catch (error) {
      if (this.debug) {
        console.warn(`Failed to start my reaction subscription for ${eventId}:`, error);
      }
    }
  }

  private async getTargetEvent(eventId: string): Promise<NostrEvent | null> {
    // Start subscription to fetch the event if not in cache
    await this.nostr.sub()
      .ids([eventId])
      .limit(1)
      .execute();

    // Wait a bit for the event to arrive
    await new Promise(resolve => setTimeout(resolve, 500));

    const eventStore = this.nostr.query()
      .ids([eventId])
      .limit(1)
      .execute();

    const events = eventStore.current;
    return events && events.length > 0 ? events[0] : null;
  }

  private aggregateReactions(events: NostrEvent[], targetEventId: string): ReactionSummary {
    const reactions: Record<string, ReactionCount> = {};
    let totalCount = 0;
    let userReacted = false;
    let userReactionType: string | undefined;
    const myPubkey = this.nostr.me;

    // Process all reaction events - filter out null/undefined events
    events.filter(event => event && typeof event === 'object').forEach(event => {
      if (event.kind !== 7) return;

      const content = event.content || '+';
      const author = event.pubkey;

      // Initialize reaction type if not exists
      if (!reactions[content]) {
        reactions[content] = {
          type: content,
          count: 0,
          authors: []
        };
      }

      // Add to count and authors
      reactions[content].count++;
      reactions[content].authors.push(author);
      totalCount++;

      // Check if current user reacted
      if (myPubkey && author === myPubkey) {
        userReacted = true;
        userReactionType = content;
      }
    });

    return {
      targetEventId,
      totalCount,
      reactions,
      userReacted,
      userReactionType
    };
  }

  private createNullStore(): UniversalNostrStore<string | null> {
    // Create a query that will always return empty results when no user is signed in
    return this.nostr.query()
      .kinds([7])
      .authors(['']) // Empty author will never match
      .limit(1)
      .execute()
      .map(() => null);
  }
}