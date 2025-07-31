/**
 * UniversalQueryBuilder - Cache lookup with elegant fluent API
 * 
 * Implements the Query/Sub symmetry from the session architecture.
 * Query = immediate cache lookup, Sub = live subscription.
 */

import { FilterBuilder } from './FilterBuilder.js';
import { UniversalEventCache } from '../cache/UniversalEventCache.js';
import { UniversalNostrStore } from '../store/UniversalNostrStore.js';
import type { NostrEvent } from '../core/types.js';

export class UniversalQueryBuilder extends FilterBuilder {
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

export class UniversalSubBuilder extends FilterBuilder {
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
   */
  async execute(): Promise<SubscriptionHandle> {
    const options = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {};
    
    // Start the subscription
    const result = await this.subscriptionManager.subscribe([this.filter], {
      ...options,
      onEvent: (event: NostrEvent) => {
        this.cache.addEvent(event); // All events go to cache
      }
    });
    
    if (!result.success || !result.subscription) {
      throw new Error(result.error?.message || 'Subscription failed');
    }
    
    const subscription = result.subscription;
    const store = new UniversalNostrStore(this.cache, this.filter);
    
    // Return a handle with excellent DX
    return {
      id: subscription.id,
      store,
      stop: async () => {
        await this.subscriptionManager.close(subscription.id);
      },
      isActive: () => {
        const activeSubs = this.subscriptionManager.getActiveSubscriptions();
        return activeSubs.some((sub: any) => sub.id === subscription.id);
      }
    };
  }
}