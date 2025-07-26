# System Design Analysis Summary - Milestone 2: Subscribe & Query

## Architecture Analysis Context
**Session**: 2  
**Milestone**: 2 - Subscribe & Query Foundation  
**Analysis Date**: 2025-01-20  
**Input**: Requirements specification from @/requirements-agent  

## Architecture Challenge Assessment

### Primary Architecture Challenges

#### AC-1: WebSocket Subscription State Management
**Complexity**: High  
**Problem**: Managing multiple concurrent subscriptions with different lifecycles across multiple relays.

**Key Considerations**:
- Subscription ID collision prevention across relays
- Memory management for long-running subscriptions
- Event deduplication across multiple sources
- Connection state synchronization
- Automatic cleanup on component destruction

#### AC-2: Reactive Store Integration
**Complexity**: Medium-High  
**Problem**: Bridging WebSocket event streams with Svelte reactive patterns efficiently.

**Key Considerations**:
- Real-time update batching for UI performance
- Store composition and derived store support
- Memory-efficient event caching strategies
- Automatic subscription lifecycle management
- Error state propagation to UI layer

#### AC-3: Query Builder Architecture
**Complexity**: Medium  
**Problem**: Designing type-safe, fluent API that compiles to efficient NIP-01 filters.

**Key Considerations**:
- Method chaining with immutable builder pattern
- TypeScript inference for complex filter combinations
- Query optimization for relay performance
- Result aggregation from multiple relays
- Caching strategy for repeated queries

#### AC-4: Multi-Relay Coordination
**Complexity**: High  
**Problem**: Orchestrating subscriptions across multiple relays with different capabilities and response times.

**Key Considerations**:
- Load balancing and relay selection strategies
- Result merging with timestamp-based ordering
- Failure handling and automatic failover
- Relay capability detection (NIP-11)
- Performance monitoring and adaptive routing

## Existing Architecture Integration Analysis

### Current Architecture Strengths (Milestone 1)
✅ **Solid WebSocket Foundation**: RelayManager with connection pooling  
✅ **Robust Event Handling**: EventBuilder with NIP-01 compliance  
✅ **Proven Crypto Integration**: @noble libraries working efficiently  
✅ **Test Infrastructure**: Vitest environment with good coverage patterns  
✅ **Cross-Platform Support**: Browser + Node.js compatibility established  

### Integration Points Required
- **RelayManager Extension**: Add subscription management to existing connection handling
- **Event Processing Pipeline**: Extend current event validation for subscription flows
- **Store Integration**: New reactive layer that complements existing publishing patterns
- **Error Handling Evolution**: Extend current error patterns for subscription scenarios

### Architecture Constraints from M1
- **WebSocket Connection Reuse**: Must leverage existing RelayManager connections
- **Event Structure Compatibility**: Maintain current NostrEvent interface
- **Crypto Pattern Consistency**: Follow established signing and validation patterns
- **Test Pattern Alignment**: Extend current Vitest setup and test organization

## Design Pattern Evaluation

### Pattern 1: Event-Driven Subscription Manager
**Approach**: Central subscription manager with event emitter pattern
```typescript
class SubscriptionManager extends EventEmitter {
  private subscriptions = new Map<string, Subscription>();
  private relayConnections = new Map<string, RelayConnection>();
  
  async subscribe(filters: NostrFilter[]): Promise<Subscription> {
    const id = generateSubscriptionId();
    const subscription = new Subscription(id, filters);
    this.subscriptions.set(id, subscription);
    
    // Emit to all relevant relays
    for (const relay of this.selectRelays(filters)) {
      await this.sendREQ(relay, id, filters);
    }
    
    return subscription;
  }
}
```

**Pros**: Clear separation of concerns, easy testing, familiar pattern  
**Cons**: Additional abstraction layer, potential performance overhead  
**Decision**: ✅ **Recommended** - Aligns with existing patterns and provides good foundation

### Pattern 2: Reactive Store as Primary Interface
**Approach**: Stores handle their own subscription lifecycle
```typescript
class NostrFeedStore implements Readable<NostrEvent[]> {
  private subscription?: Subscription;
  private events = writable<NostrEvent[]>([]);
  
  constructor(private filters: NostrFilter[]) {
    this.initializeSubscription();
  }
  
  private async initializeSubscription() {
    this.subscription = await subscriptionManager.subscribe(this.filters);
    this.subscription.onEvent(event => this.addEvent(event));
  }
}
```

**Pros**: Svelte-native patterns, automatic lifecycle, intuitive API  
**Cons**: Tight coupling, harder to test in isolation  
**Decision**: ✅ **Recommended** - Primary user interface should feel Svelte-native

### Pattern 3: Command Pattern for Query Building
**Approach**: Immutable command objects for filter construction
```typescript
class QueryBuilder {
  constructor(private commands: FilterCommand[] = []) {}
  
  kinds(kinds: number[]): QueryBuilder {
    return new QueryBuilder([...this.commands, new KindsCommand(kinds)]);
  }
  
  execute(): Promise<NostrEvent[]> {
    const filter = this.commands.reduce((f, cmd) => cmd.apply(f), {});
    return subscriptionManager.query(filter);
  }
}
```

**Pros**: Immutable, composable, easy to optimize, good TypeScript support  
**Cons**: Memory overhead for large query chains  
**Decision**: ✅ **Recommended** - Provides excellent developer experience

## Component Architecture Decisions

### Decision D1: Subscription Manager as Central Coordinator
**Rationale**: Need single source of truth for subscription state across multiple relays.

**Architecture**:
```
SubscriptionManager
├── RelaySubscriptionHandler (per relay)
├── EventAggregator (deduplication)
├── SubscriptionRegistry (lifecycle tracking)
└── FilterOptimizer (performance)
```

### Decision D2: Three-Layer Store Architecture
**Rationale**: Separate concerns of data management, reactivity, and UI integration.

**Layers**:
1. **Data Layer**: SubscriptionManager + EventCache
2. **Reactive Layer**: NostrStore implementations
3. **UI Layer**: Svelte component integration

### Decision D3: Plugin-Based Filter System
**Rationale**: Extensible filter system for future NIP support and custom filtering.

**Architecture**:
```
FilterEngine
├── CoreFilters (NIP-01)
├── TagFilters (generic #x support)
├── CustomFilters (extensible)
└── FilterOptimizer
```

### Decision D4: Hierarchical Error Handling
**Rationale**: Different error types require different recovery strategies.

**Error Hierarchy**:
- **Network Errors**: Automatic retry with backoff
- **Protocol Errors**: Log and continue with other relays
- **Validation Errors**: Immediate failure with clear message
- **Resource Errors**: Graceful degradation with cleanup

## Performance Architecture Strategy

### Strategy S1: Event Caching with LRU + Time-Based Eviction
```typescript
class EventCache {
  private cache = new Map<string, CachedEvent>();
  private accessOrder = new Map<string, number>();
  private readonly maxSize = 10000;
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24h
  
  set(event: NostrEvent): void {
    this.evictExpired();
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(event.id, { event, timestamp: Date.now() });
    this.accessOrder.set(event.id, Date.now());
  }
}
```

### Strategy S2: Batched Store Updates
```typescript
class BatchedUpdates {
  private pending = new Set<string>();
  private batchTimeout?: NodeJS.Timeout;
  
  scheduleUpdate(storeId: string): void {
    this.pending.add(storeId);
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushUpdates(), 16); // ~60fps
    }
  }
}
```

### Strategy S3: Intelligent Relay Selection
```typescript
class RelaySelector {
  private relayStats = new Map<string, RelayStats>();
  
  selectOptimalRelays(filter: NostrFilter): string[] {
    return this.relays
      .filter(relay => this.supportsFilter(relay, filter))
      .sort((a, b) => this.calculateScore(a) - this.calculateScore(b))
      .slice(0, this.maxConcurrentRelays);
  }
}
```

## Memory Management Architecture

### Memory Strategy M1: Automatic Cleanup Pipeline
```typescript
class MemoryManager {
  private cleanupInterval = setInterval(() => {
    this.cleanupExpiredEvents();
    this.cleanupDeadSubscriptions();
    this.cleanupUnusedConnections();
  }, 60000); // Every minute
  
  private cleanupExpiredEvents(): void {
    const now = Date.now();
    for (const [id, cached] of this.eventCache) {
      if (now - cached.timestamp > this.maxEventAge) {
        this.eventCache.delete(id);
      }
    }
  }
}
```

### Memory Strategy M2: Reference Counting for Subscriptions
```typescript
class SubscriptionRegistry {
  private refCounts = new Map<string, number>();
  
  addReference(subscriptionId: string): void {
    const current = this.refCounts.get(subscriptionId) || 0;
    this.refCounts.set(subscriptionId, current + 1);
  }
  
  removeReference(subscriptionId: string): void {
    const current = this.refCounts.get(subscriptionId) || 0;
    if (current <= 1) {
      this.closeSubscription(subscriptionId);
      this.refCounts.delete(subscriptionId);
    } else {
      this.refCounts.set(subscriptionId, current - 1);
    }
  }
}
```

## API Design Decisions

### API Design AD1: Fluent Query Builder
**Decision**: Immutable builder pattern with method chaining
```typescript
// Preferred API design
const posts = await nostr.query()
  .kinds([1])
  .authors(['npub1abc...'])
  .since(Date.now() - 86400000)
  .limit(20)
  .execute();
```

**Rationale**: 
- Discoverable through IntelliSense
- Type-safe with excellent TypeScript inference
- Familiar to developers from SQL query builders
- Immutable for predictable behavior

### API Design AD2: Store Factory Pattern
**Decision**: Factory functions for store creation with fluent configuration
```typescript
// Store creation API
const feedStore = createFeed()
  .kinds([1])
  .authors(followedUsers)
  .live(true)
  .maxEvents(1000);

// Alternative for advanced users
const customStore = createSubscription({
  filters: [...],
  options: { live: true, deduplicate: true }
});
```

**Rationale**:
- Clear separation between store creation and usage
- Supports both simple and advanced use cases
- Type-safe configuration with defaults

### API Design AD3: Error Handling Strategy
**Decision**: Explicit error states in stores with recovery actions
```typescript
interface NostrStore<T> extends Readable<T> {
  readonly status: Readable<'connecting' | 'active' | 'error' | 'closed'>;
  readonly error: Readable<NostrError | null>;
  
  // Recovery actions
  retry(): Promise<void>;
  close(): Promise<void>;
}
```

**Rationale**:
- Clear error state communication to UI
- Actionable recovery options
- Consistent with Svelte patterns

## Integration Architecture

### Integration I1: RelayManager Extension Strategy
**Approach**: Extend existing RelayManager without breaking changes
```typescript
// Extended RelayManager interface
interface RelayManager {
  // Existing methods (unchanged)
  publishToAll(event: NostrEvent): Promise<RelayResult[]>;
  
  // New subscription methods
  subscribe(relayUrl: string, filters: NostrFilter[]): Promise<string>;
  unsubscribe(relayUrl: string, subscriptionId: string): Promise<void>;
  onSubscriptionEvent(handler: SubscriptionEventHandler): void;
}
```

### Integration I2: Event Processing Pipeline
**Approach**: Unified event processing for both publishing and subscription
```typescript
class EventProcessor {
  process(event: NostrEvent, source: 'publish' | 'subscription'): ProcessedEvent {
    // Common validation and processing
    const validated = this.validateEvent(event);
    const processed = this.enhanceEvent(validated);
    
    if (source === 'subscription') {
      this.notifySubscribers(processed);
    }
    
    return processed;
  }
}
```

## Technology Integration Decisions

### Technology Decision T1: WebSocket Management
**Decision**: Extend existing WebSocket infrastructure
- Reuse RelayManager connection pooling
- Add subscription message routing
- Maintain current error handling patterns

### Technology Decision T2: TypeScript Architecture
**Decision**: Leverage advanced TypeScript features for type safety
```typescript
// Generic event type system
interface NostrEvent<K extends number = number> {
  kind: K;
  content: K extends 1 ? string : K extends 0 ? string : unknown;
  // ... other fields
}

// Type-safe query building
class QueryBuilder<K extends number = number> {
  kinds<NewK extends number>(kinds: NewK[]): QueryBuilder<NewK>;
  execute(): Promise<NostrEvent<K>[]>;
}
```

### Technology Decision T3: Test Architecture
**Decision**: Extend current Vitest setup with subscription-specific testing
- Mock WebSocket for subscription testing
- Performance benchmarking utilities
- Memory leak detection in tests
- Integration testing with real relay

## Risk Mitigation Architecture

### Risk Mitigation R1: Memory Leak Prevention
- Automatic cleanup intervals
- Reference counting for subscriptions
- WeakMap usage where appropriate
- Memory monitoring in development

### Risk Mitigation R2: Performance Degradation
- Event batching for UI updates
- Lazy loading of historical events
- Intelligent caching strategies
- Performance monitoring hooks

### Risk Mitigation R3: Network Reliability
- Exponential backoff for reconnections
- Graceful degradation with partial relay failures
- Circuit breaker pattern for failing relays
- Connection state monitoring

## Implementation Readiness Assessment

### Ready for Implementation ✅
- Architecture decisions finalized
- Component interfaces defined
- Integration strategy clear
- Performance strategy outlined

### Next Phase Requirements
- Detailed component specifications
- Implementation phase planning
- Test scenario definitions
- Performance benchmark setup

## Architecture Summary

**Core Architecture**: Event-driven subscription manager with three-layer store system
**Key Patterns**: Builder pattern for queries, factory pattern for stores, command pattern for filters
**Performance Strategy**: LRU caching, batched updates, intelligent relay selection
**Integration Approach**: Extend existing RelayManager, unified event processing
**Memory Management**: Automatic cleanup, reference counting, monitoring hooks

The architecture provides a solid foundation for implementing the Subscribe & Query requirements while maintaining compatibility with Milestone 1 and providing excellent developer experience.