/**
 * FeedManager - Social Content Feeds
 * Session 4 Phase 3: Reactions & Feed Management
 * 
 * Provides basic feed functionality:
 * - Global feed (all recent posts)
 * - Following feed (posts from followed users)
 * - Basic feed caching and pagination
 */

import { writable, derived, type Readable } from '../../store/NostrStore.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { NostrEvent, Filter } from '../../core/types.js';

export interface FeedManagerConfig {
  subscriptionManager: any;
  relayManager: any;
  signingProvider: SigningProvider;
  profileManager: any;
  contactManager: any;
  reactionManager: any;
  debug?: boolean;
}

export interface FeedItem {
  eventId: string;
  authorPubkey: string;
  content: string;
  createdAt: number;
  kind: number;
  tags: string[][];
  
  // Social context (populated by other managers)
  authorProfile?: {
    name?: string;
    picture?: string;
  };
  reactionSummary?: {
    totalCount: number;
    userReacted: boolean;
  };
  threadInfo?: {
    isReply: boolean;
    replyCount: number;
  };
}

export interface FeedOptions {
  limit?: number;
  since?: number;
  until?: number;
  kinds?: number[];
}

export class FeedManager {
  private config: FeedManagerConfig;
  private feedCache = new Map<string, FeedItem[]>();
  private activeSubscriptions = new Map<string, string>();
  
  // Reactive stores
  private _globalFeed = writable<FeedItem[]>([]);
  private _followingFeed = writable<FeedItem[]>([]);
  
  // Public reactive properties
  public readonly globalFeed: Readable<FeedItem[]>;
  public readonly followingFeed: Readable<FeedItem[]>;

  constructor(config: FeedManagerConfig) {
    this.config = config;
    
    // Initialize reactive stores
    this.globalFeed = derived(this._globalFeed, $feed => $feed);
    this.followingFeed = derived(this._followingFeed, $feed => $feed);
  }

  /**
   * Get global feed (recent posts from all users)
   */
  async getGlobalFeed(options: FeedOptions = {}): Promise<FeedItem[]> {
    const filters: Filter[] = [{
      kinds: options.kinds || [1], // Text notes by default
      limit: options.limit || 50,
      since: options.since,
      until: options.until
    }];

    return this.fetchFeed('global', filters);
  }

  /**
   * Get following feed (posts from followed users)
   */
  async getFollowingFeed(options: FeedOptions = {}): Promise<FeedItem[]> {
    if (!this.config.signingProvider) {
      return [];
    }

    try {
      const userPubkey = await this.config.signingProvider.getPublicKey();
      
      // Get followed users from ContactManager
      const contacts = await this.config.contactManager.getContacts(userPubkey);
      if (!contacts || contacts.followingList.length === 0) {
        return [];
      }

      const filters: Filter[] = [{
        kinds: options.kinds || [1],
        authors: contacts.followingList,
        limit: options.limit || 50,
        since: options.since,
        until: options.until
      }];

      return this.fetchFeed('following', filters);

    } catch (error) {
      if (this.config.debug) {
        console.error('Error getting following feed:', error);
      }
      return [];
    }
  }

  /**
   * Start real-time feed updates
   */
  async startFeedUpdates(): Promise<void> {
    // Global feed updates
    const globalFilter: Filter = {
      kinds: [1],
      since: Math.floor(Date.now() / 1000),
      limit: 20
    };

    const globalSharedSub = await this.config.subscriptionManager.getOrCreateSubscription([globalFilter]);
    const globalListenerId = globalSharedSub.addListener({
      onEvent: (event: NostrEvent) => {
        const feedItem = this.eventToFeedItem(event);
        this._globalFeed.update(feed => [feedItem, ...feed.slice(0, 99)]); // Keep last 100
      }
    });

    this.activeSubscriptions.set('global-updates', { sharedSub: globalSharedSub, listenerId: globalListenerId });

    // Following feed updates (if user has contacts)
    if (this.config.signingProvider) {
      try {
        const userPubkey = await this.config.signingProvider.getPublicKey();
        const contacts = await this.config.contactManager.getContacts(userPubkey);
        
        if (contacts && contacts.followingList.length > 0) {
          const followingFilter: Filter = {
            kinds: [1],
            authors: contacts.followingList,
            since: Math.floor(Date.now() / 1000),
            limit: 20
          };

          const followingSubId = await this.config.subscriptionManager.subscribe([followingFilter], {
            onEvent: (event: NostrEvent) => {
              const feedItem = this.eventToFeedItem(event);
              this._followingFeed.update(feed => [feedItem, ...feed.slice(0, 99)]);
            }
          });

          this.activeSubscriptions.set('following-updates', followingSubId);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error('Error setting up following feed updates:', error);
        }
      }
    }
  }

  /**
   * Stop feed updates
   */
  async stopFeedUpdates(): Promise<void> {
    for (const [name, subscriptionId] of this.activeSubscriptions.entries()) {
      await this.config.subscriptionManager.close(subscriptionId);
    }
    this.activeSubscriptions.clear();
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
    await this.stopFeedUpdates();
    this.feedCache.clear();
    
    if (this.config.debug) {
      console.log('FeedManager: Closed all subscriptions and cleared cache');
    }
  }

  // Private helper methods

  private async fetchFeed(feedType: string, filters: Filter[]): Promise<FeedItem[]> {
    return new Promise((resolve) => {
      let resolved = false;
      const feedItems: FeedItem[] = [];
      const seenEventIds = new Set<string>();
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.updateFeedStore(feedType, feedItems);
          resolve(feedItems);
        }
      }, 10000);

      this.config.subscriptionManager.subscribe(filters, {
        onEvent: (event: NostrEvent) => {
          if (!seenEventIds.has(event.id)) {
            seenEventIds.add(event.id);
            const feedItem = this.eventToFeedItem(event);
            feedItems.push(feedItem);
          }
        },
        onEose: () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            
            // Sort by creation time (newest first)
            feedItems.sort((a, b) => b.createdAt - a.createdAt);
            
            this.updateFeedStore(feedType, feedItems);
            resolve(feedItems);
          }
        }
      });
    });
  }

  private eventToFeedItem(event: NostrEvent): FeedItem {
    return {
      eventId: event.id,
      authorPubkey: event.pubkey,
      content: event.content,
      createdAt: event.created_at,
      kind: event.kind,
      tags: event.tags,
      
      // Social context will be populated by other managers
      authorProfile: undefined,
      reactionSummary: undefined,
      threadInfo: undefined
    };
  }

  private updateFeedStore(feedType: string, feedItems: FeedItem[]): void {
    if (feedType === 'global') {
      this._globalFeed.set(feedItems);
    } else if (feedType === 'following') {
      this._followingFeed.set(feedItems);
    }
    
    // Cache the feed
    this.feedCache.set(feedType, feedItems);
  }
}