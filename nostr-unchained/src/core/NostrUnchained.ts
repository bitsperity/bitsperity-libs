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
import { CommentsModule } from '../social/comments/CommentsModule.js';
import { ListModule } from '../social/lists/ListModule.js';
import { LabelsModule } from '../social/labels/LabelsModule.js';
import { ChannelsModule } from '../social/chat/ChannelsModule.js';
import { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import { UniversalEventCache, type CacheStatistics } from '../cache/UniversalEventCache.js';
import { QueryBuilder, SubBuilder } from '../query/QueryBuilder.js';
import { ProfileModule } from '../profile/ProfileModule.js';
import { RelayListModule } from '../relay/RelayListModule.js';
import { Nip65RelayRouter, type RelayRoutingStrategy } from '../relay/Nip65RelayRouter.js';

import type {
  NostrUnchainedConfig,
  PublishResult,
  NostrEvent,
  UnsignedEvent,
  SigningProvider,
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
  // Comments API (NIP-22)
  private _comments?: CommentsModule;
  // Lists API (NIP-51)
  private _lists?: ListModule;
  // Labels API (NIP-32)
  private _labels?: LabelsModule;
  // Channels API (NIP-28)
  private _channels?: ChannelsModule;
  
  // Profile API (Enhanced)
  private _profile?: ProfileModule;
  // Relay List API (NIP-65)
  private _relayList?: RelayListModule;
  // Optional routing strategy (NIP-65)
  private relayRouter?: RelayRoutingStrategy;

  constructor(config: NostrUnchainedConfig = {}) {
    // Merge with defaults
    const baseConfig: any = {
      relays: config.relays ?? DEFAULT_RELAYS,
      debug: config.debug ?? false,
      retryAttempts: config.retryAttempts ?? DEFAULT_CONFIG.RETRY_ATTEMPTS,
      retryDelay: config.retryDelay ?? DEFAULT_CONFIG.RETRY_DELAY,
      timeout: config.timeout ?? DEFAULT_CONFIG.PUBLISH_TIMEOUT,
      routing: config.routing ?? 'none'
    };
    if (config.signingProvider) {
      baseConfig.signingProvider = config.signingProvider;
    }
    this.config = baseConfig as any;

    // Version info for debugging - only when debug is enabled
    if (this.config.debug) {
      console.log('🔥 NostrUnchained v0.1.0-FIX (build:', new Date().toISOString().substring(0, 19) + 'Z)');
    }

    // Initialize relay manager
    this.relayManager = new RelayManager(this.config.relays, {
      debug: this.config.debug
    });

    // Initialize subscription manager
    this.subscriptionManager = new SubscriptionManager(this.relayManager);

    // Configure NIP-42 AUTH (if signer available later, we still install factory dynamically)
    this.relayManager.configureAuth({
      authEventFactory: async ({ relay, challenge }) => {
        // Build canonical AUTH event (kind 22242) per NIP-42
        if (!this.signingProvider) throw new Error('No signing provider for AUTH');
        const pubkey = await this.signingProvider.getPublicKey();
        const unsigned = {
          pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: 22242,
          tags: [
            ['relay', relay] as string[],
            ['challenge', challenge] as string[]
          ] as string[][],
          content: ''
        } as { pubkey: string; created_at: number; kind: number; tags: string[][]; content: string };
        const id = EventBuilder.calculateEventId(unsigned as any);
        const sig = await this.signingProvider.signEvent(unsigned as any);
        return { ...(unsigned as any), id, sig } as any;
      },
      onAuthStateChange: (relay, state) => {
        if (this.config.debug) {
          console.log(`NIP-42 state for ${relay}:`, state);
        }
      }
    });

    // Initialize events module
    this.events = new EventsModule(this);

    // PERFECT DX: If signing provider is provided, initialize EVERYTHING immediately
    if (config.signingProvider) {
      this.signingProvider = config.signingProvider;
      this.signingMethod = config.signingProvider.constructor.name.includes('Extension') ? 'extension' : 'temporary';
      
      // Initialize cache synchronously first with empty key
      this.cache = new UniversalEventCache('', { debug: this.config.debug });
      
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
      this.cache = new UniversalEventCache('', { debug: this.config.debug });
      
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

    // Initialize optional router (nip65)
    if (this.config.routing === 'nip65') {
      // RelayListModule will be lazily created in getter; create router now
      this.relayRouter = new Nip65RelayRouter(this.relayList, (u) => this.normalizeRelayUrl(u));
    }
  }

  /**
   * Initialize cache with signing provider's private key
   */
  private async _initializeCache(): Promise<void> {
    if (!this.signingProvider) return;
    
    try {
      // Decryptor-first: wire decryptor if signer supports NIP-44 decrypt
      if (!this.cache) {
        this.cache = new UniversalEventCache('', {});
      }
      try {
        if (this.signingProvider.capabilities) {
          const caps = await this.signingProvider.capabilities();
          if (caps.nip44Decrypt && (this.cache as any).setDecryptor) {
            (this.cache as any).setDecryptor({ nip44Decrypt: (this.signingProvider as any).nip44Decrypt.bind(this.signingProvider) });
          }
        }
      } catch {}
      // Reprocess wraps without relying on raw key paths
      await this.cache.reprocessGiftWraps();
      
      // Initialize Universal DM Module with cache-based architecture
      const myPubkey = await this.signingProvider.getPublicKey();
      this.universalDM = new UniversalDMModule(this, myPubkey);
      
      if (this.config.debug) {
        console.log('🎯 Universal Cache and Universal DM Module initialized');
      }
      // Wire decryptor if available (extension NIP-44)
      try {
        if (this.signingProvider.capabilities) {
          const caps = await this.signingProvider.capabilities();
          if (caps.nip44Decrypt && (this.cache as any).setDecryptor) {
            (this.cache as any).setDecryptor({ nip44Decrypt: this.signingProvider.nip44Decrypt!.bind(this.signingProvider) });
          }
        }
      } catch {}

    } catch (error) {
      // Ensure cache exists even if decryptor wiring failed
      if (!this.cache) this.cache = new UniversalEventCache('', {});
    }
  }

  // P1: Removed raw key access API. Encryption must use signer nip44 capabilities.

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
   * Get NIP-65 Relay List module
   */
  get relayList(): RelayListModule {
    if (!this._relayList) {
      this._relayList = new RelayListModule(this);
    }
    return this._relayList;
  }

  /** NIP-51 Lists module */
  get lists(): ListModule {
    if (!this._lists) {
      this._lists = new ListModule(this);
    }
    return this._lists;
  }

  /** NIP-32 Labels module */
  get labels(): LabelsModule {
    if (!this._labels) {
      this._labels = new LabelsModule(this);
    }
    return this._labels;
  }

  /** NIP-28 Channels module */
  get channels(): ChannelsModule {
    if (!this._channels) {
      this._channels = new ChannelsModule(this);
    }
    return this._channels;
  }

  /** NIP-22 Comments module */
  get comments(): CommentsModule {
    if (!this._comments) {
      this._comments = new CommentsModule(this);
    }
    return this._comments;
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

    // Ensure decryptor is wired after cache init as well
    try {
      if (this.signingProvider && (this.signingProvider as any).nip44Decrypt && (this.cache as any).setDecryptor) {
        (this.cache as any).setDecryptor({ nip44Decrypt: (this.signingProvider as any).nip44Decrypt.bind(this.signingProvider) });
        if (this.config.debug) {
          console.log('🔐 Using signer-provided NIP-44 decrypt capability');
        }
      }
    } catch {}

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

    // Auto-start universal gift wrap subscription after signing init
    // This ensures receiver side decrypts DMs without needing to open a conversation first
    try {
      await this.startUniversalGiftWrapSubscription();
    } catch {
      // non-fatal
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
      // Ensure relay connection before creating the subscription
      if (this.relayManager.connectedRelays.length === 0) {
        await this.connect();
      }

      const myPubkey = await this.signingProvider.getPublicKey();
      
      // Subscribe to all gift wraps addressed to me
      // This will populate the Universal Cache with decrypted messages
      const sharedSub = await this.subscriptionManager.getOrCreateSubscription([{
        kinds: [1059], // Gift wrap events
        '#p': [myPubkey],
        limit: 100 // Get recent messages
      }], this.config.relays);
      
      sharedSub.addListener({
        onEvent: async (event: NostrEvent) => {
          // Feed into UniversalEventCache → auto-unwrapped → kind 14 in cache
          try {
            await this.cache.addEvent(event);
          } catch {}
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
    const signature = await this.signingProvider.signEvent(event);
    const signedEvent: NostrEvent = { ...event, id, sig: signature };
    
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
      error: success ? undefined : { message: 'Failed to publish to any relay', retryable: true }
    };
  }

  /**
   * Publish an event
   */
  async publish(event: UnsignedEvent): Promise<PublishResult>;
  async publish(content: string, kind?: number): Promise<PublishResult>;
  async publish(eventOrContent: UnsignedEvent | string, kind: number = 1): Promise<PublishResult> {
    const startTime = Date.now();
    
    if (!this.signingProvider) {
      throw new Error('No signing provider available. Call initializeSigning() first.');
    }

    // Build event from content if a string was provided
    const event: UnsignedEvent = typeof eventOrContent === 'string'
      ? await EventBuilder.createEvent(eventOrContent, await this.getPublicKey(), { kind })
      : eventOrContent;

    // Validate the event
    const validation = EventBuilder.validateEvent(event);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }

    // Calculate event ID
    const id = EventBuilder.calculateEventId(event);
    const signature = await this.signingProvider.signEvent(event);
    const signedEvent: NostrEvent = { ...event, id, sig: signature };
    
    // Determine target relays
    let targetRelays = this.relayManager.connectedRelays;
    try {
      if (this.relayRouter && this.config.routing === 'nip65') {
        const authorPubkey = signedEvent.pubkey;
        const mentioned = this.extractMentionedPubkeys(signedEvent);
        targetRelays = await this.relayRouter.selectRelays(signedEvent, targetRelays, {
          authorPubkey,
          mentionedPubkeys: mentioned
        });
      }
    } catch {}

    // Publish to selected relays
    const relayResults = await this.relayManager.publishToRelays(signedEvent, targetRelays);
    
    const totalTime = Date.now() - startTime;
    
    // Return standard PublishResult format
    const success = relayResults.some(r => r.success);
      const result: PublishResult = {
      success,
      eventId: success ? signedEvent.id : undefined,
      event: success ? signedEvent : undefined,
      relayResults,
      timestamp: Date.now(),
        error: success ? undefined : { message: 'Failed to publish to any relay', retryable: true, suggestion: 'Check relay connectivity or try different relays' }
    };
    
    // Add debug info if debug mode is enabled
    if (this.config.debug) {
      result.debug = {
        connectionAttempts: this.relayManager.connectedRelays.length,
        relayLatencies: relayResults.reduce<Record<string, number>>((acc, r) => { acc[r.relay] = 0; return acc; }, {}),
        totalTime,
        signingMethod: (this.signingMethod === 'extension' ? 'extension' : 'temporary'),
        targetRelays
      } as DebugInfo;
    }
    
    return result;
  }

  /**
   * Publish an already signed event (for Gift Wraps, etc.)
   * This bypasses the normal signing process since the event is already signed
   */
  async publishSigned(signedEvent: NostrEvent): Promise<PublishResult> {
    const startTime = Date.now();
    
    // Validate the signed event structure
    if (!signedEvent.id || !signedEvent.sig || !signedEvent.pubkey) {
      throw new Error('Invalid signed event: Missing required fields (id, sig, pubkey)');
    }
    
    // Determine target relays
    let targetRelays = this.relayManager.connectedRelays;
    try {
      if (this.relayRouter && this.config.routing === 'nip65') {
        const authorPubkey = signedEvent.pubkey;
        const mentioned = this.extractMentionedPubkeys(signedEvent);
        targetRelays = await this.relayRouter.selectRelays(signedEvent, targetRelays, {
          authorPubkey,
          mentionedPubkeys: mentioned
        });
      }
    } catch {}

    // Publish to selected relays (no re-signing)
    const relayResults = await this.relayManager.publishToRelays(signedEvent, targetRelays);
    
    const totalTime = Date.now() - startTime;
    
    // Return standard PublishResult format
    const success = relayResults.some(r => r.success);
    const result: PublishResult = {
      success,
      eventId: success ? signedEvent.id : undefined,
      event: success ? signedEvent : undefined,
      relayResults,
      timestamp: Date.now(),
      error: success ? undefined : { message: 'Failed to publish to any relay', retryable: true, suggestion: 'Check relay connectivity or try different relays' }
    };
    
    // Add debug info if debug mode is enabled
    if (this.config.debug) {
      result.debug = {
        connectionAttempts: this.relayManager.connectedRelays.length,
        relayLatencies: relayResults.reduce<Record<string, number>>((acc, r) => { acc[r.relay] = 0; return acc; }, {}),
        totalTime,
        signingMethod: 'temporary',
        targetRelays
      } as DebugInfo;
    }
    
    return result;
  }

  // ------------- Internal helpers -------------
  private extractMentionedPubkeys(event: NostrEvent): string[] {
    const mentioned: string[] = [];
    for (const tag of event.tags || []) {
      if (Array.isArray(tag) && tag[0] === 'p' && tag[1] && /^[0-9a-f]{64}$/i.test(tag[1])) {
        mentioned.push(tag[1].toLowerCase());
      }
    }
    return mentioned;
  }

  private normalizeRelayUrl(url: string): string {
    if (!url) return url;
    let u = url.trim();
    if (!/^wss?:\/\//i.test(u)) {
      // default to wss if missing
      u = 'wss://' + u.replace(/^\/*/, '');
    }
    // strip trailing slashes
    u = u.replace(/\/+$/, '');
    return u;
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
   * Alias for getRelayStats (DX convenience)
   */
  getStats(): Record<string, any> {
    return this.getRelayStats();
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
   * DX convenience: detect NIP-07 extension availability
   */
  async hasExtension(): Promise<boolean> {
    try {
      return await ExtensionSigner.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * DX convenience: initialize with ExtensionSigner (if available)
   */
  async useExtensionSigner(): Promise<{ success: boolean; pubkey?: string; error?: string }> {
    try {
      const signer = new ExtensionSigner();
      await this.initializeSigning(signer);
      const pubkey = await signer.getPublicKey();
      return { success: true, pubkey };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * DX convenience: initialize with LocalKeySigner (DEV/testing)
   */
  async useLocalKeySigner(): Promise<{ success: boolean; pubkey?: string; error?: string }> {
    try {
      const signer = new LocalKeySigner();
      await this.initializeSigning(signer);
      const pubkey = await signer.getPublicKey();
      return { success: true, pubkey };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * DX convenience: expose signing method and pubkey for UI
   */
  getSigningInfo(): { method: 'extension' | 'temporary' | 'unknown'; pubkey: string | null } {
    const method: 'extension' | 'temporary' | 'unknown' = this.signingMethod ?? 'unknown';
    return { method, pubkey: this.me };
  }

  /**
   * DX convenience: initialize with a custom SigningProvider
   */
  async useCustomSigner(provider: SigningProvider): Promise<{ success: boolean; pubkey?: string; error?: string }> {
    try {
      await this.initializeSigning(provider);
      const pubkey = await provider.getPublicKey();
      return { success: true, pubkey };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
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
    const info: any = {
      signingMethod: (this.signingMethod === 'extension' ? 'extension' : 'temporary'),
      cacheSize: this.cache.getStatistics().totalEvents,
      giftWrapActive: this.giftWrapSubscriptionActive
    };
    return info as DebugInfo;
  }
}