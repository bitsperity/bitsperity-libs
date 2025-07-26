# Technology Stack - Milestone 2: Subscribe & Query Foundation

## Stack Overview
**Philosophy**: Maintain proven foundations from Milestone 1 while adding minimal, high-quality dependencies for subscription functionality.  
**Principle**: Each technology choice optimized for TypeScript library development with zero-config developer experience.  

## Core Technology Decisions

### Runtime & Language
```json
{
  "runtime": "Node.js >=20.0.0",
  "language": "TypeScript ^5.3.0",
  "target": "ES2020",
  "moduleSystem": "ES Modules",
  "bundleFormats": ["ESM", "CommonJS"]
}
```

**Rationale**: 
- Node.js 20+ provides stable WebSocket APIs and performance improvements
- TypeScript 5.3+ enables advanced generics needed for type-safe query building
- ES2020 target ensures broad compatibility while enabling modern features
- ES Modules primary with CJS compatibility for legacy Node.js environments

### Testing Infrastructure (Enhanced)
```json
{
  "testRunner": "Vitest ^3.2.0",
  "coverage": "@vitest/coverage-v8 ^3.2.0",
  "testUtils": "@vitest/ui ^3.2.0",
  "environment": "jsdom ^26.1.0",
  "fixtures": "Custom WebSocket mocking utilities"
}
```

**New Testing Capabilities for M2**:
- **WebSocket Mocking**: Custom utilities for subscription testing
- **Performance Benchmarking**: Built-in performance test utilities
- **Memory Leak Detection**: Long-running test scenarios
- **Real Relay Testing**: Integration tests with `ws://umbrel.local:4848`

### Build & Development Tools (Unchanged)
```json
{
  "bundler": "Vite ^5.0.0",
  "linting": "ESLint ^8.57.0 + @typescript-eslint",
  "formatting": "Prettier ^3.0.0",
  "gitHooks": "Husky for pre-commit validation",
  "packageManager": "npm (built-in)"
}
```

**Rationale**: Proven toolchain from Milestone 1 requires no changes for subscription features.

## WebSocket Technology Stack

### WebSocket Implementation
```typescript
// Cross-platform WebSocket compatibility (from M1)
interface WebSocketImplementation {
  browser: "Native WebSocket API",
  nodejs: "ws ^8.18.3", // Existing dependency
  compatibility: "Existing RelayManager abstraction"
}
```

**Strategy**: Extend existing WebSocket infrastructure rather than introducing new dependencies.

### Message Protocol Implementation
```typescript
// NIP-01 message handling (pure TypeScript)
interface MessageProtocol {
  implementation: "Pure TypeScript",
  dependencies: "None (zero new dependencies)",
  validation: "Custom JSON schema validation",
  serialization: "Native JSON.stringify/parse"
}

// Message type definitions
type ClientMessage = 
  | ['REQ', string, ...NostrFilter[]]
  | ['CLOSE', string]
  | ['EVENT', NostrEvent];

type RelayMessage = 
  | ['EVENT', string, NostrEvent]
  | ['EOSE', string]
  | ['CLOSED', string, string]
  | ['NOTICE', string];
```

**Rationale**: 
- Zero additional dependencies for protocol implementation
- Full control over message parsing and validation
- Excellent TypeScript integration with union types
- Easy to extend for future NIP support

## Reactive System Technology

### Svelte Store Integration
```typescript
// Store implementation strategy
interface ReactiveStack {
  core: "Custom store implementation",
  svelteCompat: "Native Svelte store interface",
  dependencies: "Zero additional dependencies",
  reactivity: "Custom subscription management"
}

// Store interface implementation
import type { Readable, Writable } from 'svelte/store';

class NostrFeedStore implements Readable<NostrEvent[]> {
  // Native Svelte store compatibility without svelte dependency
  subscribe(run: (value: NostrEvent[]) => void): () => void {
    // Custom implementation
  }
}
```

**Rationale**:
- No Svelte dependency in core library (framework-agnostic)
- Native compatibility with Svelte store interface
- Framework adapters possible for React/Vue without core changes
- Maximum performance with custom implementation

### Event Processing Pipeline
```typescript
// Event processing technology
interface EventProcessing {
  streams: "Custom AsyncIterable implementation",
  batching: "Custom batching with requestAnimationFrame",
  deduplication: "Map-based with WeakRef for memory efficiency",
  ordering: "Custom sort with timestamp comparison"
}
```

**Performance Considerations**:
- Custom implementation optimized for Nostr event characteristics
- Memory-efficient with automatic cleanup
- Predictable performance without external library overhead
- Easy to profile and optimize

## Data Management Technology

### Event Caching System
```typescript
// Caching technology stack
interface CachingStack {
  storage: "In-memory Map with custom eviction",
  indexing: "Multi-dimensional Map-based indexes",
  serialization: "Optional JSON persistence",
  compression: "Future: streaming compression for large caches"
}

// Implementation approach
class EventCache {
  private cache = new Map<string, CachedEvent>();
  private indexes = {
    byKind: new Map<number, Set<string>>(),
    byAuthor: new Map<string, Set<string>>(),
    byTag: new Map<string, Set<string>>()
  };
  
  // Custom eviction algorithms
  private evictionPolicy: 'lru' | 'lfu' | 'time-based' = 'lru';
}
```

**Technology Choices**:
- **Native Maps**: Better performance than objects for dynamic keys
- **Set-based Indexing**: Efficient intersection operations for complex queries
- **WeakRef Usage**: Automatic garbage collection for unused events
- **Custom Algorithms**: Tailored for Nostr event access patterns

### Filter Engine Technology
```typescript
// Filter processing technology
interface FilterTechnology {
  validation: "JSON Schema-like custom validation",
  optimization: "Custom rule-based optimizer",
  compilation: "TypeScript function generation",
  caching: "Compiled filter caching"
}

// Advanced filter compilation
class FilterCompiler {
  compile(filter: NostrFilter): CompiledFilter {
    // Generate optimized TypeScript function
    return new Function('event', this.generateFilterCode(filter)) as CompiledFilter;
  }
}
```

**Rationale**:
- Function compilation for maximum filter performance
- Zero external parser dependencies
- Type-safe compilation with TypeScript integration
- Caching compiled filters for repeated use

## Performance Technology Stack

### Memory Management
```typescript
// Memory optimization technology
interface MemoryStack {
  monitoring: "Native process.memoryUsage()",
  cleanup: "Custom reference counting + WeakRef",
  profiling: "Chrome DevTools integration",
  testing: "Custom memory leak detection"
}

// Memory monitoring implementation
class MemoryMonitor {
  private baseline = process.memoryUsage();
  private thresholds = {
    warning: 50 * 1024 * 1024,  // 50MB
    critical: 100 * 1024 * 1024  // 100MB
  };
  
  monitor(): MemoryReport {
    const current = process.memoryUsage();
    return {
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      external: current.external - this.baseline.external,
      rss: current.rss - this.baseline.rss
    };
  }
}
```

### Performance Monitoring
```typescript
// Performance measurement technology
interface PerformanceStack {
  timing: "Native performance.now() and console.time",
  profiling: "Custom performance hooks",
  benchmarking: "Vitest benchmark utilities",
  realtime: "Built-in metrics collection"
}

// Custom performance hooks
class PerformanceTracker {
  private metrics = new Map<string, PerformanceMetric>();
  
  time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric(label, duration);
    return result;
  }
}
```

## Development Workflow Technology

### Type Safety Technology
```typescript
// Advanced TypeScript features
interface TypeSafetyStack {
  generics: "Advanced generic constraints for event types",
  inference: "Automatic type inference in query builders",
  validation: "Runtime type checking with TypeScript types",
  documentation: "TSDoc for API documentation generation"
}

// Advanced generic usage
interface QueryBuilder<T extends NostrEvent = NostrEvent> {
  kinds<K extends number>(kinds: K[]): QueryBuilder<NostrEvent<K>>;
  // Type inference automatically narrows T to NostrEvent<K>
}
```

### Testing Technology Enhancement
```typescript
// Enhanced testing stack for subscriptions
interface TestingEnhancements {
  mocking: "Custom WebSocket mock utilities",
  fixtures: "Deterministic event generation",
  integration: "Real relay testing utilities",
  performance: "Built-in benchmark assertions"
}

// Custom WebSocket mocking
class MockWebSocket {
  constructor(url: string) {
    // Simulate realistic WebSocket behavior
  }
  
  simulateEvent(subscriptionId: string, event: NostrEvent): void {
    this.onmessage({ data: JSON.stringify(['EVENT', subscriptionId, event]) });
  }
  
  simulateEOSE(subscriptionId: string): void {
    this.onmessage({ data: JSON.stringify(['EOSE', subscriptionId]) });
  }
}
```

## Deployment Technology

### Build Optimization
```typescript
// Build configuration enhancements
interface BuildStack {
  bundling: "Vite with custom rollup plugins",
  treeshaking: "Aggressive dead code elimination",
  splitting: "Automatic code splitting for large features",
  compression: "Brotli compression for production builds"
}

// Custom Vite configuration for library builds
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['ws', '@noble/secp256k1', '@noble/hashes'],
      output: {
        // Separate chunks for optional features
        manualChunks: {
          'subscription': ['src/subscription/', 'src/query/'],
          'stores': ['src/stores/'],
          'cache': ['src/cache/']
        }
      }
    }
  }
});
```

### Bundle Analysis Technology
```typescript
// Bundle optimization technology
interface BundleStack {
  analysis: "Custom bundle analyzer for library optimization",
  sizeLimits: "Automated size regression testing",
  loading: "Lazy loading strategies for optional features",
  compatibility: "Cross-platform compatibility testing"
}
```

## Quality Assurance Technology

### Code Quality Stack
```typescript
// Enhanced quality tooling
interface QualityStack {
  linting: "ESLint with custom rules for subscription patterns",
  testing: "Enhanced Vitest with subscription-specific utilities",
  coverage: "V8 coverage with subscription flow tracking",
  security: "Custom security analysis for WebSocket handling"
}

// Custom ESLint rules for subscription code
const subscriptionRules = {
  'nostr/require-subscription-cleanup': 'error',
  'nostr/no-memory-leaks': 'error',
  'nostr/prefer-immutable-filters': 'warn'
};
```

### Documentation Technology
```typescript
// Documentation stack
interface DocumentationStack {
  apiDocs: "TypeDoc with custom themes",
  examples: "Live code examples with Svelte REPL integration",
  tutorials: "Interactive documentation with real relay testing",
  changelog: "Automated changelog generation"
}
```

## Migration Strategy from M1

### Backward Compatibility Technology
```typescript
// Compatibility layer technology
interface CompatibilityStack {
  detection: "Runtime feature detection",
  fallbacks: "Graceful degradation for unsupported features",
  migration: "Automatic API migration utilities",
  testing: "Compatibility test suite"
}

// Feature detection
class FeatureDetector {
  static hasSubscriptionSupport(): boolean {
    return typeof WebSocket !== 'undefined';
  }
  
  static hasStoreSupport(): boolean {
    return typeof window !== 'undefined';
  }
}

// Backward compatible API
export class NostrUnchained {
  // M1 methods (unchanged)
  async publish(content: string): Promise<PublishResult> {
    // Existing implementation
  }
  
  // M2 methods (new)
  query(): QueryBuilder {
    if (!FeatureDetector.hasSubscriptionSupport()) {
      throw new Error('Subscription features require WebSocket support');
    }
    return new QueryBuilder(this.subscriptionManager);
  }
}
```

## Technology Risk Assessment

### High Confidence Technologies ✅
- **TypeScript**: Proven foundation from M1
- **Vitest**: Excellent test runner with subscription mocking
- **Vite**: Fast builds and excellent TypeScript integration
- **Native WebSocket**: Stable API with good browser/Node.js support

### Medium Confidence Technologies ⚠️
- **Custom Store Implementation**: Need to ensure Svelte compatibility
- **Memory Management**: Complex caching requires careful testing
- **Performance Optimization**: Need baseline measurements for validation

### Low Risk Technologies ✅
- **JSON Processing**: Native APIs sufficient for NIP-01 messages
- **Event Filtering**: Straightforward implementation with Map/Set
- **Error Handling**: Standard patterns with TypeScript enums

## Technology Validation Plan

### Performance Validation
```typescript
// Performance benchmarks for technology choices
describe('Technology Performance', () => {
  benchmark('Map vs Object for event storage', () => {
    // Compare Map vs Object performance for dynamic keys
  });
  
  benchmark('Custom vs Library filtering', () => {
    // Validate custom filter implementation performance
  });
  
  benchmark('WebSocket message processing', () => {
    // Measure message parsing and routing performance
  });
});
```

### Compatibility Validation
```typescript
// Cross-platform compatibility testing
describe('Platform Compatibility', () => {
  test('WebSocket support detection', () => {
    expect(FeatureDetector.hasSubscriptionSupport()).toBeDefined();
  });
  
  test('Memory management across platforms', () => {
    // Test memory monitoring on different Node.js versions
  });
  
  test('Store compatibility with different frameworks', () => {
    // Test store interface with Svelte, React adapters
  });
});
```

## Technology Success Metrics

### Performance Targets
- **Bundle Size**: Core + subscriptions < 60KB gzipped
- **Memory Usage**: < 5MB per 1000 cached events  
- **Processing Speed**: > 100 events/second throughput
- **Startup Time**: < 500ms to first subscription

### Quality Targets
- **Test Coverage**: > 95% for all subscription components
- **Type Safety**: 100% TypeScript strict mode compliance
- **Documentation**: 100% public API documentation coverage
- **Compatibility**: Node.js 20+ and modern browsers

### Developer Experience Targets
- **Setup Time**: < 2 minutes from npm install to first subscription
- **API Discoverability**: Full IntelliSense support for all features
- **Error Messages**: Clear, actionable error descriptions
- **Learning Curve**: < 30 minutes to productive usage

## Conclusion

The technology stack for Milestone 2 builds conservatively on the proven foundation from Milestone 1, adding minimal dependencies while providing powerful subscription and query capabilities. The emphasis on zero additional dependencies, custom implementations optimized for Nostr patterns, and comprehensive TypeScript integration ensures excellent performance and developer experience while maintaining the library's core philosophy of simplicity and reliability.