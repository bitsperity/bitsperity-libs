# System Design: Clean Architecture for nostr-unchained

## 🎯 Design Philosophy

**Core Principle**: Leverage nostr-unchained's excellent native pub/sub infrastructure directly, eliminating unnecessary abstraction layers that duplicate functionality.

**Architecture Goal**: Transform from complex multi-layer system to elegant, composable library where domain modules are thin wrappers around powerful core infrastructure.

---

## 🏗️ Target Architecture

### Clean Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   ProfileView   │  │ ProfileAvatar   │  │  FollowsList    │ │
│  │     Component   │  │   Component     │  │   Component     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              ProfileModule (Thin Wrapper)                   │ │
│  │                                                             │ │
│  │  get(pubkey) → nostr.query().kinds([0]).authors([pubkey])  │ │
│  │  reactive()  → nostr.sub().kinds([0]).authors([pubkey])    │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ SubscriptionMgr │  │UniversalEventC. │  │   RelayManager  │ │
│  │                 │  │     (Cache)     │  │                 │ │
│  │ • Multi-relay   │  │ • Event storage │  │ • WebSocket     │ │
│  │ • Deduplication │  │ • Gift unwrap   │  │ • Connection    │ │
│  │ • Lifecycle     │  │ • Indexing      │  │ • NIP-01        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 API Design: From Complex to Simple

### Current (Complex) API
```typescript
// Too many steps, too much infrastructure exposure
const profileModule = nostr.profile;
const profileStore = profileModule.get(pubkey);  // Creates ProfileStore
await profileStore.refresh();                    // Manual subscription management
profileStore.subscribe(profile => {              // Manual reactivity
  updateUI(profile);
});
await profileStore.destroy();                    // Manual cleanup
```

### Target (Simple) API
```typescript
// Direct, intuitive, powerful
const profile = await nostr.profile.get(pubkey);           // Promise API
const profileStream = nostr.profile.stream(pubkey);        // Reactive API  
profileStream.subscribe(profile => updateUI(profile));     // Auto-cleanup

// Or even simpler for reactive UI
const profile$ = nostr.profile.reactive(pubkey);           // Svelte store compatible
```

---

## 📋 Detailed Component Design

### 1. Enhanced SubscriptionManager

#### Current Capabilities (Keep)
- ✅ Multi-relay coordination
- ✅ Event deduplication by ID
- ✅ Subscription lifecycle management
- ✅ Performance optimization (>100 events/sec)

#### New Capabilities (Add)
```typescript
interface SubscriptionManager {
  // Enhanced deduplication
  subscribe(filters: Filter[], options?: SubscriptionOptions): Promise<SubscriptionResult>
  
  // New: Smart deduplication with callback multiplexing
  getOrCreateSubscription(filters: Filter[], relays: string[]): SharedSubscription
  
  // New: Subscription analytics
  getSubscriptionStats(): SubscriptionAnalytics
  
  // New: Resource management
  optimizeSubscriptions(): Promise<OptimizationResult>
}

interface SharedSubscription {
  id: string
  addListener(listener: SubscriptionListener): string
  removeListener(listenerId: string): void
  getStats(): { listenerCount: number, eventCount: number, age: number }
}
```

#### Smart Deduplication Algorithm
```typescript
class SmartSubscriptionManager extends SubscriptionManager {
  private sharedSubscriptions = new Map<string, SharedSubscription>()
  
  async getOrCreateSubscription(filters: Filter[], relays: string[]): Promise<SharedSubscription> {
    const key = this.generateFilterHash(filters, relays)
    
    if (this.sharedSubscriptions.has(key)) {
      return this.sharedSubscriptions.get(key)!
    }
    
    // Create new shared subscription
    const shared = new SharedSubscription(key, filters, relays)
    const result = await super.subscribe(filters, {
      onEvent: (event) => shared.broadcast(event),
      onEose: (relay) => shared.notifyEose(relay)
    })
    
    shared.setSubscriptionResult(result)
    this.sharedSubscriptions.set(key, shared)
    return shared
  }
}
```

### 2. Redesigned ProfileModule

#### Core Philosophy
**ProfileModule = Data transformation + Caching, NOT subscription management**

```typescript
export class ProfileModule {
  constructor(
    private nostr: NostrUnchained,
    private cache: UniversalEventCache,
    private subscriptionManager: SubscriptionManager
  ) {}
  
  // PROMISE API - for simple use cases
  async get(pubkey: string): Promise<UserProfile | null> {
    // 1. Try cache first (immediate)
    const cached = this.cache.query({
      kinds: [0],
      authors: [pubkey],
      limit: 1
    })
    
    if (cached.length > 0) {
      return this.parseProfileEvent(cached[0])
    }
    
    // 2. Cache miss - fetch from relays
    return this.fetchFromRelays(pubkey)
  }
  
  // REACTIVE API - for UI components  
  reactive(pubkey: string): Readable<UserProfile | null> {
    return this.createReactiveStore(pubkey)
  }
  
  // STREAM API - for advanced use cases
  stream(pubkey: string): Observable<UserProfile> {
    return this.createEventStream(pubkey)
  }
  
  // Helper methods (private)
  private async fetchFromRelays(pubkey: string): Promise<UserProfile | null> {
    return new Promise((resolve) => {
      let resolved = false
      
      const subscription = this.subscriptionManager.getOrCreateSubscription(
        [{ kinds: [0], authors: [pubkey], limit: 1 }],
        this.nostr.relayManager.connectedRelays
      )
      
      const listenerId = subscription.addListener({
        onEvent: (event) => {
          if (!resolved && event.kind === 0 && event.pubkey === pubkey) {
            resolved = true
            subscription.removeListener(listenerId)
            resolve(this.parseProfileEvent(event))
          }
        },
        onEose: () => {
          if (!resolved) {
            resolved = true
            subscription.removeListener(listenerId)
            resolve(null)
          }
        }
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          subscription.removeListener(listenerId)
          resolve(null)
        }
      }, 5000)
    })
  }
  
  private createReactiveStore(pubkey: string): Readable<UserProfile | null> {
    let currentProfile: UserProfile | null = null
    let subscription: SharedSubscription | null = null
    let listenerId: string | null = null
    
    return {
      subscribe(run: (value: UserProfile | null) => void): () => void {
        // Immediate cache lookup
        const cached = this.cache.query({
          kinds: [0], 
          authors: [pubkey], 
          limit: 1
        })
        
        if (cached.length > 0) {
          currentProfile = this.parseProfileEvent(cached[0])
          run(currentProfile)
        } else {
          run(null)
        }
        
        // Set up live subscription
        this.subscriptionManager.getOrCreateSubscription(
          [{ kinds: [0], authors: [pubkey], limit: 1 }],
          this.nostr.relayManager.connectedRelays
        ).then(sub => {
          subscription = sub
          listenerId = sub.addListener({
            onEvent: (event) => {
              if (event.kind === 0 && event.pubkey === pubkey) {
                const newProfile = this.parseProfileEvent(event)
                if (!this.profilesEqual(currentProfile, newProfile)) {
                  currentProfile = newProfile
                  run(currentProfile)
                }
              }
            }
          })
        })
        
        // Return cleanup function
        return () => {
          if (subscription && listenerId) {
            subscription.removeListener(listenerId)
          }
        }
      }
    }
  }
  
  private parseProfileEvent(event: NostrEvent): UserProfile {
    // Pure data transformation - no side effects
    try {
      const metadata = JSON.parse(event.content)
      return {
        pubkey: event.pubkey,
        metadata,
        lastUpdated: event.created_at,
        eventId: event.id,
        isOwn: false
      }
    } catch (error) {
      throw new Error('Failed to parse profile event')
    }
  }
}
```

### 3. Unified Cache-First Pattern

#### Cache Enhancement Strategy
```typescript
interface EnhancedUniversalEventCache extends UniversalEventCache {
  // Reactive queries
  queryReactive(filter: Filter): Readable<NostrEvent[]>
  
  // Subscription integration
  subscribeToQuery(filter: Filter): Observable<NostrEvent[]>
  
  // Cache warming
  warmCache(filters: Filter[]): Promise<CacheWarmResult>
  
  // Analytics
  getCacheAnalytics(): CacheAnalytics
}

// Usage pattern for all modules
async function getProfileData(pubkey: string): Promise<UserProfile | null> {
  // 1. Cache first (immediate)
  const cached = cache.query({ kinds: [0], authors: [pubkey] })
  if (cached.length > 0) {
    return parseProfile(cached[0])
  }
  
  // 2. Live subscription (if cache miss)
  const subscription = await subscriptionManager.getOrCreateSubscription(
    [{ kinds: [0], authors: [pubkey] }],
    relayManager.connectedRelays
  )
  
  return new Promise(resolve => {
    const listenerId = subscription.addListener({
      onEvent: event => {
        if (event.kind === 0 && event.pubkey === pubkey) {
          subscription.removeListener(listenerId)
          resolve(parseProfile(event))
        }
      }
    })
  })
}
```

---

## 🔄 Migration Strategy

### Phase 1: Foundation (Week 1)
1. **Enhanced SubscriptionManager**: Add smart deduplication with callback multiplexing
2. **Subscription Analytics**: Add monitoring and optimization capabilities
3. **Core Testing**: Ensure enhanced SubscriptionManager maintains all existing functionality

### Phase 2: ProfileModule Redesign (Week 2)  
1. **New ProfileModule**: Implement clean API design
2. **Backward Compatibility**: Keep ProfileStore as deprecated wrapper
3. **ProfileView Migration**: Update ProfileView.svelte to use new API
4. **Testing**: Verify no subscription duplicates

### Phase 3: FollowListModule Redesign (Week 3)
1. **Apply Same Pattern**: Use ProfileModule design for follow lists  
2. **Social Integration**: Ensure SocialModule works with new pattern
3. **Performance Validation**: Measure subscription reduction

### Phase 4: Ecosystem Adoption (Week 4)
1. **DM Module**: Apply cache-first pattern to direct messaging
2. **Documentation**: Update all examples and guides
3. **Performance Monitoring**: Track subscription efficiency improvements

---

## 📊 Success Metrics

### Quantitative Goals
- **Subscription Reduction**: 80% reduction in duplicate subscriptions
- **Memory Usage**: 50% reduction in subscription-related memory usage  
- **API Simplicity**: 70% reduction in lines of code for common patterns
- **Performance**: <100ms response time for cached profile lookups

### Qualitative Goals  
- **Developer Experience**: Simple, intuitive APIs
- **Maintainability**: Clear separation of concerns
- **Reliability**: Robust error handling and cleanup
- **Extensibility**: Easy to add new data types

### Monitoring Dashboard
```typescript
interface ArchitectureMetrics {
  subscriptions: {
    total: number
    unique: number
    duplicatePercentage: number
    avgListenersPerSubscription: number
  }
  
  cache: {
    hitRate: number
    size: number
    memoryUsage: number
  }
  
  performance: {
    avgProfileLoadTime: number
    cacheQueryTime: number
    subscriptionCreationTime: number
  }
}
```

---

## 🧪 Implementation Example

### Before: Complex ProfileStore
```typescript
// 100+ lines of complex subscription management
export class ProfileStore implements Readable<ProfileState> {
  private subscriptionId?: string
  private activeRefreshSubscription?: string
  
  async refresh(): Promise<void> {
    // Complex subscription creation
    // Timeout management
    // State coordination  
    // Error handling
    // Cleanup logic
  }
  
  async startSubscription(): Promise<void> {
    // More subscription management
    // More state tracking
    // More error handling
  }
}
```

### After: Simple ProfileModule
```typescript
// 20 lines of pure data transformation
export class ProfileModule {
  async get(pubkey: string): Promise<UserProfile | null> {
    const cached = this.cache.query({ kinds: [0], authors: [pubkey] })
    return cached.length > 0 
      ? this.parseProfileEvent(cached[0])
      : this.fetchFromRelays(pubkey)
  }
  
  reactive(pubkey: string): Readable<UserProfile | null> {
    return this.createReactiveStore(pubkey)
  }
}
```

### Usage Comparison
```typescript
// Before: Complex setup
const profileModule = nostr.profile
const store = profileModule.get(pubkey)  // Creates ProfileStore
await store.refresh()                     // Manual subscription
store.subscribe(callback)                 // Manual reactivity
await store.destroy()                     // Manual cleanup

// After: Direct and simple
const profile = await nostr.profile.get(pubkey)              // Direct Promise
const stream = nostr.profile.reactive(pubkey)                // Direct reactive
stream.subscribe(callback)                                   // Auto-cleanup
```

---

## 🔒 Quality Assurance

### Architecture Validation
- **Dependency Analysis**: Ensure clean layering with no circular dependencies
- **Interface Compliance**: All modules follow same patterns
- **Performance Benchmarks**: Measure improvements objectively

### Test Strategy
- **Unit Tests**: Each layer tested in isolation
- **Integration Tests**: End-to-end data flow validation  
- **Performance Tests**: Subscription efficiency measurement
- **Compatibility Tests**: Ensure existing code continues working

### Rollback Plan
- **Feature Flags**: Enable/disable new architecture per module
- **Deprecation Warnings**: Guide migration with clear messaging
- **Dual APIs**: Support both old and new APIs during transition
- **Monitoring**: Real-time metrics to detect issues

---

## 🚀 Implementation Roadmap

### Immediate Actions (Next 2 Days)
1. ✅ Document problems and design
2. 🔄 Implement enhanced SubscriptionManager with smart deduplication
3. 🔄 Create new ProfileModule with clean API
4. 🔄 Update ProfileView to use new API

### Short Term (Next 2 Weeks)  
1. Apply same pattern to FollowListModule
2. Migrate all profile-related components
3. Add comprehensive testing
4. Performance optimization

### Long Term (Next Month)
1. Extend pattern to DMModule and SocialModule
2. Complete ecosystem migration
3. Documentation and examples
4. Community feedback integration

**Result**: Transform nostr-unchained from complex multi-layer system to elegant, composable library that showcases the power of its excellent core infrastructure.