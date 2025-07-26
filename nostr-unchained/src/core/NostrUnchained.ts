/**
 * NostrUnchained - Main Class
 * 
 * The primary interface for Nostr Unchained library.
 * Provides simple, zero-config publishing with smart defaults.
 */

import { EventBuilder } from './EventBuilder.js';
import { RelayManager } from '../relay/RelayManager.js';
import { SigningProviderFactory, ExtensionSigner } from '../crypto/SigningProvider.js';
import { ErrorHandler } from '../utils/errors.js';
import { DEFAULT_RELAYS, DEFAULT_CONFIG } from '../utils/constants.js';
import { EventsModule } from '../events/FluentEventBuilder.js';

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
  private signingProvider?: SigningProvider;
  private signingMethod?: 'extension' | 'temporary';
  private config: Required<NostrUnchainedConfig>;
  
  // Fluent Event Builder API
  public readonly events: EventsModule;

  constructor(config: NostrUnchainedConfig = {}) {
    // Merge with defaults
    this.config = {
      relays: config.relays ?? DEFAULT_RELAYS,
      debug: config.debug ?? false,
      retryAttempts: config.retryAttempts ?? DEFAULT_CONFIG.RETRY_ATTEMPTS,
      retryDelay: config.retryDelay ?? DEFAULT_CONFIG.RETRY_DELAY,
      timeout: config.timeout ?? DEFAULT_CONFIG.PUBLISH_TIMEOUT
    };

    // Initialize relay manager
    this.relayManager = new RelayManager(this.config.relays, {
      debug: this.config.debug
    });

    // Initialize events module
    this.events = new EventsModule(this);

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
  private async initializeSigning(): Promise<void> {
    if (this.signingProvider) return;

    const { provider, method } = await SigningProviderFactory.createBestAvailable();
    this.signingProvider = provider;
    this.signingMethod = method;

    if (this.config.debug) {
      console.log(`Initialized signing with method: ${method}`);
    }
  }

  /**
   * Connect to relays
   */
  async connect(): Promise<void> {
    try {
      await this.relayManager.connect();
      
      if (this.config.debug) {
        const stats = this.relayManager.getStats();
        console.log('Relay connection stats:', stats);
      }
    } catch (error) {
      throw ErrorHandler.handleConnectionError('relays', error as Error);
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
}