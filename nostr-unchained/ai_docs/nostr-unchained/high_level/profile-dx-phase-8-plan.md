# Phase 8: Cache Optimization & Performance - Implementation Plan

## Problem Analysis

**Current State**: Profile Module macht direkte `SubscriptionManager` calls
**Issue**: Der zentrale `UniversalEventCache` wird nicht genutzt - verschenkte Performance!

```typescript
// CURRENT (inefficient):
ProfileStore -> SubscriptionManager -> Relay -> Parse Events

// OPTIMIZED (Phase 8):
ProfileStore -> UniversalEventCache -> Instant Results (if cached)
              -> SubscriptionManager -> Relay (only if needed)
```

## Cache Architecture in NostrUnchained

Der `UniversalEventCache` ist bereits perfekt für Profile:
- **Indexes alle events** by kind, author, tags  
- **Kind 0 (profiles)** und **Kind 3 (follow lists)** landen automatisch im Cache
- **O(log n) queries** durch effiziente Indexes
- **LRU eviction** für Memory Management
- **Statistics tracking** für Monitoring

## Phase 8 Deliverables

### 1. Cache-Aware ProfileStore 
**Problem**: `ProfileStore` macht immer neue Subscriptions
**Solution**: Check cache first, nur bei Cache Miss relay subscription

### 2. Cache-Aware FollowListStore
**Problem**: `FollowListStore` macht immer neue Subscriptions  
**Solution**: Check cache first für kind 3 events

### 3. Optimistic Updates
**Problem**: Updates sind langsam (warten auf relay confirmation)
**Solution**: Cache update sofort, relay update asynchron

### 4. Cache Invalidation Strategy
**Problem**: Stale cached profiles
**Solution**: TTL-basierte invalidation + manual refresh

### 5. Performance Monitoring
**Problem**: Keine visibility über cache efficiency
**Solution**: Cache hit/miss metrics + performance dashboard

## Implementation Strategy

### Step 1: Cache Interface für Profile Module
```typescript
interface ProfileCacheInterface {
  // Profile queries (kind 0)  
  getCachedProfile(pubkey: string): ProfileMetadata | null;
  getCachedProfiles(pubkeys: string[]): Map<string, ProfileMetadata>;
  
  // Follow list queries (kind 3)
  getCachedFollowList(pubkey: string): Follow[] | null;
  
  // Cache updates (optimistic)
  updateProfileCache(pubkey: string, metadata: ProfileMetadata): void;
  updateFollowListCache(pubkey: string, follows: Follow[]): void;
  
  // Cache statistics
  getProfileCacheStats(): ProfileCacheStats;
}
```

### Step 2: Hybrid Cache-Relay Strategy
```typescript
// Smart Profile Fetching:
async getProfile(pubkey: string): Promise<ProfileMetadata> {
  // 1. Check cache first  
  const cached = cache.getCachedProfile(pubkey);
  if (cached && !isStale(cached)) {
    return cached; // INSTANT
  }
  
  // 2. Cache miss: fetch from relay
  const fromRelay = await subscriptionManager.queryProfile(pubkey);
  
  // 3. Update cache
  cache.updateProfileCache(pubkey, fromRelay);
  
  return fromRelay;
}
```

### Step 3: Optimistic Updates
```typescript
async updateProfile(metadata: ProfileMetadata): Promise<void> {
  // 1. Update cache immediately (optimistic)
  cache.updateProfileCache(myPubkey, metadata);
  
  // 2. Notify all ProfileStore subscribers (instant UI update)
  this.notifySubscribers(metadata);
  
  // 3. Publish to relay (asynchronous)
  relayManager.publishEvent(profileEvent).catch(error => {
    // 4. Rollback cache on failure
    cache.invalidateProfile(myPubkey);
    this.notifyError(error);
  });
}
```

## Performance Targets

### Cache Hit Rates (Success Criteria)
- **Profile fetches**: >80% cache hit rate after warmup
- **Follow lists**: >90% cache hit rate (less frequent changes)
- **Batch operations**: >95% cache hit rate (bulk queries)

### Response Times (Success Criteria)  
- **Cached profile**: <10ms response time
- **Cache miss**: <2s response time (same as before)
- **Optimistic updates**: <50ms UI update time

### Memory Efficiency (Success Criteria)
- **Profile cache**: <5MB memory usage for 1000 profiles
- **Follow list cache**: <2MB memory usage for 1000 follow lists
- **Cache overhead**: <20% of total event cache size

## Testing Strategy

### Cache Hit Rate Tests
```typescript
// Test 1: Profile cache efficiency
const profile1 = await nostr.profile.get('npub1...'); // Cache miss
const profile2 = await nostr.profile.get('npub1...'); // Cache hit (should be instant)

// Test 2: Batch cache efficiency  
const batch1 = await nostr.profile.batch().get(['npub1...', 'npub2...']); // Cache miss
const batch2 = await nostr.profile.batch().get(['npub1...', 'npub2...']); // Cache hit
```

### Optimistic Update Tests
```typescript
// Test 3: UI responsiveness
const startTime = Date.now();
await nostr.profile.edit().name('New Name').publish();
const uiUpdateTime = Date.now() - startTime; // Should be <50ms
```

### Cache Invalidation Tests  
```typescript
// Test 4: Stale data handling
// Simulate external profile update, verify cache invalidation
```

## Cache Integration Points

### 1. ProfileModule Integration
```typescript
// Add cache parameter to ProfileModule constructor
constructor(config: ProfileModuleConfig & { cache: UniversalEventCache })
```

### 2. NostrUnchained Integration
```typescript
// Pass cache to ProfileModule in NostrUnchained.ts
get profile(): ProfileModule {
  return new ProfileModule({
    cache: this.cache, // ← NEW: Pass cache instance
    // ... existing config
  });
}
```

### 3. Backward Compatibility
- **All existing APIs unchanged** 
- **Same public interfaces**
- **Only internal implementation optimized**

## Success Metrics

### Development Success
- [ ] All existing tests still pass
- [ ] New cache-optimized implementation
- [ ] Cache hit rate >80% for common operations
- [ ] UI updates <50ms for optimistic operations

### Production Success  
- [ ] Profile loading feels instant (cached)
- [ ] Follow list operations are snappy
- [ ] Memory usage stays reasonable
- [ ] Cache statistics show good efficiency

## Implementation Timeline

- **2 hours**: Cache interface + ProfileStore optimization
- **1 hour**: FollowListStore cache integration
- **1 hour**: Optimistic updates implementation  
- **1 hour**: Testing and validation against real relay

**Total**: 5 hours for complete cache optimization

This will make the profile system blazingly fast! 🔥