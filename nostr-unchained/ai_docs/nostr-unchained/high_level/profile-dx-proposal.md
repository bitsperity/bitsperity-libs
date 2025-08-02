# Nostr Unchained - Profile Management DX Proposal

## Executive Summary

This proposal outlines a comprehensive profile management system for Nostr Unchained that delivers the same "SQL-like elegance" for profiles that the library promises for event queries. By following the established builder pattern philosophy and reactive store architecture, profile operations become as intuitive as "SELECT * FROM profiles WHERE verified = true".

## Problem Statement

Current Nostr profile management suffers from:
1. **Complex multi-step operations** for basic profile tasks
2. **Manual relationship management** between profiles and follow lists
3. **No reactive updates** when profiles change
4. **Inconsistent metadata handling** across clients
5. **Difficult profile discovery** without proper tooling

## Proposed Solution

### Core ProfileModule API

```typescript
// Zero-config profile operations
const nostr = new NostrUnchained();

// 1. Reactive profile subscription (< 5 seconds to implement)
const profile = nostr.profile.get('npub1234...');
$: console.log($profile.profile?.name);
$: verified = $profile.verified;

// 2. Profile editing with builder pattern
await nostr.profile.edit()
  .name("Alice")
  .about("Building on Nostr")
  .picture("https://example.com/alice.jpg")
  .nip05("alice@example.com")
  .preserveExisting() // Best practice: don't erase other fields
  .publish();

// 3. Profile discovery - SQL-like queries for profiles
const bitcoiners = await nostr.profile.discover()
  .withMetadata('bitcoin')
  .verified()
  .popular({ limit: 100 })
  .execute();
```

### Follow List Management

```typescript
// Reactive follow list
const myFollows = nostr.profile.follows.mine();
$: following = $myFollows.count;
$: isFollowingAlice = $myFollows.isFollowing('npub1alice...');

// Simple follow operations
await nostr.profile.follows.add('npub1234...')
  .relay('wss://relay.example.com')
  .publish();

// Batch operations for efficiency
await nostr.profile.follows.batch()
  .add(['npub1...', 'npub2...', 'npub3...'])
  .remove(['npub4...'])
  .publish();

// Advanced: Follow suggestions based on social graph
const suggestions = await nostr.profile.follows.analyze()
  .suggestions({ basedOn: 'mutual', limit: 20 })
  .execute();
```

### Complex Profile Queries

```typescript
// Find all verified profiles I follow who are active
const activeVerifiedFollows = await nostr.subgraph()
  .startFrom({ kind: 3, authors: [myPubkey] }) // My follow list
  .expand('p', { // Expand to profile events
    kind: 0,
    verified: true, // Only NIP-05 verified
    hasRecentActivity: { since: '7d' }
  })
  .execute();

// Popular profiles in my network (2nd degree connections)
const networkPopular = await nostr.profile.discover()
  .followedBy(myFollows)
  .notFollowedBy(me)
  .popular({ minFollowers: 100 })
  .execute();
```

## Implementation Architecture

### 1. ProfileStore - Reactive State Management

```typescript
interface ProfileState {
  profile: ProfileMetadata | null;
  loading: boolean;
  error: NostrError | null;
  verified: boolean;
  verificationDetails?: NIP05Verification;
  lastUpdated: Date | null;
  relays: string[]; // Where profile was found
}

// Svelte store with automatic subscription management
class ProfileStore extends SvelteStore<ProfileState> {
  constructor(pubkey: string, nostr: NostrUnchained) {
    // Auto-subscribe to profile updates
    // Handle NIP-05 verification
    // Cache management
  }
}
```

### 2. Profile Builder - Fluent API for Updates

```typescript
class ProfileBuilder {
  // Preserve existing fields by default
  private preserveExisting = true;
  private updates: Partial<ProfileMetadata> = {};
  
  name(name: string): this {
    this.updates.name = name;
    return this;
  }
  
  // All standard fields...
  
  // External identities (NIP-39)
  github(username: string): this {
    this.addIdentity('github', username);
    return this;
  }
  
  async publish(): Promise<PublishResult> {
    // Fetch current profile if preserving
    // Merge updates
    // Create kind 0 event
    // Publish to relays
  }
}
```

### 3. Follow Management - Optimized for UX

```typescript
class FollowsModule {
  // Maintain local cache for instant UI updates
  private cache = new Map<string, FollowListStore>();
  
  // Optimistic updates for better UX
  async add(pubkey: string): FollowBuilder {
    // Update local state immediately
    // Publish in background
    // Handle failures gracefully
  }
  
  // Efficient batch operations
  batch(): FollowBatchBuilder {
    // Minimize relay requests
    // Single event for all changes
  }
}
```

## Use Cases & Examples

### 1. Social Media App - Profile Page

```svelte
<script>
  import { nostr } from '$lib/stores';
  
  export let pubkey;
  
  const profile = nostr.profile.get(pubkey);
  const theirFollows = nostr.profile.follows.of(pubkey);
  const myFollows = nostr.profile.follows.mine();
  
  $: isFollowing = $myFollows.isFollowing(pubkey);
  $: mutualFollows = $theirFollows.follows.filter(f => 
    $myFollows.isFollowing(f.pubkey)
  );
</script>

<div class="profile">
  {#if $profile.loading}
    <LoadingSpinner />
  {:else if $profile.profile}
    <img src={$profile.profile.picture} alt={$profile.profile.name} />
    <h1>
      {$profile.profile.name}
      {#if $profile.verified}
        <VerifiedBadge />
      {/if}
    </h1>
    <p>{$profile.profile.about}</p>
    
    <button on:click={() => follow(pubkey)}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
    
    <div>
      {mutualFollows.length} mutual connections
    </div>
  {/if}
</div>
```

### 2. Profile Settings - Edit Form

```svelte
<script>
  import { nostr } from '$lib/stores';
  
  const myProfile = nostr.profile.get(myPubkey);
  
  async function updateProfile(data) {
    const result = await nostr.profile.edit()
      .name(data.name)
      .about(data.about)
      .picture(data.picture)
      .nip05(data.nip05)
      .preserveExisting()
      .publish();
      
    if (result.success) {
      toast.success('Profile updated!');
    }
  }
</script>

<form on:submit={updateProfile}>
  <input bind:value={$myProfile.profile.name} />
  <textarea bind:value={$myProfile.profile.about} />
  <!-- ... more fields ... -->
</form>
```

### 3. Onboarding - Follow Suggestions

```typescript
// During onboarding, suggest popular verified accounts
const suggestions = await nostr.profile.discover()
  .verified()
  .popular({ limit: 20 })
  .withMetadata('interests', user.selectedInterests)
  .execute();

// Batch follow selected suggestions
await nostr.profile.follows.batch()
  .add(selectedSuggestions.map(s => s.pubkey))
  .publish();
```

## Migration Strategy

### From Raw Nostr

```typescript
// Before (nostr-tools)
const event = {
  kind: 0,
  content: JSON.stringify({
    name: "Alice",
    about: "Developer"
  }),
  created_at: Math.floor(Date.now() / 1000),
  tags: []
};
// Sign, validate, publish manually...

// After (Nostr Unchained)
await nostr.profile.edit()
  .name("Alice")
  .about("Developer")
  .publish();
```

### From NDK

```typescript
// Before (NDK)
const profile = new NDKUser({ npub: 'npub1234...' });
await profile.fetchProfile();
// Complex subscription setup...

// After (Nostr Unchained)
const profile = nostr.profile.get('npub1234...');
// Automatic subscriptions, reactive updates
```

## Performance Optimizations

1. **Smart Caching**: Profile data cached with TTL
2. **Batch Requests**: Multiple profiles fetched in single subscription
3. **Relay Hints**: Use NIP-05 relay hints for faster profile discovery
4. **Optimistic Updates**: Immediate UI updates before relay confirmation
5. **Differential Updates**: Only fetch changed fields

## Success Metrics

1. **First Profile Load**: < 2 seconds
2. **Profile Update**: < 1 second optimistic update
3. **Follow Operation**: Instant UI update
4. **Batch Follow 100 users**: < 3 seconds
5. **Profile Discovery**: < 2 seconds for 50 profiles

## Future Enhancements

1. **Profile Badges** (NIP-58)
2. **Profile Statistics** (follower count, post count)
3. **Profile Backup/Restore**
4. **Multi-account Management**
5. **Profile Templates** for different use cases

## Conclusion

This profile management system transforms Nostr profile operations from complex protocol interactions into simple, intuitive API calls. By following Nostr Unchained's philosophy of "SQL-like elegance", developers can build sophisticated profile features in minutes instead of hours, making Nostr development accessible to everyone.

The magic moment happens when a developer realizes they can manage profiles with the same ease as traditional databases:

```typescript
// This feels like magic
const profile = nostr.profile.get('npub1234...');
$: console.log('Profile updated:', $profile.profile);

// So does this
const verified = await nostr.profile.discover().verified().execute();
```

This is Nostr development done right - where protocol complexity becomes invisible and developers can focus on building amazing experiences.