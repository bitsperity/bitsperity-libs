# 🔍 Query Engine Module

The Query module provides SQL-like syntax for searching the Nostr event graph with reactive feeds and real-time subscriptions.

## Table of Contents

- [Quick Start](#quick-start)
- [SQL-like Queries](#sql-like-queries)
- [Reactive Feeds](#reactive-feeds)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Query Building](#query-building)
- [Performance & Caching](#performance--caching)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();

// Simple queries
const recentPosts = await nostr.query()
  .kind(1)
  .since('1 hour ago')
  .limit(20)
  .fetch();

// Reactive feeds that update in real-time
const liveFeed = nostr.createFeed()
  .kind(1)
  .authors(['npub1alice...', 'npub1bob...'])
  .limit(50)
  .subscribe();

liveFeed.subscribe(events => {
  console.log(`Feed updated: ${events.length} events`);
});
```

## SQL-like Queries

The query engine uses familiar SQL-like syntax for filtering Nostr events:

### Basic Filtering

```typescript
// Find text notes from the last day
const posts = await nostr.query()
  .kind(1)                    // WHERE kind = 1
  .since('1 day ago')        // AND created_at > timestamp
  .limit(100)                // LIMIT 100
  .fetch();

// Multiple kinds (reactions and text notes)
const socialEvents = await nostr.query()
  .kinds([1, 7])             // WHERE kind IN (1, 7)
  .since('2 hours ago')
  .fetch();

// Specific authors
const alicePosts = await nostr.query()
  .kind(1)
  .authors(['npub1alice...', 'npub1bob...'])  // WHERE pubkey IN (...)
  .fetch();
```

### Tag-based Queries

```typescript
// Find all replies to a specific note
const replies = await nostr.query()
  .kind(1)
  .tag('e', 'note1abc123...')  // WHERE tags contain ['e', 'note1abc123...']
  .fetch();

// Find posts with specific hashtags
const nostrPosts = await nostr.query()
  .kind(1)
  .tag('t', 'nostr')          // WHERE tags contain ['t', 'nostr']
  .since('1 week ago')
  .fetch();

// Multiple tag conditions
const threadReplies = await nostr.query()
  .kind(1)
  .tag('e', 'note1root...')   // References the root note
  .tag('p', 'npub1author...')  // Mentions the author
  .fetch();
```

### Time-based Queries

```typescript
// Natural language time expressions
const recent = await nostr.query()
  .kind(1)
  .since('30 minutes ago')
  .fetch();

// Specific time ranges
const timeRange = await nostr.query()
  .kind(1)
  .since('2024-01-01')
  .until('2024-01-31')
  .fetch();

// Unix timestamps
const exactTime = await nostr.query()
  .kind(1)
  .since(Math.floor(Date.now() / 1000) - 3600) // 1 hour ago
  .fetch();
```

### Advanced Queries

```typescript
// Complex profile query
const profiles = await nostr.query()
  .kind(0)                               // Profile events
  .authors(['npub1...', 'npub2...'])     // Specific users
  .since('1 day ago')                    // Recent updates only
  .fetch();

// Contact list changes
const follows = await nostr.query()
  .kind(3)                               // Contact lists
  .authors(['npub1alice...'])            // Alice's follows
  .limit(1)                              // Most recent only
  .fetch();

// Event references and mentions
const mentions = await nostr.query()
  .kind(1)
  .tag('p', 'npub1mykey...')            // Posts mentioning me
  .since('1 day ago')
  .fetch();
```

## Reactive Feeds

Reactive feeds provide real-time updates using Svelte-compatible stores:

### Creating Feeds

```typescript
import { createFeed, createQueryBuilder } from 'nostr-unchained';

// Create a reactive feed
const myFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .authors(['npub1alice...', 'npub1bob...'])
    .limit(50)
);

// Subscribe to updates
const unsubscribe = myFeed.subscribe(events => {
  console.log(`Feed contains ${events.length} events`);
  events.forEach(event => {
    console.log(`${event.pubkey}: ${event.content}`);
  });
});

// Stop subscription when done
unsubscribe();
```

### Feed Types

```typescript
// Global feed (all public posts)
const globalFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .since('1 hour ago')
    .limit(100)
);

// Following feed (posts from people you follow)
const followingFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .authors(await getMyFollowingList())
    .limit(50)
);

// Hashtag feed
const nostrFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .tag('t', 'nostr')
    .since('1 day ago')
    .limit(25)
);

// Thread feed (all replies to a specific note)
const threadFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .tag('e', 'note1rootpost...')
);
```

### Using Feeds in Svelte

```svelte
<script>
  import { createFeed, createQueryBuilder } from 'nostr-unchained';
  
  // Create reactive feed
  const posts = createFeed(
    createQueryBuilder()
      .kind(1)
      .since('1 hour ago')
      .limit(20)
  );
</script>

<!-- Automatically reactive to feed updates -->
{#each $posts as post}
  <div class="post">
    <strong>{post.pubkey}</strong>
    <p>{post.content}</p>
    <small>{new Date(post.created_at * 1000).toLocaleString()}</small>
  </div>
{/each}
```

## Real-time Subscriptions

### Basic Subscriptions

```typescript
import { SubscriptionManager } from 'nostr-unchained';

const subManager = new SubscriptionManager({
  relays: ['wss://relay.damus.io', 'wss://nos.lol']
});

// Subscribe to new events
const subscription = await subManager.subscribe([{
  kinds: [1],
  since: Math.floor(Date.now() / 1000)
}], {
  onEvent: (event) => {
    console.log('New event:', event.content);
  },
  onEose: () => {
    console.log('Subscription established');
  }
});

// Close subscription
await subManager.close(subscription);
```

### Multiple Filters

```typescript
// Subscribe to multiple event types simultaneously
const multiSubscription = await subManager.subscribe([
  { kinds: [1], authors: ['npub1alice...'] },  // Alice's posts
  { kinds: [7], '#e': ['note1target...'] },    // Reactions to specific note
  { kinds: [0], authors: ['npub1bob...'] }      // Bob's profile updates
], {
  onEvent: (event) => {
    switch (event.kind) {
      case 1:
        console.log('New post:', event.content);
        break;
      case 7:
        console.log('New reaction:', event.content);
        break;
      case 0:
        console.log('Profile update:', JSON.parse(event.content));
        break;
    }
  }
});
```

### Advanced Subscription Management

```typescript
// Subscription with error handling
const robustSubscription = await subManager.subscribe([{
  kinds: [1],
  limit: 50
}], {
  onEvent: (event) => {
    console.log('Event received:', event.id);
  },
  onEose: () => {
    console.log('End of stored events');
  },
  onError: (error) => {
    console.error('Subscription error:', error);
  },
  onClose: () => {
    console.log('Subscription closed');
  }
});
```

## Query Building

### Fluent Query Builder

```typescript
const queryBuilder = nostr.query();

// Method chaining
const complexQuery = queryBuilder
  .kind(1)                               // Text notes
  .authors(['npub1...', 'npub2...'])     // From specific authors  
  .tag('t', 'nostr')                     // With #nostr hashtag
  .since('1 day ago')                    // From last 24 hours
  .until('1 hour ago')                   // Up to 1 hour ago
  .limit(100)                            // Max 100 events
  .orderBy('created_at', 'desc');        // Newest first

const results = await complexQuery.fetch();
```

### Programmatic Building

```typescript
import { createQueryBuilder } from 'nostr-unchained';

function buildUserQuery(userPubkey: string, days: number = 7) {
  return createQueryBuilder()
    .kinds([0, 1, 3])                    // Profile, posts, contacts
    .authors([userPubkey])
    .since(`${days} days ago`)
    .limit(1000);
}

function buildHashtagQuery(hashtag: string, hours: number = 24) {
  return createQueryBuilder()
    .kind(1)
    .tag('t', hashtag)
    .since(`${hours} hours ago`)
    .limit(200);
}

// Use the builders
const aliceData = await buildUserQuery('npub1alice...').fetch();
const nostrPosts = await buildHashtagQuery('nostr', 48).fetch();
```

### Conditional Queries

```typescript
function buildConditionalQuery(options: {
  includeReplies?: boolean;
  userPubkey?: string;
  hashtags?: string[];
  timeRange?: string;
}) {
  let query = createQueryBuilder().kind(1);
  
  if (!options.includeReplies) {
    // Exclude replies (posts without 'e' tags)
    query = query.tag('e', '', { negate: true });
  }
  
  if (options.userPubkey) {
    query = query.authors([options.userPubkey]);
  }
  
  if (options.hashtags?.length) {
    // Posts with any of these hashtags
    options.hashtags.forEach(tag => {
      query = query.tag('t', tag);
    });
  }
  
  if (options.timeRange) {
    query = query.since(options.timeRange);
  }
  
  return query.limit(100);
}

// Examples
const mainPosts = await buildConditionalQuery({
  includeReplies: false,
  timeRange: '1 day ago'
}).fetch();

const userNostrPosts = await buildConditionalQuery({
  userPubkey: 'npub1alice...',
  hashtags: ['nostr', 'bitcoin'],
  timeRange: '1 week ago'
}).fetch();
```

## Performance & Caching

### Query Optimization

```typescript
// Efficient queries use specific filters
const efficientQuery = nostr.query()
  .kind(1)                     // Specific kind
  .authors(['npub1alice...'])  // Limited authors
  .since('1 hour ago')         // Recent time range
  .limit(50);                  // Reasonable limit

// Avoid overly broad queries
const broadQuery = nostr.query()
  .since('1 year ago')         // ❌ Too broad
  .limit(10000);               // ❌ Too many results
```

### Caching Strategies

```typescript
// Feed-level caching
const cachedFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .authors(['npub1alice...'])
    .limit(100),
  {
    cacheTime: 60000,          // Cache for 1 minute
    staleTime: 30000,          // Consider stale after 30 seconds
    refetchOnFocus: true       // Refetch when window gains focus
  }
);

// Manual cache management
const queryResult = await nostr.query()
  .kind(1)
  .tag('t', 'nostr')
  .cache('nostr-posts', 300000) // Cache key and TTL
  .fetch();
```

### Pagination

```typescript
// Cursor-based pagination
async function paginatePosts(cursor?: string, limit: number = 20) {
  const query = nostr.query()
    .kind(1)
    .limit(limit);
    
  if (cursor) {
    query.until(parseInt(cursor)); // Use timestamp as cursor
  }
  
  const events = await query.fetch();
  const nextCursor = events.length > 0 
    ? events[events.length - 1].created_at.toString()
    : undefined;
    
  return { events, nextCursor };
}

// Usage
let cursor: string | undefined;
const allPosts: NostrEvent[] = [];

do {
  const page = await paginatePosts(cursor, 50);
  allPosts.push(...page.events);
  cursor = page.nextCursor;
} while (cursor && allPosts.length < 1000);
```

## API Reference

### QueryBuilder Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.kind(k)` | Filter by event kind | `.kind(1)` |
| `.kinds(array)` | Multiple kinds | `.kinds([1, 7])` |
| `.authors(array)` | Filter by authors | `.authors(['npub1...'])` |
| `.tag(name, value)` | Filter by tag | `.tag('e', 'note1...')` |
| `.since(time)` | Events after time | `.since('1 hour ago')` |
| `.until(time)` | Events before time | `.until('2024-01-01')` |
| `.limit(n)` | Limit results | `.limit(100)` |
| `.fetch()` | Execute query | Returns `Promise<NostrEvent[]>` |

### Feed Creation

```typescript
createFeed(queryBuilder: QueryBuilder, options?: FeedOptions): FeedStore
```

**Options:**
- `cacheTime` - How long to cache results (ms)
- `staleTime` - When to consider data stale (ms)  
- `refetchOnFocus` - Refetch when window gains focus
- `refetchInterval` - Auto-refetch interval (ms)

### Subscription Manager

```typescript
subscribe(
  filters: Filter[], 
  options: SubscriptionOptions
): Promise<string>
```

**SubscriptionOptions:**
- `onEvent(event)` - Handle new events
- `onEose()` - End of stored events
- `onError(error)` - Handle errors  
- `onClose()` - Subscription closed

---

**Next Steps:**
- [Direct Messages](../dm/README.md) - Encrypted private messaging
- [Social Media](../social/README.md) - Profiles, contacts, and reactions
- [Reactive Stores](../stores/README.md) - Advanced state management