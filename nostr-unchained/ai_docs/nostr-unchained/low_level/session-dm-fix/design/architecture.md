# DM Fix Session - Elegant System Architecture

## Architecture Overview

### Strategic Decision: Implement Elegant Universal Cache
Based on analysis, we need a truly generic, lightweight solution. One universal cache that handles ALL events (gift wraps get unwrapped), with perfect Query/Sub symmetry and zero special-case logic.

### Elegant 4-Layer Architecture

```
┌─────────────────────────────────────────┐
│ Layer 4: Zero-Config Developer API     │
│ - nostr.query() / nostr.sub()          │  
│ - nostr.dm.with(pubkey)                │
│ - nostr.publishEncrypted(any, to)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Layer 3: Specialized Convenience APIs  │
│ - DMModule (query kind 14)             │
│ - SocialModule (query kinds 1,6,7)     │  
│ - ProfileModule (query kind 0)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Layer 2: Query/Sub Engine              │
│ - Identical fluent APIs                │
│ - query() = cache lookup               │
│ - sub() = live subscription            │
│ - Both return NostrStore               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Layer 1: Universal Event Cache         │
│ - Single cache for all events          │
│ - Auto-unwrap gift wraps (1059)        │
│ - Efficient indexed queries            │
│ - Simple, generic, fast                │
└─────────────────────────────────────────┘
```

## Layer 1: Universal Event Cache (Core)

### The One Cache to Rule Them All
```typescript
class UniversalEventCache {
  private events = new Map<string, NostrEvent>() // ALL events (decrypted)
  private eventsByKind = new Map<number, Set<string>>() // Fast lookup by kind
  private eventsByAuthor = new Map<string, Set<string>>() // Fast lookup by author
  private eventsByTag = new Map<string, Map<string, Set<string>>>() // tag name → value → event IDs
  private subscribers = new Set<(event: NostrEvent) => void>()
  private privateKey: string
  
  constructor(privateKey: string) {
    this.privateKey = privateKey
  }
  
  async addEvent(event: NostrEvent): Promise<void> {
    // Special handling ONLY for gift wraps
    if (event.kind === 1059) {
      const decrypted = await this.unwrapGiftWrap(event)
      if (decrypted) {
        await this.addEvent(decrypted) // Recursive: add unwrapped content
      }
      return // Gift wrap itself NOT stored
    }
    
    // All other events go directly into cache
    this.events.set(event.id, event)
    this.updateIndexes(event)
    this.notifySubscribers(event)
  }
  
  query(filter: Filter): NostrEvent[] {
    // Efficient indexed lookup
    return this.getMatchingEvents(filter)
  }
  
  subscribe(callback: (event: NostrEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  private async unwrapGiftWrap(giftWrap: NostrEvent): Promise<NostrEvent | null> {
    return await GiftWrapProtocol.unwrapGiftWrap(giftWrap, this.privateKey)
  }
  
  private updateIndexes(event: NostrEvent): void {
    // Kind index
    if (!this.eventsByKind.has(event.kind)) {
      this.eventsByKind.set(event.kind, new Set())
    }
    this.eventsByKind.get(event.kind)!.add(event.id)
    
    // Author index
    if (!this.eventsByAuthor.has(event.pubkey)) {
      this.eventsByAuthor.set(event.pubkey, new Set())
    }
    this.eventsByAuthor.get(event.pubkey)!.add(event.id)
    
    // Tag indexes
    event.tags.forEach(tag => {
      const [tagName, tagValue] = tag
      if (!tagValue) return
      
      if (!this.eventsByTag.has(tagName)) {
        this.eventsByTag.set(tagName, new Map())
      }
      const tagMap = this.eventsByTag.get(tagName)!
      
      if (!tagMap.has(tagValue)) {
        tagMap.set(tagValue, new Set())
      }
      tagMap.get(tagValue)!.add(event.id)
    })
  }
  
  private getMatchingEvents(filter: Filter): NostrEvent[] {
    let candidateIds: Set<string> | undefined
    
    // Use indexes for efficient filtering
    if (filter.kinds) {
      const kindSets = filter.kinds.map(k => this.eventsByKind.get(k) || new Set())
      candidateIds = this.unionSets(kindSets)
    }
    
    if (filter.authors) {
      const authorSets = filter.authors.map(a => this.eventsByAuthor.get(a) || new Set())
      const authorIds = this.unionSets(authorSets)
      candidateIds = candidateIds ? this.intersectSets([candidateIds, authorIds]) : authorIds
    }
    
    // Tag filtering
    Object.entries(filter).forEach(([key, values]) => {
      if (key.startsWith('#') && Array.isArray(values)) {
        const tagName = key.slice(1)
        const tagMap = this.eventsByTag.get(tagName)
        if (tagMap) {
          const tagSets = values.map(v => tagMap.get(v) || new Set())
          const tagIds = this.unionSets(tagSets)
          candidateIds = candidateIds ? this.intersectSets([candidateIds, tagIds]) : tagIds
        }
      }
    })
    
    // Convert to events and apply remaining filters
    const events = Array.from(candidateIds || this.events.keys())
      .map(id => this.events.get(id)!)
      .filter(event => this.matchesFilter(event, filter))
    
    // Apply limit
    if (filter.limit) {
      return events.slice(0, filter.limit)
    }
    
    return events
  }
}
```

## Layer 2: Query/Sub Engine

### Perfect Query/Sub Symmetry
```typescript
// Base builder with identical fluent API
class FilterBuilder {
  protected filter: Filter = {}
  
  kinds(kinds: number[]): this {
    this.filter.kinds = kinds
    return this
  }
  
  authors(authors: string[]): this {
    this.filter.authors = authors
    return this
  }
  
  tags(tagName: string, values: string[]): this {
    this.filter[`#${tagName}`] = values
    return this
  }
  
  since(timestamp: number): this {
    this.filter.since = timestamp
    return this
  }
  
  until(timestamp: number): this {
    this.filter.until = timestamp
    return this
  }
  
  limit(count: number): this {
    this.filter.limit = count
    return this
  }
}

// Query builder - cache lookup
class QueryBuilder extends FilterBuilder {
  constructor(private cache: UniversalEventCache) {
    super()
  }
  
  execute(): NostrStore<NostrEvent[]> {
    // Immediate cache lookup
    return new NostrStore(this.cache, this.filter)
  }
}

// Sub builder - live subscription
class SubBuilder extends FilterBuilder {
  private relayUrls: string[] = []
  
  constructor(
    private cache: UniversalEventCache,
    private subscriptionManager: SubscriptionManager
  ) {
    super()
  }
  
  relay(url: string): this {
    this.relayUrls = [url]
    return this
  }
  
  relays(urls: string[]): this {
    this.relayUrls = urls
    return this
  }
  
  async execute(): Promise<NostrStore<NostrEvent[]>> {
    // Start subscription if needed
    const filterSig = this.getFilterSignature()
    
    if (!this.hasActiveSubscription(filterSig)) {
      await this.startSubscription()
    }
    
    // Return store that updates from cache
    return new NostrStore(this.cache, this.filter)
  }
  
  private async startSubscription(): Promise<void> {
    const options = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {}
    
    await this.subscriptionManager.subscribe([this.filter], {
      ...options,
      onEvent: (event) => {
        this.cache.addEvent(event) // All events go to cache
      }
    })
  }
}
```

### Unified NostrStore
```typescript
class NostrStore<T = NostrEvent[]> {
  private cache: UniversalEventCache
  private filter: Filter
  private _data: T
  private subscribers = new Set<(data: T) => void>()
  private unsubscribeCache?: () => void
  
  constructor(cache: UniversalEventCache, filter: Filter) {
    this.cache = cache
    this.filter = filter
    
    // Get immediate data from cache
    this._data = this.cache.query(filter) as T
    
    // Subscribe to future updates
    this.unsubscribeCache = this.cache.subscribe((event) => {
      if (this.matchesFilter(event, filter)) {
        this.updateData()
      }
    })
  }
  
  // Svelte store interface
  subscribe(callback: (data: T) => void): () => void {
    callback(this._data) // Call immediately with current data
    this.subscribers.add(callback)
    
    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0 && this.unsubscribeCache) {
        this.unsubscribeCache()
      }
    }
  }
  
  get current(): T {
    return this._data
  }
  
  private updateData(): void {
    this._data = this.cache.query(this.filter) as T
    this.notifySubscribers()
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this._data))
  }
  
  private matchesFilter(event: NostrEvent, filter: Filter): boolean {
    // Reuse cache's filter matching logic
    const matched = this.cache.query({ ...filter, ids: [event.id] })
    return matched.length > 0
  }
}
```

## Layer 3: Specialized Convenience APIs

### DMModule - Just a Query Wrapper
```typescript
class DMModule {
  constructor(
    private nostr: NostrUnchained,
    private myPubkey: string
  ) {}
  
  // DM conversation is just a query for kind 14
  with(pubkey: string): DMConversation {
    return new DMConversation(this.nostr, this.myPubkey, pubkey)
  }
}

class DMConversation {
  private store: NostrStore<NostrEvent[]>
  
  constructor(
    private nostr: NostrUnchained,
    private myPubkey: string,
    private otherPubkey: string
  ) {
    // DMs are just kind 14 events between two people
    this.store = this.nostr.query()
      .kinds([14])
      .authors([this.myPubkey, this.otherPubkey])
      .tags('p', [this.myPubkey, this.otherPubkey])
      .execute()
  }
  
  // Svelte store interface - delegate to underlying store
  subscribe(callback: (messages: NostrEvent[]) => void): () => void {
    return this.store.subscribe(callback)
  }
  
  get messages(): NostrEvent[] {
    return this.store.current
  }
  
  // Convenience method for sending
  async send(content: string, options?: { subject?: string }): Promise<void> {
    const rumor = {
      kind: 14,
      content,
      tags: [
        ['p', this.otherPubkey],
        ...(options?.subject ? [['subject', options.subject]] : [])
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: this.myPubkey
    }
    
    // Encrypt and send
    await this.nostr.publishEncrypted(rumor, [this.otherPubkey])
  }
}
```

### Other Specialized APIs
```typescript
class SocialModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Social feed is just a query
  feed(authors: string[]): NostrStore<NostrEvent[]> {
    return this.nostr.query()
      .kinds([1, 6]) // notes and reposts
      .authors(authors)
      .limit(50)
      .execute()
  }
  
  // Reactions for a post
  reactions(eventId: string): NostrStore<NostrEvent[]> {
    return this.nostr.query()
      .kinds([7])
      .tags('e', [eventId])
      .execute()
  }
}

class ProfileModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Profile is just a query for kind 0
  get(pubkey: string): NostrStore<NostrEvent | null> {
    const store = this.nostr.query()
      .kinds([0])
      .authors([pubkey])
      .limit(1)
      .execute()
    
    // Transform to single profile
    return {
      subscribe: (callback: (profile: NostrEvent | null) => void) => {
        return store.subscribe(events => callback(events[0] || null))
      },
      current: store.current[0] || null
    }
  }
}
```

## Layer 4: Zero-Config Developer API

### NostrUnchained - Clean and Elegant
```typescript
class NostrUnchained {
  private cache: UniversalEventCache
  private subscriptionManager: SubscriptionManager
  private myPubkey: string
  private privateKey: string
  
  constructor(config: NostrUnchainedConfig = {}) {
    // Initialize cache with private key for auto-decryption
    this.cache = new UniversalEventCache(this.privateKey)
    
    // Initialize subscription manager
    this.subscriptionManager = new SubscriptionManager(this.relayManager)
    
    // Start universal gift wrap subscription
    this.subscribeToGiftWraps()
  }
  
  // Query API - cache lookup
  query(): QueryBuilder {
    return new QueryBuilder(this.cache)
  }
  
  // Subscription API - live data
  sub(): SubBuilder {
    return new SubBuilder(this.cache, this.subscriptionManager)
  }
  
  // DM convenience API
  get dm(): DMModule {
    return new DMModule(this, this.myPubkey)
  }
  
  // Social convenience API
  get social(): SocialModule {
    return new SocialModule(this)
  }
  
  // Profile convenience API
  get profiles(): ProfileModule {
    return new ProfileModule(this)
  }
  
  // Universal encrypted publishing
  async publishEncrypted<T extends NostrEvent>(
    event: T, 
    recipients: string[]
  ): Promise<void> {
    for (const recipient of recipients) {
      const giftWrap = await GiftWrapProtocol.createGiftWrap(
        event,
        recipient,
        this.privateKey
      )
      await this.publishEvent(giftWrap)
    }
  }
  
  // Regular publishing
  async publish(content: string): Promise<PublishResult> {
    const event = {
      kind: 1,
      content,
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: this.myPubkey
    }
    
    const signedEvent = await this.signEvent(event)
    return await this.publishEvent(signedEvent)
  }
  
  private async subscribeToGiftWraps(): Promise<void> {
    // Subscribe to all gift wraps addressed to us
    await this.sub()
      .kinds([1059])
      .tags('p', [this.myPubkey])
      .execute()
    
    // Events automatically flow into cache and get decrypted
  }
}
```

## Elegant Usage Examples

### Basic DM Usage
```typescript
// DMs are just kind 14 queries
const conversation = nostr.dm.with(pubkey)
await conversation.send("Hello!")
$: console.log('Messages:', $conversation.messages)
```

### Query/Sub Symmetry
```typescript
// Cache query - immediate data
const posts = nostr.query().kinds([1]).authors([pubkey]).execute()

// Live subscription - real-time updates
const livePosts = await nostr.sub().kinds([1]).authors([pubkey]).execute()

// Both return the same NostrStore interface!
```

### Universal Encryption
```typescript
// Encrypt ANY event type
const secretNote = { kind: 1, content: "Private thought" }
await nostr.publishEncrypted(secretNote, [recipient])

// Appears in cache as decrypted kind 1
const myNotes = nostr.query().kinds([1]).authors([me]).execute()
```

### Complex Queries
```typescript
// Everything is just a query
const socialFeed = nostr.query()
  .kinds([1, 6, 7])
  .authors(followingList)
  .tags('t', ['bitcoin', 'nostr'])
  .since(yesterday)
  .limit(100)
  .execute()
```

## Implementation Timeline (Revised)

### Phase 1: Universal Event Cache (Day 1)
- [ ] Implement core UniversalEventCache with indexing
- [ ] Auto-decryption pipeline for gift wraps
- [ ] Efficient query implementation with O(log n) lookup
- [ ] Memory management with configurable limits

### Phase 2: Query/Sub Engine (Day 2)
- [ ] Implement QueryBuilder with fluent API
- [ ] Implement SubBuilder with relay options
- [ ] Create unified NostrStore interface
- [ ] Add subscription deduplication (simple)

### Phase 3: Protocol Fixes & Integration (Day 3)
- [ ] Fix NIP44Crypto.validatePayload bug
- [ ] Enhance GiftWrapProtocol for universal events
- [ ] Wire up cache to existing NostrUnchained
- [ ] Start gift wrap subscription on init

### Phase 4: Specialized APIs (Day 4)
- [ ] Implement DMModule as query wrapper
- [ ] Implement SocialModule convenience methods
- [ ] Implement ProfileModule
- [ ] Ensure backward compatibility

### Phase 5: Testing & Optimization (Day 5)
- [ ] All DM tests passing
- [ ] Performance benchmarking
- [ ] Memory usage validation
- [ ] Documentation and examples

## Success Criteria (Revised)

### Functional Requirements
- [ ] All 4 failing DM tests pass
- [ ] Query/Sub API symmetry working
- [ ] Universal encryption for any event type
- [ ] DMs work as simple kind 14 queries

### Performance Requirements
- [ ] <10ms cache query time for 1000 events
- [ ] <50MB memory for 10,000 cached events
- [ ] O(log n) or better query performance
- [ ] Zero duplicate subscriptions for same filter

### Architecture Requirements
- [ ] One universal cache for all events
- [ ] Gift wraps automatically unwrapped
- [ ] Clean separation of layers
- [ ] Generic solution - no special cases

This elegant architecture achieves perfect DX with minimal complexity while maintaining high performance.