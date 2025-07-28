/**
 * UniversalNostrStore - Unified Store for Cache and Subscription Data
 * 
 * Implements the elegant architecture from the session plan:
 * - Works with UniversalEventCache for immediate + reactive data
 * - Svelte store interface compatibility
 * - Handles both query (cache) and sub (live) patterns
 */

import type { NostrEvent, Filter } from '../core/types.js';
import { UniversalEventCache } from '../cache/UniversalEventCache.js';

type Subscriber<T> = (value: T) => void;
type Unsubscriber = () => void;

export interface Readable<T> {
  subscribe(run: Subscriber<T>, invalidate?: () => void): Unsubscriber;
}

export class UniversalNostrStore<T = NostrEvent[]> implements Readable<T> {
  private cache: UniversalEventCache;
  private filter: Filter;
  private _data: T;
  private subscribers = new Set<Subscriber<T>>();
  private unsubscribeCache?: () => void;
  
  constructor(cache: UniversalEventCache, filter: Filter) {
    this.cache = cache;
    this.filter = filter;
    
    // Get immediate data from cache
    this._data = this.cache.query(filter) as T;
    
    // Subscribe to future updates
    this.unsubscribeCache = this.cache.subscribe((event) => {
      if (this.matchesFilter(event, filter)) {
        this.updateData();
      }
    });
  }
  
  // Svelte store interface
  subscribe(run: Subscriber<T>, invalidate?: () => void): Unsubscriber {
    run(this._data); // Call immediately with current data
    this.subscribers.add(run);
    
    return () => {
      this.subscribers.delete(run);
      if (this.subscribers.size === 0 && this.unsubscribeCache) {
        this.unsubscribeCache();
      }
    };
  }
  
  get current(): T {
    return this._data;
  }
  
  private updateData(): void {
    this._data = this.cache.query(this.filter) as T;
    this.notifySubscribers();
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this._data));
  }
  
  private matchesFilter(event: NostrEvent, filter: Filter): boolean {
    // Quick check - if cache would include it in query results, we should update
    const matched = this.cache.query({ ...filter, ids: [event.id] });
    return matched.length > 0;
  }
}