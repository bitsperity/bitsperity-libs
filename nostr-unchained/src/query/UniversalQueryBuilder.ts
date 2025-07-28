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
  
  async execute(): Promise<UniversalNostrStore<NostrEvent[]>> {
    // Start subscription if needed
    const filterSig = this.getFilterSignature();
    
    if (!this.hasActiveSubscription(filterSig)) {
      await this.startSubscription();
    }
    
    // Return store that updates from cache
    return new UniversalNostrStore(this.cache, this.filter);
  }
  
  private getFilterSignature(): string {
    return JSON.stringify(this.filter);
  }
  
  private hasActiveSubscription(filterSig: string): boolean {
    // TODO: Implement subscription deduplication
    return false;
  }
  
  private async startSubscription(): Promise<void> {
    const options = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {};
    
    await this.subscriptionManager.subscribe([this.filter], {
      ...options,
      onEvent: (event: NostrEvent) => {
        this.cache.addEvent(event); // All events go to cache
      }
    });
  }
}