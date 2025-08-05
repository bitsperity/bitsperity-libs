/**
 * NostrUnchained - Main Class
 * 
 * The primary interface for Nostr Unchained library.
 * Provides simple, zero-config publishing with smart defaults.
 */

import { EventBuilder } from './EventBuilder.js';
import { RelayManager } from '../relay/RelayManager.js';
import { SigningProviderFactory, ExtensionSigner, LocalKeySigner } from '../crypto/SigningProvider.js';
import { ErrorHandler } from '../utils/errors.js';
import { DEFAULT_RELAYS, DEFAULT_CONFIG } from '../utils/constants.js';
import { EventsModule } from '../events/FluentEventBuilder.js';
import { DMModule } from '../dm/api/DMModule.js';
import { UniversalDMModule } from '../dm/api/UniversalDMModule.js';
import { SocialModule } from '../social/api/SocialModule.js';
import { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import { UniversalEventCache, type CacheStatistics } from '../cache/UniversalEventCache.js';
import { QueryBuilder, SubBuilder } from '../query/QueryBuilder.js';
import { ProfileModule } from '../profile/ProfileModule.js';

import type {
  NostrUnchainedConfig,
  PublishResult,
  NostrEvent,
  UnsignedEvent,
  SigningProvider,
  RelayInfo,
  DebugInfo
} from './types.js';

export class NostrUnchained {
  private relayManager: RelayManager;
  private subscriptionManager: SubscriptionManager;
  private cache: UniversalEventCache;
  private signingProvider?: SigningProvider;
  private signingMethod?: 'extension' | 'temporary';
  private config: Required<Omit<NostrUnchainedConfig, 'signingProvider'>> & { signingProvider?: SigningProvider };
  private giftWrapSubscriptionActive: boolean = false;
  private cachedMyPubkey: string | null = null;
  
  // Fluent Event Builder API
  public readonly events: EventsModule;
  
  // Direct Message API (Legacy)
  public readonly dm: DMModule;
  
  // Universal DM API (Cache-based)
  private universalDM?: UniversalDMModule;
  
  // Social Media API
  public readonly social: SocialModule;
  
  // Profile API (Enhanced)
  private _profile?: ProfileModule;

  constructor(config: NostrUnchainedConfig = {}) {
    // Version info for debugging - ALWAYS show
    console.log('🔥 NostrUnchained v0.1.0-FIX (build:', new Date().toISOString().substring(0, 19) + 'Z)');
    
    // Merge with defaults
    this.config = {
      relays: config.relays ?? DEFAULT_RELAYS,
      debug: config.debug ?? false,
      retryAttempts: config.retryAttempts ?? DEFAULT_CONFIG.RETRY_ATTEMPTS,
      retryDelay: config.retryDelay ?? DEFAULT_CONFIG.RETRY_DELAY,
      timeout: config.timeout ?? DEFAULT_CONFIG.PUBLISH_TIMEOUT,
      signingProvider: config.signingProvider
    };

    // Initialize relay manager
    this.relayManager = new RelayManager(this.config.relays, {
      debug: this.config.debug
    });

    // Initialize subscription manager
    this.subscriptionManager = new SubscriptionManager(this.relayManager);

    // Initialize events module
    this.events = new EventsModule(this);

    // PERFECT DX: If signing provider is provided, initialize EVERYTHING immediately
    if (config.signingProvider) {
      this.signingProvider = config.signingProvider;
      this.signingMethod = config.signingProvider.constructor.name.includes('Extension') ? 'extension' : 'temporary';
      
      // Initialize cache synchronously first with empty key
      this.cache = new UniversalEventCache('', {});
      
      // Then try to initialize with private key asynchronously
      this._initializeCache().catch(err => {
        if (this.config.debug) {
          console.log('⚠️ Cache initialization with private key failed:', err);
        }
      });
      
      if (this.config.debug) {
        console.log('🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!');
      }
    } else {
      // Initialize with empty cache if no signing provider yet
      this.cache = new UniversalEventCache('', {});
      
      if (this.config.debug) {
        console.log('🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later');
      }
    }

    // Initialize DM module - works with or without signing provider
    this.dm = new DMModule({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    });

    // Initialize Social module - CLEAN ARCHITECTURE with nostr instance
    this.social = new SocialModule({
      nostr: this,
      debug: this.config.debug
    });

    if (this.config.debug) {
      console.log('NostrUnchained initialized with relays:', this.config.relays);
    }
  }

  /**
   * Initialize cache with signing provider's private key
   */
  private async _initializeCache(): Promise<void> {
    if (!this.signingProvider) return;
    
    try {
      const privateKey = await this.signingProvider.getPrivateKeyForEncryption();
      this.cache = new UniversalEventCache(privateKey, {});
      
      // Initialize Universal DM Module with cache-based architecture
      const myPubkey = await this.signingProvider.getPublicKey();
      this.universalDM = new UniversalDMModule(this, myPubkey);
      
      if (this.config.debug) {
        console.log('🎯 Universal Cache and Universal DM Module initialized');
      }
    } catch (error) {
      // Fallback to empty cache if private key not available
      this.cache = new UniversalEventCache('', {});
      
      if (this.config.debug) {
        console.log('⚠️ Could not get private key for cache, using empty key (no gift wrap decryption)');
      }
    }
  }

  /**
   * Get enhanced profile module (PERFECT DX - always works!)
   */
  get profile(): ProfileModule {
    if (!this._profile) {
      this._profile = new ProfileModule({
        relayManager: this.relayManager,
        subscriptionManager: this.subscriptionManager,
        signingProvider: this.signingProvider,
        eventBuilder: new EventBuilder(),
        cache: this.cache,
        debug: this.config.debug,
        // REQUIRED: Pass NostrUnchained instance for clean architecture
        nostr: this
      });
    }
    return this._profile;
  }

  /**
   * Get configured relay URLs
   */
  get relays(): string[] {
    return this.config.relays;
  }

  /**
   * Get connected relays
   */
  get connectedRelays(): string[] {
    return this.relayManager.connectedRelays;
  }

  /**
   * Initialize signing provider
   * PERFECT DX: Only needed if signingProvider wasn't provided in constructor
   * If it was provided, this does nothing (idempotent)
   */
  async initializeSigning(provider?: SigningProvider): Promise<void> {
    // PERFECT DX: If we already have a signing provider, just return
    if (this.signingProvider && !provider) {
      if (this.config.debug) {
        console.log('🚫 Signing already initialized - skipping (Perfect DX!)');
      }
      return;
    }

    // Use provided provider or auto-detect
    if (provider) {
      this.signingProvider = provider;
      this.signingMethod = provider.constructor.name.includes('Extension') ? 'extension' : 'temporary';
    } else if (this.config.signingProvider) {
      this.signingProvider = this.config.signingProvider;
      this.signingMethod = this.config.signingProvider.constructor.name.includes('Extension') ? 'extension' : 'temporary';
    } else {
      // Auto-detect the best available signing provider
      const { provider: detectedProvider, method } = await SigningProviderFactory.createBestAvailable();
      this.signingProvider = detectedProvider;
      this.signingMethod = method;
    }

    // Clear cached pubkey when signing provider changes
    this.cachedMyPubkey = null;

    // Initialize cache with new signing provider
    await this._initializeCache();

    // Update all modules with signing provider
    await this.dm.updateSigningProvider(this.signingProvider);
    await this.social.updateSigningProvider(this.signingProvider);
    
    // Update profile module if it exists
    if (this._profile) {
      await this._profile.updateSigningProvider(this.signingProvider);
    }

    if (this.config.debug) {
      console.log(`Initialized signing with method: ${this.signingMethod}`);
    }
  }

  /**
   * Connect to relays
   */
  async connect(): Promise<void> {
    try {
      await this.relayManager.connect();
      
      // NOTE: Gift wrap subscription is now lazy-loaded on first DM usage
      // This gives users proper control over when DM subscriptions start
      
      if (this.config.debug) {
        const stats = this.relayManager.getStats();
        console.log('Relay connection stats:', stats);
      }
    } catch (error) {
      throw ErrorHandler.handleConnectionError('relays', error as Error);
    }
  }

  /**
   * Start universal gift wrap subscription (Lazy Loading)
   * This is the critical piece that makes DMs work with the Universal Cache
   * Only starts if not already active - gives users proper control
   */
  async startUniversalGiftWrapSubscription(): Promise<void> {
    // Check if already active
    if (this.giftWrapSubscriptionActive) {
      if (this.config.debug) {
        console.log('🎁 Gift wrap subscription already active - skipping');
      }
      return;
    }

    if (!this.signingProvider) {
      if (this.config.debug) {
        console.log('⚠️ Cannot start gift wrap subscription - no signing provider');
      }
      return;
    }

    try {
      const myPubkey = await this.signingProvider.getPublicKey();
      
      // Subscribe to all gift wraps addressed to me
      // This will populate the Universal Cache with decrypted messages
      const sharedSub = await this.subscriptionManager.getOrCreateSubscription([{
        kinds: [1059], // Gift wrap events
        '#p': [myPubkey],
        limit: 100 // Get recent messages
      }], this.config.relays);
      
      const listenerId = sharedSub.addListener({
        onEvent: async (event: NostrEvent) => {
          // The Universal Cache will automatically handle decryption
          // when events are added through normal caching mechanisms
          if (this.config.debug) {
            console.log(`🎁 Received gift wrap event: ${event.id.substring(0, 8)}...`);
          }
        },
        onEose: () => {
          if (this.config.debug) {
            console.log('🎁 Gift wrap initial sync completed');
          }
        }
      });

      this.giftWrapSubscriptionActive = true;
      
      if (this.config.debug) {
        console.log('🎁 Universal gift wrap subscription started successfully');
      }
    } catch (error) {
      console.error('Failed to start gift wrap subscription:', error);
      throw error;
    }
  }

  /**
   * Disconnect from all relays
   */
  async disconnect(): Promise<void> {
    await this.relayManager.disconnect();
  }

  /**
   * Publish event to specific relays
   */
  async publishToRelays(event: UnsignedEvent, relayUrls: string[]): Promise<PublishResult> {
    if (!this.signingProvider) {
      throw new Error('No signing provider available. Call initializeSigning() first.');
    }
    // Validate the event
    const validation = EventBuilder.validateEvent(event);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }
    // Calculate event ID
    const id = EventBuilder.calculateEventId(event);
    
    // Sign the event
    const signedEvent: NostrEvent = {
      ...event,
      id,
      sig: await this.signingProvider.signEvent({ ...event, id })
    };
    
    // Publish to specific relays
    const relayResults = await this.relayManager.publishToRelays(signedEvent, relayUrls);
    
    // Return standard PublishResult format
    const success = relayResults.some(r => r.success);
    return {
      success,
      eventId: success ? signedEvent.id : undefined,
      event: success ? signedEvent : undefined,
      relayResults,
      timestamp: Date.now(),
      error: success ? undefined : {
        message: 'Failed to publish to any relay',
        code: 'PUBLISH_FAILED',
        retryable: true
      }
    };
  }

  /**
   * Publish an event
   */
  async publish(event: UnsignedEvent): Promise<PublishResult> {
    if (!this.signingProvider) {
      throw new Error('No signing provider available. Call initializeSigning() first.');
    }

    // Validate the event
    const validation = EventBuilder.validateEvent(event);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }

    // Calculate event ID
    const id = EventBuilder.calculateEventId(event);
    
    // Sign the event
    const signedEvent: NostrEvent = {
      ...event,
      id,
      sig: await this.signingProvider.signEvent({ ...event, id })
    };
    
    // Publish to all connected relays
    const relayResults = await this.relayManager.publishToAll(signedEvent);
    
    // Return standard PublishResult format
    const success = relayResults.some(r => r.success);
    return {
      success,
      eventId: success ? signedEvent.id : undefined,
      event: success ? signedEvent : undefined,
      relayResults,
      timestamp: Date.now(),
      error: success ? undefined : {
        message: 'Failed to publish to any relay',
        code: 'PUBLISH_FAILED',
        retryable: true
      }
    };
  }

  /**
   * Get public key
   */
  async getPublicKey(): Promise<string> {
    if (!this.signingProvider) {
      throw new Error('No signing provider available. Call initializeSigning() first.');
    }
    
    // Cache the pubkey for perfect DX
    if (!this.cachedMyPubkey) {
      this.cachedMyPubkey = await this.signingProvider.getPublicKey();
    }
    
    return this.cachedMyPubkey;
  }

  /**
   * PERFECT DX: Get my pubkey synchronously (cached)
   * Returns null if not available yet - perfect for reactive UI
   */
  get me(): string | null {
    return this.cachedMyPubkey;
  }

  /**
   * PERFECT DX: Get my pubkey as Promise (always works)
   * Caches result for instant sync access via .me
   */
  async getMe(): Promise<string | null> {
    try {
      return await this.getPublicKey();
    } catch {
      return null;
    }
  }

  /**
   * Get relay statistics
   */
  getRelayStats(): Record<string, any> {
    return this.relayManager.getStats();
  }

  /**
   * Create a query builder for complex queries
   */
  query(): QueryBuilder {
    return new QueryBuilder(this.cache);
  }

  /**
   * Create a subscription builder
   */
  sub(): SubBuilder {
    return new SubBuilder(this.cache, this.subscriptionManager);
  }

  /**
   * Get the Universal Event Cache for advanced usage
   */
  getCache(): UniversalEventCache {
    return this.cache;
  }

  /**
   * Get the universal event cache instance
   */
  get eventCache(): UniversalEventCache {
    return this.cache;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    return this.cache.getStatistics();
  }

  /**
   * Get the subscription manager for advanced usage
   */
  getSubscriptionManager(): SubscriptionManager {
    return this.subscriptionManager;
  }

  /**
   * Get Universal DM Module (lazy-loaded)
   */
  getDM(): UniversalDMModule | undefined {
    return this.universalDM;
  }

  /**
   * Update the signing provider for this instance and all modules
   */
  async updateSigningProvider(signingProvider: SigningProvider): Promise<void> {
    this.signingProvider = signingProvider;
    this.signingMethod = 'temporary'; // Assume temporary for now
    
    // Update all modules that need signing capability
    if (this.dm) {
      await this.dm.updateSigningProvider(signingProvider);
    }
    
    if (this.social) {
      await this.social.updateSigningProvider(signingProvider);
    }
    
    if (this._profile) {
      await this._profile.updateSigningProvider(signingProvider);
    }
    
    if (this.config.debug) {
      console.log('🔑 NostrUnchained signing provider updated');
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo(): DebugInfo {
    return {
      signingMethod: this.signingMethod || 'none',
      connectedRelays: this.connectedRelays.length,
      cacheSize: this.cache.getStatistics().totalEvents,
      subscriptions: 0, // TODO: Get from subscription manager
      giftWrapActive: this.giftWrapSubscriptionActive
    };
  }
}