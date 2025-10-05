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
import { ListModule } from '../lists/ListModule.js';

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
  private _lists?: ListModule;
  
  // Cleanup synchronization
  private closing = false;
  private closePromise?: Promise<void>;

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
      this._lists = new ListModule(this.config.nostr);
    }
    return this._lists;
  }

  /**
   * Update signing provider - simply store reference (modules access via core instance)
   * Social modules access signing through the core NostrUnchained instance, no separate update needed
   */
  async updateSigningProvider(signingProvider: any): Promise<void> {
    if (this.config.debug) {
      console.log('🔑 SocialModule.updateSigningProvider - storing reference');
    }
    
    // The social modules get their signing capability through the core NostrUnchained instance
    // No need to update individual modules since they use nostr.query() and nostr.sub()
    // which internally handle signing via the core instance
    
    // Just acknowledge the update - the core instance will handle actual signing
    // Note: We don't call this.config.nostr.updateSigningProvider() to avoid infinite loop
  }

  /**
   * Clean up resources with proper synchronization
   */
  async close(): Promise<void> {
    // Prevent multiple close() calls
    if (this.closing) {
      if (this.closePromise) {
        return this.closePromise;
      }
      return; // Already closed
    }
    
    this.closing = true;
    
    // Create cleanup promise to prevent race conditions
    this.closePromise = this.performCleanup();
    
    try {
      await this.closePromise;
      if (this.config.debug) {
        console.log('🔥 SocialModule cleanup completed successfully');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('🔥 SocialModule cleanup error:', error);
      }
      throw error;
    }
  }
  
  private async performCleanup(): Promise<void> {
    const cleanupTasks: Promise<void>[] = [];
    
    // Collect all cleanup tasks
    // Note: Current social modules don't have close() methods yet
    // They use Clean Architecture pattern with core NostrUnchained instance
    
    if (this._content && typeof (this._content as any).close === 'function') {
      cleanupTasks.push(
        (this._content as any).close().catch((error: any) => {
          if (this.config.debug) {
            console.warn('SocialModule: ContentModule cleanup error:', error);
          }
        })
      );
    }
    
    if (this._reactions && typeof (this._reactions as any).close === 'function') {
      cleanupTasks.push(
        (this._reactions as any).close().catch((error: any) => {
          if (this.config.debug) {
            console.warn('SocialModule: ReactionModule cleanup error:', error);
          }
        })
      );
    }
    
    if (this._threads && typeof (this._threads as any).close === 'function') {
      cleanupTasks.push(
        (this._threads as any).close().catch((error: any) => {
          if (this.config.debug) {
            console.warn('SocialModule: ThreadModule cleanup error:', error);
          }
        })
      );
    }
    
    if (this._feeds && typeof (this._feeds as any).close === 'function') {
      cleanupTasks.push(
        (this._feeds as any).close().catch((error: any) => {
          if (this.config.debug) {
            console.warn('SocialModule: FeedModule cleanup error:', error);
          }
        })
      );
    }
    
    if (this._communities && typeof (this._communities as any).close === 'function') {
      cleanupTasks.push(
        (this._communities as any).close().catch((error: any) => {
          if (this.config.debug) {
            console.warn('SocialModule: CommunityModule cleanup error:', error);
          }
        })
      );
    }
    
    if (this._lists && typeof (this._lists as any).close === 'function') {
      cleanupTasks.push(
        (this._lists as any).close().catch((error: any) => {
          if (this.config.debug) {
            console.warn('SocialModule: ListModule cleanup error:', error);
          }
        })
      );
    }
    
    // Execute all cleanup tasks in parallel with timeout protection
    if (cleanupTasks.length > 0) {
      await Promise.race([
        Promise.all(cleanupTasks),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Module cleanup timeout after 10 seconds')), 10000)
        )
      ]);
    }
    
    // Clear module references to prevent memory leaks
    this._content = undefined as any;
    this._reactions = undefined as any;
    this._threads = undefined as any;
    this._feeds = undefined as any;
    this._communities = undefined as any;
    this._lists = undefined as any;
  }
}