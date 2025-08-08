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
  
  /**
   * Transform the store data with a mapping function
   * Returns a new store with transformed data
   */
  map<U>(transform: (data: T) => U): UniversalNostrStore<U> {
    const mappedStore = new MappedUniversalNostrStore<T, U>(this, transform);
    return mappedStore as any; // Type assertion for interface compatibility
  }
  
  private updateData(): void {
    this._data = this.cache.query(this.filter) as T;
    this.notifySubscribers();
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this._data));
  }
  
  private matchesFilter(event: NostrEvent, filter: Filter): boolean {
    // Check if event matches our filter criteria
    if (filter.kinds && !filter.kinds.includes(event.kind)) {
      return false;
    }
    
    if (filter.authors && !filter.authors.includes(event.pubkey)) {
      return false;
    }
    
    if (filter.ids && !filter.ids.includes(event.id)) {
      return false;
    }
    
    // CRITICAL FIX: Add tag filter matching
    // This is essential for Gift Wrap events that use 'p' tags for recipients
    if (filter['#p'] && filter['#p'].length > 0) {
      const pTags = event.tags.filter(tag => tag[0] === 'p').map(tag => tag[1]);
      if (!filter['#p'].some(filterValue => pTags.includes(filterValue))) {
        return false;
      }
    }
    
    if (filter['#e'] && filter['#e'].length > 0) {
      const eTags = event.tags.filter(tag => tag[0] === 'e').map(tag => tag[1]);
      if (!filter['#e'].some(filterValue => eTags.includes(filterValue))) {
        return false;
      }
    }
    
    if (filter['#t'] && filter['#t'].length > 0) {
      const tTags = event.tags.filter(tag => tag[0] === 't').map(tag => tag[1]);
      if (!filter['#t'].some(filterValue => tTags.includes(filterValue))) {
        return false;
      }
    }
    
    // Add support for any generic tag filter (e.g., #subject, #d, etc.)
    for (const key of Object.keys(filter)) {
      if (key.startsWith('#') && key.length > 1 && !['#p', '#e', '#t'].includes(key)) {
        const tagName = key.slice(1); // Remove the '#' prefix
        const filterValues = filter[key];
        if (filterValues && filterValues.length > 0) {
          const eventTags = event.tags.filter(tag => tag[0] === tagName).map(tag => tag[1]);
          if (!filterValues.some(filterValue => eventTags.includes(filterValue))) {
            return false;
          }
        }
      }
    }
    
    // TODO: Add since/until timestamp filtering if needed
    
    return true;
  }
}

/**
 * Mapped store that transforms data from a source store
 */
class MappedUniversalNostrStore<TSource, TTarget> implements Readable<TTarget> {
  private _data: TTarget;
  private subscribers = new Set<Subscriber<TTarget>>();
  private sourceUnsubscriber?: Unsubscriber;
  
  constructor(
    private sourceStore: UniversalNostrStore<TSource>,
    private transform: (data: TSource) => TTarget
  ) {
    // Get initial transformed data
    this._data = this.safeTransform(this.sourceStore.current, this._data);
    
    // Subscribe to source store changes
    this.sourceUnsubscriber = this.sourceStore.subscribe((sourceData) => {
      const newData = this.safeTransform(sourceData, this._data);
      if (this._data !== newData) { // Simple reference equality check
        this._data = newData;
        this.notifySubscribers();
      }
    });
  }
  
  // Svelte store interface
  subscribe(run: Subscriber<TTarget>, invalidate?: () => void): Unsubscriber {
    run(this._data); // Call immediately with current data
    this.subscribers.add(run);
    
    return () => {
      this.subscribers.delete(run);
      if (this.subscribers.size === 0 && this.sourceUnsubscriber) {
        this.sourceUnsubscriber();
      }
    };
  }
  
  get current(): TTarget {
    return this._data;
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this._data));
  }

  private safeTransform(sourceData: TSource, fallback: TTarget): TTarget {
    try {
      return this.transform(sourceData);
    } catch (error) {
      // Swallow mapping errors to protect UI; keep previous data
      // Optionally: console.warn('Store map() error', error)
      return fallback;
    }
  }
}