# Phase Preparation - Milestone 2: Subscribe & Query Implementation

## Implementation Preparation Overview
**Purpose**: Prepare detailed implementation roadmap for Subscribe & Query Foundation  
**Methodology**: Test-Driven Development with structured phase gates  
**Timeline**: 10-day implementation cycle with clear milestones  

## Pre-Implementation Setup

### Development Environment Preparation
```bash
# TDD Environment Setup
npm install --save-dev \
  @types/jest \
  jest-websocket-mock \
  @vitest/spy \
  fake-timers

# Performance Testing Setup  
npm install --save-dev \
  clinic \
  autocannon \
  @vitest/benchmark

# Memory Testing Setup
npm install --save-dev \
  heapdump \
  memwatch-next
```

### Test Infrastructure Preparation
```typescript
// Mock infrastructure for TDD
interface TestInfrastructure {
  webSocketMock: {
    mockImplementation: 'jest-websocket-mock enhanced',
    capabilities: ['Realistic message timing', 'Connection simulation', 'Error injection'],
    setup: './test/mocks/MockWebSocket.ts'
  },
  
  relayMock: {
    mockImplementation: 'Custom relay simulator',
    capabilities: ['NIP-01 compliance', 'Event generation', 'Failure scenarios'],
    setup: './test/mocks/MockRelay.ts'
  },
  
  performanceMonitoring: {
    implementation: 'Built-in performance measurement',
    capabilities: ['Memory tracking', 'Timing measurement', 'Throughput monitoring'],
    setup: './test/utils/PerformanceMonitor.ts'
  }
}

// Test data generators
class TestDataGenerator {
  generateEvent(overrides?: Partial<NostrEvent>): NostrEvent {
    return {
      id: generateHex(64),
      pubkey: generateHex(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [],
      content: `Test event ${Date.now()}`,
      sig: generateHex(128),
      ...overrides
    };
  }
  
  generateEventStream(count: number, interval: number = 100): AsyncIterable<NostrEvent> {
    // Generate realistic event streams for testing
  }
  
  generateFilterCombinations(): NostrFilter[] {
    // Generate comprehensive filter test cases
  }
}
```

### Performance Baseline Establishment
```typescript
// Performance baseline measurement
describe('Performance Baseline', () => {
  test('establish subscription creation baseline', async () => {
    const times: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      const subscription = await mockSubscriptionManager.subscribe([{ kinds: [1] }]);
      const end = performance.now();
      
      times.push(end - start);
      await subscription.close();
    }
    
    const average = times.reduce((a, b) => a + b) / times.length;
    const p95 = times.sort()[Math.floor(times.length * 0.95)];
    
    console.log(`Baseline - Average: ${average}ms, P95: ${p95}ms`);
    
    // Set performance expectations based on baseline
    expect(average).toBeLessThan(50); // Aggressive target
    expect(p95).toBeLessThan(100);
  });
});
```

## Phase 1: Foundation Implementation (Days 1-3)

### Day 1: SubscriptionManager TDD Foundation
```typescript
// RED Phase: Comprehensive test design
describe('SubscriptionManager Foundation - RED Phase', () => {
  test('should create subscription with unique ID', async () => {
    const manager = new SubscriptionManager(mockRelayManager, mockCache);
    const subscription = await manager.subscribe([{ kinds: [1] }]);
    
    expect(subscription.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(subscription.filters).toEqual([{ kinds: [1] }]);
    expect(subscription.status).toBe('active');
  });
  
  test('should handle multiple concurrent subscriptions', async () => {
    const subscriptions = await Promise.all([
      manager.subscribe([{ kinds: [1] }]),
      manager.subscribe([{ kinds: [2] }]),
      manager.subscribe([{ kinds: [3] }])
    ]);
    
    expect(subscriptions.length).toBe(3);
    expect(new Set(subscriptions.map(s => s.id)).size).toBe(3);
  });
  
  test('should route events to correct subscriptions', async () => {
    const events1: NostrEvent[] = [];
    const events2: NostrEvent[] = [];
    
    const sub1 = await manager.subscribe([{ kinds: [1] }]);
    const sub2 = await manager.subscribe([{ kinds: [2] }]);
    
    sub1.onEvent(event => events1.push(event));
    sub2.onEvent(event => events2.push(event));
    
    // Simulate events
    manager.handleRelayEvent('test-relay', generateEvent({ kind: 1 }), sub1.id);
    manager.handleRelayEvent('test-relay', generateEvent({ kind: 2 }), sub2.id);
    
    expect(events1.length).toBe(1);
    expect(events2.length).toBe(1);
    expect(events1[0].kind).toBe(1);
    expect(events2[0].kind).toBe(2);
  });
});

// GREEN Phase: Minimal implementation
class SubscriptionManager {
  private subscriptions = new Map<string, Subscription>();
  
  constructor(
    private relayManager: RelayManager,
    private eventCache: EventCache
  ) {}
  
  async subscribe(filters: NostrFilter[]): Promise<Subscription> {
    const id = crypto.randomUUID();
    const subscription = new Subscription(id, filters);
    this.subscriptions.set(id, subscription);
    
    // Minimal REQ message sending
    await this.sendREQToRelays(id, filters);
    
    return subscription;
  }
  
  private async sendREQToRelays(subscriptionId: string, filters: NostrFilter[]): Promise<void> {
    // Simplified implementation for GREEN phase
    for (const relayUrl of this.relayManager.connectedRelays) {
      await this.relayManager.send(relayUrl, ['REQ', subscriptionId, ...filters]);
    }
  }
}

// REFACTOR Phase: Add multi-relay coordination and optimization
```

### Day 2: QueryBuilder TDD Implementation
```typescript
// RED Phase: Query builder API tests
describe('QueryBuilder Foundation - RED Phase', () => {
  test('should support method chaining immutably', () => {
    const builder1 = query();
    const builder2 = builder1.kinds([1]);
    const builder3 = builder2.authors(['npub123']);
    
    expect(builder1).not.toBe(builder2);
    expect(builder2).not.toBe(builder3);
    
    expect(builder1.toFilter()).toEqual({});
    expect(builder2.toFilter()).toEqual({ kinds: [1] });
    expect(builder3.toFilter()).toEqual({ kinds: [1], authors: ['npub123'] });
  });
  
  test('should compile to valid NIP-01 filters', () => {
    const filter = query()
      .kinds([1, 6])
      .authors(['npub123', 'npub456'])
      .since(1640995200)
      .limit(50)
      .toFilter();
    
    expect(filter).toEqual({
      kinds: [1, 6],
      authors: ['npub123', 'npub456'],
      since: 1640995200,
      limit: 50
    });
  });
  
  test('should execute queries through subscription manager', async () => {
    const mockSubscription = createMockSubscription();
    mockSubscriptionManager.subscribe.mockResolvedValue(mockSubscription);
    
    const events = await query()
      .kinds([1])
      .limit(10)
      .execute();
    
    expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith([{
      kinds: [1],
      limit: 10
    }]);
    
    expect(events).toBeDefined();
  });
});

// GREEN Phase: Basic builder implementation
class QueryBuilder<T extends NostrEvent = NostrEvent> {
  private filter: Partial<NostrFilter> = {};
  
  constructor(
    private subscriptionManager: SubscriptionManager,
    filter: Partial<NostrFilter> = {}
  ) {
    this.filter = { ...filter };
  }
  
  kinds<K extends number>(kinds: K[]): QueryBuilder<NostrEvent<K>> {
    return new QueryBuilder<NostrEvent<K>>(
      this.subscriptionManager,
      { ...this.filter, kinds }
    );
  }
  
  authors(authors: string[]): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.subscriptionManager,
      { ...this.filter, authors }
    );
  }
  
  async execute(): Promise<T[]> {
    const subscription = await this.subscriptionManager.subscribe([this.filter as NostrFilter]);
    
    // Simplified execution for GREEN phase
    return new Promise((resolve) => {
      const events: T[] = [];
      subscription.onEvent(event => events.push(event as T));
      subscription.onEOSE(() => {
        subscription.close();
        resolve(events);
      });
    });
  }
  
  toFilter(): NostrFilter {
    return this.filter as NostrFilter;
  }
}
```

### Day 3: NostrStore TDD Foundation
```typescript
// RED Phase: Reactive store tests
describe('NostrStore Foundation - RED Phase', () => {
  test('should implement Svelte store interface', () => {
    const store = createFeed().kinds([1]);
    
    expect(typeof store.subscribe).toBe('function');
    expect(typeof store.status.subscribe).toBe('function');
    expect(typeof store.error.subscribe).toBe('function');
  });
  
  test('should provide real-time event updates', async () => {
    const store = createFeed().kinds([1]);
    const events: NostrEvent[] = [];
    
    store.events.subscribe(eventList => {
      events.push(...eventList);
    });
    
    // Simulate incoming events
    store.handleEvent(generateEvent({ kind: 1 }));
    store.handleEvent(generateEvent({ kind: 1 }));
    
    expect(events.length).toBe(2);
  });
  
  test('should automatically manage subscription lifecycle', async () => {
    const mockSubscription = createMockSubscription();
    mockSubscriptionManager.subscribe.mockResolvedValue(mockSubscription);
    
    const store = createFeed().kinds([1]);
    
    // Verify subscription created
    expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith([{ kinds: [1] }]);
    
    // Verify cleanup on close
    await store.close();
    expect(mockSubscription.close).toHaveBeenCalled();
  });
});

// GREEN Phase: Basic store implementation  
class FeedStore implements NostrStore<NostrEvent[]> {
  private eventsStore = writable<NostrEvent[]>([]);
  private statusStore = writable<StoreStatus>('connecting');
  private errorStore = writable<NostrError | null>(null);
  
  private subscription?: Subscription;
  
  constructor(
    private filters: NostrFilter[],
    private subscriptionManager: SubscriptionManager
  ) {
    this.initializeSubscription();
  }
  
  // Svelte store interface
  subscribe(run: (value: NostrEvent[]) => void): () => void {
    return this.eventsStore.subscribe(run);
  }
  
  get events() { return this.eventsStore; }
  get status() { return this.statusStore; }
  get error() { return this.errorStore; }
  
  private async initializeSubscription(): Promise<void> {
    try {
      this.subscription = await this.subscriptionManager.subscribe(this.filters);
      
      this.subscription.onEvent(event => this.handleEvent(event));
      this.subscription.onEOSE(() => this.statusStore.set('active'));
      this.subscription.onError(error => this.errorStore.set(error));
      
    } catch (error) {
      this.errorStore.set(error as NostrError);
      this.statusStore.set('error');
    }
  }
  
  handleEvent(event: NostrEvent): void {
    this.eventsStore.update(events => [...events, event]);
  }
  
  async close(): Promise<void> {
    if (this.subscription) {
      await this.subscription.close();
    }
    this.statusStore.set('closed');
  }
}
```

## Phase 2: Integration Implementation (Days 4-6)

### Day 4-5: Multi-Relay Coordination
```typescript
// Advanced subscription management with multiple relays
describe('Multi-Relay Coordination - Integration Phase', () => {
  test('should coordinate subscriptions across multiple relays', async () => {
    const relays = ['ws://relay1.com', 'ws://relay2.com', 'ws://relay3.com'];
    const manager = new SubscriptionManager(mockRelayManager, mockCache);
    
    mockRelayManager.connectedRelays = relays;
    
    const subscription = await manager.subscribe([{ kinds: [1] }]);
    
    // Verify REQ sent to all relays
    expect(mockRelayManager.send).toHaveBeenCalledTimes(3);
    relays.forEach(relay => {
      expect(mockRelayManager.send).toHaveBeenCalledWith(
        relay, 
        ['REQ', subscription.id, { kinds: [1] }]
      );
    });
  });
  
  test('should deduplicate events across relays', async () => {
    const duplicateEvent = generateEvent({ id: 'duplicate-id' });
    const subscription = await manager.subscribe([{ kinds: [1] }]);
    
    const receivedEvents: NostrEvent[] = [];
    subscription.onEvent(event => receivedEvents.push(event));
    
    // Same event from multiple relays
    manager.handleRelayEvent('relay1', duplicateEvent, subscription.id);
    manager.handleRelayEvent('relay2', duplicateEvent, subscription.id);
    manager.handleRelayEvent('relay3', duplicateEvent, subscription.id);
    
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].id).toBe('duplicate-id');
  });
  
  test('should handle partial relay failures gracefully', async () => {
    const subscription = await manager.subscribe([{ kinds: [1] }]);
    
    // Simulate relay failure
    manager.handleRelayError('relay1', new Error('Connection lost'), subscription.id);
    
    // Should continue working with other relays
    expect(subscription.status).toBe('active');
    
    // Should still receive events from working relays
    manager.handleRelayEvent('relay2', generateEvent(), subscription.id);
    // Event should be processed normally
  });
});
```

### Day 6: Performance Optimization
```typescript
// Performance optimization implementation
describe('Performance Optimization - Integration Phase', () => {
  test('should batch store updates for performance', async () => {
    const store = createFeed().kinds([1]);
    const updateSpy = jest.spyOn(store.events, 'set');
    
    // Rapid event sequence
    const events = Array.from({ length: 100 }, () => generateEvent());
    events.forEach(event => store.handleEvent(event));
    
    // Should batch updates instead of updating 100 times
    await new Promise(resolve => setTimeout(resolve, 20)); // Wait for batch
    
    expect(updateSpy.mock.calls.length).toBeLessThan(10); // Batched updates
  });
  
  test('should meet performance targets under load', async () => {
    const manager = new SubscriptionManager(mockRelayManager, mockCache);
    
    // Create multiple subscriptions
    const subscriptions = await Promise.all(
      Array.from({ length: 50 }, () => 
        manager.subscribe([{ kinds: [1] }])
      )
    );
    
    // Measure event processing performance
    const events = Array.from({ length: 1000 }, () => generateEvent());
    
    const start = performance.now();
    
    events.forEach(event => {
      subscriptions.forEach(sub => {
        manager.handleRelayEvent('test-relay', event, sub.id);
      });
    });
    
    const end = performance.now();
    const eventsPerSecond = (1000 * 50) / ((end - start) / 1000);
    
    expect(eventsPerSecond).toBeGreaterThan(100); // Performance target
  });
});
```

## Phase 3: Quality & Polish (Days 7-10)

### Day 7-8: Error Handling & Recovery
```typescript
// Comprehensive error handling implementation
describe('Error Handling & Recovery - Quality Phase', () => {
  test('should handle network disconnections gracefully', async () => {
    const subscription = await manager.subscribe([{ kinds: [1] }]);
    
    let statusUpdates: string[] = [];
    subscription.onStatusChange(status => statusUpdates.push(status));
    
    // Simulate network disconnection
    mockRelayManager.simulateDisconnection('relay1');
    
    expect(subscription.status).toBe('reconnecting');
    expect(statusUpdates).toContain('reconnecting');
    
    // Simulate reconnection
    mockRelayManager.simulateReconnection('relay1');
    
    await waitFor(() => subscription.status === 'active');
    expect(subscription.status).toBe('active');
  });
  
  test('should provide clear error messages with recovery actions', async () => {
    try {
      await manager.subscribe([{ kinds: [-1] }]); // Invalid filter
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Invalid event kind');
      expect(error.userAction).toContain('Use positive integers');
      expect(error.retryable).toBe(false);
    }
  });
});
```

### Day 9-10: Final Integration & Documentation
```typescript
// Complete end-to-end integration tests
describe('Complete Integration - Final Phase', () => {
  test('should handle complete real-world subscription workflow', async () => {
    // Real relay integration test
    const nostr = new NostrUnchained({
      relays: ['ws://umbrel.local:4848'],
      debug: true
    });
    
    // Create reactive store
    const feedStore = createFeed()
      .kinds([1])
      .authors(['npub1testuser...'])
      .live(true);
    
    const events: NostrEvent[] = [];
    feedStore.events.subscribe(eventList => {
      events.splice(0, events.length, ...eventList);
    });
    
    // Wait for initial events
    await waitFor(() => events.length > 0, 30000);
    
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(e => e.kind === 1)).toBe(true);
    
    // Test dynamic filter updates
    await feedStore.updateFilter({ kinds: [1, 6] });
    
    // Should receive reposts as well
    await waitFor(() => events.some(e => e.kind === 6), 10000);
    
    await feedStore.close();
  });
  
  test('should maintain performance under extended operation', async () => {
    const store = createFeed().kinds([1]).live(true);
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate 1 hour of operation with events
    for (let i = 0; i < 3600; i++) { // 1 event per second for 1 hour
      store.handleEvent(generateEvent());
      
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1)); // Yield
      }
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not have excessive memory growth
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    
    await store.close();
  });
});
```

## Quality Gates Preparation

### Phase Gate 1: Foundation Complete (Day 3)
```typescript
// Automated quality gate validation
describe('Phase Gate 1: Foundation', () => {
  test('all core APIs implemented and tested', () => {
    expect(SubscriptionManager).toBeDefined();
    expect(QueryBuilder).toBeDefined();
    expect(FeedStore).toBeDefined();
    expect(EventCache).toBeDefined();
  });
  
  test('basic functionality working with >90% test coverage', async () => {
    const coverage = await getCoverageReport();
    expect(coverage.lines.percentage).toBeGreaterThan(90);
    expect(coverage.functions.percentage).toBeGreaterThan(90);
  });
  
  test('performance baseline established', async () => {
    const benchmark = await runPerformanceBenchmark();
    expect(benchmark.subscriptionCreation.average).toBeLessThan(100);
    expect(benchmark.eventProcessing.throughput).toBeGreaterThan(50);
  });
});
```

### Phase Gate 2: Integration Complete (Day 6)
```typescript
describe('Phase Gate 2: Integration', () => {
  test('multi-relay coordination working', async () => {
    // Multi-relay integration test
  });
  
  test('real relay integration successful', async () => {
    // Real relay test with ws://umbrel.local:4848
  });
  
  test('performance targets >90% achieved', async () => {
    const benchmark = await runPerformanceBenchmark();
    expect(benchmark.subscriptionCreation.average).toBeLessThan(90);
    expect(benchmark.eventProcessing.throughput).toBeGreaterThan(90);
  });
});
```

### Phase Gate 3: Production Ready (Day 10)
```typescript
describe('Phase Gate 3: Production Ready', () => {
  test('all requirements implemented with >95% coverage', async () => {
    const coverage = await getCoverageReport();
    expect(coverage.lines.percentage).toBeGreaterThan(95);
  });
  
  test('performance targets 100% achieved', async () => {
    const benchmark = await runPerformanceBenchmark();
    expect(benchmark.subscriptionCreation.average).toBeLessThan(100);
    expect(benchmark.eventProcessing.throughput).toBeGreaterThan(100);
    expect(benchmark.memoryUsage.perEvent).toBeLessThan(5120); // 5KB
  });
  
  test('memory leak tests passing', async () => {
    const memoryTest = await runMemoryLeakTest();
    expect(memoryTest.leakDetected).toBe(false);
  });
});
```

## Implementation Success Metrics

### Quantitative Success Criteria
```typescript
const implementationTargets = {
  testCoverage: {
    lines: 95,
    functions: 95,
    branches: 90,
    statements: 95
  },
  
  performance: {
    subscriptionCreation: 100, // ms
    eventProcessing: 100,      // events/second
    memoryPerEvent: 5120,      // bytes
    updateLatency: 100         // ms
  },
  
  quality: {
    bugCount: 0,               // zero known bugs
    memoryLeaks: 0,            // no memory leaks
    errorRecovery: 100,        // % of error scenarios handled
    apiCompliance: 100         // % of API contracts implemented
  }
};
```

### Implementation Readiness Checklist ✅
- [ ] TDD test infrastructure prepared and validated
- [ ] Performance monitoring tools configured
- [ ] Mock systems ready for isolated component testing
- [ ] Real relay access confirmed for integration testing
- [ ] Quality gates defined with automated validation
- [ ] Risk mitigation strategies documented and ready
- [ ] Implementation timeline with clear phase boundaries
- [ ] Success criteria measurable and achievable

The phase preparation provides a comprehensive roadmap for **@/softwaredev-agent** to execute the implementation with confidence, clear quality expectations, and systematic progress validation.