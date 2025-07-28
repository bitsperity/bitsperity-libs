# Elegante Universal Architecture - NostrUnchained v2.0

## Das Problem mit meinem vorherigen Design

**Zu komplex, nicht generisch genug:**
- Separate "encryptedEvents" und "decryptedEvents" caches → unnötige Komplexität
- "SmartSubscriptionManager" → Overengineering
- Spezielle DM-Logik → nicht generisch
- Zu viele Layer → Performance-Overhead

## Elegante, generische Lösung

### Kernprinzip: Ein universeller Event Cache
```typescript
class UniversalEventCache {
  private events = new Map<string, NostrEvent>() // ALLE events (decrypted)
  private eventsByKind = new Map<number, Set<string>>() // Fast kind lookup
  private eventsByAuthor = new Map<string, Set<string>>() // Fast author lookup
  private eventsByTag = new Map<string, Set<string>>() // Fast tag lookup
  private subscribers = new Set<(event: NostrEvent) => void>()
  
  async addEvent(event: NostrEvent): Promise<void> {
    // Spezial-Behandlung nur für gift wraps
    if (event.kind === 1059) {
      const decrypted = await this.unwrapGiftWrap(event)
      if (decrypted) {
        this.addEvent(decrypted) // Recursive: decrypted event goes into cache
      }
      return // Gift wrap selbst NICHT in cache
    }
    
    // Alle anderen events direkt in cache
    this.events.set(event.id, event)
    this.updateIndexes(event)
    this.notifySubscribers(event)
  }
  
  query(filter: Filter): NostrEvent[] {
    // Efficient indexed lookup
    return this.getMatchingEvents(filter)
  }
}
```

### Perfekte Query/Sub Symmetrie
```typescript
// IDENTISCHE Fluent API
nostr.query().kinds([1]).authors([pubkey]).limit(10) // Gibt Store zurück
nostr.sub().kinds([1]).authors([pubkey]).limit(10).relay('wss://relay.com') // Live subscription

// Query = Cache lookup, gibt sofort Store zurück
// Sub = Relay subscription, gibt live updating Store zurück
```

### Unified Store Interface
```typescript
class NostrStore<T = NostrEvent[]> {
  private cache: UniversalEventCache
  private filter: Filter
  private _data: T
  private subscribers = new Set<(data: T) => void>()
  
  constructor(cache: UniversalEventCache, filter: Filter) {
    this.cache = cache
    this.filter = filter
    
    // Immediate data from cache
    this._data = this.cache.query(filter) as T
    
    // Subscribe to future updates
    this.cache.subscribe((event) => {
      if (this.matchesFilter(event, filter)) {
        this.updateData()
      }
    })
  }
  
  // Svelte store interface
  subscribe(callback: (data: T) => void): () => void {
    callback(this._data) // Immediate
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  get current(): T {
    return this._data
  }
}
```

## Perfekte Schichtenarchitektur

### Layer 1: Universal Event Cache (Core)
```typescript
// Nur das absolute Minimum
class UniversalEventCache {
  // Ein Cache für ALLE events (außer gift wraps werden entschlüsselt)
  addEvent(event: NostrEvent): Promise<void>
  query(filter: Filter): NostrEvent[]
  subscribe(callback: (event: NostrEvent) => void): () => void
}
```

### Layer 2: Query/Sub Engine  
```typescript
// Identische API, verschiedene Datenquellen
class QueryBuilder {
  kinds(kinds: number[]): QueryBuilder
  authors(authors: string[]): QueryBuilder
  tags(name: string, values: string[]): QueryBuilder
  since(timestamp: number): QueryBuilder
  limit(count: number): QueryBuilder
  
  // Query = immediate cache lookup
  execute(): NostrStore<NostrEvent[]>
}

class SubBuilder extends QueryBuilder {
  relay(url: string): SubBuilder
  relays(urls: string[]): SubBuilder
  
  // Sub = live relay subscription
  execute(): NostrStore<NostrEvent[]>
}
```

### Layer 3: Specialized APIs
```typescript
// DM ist nur eine query auf kind 14
class DMModule {
  with(pubkey: string): NostrStore<NostrEvent[]> {
    return this.nostr.query()
      .kinds([14])
      .authors([this.myPubkey, pubkey])
      .tags('p', [this.myPubkey, pubkey])
      .execute()
  }
  
  // Aber mit convenience methods
  async send(pubkey: string, content: string): Promise<void> {
    const rumor = { kind: 14, content, tags: [['p', pubkey]] }
    const giftWrap = await createGiftWrap(rumor, pubkey)
    await this.nostr.publish(giftWrap)
  }
}
```

### Layer 4: Zero-Config API
```typescript
class NostrUnchained {
  private cache = new UniversalEventCache()
  
  // Query API
  query(): QueryBuilder {
    return new QueryBuilder(this.cache)
  }
  
  // Subscription API  
  sub(): SubBuilder {
    return new SubBuilder(this.cache, this.relayManager)
  }
  
  // Convenience APIs
  get dm(): DMModule { return new DMModule(this) }
  get social(): SocialModule { return new SocialModule(this) }
  get profiles(): ProfileModule { return new ProfileModule(this) }
}
```

## Elegante Verwendung

### Basis: Query/Sub Symmetrie
```typescript
// Cache query - immediate data
const posts = nostr.query().kinds([1]).authors([pubkey]).execute()
$: console.log('Cached posts:', $posts)

// Live subscription - real-time updates  
const livePosts = nostr.sub().kinds([1]).authors([pubkey]).execute()
$: console.log('Live posts:', $livePosts)

// Relay-specific subscription
const relayPosts = nostr.sub().kinds([1]).relay('wss://relay.damus.io').execute()
```

### DMs als kind 14 query
```typescript
// DM conversation - einfach kind 14 query
const conversation = nostr.query()
  .kinds([14])
  .authors([myPubkey, otherPubkey])
  .tags('p', [myPubkey, otherPubkey])
  .execute()

// Oder convenience API
const dmStore = nostr.dm.with(otherPubkey) // Macht dasselbe wie oben
await dmStore.send("Hello!") // Convenience method
```

### Universal encrypted events
```typescript
// Beliebige events können encrypted werden
const secretNote = { kind: 1, content: "Secret thought" }
await nostr.publishEncrypted(secretNote, [recipient])

// Erscheint automatisch im cache als kind 1 (decrypted)
const myNotes = nostr.query().kinds([1]).authors([myPubkey]).execute()
// Enthält sowohl public als auch decrypted secret notes!
```

## Performance-Optimierungen

### Effiziente Indexierung
```typescript
class UniversalEventCache {
  private eventsByKind = new Map<number, Set<string>>()
  private eventsByAuthor = new Map<string, Set<string>>()
  private eventsByTag = new Map<string, Set<string>>() // "p:pubkey", "t:tag"
  
  query(filter: Filter): NostrEvent[] {
    // O(1) oder O(log n) lookup durch Indexe
    let candidateIds: Set<string> | undefined
    
    if (filter.kinds) {
      candidateIds = this.intersectSets(
        filter.kinds.map(kind => this.eventsByKind.get(kind) || new Set())
      )
    }
    
    if (filter.authors) {
      const authorIds = this.intersectSets(
        filter.authors.map(author => this.eventsByAuthor.get(author) || new Set())
      )
      candidateIds = candidateIds ? this.intersectSets([candidateIds, authorIds]) : authorIds
    }
    
    // Dann nur final filter auf kleine candidate set
    return Array.from(candidateIds || this.events.keys())
      .map(id => this.events.get(id)!)
      .filter(event => this.matchesFilter(event, filter))
  }
}
```

### Smart Subscription Deduplication (minimal)
```typescript
class SubBuilder {
  execute(): NostrStore<NostrEvent[]> {
    const filterSig = this.getFilterSignature()
    
    // Wenn wir bereits diese subscription haben, reuse
    if (this.activeSubscriptions.has(filterSig)) {
      return new NostrStore(this.cache, this.filter)
    }
    
    // Sonst neue subscription starten
    this.startSubscription(this.filter)
    return new NostrStore(this.cache, this.filter)
  }
}
```

## Warum das elegant ist

### 1. Generisch und erweiterbar
```typescript
// JEDER event type funktioniert sofort
const articles = nostr.query().kinds([30023]).execute()
const reactions = nostr.query().kinds([7]).execute()
const profiles = nostr.query().kinds([0]).execute()

// Encryption funktioniert für ALLES
await nostr.publishEncrypted(anyEvent, recipients)
```

### 2. Perfekte DX durch Symmetrie
```typescript
// Gleiche API, verschiedene Verhalten
.query() // = cache lookup
.sub()   // = live subscription

// Beide geben NostrStore zurück → identisches Interface
```

### 3. Lightweight und performant
```typescript
// Ein Cache, O(1) lookup, minimale Abstraktion
// Keine "SmartSubscriptionManager" Komplexität
// Keine separaten encrypted/decrypted caches
```

### 4. Zero-Config aber mächtig
```typescript
// Einfach
const dms = nostr.dm.with(pubkey)

// Aber auch mächtig für advanced use cases
const complexQuery = nostr.query()
  .kinds([1, 6])
  .authors(followingList)
  .tags('t', ['bitcoin'])
  .since(yesterday)
  .execute()
```

Das ist die wirklich elegante, generische Lösung! Ein universeller Cache, perfekte Query/Sub Symmetrie, und DMs sind einfach kind 14 queries.