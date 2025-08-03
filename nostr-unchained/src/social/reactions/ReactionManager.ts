/**
 * ReactionManager - NIP-25 Reactions and Social Signals
 * Session 4 Phase 3: Reactions & Feed Management
 * 
 * Provides clean, reactive reaction management:
 * - Create reactions (like, dislike, custom emoji)
 * - Fetch and aggregate reactions for events
 * - Real-time reaction updates
 * - NIP-25 compliant Kind 7 reaction events
 */

import { writable, derived, type Readable, type Writable } from '../../store/NostrStore.js';
import type { 
  Reaction,
  ReactionEvent,
  ReactionRequest,
  ReactionResult,
  ReactionSummary,
  ReactionFetchOptions,
  ReactionManagerConfig,
  ReactionCacheEntry,
  ReactionCount,
  REACTION_TYPES
} from '../types/reaction-types.js';
import type { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { EventBuilder } from '../../events/EventBuilder.js';
import type { NostrEvent, Filter } from '../../core/types.js';

export class ReactionManager {
  private config: ReactionManagerConfig;
  private reactionCache = new Map<string, ReactionCacheEntry>();
  private activeSubscriptions = new Map<string, string>(); // eventId -> subscriptionId
  
  // Reactive stores
  private _reactionUpdates = writable<Map<string, ReactionSummary>>(new Map());
  private _watchedEvents = writable<Map<string, ReactionSummary>>(new Map());
  
  // Public reactive properties
  public readonly updates: Readable<Map<string, ReactionSummary>>;
  public readonly watchedEvents: Readable<Map<string, ReactionSummary>>;

  constructor(config: ReactionManagerConfig) {
    this.config = config;
    
    // Initialize reactive stores
    this.updates = derived(this._reactionUpdates, $updates => $updates);
    this.watchedEvents = derived(this._watchedEvents, $watched => $watched);
  }

  /**
   * React to an event
   */
  async react(request: ReactionRequest): Promise<ReactionResult> {
    if (!this.config.signingProvider) {
      return {
        success: false,
        error: 'No signing provider available'
      };
    }

    try {
      const userPubkey = await this.config.signingProvider.getPublicKey();
      
      // Check if user already reacted to this event
      const existingReactions = await this.getReactions(request.targetEventId, { useCache: false });
      if (existingReactions) {
        const userReaction = existingReactions.reactions.find(r => r.authorPubkey === userPubkey);
        if (userReaction) {
          return {
            success: false,
            error: 'User has already reacted to this event'
          };
        }
      }

      // Build NIP-25 compliant tags
      const tags: string[][] = [
        ['e', request.targetEventId], // Event being reacted to
        ['p', request.targetAuthorPubkey] // Author of the event
      ];

      // Build event
      const event = await this.config.eventBuilder
        .kind(7) // NIP-25 Kind 7 reaction
        .content(request.reactionType) // Reaction content (emoji or +/-)
        .tags(tags)
        .build();

      // Sign event
      const signedEvent = await this.config.signingProvider.signEvent(event);

      // Publish to relays
      const publishResults = await this.config.relayManager.publishToAll(signedEvent);
      const successfulPublishes = publishResults.filter(r => r.success);

      if (successfulPublishes.length === 0) {
        return {
          success: false,
          error: 'Failed to publish to any relay'
        };
      }

      // Create reaction object
      const reaction: Reaction = {
        eventId: signedEvent.id,
        authorPubkey: userPubkey,
        targetEventId: request.targetEventId,
        targetAuthorPubkey: request.targetAuthorPubkey,
        reactionType: request.reactionType,
        createdAt: signedEvent.created_at,
        isOwn: true
      };

      // Update cache if we have it
      const cached = this.getCachedReactions(request.targetEventId);
      if (cached) {
        cached.reactions.push(reaction);
        cached.summary = this.aggregateReactions(cached.reactions, userPubkey);
        cached.timestamp = Date.now();
        this.reactionCache.set(request.targetEventId, cached);

        // Update reactive stores
        this._reactionUpdates.update(updates => {
          updates.set(request.targetEventId, cached.summary);
          return new Map(updates);
        });
      }

      if (this.config.debug) {
        console.log('Created reaction:', reaction);
      }

      return {
        success: true,
        eventId: signedEvent.id,
        reaction
      };

    } catch (error) {
      if (this.config.debug) {
        console.error('Error creating reaction:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get reactions for an event
   */
  async getReactions(eventId: string, options: ReactionFetchOptions = {}): Promise<ReactionCacheEntry | null> {
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.getCachedReactions(eventId);
        if (cached) {
          return cached;
        }
      }

      return this.fetchReactions(eventId, options);

    } catch (error) {
      if (this.config.debug) {
        console.error('Error fetching reactions:', error);
      }
      return null;
    }
  }

  /**
   * Get reaction summary for an event
   */
  async getSummary(eventId: string, options: ReactionFetchOptions = {}): Promise<ReactionSummary | null> {
    const reactions = await this.getReactions(eventId, options);
    return reactions?.summary || null;
  }

  /**
   * Watch an event for real-time reaction updates
   */
  async watch(eventId: string): Promise<boolean> {
    try {
      // Get initial reactions
      const reactions = await this.getReactions(eventId);
      if (!reactions) {
        // Create empty summary for events with no reactions yet
        const userPubkey = this.config.signingProvider ? 
          await this.config.signingProvider.getPublicKey() : '';
        
        const emptySummary: ReactionSummary = {
          targetEventId: eventId,
          totalCount: 0,
          reactions: {},
          userReacted: false
        };
        
        this._watchedEvents.update(watched => {
          watched.set(eventId, emptySummary);
          return new Map(watched);
        });
      } else {
        this._watchedEvents.update(watched => {
          watched.set(eventId, reactions.summary);
          return new Map(watched);
        });
      }

      // Set up real-time subscription for new reactions
      const filter: Filter = {
        kinds: [7],
        '#e': [eventId],
        since: Math.floor(Date.now() / 1000) // Only new reactions
      };

      const sharedSub = await this.config.subscriptionManager.getOrCreateSubscription([filter]);
      const listenerId = sharedSub.addListener({
        onEvent: (event: NostrEvent) => {
          if (event.kind === 7) {
            const reaction = this.parseReactionEvent(event as ReactionEvent);
            if (reaction && reaction.targetEventId === eventId) {
              this.handleNewReaction(reaction);
            }
          }
        }
      });

      this.activeSubscriptions.set(eventId, { sharedSub, listenerId });
      
      if (this.config.debug) {
        console.log(`Started watching reactions for event: ${eventId}`);
      }
      
      return true;

    } catch (error) {
      if (this.config.debug) {
        console.error('Error watching reactions:', error);
      }
      return false;
    }
  }

  /**
   * Stop watching an event for reactions
   */
  async unwatch(eventId: string): Promise<void> {
    const subscriptionId = this.activeSubscriptions.get(eventId);
    if (subscriptionId) {
      await this.config.subscriptionManager.close(subscriptionId);
      this.activeSubscriptions.delete(eventId);
    }

    // Remove from watched events
    this._watchedEvents.update(watched => {
      watched.delete(eventId);
      return new Map(watched);
    });

    if (this.config.debug) {
      console.log(`Stopped watching reactions for event: ${eventId}`);
    }
  }

  /**
   * Update signing provider
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
  }

  /**
   * Close all subscriptions and cleanup
   */
  async close(): Promise<void> {
    // Close all active subscriptions
    const closePromises = Array.from(this.activeSubscriptions.values()).map(
      subscriptionId => this.config.subscriptionManager.close(subscriptionId)
    );
    
    await Promise.allSettled(closePromises);
    this.activeSubscriptions.clear();
    this.reactionCache.clear();
    
    if (this.config.debug) {
      console.log('ReactionManager: Closed all subscriptions and cleared cache');
    }
  }

  // Private helper methods

  private async fetchReactions(eventId: string, options: ReactionFetchOptions): Promise<ReactionCacheEntry | null> {
    const filters: Filter[] = [
      {
        kinds: [7],
        '#e': [eventId],
        limit: options.limit || 100
      }
    ];

    return new Promise((resolve) => {
      let resolved = false;
      const reactions: Reaction[] = [];
      const seenEventIds = new Set<string>();
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (reactions.length > 0) {
            const result = this.buildReactionCache(eventId, reactions);
            this.cacheReactions(eventId, result);
            resolve(result);
          } else {
            resolve(null);
          }
        }
      }, options.timeout || 5000);

      const executeQuery = async () => {
        const sharedSub = await this.config.subscriptionManager.getOrCreateSubscription(filters);
        const listenerId = sharedSub.addListener({
          onEvent: (event: NostrEvent) => {
            if (event.kind === 7 && !seenEventIds.has(event.id)) {
              seenEventIds.add(event.id);
              const reaction = this.parseReactionEvent(event as ReactionEvent);
              if (reaction && reaction.targetEventId === eventId) {
                reactions.push(reaction);
              }
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              sharedSub.removeListener(listenerId);
              
              if (reactions.length > 0) {
                const result = this.buildReactionCache(eventId, reactions);
                this.cacheReactions(eventId, result);
                resolve(result);
              } else {
                resolve(null);
              }
            }
          }
        });
      };
      
      executeQuery().catch(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
        }
      });
    });
  }

  private parseReactionEvent(event: ReactionEvent): Reaction | null {
    try {
      // Find e-tag for target event
      const eTag = event.tags.find(tag => tag[0] === 'e');
      if (!eTag || eTag.length < 2) {
        return null;
      }

      // Find p-tag for target author
      const pTag = event.tags.find(tag => tag[0] === 'p');
      if (!pTag || pTag.length < 2) {
        return null;
      }

      // Check if this is from the current user
      const userPubkey = this.config.signingProvider?.getPublicKey ? 
        this.config.signingProvider.getPublicKey() : Promise.resolve('');

      return {
        eventId: event.id,
        authorPubkey: event.pubkey,
        targetEventId: eTag[1],
        targetAuthorPubkey: pTag[1],
        reactionType: event.content,
        createdAt: event.created_at,
        isOwn: false // Will be updated based on pubkey comparison
      };

    } catch (error) {
      if (this.config.debug) {
        console.error('Error parsing reaction event:', error);
      }
      return null;
    }
  }

  private buildReactionCache(targetEventId: string, reactions: Reaction[]): ReactionCacheEntry {
    const userPubkey = this.config.signingProvider?.getPublicKey ? 
      this.config.signingProvider.getPublicKey() : Promise.resolve('');

    return {
      summary: this.aggregateReactions(reactions, userPubkey),
      reactions,
      timestamp: Date.now(),
      ttl: 300000 // 5 minutes
    };
  }

  private aggregateReactions(reactions: Reaction[], userPubkey: string | Promise<string>): ReactionSummary {
    const reactionCounts: Record<string, ReactionCount> = {};
    let userReacted = false;
    let userReactionType: string | undefined;

    for (const reaction of reactions) {
      // Update isOwn based on pubkey
      if (typeof userPubkey === 'string') {
        reaction.isOwn = reaction.authorPubkey === userPubkey;
        if (reaction.isOwn) {
          userReacted = true;
          userReactionType = reaction.reactionType;
        }
      }

      // Aggregate counts
      if (!reactionCounts[reaction.reactionType]) {
        reactionCounts[reaction.reactionType] = {
          type: reaction.reactionType,
          count: 0,
          authors: []
        };
      }

      reactionCounts[reaction.reactionType].count++;
      if (!reactionCounts[reaction.reactionType].authors.includes(reaction.authorPubkey)) {
        reactionCounts[reaction.reactionType].authors.push(reaction.authorPubkey);
      }
    }

    return {
      targetEventId: reactions[0]?.targetEventId || '',
      totalCount: reactions.length,
      reactions: reactionCounts,
      userReacted,
      userReactionType
    };
  }

  private handleNewReaction(reaction: Reaction): void {
    // Update cache
    const cached = this.getCachedReactions(reaction.targetEventId);
    if (cached) {
      cached.reactions.push(reaction);
      const userPubkey = this.config.signingProvider?.getPublicKey ? 
        this.config.signingProvider.getPublicKey() : Promise.resolve('');
      cached.summary = this.aggregateReactions(cached.reactions, userPubkey);
      cached.timestamp = Date.now();
    }

    // Update reactive stores
    this._reactionUpdates.update(updates => {
      const summary = cached?.summary || this.aggregateReactions([reaction], '');
      updates.set(reaction.targetEventId, summary);
      return new Map(updates);
    });

    this._watchedEvents.update(watched => {
      const summary = cached?.summary || this.aggregateReactions([reaction], '');
      watched.set(reaction.targetEventId, summary);
      return new Map(watched);
    });
  }

  private getCachedReactions(eventId: string): ReactionCacheEntry | null {
    const cached = this.reactionCache.get(eventId);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.reactionCache.delete(eventId);
      return null;
    }

    return cached;
  }

  private cacheReactions(eventId: string, entry: ReactionCacheEntry): void {
    this.reactionCache.set(eventId, entry);
  }
}