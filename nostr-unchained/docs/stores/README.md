# 🏪 Reactive Stores Module

The Stores module provides Svelte-compatible reactive state management for real-time Nostr applications with automatic subscriptions and intelligent caching.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Feed Stores](#feed-stores)
- [Custom Stores](#custom-stores)
- [State Management](#state-management)
- [Performance Optimization](#performance-optimization)
- [Framework Integration](#framework-integration)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { createFeed, createQueryBuilder, writable, derived } from 'nostr-unchained';

// Create a reactive feed
const posts = createFeed(
  createQueryBuilder()
    .kind(1)
    .since('1 hour ago')
    .limit(50)
);

// Subscribe to updates
posts.subscribe(events => {
  console.log(`Feed updated with ${events.length} posts`);
  updateUI(events);
});

// Create custom reactive state
const userProfile = writable(null);
const isLoggedIn = derived(userProfile, $profile => $profile !== null);

isLoggedIn.subscribe(loggedIn => {
  console.log(`User logged in: ${loggedIn}`);
});
```

## Core Concepts

### Reactive Programming

Nostr Unchained uses a reactive programming model where data flows automatically update dependent components:

```typescript
// Data flows automatically from source to subscribers
const source = writable(initialValue);
const computed = derived(source, value => transform(value));
const ui = computed.subscribe(value => render(value));

// When source changes, computed and UI update automatically
source.set(newValue); // Triggers: transform → render
```

### Store Types

| Store Type | Description | Use Case |
|------------|-------------|----------|
| `Writable` | Mutable state | User input, app state |
| `Readable` | Read-only state | API responses, computed values |
| `Derived` | Computed from other stores | Filtered data, UI state |
| `FeedStore` | Real-time Nostr feeds | Event streams, social feeds |

### Automatic Subscriptions

Stores automatically manage WebSocket subscriptions and cleanup:

```typescript
const feed = createFeed(queryBuilder);

// Subscription starts automatically
const unsubscribe = feed.subscribe(events => {
  // Handle events
});

// Subscription stops automatically
unsubscribe(); // Cleans up WebSocket connections
```

## Feed Stores

Feed stores provide real-time Nostr event streams with intelligent caching:

### Basic Feed Creation

```typescript
import { createFeed, createQueryBuilder } from 'nostr-unchained';

// Recent text notes
const recentPosts = createFeed(
  createQueryBuilder()
    .kind(1)
    .since('1 hour ago')
    .limit(50)
);

// Posts from specific authors
const authorFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .authors(['npub1alice...', 'npub1bob...'])
    .limit(100)
);

// Hashtag feed
const nostrFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .tag('t', 'nostr')
    .since('1 day ago')
    .limit(25)
);
```

### Feed Configuration

```typescript
const configurableFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .since('1 hour ago')
    .limit(50),
  {
    // Caching options
    cacheTime: 300000,        // Cache for 5 minutes
    staleTime: 60000,         // Consider stale after 1 minute
    
    // Subscription options
    autoStart: true,          // Start subscription immediately
    refetchOnFocus: true,     // Refetch when window gains focus
    refetchInterval: 30000,   // Refetch every 30 seconds
    
    // Error handling
    retryAttempts: 3,
    retryDelay: 1000,
    
    // Debug
    debug: false
  }
);
```

### Feed Operations

```typescript
const feed = createFeed(queryBuilder);

// Subscribe to updates
const unsubscribe = feed.subscribe(events => {
  console.log(`${events.length} events in feed`);
});

// Manual operations
await feed.refetch();        // Force refresh
await feed.invalidate();     // Clear cache and refetch
feed.pause();               // Pause real-time updates
feed.resume();              // Resume real-time updates

// Access current value without subscribing
const currentEvents = feed.get();

// Stop and cleanup
unsubscribe();
```

## Custom Stores

Create your own reactive stores for application state:

### Writable Stores

```typescript
import { writable } from 'nostr-unchained';

// Simple state
const counter = writable(0);

// Update state
counter.set(5);
counter.update(n => n + 1);

// Subscribe to changes
counter.subscribe(value => {
  console.log(`Counter: ${value}`);
});

// User profile store
interface UserProfile {
  pubkey: string;
  name: string;
  picture: string;
}

const userProfile = writable<UserProfile | null>(null);

// Update profile
userProfile.set({
  pubkey: 'npub1alice...',
  name: 'Alice',
  picture: 'https://example.com/alice.jpg'
});
```

### Derived Stores

```typescript
import { writable, derived } from 'nostr-unchained';

const userProfile = writable<UserProfile | null>(null);
const contacts = writable<string[]>([]);

// Derived state
const isLoggedIn = derived(
  userProfile,
  $profile => $profile !== null
);

const followingCount = derived(
  contacts,
  $contacts => $contacts.length
);

const userDisplayName = derived(
  userProfile,
  $profile => $profile?.name || $profile?.pubkey?.slice(0, 8) || 'Anonymous'
);

// Complex derived store from multiple sources
const socialStats = derived(
  [userProfile, contacts, posts],
  ([$profile, $contacts, $posts]) => ({
    isActive: $profile !== null,
    followingCount: $contacts.length,
    postCount: $posts.filter(p => p.pubkey === $profile?.pubkey).length,
    lastPostTime: Math.max(...$posts.map(p => p.created_at))
  })
);
```

### Async Stores

```typescript
// Store with async initialization
function createAsyncProfileStore(pubkey: string) {
  const { subscribe, set, update } = writable<UserProfile | null>(null);
  
  // Load initial data
  async function load() {
    try {
      const profile = await nostr.social.profiles.get(pubkey);
      set(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }
  
  // Start loading
  load();
  
  return {
    subscribe,
    reload: load,
    update: async (changes: Partial<UserProfile>) => {
      update(current => current ? { ...current, ...changes } : null);
      // Optionally persist changes
      await nostr.social.profiles.update(changes);
    }
  };
}

const aliceProfile = createAsyncProfileStore('npub1alice...');
```

## State Management

### Global Application State

```typescript
// Global state management
class NostrAppState {
  private static instance: NostrAppState;
  
  public readonly user = writable<UserProfile | null>(null);
  public readonly contacts = writable<string[]>([]);
  public readonly notifications = writable<Notification[]>([]);
  
  // Derived state
  public readonly isLoggedIn = derived(this.user, $user => $user !== null);
  public readonly unreadCount = derived(
    this.notifications,
    $notifications => $notifications.filter(n => !n.read).length
  );
  
  static getInstance() {
    if (!NostrAppState.instance) {
      NostrAppState.instance = new NostrAppState();
    }
    return NostrAppState.instance;
  }
  
  async login(signingProvider: SigningProvider) {
    const pubkey = await signingProvider.getPublicKey();
    const profile = await nostr.social.profiles.get(pubkey);
    const contacts = await nostr.social.contacts.getContacts(pubkey);
    
    this.user.set(profile);
    this.contacts.set(contacts.followingList);
  }
  
  logout() {
    this.user.set(null);
    this.contacts.set([]);
    this.notifications.set([]);
  }
}

// Usage
const appState = NostrAppState.getInstance();

appState.isLoggedIn.subscribe(loggedIn => {
  if (loggedIn) {
    console.log('User logged in');
    startNotificationSubscriptions();
  } else {
    console.log('User logged out');
    stopNotificationSubscriptions();
  }
});
```

### Local Component State

```typescript
// Component-specific state
function createPostEditorState() {
  const content = writable('');
  const mentions = writable<string[]>([]);
  const hashtags = writable<string[]>([]);
  const isPublishing = writable(false);
  
  const canPublish = derived(
    [content, isPublishing],
    ([$content, $isPublishing]) => $content.trim().length > 0 && !$isPublishing
  );
  
  const characterCount = derived(
    content,
    $content => $content.length
  );
  
  async function publish() {
    const $content = content.get();
    const $mentions = mentions.get();
    const $hashtags = hashtags.get();
    
    if (!canPublish.get()) return;
    
    isPublishing.set(true);
    
    try {
      const event = await nostr.events
        .kind(1)
        .content($content);
        
      // Add mentions
      $mentions.forEach(pubkey => {
        event.tag('p', pubkey);
      });
      
      // Add hashtags
      $hashtags.forEach(tag => {
        event.tag('t', tag);
      });
      
      await event.publish();
      
      // Reset form
      content.set('');
      mentions.set([]);
      hashtags.set([]);
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      isPublishing.set(false);
    }
  }
  
  return {
    content,
    mentions,
    hashtags,
    isPublishing,
    canPublish,
    characterCount,
    publish
  };
}
```

## Performance Optimization

### Intelligent Caching

```typescript
// Stores with smart caching
const expensiveQuery = createFeed(
  createQueryBuilder()
    .kind(1)
    .authors(manyAuthors) // Large author list
    .since('1 week ago')
    .limit(1000),
  {
    cacheTime: 600000,      // Cache for 10 minutes
    staleTime: 300000,      // Consider stale after 5 minutes
    refetchOnFocus: false,  // Don't refetch on focus
    debounceMs: 1000        // Debounce rapid updates
  }
);
```

### Selective Subscriptions

```typescript
// Only subscribe when needed
function createConditionalFeed(condition: Readable<boolean>, queryBuilder: QueryBuilder) {
  let currentFeed: FeedStore | null = null;
  
  const store = writable([]);
  
  condition.subscribe($condition => {
    if ($condition && !currentFeed) {
      // Start subscription
      currentFeed = createFeed(queryBuilder);
      currentFeed.subscribe(events => store.set(events));
    } else if (!$condition && currentFeed) {
      // Stop subscription
      currentFeed.destroy();
      currentFeed = null;
      store.set([]);
    }
  });
  
  return { subscribe: store.subscribe };
}

// Usage
const isActiveTab = writable(true);
const conditionalFeed = createConditionalFeed(isActiveTab, queryBuilder);
```

### Memory Management

```typescript
// Automatic cleanup
class ComponentState {
  private subscriptions: (() => void)[] = [];
  
  addSubscription(store: Readable<any>, handler: (value: any) => void) {
    const unsubscribe = store.subscribe(handler);
    this.subscriptions.push(unsubscribe);
  }
  
  destroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}

// Usage in components
const componentState = new ComponentState();

componentState.addSubscription(feed, events => updateUI(events));
componentState.addSubscription(profile, profile => updateProfile(profile));

// Cleanup when component unmounts
onDestroy(() => {
  componentState.destroy();
});
```

## Framework Integration

### Svelte Integration

```svelte
<script>
  import { createFeed, createQueryBuilder, derived } from 'nostr-unchained';
  import { onDestroy } from 'svelte';
  
  // Reactive feeds
  const posts = createFeed(
    createQueryBuilder()
      .kind(1)
      .since('1 hour ago')
      .limit(50)
  );
  
  const userPosts = createFeed(
    createQueryBuilder()
      .kind(1)
      .authors(['npub1alice...'])
      .limit(100)
  );
  
  // Derived state
  const postCount = derived(posts, $posts => $posts.length);
  const hasNewPosts = derived(
    posts,
    ($posts, set) => {
      const unread = $posts.filter(p => p.isNew).length;
      set(unread > 0);
    },
    false
  );
  
  // Cleanup automatically handled by Svelte
</script>

<!-- Reactive template -->
<div class="feed">
  <h2>Recent Posts ({$postCount})</h2>
  
  {#if $hasNewPosts}
    <div class="new-posts-indicator">
      New posts available
    </div>
  {/if}
  
  {#each $posts as post (post.id)}
    <article class="post">
      <header>
        <strong>{post.pubkey}</strong>
        <time>{new Date(post.created_at * 1000).toLocaleString()}</time>
      </header>
      <p>{post.content}</p>
    </article>
  {/each}
</div>

<div class="user-posts">
  <h3>User Posts ({$userPosts.length})</h3>
  {#each $userPosts as post}
    <div class="user-post">{post.content}</div>
  {/each}
</div>
```

### React Integration

```tsx
import { useEffect, useState } from 'react';
import { createFeed, createQueryBuilder } from 'nostr-unchained';

function useNostrFeed(queryBuilder) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const feed = createFeed(queryBuilder);
    
    const unsubscribe = feed.subscribe(newEvents => {
      setEvents(newEvents);
      setLoading(false);
    });
    
    return unsubscribe; // Cleanup
  }, [queryBuilder]);
  
  return { events, loading };
}

function PostFeed() {
  const queryBuilder = createQueryBuilder()
    .kind(1)
    .since('1 hour ago')
    .limit(50);
    
  const { events, loading } = useNostrFeed(queryBuilder);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="feed">
      {events.map(event => (
        <article key={event.id} className="post">
          <strong>{event.pubkey}</strong>
          <p>{event.content}</p>
        </article>
      ))}
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div class="feed">
    <h2>Posts ({{ posts.length }})</h2>
    <article v-for="post in posts" :key="post.id" class="post">
      <strong>{{ post.pubkey }}</strong>
      <p>{{ post.content }}</p>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { createFeed, createQueryBuilder } from 'nostr-unchained';

const posts = ref([]);
let unsubscribe;

onMounted(() => {
  const feed = createFeed(
    createQueryBuilder()
      .kind(1)
      .since('1 hour ago')
      .limit(50)
  );
  
  unsubscribe = feed.subscribe(events => {
    posts.value = events;
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>
```

## API Reference

### Store Creation

```typescript
// Basic stores
writable<T>(initialValue: T): Writable<T>
readable<T>(initialValue: T, start?: StartStopNotifier<T>): Readable<T>
derived<T, S>(store: Readable<S>, fn: (value: S) => T): Readable<T>

// Feed stores
createFeed(queryBuilder: QueryBuilder, options?: FeedOptions): FeedStore
createFeedFromQuery(query: string, options?: FeedOptions): FeedStore
createFeedFromFilter(filter: Filter, options?: FeedOptions): FeedStore
```

### Store Interface

```typescript
interface Readable<T> {
  subscribe(fn: (value: T) => void): () => void;
  get(): T;
}

interface Writable<T> extends Readable<T> {
  set(value: T): void;
  update(fn: (value: T) => T): void;
}

interface FeedStore extends Readable<NostrEvent[]> {
  refetch(): Promise<void>;
  invalidate(): Promise<void>;
  pause(): void;
  resume(): void;
  destroy(): void;
}
```

### Configuration Options

```typescript
interface FeedOptions {
  cacheTime?: number;          // Cache duration (ms)
  staleTime?: number;          // Stale time (ms)
  refetchOnFocus?: boolean;    // Refetch on window focus
  refetchInterval?: number;    // Auto-refetch interval (ms)
  retryAttempts?: number;      // Retry failed requests
  retryDelay?: number;         // Delay between retries (ms)
  debounceMs?: number;         // Debounce rapid updates (ms)
  debug?: boolean;             // Enable debug logging
}
```

---

**Next Steps:**
- [Event Publishing](../events/README.md) - Create and publish events
- [Query Engine](../query/README.md) - Advanced querying patterns
- [Social Media](../social/README.md) - Social networking features