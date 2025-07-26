# API Contracts - Milestone 2: Subscribe & Query Foundation

## Contract Overview
**Purpose**: Define precise interface contracts for all components in the Subscribe & Query system.  
**Scope**: Complete API specifications for Milestone 2 components with TypeScript definitions.  
**Compatibility**: All contracts maintain backward compatibility with Milestone 1 APIs.  

## Core Type Definitions

### Base Types
```typescript
// Enhanced event type with generic kind support
interface NostrEvent<K extends number = number> {
  id: string;
  pubkey: string;
  created_at: number;
  kind: K;
  tags: string[][];
  content: string;
  sig: string;
}

// Subscription filter (NIP-01 compliant)
interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  search?: string;
  [key: `#${string}`]: string[] | undefined;
}

// Subscription options
interface SubscriptionOptions {
  live?: boolean;
  deduplicate?: boolean;
  timeout?: number;
  maxEvents?: number;
  relays?: string[];
  temporary?: boolean;
}

// Store status enumeration
type StoreStatus = 'connecting' | 'active' | 'error' | 'closed' | 'reconnecting';

// Error types
interface NostrError {
  type: 'network' | 'protocol' | 'validation' | 'resource' | 'timeout';
  message: string;
  retryable: boolean;
  userAction?: string;
  originalError?: Error;
}
```

## Contract C1: SubscriptionManager

### Interface Definition
```typescript
interface SubscriptionManager {
  // Core subscription operations
  subscribe(filters: NostrFilter[], options?: SubscriptionOptions): Promise<Subscription>;
  unsubscribe(subscriptionId: string): Promise<void>;
  updateFilters(subscriptionId: string, filters: NostrFilter[]): Promise<void>;
  
  // Subscription querying
  getSubscription(subscriptionId: string): Subscription | undefined;
  getActiveSubscriptions(): Map<string, Subscription>;
  hasActiveSubscriptions(): boolean;
  
  // Event handling
  onEvent(handler: SubscriptionEventHandler): UnsubscribeFunction;
  onEOSE(handler: SubscriptionEOSEHandler): UnsubscribeFunction;
  onError(handler: SubscriptionErrorHandler): UnsubscribeFunction;
  
  // Multi-relay coordination
  getRelayStats(): Map<string, RelaySubscriptionStats>;
  selectOptimalRelays(filters: NostrFilter[]): string[];
  
  // Resource management
  cleanup(): Promise<void>;
  getMemoryStats(): MemoryUsageStats;
  
  // Configuration
  setMaxConcurrentSubscriptions(max: number): void;
  setDefaultTimeout(timeout: number): void;
}

// Event handler types
type SubscriptionEventHandler = (event: NostrEvent, subscriptionId: string, relayUrl: string) => void;
type SubscriptionEOSEHandler = (subscriptionId: string, relayUrl: string) => void;
type SubscriptionErrorHandler = (error: NostrError, subscriptionId: string) => void;
type UnsubscribeFunction = () => void;

// Statistics types
interface RelaySubscriptionStats {
  activeSubscriptions: number;
  totalEvents: number;
  averageLatency: number;
  errorRate: number;
  lastActivity: number;
}

interface MemoryUsageStats {
  subscriptionsCount: number;
  cachedEventsCount: number;
  memoryUsageBytes: number;
  cacheHitRate: number;
}
```

### Usage Contract
```typescript
// Basic subscription
const subscriptionManager = new SubscriptionManager(relayManager, eventCache);

const subscription = await subscriptionManager.subscribe([
  { kinds: [1], authors: ['npub1abc...'], limit: 20 }
], {
  live: true,
  deduplicate: true,
  timeout: 10000
});

// Event handling
const unsubscribeEvents = subscriptionManager.onEvent((event, subscriptionId, relayUrl) => {
  console.log(`Received event ${event.id} from ${relayUrl}`);
});

// Cleanup
await subscriptionManager.cleanup();
unsubscribeEvents();
```

### Error Contracts
```typescript
// Subscription creation errors
class SubscriptionCreationError extends Error {
  constructor(
    message: string,
    public readonly filters: NostrFilter[],
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SubscriptionCreationError';
  }
}

// Relay connection errors
class RelayConnectionError extends Error {
  constructor(
    message: string,
    public readonly relayUrl: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'RelayConnectionError';
  }
}
```

## Contract C2: Subscription

### Interface Definition
```typescript
interface Subscription {
  // Metadata
  readonly id: string;
  readonly filters: NostrFilter[];
  readonly options: SubscriptionOptions;
  readonly createdAt: number;
  readonly status: SubscriptionStatus;
  
  // Event handling
  onEvent(handler: (event: NostrEvent) => void): UnsubscribeFunction;
  onEOSE(handler: () => void): UnsubscribeFunction;
  onError(handler: (error: NostrError) => void): UnsubscribeFunction;
  onStatusChange(handler: (status: SubscriptionStatus) => void): UnsubscribeFunction;
  
  // Lifecycle management
  close(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  updateFilters(filters: NostrFilter[]): Promise<void>;
  
  // State querying
  isActive(): boolean;
  isPaused(): boolean;
  getEventCount(): number;
  getRelayStates(): Map<string, RelaySubscriptionState>;
  
  // Statistics
  getStats(): SubscriptionStats;
}

// Status types
type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'error' | 'closed';

interface RelaySubscriptionState {
  status: 'connecting' | 'active' | 'eose' | 'error' | 'closed';
  eventCount: number;
  lastEvent?: number;
  error?: NostrError;
}

interface SubscriptionStats {
  eventsReceived: number;
  relaysConnected: number;
  averageLatency: number;
  uptime: number;
  errorCount: number;
}
```

### Usage Contract
```typescript
// Subscription lifecycle
const subscription = await subscriptionManager.subscribe([{ kinds: [1] }]);

subscription.onEvent(event => {
  console.log('New event:', event.content);
});

subscription.onEOSE(() => {
  console.log('Historical events loaded');
});

subscription.onError(error => {
  if (error.retryable) {
    console.log('Retrying subscription...');
  } else {
    console.error('Permanent error:', error.message);
  }
});

// Dynamic filter updates
await subscription.updateFilters([
  { kinds: [1, 6], authors: ['npub1abc...'] }
]);

// Cleanup
await subscription.close();
```

## Contract C3: QueryBuilder

### Interface Definition
```typescript
interface QueryBuilder<T extends NostrEvent = NostrEvent> {
  // Filter methods (immutable)
  kinds<K extends number>(kinds: K[]): QueryBuilder<NostrEvent<K>>;
  authors(pubkeys: string[]): QueryBuilder<T>;
  ids(eventIds: string[]): QueryBuilder<T>;
  since(timestamp: number | Date): QueryBuilder<T>;
  until(timestamp: number | Date): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  search(query: string): QueryBuilder<T>;
  tags(tagName: string, values: string[]): QueryBuilder<T>;
  
  // Execution methods
  execute(): Promise<T[]>;
  subscribe(): Promise<Subscription>;
  stream(): AsyncIterable<T>;
  
  // Configuration methods
  relays(relayUrls: string[]): QueryBuilder<T>;
  cache(enabled: boolean): QueryBuilder<T>;
  timeout(ms: number): QueryBuilder<T>;
  maxEvents(count: number): QueryBuilder<T>;
  
  // Utility methods
  toFilter(): NostrFilter;
  clone(): QueryBuilder<T>;
  
  // Composition methods
  union(other: QueryBuilder<T>): QueryBuilder<T>;
  intersect(other: QueryBuilder<T>): QueryBuilder<T>;
}

// Factory function
interface QueryBuilderFactory {
  (): QueryBuilder;
  fromFilter(filter: NostrFilter): QueryBuilder;
  fromTemplate(template: QueryTemplate): QueryBuilder;
}

// Query templates for common patterns
interface QueryTemplate {
  name: string;
  description: string;
  filters: NostrFilter[];
  options?: SubscriptionOptions;
}
```

### Usage Contract
```typescript
// Basic query building
const posts = await query()
  .kinds([1])
  .authors(['npub1abc...'])
  .since(Date.now() - 86400000) // Last 24 hours
  .limit(50)
  .execute();

// Advanced filtering
const bitcoinPosts = await query()
  .kinds([1])
  .tags('t', ['bitcoin', 'nostr'])
  .search('protocol')
  .execute();

// Live subscription
const liveSubscription = await query()
  .kinds([1])
  .authors(followedUsers)
  .since(Date.now())
  .subscribe();

// Streaming interface
for await (const event of query().kinds([1]).stream()) {
  console.log('New event:', event.content);
}

// Query composition
const techPosts = query().kinds([1]).tags('t', ['tech']);
const bitcoinPosts = query().kinds([1]).tags('t', ['bitcoin']);
const combined = techPosts.union(bitcoinPosts);
```

### Error Contracts
```typescript
class QueryExecutionError extends Error {
  constructor(
    message: string,
    public readonly filter: NostrFilter,
    public readonly relayErrors: Map<string, Error>
  ) {
    super(message);
    this.name = 'QueryExecutionError';
  }
}

class FilterValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidFields: string[],
    public readonly filter: Partial<NostrFilter>
  ) {
    super(message);
    this.name = 'FilterValidationError';
  }
}
```

## Contract C4: NostrStore System

### Base Store Interface
```typescript
interface NostrStore<T> extends Readable<T> {
  // State properties
  readonly status: Readable<StoreStatus>;
  readonly error: Readable<NostrError | null>;
  readonly loading: Readable<boolean>;
  readonly count: Readable<number>;
  
  // Lifecycle management
  close(): Promise<void>;
  refresh(): Promise<void>;
  reset(): void;
  
  // Configuration
  updateFilter(filters: Partial<NostrFilter>): Promise<void>;
  updateOptions(options: Partial<SubscriptionOptions>): Promise<void>;
  
  // Store composition
  derive<U>(fn: (value: T) => U): Readable<U>;
  
  // Error recovery
  retry(): Promise<void>;
  clearError(): void;
}
```

### FeedStore Interface
```typescript
interface FeedStore extends NostrStore<NostrEvent[]> {
  // Content properties
  readonly events: Readable<NostrEvent[]>;
  readonly latest: Readable<NostrEvent | null>;
  readonly hasMore: Readable<boolean>;
  readonly isEmpty: Readable<boolean>;
  
  // Feed operations
  loadMore(count?: number): Promise<NostrEvent[]>;
  loadNewer(): Promise<NostrEvent[]>;
  loadOlder(): Promise<NostrEvent[]>;
  
  // Content management
  markAsRead(eventId: string): void;
  markAllAsRead(): void;
  removeEvent(eventId: string): void;
  
  // Filtering
  filter(predicate: (event: NostrEvent) => boolean): FeedStore;
  sortBy(compareFn: (a: NostrEvent, b: NostrEvent) => number): FeedStore;
  
  // Statistics
  getReadStatus(): { read: number; unread: number; total: number };
}

// Factory function
interface FeedStoreFactory {
  (): FeedBuilder;
  fromQuery(query: QueryBuilder): FeedStore;
  fromFilter(filter: NostrFilter): FeedStore;
}
```

### QueryStore Interface
```typescript
interface QueryStore<T extends NostrEvent = NostrEvent> extends NostrStore<T[]> {
  // Query properties
  readonly results: Readable<T[]>;
  readonly hasResults: Readable<boolean>;
  readonly isComplete: Readable<boolean>;
  
  // Query operations
  executeQuery(): Promise<T[]>;
  refineQuery(refinement: Partial<NostrFilter>): Promise<void>;
  
  // Result management
  clearResults(): void;
  addResult(event: T): void;
  removeResult(eventId: string): void;
  
  // Pagination
  loadMore(): Promise<T[]>;
  hasMore(): boolean;
}
```

### Usage Contracts
```typescript
// Feed store usage
const feedStore = createFeed()
  .kinds([1])
  .authors(followedUsers)
  .live(true)
  .maxEvents(100);

// Svelte component usage
$: posts = $feedStore.events;
$: status = $feedStore.status;
$: hasError = $feedStore.error !== null;

// Event handling
feedStore.events.subscribe(events => {
  console.log(`Feed updated: ${events.length} events`);
});

// Query store usage
const queryStore = createQuery()
  .kinds([1])
  .tags('t', ['bitcoin'])
  .limit(50);

await queryStore.executeQuery();

$: results = $queryStore.results;
$: isLoading = $queryStore.loading;
```

## Contract C5: EventCache

### Interface Definition
```typescript
interface EventCache {
  // Storage operations
  store(event: NostrEvent): void;
  storeMany(events: NostrEvent[]): void;
  get(eventId: string): NostrEvent | undefined;
  getMany(eventIds: string[]): NostrEvent[];
  has(eventId: string): boolean;
  
  // Query operations
  query(filter: Partial<NostrFilter>): NostrEvent[];
  queryStream(filter: Partial<NostrFilter>): AsyncIterable<NostrEvent>;
  count(filter?: Partial<NostrFilter>): number;
  
  // Management operations
  evict(criteria: EvictionCriteria): number;
  clear(): void;
  compact(): void;
  
  // Configuration
  setMaxSize(size: number): void;
  setMaxAge(ageMs: number): void;
  setEvictionPolicy(policy: EvictionPolicy): void;
  
  // Statistics
  getStats(): CacheStats;
  getHitRate(): number;
  
  // Events
  onEviction(handler: (events: NostrEvent[]) => void): UnsubscribeFunction;
  onHit(handler: (eventId: string) => void): UnsubscribeFunction;
  onMiss(handler: (eventId: string) => void): UnsubscribeFunction;
}

// Configuration types
interface EvictionCriteria {
  maxAge?: number;
  maxCount?: number;
  kinds?: number[];
  authors?: string[];
}

type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'time-based' | 'hybrid';

interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  memoryUsage: number;
  oldestEvent?: number;
  newestEvent?: number;
}
```

### Usage Contract
```typescript
// Basic cache operations
const cache = new EventCache({
  maxSize: 10000,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  evictionPolicy: 'hybrid'
});

// Store events
cache.store(event);
cache.storeMany(events);

// Query cached events
const recentPosts = cache.query({
  kinds: [1],
  since: Date.now() - 3600000 // Last hour
});

// Monitor cache performance
cache.onEviction(evictedEvents => {
  console.log(`Evicted ${evictedEvents.length} old events`);
});

const stats = cache.getStats();
console.log(`Cache hit rate: ${cache.getHitRate()}%`);
```

## Contract C6: FilterEngine

### Interface Definition
```typescript
interface FilterEngine {
  // Validation
  validate(filter: NostrFilter): FilterValidationResult;
  validateMany(filters: NostrFilter[]): FilterValidationResult[];
  
  // Optimization
  optimize(filter: NostrFilter): NostrFilter;
  optimizeMany(filters: NostrFilter[]): NostrFilter[];
  
  // Composition
  merge(filters: NostrFilter[]): NostrFilter;
  intersect(filterA: NostrFilter, filterB: NostrFilter): NostrFilter;
  union(filterA: NostrFilter, filterB: NostrFilter): NostrFilter;
  
  // Matching
  matches(event: NostrEvent, filter: NostrFilter): boolean;
  matchesAny(event: NostrEvent, filters: NostrFilter[]): boolean;
  
  // Analysis
  analyze(filter: NostrFilter): FilterAnalysis;
  estimateResultSize(filter: NostrFilter): number;
  getSupportedRelays(filter: NostrFilter): string[];
  
  // Utilities
  isEmpty(filter: NostrFilter): boolean;
  isValid(filter: NostrFilter): boolean;
  serialize(filter: NostrFilter): string;
  deserialize(serialized: string): NostrFilter;
}

interface FilterValidationResult {
  valid: boolean;
  errors: FilterValidationError[];
  warnings: FilterValidationWarning[];
  score: number; // 0-100, higher is better
}

interface FilterAnalysis {
  complexity: 'low' | 'medium' | 'high';
  selectivity: number; // 0-1, higher means more selective
  estimatedResults: number;
  relayCompatibility: Map<string, boolean>;
  optimizationSuggestions: string[];
}
```

### Usage Contract
```typescript
const filterEngine = new FilterEngine();

// Validate filter
const result = filterEngine.validate({
  kinds: [1, 6],
  authors: ['npub1abc...'],
  limit: 100
});

if (!result.valid) {
  console.error('Invalid filter:', result.errors);
}

// Optimize filter
const optimized = filterEngine.optimize({
  kinds: [1],
  authors: [...manyAuthors], // Large list
  limit: 1000
});

// Check if event matches filter
const matches = filterEngine.matches(event, filter);

// Analyze filter performance
const analysis = filterEngine.analyze(filter);
console.log(`Filter complexity: ${analysis.complexity}`);
console.log(`Estimated results: ${analysis.estimatedResults}`);
```

## Contract C7: Error Handling

### Error Hierarchy
```typescript
abstract class NostrError extends Error {
  abstract readonly type: ErrorType;
  abstract readonly retryable: boolean;
  readonly timestamp: number = Date.now();
  readonly userAction?: string;
  readonly originalError?: Error;
  
  constructor(message: string, userAction?: string, originalError?: Error) {
    super(message);
    this.userAction = userAction;
    this.originalError = originalError;
  }
  
  abstract toJSON(): ErrorJSON;
}

type ErrorType = 'network' | 'protocol' | 'validation' | 'resource' | 'timeout' | 'auth';

interface ErrorJSON {
  type: ErrorType;
  message: string;
  retryable: boolean;
  timestamp: number;
  userAction?: string;
  stack?: string;
}

// Specific error types
class NetworkError extends NostrError {
  readonly type = 'network';
  readonly retryable = true;
  
  constructor(message: string, public readonly relayUrl?: string) {
    super(message, 'Check your internet connection');
  }
}

class ProtocolError extends NostrError {
  readonly type = 'protocol';
  readonly retryable = false;
  
  constructor(message: string, public readonly protocolVersion?: string) {
    super(message, 'This relay may not support the requested operation');
  }
}

class ValidationError extends NostrError {
  readonly type = 'validation';
  readonly retryable = false;
  
  constructor(message: string, public readonly invalidFields: string[]) {
    super(message, 'Check your input parameters');
  }
}
```

### Error Recovery Interface
```typescript
interface ErrorRecovery {
  // Recovery strategies
  retry(error: NostrError, attempt: number): Promise<boolean>;
  fallback(error: NostrError): Promise<void>;
  escalate(error: NostrError): void;
  
  // Configuration
  setRetryPolicy(policy: RetryPolicy): void;
  setFallbackStrategy(strategy: FallbackStrategy): void;
  
  // Monitoring
  onRecoveryAttempt(handler: (error: NostrError, attempt: number) => void): UnsubscribeFunction;
  onRecoverySuccess(handler: (error: NostrError) => void): UnsubscribeFunction;
  onRecoveryFailure(handler: (error: NostrError) => void): UnsubscribeFunction;
}

interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: ErrorType[];
}

type FallbackStrategy = 'ignore' | 'degrade' | 'alternative' | 'circuit-breaker';
```

## Contract Validation

### Type Safety Validation
```typescript
// Compile-time type checking
function validateTypeContracts() {
  // Query builder type inference
  const query1: QueryBuilder<NostrEvent<1>> = query().kinds([1]);
  const query2: QueryBuilder<NostrEvent<1 | 6>> = query().kinds([1, 6]);
  
  // Store type safety
  const feedStore: FeedStore = createFeed().kinds([1]);
  const events: NostrEvent[] = get(feedStore.events);
  
  // Error type safety
  const error: NetworkError = new NetworkError('Connection failed', 'wss://relay.example.com');
  const retryable: boolean = error.retryable; // true
}
```

### Runtime Validation
```typescript
// Runtime contract validation
function validateRuntimeContracts() {
  // Filter validation
  assert(filterEngine.validate({ kinds: [1] }).valid);
  assert(!filterEngine.validate({ kinds: [-1] }).valid);
  
  // Cache behavior
  cache.store(event);
  assert(cache.has(event.id));
  assert(cache.get(event.id)?.id === event.id);
  
  // Store lifecycle
  const store = createFeed();
  assert(get(store.status) === 'connecting');
  
  // Error handling
  const error = new ValidationError('Invalid filter', ['kinds']);
  assert(!error.retryable);
  assert(error.type === 'validation');
}
```

## Contract Evolution

### Versioning Strategy
```typescript
// Contract versioning for backward compatibility
interface ContractVersion {
  major: number;
  minor: number;
  patch: number;
}

interface VersionedContract<T> {
  version: ContractVersion;
  contract: T;
  deprecated?: boolean;
  migration?: (oldContract: any) => T;
}

// Example: Evolving the NostrFilter interface
interface NostrFilterV1 {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  // ... other fields
}

interface NostrFilterV2 extends NostrFilterV1 {
  search?: string; // New field in v2
  relations?: RelationFilter[]; // New field for future NIP support
}
```

### Contract Testing
```typescript
// Contract testing utilities
describe('API Contracts', () => {
  test('SubscriptionManager contract compliance', () => {
    const manager = new SubscriptionManager(mockRelayManager, mockCache);
    
    // Verify interface compliance
    expect(typeof manager.subscribe).toBe('function');
    expect(typeof manager.unsubscribe).toBe('function');
    expect(typeof manager.getActiveSubscriptions).toBe('function');
  });
  
  test('QueryBuilder contract compliance', () => {
    const builder = query();
    
    // Verify fluent interface
    const result = builder.kinds([1]).authors(['test']).limit(10);
    expect(result).toBeInstanceOf(QueryBuilder);
    
    // Verify immutability
    expect(result).not.toBe(builder);
  });
});
```

These API contracts provide a comprehensive specification for all components in the Subscribe & Query system, ensuring type safety, clear interfaces, and maintainable code architecture.