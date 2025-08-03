/**
 * NostrStore Implementation - Day 3 GREEN Phase
 * 
 * Framework-agnostic reactive store implementation with Svelte store interface compatibility
 * Integrates with QueryBuilder and SubscriptionManager from Days 1-2
 * 
 * Features:
 * - Native Svelte store interface (no Svelte dependency)
 * - Reactive event updates with real-time data flow
 * - Automatic subscription lifecycle management
 * - Store status tracking
 * - Error handling and propagation
 * - Store composition and derived stores
 * - Memory management and cleanup
 */

import type {
  NostrEvent,
  Filter,
  SubscriptionOptions,
  SubscriptionResult,
  NostrError
} from '../core/types.js';
import { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import { QueryBuilder } from '../query/QueryBuilder.js';

// Svelte-compatible store interfaces (no Svelte dependency)
export interface Readable<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface Writable<T> extends Readable<T> {
  set(value: T): void;
  update(fn: (value: T) => T): void;
}

export type StoreStatus = 'connecting' | 'active' | 'error' | 'closed' | 'reconnecting';

export interface NostrStore<T> extends Readable<T> {
  readonly status: Readable<StoreStatus>;
  readonly error: Readable<NostrError | null>;
  readonly loading: Readable<boolean>;
  readonly count: Readable<number>;
  
  close(): Promise<void>;
  refresh(): Promise<void>;
  reset(): void;
  
  updateFilter(filters: Partial<Filter>): Promise<void>;
  updateOptions(options: Partial<SubscriptionOptions>): Promise<void>;
  
  derive<U>(fn: (value: T) => U): Readable<U>;
  
  retry(): Promise<void>;
  clearError(): void;
}

export interface FeedStore extends NostrStore<NostrEvent[]> {
  readonly events: Readable<NostrEvent[]>;
  readonly latest: Readable<NostrEvent | null>;
  readonly hasMore: Readable<boolean>;
  readonly isEmpty: Readable<boolean>;
  
  loadMore(count?: number): Promise<NostrEvent[]>;
  loadNewer(): Promise<NostrEvent[]>;
  loadOlder(): Promise<NostrEvent[]>;
  
  markAsRead(eventId: string): void;
  markAllAsRead(): void;
  removeEvent(eventId: string): void;
  
  filter(predicate: (event: NostrEvent) => boolean): FeedStore;
  sortBy(compareFn: (a: NostrEvent, b: NostrEvent) => number): FeedStore;
  
  getReadStatus(): { read: number; unread: number; total: number };
}

// Internal writable store implementation
export function writable<T>(value: T): Writable<T> {
  const subscribers = new Set<(value: T) => void>();
  let current = value;

  return {
    subscribe(run: (value: T) => void): () => void {
      run(current);
      subscribers.add(run);
      return () => subscribers.delete(run);
    },
    
    set(newValue: T): void {
      current = newValue;
      subscribers.forEach(run => run(current));
    },
    
    update(fn: (value: T) => T): void {
      current = fn(current);
      subscribers.forEach(run => run(current));
    }
  };
}

// Derived store implementation
export function derived<T, U>(
  stores: Readable<T> | Readable<T>[],
  fn: (values: T) => U
): Readable<U> {
  const storeArray = Array.isArray(stores) ? stores : [stores];
  const subscribers = new Set<(value: U) => void>();
  let current: U;
  let initialized = false;
  
  const unsubscribers: (() => void)[] = [];
  
  const update = () => {
    if (storeArray.length === 1) {
      // Single store case
      const unsubscribe = storeArray[0].subscribe(value => {
        const newValue = fn(value);
        if (!initialized || newValue !== current) {
          current = newValue;
          if (initialized) {
            subscribers.forEach(run => run(current));
          }
        }
      });
      if (unsubscribers.length === 0) {
        unsubscribers.push(unsubscribe);
      }
    }
  };

  return {
    subscribe(run: (value: U) => void): () => void {
      if (!initialized) {
        update();
        initialized = true;
      }
      if (current !== undefined) {
        run(current);
      }
      subscribers.add(run);
      
      return () => {
        subscribers.delete(run);
        if (subscribers.size === 0) {
          unsubscribers.forEach(unsub => unsub());
          unsubscribers.length = 0;
          initialized = false;
        }
      };
    }
  };
}

// Add derive method to derived stores for chaining
function createDerivedWithDerive<T>(readable: Readable<T>): Readable<T> & { derive: <U>(fn: (value: T) => U) => Readable<U> } {
  return {
    subscribe: readable.subscribe.bind(readable),
    derive: <U>(fn: (value: T) => U) => derived(readable, fn)
  };
}

// Derived FeedStore that filters/sorts another FeedStore
class DerivedFeedStore implements FeedStore {
  private _events: Readable<NostrEvent[]>;
  private _readIds = new Set<string>();
  private parent: FeedStore;

  constructor(
    parent: FeedStore,
    predicate?: (event: NostrEvent) => boolean,
    comparator?: (a: NostrEvent, b: NostrEvent) => number
  ) {
    this.parent = parent;
    
    // Create derived events store with filtering and sorting
    this._events = derived(parent.events, (events: NostrEvent[]) => {
      let result = events;
      
      // Apply filter predicate if provided
      if (predicate) {
        result = result.filter(predicate);
      }
      
      // Apply sort comparator if provided
      if (comparator) {
        result = [...result].sort(comparator);
      }
      
      return result;
    });
  }

  // Readable interface
  subscribe(run: (value: NostrEvent[]) => void): () => void {
    return this._events.subscribe(run);
  }

  // Store properties (delegate to parent where appropriate)
  get events(): Readable<NostrEvent[]> {
    return this._events;
  }

  get status(): Readable<StoreStatus> {
    return this.parent.status;
  }

  get error(): Readable<NostrError | null> {
    return this.parent.error;
  }

  get loading(): Readable<boolean> {
    return this.parent.loading;
  }

  get count(): Readable<number> {
    return derived(this._events, events => events.length);
  }

  get latest(): Readable<NostrEvent | null> {
    return derived(this._events, events => events[0] || null);
  }

  get hasMore(): Readable<boolean> {
    return this.parent.hasMore;
  }

  get isEmpty(): Readable<boolean> {
    return derived(this._events, events => events.length === 0);
  }

  // Lifecycle methods (delegate to parent)
  async close(): Promise<void> {
    return this.parent.close();
  }

  async refresh(): Promise<void> {
    return this.parent.refresh();
  }

  reset(): void {
    this._readIds.clear();
    return this.parent.reset();
  }

  async updateFilter(filters: Partial<Filter>): Promise<void> {
    return this.parent.updateFilter(filters);
  }

  async updateOptions(options: Partial<SubscriptionOptions>): Promise<void> {
    return this.parent.updateOptions(options);
  }

  derive<U>(fn: (value: NostrEvent[]) => U): Readable<U> {
    return createDerivedWithDerive(derived(this._events, fn));
  }

  async retry(): Promise<void> {
    return this.parent.retry();
  }

  clearError(): void {
    return this.parent.clearError();
  }

  // Feed-specific methods
  async loadMore(count?: number): Promise<NostrEvent[]> {
    return this.parent.loadMore(count);
  }

  async loadNewer(): Promise<NostrEvent[]> {
    return this.parent.loadNewer();
  }

  async loadOlder(): Promise<NostrEvent[]> {
    return this.parent.loadOlder();
  }

  markAsRead(eventId: string): void {
    this._readIds.add(eventId);
  }

  markAllAsRead(): void {
    let currentEvents: NostrEvent[] = [];
    const unsubscribe = this._events.subscribe(events => {
      currentEvents = events;
    });
    unsubscribe();
    
    currentEvents.forEach(event => this._readIds.add(event.id));
  }

  removeEvent(eventId: string): void {
    return this.parent.removeEvent(eventId);
  }

  filter(predicate: (event: NostrEvent) => boolean): FeedStore {
    return new DerivedFeedStore(this, predicate);
  }

  sortBy(compareFn: (a: NostrEvent, b: NostrEvent) => number): FeedStore {
    return new DerivedFeedStore(this, undefined, compareFn);
  }

  getReadStatus(): { read: number; unread: number; total: number } {
    let currentEvents: NostrEvent[] = [];
    const unsubscribe = this._events.subscribe(events => {
      currentEvents = events;
    });
    unsubscribe();
    
    const read = currentEvents.filter(event => this._readIds.has(event.id)).length;
    const total = currentEvents.length;
    const unread = total - read;
    
    return { read, unread, total };
  }
}

// FeedStore implementation
export class FeedStoreImpl implements FeedStore {
  private _events = writable<NostrEvent[]>([]);
  private _status = writable<StoreStatus>('connecting');
  private _error = writable<NostrError | null>(null);
  private _loading = writable<boolean>(false);
  private _count = writable<number>(0);
  private _readIds = new Set<string>();
  
  private subscription?: SubscriptionResult;
  private subscriptionManager: SubscriptionManager;
  private filters: Filter[];
  private options: SubscriptionOptions;
  private maxEvents?: number;
  private isLive: boolean;
  private eventPredicate?: (event: NostrEvent) => boolean;
  private eventComparator?: (a: NostrEvent, b: NostrEvent) => number;

  constructor(
    subscriptionManager: SubscriptionManager,
    filters: Filter[],
    options: SubscriptionOptions = {},
    config: {
      maxEvents?: number;
      live?: boolean;
      predicate?: (event: NostrEvent) => boolean;
      comparator?: (a: NostrEvent, b: NostrEvent) => number;
    } = {}
  ) {
    this.subscriptionManager = subscriptionManager;
    this.filters = filters;
    this.options = options;
    this.maxEvents = config.maxEvents;
    this.isLive = config.live || false;
    this.eventPredicate = config.predicate;
    this.eventComparator = config.comparator;
    
    // Initialize subscription
    this.initializeSubscription();
  }

  // Readable interface
  subscribe(run: (value: NostrEvent[]) => void): () => void {
    return this._events.subscribe(run);
  }

  // Store properties
  get events(): Readable<NostrEvent[]> {
    return this._events;
  }

  get status(): Readable<StoreStatus> {
    return this._status;
  }

  get error(): Readable<NostrError | null> {
    return this._error;
  }

  get loading(): Readable<boolean> {
    return this._loading;
  }

  get count(): Readable<number> {
    return this._count;
  }

  get latest(): Readable<NostrEvent | null> {
    return derived(this._events, events => events[0] || null);
  }

  get hasMore(): Readable<boolean> {
    return derived(this._events, () => true); // Simplified for now
  }

  get isEmpty(): Readable<boolean> {
    return derived(this._events, events => events.length === 0);
  }

  // Lifecycle methods
  async close(): Promise<void> {
    if (this.subscription?.subscription?.cleanup) {
      this.subscription.subscription.cleanup();
    }
    this._status.set('closed');
  }

  async refresh(): Promise<void> {
    this.reset();
    await this.initializeSubscription();
  }

  reset(): void {
    this._events.set([]);
    this._count.set(0);
    this._readIds.clear();
    this._error.set(null);
  }

  async updateFilter(newFilters: Partial<Filter>): Promise<void> {
    // Merge new filters with existing ones
    this.filters = this.filters.map(filter => ({ ...filter, ...newFilters }));
    await this.refresh();
  }

  async updateOptions(newOptions: Partial<SubscriptionOptions>): Promise<void> {
    this.options = { ...this.options, ...newOptions };
    await this.refresh();
  }

  derive<U>(fn: (value: NostrEvent[]) => U): Readable<U> {
    return createDerivedWithDerive(derived(this._events, fn));
  }

  async retry(): Promise<void> {
    this._status.set('reconnecting');
    this._error.set(null);
    await this.initializeSubscription();
  }

  clearError(): void {
    this._error.set(null);
  }

  // Feed-specific methods
  async loadMore(count: number = 10): Promise<NostrEvent[]> {
    // Simplified implementation - would normally adjust filters for pagination
    return [];
  }

  async loadNewer(): Promise<NostrEvent[]> {
    // Simplified implementation
    return [];
  }

  async loadOlder(): Promise<NostrEvent[]> {
    // Simplified implementation
    return [];
  }

  markAsRead(eventId: string): void {
    this._readIds.add(eventId);
  }

  markAllAsRead(): void {
    let currentEvents: NostrEvent[] = [];
    const unsubscribe = this._events.subscribe(events => {
      currentEvents = events;
    });
    unsubscribe();
    
    currentEvents.forEach(event => this._readIds.add(event.id));
  }

  removeEvent(eventId: string): void {
    this._events.update(events => events.filter(event => event.id !== eventId));
    this._count.update(count => count - 1);
  }

  filter(predicate: (event: NostrEvent) => boolean): FeedStore {
    // Create a derived store that filters the parent's events
    const derivedStore = new DerivedFeedStore(this, predicate, this.eventComparator);
    return derivedStore;
  }

  sortBy(compareFn: (a: NostrEvent, b: NostrEvent) => number): FeedStore {
    // Create a derived store that sorts the parent's events
    const derivedStore = new DerivedFeedStore(this, this.eventPredicate, compareFn);
    return derivedStore;
  }

  getReadStatus(): { read: number; unread: number; total: number } {
    let currentEvents: NostrEvent[] = [];
    const unsubscribe = this._events.subscribe(events => {
      currentEvents = events;
    });
    unsubscribe();
    
    const read = currentEvents.filter(event => this._readIds.has(event.id)).length;
    const total = currentEvents.length;
    const unread = total - read;
    
    return { read, unread, total };
  }

  // Test helper - simulate receiving an event
  _testInjectEvent(event: NostrEvent): void {
    this.handleEvent(event);
  }

  // Test helper - simulate EOSE
  _testSimulateEOSE(): void {
    this._status.set('active');
    this._loading.set(false);
  }

  // Test helper - wait for initialization
  async _testWaitForInit(): Promise<void> {
    // Wait for any pending initialization to complete
    let attempts = 0;
    while (!this.subscription && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 10));
      attempts++;
    }
  }

  // Private methods
  private async initializeSubscription(): Promise<void> {
    this._loading.set(true);
    this._status.set('connecting');
    
    try {
      const subscriptionOptions: SubscriptionOptions = {
        ...this.options,
        onEvent: (event: NostrEvent) => {
          this.handleEvent(event);
        },
        onEose: (relay: string) => {
          this._status.set('active');
          this._loading.set(false);
        },
        onClose: (reason?: string) => {
          this._status.set('closed');
        }
      };

      // Use smart deduplication to prevent subscription overload
      const sharedSub = await this.subscriptionManager.getOrCreateSubscription(this.filters);
      const listenerId = sharedSub.addListener({
        onEvent: subscriptionOptions.onEvent,
        onEose: subscriptionOptions.onEose,
        onClose: subscriptionOptions.onClose,
        onError: subscriptionOptions.onError
      });
      
      // Create subscription result compatible with existing code
      this.subscription = {
        success: true,
        subscription: {
          id: sharedSub.key,
          // Add cleanup method
          cleanup: () => sharedSub.removeListener(listenerId)
        },
        relayResults: [],
        error: undefined
      };

      if (!this.subscription.success) {
        this._error.set(this.subscription.error || { 
          message: 'Subscription failed', 
          retryable: true 
        });
        this._status.set('error');
        this._loading.set(false);
      } else {
        // Success - subscription is active, status will be set by EOSE
        this._error.set(null);
      }
    } catch (error) {
      this._error.set({
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
      this._status.set('error');
      this._loading.set(false);
    }
  }

  private handleEvent(event: NostrEvent): void {
    // Apply predicate filter if set
    if (this.eventPredicate && !this.eventPredicate(event)) {
      return;
    }

    this._events.update(events => {
      // Check for duplicates
      if (events.some(e => e.id === event.id)) {
        return events;
      }

      // Add new event
      const newEvents = [...events, event];
      
      // Apply sort if set
      if (this.eventComparator) {
        newEvents.sort(this.eventComparator);
      } else {
        // Default sort by created_at (newest first)
        newEvents.sort((a, b) => b.created_at - a.created_at);
      }
      
      // Apply maxEvents limit
      if (this.maxEvents && newEvents.length > this.maxEvents) {
        return newEvents.slice(0, this.maxEvents);
      }
      
      return newEvents;
    });
    
    this._count.update(count => count + 1);
  }
}

// Builder interface
export interface FeedBuilder {
  kinds(kinds: number[]): FeedBuilder;
  authors(authors: string[]): FeedBuilder;
  since(timestamp: number): FeedBuilder;
  until(timestamp: number): FeedBuilder;
  limit(count: number): FeedBuilder;
  live(enabled: boolean): FeedBuilder;
  maxEvents(count: number): FeedBuilder;
  build(): FeedStore;
}

export class FeedBuilderImpl implements FeedBuilder {
  private filter: Partial<Filter> = {};
  private options: SubscriptionOptions = {};
  private config: {
    maxEvents?: number;
    live?: boolean;
  } = {};

  constructor(private subscriptionManager: SubscriptionManager) {}

  kinds(kinds: number[]): FeedBuilder {
    this.filter.kinds = kinds;
    return this;
  }

  authors(authors: string[]): FeedBuilder {
    this.filter.authors = authors;
    return this;
  }

  since(timestamp: number): FeedBuilder {
    this.filter.since = timestamp;
    return this;
  }

  until(timestamp: number): FeedBuilder {
    this.filter.until = timestamp;
    return this;
  }

  limit(count: number): FeedBuilder {
    this.filter.limit = count;
    return this;
  }

  live(enabled: boolean): FeedBuilder {
    this.config.live = enabled;
    this.options = { ...this.options, live: enabled };
    return this;
  }

  maxEvents(count: number): FeedBuilder {
    this.config.maxEvents = count;
    return this;
  }

  build(): FeedStore {
    const filters: Filter[] = [this.filter as Filter];
    return new FeedStoreImpl(
      this.subscriptionManager,
      filters,
      this.options,
      this.config
    );
  }
}

// Factory functions - to be exported from index
let defaultSubscriptionManager: SubscriptionManager | undefined;

export function setDefaultSubscriptionManager(manager: SubscriptionManager): void {
  defaultSubscriptionManager = manager;
}

export function createFeed(): FeedBuilder {
  if (!defaultSubscriptionManager) {
    throw new Error('Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.');
  }
  return new FeedBuilderImpl(defaultSubscriptionManager);
}

export function createFeedFromQuery(query: QueryBuilder): FeedStore {
  if (!defaultSubscriptionManager) {
    throw new Error('Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.');
  }
  const filters = query.toFilter();
  return new FeedStoreImpl(defaultSubscriptionManager, filters);
}

export function createFeedFromFilter(filter: Filter): FeedStore {
  if (!defaultSubscriptionManager) {
    throw new Error('Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.');
  }
  return new FeedStoreImpl(defaultSubscriptionManager, [filter]);
}