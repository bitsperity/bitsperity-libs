# Architecture Problem Analysis: nostr-unchained

## 🚨 Core Problem Statement

**The nostr-unchained library suffers from architectural duplication and layering violations that create subscription leaks, maintenance complexity, and violated design principles.**

**Immediate Trigger**: Duplicate subscriptions when switching between Profile and Explorer tabs, leading to resource waste and degraded performance.

**Root Cause**: Multiple abstraction layers implementing their own subscription logic instead of leveraging the powerful native pub/sub infrastructure.

---

## 📊 Problem Evidence

### Subscription Leak Analysis (Current Session)
```
Before Fix: Multiple duplicate subscriptions per pubkey
After Partial Fix: Still 2 duplicate subscriptions for kind [3] (follow lists)

Active Subscriptions Observed:
#899b43da16aa5a9e - kind [3] - Age: 23s ❌ 
#2d080f36dae2c486 - kind [0] - Age: 13s ✅ (ProfileStore fixed)
#f83c33042f256e48 - kind [3] - Age: 12s ❌ (FollowListStore duplicate)
```

### Performance Impact
- **Memory waste**: Each duplicate subscription maintains separate state, callbacks, and relay tracking
- **Network overhead**: Multiple identical REQ messages sent to relays
- **CPU cycles**: Redundant event processing and state updates
- **User experience**: Unnecessary loading states and delayed UI updates

---

## 🏗️ Architectural Analysis

### Current (Problematic) Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Component  │    │   UI Component   │    │   UI Component  │
│  (ProfileView)  │    │ (ProfileAvatar)  │    │  (FollowsList)  │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          ▼                      ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  ProfileStore   │    │  ProfileStore    │    │ FollowListStore │
│  (subscription) │    │  (subscription)  │    │ (subscription)  │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              SubscriptionManager (Base Layer)                   │
│              RelayManager + UniversalEventCache                │
└─────────────────────────────────────────────────────────────────┘
```

**Problems Identified:**
1. **Layer Violation**: Domain stores (ProfileStore, FollowListStore) re-implement subscription logic
2. **Duplication**: Multiple stores for same data create identical subscriptions
3. **Tight Coupling**: Stores directly depend on SubscriptionManager instead of using higher-level abstractions
4. **Resource Waste**: Each store maintains separate subscription state and lifecycle

### Design Principles Violated

#### 1. **DRY (Don't Repeat Yourself)**
- ProfileStore has subscription logic: `refresh()` + `startSubscription()`
- FollowListStore has identical pattern: `refresh()` + `startSubscription()`
- DMConversation has similar patterns
- Each implements: filtering, state management, error handling, timeouts

#### 2. **Single Responsibility Principle**
- **ProfileStore responsibilities**: Profile parsing, NIP-05 verification, state management, subscription lifecycle, caching logic
- **Should be**: Profile data transformation only

#### 3. **Separation of Concerns**
- **Data access logic** mixed with **business logic** mixed with **state management**
- **Subscription management** implemented at wrong abstraction level

#### 4. **Interface Segregation**
- Modules depend on entire SubscriptionManager when they only need event streams
- Complex APIs exposed when simple reactive patterns would suffice

---

## 🔍 Detailed Problem Categorization

### A. Subscription Management Problems

#### A1. Duplicate Subscription Creation
**Location**: `ProfileStore.ts:72-90`, `FollowListStore.ts:70-148`
```typescript
// Both implement nearly identical patterns:
async refresh(): Promise<void> {
  // Create temporary subscription
  const subscriptionResult = await this.config.subscriptionManager.subscribe([filter], {
    onEvent: async (event) => { /* handle */ },
    onEose: () => { /* handle */ }
  });
  
  // Start permanent subscription
  if (!this.subscriptionId) {
    this.startSubscription();
  }
}
```

**Impact**: 2 subscriptions per pubkey instead of 1

#### A2. Inconsistent Lifecycle Management
- **ProfileStore**: Uses both temporary (3s timeout) and permanent subscriptions
- **FollowListStore**: Same pattern but different timeout handling
- **DMConversation**: Yet another variant of subscription lifecycle
- **Result**: Complex debugging, resource leaks, inconsistent behavior

#### A3. Subscription State Fragmentation
- Each store maintains its own subscription state: `subscriptionId`, `activeRefreshSubscription`
- No centralized view of active subscriptions per data type
- Difficult to implement global subscription policies (rate limiting, deduplication)

### B. Caching Architecture Problems

#### B1. Cache Bypass Patterns
**Evidence from codebase analysis:**
```typescript
// Good: UniversalEventCache as single source of truth
this.config.cache.query(filter) // ✅ Fast, consistent

// Bad: Direct subscription bypass
this.config.subscriptionManager.subscribe(filter, callbacks) // ❌ Duplicate state
```

**Issues**:
- Some modules query cache first, others subscribe directly to relays
- Inconsistent data freshness guarantees
- Cache warming strategies not standardized

#### B2. Event Processing Duplication
- **UniversalEventCache**: Sophisticated event deduplication, indexing, and gift wrap handling
- **ProfileStore**: Re-implements event parsing and validation
- **FollowListStore**: Re-implements follow list parsing
- **Result**: Code duplication, inconsistent error handling, harder maintenance

### C. API Design Problems

#### C1. Abstraction Level Mismatch
```typescript
// High-level intent
const profile = await nostr.profile.get(pubkey);

// Low-level implementation leaked to domain layer
const store = new ProfileStore({
  pubkey,
  subscriptionManager,
  cache,
  debug
});
await store.refresh();
```

**Problem**: Domain layer exposed to infrastructure concerns

#### C2. Mixed Paradigms
```typescript
// Reactive pattern (good)
profileStore.subscribe(profile => updateUI(profile))

// Callback pattern (inconsistent)
subscriptionManager.subscribe(filter, { onEvent: callback })

// Promise pattern (mixed with reactive)
await store.refresh()
```

**Result**: Developer confusion, inconsistent patterns, harder testing

### D. Module Coupling Problems

#### D1. Circular Dependencies
**Evidence from dependency analysis:**
```
DMModule → NostrUnchained (circular)
EventsModule → NostrUnchained (circular)
ProfileModule → SubscriptionManager → RelayManager
```

#### D2. Cross-Module State Dependencies
- ProfileModule creates ProfileStore instances
- SocialModule references profile data
- DMModule needs profile information
- **Result**: Complex initialization order, race conditions

---

## 🎯 Success Criteria for Solution

### Immediate Goals
1. **Eliminate subscription duplicates**: 1 subscription per unique filter+relay combination
2. **Simplify ProfileModule**: Remove ProfileStore, use direct nostr-unchained APIs
3. **Consistent patterns**: All modules use same subscription approach

### Long-term Goals
1. **True layered architecture**: Clear separation between infrastructure, domain, and presentation
2. **Single subscription path**: All data access through UniversalEventCache
3. **Reactive-first design**: Consistent reactive patterns across all modules
4. **Minimal APIs**: Simple, focused interfaces for each layer

### Quality Gates
1. **Performance**: No duplicate subscriptions in DevExplorer
2. **Architecture**: Dependency analysis shows proper layering
3. **Maintainability**: Reduced code duplication (>50% reduction in subscription logic)
4. **Developer Experience**: Simple, consistent APIs for common patterns

---

## 🔧 Impact Assessment

### Code Areas Affected
- **High Impact**: `src/profile/` - Complete restructure of ProfileModule
- **Medium Impact**: `src/subscription/` - Enhanced deduplication logic
- **Low Impact**: `src/cache/` - Potential query API improvements

### Migration Requirements
- **Breaking Changes**: ProfileStore public API changes
- **Compatibility**: Maintain ProfileModule.get() interface
- **Documentation**: Update all profile-related examples

### Risk Mitigation
- **Incremental approach**: Fix ProfileStore first, then FollowListStore
- **Test coverage**: Ensure all existing tests pass
- **Rollback plan**: Keep old ProfileStore as deprecated fallback

---

## 📚 Reference Architecture Examples

### Good Examples in Codebase
```typescript
// UniversalEventCache - excellent single responsibility
cache.addEvent(event)  // Simple, focused API
cache.query(filter)    // Fast, indexed lookups

// Query Builder - clean fluent interface  
nostr.query().kinds([1]).authors([pubkey]).execute()
```

### Anti-Patterns to Eliminate
```typescript
// ProfileStore - too many responsibilities
const store = new ProfileStore(config)
await store.refresh()           // Subscription management
store.parseProfileEvent(event) // Event parsing
store.checkNip05Verification()  // External verification
store.subscribe(callback)       // Reactive state
```

---

## 🚀 Solution Preview

**Next Steps**: Create `system_design.md` with:
1. Clean architecture layers
2. Unified subscription patterns  
3. ProfileModule redesign
4. Migration strategy
5. Implementation roadmap

The goal: Transform nostr-unchained from a complex multi-layer system to an elegant, composable library that leverages its excellent core infrastructure without unnecessary abstraction overhead.