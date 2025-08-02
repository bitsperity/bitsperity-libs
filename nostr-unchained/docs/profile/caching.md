# Profile API Caching Strategy

The Profile Management API leverages NostrUnchained's **UniversalEventCache** for optimal performance, providing cache-first loading, optimistic updates, and intelligent cache management.

## Cache Architecture

### UniversalEventCache Integration

The Profile API is built on top of NostrUnchained's centralized cache system:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Profile API   │───▶│ ProfileCache     │───▶│ UniversalEvent  │
│                 │    │ Interface        │    │ Cache           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       ▼
         │                        │              ┌─────────────────┐
         │                        │              │ Indexed Storage │
         │                        │              │ • Kind Index    │
         │                        │              │ • Author Index  │
         │                        │              │ • Tag Index     │
         │                        └──────────────│ • LRU Eviction  │
         │                                       └─────────────────┘
         ▼
┌─────────────────┐
│ Relay Network   │
│ (Cache Miss)    │
└─────────────────┘
```

### Cache-First Flow

1. **Cache Hit (Fast Path)**: <10ms response time
2. **Cache Miss (Slow Path)**: Standard relay fetch + cache population
3. **Cache Warming**: Background cache population for better hit rates

## Performance Characteristics

### Response Time Targets

| Operation | Cache Hit | Cache Miss | Target Hit Rate |
|-----------|-----------|------------|-----------------|
| Single Profile | <10ms | <2s | >80% |
| Batch Profiles | <20ms | <3s | >90% |
| Follow Lists | <5ms | <1.5s | >95% |
| Profile Updates | <50ms (optimistic) | <2s | N/A |

### Cache Efficiency Metrics

```typescript
// Access cache performance statistics
const stats = nostr.getCacheStatistics();

console.log('Cache Performance:');
console.log('  Hit Rate:', stats.hitRate.toFixed(1) + '%');
console.log('  Avg Query Time:', stats.avgQueryTime.toFixed(1) + 'ms');
console.log('  Memory Usage:', stats.memoryUsageMB.toFixed(1) + 'MB');
console.log('  Total Events:', stats.totalEvents);
```

## Cache Strategy Implementation

### ProfileCacheInterface

The `ProfileCacheInterface` provides optimized cache queries for profile operations:

```typescript
import { ProfileCacheInterface } from 'nostr-unchained';

// Internal cache interface (automatically used by Profile API)
const cacheInterface = new ProfileCacheInterface(universalCache);

// Single profile lookup
const metadata = cacheInterface.getCachedProfile(pubkey);
if (metadata) {
  console.log('Cache hit:', metadata.name);
} else {
  console.log('Cache miss - fetching from relay...');
}

// Batch profile lookup
const profiles = cacheInterface.getCachedProfiles(['npub1...', 'npub2...']);
console.log('Cached profiles:', profiles.size);

// Follow list lookup
const follows = cacheInterface.getCachedFollowList(pubkey);
if (follows) {
  console.log('Following:', follows.length, 'people');
}
```

### Cache Freshness Management

```typescript
// Check if cached data is recent enough
const hasRecentProfile = cacheInterface.hasRecentProfile(pubkey, 30); // 30 minutes
const hasRecentFollows = cacheInterface.hasRecentFollowList(pubkey, 60); // 60 minutes

if (!hasRecentProfile) {
  console.log('Profile data is stale - refreshing from relay');
  await profileStore.refresh();
}
```

## Optimistic Updates

### Instant UI Updates

Optimistic updates provide immediate UI feedback while relay confirmation happens asynchronously:

```typescript
// UI updates instantly, relay confirmation async
await nostr.profile.edit()
  .name('New Name')
  .publish();

// Timeline:
// t=0ms:    UI shows "New Name" immediately
// t=50ms:   User sees instant update
// t=1500ms: Relay confirms and validates update
```

### Implementation Details

```typescript
class OptimisticProfileBuilder {
  async publish(): Promise<PublishResult> {
    // 1. Update cache immediately (optimistic)
    this.updateCacheOptimistically();
    
    // 2. Notify all subscribers instantly
    this.notifySubscribers();
    
    // 3. Publish to relay asynchronously
    const relayResult = await this.publishToRelay();
    
    // 4. Handle relay confirmation/rejection
    if (!relayResult.success) {
      this.rollbackOptimisticUpdate();
      this.notifyError(relayResult.error);
    }
    
    return relayResult;
  }
}
```

## Cache Management Strategies

### Automatic Cache Warming

The cache system automatically warms itself based on usage patterns:

```typescript
// Profiles accessed frequently are kept in cache longer
// Follow lists have extended cache lifetime (they change less frequently)
// Related profiles are pre-cached based on social graph

class CacheWarmingStrategy {
  async warmCache(seedPubkey: string) {
    // 1. Load seed profile
    const profile = await nostr.profile.get(seedPubkey);
    
    // 2. Load their follow list
    const follows = await nostr.profile.follows.of(seedPubkey);
    
    // 3. Pre-load followed profiles in background
    follows.subscribe(async state => {
      if (!state.loading && state.follows.length > 0) {
        // Batch load in background (no UI blocking)
        const followedPubkeys = state.follows.map(f => f.pubkey).slice(0, 20);
        
        setTimeout(async () => {
          await nostr.profile.batch().get(followedPubkeys).execute();
          console.log('🔥 Cache warmed with', followedPubkeys.length, 'profiles');
        }, 1000);
      }
    });
  }
}
```

### Cache Eviction Policy

The UniversalEventCache uses intelligent eviction strategies:

```typescript
// LRU (Least Recently Used) eviction by default
// Configurable memory limits
// Smart retention for frequently accessed data

const cache = new UniversalEventCache(privateKey, {
  maxEvents: 10000,        // Maximum cached events
  maxMemoryMB: 50,         // Memory limit in MB  
  evictionPolicy: 'lru'    // LRU eviction strategy
});
```

### Manual Cache Control

```typescript
// Force cache refresh for specific profile
await profileStore.refresh();

// Clear entire profile cache (rare, for debugging)
cache.clear();

// Get cache statistics for monitoring
const stats = cache.getStatistics();
if (stats.hitRate < 50) {
  console.warn('Low cache efficiency - consider cache warming');
}
```

## Performance Optimization Techniques

### 1. Batch Loading

```typescript
// ✅ Efficient: Single subscription for multiple profiles
const profiles = await nostr.profile.batch()
  .get(['npub1...', 'npub2...', 'npub3...'])
  .execute();

// ❌ Inefficient: Multiple individual requests
const profile1 = nostr.profile.get('npub1...');
const profile2 = nostr.profile.get('npub2...');
const profile3 = nostr.profile.get('npub3...');
```

### 2. Reactive Store Reuse

```typescript
// ✅ Efficient: Reuse existing stores
const profileStore = nostr.profile.get(pubkey); // Creates store once
profileStore.subscribe(callback1);
profileStore.subscribe(callback2); // Reuses same store

// ❌ Inefficient: Multiple stores for same profile
const store1 = nostr.profile.get(pubkey);
const store2 = nostr.profile.get(pubkey); // Creates duplicate subscription
```

### 3. Smart Prefetching

```typescript
class SmartProfilePrefetcher {
  async prefetchUserNetwork(pubkey: string) {
    // Load user's profile
    const profile = nostr.profile.get(pubkey);
    
    // Prefetch their follows in background
    const followStore = nostr.profile.follows.of(pubkey);
    
    followStore.subscribe(async state => {
      if (state.follows.length > 0) {
        // Prefetch most active followers only
        const recentFollows = state.follows.slice(0, 10);
        
        // Background batch load (doesn't block UI)
        setTimeout(async () => {
          await nostr.profile.batch()
            .get(recentFollows.map(f => f.pubkey))
            .execute();
        }, 500);
      }
    });
  }
}
```

## Cache Debugging and Monitoring

### Performance Monitoring

```typescript
class CacheMonitor {
  private startTime = Date.now();
  
  startMonitoring() {
    setInterval(() => {
      const stats = nostr.getCacheStatistics();
      const uptime = Date.now() - this.startTime;
      
      console.log('📊 Cache Performance Report:');
      console.log('  Uptime:', Math.round(uptime / 1000), 'seconds');
      console.log('  Hit Rate:', stats.hitRate.toFixed(1) + '%');
      console.log('  Avg Query:', stats.avgQueryTime.toFixed(1) + 'ms');
      console.log('  Memory:', stats.memoryUsageMB.toFixed(1) + 'MB');
      console.log('  Events:', stats.totalEvents);
      
      // Performance alerts
      if (stats.hitRate < 60) {
        console.warn('⚠️ LOW CACHE HIT RATE - Consider cache warming');
      }
      
      if (stats.avgQueryTime > 50) {
        console.warn('⚠️ SLOW QUERIES - Check relay performance');
      }
      
      if (stats.memoryUsageMB > 40) {
        console.warn('⚠️ HIGH MEMORY USAGE - Cache eviction active');
      }
      
    }, 60000); // Every minute
  }
}
```

### Cache Debugging

```typescript
// Enable detailed cache logging
const nostr = new NostrUnchained({
  relays: ['wss://relay.example.com'],
  debug: true // Enables cache hit/miss logging
});

// Example debug output:
// 📦 ProfileStore: Cache hit for npub1abc...
// 🔄 ProfileStore: Cache miss for npub1xyz...
// ⚡ ProfileStore: Instant load from cache for npub1def...
```

### Cache Statistics Analysis

```typescript
function analyzeCachePerformance() {
  const stats = nostr.getCacheStatistics();
  
  const analysis = {
    efficiency: stats.hitRate > 80 ? 'Excellent' : 
               stats.hitRate > 60 ? 'Good' : 
               stats.hitRate > 40 ? 'Fair' : 'Poor',
    
    speed: stats.avgQueryTime < 10 ? 'Excellent' :
           stats.avgQueryTime < 50 ? 'Good' :
           stats.avgQueryTime < 100 ? 'Fair' : 'Poor',
    
    memory: stats.memoryUsageMB < 20 ? 'Low' :
            stats.memoryUsageMB < 40 ? 'Normal' : 'High',
    
    recommendations: []
  };
  
  if (stats.hitRate < 60) {
    analysis.recommendations.push('Implement cache warming strategy');
    analysis.recommendations.push('Increase cache size if memory allows');
  }
  
  if (stats.avgQueryTime > 100) {
    analysis.recommendations.push('Check relay performance');
    analysis.recommendations.push('Consider using faster relays');
  }
  
  if (stats.memoryUsageMB > 40) {
    analysis.recommendations.push('Reduce cache size limits');
    analysis.recommendations.push('Implement more aggressive eviction');
  }
  
  return analysis;
}
```

## Best Practices

### 1. Cache-Friendly Code Patterns

```typescript
// ✅ Cache-friendly: Use stores consistently
const profile = nostr.profile.get(pubkey);
profile.subscribe(updateUI);

// ✅ Cache-friendly: Batch operations
const team = await nostr.profile.batch()
  .get(['alice', 'bob', 'charlie'])
  .execute();

// ✅ Cache-friendly: Reuse existing subscriptions
const followStore = nostr.profile.follows.mine();
followStore.subscribe(updateFollowList);
followStore.count.subscribe(updateFollowCount);
```

### 2. Memory Management

```typescript
// ✅ Clean up subscriptions when no longer needed
const unsubscribe = profile.subscribe(callback);
// Later...
unsubscribe();

// ✅ Use appropriate cache limits for your use case
const nostr = new NostrUnchained({
  // Adjust based on your app's memory constraints
  cache: {
    maxEvents: 5000,    // Smaller for mobile apps
    maxMemoryMB: 25,    // Conservative memory usage
    evictionPolicy: 'lru'
  }
});
```

### 3. Performance Testing

```typescript
// Measure cache effectiveness
async function testCachePerformance() {
  const testPubkey = 'npub1test...';
  
  // First access (cache miss)
  console.time('First access');
  const profile1 = nostr.profile.get(testPubkey);
  await waitForProfile(profile1);
  console.timeEnd('First access');
  
  // Second access (cache hit)
  console.time('Second access');
  const profile2 = nostr.profile.get(testPubkey);
  await waitForProfile(profile2);
  console.timeEnd('Second access');
  
  // Should see significant improvement on second access
}
```

The caching system provides significant performance improvements while maintaining data freshness and consistency. By understanding and leveraging these caching strategies, you can build highly responsive Nostr applications with minimal relay dependency.