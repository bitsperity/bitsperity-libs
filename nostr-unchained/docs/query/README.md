# 🔍 Universal Query & Subscription Engine

Die **Universal Query Engine** stellt **identische APIs** für Cache-Queries und Live-Subscriptions bereit, basierend auf der mächtigen Universal Cache Architecture.

> **Kernkonzept**: Eine API für Cache und Live-Daten - lerne einmal, nutze überall.

## Table of Contents

- [Quick Start](#quick-start)
- [Universal Cache Architecture](#universal-cache-architecture)
- [Query API](#query-api)
- [Subscription API](#subscription-api)
- [Reactive Stores](#reactive-stores)
- [Advanced Patterns](#advanced-patterns)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.connect();

// 🔍 QUERY: Immediate cache lookup
const cachedPosts = nostr.query()
  .kinds([1])
  .authors(['alice-pubkey'])
  .execute();

console.log(`Found ${cachedPosts.current.length} cached posts`);

// 📡 SUBSCRIPTION: Live data from relays  
const liveStore = nostr.sub()
  .kinds([1])
  .authors(['alice-pubkey'])
  .execute();

// Both return reactive Svelte stores!
liveStore.subscribe(posts => {
  console.log(`Live feed updated: ${posts.length} posts`);
});
```

## Universal Cache Architecture

### The Elegant Design

**Same API, different data sources:**

```typescript
// IDENTICAL fluent APIs
const queryBuilder = nostr.query()    // Cache lookup
const subBuilder = nostr.sub()        // Live subscription

// IDENTICAL method chains
.kinds([1, 7])
.authors(['alice-pubkey', 'bob-pubkey'])
.tags('t', ['nostr', 'bitcoin'])
.execute() // Both return UniversalNostrStore<NostrEvent[]>
```

### Data flow

```
📡 Relays → 🔔 Subscriptions → 💾 Universal Cache → 🔍 Queries → 📱 UI
              ↑                        ↓
        Live updates             Instant access
```

### Four Layers Working Together

1. **Universal Cache**: Auto-unwraps gift wraps, deduplicates, encrypts
2. **Query/Sub Engine**: Identical APIs with different data sources  
3. **Specialized APIs**: DMs, Social, etc. built on query/sub
4. **Zero-Config DX**: Everything works automatically

## Query API

### Immediate Cache Lookups

Queries hit the **Universal Cache** for instant results:

```typescript
// Find cached direct messages
const dms = nostr.query()
  .kinds([14])                    // DM events
  .tags('p', ['my-pubkey'])       // For me
  .execute();

console.log(`${dms.current.length} cached DMs`);

// Find cached posts with hashtags
const nostrPosts = nostr.query()
  .kinds([1])                     // Text notes
  .tags('t', ['nostr'])           // #nostr hashtag
  .execute();

// Find cached profiles
const profiles = nostr.query()
  .kinds([0])                     // Profile events
  .authors(['alice-pubkey', 'bob-pubkey'])
  .execute();
```

### Query Filters

```typescript
// Event kinds
.kinds([1, 7])              // Text notes and reactions
.kinds([0])                 // Profiles only

// Authors (public keys)
.authors(['pubkey1', 'pubkey2'])

// Tags (any tag type)
.tags('e', ['event-id'])    // References to events
.tags('p', ['pubkey'])      // Mentions of pubkeys  
.tags('t', ['nostr'])       // Hashtags

// Combine filters
const complexQuery = nostr.query()
  .kinds([1])
  .authors(['alice-pubkey'])
  .tags('t', ['nostr', 'bitcoin'])
  .execute();
```

### Reactive Query Results

All queries return **reactive stores**:

```typescript
const posts = nostr.query().kinds([1]).execute();

// Subscribe to changes (Svelte store interface)
const unsubscribe = posts.subscribe(events => {
  console.log(`Query result updated: ${events.length} posts`);
});

// Current data (synchronous access)
console.log(`Current posts: ${posts.current.length}`);

// Stop listening
unsubscribe();
```

## Subscription API

### Live Updates from Relays

Subscriptions fetch **live data** from relays and fill the cache:

```typescript
// Subscribe to new posts
const livePosts = nostr.sub()
  .kinds([1])
  .execute();

// Subscribe to reactions on my posts
const reactions = nostr.sub()
  .kinds([7])
  .tags('e', ['my-post-id-1', 'my-post-id-2'])
  .execute();

// Subscribe to profile updates
const profiles = nostr.sub()
  .kinds([0])
  .authors(['alice-pubkey', 'bob-pubkey'])
  .execute();
```

### Subscription Benefits

- **Fill Cache**: New events automatically added to Universal Cache
- **Reactive Updates**: All related queries update automatically
- **Gift Wrap Handling**: Kind 1059 events auto-unwrapped to kind 14
- **Deduplication**: No duplicate events in stores

```typescript
// Start subscription
const liveData = nostr.sub().kinds([1]).execute();

// Meanwhile, queries benefit from filled cache
const cachedData = nostr.query().kinds([1]).execute();

// Both stores update when new events arrive!
liveData.subscribe(events => console.log('Live:', events.length));
cachedData.subscribe(events => console.log('Cache:', events.length));
```

## Reactive Stores

### Svelte Store Interface

All results implement the Svelte store pattern:

```typescript
interface UniversalNostrStore<T> {
  // Subscribe to changes
  subscribe(callback: (value: T) => void): () => void;
  
  // Current value (synchronous)
  current: T;
}
```

### Using in Svelte Components

```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  await nostr.connect();
  
  // Reactive store
  const posts = nostr.query().kinds([1]).execute();
</script>

<!-- Automatically reactive -->
{#each $posts as post}
  <div class="post">
    <strong>{post.pubkey}</strong>
    <p>{post.content}</p>
  </div>
{/each}

<p>Total posts: {$posts.length}</p>
```

### Using in React

```tsx
import { useState, useEffect } from 'react';

function PostsFeed() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    const nostr = new NostrUnchained();
    const postsStore = nostr.query().kinds([1]).execute();
    
    const unsubscribe = postsStore.subscribe(newPosts => {
      setPosts(newPosts);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.content}</div>
      ))}
    </div>
  );
}
```

## Advanced Patterns

### Query + Subscription Combination

Perfect pattern: **Query for history + Subscribe for updates**

```typescript
// 1. Get cached history instantly
const historicalPosts = nostr.query()
  .kinds([1])
  .authors(['alice-pubkey'])
  .execute();

// 2. Subscribe for new posts
const livePosts = nostr.sub()
  .kinds([1])  
  .authors(['alice-pubkey'])
  .execute();

// Both stores update when new events arrive
historicalPosts.subscribe(posts => {
  console.log(`History: ${posts.length} posts`);
});

livePosts.subscribe(posts => {
  console.log(`Live: ${posts.length} posts`);
});

// They contain the same data (cache synchronization)
```

### Building DM Systems

DMs are just **queries for kind 14 events**:

```typescript
// DM conversation = cache query
const conversation = nostr.query()
  .kinds([14])                          // DM events
  .authors(['my-pubkey', 'alice-pubkey']) // Between us
  .tags('p', ['my-pubkey', 'alice-pubkey']) // For us
  .execute();

// Gift wrap subscription (handled automatically by dm.with())
const giftWrapSub = nostr.sub()
  .kinds([1059])                        // Gift wraps
  .tags('p', ['my-pubkey'])             // For me
  .execute();

// Cache automatically unwraps 1059 → 14
// Conversation store updates automatically!
```

### Multiple Filter Patterns

```typescript
// OR conditions (multiple queries)
const textNotes = nostr.query().kinds([1]).execute();
const reactions = nostr.query().kinds([7]).execute();

// AND conditions (single query)
const nostrPosts = nostr.query()
  .kinds([1])                     // Text notes
  .tags('t', ['nostr'])           // AND #nostr
  .authors(['alice-pubkey'])      // AND by Alice
  .execute();

// Complex combinations
function createFeed(userPubkeys, hashtags) {
  return nostr.query()
    .kinds([1])
    .authors(userPubkeys)         // Posts by these users
    .tags('t', hashtags)          // With these hashtags
    .execute();
}

const customFeed = createFeed(
  ['alice-pubkey', 'bob-pubkey'],
  ['nostr', 'bitcoin']
);
```

### Performance Optimization

```typescript
// ✅ Good: Specific filters
const efficientQuery = nostr.query()
  .kinds([1])                     // Specific kind
  .authors(['alice-pubkey'])      // Limited authors
  .execute();

// ❌ Avoid: Too broad
const broadQuery = nostr.query()   
  .execute(); // No filters = everything

// ✅ Good: Start subscription then query
const liveFeed = nostr.sub().kinds([1]).execute();
const cachedPosts = nostr.query().kinds([1]).execute();

// ❌ Less efficient: Query without subscription
const posts = nostr.query().kinds([1]).execute(); // Might be empty
```

## API Reference

### Universal Query Builder

```typescript
class UniversalQueryBuilder {
  // Event type filters
  kinds(kinds: number[]): this;
  
  // Author filters  
  authors(pubkeys: string[]): this;
  
  // Tag filters
  tags(tagName: string, values: string[]): this;
  
  // Execute query (returns reactive store)
  execute(): UniversalNostrStore<NostrEvent[]>;
}
```

### Universal Subscription Builder

```typescript
class UniversalSubBuilder {
  // Event type filters
  kinds(kinds: number[]): this;
  
  // Author filters
  authors(pubkeys: string[]): this;
  
  // Tag filters  
  tags(tagName: string, values: string[]): this;
  
  // Execute subscription (returns reactive store)
  execute(): UniversalNostrStore<NostrEvent[]>;
}
```

### Universal Nostr Store

```typescript
interface UniversalNostrStore<T> {
  // Svelte store interface
  subscribe(callback: (value: T) => void): () => void;
  
  // Current value (synchronous access)
  current: T;
}
```

### Factory Methods

```typescript
// From NostrUnchained instance
nostr.query(): UniversalQueryBuilder    // Cache queries
nostr.sub(): UniversalSubBuilder        // Live subscriptions
```

## Architecture Benefits

### For Users
- ✅ **Identical APIs**: Learn once, use everywhere
- ✅ **Instant Results**: Cache queries return immediately  
- ✅ **Live Updates**: Subscriptions keep data fresh
- ✅ **Automatic Sync**: Cache and subscriptions work together

### For Developers
- ✅ **Reactive**: Svelte store interface everywhere
- ✅ **Composable**: Build complex systems from simple queries
- ✅ **Predictable**: Same patterns for all data access
- ✅ **Performant**: Cache-first with live updates

### Security & Reliability
- ✅ **Encrypted Cache**: All data encrypted at rest
- ✅ **Auto Gift Wrap**: Kind 1059 → 14 transparent
- ✅ **Deduplication**: No duplicate events
- ✅ **Error Resilient**: Graceful failure handling

---

**Next Steps:**
- [Direct Messages](../dm/README.md) - Built on query/sub architecture
- [Stores](../stores/README.md) - Reactive data management  
- [Social Media](../social/README.md) - Social features using queries