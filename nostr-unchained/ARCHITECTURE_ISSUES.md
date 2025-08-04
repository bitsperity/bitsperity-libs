# Nostr Unchained - Architecture Issues & Refactoring Plan

## 🏗️ Architecture Overview

Nostr Unchained follows a **3-Layer Architecture**:

1. **Layer 1 (Cache)**: `UniversalEventCache` - Central cache for ALL events
2. **Layer 2 (Query/Sub)**: `QueryBuilder`/`SubBuilder` - Only layer that accesses cache
3. **Layer 3 (Features)**: High-level modules - MUST use `nostr.query()` or `nostr.sub()`

## 🔴 Critical Architecture Violations

### 1. Layer System Violations

#### ❌ Social Modules (0% Compliant)

**ContactManager.ts**
- Creates own cache: `private contactCache = new Map<string, ContactCacheEntry>()`
- Direct SubscriptionManager access: `this.subscriptionManager.getOrCreateSubscription()`
- Completely bypasses Layer 2 (Query/Sub layer)

**ReactionManager.ts**
- Creates own cache: `private reactionCache = new Map<string, ReactionCacheEntry>()`
- Direct SubscriptionManager access: `this.subscriptionManager.getOrCreateSubscription()`
- Completely bypasses Layer 2 (Query/Sub layer)

**ThreadManager.ts**
- Creates own cache: `private threadCache = new Map<string, ThreadCacheEntry>()`
- Direct SubscriptionManager access: `this.subscriptionManager.subscribe()`
- Completely bypasses Layer 2 (Query/Sub layer)
- Additionally: File too large (861 lines)

**FeedManager.ts**
- Creates own cache: `private feedCache = new Map<string, FeedItem[]>()`
- Direct SubscriptionManager access: `this.subscriptionManager.subscribe()`
- Completely bypasses Layer 2 (Query/Sub layer)

#### ✅ Profile Modules (95% Compliant) 

**ProfileModule.ts** - ✅ PERFECT
- Uses `nostr.query()` and `nostr.sub()` exclusively
- No direct cache access
- Follows 3-layer architecture perfectly

**FollowsModule.ts** - ✅ PERFECT
- Uses `nostr.query()` and `nostr.sub()` exclusively
- No direct cache access
- Follows 3-layer architecture perfectly

**FollowBatchBuilder.ts** - ✅ FIXED
- Previously had direct cache access: `this.config.cache.query(filter)`
- Previously had direct SubscriptionManager access
- Now uses: `this.config.nostr.query()` and `this.config.nostr.sub()`
- Follows same pattern as FollowsModule

### 2. SOLID Principle Violations

#### Single Responsibility Principle (SRP) Violations

**Files Too Large (>500 lines):**
- `ThreadManager.ts`: 861 lines - Does too much (threading, caching, subscribing)
- `SubscriptionManager.ts`: 810 lines - Manages too many concerns
- `NostrStore.ts`: 718 lines - Multiple store implementations in one file
- `DMModule.ts`: 563 lines - Too many DM-related responsibilities

#### Dependency Inversion Principle (DIP) Violations

**Social Modules:**
- Depend on concrete `SubscriptionManager` instead of abstractions
- Should depend on `NostrUnchained` interface like Profile modules do

### 3. Duplicate Cache Implementations

**Legitimate Cache:**
- ✅ `UniversalEventCache` - The ONE source of truth

**Duplicate Caches (Architecture Violations):**
- ❌ `ContactManager`: `contactCache = new Map()`
- ❌ `ReactionManager`: `reactionCache = new Map()`
- ❌ `ThreadManager`: `threadCache = new Map()`
- ❌ `FeedManager`: `feedCache = new Map()`

## 📋 Correct Architecture Pattern

### ✅ Good Example (ProfileModule)

```typescript
// CORRECT - Using Layer 2 (Query/Sub)
const profileStore = this.config.nostr.query()
  .kinds([0])
  .authors([pubkey])
  .limit(1)
  .execute()
  .map(events => this.parseProfileEvents(events));

// Subscription for live updates
await this.config.nostr.sub()
  .kinds([0])
  .authors([pubkey])
  .execute();
```

### ❌ Bad Example (ContactManager)

```typescript
// WRONG - Direct cache
private contactCache = new Map<string, ContactCacheEntry>();

// WRONG - Direct subscription manager access
const sharedSub = await this.subscriptionManager.getOrCreateSubscription(filters);
```

## 🎯 Refactoring Action Plan

### Phase 1: Fix Architecture Violations in Social Modules

- [x] Fix FollowBatchBuilder to use nostr.query() instead of direct cache access ✅ DONE
- [ ] Refactor ContactManager to use nostr.query() instead of own cache
- [ ] Refactor ContactManager to use nostr.sub() instead of direct SubscriptionManager
- [ ] Remove ContactManager's private contactCache
- [ ] Refactor ReactionManager to use nostr.query() instead of own cache
- [ ] Refactor ReactionManager to use nostr.sub() instead of direct SubscriptionManager
- [ ] Remove ReactionManager's private reactionCache
- [ ] Refactor ThreadManager to use nostr.query() instead of own cache
- [ ] Refactor ThreadManager to use nostr.sub() instead of direct SubscriptionManager
- [ ] Remove ThreadManager's private threadCache
- [ ] Refactor FeedManager to use nostr.query() instead of own cache
- [ ] Refactor FeedManager to use nostr.sub() instead of direct SubscriptionManager
- [ ] Remove FeedManager's private feedCache

### Phase 2: Split Large Files (SOLID)

- [ ] Split ThreadManager.ts (861 lines) into ThreadManager + ThreadBuilder + ThreadStore
- [ ] Split SubscriptionManager.ts (810 lines) into SubscriptionManager + SharedSubscription
- [ ] Split NostrStore.ts (718 lines) into separate files for each store implementation
- [ ] Split DMModule.ts (563 lines) into DMModule + DMBuilder + DMProtocol

### Phase 3: Update Module Interfaces

- [ ] Update SocialModule to pass NostrUnchained instance to all social managers
- [ ] Update ContactManager constructor to accept NostrUnchained instead of SubscriptionManager
- [ ] Update ReactionManager constructor to accept NostrUnchained instead of SubscriptionManager
- [ ] Update ThreadManager constructor to accept NostrUnchained instead of SubscriptionManager
- [ ] Update FeedManager constructor to accept NostrUnchained instead of SubscriptionManager

### Phase 4: Testing & Documentation

- [ ] Add architecture tests to prevent future violations
- [ ] Update documentation to reflect clean architecture
- [ ] Add examples of correct layer usage
- [ ] Create architecture diagram

### Phase 5: Clean Up

- [ ] Remove all unused imports related to direct cache/subscription access
- [ ] Remove deprecated cache-related configuration parameters
- [ ] Ensure all modules follow the same pattern as ProfileModule
- [ ] Final architecture compliance check