# System Architecture - Milestone 2: Subscribe & Query Foundation

## Executive Summary
**Architecture Vision**: Extend the proven publishing foundation (Milestone 1) with a reactive subscription system that provides SQL-like query elegance while maintaining high performance and developer-friendly integration patterns.

**Core Architectural Principle**: Event-driven coordination with three-layer separation of concerns, optimized for Svelte reactive patterns while remaining framework-agnostic at the core.

## High-Level Architecture Overview

### System Context Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    NostrUnchained Library                   │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Svelte Components)                              │
│    ├── Feed Components                                     │
│    ├── Query Components                                    │
│    └── Status Components                                   │
├─────────────────────────────────────────────────────────────┤
│  Reactive Layer (NostrStore System)                        │
│    ├── FeedStore                                          │
│    ├── QueryStore                                         │
│    └── SubscriptionStore                                  │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Subscription Engine)                          │
│    ├── SubscriptionManager                                │
│    ├── QueryBuilder                                       │
│    ├── EventCache                                         │
│    └── FilterEngine                                       │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (from Milestone 1)                  │
│    ├── RelayManager (extended)                            │
│    ├── EventBuilder                                       │
│    ├── SigningProvider                                    │
│    └── ErrorHandler                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                         │
│    ├── Nostr Relays (ws://...)                            │
│    ├── Browser Extensions (NIP-07)                        │
│    └── Local Test Relay (ws://umbrel.local:4848)          │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow
```
User Request (Query/Subscribe)
        │
        ▼
   QueryBuilder
        │
        ▼
  FilterEngine ────► SubscriptionManager
        │                    │
        ▼                    ▼
   EventCache           RelayManager
        │                    │
        ▼                    ▼
   NostrStore           WebSocket Relays
        │                    │
        ▼                    │
Svelte Component ◄───────────┘
```

## Core Component Architecture

### Component C1: SubscriptionManager (Central Coordinator)
**Responsibility**: Orchestrate all subscription lifecycle operations across multiple relays.

```typescript
interface SubscriptionManager {
  // Core subscription operations
  subscribe(filters: NostrFilter[], options?: SubscriptionOptions): Promise<Subscription>;
  unsubscribe(subscriptionId: string): Promise<void>;
  updateFilters(subscriptionId: string, filters: NostrFilter[]): Promise<void>;
  
  // Multi-relay coordination
  getActiveSubscriptions(): Map<string, Subscription>;
  getRelayStats(): Map<string, RelaySubscriptionStats>;
  
  // Event distribution
  onEvent(handler: (event: NostrEvent, subscriptionId: string) => void): void;
  onEOSE(handler: (subscriptionId: string) => void): void;
  onError(handler: (error: SubscriptionError) => void): void;
  
  // Resource management
  cleanup(): Promise<void>;
  getMemoryStats(): MemoryUsageStats;
}

class SubscriptionManager {
  private subscriptions = new Map<string, Subscription>();
  private relaySubscriptions = new Map<string, Map<string, string[]>>(); // relay -> subscription -> filters
  private eventDistributor = new EventDistributor();
  private filterOptimizer = new FilterOptimizer();
  
  constructor(
    private relayManager: RelayManager,
    private eventCache: EventCache,
    private options: SubscriptionManagerOptions = {}
  ) {
    this.setupEventHandling();
  }
  
  async subscribe(filters: NostrFilter[], options: SubscriptionOptions = {}): Promise<Subscription> {
    const subscriptionId = generateSubscriptionId();
    const optimizedFilters = this.filterOptimizer.optimize(filters);
    const selectedRelays = this.selectOptimalRelays(optimizedFilters);
    
    const subscription = new Subscription(subscriptionId, optimizedFilters, options);
    this.subscriptions.set(subscriptionId, subscription);
    
    // Send REQ messages to selected relays
    await this.sendREQToRelays(subscriptionId, optimizedFilters, selectedRelays);
    
    return subscription;
  }
}
```

**Key Features**:
- UUID-based subscription ID generation for collision avoidance
- Intelligent relay selection based on filter characteristics
- Filter optimization for better relay performance
- Event deduplication across multiple relay sources
- Automatic cleanup of orphaned subscriptions

### Component C2: QueryBuilder (Fluent API Interface)
**Responsibility**: Provide intuitive, type-safe API for constructing Nostr event queries.

```typescript
interface QueryBuilder<T extends NostrEvent = NostrEvent> {
  // Filter methods (immutable)
  kinds<K extends number>(kinds: K[]): QueryBuilder<NostrEvent<K>>;
  authors(pubkeys: string[]): QueryBuilder<T>;
  ids(eventIds: string[]): QueryBuilder<T>;
  since(timestamp: number): QueryBuilder<T>;
  until(timestamp: number): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  tags(tagName: string, values: string[]): QueryBuilder<T>;
  
  // Execution methods
  execute(): Promise<T[]>;
  subscribe(): Promise<Subscription>;
  stream(): AsyncIterable<T>;
  
  // Configuration methods
  relays(relayUrls: string[]): QueryBuilder<T>;
  cache(enabled: boolean): QueryBuilder<T>;
  timeout(ms: number): QueryBuilder<T>;
}

class QueryBuilder<T extends NostrEvent = NostrEvent> {
  private filters: Partial<NostrFilter> = {};
  private config: QueryConfig = {};
  
  constructor(
    private subscriptionManager: SubscriptionManager,
    private eventCache: EventCache
  ) {}
  
  kinds<K extends number>(kinds: K[]): QueryBuilder<NostrEvent<K>> {
    return new QueryBuilder<NostrEvent<K>>(
      this.subscriptionManager,
      this.eventCache
    ).withFilters({ ...this.filters, kinds });
  }
  
  async execute(): Promise<T[]> {
    // Check cache first
    if (this.config.cache !== false) {
      const cached = this.eventCache.query(this.filters);
      if (cached.length > 0 && this.isCacheValid(cached)) {
        return cached as T[];
      }
    }
    
    // Create temporary subscription for query
    const subscription = await this.subscriptionManager.subscribe([this.filters as NostrFilter], {
      temporary: true,
      timeout: this.config.timeout || 5000
    });
    
    return new Promise((resolve, reject) => {
      const events: T[] = [];
      const timeout = setTimeout(() => {
        subscription.close();
        resolve(events);
      }, this.config.timeout || 5000);
      
      subscription.onEvent((event) => events.push(event as T));
      subscription.onEOSE(() => {
        clearTimeout(timeout);
        subscription.close();
        resolve(events);
      });
      subscription.onError(reject);
    });
  }
}
```

**Design Principles**:
- Immutable builder pattern for predictable behavior
- TypeScript generics for type-safe event handling
- Method chaining for intuitive API discovery
- Intelligent caching with cache validation
- Temporary subscriptions for one-time queries

### Component C3: NostrStore System (Reactive Layer)
**Responsibility**: Bridge WebSocket event streams with Svelte reactive patterns.

```typescript
interface NostrStore<T = NostrEvent[]> extends Readable<T> {
  // State management
  readonly status: Readable<StoreStatus>;
  readonly error: Readable<NostrError | null>;
  readonly count: Readable<number>;
  
  // Lifecycle management
  close(): Promise<void>;
  refresh(): Promise<void>;
  updateFilter(filters: Partial<NostrFilter>): Promise<void>;
  
  // Store composition
  derive<U>(fn: (value: T) => U): Readable<U>;
}

class FeedStore implements NostrStore<NostrEvent[]> {
  private events = writable<NostrEvent[]>([]);
  private statusStore = writable<StoreStatus>('connecting');
  private errorStore = writable<NostrError | null>(null);
  private countStore = writable<number>(0);
  
  private subscription?: Subscription;
  private eventCache = new Map<string, NostrEvent>();
  
  constructor(
    private filters: NostrFilter[],
    private subscriptionManager: SubscriptionManager,
    private options: FeedStoreOptions = {}
  ) {
    this.initializeSubscription();
  }
  
  // Svelte store interface
  subscribe(run: (value: NostrEvent[]) => void): () => void {
    return this.events.subscribe(run);
  }
  
  private async initializeSubscription(): Promise<void> {
    try {
      this.statusStore.set('connecting');
      
      this.subscription = await this.subscriptionManager.subscribe(this.filters, {
        live: this.options.live !== false,
        deduplicate: this.options.deduplicate !== false
      });
      
      this.subscription.onEvent((event) => this.handleNewEvent(event));
      this.subscription.onEOSE(() => this.statusStore.set('active'));
      this.subscription.onError((error) => this.handleError(error));
      
    } catch (error) {
      this.handleError(error as NostrError);
    }
  }
  
  private handleNewEvent(event: NostrEvent): void {
    if (this.eventCache.has(event.id)) return; // Deduplication
    
    this.eventCache.set(event.id, event);
    
    this.events.update(currentEvents => {
      const newEvents = [...currentEvents, event];
      
      // Apply ordering (newest first)
      newEvents.sort((a, b) => b.created_at - a.created_at);
      
      // Apply limit if specified
      if (this.options.maxEvents) {
        return newEvents.slice(0, this.options.maxEvents);
      }
      
      return newEvents;
    });
    
    this.countStore.update(count => count + 1);
  }
}
```

**Reactive Features**:
- Automatic subscription lifecycle management
- Real-time event updates with efficient batching
- Built-in deduplication and ordering
- Error state management with recovery
- Memory-efficient event caching with limits

### Component C4: EventCache (Performance Layer)
**Responsibility**: Efficient event storage and retrieval with intelligent eviction.

```typescript
interface EventCache {
  // Storage operations
  store(event: NostrEvent): void;
  get(eventId: string): NostrEvent | undefined;
  query(filter: Partial<NostrFilter>): NostrEvent[];
  
  // Management operations
  evict(criteria: EvictionCriteria): number;
  clear(): void;
  getStats(): CacheStats;
  
  // Configuration
  setMaxSize(size: number): void;
  setMaxAge(ageMs: number): void;
}

class EventCache {
  private cache = new Map<string, CachedEvent>();
  private accessOrder = new Map<string, number>();
  private kindIndex = new Map<number, Set<string>>();
  private authorIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  
  private readonly maxSize: number;
  private readonly maxAge: number;
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(options: EventCacheOptions = {}) {
    this.maxSize = options.maxSize || 10000;
    this.maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours
    
    // Automatic cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.performCleanup(), 5 * 60 * 1000);
  }
  
  store(event: NostrEvent): void {
    const now = Date.now();
    
    // Evict if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    // Store event with metadata
    const cached: CachedEvent = {
      event,
      timestamp: now,
      accessCount: 1
    };
    
    this.cache.set(event.id, cached);
    this.accessOrder.set(event.id, now);
    
    // Update indexes for efficient querying
    this.updateIndexes(event);
  }
  
  query(filter: Partial<NostrFilter>): NostrEvent[] {
    const candidates = this.getCandidates(filter);
    const results: NostrEvent[] = [];
    
    for (const eventId of candidates) {
      const cached = this.cache.get(eventId);
      if (cached && this.matchesFilter(cached.event, filter)) {
        results.push(cached.event);
        
        // Update access tracking
        cached.accessCount++;
        this.accessOrder.set(eventId, Date.now());
      }
    }
    
    // Apply sorting and limiting
    results.sort((a, b) => b.created_at - a.created_at);
    
    if (filter.limit) {
      return results.slice(0, filter.limit);
    }
    
    return results;
  }
  
  private getCandidates(filter: Partial<NostrFilter>): Set<string> {
    let candidates: Set<string> | undefined;
    
    // Use indexes for efficient filtering
    if (filter.kinds && filter.kinds.length > 0) {
      candidates = this.intersectSets(
        filter.kinds.map(kind => this.kindIndex.get(kind) || new Set())
      );
    }
    
    if (filter.authors && filter.authors.length > 0) {
      const authorCandidates = this.intersectSets(
        filter.authors.map(author => this.authorIndex.get(author) || new Set())
      );
      candidates = candidates ? this.intersectSets([candidates, authorCandidates]) : authorCandidates;
    }
    
    // If no specific filters, return all events
    return candidates || new Set(this.cache.keys());
  }
}
```

**Performance Features**:
- Multi-dimensional indexing for O(1) lookups
- LRU + time-based eviction strategies
- Intelligent cache warming and preloading
- Memory usage monitoring and reporting
- Automatic cleanup with configurable intervals

## Integration Architecture

### Integration I1: RelayManager Extension
**Strategy**: Extend existing RelayManager without breaking Milestone 1 functionality.

```typescript
// Extended RelayManager interface (backward compatible)
interface ExtendedRelayManager extends RelayManager {
  // New subscription methods
  subscribeToRelay(relayUrl: string, subscriptionId: string, filters: NostrFilter[]): Promise<void>;
  unsubscribeFromRelay(relayUrl: string, subscriptionId: string): Promise<void>;
  
  // Subscription event handling
  onSubscriptionEvent(handler: (relayUrl: string, event: NostrEvent, subscriptionId: string) => void): void;
  onSubscriptionEOSE(handler: (relayUrl: string, subscriptionId: string) => void): void;
  
  // Enhanced connection management
  getSubscriptionStats(relayUrl: string): RelaySubscriptionStats;
}

class RelayManager {
  // Existing methods remain unchanged
  
  // New subscription support
  private subscriptionHandlers = new Map<string, SubscriptionHandler>();
  private pendingSubscriptions = new Map<string, PendingSubscription>();
  
  async subscribeToRelay(relayUrl: string, subscriptionId: string, filters: NostrFilter[]): Promise<void> {
    const connection = this.connections.get(relayUrl);
    if (!connection || connection.state !== 'connected') {
      throw new Error(`Not connected to relay: ${relayUrl}`);
    }
    
    const reqMessage: ClientMessage = ['REQ', subscriptionId, ...filters];
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingSubscriptions.delete(subscriptionId);
        reject(new Error('Subscription timeout'));
      }, this.config.subscriptionTimeout);
      
      this.pendingSubscriptions.set(subscriptionId, { resolve, reject, timeout });
      
      try {
        connection.ws!.send(JSON.stringify(reqMessage));
        if (this.debug) {
          console.log(`📡 Subscribing ${subscriptionId} to ${relayUrl}`, filters);
        }
      } catch (error) {
        clearTimeout(timeout);
        this.pendingSubscriptions.delete(subscriptionId);
        reject(error);
      }
    });
  }
  
  private handleSubscriptionMessage(relayUrl: string, message: RelayMessage): void {
    if (message[0] === 'EVENT') {
      const [, subscriptionId, event] = message;
      this.emitSubscriptionEvent(relayUrl, event, subscriptionId);
    } else if (message[0] === 'EOSE') {
      const [, subscriptionId] = message;
      this.emitSubscriptionEOSE(relayUrl, subscriptionId);
    }
    // Handle other subscription-related messages
  }
}
```

### Integration I2: Unified Event Processing
**Strategy**: Single event processing pipeline for both publishing and subscription flows.

```typescript
class EventProcessor {
  constructor(
    private validator: EventValidator,
    private enhancer: EventEnhancer
  ) {}
  
  processEvent(event: NostrEvent, context: ProcessingContext): ProcessedEvent {
    // Common validation for all events
    const validationResult = this.validator.validate(event);
    if (!validationResult.valid) {
      throw new EventValidationError(validationResult.errors);
    }
    
    // Context-specific processing
    let processed = event;
    
    if (context.source === 'subscription') {
      processed = this.enhancer.enhanceForSubscription(event);
    } else if (context.source === 'publish') {
      processed = this.enhancer.enhanceForPublishing(event);
    }
    
    return {
      event: processed,
      context,
      metadata: {
        processedAt: Date.now(),
        validationScore: validationResult.score
      }
    };
  }
}
```

## Performance Architecture

### Performance Strategy P1: Batched Operations
**Objective**: Optimize UI responsiveness during high-volume event processing.

```typescript
class BatchProcessor {
  private pendingUpdates = new Map<string, PendingUpdate[]>();
  private batchTimeout?: NodeJS.Timeout;
  private readonly batchInterval = 16; // ~60fps
  
  scheduleUpdate(storeId: string, update: PendingUpdate): void {
    if (!this.pendingUpdates.has(storeId)) {
      this.pendingUpdates.set(storeId, []);
    }
    
    this.pendingUpdates.get(storeId)!.push(update);
    
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushUpdates(), this.batchInterval);
    }
  }
  
  private flushUpdates(): void {
    for (const [storeId, updates] of this.pendingUpdates) {
      this.processBatchedUpdates(storeId, updates);
    }
    
    this.pendingUpdates.clear();
    this.batchTimeout = undefined;
  }
}
```

### Performance Strategy P2: Intelligent Relay Selection
**Objective**: Optimize query performance through smart relay routing.

```typescript
class RelaySelector {
  private relayStats = new Map<string, RelayStats>();
  private capabilityCache = new Map<string, RelayCapabilities>();
  
  selectOptimalRelays(filter: NostrFilter, maxRelays: number = 3): string[] {
    const candidates = this.relays.filter(relay => 
      this.supportsFilter(relay, filter) && this.isHealthy(relay)
    );
    
    return candidates
      .sort((a, b) => this.calculateScore(a, filter) - this.calculateScore(b, filter))
      .slice(0, maxRelays);
  }
  
  private calculateScore(relayUrl: string, filter: NostrFilter): number {
    const stats = this.relayStats.get(relayUrl);
    if (!stats) return Infinity;
    
    // Weighted scoring based on multiple factors
    const latencyScore = stats.averageLatency * 0.4;
    const reliabilityScore = (1 - stats.reliability) * 1000 * 0.3;
    const loadScore = stats.currentLoad * 0.2;
    const specificityScore = this.calculateFilterSpecificity(relayUrl, filter) * 0.1;
    
    return latencyScore + reliabilityScore + loadScore + specificityScore;
  }
}
```

## Memory Management Architecture

### Memory Strategy M1: Hierarchical Cleanup
**Objective**: Prevent memory leaks through systematic resource management.

```typescript
class MemoryManager {
  private cleanupTasks = new Map<string, CleanupTask>();
  private memoryMonitor = new MemoryMonitor();
  
  constructor() {
    // Global cleanup interval
    setInterval(() => this.performGlobalCleanup(), 60 * 1000); // Every minute
    
    // Memory pressure handling
    this.memoryMonitor.onPressure(() => this.handleMemoryPressure());
  }
  
  registerCleanupTask(id: string, task: CleanupTask): void {
    this.cleanupTasks.set(id, task);
  }
  
  private async performGlobalCleanup(): Promise<void> {
    const memoryBefore = process.memoryUsage();
    
    // Execute all cleanup tasks
    for (const [id, task] of this.cleanupTasks) {
      try {
        await task.execute();
      } catch (error) {
        console.warn(`Cleanup task ${id} failed:`, error);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const memoryAfter = process.memoryUsage();
    this.reportMemoryDelta(memoryBefore, memoryAfter);
  }
}
```

### Memory Strategy M2: Reference Counting
**Objective**: Automatic resource cleanup when subscriptions are no longer needed.

```typescript
class SubscriptionRegistry {
  private subscriptions = new Map<string, SubscriptionMetadata>();
  private refCounts = new Map<string, number>();
  
  addReference(subscriptionId: string): void {
    const current = this.refCounts.get(subscriptionId) || 0;
    this.refCounts.set(subscriptionId, current + 1);
  }
  
  removeReference(subscriptionId: string): void {
    const current = this.refCounts.get(subscriptionId) || 0;
    
    if (current <= 1) {
      // Last reference - cleanup subscription
      this.cleanupSubscription(subscriptionId);
    } else {
      this.refCounts.set(subscriptionId, current - 1);
    }
  }
  
  private async cleanupSubscription(subscriptionId: string): Promise<void> {
    const metadata = this.subscriptions.get(subscriptionId);
    if (!metadata) return;
    
    // Close relay subscriptions
    await this.closeRelaySubscriptions(subscriptionId, metadata.relays);
    
    // Clean up local state
    this.subscriptions.delete(subscriptionId);
    this.refCounts.delete(subscriptionId);
    
    // Notify cleanup completion
    this.emit('subscriptionCleaned', subscriptionId);
  }
}
```

## Error Handling Architecture

### Error Strategy E1: Hierarchical Error Classification
**Objective**: Different error types require different handling strategies.

```typescript
abstract class NostrError extends Error {
  abstract readonly type: ErrorType;
  abstract readonly retryable: boolean;
  abstract readonly userAction?: string;
}

class NetworkError extends NostrError {
  readonly type = 'network';
  readonly retryable = true;
  readonly userAction = 'Check your internet connection';
}

class ProtocolError extends NostrError {
  readonly type = 'protocol';
  readonly retryable = false;
  readonly userAction = 'This relay may not support the requested operation';
}

class ValidationError extends NostrError {
  readonly type = 'validation';
  readonly retryable = false;
  readonly userAction = 'Check your input parameters';
}

class ResourceError extends NostrError {
  readonly type = 'resource';
  readonly retryable = true;
  readonly userAction = 'Try reducing the scope of your query';
}
```

### Error Strategy E2: Circuit Breaker Pattern
**Objective**: Protect system stability during cascading failures.

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

## Testing Architecture

### Testing Strategy T1: Layered Testing Approach
**Objective**: Comprehensive test coverage across all architectural layers.

```typescript
// Unit Tests: Individual component testing
describe('SubscriptionManager', () => {
  let subscriptionManager: SubscriptionManager;
  let mockRelayManager: jest.Mocked<RelayManager>;
  
  beforeEach(() => {
    mockRelayManager = createMockRelayManager();
    subscriptionManager = new SubscriptionManager(mockRelayManager);
  });
  
  test('should create subscription with unique ID', async () => {
    const filters = [{ kinds: [1] }];
    const subscription = await subscriptionManager.subscribe(filters);
    
    expect(subscription.id).toBeDefined();
    expect(subscription.filters).toEqual(filters);
  });
});

// Integration Tests: Component interaction testing
describe('Query Builder Integration', () => {
  test('should execute query and return events', async () => {
    const query = new QueryBuilder(subscriptionManager, eventCache);
    
    const events = await query
      .kinds([1])
      .authors(['npub1abc...'])
      .limit(10)
      .execute();
    
    expect(events).toHaveLength(10);
    expect(events[0].kind).toBe(1);
  });
});

// End-to-End Tests: Full workflow testing
describe('Subscribe & Query E2E', () => {
  test('should handle real-time subscription workflow', async () => {
    const feedStore = createFeed()
      .kinds([1])
      .authors(['npub1abc...'])
      .live(true);
    
    // Wait for initial events
    await waitForStoreUpdate(feedStore, events => events.length > 0);
    
    const initialEvents = get(feedStore.events);
    expect(initialEvents.length).toBeGreaterThan(0);
    
    // Publish new event and verify real-time update
    await publishTestEvent();
    await waitForStoreUpdate(feedStore, events => events.length > initialEvents.length);
  });
});
```

## Deployment Architecture

### Deployment Strategy D1: Progressive Enhancement
**Objective**: Maintain backward compatibility while adding new capabilities.

```typescript
// Feature detection and graceful degradation
class FeatureDetector {
  static detectCapabilities(): LibraryCapabilities {
    return {
      subscriptions: typeof WebSocket !== 'undefined',
      reactiveStores: typeof window !== 'undefined' && 'writable' in window,
      advancedFiltering: true, // Always available
      multiRelay: typeof Promise.allSettled !== 'undefined'
    };
  }
}

// Adaptive API based on capabilities
export function createNostrUnchained(options: NostrUnchainedOptions = {}): NostrUnchained {
  const capabilities = FeatureDetector.detectCapabilities();
  
  if (capabilities.subscriptions && capabilities.reactiveStores) {
    return new FullNostrUnchained(options);
  } else if (capabilities.subscriptions) {
    return new SubscriptionOnlyNostrUnchained(options);
  } else {
    return new PublishOnlyNostrUnchained(options);
  }
}
```

## Architecture Summary

**Core Design**: Event-driven subscription coordinator with three-layer reactive architecture
**Key Patterns**: Builder pattern, Factory pattern, Observer pattern, Circuit breaker
**Performance Strategy**: Batched updates, intelligent caching, smart relay selection
**Memory Management**: Reference counting, automatic cleanup, memory monitoring
**Error Handling**: Hierarchical classification, circuit breaker protection, graceful degradation
**Integration**: Backward compatible RelayManager extension, unified event processing

The architecture provides a solid foundation for implementing all Milestone 2 requirements while maintaining excellent performance characteristics and developer experience. The design is extensible for future milestones and maintains strict compatibility with the proven Milestone 1 foundation.