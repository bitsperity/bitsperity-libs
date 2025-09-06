/**
 * Profile Subscription Manager
 * 
 * Aggregates multiple profile requests into a single subscription to reduce
 * relay subscription pressure. Implements subscription cleanup and caching.
 * 
 * Solves the "Maximum concurrent subscription count reached" problem by:
 * 1. Batching profile requests into single subscriptions
 * 2. Cleaning up unused profile subscriptions
 * 3. Implementing subscription deduplication
 */

import { writable } from 'svelte/store';
import { createContextLogger } from './Logger.js';

const logger = createContextLogger('ProfileSubscriptionManager');

// =============================================================================
// Types
// =============================================================================

interface ProfileRequest {
  pubkey: string;
  timestamp: number;
  subscribers: Set<string>;
}

interface ProfileCache {
  [pubkey: string]: {
    data: any;
    timestamp: number;
    lastRequested: number;
    subscription?: any;
  };
}

// =============================================================================
// Profile Subscription Manager
// =============================================================================

class ProfileSubscriptionManager {
  private nostr: any = null;
  private requestQueue = new Set<string>();
  private activeRequests = new Map<string, ProfileRequest>();
  private profileCache: ProfileCache = {};
  private batchTimeout: number | null = null;
  private cleanupInterval: number | null = null;
  
  // Configuration
  private readonly BATCH_DELAY = 300; // ms - wait for more requests before batching
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 30 * 1000; // 30 seconds
  private readonly MAX_BATCH_SIZE = 20; // reduce batch size to avoid UI spikes
  // Live profile updates: keep subs open while there are subscribers
  private readonly SUB_CLOSE_DELAY = 0; // disabled auto-close; lifecycle-managed

  // Keep reference to the last aggregated subscription to avoid opening too many in parallel
  private lastAggregatedStop: (() => Promise<void>) | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Initialize with NostrUnchained instance
   */
  initialize(nostrInstance: any) {
    this.nostr = nostrInstance;
    logger.info('ProfileSubscriptionManager initialized');
  }

  /**
   * Request a profile - returns a reactive store
   */
  requestProfile(pubkey: string, subscriberId: string) {
    if (!this.nostr) {
      logger.warn('NostrUnchained not initialized');
      // Use undefined to signal loading to consumers
      return writable(undefined);
    }

    // Ensure cache bucket exists with ONE shared store per pubkey
    let cached = this.profileCache[pubkey];
    if (!cached) {
      cached = this.profileCache[pubkey] = {
        data: undefined,
        timestamp: 0,
        lastRequested: Date.now(),
        // Start with undefined to indicate loading state for new subscribers
        subscription: writable(undefined)
      };
    } else {
      cached.lastRequested = Date.now();
    }

    // Track this request
    if (!this.activeRequests.has(pubkey)) {
      this.activeRequests.set(pubkey, {
        pubkey,
        timestamp: Date.now(),
        subscribers: new Set()
      });
      this.requestQueue.add(pubkey);
    }

    // Add subscriber to track usage
    const active = this.activeRequests.get(pubkey);
    if (active) {
      active.subscribers.add(subscriberId);
    }

    // Schedule batch processing
    this.scheduleBatchRequest();

    // Serve existing data immediately via the shared store
    if (cached.data != null) {
      try { cached.subscription!.set(cached.data); } catch {}
    }

    return cached.subscription!;
  }

  /**
   * Remove subscriber from profile request
   */
  unsubscribeProfile(pubkey: string, subscriberId: string) {
    const request = this.activeRequests.get(pubkey);
    if (request) {
      request.subscribers.delete(subscriberId);
      
      // If no more subscribers, mark for cleanup
      if (request.subscribers.size === 0) {
        logger.debug('Profile has no more subscribers, marking for cleanup', undefined, { 
          pubkey: pubkey.substring(0, 8) 
        });
      }
    }

    // If there are no subscribers across all requests, stop live sub
    this.ensureLiveSubscriptionLifecycle();
  }

  /**
   * Schedule batch request processing
   */
  private scheduleBatchRequest() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout as unknown as number);
    }

    this.batchTimeout = (setTimeout(() => {
      this.processBatchRequest();
    }, this.BATCH_DELAY) as unknown as number);
  }

  /**
   * Process queued profile requests in batches
   */
  private async processBatchRequest() {
    if (this.requestQueue.size === 0) return;

    const batch = Array.from(this.requestQueue).slice(0, this.MAX_BATCH_SIZE);
    this.requestQueue.clear();

    try {
      logger.info('Processing profile batch', undefined, { 
        count: batch.length,
        pubkeys: batch.map(pk => pk.substring(0, 8)) 
      });

      // Use NostrUnchained to batch-request profiles
      await this.fetchProfileBatch(batch);

    } catch (error) {
      logger.error('Failed to process profile batch', undefined, { error, batch: batch.length });
      
      // Re-queue failed requests
      batch.forEach(pubkey => this.requestQueue.add(pubkey));
      
      // Retry with exponential backoff
      setTimeout(() => {
        this.processBatchRequest();
      }, 1000);
    }
  }

  /**
   * Fetch a batch of profiles using individual profile.get() calls
   * but with controlled timing to reduce subscription pressure
   */
  private async fetchProfileBatch(pubkeys: string[]) {
    if (!pubkeys.length) return;

    // Cancel previous aggregated subscription if it's still around
    if (this.lastAggregatedStop) {
      try { await this.lastAggregatedStop(); } catch {}
      this.lastAggregatedStop = null;
    }

    try {
      // Build a cache reader store and subscribe to it for continuous updates
      const cacheStore = this.nostr.query()
        .kinds([0])
        .authors(pubkeys)
        .limit(pubkeys.length)
        .execute();

      const primeFromCache = (events: any[]) => {
        for (const event of events || []) {
          if (event?.kind === 0 && event.pubkey && pubkeys.includes(event.pubkey)) {
            try {
              const profileData = {
                pubkey: event.pubkey,
                metadata: JSON.parse(event.content),
                lastUpdated: event.created_at,
                eventId: event.id,
                isOwn: false
              };
              this.updateProfileCache(event.pubkey, profileData);
            } catch {}
          }
        }
      };

      // Subscribe to cache store to push updates to UI stores
      const cacheUnsubscribe = cacheStore.subscribe((events: any[]) => {
        try { primeFromCache(events); } catch {}
      });

      // 2) Single aggregated live sub for all requested authors (feeds cache)
      const handle = await this.nostr.sub()
        .kinds([0])
        .authors(pubkeys)
        .limit(pubkeys.length)
        .execute();

      // Keep live subscription open while there are active subscribers
      const stop = async () => {
        try { cacheUnsubscribe && cacheUnsubscribe(); } catch {}
        try { await handle.stop(); } catch {}
      };
      this.lastAggregatedStop = stop;
      this.ensureLiveSubscriptionLifecycle();

      return { success: true };
    } catch (error) {
      logger.error('Failed aggregated profile fetch', undefined, { count: pubkeys.length, error });
      return { success: false, error };
    }
  }

  /**
   * Ensure live subscription lifecycle matches active subscribers presence
   */
  private async ensureLiveSubscriptionLifecycle() {
    const hasAnySubscriber = Array.from(this.activeRequests.values()).some(r => r.subscribers.size > 0);
    if (!hasAnySubscriber && this.lastAggregatedStop) {
      try {
        await this.lastAggregatedStop();
        logger.debug('Aggregated profile subscription stopped (no active subscribers)');
      } catch {}
      this.lastAggregatedStop = null;
    }
  }

  /**
   * Update profile cache and notify subscribers
   */
  private updateProfileCache(pubkey: string, profileData: any) {
    const cached = this.profileCache[pubkey];
    if (cached) {
      cached.data = profileData;
      cached.timestamp = Date.now();
      
      // Update the store if it exists
      if (cached.subscription) {
        try { cached.subscription.set(profileData); } catch {}
      }

      logger.debug('Profile cache updated', undefined, { 
        pubkey: pubkey.substring(0, 8),
        hasData: !!profileData 
      });
    }
  }

  /**
   * Check if cached profile is still valid
   */
  private isCacheValid(cached: any): boolean {
    return (Date.now() - cached.timestamp) < this.CACHE_TTL;
  }

  /**
   * Start cleanup interval to remove unused profiles
   */
  private startCleanupInterval() {
    this.cleanupInterval = (setInterval(() => {
      this.cleanupUnusedProfiles();
    }, this.CLEANUP_INTERVAL) as unknown as number);
  }

  /**
   * Clean up unused profile subscriptions and old cache entries
   */
  private cleanupUnusedProfiles() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up expired cache entries
    Object.keys(this.profileCache).forEach(pubkey => {
      const cached = this.profileCache[pubkey]!;
      const request = this.activeRequests.get(pubkey);
      
      // Remove if expired and no active subscribers
      if (!request || request.subscribers.size === 0) {
        if ((now - cached.lastRequested) > this.CACHE_TTL * 2) {
          delete this.profileCache[pubkey];
          this.activeRequests.delete(pubkey);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      logger.info('Cleaned up unused profiles', undefined, { count: cleanedCount });
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      cachedProfiles: Object.keys(this.profileCache).length,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.size,
      totalSubscribers: Array.from(this.activeRequests.values())
        .reduce((total, req) => total + req.subscribers.size, 0)
    };
  }

  /**
   * Cleanup on destruction
   */
  destroy() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval as unknown as number);
    }

    // Clear all caches
    this.profileCache = {};
    this.activeRequests.clear();
    this.requestQueue.clear();

    logger.info('ProfileSubscriptionManager destroyed');
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const profileSubscriptionManager = new ProfileSubscriptionManager();

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Initialize the profile manager with NostrUnchained instance
 */
export function initializeProfileManager(nostr: any) {
  profileSubscriptionManager.initialize(nostr);
}

/**
 * Get a reactive profile store with automatic subscription management
 */
export function getProfileStore(pubkey: string, subscriberId: string = 'default') {
  return profileSubscriptionManager.requestProfile(pubkey, subscriberId);
}

/**
 * Unsubscribe from profile updates
 */
export function unsubscribeFromProfile(pubkey: string, subscriberId: string = 'default') {
  profileSubscriptionManager.unsubscribeProfile(pubkey, subscriberId);
}

/**
 * Get profile manager statistics
 */
export function getProfileManagerStats() {
  return profileSubscriptionManager.getStats();
}