/**
 * SocialModule - Main entry point for social media functionality
 * 
 * Provides the nostr.social API with clean, intuitive, and complete
 * social media features:
 * - nostr.social.profiles - User profile management
 * - nostr.social.contacts - Following/followers
 * - nostr.social.threads - Threading and replies
 * - nostr.social.reactions - Likes and custom reactions
 * - nostr.social.feeds - Social content feeds
 */

// ProfileManager removed - now handled by enhanced ProfileModule
import { ContactManager } from '../contacts/ContactManager.js';
import { ThreadManager } from '../threads/ThreadManager.js';
import { ReactionManager } from '../reactions/ReactionManager.js';
import { FeedManager } from '../feeds/FeedManager.js';
import type { SubscriptionManager } from '../../subscription/SubscriptionManager.js';
import type { RelayManager } from '../../relay/RelayManager.js';
import type { SigningProvider } from '../../crypto/SigningProvider.js';
import type { EventBuilder } from '../../events/EventBuilder.js';

export interface SocialModuleConfig {
  subscriptionManager: SubscriptionManager;
  relayManager: RelayManager;
  signingProvider: SigningProvider;
  eventBuilder: EventBuilder;
  debug?: boolean;
}

export class SocialModule {
  private config: SocialModuleConfig;
  private _contactManager?: ContactManager;
  private _threadManager?: ThreadManager;
  private _reactionManager?: ReactionManager;
  private _feedManager?: FeedManager;

  // Public API interfaces
  // profiles: handled by enhanced ProfileModule in core
  public readonly contacts: ContactManager;
  public readonly threads: ThreadManager;
  public readonly reactions: ReactionManager;
  public readonly feeds: FeedManager;

  constructor(config: SocialModuleConfig) {
    this.config = config;

    // Note: ProfileManager removed - now handled by enhanced ProfileModule
    
    // Initialize other managers lazily for better performance
    this.contacts = this.getContactManager();
    this.threads = this.getThreadManager();
    this.reactions = this.getReactionManager();
    this.feeds = this.getFeedManager();

    if (this.config.debug) {
      console.log('SocialModule initialized with all managers');
    }
  }

  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.config.signingProvider = signingProvider;
    
    // Update all managers (ProfileManager removed)
    
    if (this._contactManager) {
      await this._contactManager.updateSigningProvider(signingProvider);
    }
    
    if (this._threadManager) {
      await this._threadManager.updateSigningProvider(signingProvider);
    }
    
    if (this._reactionManager) {
      await this._reactionManager.updateSigningProvider(signingProvider);
    }
    
    if (this._feedManager) {
      await this._feedManager.updateSigningProvider(signingProvider);
    }

    if (this.config.debug) {
      console.log('SocialModule: Updated signing provider for all managers');
    }
  }

  /**
   * Get a specific event by ID with social context
   */
  async getEvent(eventId: string): Promise<SocialEvent | null> {
    // This will be implemented to return events with social context
    // like reactions, replies, author profile, etc.
    throw new Error('getEvent not yet implemented');
  }

  /**
   * Close all social module subscriptions and cleanup
   */
  async close(): Promise<void> {
    await Promise.all([
      // this._profileManager.close(), // Removed
      this._contactManager?.close(),
      this._threadManager?.close(),
      this._reactionManager?.close(),
      this._feedManager?.close()
    ]);

    if (this.config.debug) {
      console.log('SocialModule: All managers closed');
    }
  }

  // Lazy initialization methods for better performance

  private getContactManager(): ContactManager {
    if (!this._contactManager) {
      this._contactManager = new ContactManager({
        subscriptionManager: this.config.subscriptionManager,
        relayManager: this.config.relayManager,
        signingProvider: this.config.signingProvider,
        eventBuilder: this.config.eventBuilder,
        // profileManager: removed,
        debug: this.config.debug
      });
    }
    return this._contactManager;
  }

  private getThreadManager(): ThreadManager {
    if (!this._threadManager) {
      this._threadManager = new ThreadManager({
        subscriptionManager: this.config.subscriptionManager,
        relayManager: this.config.relayManager,
        signingProvider: this.config.signingProvider,
        eventBuilder: this.config.eventBuilder,
        // profileManager: removed,
        debug: this.config.debug
      });
    }
    return this._threadManager;
  }

  private getReactionManager(): ReactionManager {
    if (!this._reactionManager) {
      this._reactionManager = new ReactionManager({
        subscriptionManager: this.config.subscriptionManager,
        relayManager: this.config.relayManager,
        signingProvider: this.config.signingProvider,
        eventBuilder: this.config.eventBuilder,
        debug: this.config.debug
      });
    }
    return this._reactionManager;
  }

  private getFeedManager(): FeedManager {
    if (!this._feedManager) {
      this._feedManager = new FeedManager({
        subscriptionManager: this.config.subscriptionManager,
        relayManager: this.config.relayManager,
        signingProvider: this.config.signingProvider,
        // profileManager: removed,
        contactManager: this.getContactManager(),
        reactionManager: this.getReactionManager(),
        debug: this.config.debug
      });
    }
    return this._feedManager;
  }
}

/**
 * Social Event - Event with social context
 */
export interface SocialEvent {
  id: string;
  kind: number;
  content: string;
  pubkey: string;
  created_at: number;
  tags: string[][];
  sig: string;
  
  // Social context
  author?: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  reactions?: {
    likes: number;
    dislikes: number;
    custom: Record<string, number>;
  };
  replyContext?: {
    rootEventId?: string;
    parentEventId?: string;
    depth: number;
  };
  
  // Methods for interaction
  reply: (content: string) => Promise<{ success: boolean; eventId?: string }>;
  like: () => Promise<{ success: boolean }>;
  repost: () => Promise<{ success: boolean }>;
}