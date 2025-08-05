/**
 * SocialModule - Clean Architecture Social Media API
 * 
 * 100% Clean Architecture implementation following ProfileModule pattern:
 * - Uses nostr.query() and nostr.sub() exclusively  
 * - Returns UniversalNostrStore for reactive data
 * - No direct cache or SubscriptionManager access
 * - Implements 15+ NIPs for comprehensive social functionality
 */

import type { NostrUnchained } from '../../core/NostrUnchained.js';
import { ReactionModule } from '../reactions/ReactionModule.js';
import { ContentModule } from '../content/ContentModule.js';
import { ThreadModule } from '../threads/ThreadModule.js';
import { FeedModule } from '../feeds/FeedModule.js';

export interface SocialModuleConfig {
  nostr: NostrUnchained;
  debug?: boolean;
}

export class SocialModule {
  private config: SocialModuleConfig;

  // Lazy-loaded modules
  private _content?: ContentModule;
  private _reactions?: ReactionModule;
  private _threads?: ThreadModule;
  private _feeds?: FeedModule;
  private _communities?: any; // CommunityModule;
  private _lists?: any; // ListModule;

  constructor(config: SocialModuleConfig) {
    this.config = config;
    
    if (this.config.debug) {
      console.log('🔥 SocialModule initialized with Clean Architecture');
    }
  }

  /**
   * Content operations (NIP-01, NIP-18, NIP-23)
   * Text notes, articles, reposts
   */
  get content() {
    if (!this._content) {
      this._content = new ContentModule(this.config.nostr, this.config.debug);
    }
    return this._content;
  }

  /**
   * Reaction operations (NIP-25)
   * Likes, dislikes, emoji reactions
   */
  get reactions() {
    if (!this._reactions) {
      this._reactions = new ReactionModule(this.config.nostr, this.config.debug);
    }
    return this._reactions;
  }

  /**
   * Thread operations (NIP-10, NIP-22)
   * Threading, conversations, comments
   */
  get threads() {
    if (!this._threads) {
      this._threads = new ThreadModule(this.config.nostr, this.config.debug);
    }
    return this._threads;
  }

  /**
   * Feed operations
   * Timeline aggregation, social feeds
   */
  get feeds() {
    if (!this._feeds) {
      this._feeds = new FeedModule(this.config.nostr, this.config.debug);
    }
    return this._feeds;
  }

  /**
   * Community operations (NIP-28, NIP-72)
   * Public chat, moderated communities
   */
  get communities() {
    if (!this._communities) {
      // TODO: Implement CommunityModule
      throw new Error('CommunityModule not yet implemented - Coming in Phase 3');
    }
    return this._communities;
  }

  /**
   * List operations (NIP-51)
   * Generic list management
   */
  get lists() {
    if (!this._lists) {
      // TODO: Implement ListModule
      throw new Error('ListModule not yet implemented - Coming in Phase 2');
    }
    return this._lists;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    // Close all initialized modules
    if (this._content?.close) await this._content.close();
    if (this._reactions?.close) await this._reactions.close();
    if (this._threads?.close) await this._threads.close();
    if (this._feeds?.close) await this._feeds.close();
    if (this._communities?.close) await this._communities.close();
    if (this._lists?.close) await this._lists.close();
  }
}