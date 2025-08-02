# Profile DX Implementation Phase Plan

## Overview

This document outlines the phased implementation of the Profile Management system for Nostr Unchained. Each phase is designed to be:
- **Specific**: Clear deliverables and API endpoints
- **Measurable**: Testable against real relay (ws://umbrel.local:4848)
- **Achievable**: Self-contained implementation chunks
- **Relevant**: Building towards complete profile DX
- **Time-bound**: 2-4 hours per phase

## Test Environment Setup

```typescript
// All phases test against real relay
const TEST_RELAY = 'ws://umbrel.local:4848';
const nostr = new NostrUnchained({
  relays: [TEST_RELAY],
  debug: true // See relay communications
});
```

## Phase 1: Basic Profile Read Operations (2 hours)

### Deliverables
1. `ProfileModule` class with `get()` method
2. `ProfileStore` reactive store implementation
3. Basic profile metadata fetching (kind 0 events)

### API Surface
```typescript
// API to implement
nostr.profile.get(pubkey: string): ProfileStore

// ProfileStore interface
interface ProfileStore extends Readable<ProfileState> {
  profile: Readable<ProfileMetadata | null>;
  loading: Readable<boolean>;
  error: Readable<NostrError | null>;
}
```

### Test Scenarios
```typescript
// Test 1: Fetch existing profile
const profile = nostr.profile.get('npub1...');
// Subscribe and log changes
profile.subscribe(state => console.log('Profile:', state));

// Test 2: Handle non-existent profile
const notFound = nostr.profile.get('npub1invalid...');
// Should return null profile, no error

// Test 3: Reactive updates
// Create profile on relay, observe auto-update in store
```

### Success Criteria
- Profile fetches within 2 seconds
- Reactive updates work when profile changes
- Graceful handling of missing profiles

---

## Phase 2: Profile Creation & Updates (3 hours)

### Deliverables
1. `ProfileBuilder` class with fluent API
2. Field preservation logic
3. Event signing and publishing

### API Surface
```typescript
// API to implement
nostr.profile.edit(): ProfileBuilder

interface ProfileBuilder {
  name(name: string): this;
  about(bio: string): this;
  picture(url: string): this;
  nip05(identifier: string): this;
  preserveExisting(enable?: boolean): this;
  publish(): Promise<PublishResult>;
}
```

### Test Scenarios
```typescript
// Test 1: Create new profile
await nostr.profile.edit()
  .name("Test User")
  .about("Testing profile creation")
  .publish();

// Test 2: Update existing profile (field preservation)
await nostr.profile.edit()
  .name("Updated Name")
  .preserveExisting() // Should keep about, picture, etc.
  .publish();

// Test 3: Replace entire profile
await nostr.profile.edit()
  .name("Complete Replace")
  .preserveExisting(false) // Clear other fields
  .publish();
```

### Success Criteria
- Profile publishes to relay successfully
- Field preservation works correctly
- Updates reflect in ProfileStore immediately

---

## Phase 3: Follow List Read Operations (2 hours)

### Deliverables
1. `FollowsModule` with `mine()` and `of()` methods
2. `FollowListStore` reactive store
3. Follow list parsing (kind 3 events)

### API Surface
```typescript
// API to implement
nostr.profile.follows.mine(): FollowListStore
nostr.profile.follows.of(pubkey: string): FollowListStore

interface FollowListStore extends Readable<FollowListState> {
  follows: Readable<Follow[]>;
  count: Readable<number>;
  isFollowing(pubkey: string): Readable<boolean>;
}
```

### Test Scenarios
```typescript
// Test 1: Read own follow list
const myFollows = nostr.profile.follows.mine();
myFollows.subscribe(state => console.log('Following:', state.count));

// Test 2: Read another user's follows
const theirFollows = nostr.profile.follows.of('npub1...');
$: console.log('They follow:', $theirFollows.count);

// Test 3: Check follow status
const isFollowing = myFollows.isFollowing('npub1specific...');
$: console.log('Following user?', $isFollowing);
```

### Success Criteria
- Follow lists load completely
- Reactive count updates work
- isFollowing computed property is accurate

---

## Phase 4: Follow List Management (3 hours)

### Deliverables
1. `FollowBuilder` for adding follows
2. Remove follow functionality
3. Follow list update publishing

### API Surface
```typescript
// API to implement
nostr.profile.follows.add(pubkey: string): FollowBuilder
nostr.profile.follows.remove(pubkey: string): Promise<PublishResult>

interface FollowBuilder {
  relay(url: string): this;
  petname(name: string): this;
  publish(): Promise<PublishResult>;
}
```

### Test Scenarios
```typescript
// Test 1: Add single follow
await nostr.profile.follows.add('npub1...')
  .relay(TEST_RELAY)
  .publish();

// Test 2: Remove follow
await nostr.profile.follows.remove('npub1...');

// Test 3: Add follow with petname
await nostr.profile.follows.add('npub1...')
  .petname('Alice')
  .relay('wss://alice.relay')
  .publish();

// Verify all changes in FollowListStore
```

### Success Criteria
- Follows append to existing list
- Removals work correctly
- Store updates immediately (optimistic)

---

## Phase 5: Batch Operations (3 hours)

### Deliverables
1. `ProfileBatchBuilder` for multiple profiles
2. `FollowBatchBuilder` for bulk follows
3. Efficient relay communications

### API Surface
```typescript
// API to implement
nostr.profile.batch(): ProfileBatchBuilder
nostr.profile.follows.batch(): FollowBatchBuilder

interface ProfileBatchBuilder {
  get(pubkeys: string[]): this;
  execute(): Promise<BatchProfileResult>;
  asStore(): Readable<BatchProfileState>;
}

interface FollowBatchBuilder {
  add(pubkeys: string[]): this;
  remove(pubkeys: string[]): this;
  publish(): Promise<PublishResult>;
}
```

### Test Scenarios
```typescript
// Test 1: Batch profile fetch
const profiles = await nostr.profile.batch()
  .get(['npub1...', 'npub2...', 'npub3...'])
  .execute();

// Test 2: Batch follow operations
await nostr.profile.follows.batch()
  .add(['npub1...', 'npub2...'])
  .remove(['npub3...'])
  .publish();

// Test 3: Reactive batch store
const teamStore = nostr.profile.batch()
  .get(['npub1...', 'npub2...'])
  .asStore();
```

### Success Criteria
- Single relay subscription for batch
- All profiles load efficiently
- Follow list updates atomically

---

## Phase 6: Profile Discovery (4 hours)

### Deliverables
1. `ProfileDiscoveryBuilder` with search methods
2. NIP-05 verification integration
3. Metadata-based filtering

### API Surface
```typescript
// API to implement
nostr.profile.discover(): ProfileDiscoveryBuilder

interface ProfileDiscoveryBuilder {
  byNip05(identifier: string): this;
  byName(name: string): this;
  withMetadata(key: string, value?: any): this;
  verified(): this;
  limit(count: number): this;
  execute(): Promise<ProfileResult[]>;
}
```

### Test Scenarios
```typescript
// Test 1: Search by name
const results = await nostr.profile.discover()
  .byName("alice")
  .limit(10)
  .execute();

// Test 2: Find verified profiles
const verified = await nostr.profile.discover()
  .verified()
  .execute();

// Test 3: Metadata search
const bitcoiners = await nostr.profile.discover()
  .withMetadata('bitcoin')
  .limit(20)
  .execute();
```

### Success Criteria
- Name search works (substring match)
- NIP-05 verification checked
- Metadata filtering accurate

---

## Phase 7: Advanced Profile Queries (4 hours)

### Deliverables
1. Integration with subgraph engine
2. Follow relationship queries
3. Activity-based filtering

### API Surface
```typescript
// Using existing subgraph engine
nostr.subgraph()
  .startFrom({ kind: 0 })
  .filterBy({ /* profile conditions */ })
  .includeRelated({ /* follow lists */ })
  .execute();
```

### Test Scenarios
```typescript
// Test 1: Profiles with mutual follows
const mutual = await nostr.subgraph()
  .startFrom({ kind: 3, authors: [myPubkey] })
  .expand('p', { kind: 3 })
  .filterMutual()
  .execute();

// Test 2: Active profiles in network
const active = await nostr.subgraph()
  .startFrom({ kind: 0 })
  .hasRecentActivity({ kinds: [1], since: '24h' })
  .execute();

// Test 3: Verified profiles I don't follow
const discover = await nostr.subgraph()
  .startFrom({ kind: 0, verified: true })
  .excludeFollowedBy(myPubkey)
  .execute();
```

### Success Criteria
- Complex queries complete < 5 seconds
- Relationship filtering works
- Activity detection accurate

---

## Phase 8: Performance & Polish (2 hours)

### Deliverables
1. Caching layer for profiles
2. Optimistic updates
3. Error recovery

### Test Scenarios
```typescript
// Test 1: Cache performance
// Fetch same profile twice, second should be instant
const p1 = await nostr.profile.get('npub1...');
const p2 = await nostr.profile.get('npub1...'); // From cache

// Test 2: Optimistic updates
// UI should update before relay confirms
await nostr.profile.follows.add('npub1...');
// Check store updated immediately

// Test 3: Relay failure handling
// Disconnect relay, operations should queue
// Reconnect, queued operations should process
```

### Success Criteria
- Cached profiles load < 50ms
- Optimistic updates feel instant
- Graceful degradation on relay issues

---

## Integration Testing (2 hours)

### Full User Journey Tests

```typescript
// Test 1: New user onboarding
// 1. Create profile
// 2. Discover suggested follows
// 3. Batch follow
// 4. View own profile

// Test 2: Social interaction flow
// 1. View another user's profile
// 2. Check mutual follows
// 3. Follow/unfollow
// 4. See updated relationship

// Test 3: Profile management
// 1. Edit profile multiple times
// 2. Verify field preservation
// 3. Check updates across different stores
```

---

## Validation Checklist

Each phase must pass:
- [ ] All test scenarios work on ws://umbrel.local:4848
- [ ] API matches specification exactly
- [ ] No mock objects or test-only code
- [ ] Performance meets targets
- [ ] Reactive stores update correctly
- [ ] Error handling is graceful

## Timeline

- **Week 1**: Phases 1-4 (Core functionality)
- **Week 2**: Phases 5-7 (Advanced features)
- **Week 3**: Phase 8 + Integration testing

Total estimated time: 24 hours of focused development