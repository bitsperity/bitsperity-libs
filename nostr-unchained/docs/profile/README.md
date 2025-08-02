# Profile Management API

The **Profile Management API** provides a comprehensive, reactive system for handling Nostr profiles and follow lists with intelligent caching and optimal performance. Built on **NIP-01** (profiles) and **NIP-02** (follow lists) with **NIP-05** DNS-based identity verification support.

## Key Features

- 🔄 **Reactive Profile Stores** - Real-time updates with Svelte-compatible stores
- ⚡ **Intelligent Caching** - Cache-first loading with <10ms response times
- 🛠️ **Fluent Builder APIs** - Intuitive, chainable profile and follow operations
- 🎯 **Optimistic Updates** - Instant UI updates with async relay confirmation
- 🔍 **Advanced Discovery** - Search profiles by name, NIP-05, metadata with relevance scoring
- 📦 **Batch Operations** - Efficient bulk profile fetching and follow management
- 🔐 **NIP-05 Verification** - Automatic DNS-based identity verification
- 🚀 **High Performance** - Leverages UniversalEventCache for O(log n) queries

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained({
  relays: ['wss://relay.damus.io'],
  debug: true
});

await nostr.initializeSigning();
await nostr.connect();

// Get reactive profile store
const profile = nostr.profile.get('npub1...');
profile.subscribe(state => {
  console.log('Profile:', state.profile?.metadata?.name);
  console.log('Loading:', state.loading);
  console.log('Verified:', state.verified);
});

// Create/update profile
await nostr.profile.edit()
  .name('Alice')
  .about('Nostr enthusiast')
  .picture('https://example.com/avatar.jpg')
  .nip05('alice@domain.com')
  .publish();

// Manage follows
await nostr.profile.follows.add('npub1...')
  .relay('wss://relay.example.com')
  .petname('Bob')
  .publish();

// Discover profiles
const results = await nostr.profile.discover()
  .byName('alice')
  .verified()
  .limit(10)
  .execute();
```

## API Reference

### Core Profile Operations

#### `nostr.profile.get(pubkey: string): ProfileStore`
Get a reactive profile store for any public key. Returns cached data instantly if available.

```typescript
const profile = nostr.profile.get('npub1...');

// Subscribe to profile changes
profile.subscribe(state => {
  console.log('Profile data:', state.profile);
  console.log('Loading state:', state.loading);
  console.log('NIP-05 verified:', state.verified);
  console.log('Last updated:', state.lastUpdated);
});

// Access derived stores
profile.profile.subscribe(userProfile => {
  console.log('Name:', userProfile?.metadata?.name);
  console.log('About:', userProfile?.metadata?.about);
});

profile.loading.subscribe(isLoading => {
  console.log('Loading spinner:', isLoading);
});
```

#### `nostr.profile.edit(): ProfileBuilder`
Create a fluent builder for profile creation/updates with field preservation.

```typescript
// Create new profile
await nostr.profile.edit()
  .name('Alice')
  .about('Bitcoin & Nostr enthusiast')
  .picture('https://example.com/alice.jpg')
  .nip05('alice@bitcoin.org')
  .website('https://alice.bitcoin.org')
  .lud16('alice@getalby.com')
  .publish();

// Update existing profile (preserves other fields)
await nostr.profile.edit()
  .name('Alice Cooper') // Only update name
  .preserveExisting(true) // Keep about, picture, etc.
  .publish();

// Replace entire profile
await nostr.profile.edit()
  .name('Alice')
  .preserveExisting(false) // Clear all other fields
  .publish();
```

### Follow List Management

#### `nostr.profile.follows.mine(): FollowListStore`
Access your own follow list as a reactive store.

```typescript
const myFollows = await nostr.profile.follows.mine();

// Subscribe to follow list changes
myFollows.subscribe(state => {
  console.log('Following:', state.follows.length, 'people');
  console.log('Follow list:', state.follows);
});

// Check if following someone
const isFollowing = myFollows.isFollowing('npub1...');
isFollowing.subscribe(following => {
  console.log('Following this user:', following);
});
```

#### `nostr.profile.follows.of(pubkey: string): FollowListStore`
Access anyone's follow list as a reactive store.

```typescript
const theirFollows = nostr.profile.follows.of('npub1...');

theirFollows.subscribe(state => {
  console.log('They follow:', state.follows.length, 'people');
});
```

#### `nostr.profile.follows.add(pubkey: string): FollowBuilder`
Add someone to your follow list with optional relay and petname.

```typescript
// Basic follow
await nostr.profile.follows.add('npub1...')
  .publish();

// Follow with relay hint and petname
await nostr.profile.follows.add('npub1...')
  .relay('wss://relay.example.com')
  .petname('Alice')
  .publish();
```

#### `nostr.profile.follows.remove(pubkey: string): Promise<PublishResult>`
Remove someone from your follow list.

```typescript
const result = await nostr.profile.follows.remove('npub1...');
console.log('Unfollow success:', result.success);
```

### Batch Operations

#### `nostr.profile.batch(): ProfileBatchBuilder`
Efficiently fetch multiple profiles with a single relay subscription.

```typescript
// Fetch multiple profiles
const result = await nostr.profile.batch()
  .get(['npub1...', 'npub2...', 'npub3...'])
  .execute();

console.log('Profiles loaded:', result.profiles.size);
result.profiles.forEach((profile, pubkey) => {
  console.log('Profile:', profile.metadata.name);
});

// Reactive batch store
const teamStore = nostr.profile.batch()
  .get(['npub1...', 'npub2...'])
  .asStore();

teamStore.subscribe(state => {
  console.log('Team profiles loaded:', state.loaded);
  console.log('Loading progress:', state.loadedCount, '/', state.totalCount);
});
```

#### `nostr.profile.follows.batch(): FollowBatchBuilder`
Bulk follow/unfollow operations.

```typescript
// Bulk follow operations
await nostr.profile.follows.batch()
  .add(['npub1...', 'npub2...', 'npub3...'])
  .remove(['npub4...', 'npub5...'])
  .publish();
```

### Profile Discovery

#### `nostr.profile.discover(): ProfileDiscoveryBuilder`
Search and discover profiles with advanced filtering and relevance scoring.

```typescript
// Search by name
const nameResults = await nostr.profile.discover()
  .byName('alice')
  .limit(10)
  .execute();

// Search by NIP-05 identifier
const nip05Results = await nostr.profile.discover()
  .byNip05('alice@domain.com')
  .execute();

// Filter by metadata
const webResults = await nostr.profile.discover()
  .withMetadata('website') // Has website field
  .limit(20)
  .execute();

// Verified profiles only
const verifiedResults = await nostr.profile.discover()
  .verified() // NIP-05 verified only
  .limit(5)
  .execute();

// Combined search
const combinedResults = await nostr.profile.discover()
  .byName('bitcoin')
  .withMetadata('lud16') // Has Lightning address
  .verified()
  .limit(10)
  .execute();

// Results include relevance scoring
combinedResults.forEach(result => {
  console.log('Profile:', result.profile.metadata.name);
  console.log('Relevance:', result.relevanceScore);
  console.log('Matched fields:', result.matchedFields);
});
```

## Data Types

### ProfileMetadata
```typescript
interface ProfileMetadata {
  name?: string;           // Display name
  about?: string;          // Bio/description
  picture?: string;        // Avatar URL
  banner?: string;         // Banner image URL
  nip05?: string;          // DNS-based identifier
  lud06?: string;          // LNURL-pay
  lud16?: string;          // Lightning address
  website?: string;        // Website URL
  [key: string]: any;      // Additional metadata
}
```

### UserProfile
```typescript
interface UserProfile {
  pubkey: string;                    // Public key
  metadata: ProfileMetadata;         // Profile data
  lastUpdated?: number;              // Unix timestamp of last update
  eventId?: string;                  // Latest profile event ID
  isOwn?: boolean;                   // Is this the current user's profile
}
```

### ProfileState
```typescript
interface ProfileState {
  profile: UserProfile | null;      // Profile data (null if not found)
  loading: boolean;                  // Loading state
  error: Error | null;               // Error state
  verified: boolean;                 // NIP-05 verification status
  lastUpdated: Date | null;          // Last update timestamp
}
```

### Follow
```typescript
interface Follow {
  pubkey: string;         // Public key being followed
  relayUrl?: string;      // Suggested relay URL
  petname?: string;       // Local nickname
}
```

### FollowListState
```typescript
interface FollowListState {
  follows: Follow[];              // List of follows
  loading: boolean;               // Loading state
  error: Error | null;            // Error state
  lastUpdated: Date | null;       // Last update timestamp
  eventId?: string;               // Latest follow list event ID
}
```

## Performance & Caching

The Profile API leverages NostrUnchained's **UniversalEventCache** for optimal performance:

### Cache-First Loading
```typescript
// First access: Cache miss, fetches from relay
const profile1 = nostr.profile.get('npub1...');

// Subsequent access: Cache hit, instant response (<10ms)
const profile2 = nostr.profile.get('npub1...'); // Same profile, from cache
```

### Optimistic Updates
```typescript
// UI updates instantly, relay confirmation happens async
await nostr.profile.edit()
  .name('New Name')
  .publish();
// UI shows "New Name" immediately, then confirms with relay
```

### Cache Statistics
```typescript
// Access cache performance metrics
const stats = nostr.getCacheStatistics();
console.log('Cache hit rate:', stats.hitRate + '%');
console.log('Average query time:', stats.avgQueryTime + 'ms');
console.log('Total cached events:', stats.totalEvents);
```

## Error Handling

```typescript
// Profile store error handling
profile.subscribe(state => {
  if (state.error) {
    console.error('Profile error:', state.error.message);
  }
});

// Builder error handling
try {
  await nostr.profile.edit()
    .name('Alice')
    .publish();
} catch (error) {
  console.error('Failed to update profile:', error);
}

// Discovery error handling
try {
  const results = await nostr.profile.discover()
    .byName('alice')
    .execute();
} catch (error) {
  console.error('Discovery failed:', error);
}
```

## Best Practices

### 1. Use Reactive Stores for UI
```typescript
// ✅ Good: Reactive UI updates
const profile = nostr.profile.get(pubkey);
profile.subscribe(state => {
  if (state.loading) {
    showSpinner();
  } else if (state.profile) {
    displayProfile(state.profile);
  }
});

// ❌ Avoid: Polling or manual refreshes
setInterval(() => profile.refresh(), 5000); // Unnecessary
```

### 2. Preserve Existing Profile Data
```typescript
// ✅ Good: Only update specific fields
await nostr.profile.edit()
  .name('New Name')
  .preserveExisting(true) // Keeps other fields
  .publish();

// ❌ Avoid: Accidentally clearing fields  
await nostr.profile.edit()
  .name('New Name')
  .publish(); // May clear other fields
```

### 3. Use Batch Operations for Multiple Profiles
```typescript
// ✅ Good: Single subscription for multiple profiles
const profiles = await nostr.profile.batch()
  .get(['npub1...', 'npub2...', 'npub3...'])
  .execute();

// ❌ Avoid: Multiple individual requests
const profile1 = nostr.profile.get('npub1...');
const profile2 = nostr.profile.get('npub2...');
const profile3 = nostr.profile.get('npub3...');
```

### 4. Handle NIP-05 Verification Gracefully
```typescript
profile.subscribe(state => {
  const displayName = state.profile?.metadata?.name || 'Anonymous';
  const verifiedIcon = state.verified ? '✓' : '';
  
  displayProfile({
    name: displayName + verifiedIcon,
    isVerified: state.verified
  });
});
```

## Integration Examples

### React Integration
```typescript
import { useEffect, useState } from 'react';

function ProfileCard({ pubkey }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const profileStore = nostr.profile.get(pubkey);
    
    const unsubscribe = profileStore.subscribe(state => {
      setProfile(state.profile);
      setLoading(state.loading);
    });
    
    return unsubscribe;
  }, [pubkey]);
  
  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found</div>;
  
  return (
    <div>
      <img src={profile.metadata.picture} />
      <h3>{profile.metadata.name}</h3>
      <p>{profile.metadata.about}</p>
    </div>
  );
}
```

### Svelte Integration
```svelte
<script>
  import { nostr } from './nostr.js';
  
  export let pubkey;
  
  $: profileStore = nostr.profile.get(pubkey);
  $: profile = $profileStore.profile;
  $: loading = $profileStore.loading;
  $: verified = $profileStore.verified;
</script>

{#if loading}
  <div>Loading profile...</div>
{:else if profile}
  <div class="profile">
    <img src={profile.metadata.picture} alt="Avatar" />
    <h3>
      {profile.metadata.name}
      {#if verified}✓{/if}
    </h3>
    <p>{profile.metadata.about}</p>
  </div>
{:else}
  <div>Profile not found</div>
{/if}
```

## Troubleshooting

### Profile Not Loading
```typescript
// Check relay connection
console.log('Connected relays:', nostr.connectedRelays);

// Check cache status
const stats = nostr.getCacheStatistics();
console.log('Cache stats:', stats);

// Force refresh from relay
await profileStore.refresh();
```

### Follow List Issues
```typescript
// Check if signing provider is available
if (!nostr.signingProvider) {
  await nostr.initializeSigning();
}

// Verify follow list exists
const myFollows = await nostr.profile.follows.mine();
myFollows.subscribe(state => {
  console.log('My follows:', state.follows.length);
});
```

### Performance Issues
```typescript
// Check cache hit rate
const stats = nostr.getCacheStatistics();
if (stats.hitRate < 50) {
  console.warn('Low cache hit rate:', stats.hitRate + '%');
}

// Monitor query performance
if (stats.avgQueryTime > 100) {
  console.warn('Slow queries:', stats.avgQueryTime + 'ms average');
}
```

For more detailed examples and implementation guides, see the [examples](./examples/) directory.