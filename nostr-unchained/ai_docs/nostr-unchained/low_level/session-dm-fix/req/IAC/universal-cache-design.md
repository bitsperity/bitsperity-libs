# Universal Caching Architecture - NostrUnchained v2.0

## Problem mit aktueller Architektur

**Aktuell:**
```typescript
// Jede Query startet neue Subscription
const dmStore = nostr.dm.with(pubkey) // Neue subscription
const feedStore = nostr.query().kinds([1]).build() // Neue subscription  
const profileStore = nostr.social.profiles.get(pubkey) // Neue subscription
```

**Problem:**
- DMs gehen nach encryption direkt in DM stores
- Keine zentrale event cache
- Events werden mehrfach gefetched
- Keine universelle view auf alle events

## Universelle Cache-Architektur

### Layer 1: Universal Event Cache (Core)
```typescript
class UniversalEventCache {
  private events = new Map<string, NostrEvent>() // event.id → event
  private encryptedEvents = new Map<string, NostrEvent>() // encrypted event cache
  private decryptedEvents = new Map<string, NostrEvent>() // decrypted event cache
  private subscribers = new Set<(event: NostrEvent) => void>()
  
  // Auto-decryption pipeline
  addEvent(event: NostrEvent): void {
    this.events.set(event.id, event)
    
    // Universal decryption for any encrypted event
    if (event.kind === 1059) { // Gift wrap
      this.processEncryptedEvent(event)
    } else {
      this.notifySubscribers(event)
    }
  }
  
  private async processEncryptedEvent(giftWrap: NostrEvent): Promise<void> {
    this.encryptedEvents.set(giftWrap.id, giftWrap)
    
    try {
      const decrypted = await GiftWrapProtocol.unwrapGiftWrap(giftWrap, this.privateKey)
      if (decrypted) {
        this.decryptedEvents.set(giftWrap.id, decrypted)
        
        // Store both encrypted and decrypted versions
        this.events.set(decrypted.id, decrypted)
        this.notifySubscribers(decrypted)
      }
    } catch (error) {
      // Decryption failed - keep encrypted version only
    }
  }
  
  // Unified query interface
  query(filter: Filter): NostrEvent[] {
    return Array.from(this.events.values()).filter(event => 
      this.matchesFilter(event, filter)
    )
  }
  
  // Subscribe to new events (reactive)
  subscribe(callback: (event: NostrEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
}
```

### Layer 2: Smart Subscription Manager
```typescript
class SmartSubscriptionManager {
  private cache: UniversalEventCache
  private activeFilters = new Set<string>() // Deduplicate subscriptions
  
  // Smart subscription - reuse existing if possible
  async smartSubscribe(filter: Filter): Promise<() => void> {
    const filterKey = this.serializeFilter(filter)
    
    // Check if we already have this subscription
    if (this.activeFilters.has(filterKey)) {
      // Return existing data from cache immediately
      const existingEvents = this.cache.query(filter)
      return this.createCacheSubscription(filter, existingEvents)
    }
    
    // Create new subscription only if needed
    this.activeFilters.add(filterKey)
    const subscription = await this.subscriptionManager.subscribe([filter], {
      onEvent: (event) => this.cache.addEvent(event)
    })
    
    return () => {
      subscription.close()
      this.activeFilters.delete(filterKey)
    }
  }
  
  private createCacheSubscription(filter: Filter, existingEvents: NostrEvent[]): () => void {
    // Return cache-based subscription
    const callback = (event: NostrEvent) => {
      if (this.matchesFilter(event, filter)) {
        // Emit event to subscriber
      }
    }
    
    // Immediately emit existing events
    existingEvents.forEach(callback)
    
    // Subscribe to future events
    return this.cache.subscribe(callback)
  }
}
```

### Layer 3: Specialized Stores (Views on Cache)
```typescript
// DM Store = View auf Universal Cache
class DMStore {
  constructor(private cache: UniversalEventCache, private otherPubkey: string) {}
  
  get messages(): NostrEvent[] {
    // Query cache for DM events
    return this.cache.query({
      kinds: [14], // Kind 14 chat messages  
      authors: [this.myPubkey, this.otherPubkey],
      "#p": [this.myPubkey, this.otherPubkey]
    })
  }
  
  subscribe(callback: (messages: NostrEvent[]) => void): () => void {
    return this.cache.subscribe((event) => {
      if (this.isDMEvent(event)) {
        callback(this.messages) // Always return current state
      }
    })
  }
}

// Feed Store = View auf Universal Cache  
class FeedStore {
  constructor(private cache: UniversalEventCache, private filter: Filter) {}
  
  get events(): NostrEvent[] {
    return this.cache.query(this.filter)
  }
  
  subscribe(callback: (events: NostrEvent[]) => void): () => void {
    return this.cache.subscribe((event) => {
      if (this.matchesFilter(event, this.filter)) {
        callback(this.events)
      }
    })
  }
}

// Profile Store = View auf Universal Cache
class ProfileStore {
  constructor(private cache: UniversalEventCache, private pubkey: string) {}
  
  get profile(): NostrEvent | null {
    const profiles = this.cache.query({
      kinds: [0],
      authors: [this.pubkey]
    })
    return profiles[0] || null
  }
}
```

### Layer 4: Zero-Config API (Developer Interface)
```typescript
class NostrUnchained {
  private cache = new UniversalEventCache()
  private smartSubscriptionManager = new SmartSubscriptionManager(this.cache)
  
  // DM API - uses cache
  async dm(pubkey: string): Promise<DMStore> {
    // Start smart subscription for DM events
    await this.smartSubscriptionManager.smartSubscribe({
      kinds: [1059], // Gift wraps
      "#p": [this.myPubkey]
    })
    
    return new DMStore(this.cache, pubkey)
  }
  
  // Query API - uses cache
  query(): QueryBuilder {
    return new QueryBuilder(this.cache, this.smartSubscriptionManager)
  }
  
  // Universal encrypted event access
  get allEvents(): NostrEvent[] {
    return this.cache.query({}) // All events
  }
  
  get encryptedEvents(): NostrEvent[] {
    return this.cache.getEncryptedEvents()
  }
  
  get decryptedEvents(): NostrEvent[] {
    return this.cache.getDecryptedEvents()
  }
}
```

## Vorteile der neuen Architektur

### 1. Zero Duplicate Subscriptions
```typescript
// Beide nutzen den gleichen cache - keine doppelte subscription
const dm1 = await nostr.dm(pubkey1)
const dm2 = await nostr.dm(pubkey2) // Reuses gift wrap subscription
```

### 2. Universal Event Access
```typescript
// Alle events (encrypted + decrypted) zentral verfügbar
const allEvents = nostr.allEvents
const justDMs = allEvents.filter(e => e.kind === 14)
const justNotes = allEvents.filter(e => e.kind === 1)
```

### 3. Transparent Encryption/Decryption
```typescript
// Entwickler sieht nie encryption - alles transparent gecacht
const messages = dmStore.messages // Automatisch decrypted
const profiles = profileStore.profiles // Aus cache
```

### 4. Reactive Everything
```typescript
// Alle stores sind reactive views auf cache
dmStore.subscribe(messages => console.log('DM update:', messages))
feedStore.subscribe(events => console.log('Feed update:', events))
// Beide triggern bei neuen events automatisch
```

### 5. Efficient Memory Usage
```typescript
// Ein event wird nur einmal gespeichert, aber in vielen views verwendet
const event = { kind: 1, content: "Hello", ... }
// Wird genutzt von: feedStore, globalFeed, authorFeed, etc.
// Aber nur einmal im memory
```

## Implementation Plan

### Phase 1: Universal Event Cache
- Implement core cache with event storage
- Auto-decryption pipeline for gift wraps
- Basic query interface

### Phase 2: Smart Subscription Manager  
- Subscription deduplication
- Filter analysis and optimization
- Cache-based subscriptions

### Phase 3: Specialized Store Views
- Rewrite DMStore as cache view
- Rewrite FeedStore as cache view  
- Profile/Social stores as cache views

### Phase 4: Migration & Testing
- Migrate existing APIs to use cache
- Ensure backward compatibility
- Performance testing and optimization

Diese Architektur löst alle DX-Probleme und macht NostrUnchained extrem effizient mit perfekter Developer Experience.