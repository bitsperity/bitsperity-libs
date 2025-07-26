# Milestone 2 Specification - Subscribe & Query Foundation

## Milestone Overview
**Milestone ID**: M2  
**Name**: Subscribe & Query Foundation  
**Duration**: 2 weeks  
**Dependencies**: Milestone 1 (Basic Publishing) - 71% complete, core functionality working  

## Milestone Objectives

### Primary Objective
Transform nostr-unchained from a publish-only library to a complete publish/subscribe system with SQL-like query capabilities and reactive real-time updates.

### Success Definition
- **Functional**: Complete NIP-01 subscription protocol implementation
- **Performance**: Handle 100+ events/second with <100ms latency
- **Experience**: SQL-like query API that feels natural to developers
- **Integration**: Seamless Svelte reactive store compatibility
- **Quality**: >95% test coverage for all subscription features

## Deliverable Specifications

### D1: Subscription Engine
**Component**: `SubscriptionManager`  
**Location**: `src/subscription/SubscriptionManager.ts`

**Interface Contract**:
```typescript
interface SubscriptionManager {
  // Create new subscription with NIP-01 filters
  subscribe(filters: NostrFilter[], options?: SubscriptionOptions): Promise<Subscription>;
  
  // Get active subscription by ID
  getSubscription(id: string): Subscription | undefined;
  
  // Close specific subscription
  closeSubscription(id: string): Promise<void>;
  
  // Close all subscriptions
  closeAll(): Promise<void>;
  
  // Get subscription statistics
  getStats(): SubscriptionStats;
}

interface Subscription {
  readonly id: string;
  readonly filters: NostrFilter[];
  readonly status: SubscriptionStatus;
  
  // Event handlers
  onEvent(handler: (event: NostrEvent) => void): void;
  onEOSE(handler: () => void): void;
  onError(handler: (error: Error) => void): void;
  
  // Lifecycle management
  close(): Promise<void>;
  updateFilters(filters: NostrFilter[]): Promise<void>;
}
```

**Key Features**:
- UUID-based subscription ID generation
- Complete NIP-01 message flow (REQ/EVENT/EOSE/CLOSE)
- Multiple concurrent subscriptions per relay
- Automatic cleanup and resource management
- Event deduplication and validation

### D2: Query Builder API
**Component**: `QueryBuilder`  
**Location**: `src/query/QueryBuilder.ts`

**Interface Contract**:
```typescript
interface QueryBuilder {
  // Filter by event kinds
  kinds(kinds: number[]): QueryBuilder;
  
  // Filter by author public keys
  authors(pubkeys: string[]): QueryBuilder;
  
  // Filter by event IDs
  ids(eventIds: string[]): QueryBuilder;
  
  // Time-based filtering
  since(timestamp: number): QueryBuilder;
  until(timestamp: number): QueryBuilder;
  
  // Result limiting
  limit(count: number): QueryBuilder;
  
  // Tag-based filtering
  tags(tagName: string, values: string[]): QueryBuilder;
  
  // Execution methods
  execute(): Promise<NostrEvent[]>;
  subscribe(): Promise<Subscription>;
  
  // Multi-relay support
  relays(relayUrls: string[]): QueryBuilder;
}

// Factory function
function query(): QueryBuilder;
```

**Usage Examples**:
```typescript
// Simple query
const posts = await nostr.query()
  .kinds([1])
  .limit(20)
  .execute();

// Advanced filtering
const replies = await nostr.query()
  .kinds([1])
  .tags('e', ['root-event-id'])
  .authors(['npub1abc...'])
  .since(Date.now() - 86400000)
  .execute();

// Live subscription
const subscription = await nostr.query()
  .kinds([1])
  .authors(followedUsers)
  .subscribe();
```

### D3: Reactive Store System
**Component**: `NostrStore`  
**Location**: `src/stores/NostrStore.ts`

**Interface Contract**:
```typescript
interface NostrStore<T = NostrEvent[]> extends Readable<T> {
  // Store state
  readonly status: Readable<StoreStatus>;
  readonly error: Readable<Error | null>;
  readonly count: Readable<number>;
  
  // Lifecycle management
  close(): Promise<void>;
  refresh(): Promise<void>;
  
  // Dynamic filtering
  updateFilter(filters: Partial<NostrFilter>): Promise<void>;
}

interface FeedStore extends NostrStore<NostrEvent[]> {
  readonly events: Readable<NostrEvent[]>;
  readonly latest: Readable<NostrEvent | null>;
  readonly hasMore: Readable<boolean>;
  
  // Feed-specific actions
  loadMore(count?: number): Promise<void>;
  markAsRead(eventId: string): void;
}

// Factory functions
function createFeed(): FeedBuilder;
function createQuery(): QueryBuilder;
```

**Svelte Integration**:
```typescript
// Component usage
<script>
  const feed = createFeed()
    .kinds([1])
    .authors(followedUsers)
    .live(true);
    
  $: posts = $feed.events;
  $: status = $feed.status;
</script>

{#if $status === 'loading'}
  <p>Loading posts...</p>
{:else if $status === 'error'}
  <p>Error: {$feed.error?.message}</p>
{:else}
  {#each $posts as post}
    <PostComponent {post} />
  {/each}
{/if}
```

### D4: Event Filter System
**Component**: `FilterEngine`  
**Location**: `src/filters/FilterEngine.ts`

**Interface Contract**:
```typescript
interface FilterEngine {
  // Validate NIP-01 filter compliance
  validateFilter(filter: NostrFilter): FilterValidationResult;
  
  // Optimize filter for better performance
  optimizeFilter(filter: NostrFilter): NostrFilter;
  
  // Merge multiple filters efficiently
  mergeFilters(filters: NostrFilter[]): NostrFilter[];
  
  // Check if event matches filter
  matchesFilter(event: NostrEvent, filter: NostrFilter): boolean;
  
  // Filter performance analysis
  analyzeFilter(filter: NostrFilter): FilterAnalysis;
}

interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}
```

**Key Features**:
- Complete NIP-01 filter validation
- Performance optimization suggestions
- Client-side event filtering
- Filter composition utilities
- Relay compatibility checking

## Technical Architecture

### Component Integration
```
NostrUnchained
├── RelayManager (from M1)
├── SubscriptionManager (new)
├── QueryBuilder (new)
├── NostrStore (new)
└── FilterEngine (new)

Data Flow:
Query → FilterEngine → SubscriptionManager → RelayManager → WebSocket
                   ↓
               NostrStore → Svelte Component
```

### WebSocket Message Flow
```
Client                 Relay
  |                     |
  |--- REQ message ---->|
  |                     |
  |<-- EVENT messages --|
  |<-- EVENT messages --|
  |<-- EOSE message ----|
  |                     |
  |<-- EVENT messages --| (live updates)
  |                     |
  |--- CLOSE message -->|
  |<-- CLOSED message --|
```

### Memory Management Strategy
```typescript
// Event caching with LRU eviction
class EventCache {
  private maxSize = 10000; // configurable
  private cache = new Map<string, NostrEvent>();
  
  // Automatic cleanup based on age and usage
  private cleanup(): void {
    // Remove events older than 24h
    // Keep most recently accessed events
    // Maintain memory limits
  }
}
```

## Implementation Plan

### Week 1: Core Infrastructure
**Days 1-3: Subscription Engine**
- Implement SubscriptionManager with basic REQ/EVENT/CLOSE flow
- WebSocket integration with existing RelayManager
- Subscription lifecycle management
- Basic event handling and validation

**Days 4-5: Query Builder Foundation**
- Design and implement fluent API interface
- Basic filter construction and validation
- Integration with SubscriptionManager
- Simple query execution

**Day 5: Integration Testing**
- End-to-end subscription workflow testing
- Multi-relay basic functionality
- Performance baseline establishment

### Week 2: Advanced Features & Polish
**Days 6-7: Reactive Stores**
- Svelte store interface implementation
- Real-time update mechanism
- Memory management and caching
- Store lifecycle and cleanup

**Days 8-9: Advanced Query Features**
- Complex filter combinations
- Multi-relay query aggregation
- Performance optimization
- Error handling and recovery

**Days 10: Quality & Testing**
- Comprehensive test suite completion
- Performance tuning and optimization
- Documentation and examples
- Final integration validation

## Test Strategy

### Test Coverage Requirements
- **Unit Tests**: >95% coverage for all new components
- **Integration Tests**: Complete subscription workflows
- **Performance Tests**: Throughput and memory benchmarks
- **Compatibility Tests**: Multiple relay implementations

### Key Test Scenarios
```typescript
describe('Subscription Engine', () => {
  test('handles 100+ events/second without memory leaks');
  test('properly manages multiple concurrent subscriptions');
  test('recovers gracefully from relay disconnections');
  test('validates all NIP-01 filter combinations');
});

describe('Query Builder', () => {
  test('constructs valid NIP-01 filters from fluent API');
  test('optimizes filters for better relay performance');
  test('aggregates results from multiple relays correctly');
  test('handles complex filter combinations');
});

describe('Reactive Stores', () => {
  test('provides real-time updates in Svelte components');
  test('manages memory efficiently with large event sets');
  test('automatically cleans up subscriptions on destroy');
  test('supports derived stores and composition');
});
```

### Performance Benchmarks
```typescript
// Performance requirements to validate
const benchmarks = {
  eventThroughput: 100, // events/second
  updateLatency: 100,   // milliseconds
  memoryPerEvent: 5,    // KB per cached event
  subscriptionStartup: 500, // milliseconds
  queryResponse: 2000   // milliseconds for 1000 events
};
```

## Quality Gates

### Gate 1: Core Functionality (End of Day 5)
- [ ] Basic subscription engine working
- [ ] Query builder API functional
- [ ] Integration with existing RelayManager
- [ ] Local relay testing successful
- [ ] Basic test coverage >80%

### Gate 2: Advanced Features (End of Day 9)
- [ ] Reactive stores implemented
- [ ] Multi-relay support working
- [ ] Performance benchmarks met
- [ ] Error handling comprehensive
- [ ] Test coverage >90%

### Gate 3: Production Ready (End of Day 10)
- [ ] All requirements implemented
- [ ] Test coverage >95%
- [ ] Performance targets achieved
- [ ] Documentation complete
- [ ] Integration tests passing

## Success Metrics

### Functional Metrics
- **API Completeness**: All planned interfaces implemented
- **NIP-01 Compliance**: Full protocol support validated
- **Multi-Relay Support**: Concurrent subscription management
- **Real-Time Updates**: Live event streaming working

### Performance Metrics
- **Throughput**: 100+ events/second sustained
- **Latency**: <100ms event-to-UI updates
- **Memory**: <5MB per 1000 cached events
- **Startup**: <500ms subscription establishment

### Quality Metrics
- **Test Coverage**: >95% for all subscription features
- **Memory Stability**: No leaks in 24+ hour tests
- **Error Recovery**: Graceful handling of all failure modes
- **API Usability**: Intuitive developer experience

## Risk Mitigation

### Technical Risks
- **WebSocket Complexity**: Incremental implementation with thorough testing
- **Memory Management**: Continuous monitoring and automated cleanup
- **Performance Issues**: Early benchmarking and optimization
- **Multi-Relay Coordination**: Robust error handling and fallback strategies

### Timeline Risks
- **Scope Creep**: Strict adherence to defined deliverables
- **Integration Issues**: Early integration testing with M1 foundation
- **Performance Optimization**: Dedicated time allocation for tuning
- **Test Coverage**: Parallel test development with implementation

## Dependencies & Assumptions

### Critical Dependencies
- **Milestone 1 Stability**: Publishing foundation must remain stable
- **RelayManager Reliability**: WebSocket infrastructure working correctly
- **Test Infrastructure**: Vitest environment operational
- **Local Relay Access**: `ws://umbrel.local:4848` available for testing

### Key Assumptions
- **Relay Behavior**: Standard NIP-01 compliance across test relays
- **Network Conditions**: Reasonable latency and stability for testing
- **Resource Availability**: Sufficient development time for optimization
- **Framework Compatibility**: Svelte store patterns remain stable

## Deliverable Acceptance Criteria

### Minimum Viable Product (MVP)
- [ ] Basic subscription engine with REQ/EVENT/EOSE/CLOSE flow
- [ ] Query builder with all NIP-01 filter types
- [ ] Reactive stores with real-time updates
- [ ] Multi-relay subscription support
- [ ] Performance targets met (100 events/second)

### Complete Implementation
- [ ] All functional requirements implemented
- [ ] Comprehensive error handling and recovery
- [ ] Full Svelte integration with lifecycle management
- [ ] Performance optimization and memory management
- [ ] Complete test coverage and documentation

### Production Readiness
- [ ] Security audit passed
- [ ] Memory leak testing completed
- [ ] Cross-platform compatibility validated
- [ ] API documentation complete with examples
- [ ] Community feedback incorporated