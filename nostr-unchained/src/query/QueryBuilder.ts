/**
 * QueryBuilder - Cache lookup with elegant fluent API
 * 
 * Implements the Query/Sub symmetry from the session architecture.
 * Query = immediate cache lookup, Sub = live subscription.
 */

import { FilterBuilder } from './FilterBuilder.js';
import { UniversalEventCache } from '../cache/UniversalEventCache.js';
import { UniversalNostrStore } from '../store/UniversalNostrStore.js';
import type { NostrEvent } from '../core/types.js';

export class QueryBuilder extends FilterBuilder {
  constructor(private cache: UniversalEventCache) {
    super();
  }
  
  execute(): UniversalNostrStore<NostrEvent[]> {
    // Immediate cache lookup
    return new UniversalNostrStore(this.cache, this.filter);
  }
}

/**
 * Subscription handle for managing live subscriptions
 */
export interface SubscriptionHandle {
  id: string;
  store: UniversalNostrStore<NostrEvent[]>;
  stop(): Promise<void>;
  isActive(): boolean;
}

export class SubBuilder extends FilterBuilder {
  private relayUrls: string[] = [];
  
  constructor(
    private cache: UniversalEventCache,
    private subscriptionManager: any // TODO: Type this properly
  ) {
    super();
  }
  
  relay(url: string): this {
    this.relayUrls = [url];
    return this;
  }
  
  relays(urls: string[]): this {
    this.relayUrls = urls;
    return this;
  }
  
  /**
   * Execute the subscription and return a handle for lifecycle control
   * This provides excellent DX for managing subscriptions
   * USES SMART DEDUPLICATION to prevent subscription overload
   */
  async execute(): Promise<SubscriptionHandle> {
    const targetRelays = this.relayUrls.length > 0 ? this.relayUrls : undefined;
    
    // Use smart deduplication through getOrCreateSubscription
    const sharedSub = await this.subscriptionManager.getOrCreateSubscription([this.filter], targetRelays);
    
    // Add listener to shared subscription that feeds cache
    const listenerId = sharedSub.addListener({
      onEvent: (event: NostrEvent) => {
        this.cache.addEvent(event); // All events go to cache
      }
    });
    
    const store = new UniversalNostrStore(this.cache, this.filter);
    
    // Return a handle with excellent DX
    return {
      id: sharedSub.key,
      store,
      stop: async () => {
        sharedSub.removeListener(listenerId);
      },
      isActive: () => {
        return sharedSub.isActive();
      }
    };
  }
}