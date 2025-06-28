# Nostr Unchained - API Specification

## Overview & Design Philosophy

**API Design Principles:**
- **Progressive Disclosure**: Simple defaults, explicit control available
- **Type Safety**: Comprehensive TypeScript with template literals and strict mode
- **Fail-Silent**: Result types over exceptions for graceful degradation
- **Reactive by Design**: Native Svelte store integration throughout
- **Performance-First**: Batched operations and intelligent caching

**Research-Informed Patterns:**
- **Modern TypeScript 2025**: Template literals, satisfies operator, strict mode
- **"Errors as Values"**: Result<T, E> pattern for fail-silent behavior
- **Custom Indexes**: Performance optimization with IndexedDB
- **Progressive Enhancement**: Tree-shaking with explicit exports

---

## Core Types & Interfaces

### Base Types

```typescript
// Core Nostr types with modern enhancements
type NostrEvent = {
  id: string
  pubkey: string  
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

// Template literal types for NIP validation
type NIPKind = `nip-${number}`
type RelayURL = `ws${'s' | ''}://${string}`

// Result type for fail-silent behavior
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Event filter with enhanced type safety
interface NostrFilter {
  ids?: string[]
  authors?: string[]
  kinds?: number[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[] | undefined
}

// Configuration with satisfies operator
interface NostrConfig {
  relays?: RelayURL[]
  cache?: CacheConfig
  performance?: PerformanceConfig
  privacy?: PrivacyConfig
}

const defaultConfig = {
  relays: ["wss://relay.nostr.band"],
  cache: { maxEvents: 10000 },
  performance: { batchSize: 1000 }
} satisfies NostrConfig
```

### Cache & Store Types

```typescript
// Svelte store integration
type NostrStore<T> = Readable<T> & {
  subscribe: (callback: (value: T) => void) => () => void
  refresh: () => Promise<void>
  invalidate: () => void
}

// Cache configuration with performance optimizations
interface CacheConfig {
  maxEvents?: number
  evictionStrategy?: 'lru' | 'lru-with-importance' | 'ttl'
  indexingStrategy?: 'auto' | 'custom' | 'minimal'
  enableSharding?: boolean
  customIndexes?: CustomIndex[]
}

interface CustomIndex {
  name: string
  keyPath: string | string[]
  generator?: (event: NostrEvent) => string
}

// Performance monitoring
interface CacheMetrics {
  hitRate: number
  size: number
  evictions: number
  queryPerformance: {
    averageMs: number
    p95Ms: number
    p99Ms: number
  }
}
```

---

## Core API Surface

### 1. Initialization & Configuration

```typescript
// Primary initialization with progressive disclosure
declare namespace NostrUnchained {
  // ✨ Zero-config initialization
  function init(): Promise<NostrClient>
  
  // 🔧 Full configuration control
  function init(config: NostrConfig): Promise<NostrClient>
  
  // 📊 Advanced initialization with monitoring
  function init(config: NostrConfig & {
    onReady?: () => void
    onError?: (error: Error) => void
    monitoring?: MonitoringConfig
  }): Promise<NostrClient>
}

// Main client interface
interface NostrClient {
  // Component access
  readonly dm: DMManager
  readonly profiles: ProfileManager
  readonly query: QueryBuilder
  readonly events: EventBuilder
  readonly relays: RelayManager
  readonly cache: CacheManager
  
  // Utility methods
  publish(event: NostrEvent): Promise<Result<PublishResult>>
  subscribe(filter: NostrFilter): NostrStore<NostrEvent[]>
  
  // Monitoring & debugging
  readonly debug: DebugManager
  readonly performance: PerformanceManager
}
```

### 2. DM Manager - NIP-17 Excellence

```typescript
interface DMManager {
  // ✨ Simple magic
  send(options: {
    to: string
    message: string
  }): Promise<Result<MessageConfirmation>>
  
  // 🔧 Full control
  send(options: {
    to: string
    message: string
    relays?: RelayURL[]
    encryptionLevel?: 'nip04' | 'nip17-basic' | 'nip17-advanced'
    timeout?: number
    retryStrategy?: RetryStrategy
    priority?: 'low' | 'normal' | 'high'
  }): Promise<Result<MessageConfirmation>>
  
  // Reactive conversation management
  conversations(): NostrStore<Conversation[]>
  conversation(pubkey: string): NostrStore<Message[]>
  
  // Advanced features
  markAsRead(conversationId: string): Promise<Result<void>>
  deleteConversation(conversationId: string): Promise<Result<void>>
  searchMessages(query: string): Promise<Result<Message[]>>
}

// Supporting types
interface MessageConfirmation {
  messageId: string
  deliveredToRelays: RelayURL[]
  failedRelays: RelayURL[]
  timestamp: number
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage: Message
  unreadCount: number
  createdAt: number
  updatedAt: number
}

interface Message {
  id: string
  from: string
  to: string
  content: string
  timestamp: number
  conversationId: string
  deliveryStatus: 'pending' | 'delivered' | 'failed'
}
```

### 3. Profile Manager

```typescript
interface ProfileManager {
  // Basic operations
  get(pubkey: string): Promise<Result<Profile>>
  update(profile: Partial<Profile>): Promise<Result<void>>
  
  // Reactive subscriptions
  subscribe(pubkey: string): NostrStore<Profile>
  
  // Social graph operations
  followers(pubkey: string): NostrStore<Profile[]>
  following(pubkey: string): NostrStore<Profile[]>
  
  // Batch operations for performance
  getBatch(pubkeys: string[]): Promise<Result<Profile[]>>
  
  // Advanced features
  search(query: string): Promise<Result<Profile[]>>
  getRecommendations(pubkey: string): Promise<Result<Profile[]>>
}

interface Profile {
  pubkey: string
  name?: string
  about?: string
  picture?: string
  banner?: string
  website?: string
  nip05?: string
  lud16?: string
  
  // Computed fields
  followers?: number
  following?: number
  lastSeen?: number
  
  // Metadata
  updatedAt: number
  relays?: RelayURL[]
}
```

### 4. Query Engine - Advanced Graph Traversal

```typescript
interface QueryBuilder {
  // Fluent API with method chaining
  kind(kinds: number | number[]): QueryBuilder
  authors(pubkeys: string[]): QueryBuilder
  since(timestamp: number): QueryBuilder
  until(timestamp: number): QueryBuilder
  limit(count: number): QueryBuilder
  search(text: string): QueryBuilder
  
  // Advanced relationship queries
  subgraph(rootEventId: string): SubgraphBuilder
  
  // Performance optimizations
  withPagination(enabled: boolean): QueryBuilder
  batchSize(size: number): QueryBuilder
  
  // Execution
  execute(): Promise<Result<NostrEvent[]>>
  subscribe(): NostrStore<NostrEvent[]>
  count(): Promise<Result<number>>
}

interface SubgraphBuilder {
  depth(levels: number): SubgraphBuilder
  includeReplies(enabled: boolean): SubgraphBuilder
  includeReactions(enabled: boolean): SubgraphBuilder
  includeReferences(enabled: boolean): SubgraphBuilder
  
  // Performance control
  maxEvents(limit: number): SubgraphBuilder
  
  // Execution with specialized return type
  execute(): Promise<Result<EventSubgraph>>
}

interface EventSubgraph {
  root: NostrEvent
  replies: NostrEvent[]
  reactions: NostrEvent[]
  references: NostrEvent[]
  metadata: {
    depth: number
    totalEvents: number
    queryTimeMs: number
  }
}
```

### 5. Event Builder - Type-Safe Construction

```typescript
interface EventBuilder {
  // Common event types with fluent API
  note(content: string): NoteBuilder
  reaction(eventId: string, content: string): ReactionBuilder
  profile(metadata: ProfileMetadata): ProfileBuilder
  contact(contacts: Contact[]): ContactBuilder
  
  // Custom event creation
  custom(kind: number): CustomEventBuilder
  
  // Raw event creation for advanced use
  raw(): RawEventBuilder
}

interface NoteBuilder {
  content(text: string): NoteBuilder
  addTag(tagName: string, ...values: string[]): NoteBuilder
  addMention(pubkey: string): NoteBuilder
  addHashtag(tag: string): NoteBuilder
  replyTo(eventId: string): NoteBuilder
  
  // Build and publish
  build(): Promise<Result<NostrEvent>>
  publish(): Promise<Result<PublishResult>>
  
  // Preview without publishing
  preview(): NostrEvent
}

// Template literal types for tag validation
type TagName = 'e' | 'p' | 't' | 'r' | 'd' | 'a' | string
type EventTag = [TagName, ...string[]]

interface PublishResult {
  event: NostrEvent
  publishedToRelays: RelayURL[]
  failedRelays: RelayURL[]
  confirmations: number
  publishTimeMs: number
}
```

### 6. Relay Manager - Intelligent Connection Management

```typescript
interface RelayManager {
  // Connection management
  connect(url: RelayURL): Promise<Result<RelayConnection>>
  disconnect(url: RelayURL): Promise<Result<void>>
  
  // Health monitoring
  getHealth(): Promise<RelayHealth[]>
  getOptimalRelays(operation: RelayOperation): RelayURL[]
  
  // Configuration
  configure(settings: RelaySettings): Promise<Result<void>>
  
  // Advanced features
  broadcast(event: NostrEvent, relays?: RelayURL[]): Promise<Result<BroadcastResult>>
  subscribe(filter: NostrFilter, relays?: RelayURL[]): Promise<Result<Subscription>>
}

interface RelayConnection {
  url: RelayURL
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  latency: number
  lastSeen: number
  capabilities: string[]
}

interface RelayHealth {
  url: RelayURL
  isHealthy: boolean
  latency: number
  uptime: number
  errorRate: number
  lastCheck: number
}

type RelayOperation = 'dm' | 'content' | 'profile' | 'query'

interface RelaySettings {
  maxConnections: number
  timeoutMs: number
  retryStrategy: RetryStrategy
  healthCheckInterval: number
  priorityRelays: RelayURL[]
}

interface RetryStrategy {
  type: 'exponential-backoff' | 'linear' | 'custom'
  baseDelayMs: number
  maxDelayMs: number
  maxAttempts: number
  jitter: boolean
}
```

### 7. Cache Manager - Performance Optimization

```typescript
interface CacheManager {
  // Cache operations
  get(id: string): Promise<Result<NostrEvent>>
  put(event: NostrEvent): Promise<Result<void>>
  delete(id: string): Promise<Result<void>>
  
  // Bulk operations for performance
  getBatch(ids: string[]): Promise<Result<NostrEvent[]>>
  putBatch(events: NostrEvent[]): Promise<Result<void>>
  
  // Query cache
  query(filter: NostrFilter): Promise<Result<NostrEvent[]>>
  
  // Cache management
  clear(): Promise<Result<void>>
  getMetrics(): Promise<CacheMetrics>
  optimize(): Promise<Result<OptimizationReport>>
  
  // Event subscriptions for reactivity
  onCacheUpdate(callback: (event: CacheUpdateEvent) => void): () => void
}

interface CacheUpdateEvent {
  type: 'added' | 'updated' | 'deleted'
  eventId: string
  event?: NostrEvent
  timestamp: number
}

interface OptimizationReport {
  beforeSize: number
  afterSize: number
  evictedEvents: number
  optimizationTimeMs: number
  recommendations: string[]
}
```

---

## Advanced Features & Utilities

### 8. Performance Manager

```typescript
interface PerformanceManager {
  // Real-time metrics
  getMetrics(): PerformanceMetrics
  
  // Monitoring
  startMonitoring(): void
  stopMonitoring(): void
  
  // Optimization
  optimize(): Promise<OptimizationResult>
  getRecommendations(): PerformanceRecommendation[]
}

interface PerformanceMetrics {
  cache: CacheMetrics
  relays: RelayMetrics
  queries: QueryMetrics
  memory: MemoryMetrics
}

interface QueryMetrics {
  totalQueries: number
  averageResponseTime: number
  cacheHitRate: number
  slowQueries: SlowQuery[]
}

interface SlowQuery {
  filter: NostrFilter
  responseTimeMs: number
  timestamp: number
  cacheHit: boolean
}
```

### 9. Debug Manager

```typescript
interface DebugManager {
  // Debug controls
  enable(...categories: DebugCategory[]): void
  disable(...categories: DebugCategory[]): void
  
  // Logging
  log(category: DebugCategory, message: string, data?: any): void
  
  // Diagnostics
  generateReport(): Promise<DiagnosticReport>
  exportLogs(): Promise<LogExport>
}

type DebugCategory = 
  | 'cache' 
  | 'relays' 
  | 'performance' 
  | 'subscriptions'
  | 'events'
  | 'crypto'

interface DiagnosticReport {
  timestamp: number
  version: string
  configuration: NostrConfig
  metrics: PerformanceMetrics
  issues: DiagnosticIssue[]
  recommendations: string[]
}

interface DiagnosticIssue {
  severity: 'low' | 'medium' | 'high'
  category: string
  message: string
  details?: any
}
```

---

## Error Handling & Types

### Result Pattern Implementation

```typescript
// Comprehensive error types
type NostrError =
  | RelayError
  | CacheError  
  | ValidationError
  | NetworkError
  | CryptographyError

interface RelayError {
  type: 'relay-error'
  relayUrl: RelayURL
  message: string
  code?: string
  timestamp: number
}

interface CacheError {
  type: 'cache-error'
  operation: string
  message: string
  details?: any
}

interface ValidationError {
  type: 'validation-error'
  field: string
  value: any
  expected: string
  message: string
}

// Utility functions for error handling
declare namespace NostrUnchained {
  // Result utilities
  function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T }
  function isError<T, E>(result: Result<T, E>): result is { success: false; error: E }
  
  // Safe execution wrapper
  function safe<T>(fn: () => Promise<T>): Promise<Result<T, NostrError>>
  function safe<T>(fn: () => T): Result<T, NostrError>
  
  // Error matching
  function matchError<T>(
    result: Result<any, NostrError>,
    handlers: {
      [K in NostrError['type']]?: (error: Extract<NostrError, { type: K }>) => T
    }
  ): T | undefined
}
```

---

## Integration Patterns

### SvelteKit Integration

```typescript
// Store factory for reactive patterns
function createNostrStore<T>(
  fetcher: () => Promise<Result<T>>,
  options?: {
    refreshInterval?: number
    errorHandler?: (error: NostrError) => void
  }
): NostrStore<T>

// SvelteKit-specific utilities
declare namespace NostrUnchained {
  // SSR-safe initialization
  function createClient(config?: NostrConfig): Promise<NostrClient>
  
  // Page-based subscriptions
  function useProfile(pubkey: string): NostrStore<Profile>
  function useQuery(filter: NostrFilter): NostrStore<NostrEvent[]>
  
  // Route-aware functionality
  function withRouteBinding(client: NostrClient): {
    bindToRoute(pattern: string, handler: RouteHandler): void
  }
}

type RouteHandler = (params: Record<string, string>) => void
```

### Testing Utilities

```typescript
// Mock implementations for testing
declare namespace NostrUnchained {
  namespace Testing {
    function createMockClient(config?: MockConfig): NostrClient
    function createMockRelay(responses?: MockResponse[]): MockRelay
    
    // Assertion helpers
    function expectEventPublished(event: NostrEvent): Promise<void>
    function expectCacheHit(filter: NostrFilter): Promise<void>
  }
}

interface MockConfig extends NostrConfig {
  simulateLatency?: number
  simulateErrors?: boolean
  predefinedEvents?: NostrEvent[]
}
```

---

## Performance Considerations

### Bundle Optimization

```typescript
// Tree-shakeable imports
import { DMManager } from 'nostr-unchained/dm'
import { ProfileManager } from 'nostr-unchained/profiles'
import { QueryBuilder } from 'nostr-unchained/query'

// Dynamic imports for advanced features
const { PerformanceManager } = await import('nostr-unchained/performance')
const { DebugManager } = await import('nostr-unchained/debug')

// Lightweight core bundle
import NostrCore from 'nostr-unchained/core' // <30KB
```

### Migration Support

```typescript
// Compatibility with existing libraries
declare namespace NostrUnchained {
  namespace Compat {
    // nostr-tools compatibility
    function fromNostrTools(event: any): NostrEvent
    function toNostrTools(event: NostrEvent): any
    
    // NDK migration helpers
    function migrateFromNDK(ndkInstance: any): Promise<NostrClient>
  }
}
```

---

**Implementation Priority:** Core → DM → Profiles → Query → Advanced Features

**Next**: [Implementation Milestones](./milestones.md) | [Library Overview](./lib-overview.md) | [User Stories](./user-stories.md) 