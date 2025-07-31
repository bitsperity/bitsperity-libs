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
import { UniversalQueryBuilder, UniversalSubBuilder } from '../query/UniversalQueryBuilder.js';

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
  
  // Fluent Event Builder API
  public readonly events: EventsModule;
  
  // Direct Message API (Legacy)
  public readonly dm: DMModule;
  
  // Universal DM API (Cache-based)
  private universalDM?: UniversalDMModule;
  
  // Social Media API
  public readonly social: SocialModule;

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

    // Initialize Universal Cache (will be fully initialized when signing provider is set)
    this.cache = new UniversalEventCache('', {}); // Temporary empty key

    // Initialize events module
    this.events = new EventsModule(this);

    // Initialize DM module (will be fully initialized after signing provider is set)
    this.dm = new DMModule({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: undefined as any, // Will be set when initialized
      debug: this.config.debug,
      parent: this // Pass reference to this NostrUnchained instance
    });

    // Initialize Social module (will be fully initialized after signing provider is set)
    this.social = new SocialModule({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: undefined as any, // Will be set when initialized
      eventBuilder: new EventBuilder(), // Create separate EventBuilder instance
      debug: this.config.debug
    });

    // Set signing provider immediately if provided
    if (this.config.signingProvider) {
      this.signingProvider = this.config.signingProvider;
      this.signingMethod = 'temporary';
      if (this.config.debug) {
        console.log('🎯 NostrUnchained initialized with PROVIDED signing provider (should be TemporarySigner)');
      }
    } else {
      if (this.config.debug) {
        console.log('🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later');
      }
    }

    if (this.config.debug) {
      console.log('NostrUnchained initialized with relays:', this.config.relays);
    }
  }

  /**
   * Get configured relay URLs
   */
  get relays(): string[] {
    return this.relayManager.relayUrls;
  }

  /**
   * Get currently connected relay URLs
   */
  get connectedRelays(): string[] {
    return this.relayManager.connectedRelays;
  }

  /**
   * Initialize signing provider
   */
  async initializeSigning(): Promise<void> {
    if (this.signingProvider) {
      // Already initialized (either from constructor or previous call)
      if (this.config.debug) {
        console.log(`🚫 Signing already initialized with method: ${this.signingMethod} - KEEPING IT!`);
      }
      return; // IMPORTANT: Don't override existing signing provider!
    } else {
      // Auto-detect the best available signing provider
      const { provider, method } = await SigningProviderFactory.createBestAvailable();
      this.signingProvider = provider;
      this.signingMethod = method;
      
      if (this.config.debug) {
        console.log(`🔍 Auto-detected signing with method: ${this.signingMethod} (this should NOT happen for temp accounts!)`);
      }
    }

    // Update DM module with signing provider
    await this.dm.updateSigningProvider(this.signingProvider);

    // Update Social module with signing provider
    await this.social.updateSigningProvider(this.signingProvider);

    // Initialize Universal Cache with private key for gift wrap decryption
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
      if (this.config.debug) {
        console.log('⚠️ Could not get private key for cache, using empty key (no gift wrap decryption)');
      }
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
      await this.sub()
        .kinds([1059])         // Gift wraps
        .tags('p', [myPubkey]) // For me
        .execute();
      
      this.giftWrapSubscriptionActive = true;
      
      if (this.config.debug) {
        console.log('🎁 Universal gift wrap subscription started (lazy) for:', myPubkey.substring(0, 16) + '...');
      }
    } catch (error) {
      if (this.config.debug) {
        console.log('⚠️ Failed to start gift wrap subscription:', error);
      }
    }
  }

  /**
   * Disconnect from all relays
   */
  async disconnect(): Promise<void> {
    await this.relayManager.disconnect();
  }

  /**
   * Publish a simple text note
   */
  async publish(content: string): Promise<PublishResult> {
    const startTime = Date.now();
    let debugInfo: DebugInfo = {};

    try {
      // Initialize signing if needed
      await this.initializeSigning();
      debugInfo.signingMethod = this.signingMethod;

      // Get public key
      const pubkey = await this.signingProvider!.getPublicKey();

      // Create unsigned event
      const unsignedEvent = await EventBuilder.createEvent(content, pubkey);

      // Add event ID
      const eventWithId = EventBuilder.addEventId(unsignedEvent);

      // Sign event
      const signature = await this.signingProvider!.signEvent(unsignedEvent);

      // Create complete event
      const event: NostrEvent = {
        ...eventWithId,
        sig: signature
      };

      // Connect to relays if not already connected
      if (this.connectedRelays.length === 0) {
        const connectStart = Date.now();
        await this.connect();
        debugInfo.connectionAttempts = Date.now() - connectStart;
      }

      // Publish to all relays
      const relayResults = await this.relayManager.publishToAll(event);

      // Calculate latencies for debug
      if (this.config.debug) {
        debugInfo.relayLatencies = {};
        relayResults.forEach(result => {
          if (result.latency) {
            debugInfo.relayLatencies![result.relay] = result.latency;
          }
        });
      }

      // Analyze results
      const analysis = ErrorHandler.analyzeRelayResults(relayResults);
      debugInfo.totalTime = Date.now() - startTime;

      const result: PublishResult = {
        success: analysis.success,
        eventId: event.id,
        event,
        relayResults,
        timestamp: Date.now(),
        error: analysis.error,
        debug: this.config.debug ? debugInfo : undefined
      };

      if (this.config.debug) {
        console.log('Publish result:', result);
      }

      return result;

    } catch (error) {
      debugInfo.totalTime = Date.now() - startTime;

      // Handle different types of errors
      let nostrError;
      if (error instanceof Error) {
        if (error.message.includes('Content')) {
          nostrError = ErrorHandler.handleContentError(content);
        } else if (error.message.includes('sign') || error.message.includes('extension')) {
          nostrError = ErrorHandler.handleSigningError(error);
        } else {
          nostrError = ErrorHandler.handleConnectionError('relay', error);
        }
      } else {
        nostrError = ErrorHandler.createError('network', 'Unknown error occurred', {
          retryable: true
        });
      }

      return {
        success: false,
        relayResults: [],
        timestamp: Date.now(),
        error: nostrError,
        debug: this.config.debug ? debugInfo : undefined
      };
    }
  }

  /**
   * Create an event (for testing/advanced usage)
   */
  async createEvent(eventData: {
    kind?: number;
    content: string;
    tags?: string[][];
    created_at?: number;
  }): Promise<NostrEvent> {
    await this.initializeSigning();
    const pubkey = await this.signingProvider!.getPublicKey();

    const unsignedEvent = await EventBuilder.createEvent(
      eventData.content,
      pubkey,
      {
        kind: eventData.kind,
        tags: eventData.tags,
        created_at: eventData.created_at
      }
    );

    const eventWithId = EventBuilder.addEventId(unsignedEvent);
    const signature = await this.signingProvider!.signEvent(unsignedEvent);

    return {
      ...eventWithId,
      sig: signature
    };
  }

  /**
   * Calculate event ID (utility method for testing)
   */
  calculateEventId(event: UnsignedEvent): string {
    return EventBuilder.calculateEventId(event);
  }

  /**
   * Verify event signature (utility method)
   */
  async verifyEvent(event: NostrEvent): Promise<boolean> {
    // For now, just verify the ID matches the calculated hash
    return EventBuilder.verifyEventId(event);
  }

  /**
   * Check if browser extension is available
   */
  async hasExtension(): Promise<boolean> {
    return await ExtensionSigner.isAvailable();
  }

  /**
   * Get public key from extension
   */
  async getExtensionPubkey(): Promise<string> {
    if (!await this.hasExtension()) {
      throw new Error('No browser extension available');
    }

    const signer = new ExtensionSigner();
    return await signer.getPublicKey();
  }

  /**
   * Use browser extension for signing (User Control)
   * Allows user to explicitly choose extension signing
   */
  async useExtensionSigner(): Promise<{ success: boolean; pubkey?: string; error?: string }> {
    try {
      if (!await this.hasExtension()) {
        return { 
          success: false, 
          error: 'No browser extension available' 
        };
      }

      const provider = new ExtensionSigner();
      const pubkey = await provider.getPublicKey();
      
      // Update signing provider
      this.signingProvider = provider;
      this.signingMethod = 'extension';
      
      // Re-initialize modules with new signer
      await this.reinitializeWithNewSigner();
      
      if (this.config.debug) {
        console.log('🎯 User switched to Extension Signer:', pubkey.substring(0, 16) + '...');
      }
      
      return { success: true, pubkey };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Use local key signer for signing (User Control)
   * Allows user to explicitly choose local key signing
   */
  async useLocalKeySigner(): Promise<{ success: boolean; pubkey?: string; error?: string }> {
    try {
      const provider = new LocalKeySigner();
      const pubkey = await provider.getPublicKey();
      
      // Update signing provider
      this.signingProvider = provider;
      this.signingMethod = 'temporary';
      
      // Re-initialize modules with new signer
      await this.reinitializeWithNewSigner();
      
      if (this.config.debug) {
        console.log('🎯 User switched to Local Key Signer:', pubkey.substring(0, 16) + '...');
      }
      
      return { success: true, pubkey };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Use a custom signing provider (User Control)
   * Allows user to provide their own SigningProvider implementation
   */
  async useCustomSigner(provider: SigningProvider): Promise<{ success: boolean; pubkey?: string; error?: string }> {
    try {
      const pubkey = await provider.getPublicKey();
      
      // Update signing provider
      this.signingProvider = provider;
      this.signingMethod = 'temporary'; // Custom signers are treated as 'temporary'
      
      // Re-initialize modules with new signer
      await this.reinitializeWithNewSigner();
      
      if (this.config.debug) {
        console.log('🎯 User switched to Custom Signer:', pubkey.substring(0, 16) + '...');
      }
      
      return { success: true, pubkey };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get current signing method info
   */
  getSigningInfo(): { method?: 'extension' | 'temporary'; pubkey?: string; active: boolean } {
    if (!this.signingProvider) {
      return { active: false };
    }
    
    return {
      method: this.signingMethod,
      active: true
    };
  }

  /**
   * Re-initialize all modules with the new signing provider
   * Called when user switches signers at runtime
   */
  private async reinitializeWithNewSigner(): Promise<void> {
    if (!this.signingProvider) {
      throw new Error('No signing provider available for reinitialization');
    }

    // Update DM module with new signing provider
    await this.dm.updateSigningProvider(this.signingProvider);

    // Update Social module with new signing provider
    await this.social.updateSigningProvider(this.signingProvider);

    // Re-initialize Universal Cache with new private key for gift wrap decryption
    try {
      const privateKey = await this.signingProvider.getPrivateKeyForEncryption();
      this.cache = new UniversalEventCache(privateKey, {});
      
      // Re-initialize Universal DM Module with new signing
      const myPubkey = await this.signingProvider.getPublicKey();
      this.universalDM = new UniversalDMModule(this, myPubkey);
      
      // Reset gift wrap subscription state (will be lazy-loaded again if needed)
      this.giftWrapSubscriptionActive = false;
      
      if (this.config.debug) {
        console.log('🔄 Successfully re-initialized all modules with new signer');
      }
    } catch (error) {
      if (this.config.debug) {
        console.log('⚠️ Could not get private key from new signer, using empty key (no gift wrap decryption)');
      }
      // Initialize with empty key as fallback
      this.cache = new UniversalEventCache('', {});
    }
  }

  /**
   * Get relay information (NIP-11)
   */
  async getRelayInfo(relayUrl: string): Promise<RelayInfo> {
    return await this.relayManager.getRelayInfo(relayUrl);
  }

  /**
   * Test relay connectivity
   */
  async testRelay(relayUrl: string): Promise<{ success: boolean; error?: string }> {
    return await this.relayManager.testRelay(relayUrl);
  }

  /**
   * Publish a pre-built and signed event
   */
  async publishEvent(event: NostrEvent): Promise<PublishResult> {
    const startTime = Date.now();
    let debugInfo: DebugInfo = {};

    try {
      // Connect to relays if not already connected
      if (this.connectedRelays.length === 0) {
        const connectStart = Date.now();
        await this.connect();
        debugInfo.connectionAttempts = Date.now() - connectStart;
      }

      // Publish to all relays
      const relayResults = await this.relayManager.publishToAll(event);

      // Calculate latencies for debug
      if (this.config.debug) {
        debugInfo.relayLatencies = {};
        relayResults.forEach(result => {
          if (result.latency) {
            debugInfo.relayLatencies![result.relay] = result.latency;
          }
        });
      }

      // Analyze results
      const analysis = ErrorHandler.analyzeRelayResults(relayResults);
      debugInfo.totalTime = Date.now() - startTime;

      const result: PublishResult = {
        success: analysis.success,
        eventId: event.id,
        event,
        relayResults,
        timestamp: Date.now(),
        error: analysis.error,
        debug: this.config.debug ? debugInfo : undefined
      };

      if (this.config.debug) {
        console.log('PublishEvent result:', result);
      }

      return result;

    } catch (error) {
      debugInfo.totalTime = Date.now() - startTime;

      // Handle different types of errors
      let nostrError;
      if (error instanceof Error) {
        nostrError = ErrorHandler.handleConnectionError('relay', error);
      } else {
        nostrError = ErrorHandler.createError('network', 'Unknown error occurred', {
          retryable: true
        });
      }

      return {
        success: false,
        relayResults: [],
        timestamp: Date.now(),
        error: nostrError,
        debug: this.config.debug ? debugInfo : undefined
      };
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return this.relayManager.getStats();
  }

  /**
   * Get comprehensive cache statistics for live monitoring
   * Perfect for DevExplorer real-time dashboards
   */
  getCacheStats(): CacheStatistics {
    const stats = this.cache.getStatistics();
    // Replace cache listeners count with actual WebSocket subscriptions
    const activeSubscriptions = this.subscriptionManager.getActiveSubscriptions();
    return {
      ...stats,
      subscribersCount: activeSubscriptions.length
    };
  }

  /**
   * Get the subscription manager for advanced query operations
   */
  getSubscriptionManager(): SubscriptionManager {
    return this.subscriptionManager;
  }

  /**
   * Get the public key of the current user
   */
  async getPublicKey(): Promise<string> {
    if (!this.signingProvider) {
      await this.initializeSigning();
    }
    return await this.signingProvider!.getPublicKey();
  }

  /**
   * Query API - Immediate cache lookup
   * Implements the elegant Universal Cache architecture from the session plan
   */
  query(): UniversalQueryBuilder {
    return new UniversalQueryBuilder(this.cache);
  }

  /**
   * Subscription API - Live data updates
   * Implements the elegant Universal Cache architecture from the session plan
   */
  sub(): UniversalSubBuilder {
    return new UniversalSubBuilder(this.cache, this.subscriptionManager);
  }

  /**
   * Universal encrypted publishing
   * Encrypts any event type and sends to recipients as gift wraps
   */
  async publishEncrypted<T extends Partial<NostrEvent>>(
    event: T, 
    recipients: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.signingProvider) {
        throw new Error('Signing provider not initialized');
      }

      const privateKey = await this.signingProvider.getPrivateKeyForEncryption();
      
      // Import GiftWrapProtocol for universal encryption
      const { GiftWrapProtocol } = await import('../dm/protocol/GiftWrapProtocol.js');
      
      for (const recipient of recipients) {
        const giftWrap = await GiftWrapProtocol.createGiftWrap(
          event as NostrEvent,
          recipient,
          privateKey
        );
        
        // Publish the gift wrap
        await this.publishEvent(giftWrap);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}