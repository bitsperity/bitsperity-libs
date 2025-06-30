# Nostr Unchained - API Specification

## API Design Philosophy

### Core Design Principles
- **Fluent Interfaces**: Chainable methods für natürlichen Code-Flow
- **Progressive Disclosure**: Einfache APIs für häufige Use Cases, Power-Features bei Bedarf
- **Svelte-First**: Reactive stores als first-class citizens
- **Intelligent Defaults**: Zero-config für 80% der Szenarien
- **Type Safety**: TypeScript-native mit ausgezeichneter IDE-Integration

### Inspiration Patterns
- **Prisma/DrizzleORM**: Elegante query builders
- **Svelte Stores**: Reactive programming patterns
- **Stripe/Plaid APIs**: Progressive complexity disclosure

## Core APIs

### Primary Interface - NostrUnchained Class

```typescript
class NostrUnchained {
  // Initialization mit intelligent defaults
  constructor(config?: NostrConfig)
  
  // Core subsystems
  readonly events: EventManager
  readonly query: QueryBuilder  
  readonly cache: CacheManager
  readonly dm: DMManager
  readonly profile: ProfileManager
  readonly relays: RelayManager
}

// Zero-config initialization
const nostr = new NostrUnchained();

// Power-user configuration
const nostr = new NostrUnchained({
  caching: { strategy: 'hybrid', maxEvents: 10000 },
  relays: { autoDiscover: true, fallbacks: DEFAULTS },
  signing: { strategy: 'nip07-first' }
});
```

### Event Management API

```typescript
interface EventManager {
  // Fluent event creation
  create(): EventBuilder
  
  // Direct publishing
  publish(event: NostrEvent): Promise<PublishResult>
  
  // Batch operations
  publishBatch(events: NostrEvent[]): Promise<PublishResult[]>
}

// Fluent EventBuilder interface
interface EventBuilder {
  // Content methods
  content(text: string): this
  kind(k: number): this
  
  // Tagging
  tag(tagName: string, ...values: string[]): this
  tagEvent(eventId: string): this
  tagProfile(pubkey: string): this
  
  // Signing & sending
  sign(signer?: Signer): Promise<SignedEventBuilder>
  
  // Advanced
  createdAt(timestamp: number): this
  custom(partial: Partial<NostrEvent>): this
}

interface SignedEventBuilder {
  send(relays?: string[]): Promise<PublishResult>
  toEvent(): NostrEvent
  
  // Batch operations
  addToBatch(batch: EventBatch): this
}

// Usage Examples:
await nostr.events.create()
  .content("Hello Nostr!")
  .tag('p', userPubkey)
  .sign()
  .send();

// Job posting with custom fields
await nostr.events.create()
  .kind(CUSTOM_KIND.JOB_POSTING)
  .content("Senior TypeScript Developer")
  .tag('budget', '5000')
  .tag('remote', 'true')
  .sign()
  .send();
```

### Query Builder API

```typescript
interface QueryBuilder {
  // Filter methods (chainable)
  kinds(kinds: number[]): this
  authors(pubkeys: string[]): this
  tags(tagName: string, values: string[]): this
  since(timestamp: number): this
  until(timestamp: number): this
  limit(count: number): this
  
  // Relationship traversal (unique to Nostr Unchained)
  subgraph(rootEventId: string): SubgraphQueryBuilder
  
  // Execution methods
  execute(): Promise<NostrEvent[]>
  createStore(): Readable<NostrEvent[]>
  stream(): AsyncIterable<NostrEvent>
  
  // Optimization hints
  fromCache(): this
  fromRelays(relayUrls: string[]): this
  requireFresh(): this
}

interface SubgraphQueryBuilder extends QueryBuilder {
  depth(levels: number): this
  includeState(stateTypes: StateType[]): this
  includeReplies(): this
  includeReactions(): this
  includeDeletions(): this
  
  // Advanced relationship analysis
  followThread(): this
  includeProfiles(): this
}

// Usage Examples:

// Basic query mit Svelte store
const eventStore = nostr.query()
  .kinds([1])
  .authors([pubkey])
  .limit(20)
  .createStore();

$: posts = $eventStore; // Auto-reactive UI updates

// Complex relationship query
const jobApplications = await nostr.query()
  .subgraph(jobEventId)
  .depth(2)
  .includeState(['declined', 'accepted'])
  .includeProfiles()
  .execute();

// Real-time conversation updates
const conversationStore = nostr.query()
  .subgraph(rootMessageId)
  .followThread()
  .includeReplies()
  .createStore();
```

### Intelligent Caching API

```typescript
interface CacheManager {
  // Cache inspection
  status(): CacheStatus
  size(): { events: number, profiles: number, relationships: number }
  
  // Cache control
  clear(): Promise<void>
  clearOlderThan(timestamp: number): Promise<void>
  
  // Preloading strategies  
  preload(strategy: PreloadStrategy): Promise<void>
  warmup(pubkeys: string[]): Promise<void>
  
  // Event lifecycle
  invalidate(eventId: string): void
  refresh(eventId: string): Promise<NostrEvent | null>
  
  // Performance monitoring
  getHitRate(): number
  getPerformanceMetrics(): CacheMetrics
}

interface CacheStatus {
  hitRate: number
  memoryUsage: number
  persistedEvents: number
  relationshipGraph: GraphStats
  suggestions: string[]
}

// Usage:
const status = nostr.cache.status();
console.log(`Cache hit rate: ${status.hitRate}%`);
console.log(`Suggestions: ${status.suggestions.join(', ')}`);
```

### DM (Direct Messages) API

```typescript
interface DMManager {
  // Send encrypted DM
  send(params: DMParams): Promise<SendResult>
  
  // Conversation management
  conversation(pubkey: string): Readable<DMMessage[]>
  conversations(): Readable<DMConversation[]>
  
  // Bulk operations
  markAsRead(conversationId: string): Promise<void>
  deleteConversation(pubkey: string): Promise<void>
}

interface DMParams {
  to: string
  content: string
  replyTo?: string
  relays?: string[] // Auto-discovered if omitted
}

interface DMMessage {
  id: string
  from: string
  to: string  
  content: string
  timestamp: number
  read: boolean
  decrypted: boolean
}

// Usage Examples:
// Send DM mit auto-relay discovery
await nostr.dm.send({
  to: recipientPubkey,
  content: "Hello! Interested in the job posting."
});

// Live conversation updates in Svelte
const chatStore = nostr.dm.conversation(pubkey);
$: messages = $chatStore; // Auto-updates when new messages arrive

// All conversations overview
const conversationsStore = nostr.dm.conversations();
$: allChats = $conversationsStore;
```

### Profile Management API

```typescript
interface ProfileManager {
  // Unified profile access (combines kind:0 + kind:10002)
  get(pubkey: string): Promise<UnifiedProfile | null>
  
  // Reactive profile store
  store(pubkey: string): Readable<UnifiedProfile | null>
  
  // Profile updates
  update(updates: ProfileUpdates): Promise<PublishResult>
  
  // Batch profile loading
  loadBatch(pubkeys: string[]): Promise<Map<string, UnifiedProfile>>
  
  // Social graph  
  following(pubkey: string): Promise<string[]>
  followers(pubkey: string): Promise<string[]>
}

interface UnifiedProfile {
  // Basic profile (kind:0)
  name?: string
  about?: string
  picture?: string
  nip05?: string
  
  // Relay information (kind:10002) 
  relays: RelayInfo[]
  
  // Social metrics
  followerCount?: number
  followingCount?: number
  
  // Cache metadata
  lastUpdated: number
  isStale: boolean
}

// Usage:
// Get complete profile (includes relays)
const profile = await nostr.profile.get(pubkey);
console.log(`${profile.name} uses ${profile.relays.length} relays`);

// Reactive profile in Svelte component
const profileStore = nostr.profile.store(pubkey);
$: userProfile = $profileStore;
```

### Relay Pool Management

```typescript
interface RelayManager {
  // Connection management
  connect(relayUrl: string): Promise<RelayConnection>
  disconnect(relayUrl: string): Promise<void>
  
  // Health monitoring
  getHealthStatus(): RelayHealthMap
  
  // Auto-discovery
  discoverRelays(pubkey: string): Promise<string[]>
  
  // Load balancing
  getBestRelays(purpose: RelayPurpose): string[]
  
  // Performance optimization
  getMetrics(): RelayMetrics[]
}

interface RelayConnection {
  url: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  latency: number
  successRate: number
  lastError?: Error
}

// Usage meist transparent:
// Relays werden automatisch discovered und managed
// Power users können aber auch manuell eingreifen
const health = nostr.relays.getHealthStatus();
const slow = health.filter(r => r.latency > 1000);
```

## Configuration API

```typescript
interface NostrConfig {
  // Caching strategy
  caching?: {
    strategy: 'memory' | 'hybrid' | 'persistent'
    maxEvents?: number
    evictionPolicy?: 'lru' | 'fifo' | 'smart'
  }
  
  // Relay configuration
  relays?: {
    autoDiscover?: boolean
    fallbacks?: string[]
    maxConnections?: number
    timeout?: number
  }
  
  // Signing strategy
  signing?: {
    strategy: 'nip07-first' | 'private-key' | 'external'
    privateKey?: string
    signer?: ExternalSigner
  }
  
  // Performance tuning
  performance?: {
    bundleSize?: 'minimal' | 'standard' | 'full'
    preload?: PreloadStrategy
    backgroundSync?: boolean
  }
}
```

## Event/Callback API

### Store-Based Subscriptions

```typescript
// Alle query results können als Svelte stores konsumiert werden
const eventStore = nostr.query().kinds([1]).createStore();

// Store hat standard Svelte interface
interface Readable<T> {
  subscribe(subscriber: (value: T) => void): () => void
}

// Error handling in stores
const storeWithErrors = nostr.query()
  .kinds([1])
  .createStore({
    onError: (error) => console.error('Query failed:', error),
    retryStrategy: 'exponential-backoff'
  });
```

### Event Lifecycle Hooks

```typescript
// Global event listeners
nostr.on('event:received', (event: NostrEvent) => {
  console.log('New event cached:', event.id);
});

nostr.on('relay:connected', (relayUrl: string) => {
  console.log('Connected to relay:', relayUrl);
});

nostr.on('cache:updated', (stats: CacheStats) => {
  if (stats.evicted > 0) {
    console.log(`Cache evicted ${stats.evicted} old events`);
  }
});
```

## Usage Patterns

### Getting Started (First 5 Minutes)

```typescript
// 1. Install & Import
import { NostrUnchained } from '@nostr-unchained/core';

// 2. Initialize (zero config)
const nostr = new NostrUnchained();

// 3. Create & send first event
await nostr.events.create()
  .content("Hello Nostr from Unchained!")
  .sign() // Auto-detects Alby/NIP-07
  .send(); // Auto-discovers relays

// 4. Query & display in Svelte
const recentPosts = nostr.query()
  .kinds([1])
  .limit(10)
  .createStore();

// In Svelte component:
// $: posts = $recentPosts;
```

### Common Use Cases

```typescript
// Job Platform Example
const jobPosting = await nostr.events.create()
  .kind(JOB_KIND)
  .content("Senior TypeScript Developer - Remote")
  .tag('budget', '5000')
  .tag('skills', 'typescript', 'svelte', 'nostr')
  .sign()
  .send();

// Track applications
const applications = nostr.query()
  .subgraph(jobPosting.id)
  .includeState(['applied', 'declined', 'accepted'])
  .createStore();

// Social Media Example  
const userFeed = nostr.query()
  .kinds([1])
  .authors(followingList)
  .since(oneDayAgo)
  .createStore();

// DM Example
const chatStore = nostr.dm.conversation(friendPubkey);
```

### Advanced Scenarios

```typescript
// Complex relationship analysis
const networkAnalysis = await nostr.query()
  .subgraph(influencerPubkey)
  .depth(3)
  .includeReplies()
  .includeReactions()
  .includeProfiles()
  .execute();

// Performance optimization
const optimizedQuery = nostr.query()
  .kinds([1])
  .fromCache() // Try cache first
  .limit(50)
  .createStore({
    background: true, // Update in background
    stale: 300000 // 5 minute stale tolerance
  });

// Batch operations
const batch = nostr.events.createBatch();
events.forEach(e => batch.add(e));
await batch.publish();
```

## Error Handling Philosophy

### Progressive Error Disclosure
- **Silent Degradation**: App works offline/without Nostr
- **Soft Errors**: Warnings für non-critical failures  
- **Hard Errors**: Clear messages für blocking issues
- **Recovery Guidance**: Actionable suggestions für fixes

### Error Categories

```typescript
// Network errors - retry logic built-in
try {
  await nostr.events.create().content("Test").sign().send();
} catch (error) {
  if (error instanceof RelayError) {
    // Automatic retry on other relays
    console.log('Trying fallback relays...');
  }
}

// Signing errors - clear user guidance  
try {
  await event.sign();
} catch (error) {
  if (error instanceof SigningError) {
    console.log('Please check Alby extension connection');
  }
}

// Validation errors - developer-friendly
try {
  await nostr.events.create().content("").send(); // Invalid
} catch (error) {
  // "Event content cannot be empty. Add content with .content('text')"
}
```

## Integration Patterns

### SvelteKit Integration

```typescript
// In SvelteKit routes/+page.server.ts
export const load: PageServerLoad = async ({ params }) => {
  const nostr = new NostrUnchained();
  const event = await nostr.query()
    .id(params.eventId)
    .execute();
    
  return {
    event: event[0],
    // Hydrates client-side store
    initialData: nostr.cache.export()
  };
};

// In +page.svelte
export let data;
const eventStore = nostr.query().id(data.event.id).createStore();
$: event = $eventStore || data.event; // SSR fallback
```

### Progressive Enhancement

```typescript
// Works without Nostr
const localPosts = writable([]);

// Enhanced with Nostr
let nostrPosts: Readable<NostrEvent[]>;
if (browser && 'nostr' in window) {
  nostrPosts = nostr.query().kinds([1]).createStore();
}

// Combined view
$: allPosts = nostrPosts ? $nostrPosts : $localPosts;
```

## Extensibility Model

### Plugin Architecture

```typescript
// Signing plugins
interface SignerPlugin {
  name: string
  detect(): Promise<boolean>
  sign(event: UnsignedEvent): Promise<NostrEvent>
}

nostr.use(new HardwareSignerPlugin());
nostr.use(new MultiSigPlugin());

// Cache plugins
interface CachePlugin {
  name: string
  store(events: NostrEvent[]): Promise<void>
  retrieve(filter: Filter): Promise<NostrEvent[]>
}

nostr.use(new RedisCache());
nostr.use(new CloudflareKVCache());
```

### Custom Event Types

```typescript
// Define custom event structure
interface JobEvent extends NostrEvent {
  kind: 30023
  content: string
  tags: [
    ['budget', string],
    ['skills', ...string[]], 
    ['remote', 'true' | 'false']
  ]
}

// Type-safe event creation
const job = await nostr.events.create<JobEvent>()
  .kind(30023)
  .content(jobDescription)
  .tag('budget', '5000')
  .tag('skills', 'typescript', 'svelte')
  .sign()
  .send();
``` 