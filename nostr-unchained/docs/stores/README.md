# 🏪 Universal Store System

The Universal Store System provides **Svelte-compatible reactive state management** built on the Universal Cache Architecture with automatic subscriptions and intelligent caching.

## Table of Contents

- [Quick Start](#quick-start)
- [Universal Store Architecture](#universal-store-architecture)
- [UniversalNostrStore](#universalnostrstore)
- [Reactive Patterns](#reactive-patterns)
- [Framework Integration](#framework-integration)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.connect();

// All queries and subscriptions return UniversalNostrStore
const postsStore = nostr.query().kinds([1]).execute();
const liveStore = nostr.sub().kinds([1]).execute();

// Both implement Svelte store interface
postsStore.subscribe(posts => {
  console.log(`Cache has ${posts.length} posts`);
});

liveStore.subscribe(posts => {
  console.log(`Live feed: ${posts.length} posts`);
});

// Synchronous access to current data
console.log(`Current cached: ${postsStore.current.length}`);
console.log(`Current live: ${liveStore.current.length}`);
```

## Universal Store Architecture

### The Elegant Design

**Everything is a UniversalNostrStore:**

```typescript
// Query returns UniversalNostrStore
const cached = nostr.query().kinds([1]).execute();

// Subscription returns UniversalNostrStore  
const live = nostr.sub().kinds([1]).execute();

// DM conversation returns UniversalNostrStore
const chat = nostr.dm.with(pubkey); // Also a UniversalNostrStore!

// All implement the same interface
interface UniversalNostrStore<T> {
  subscribe(callback: (value: T) => void): () => void;
  current: T;
}
```

### Data Flow

```
📡 Relays → 🔔 Subscriptions → 💾 Universal Cache → 📊 UniversalNostrStore → 🎨 UI
                                      ↓
                              🔍 Queries return same data
```

### Reactive Updates

All stores **automatically update** when related cache data changes:

```typescript
// Start subscription (fills cache)
const liveFeed = nostr.sub().kinds([1]).execute();

// Query same data (from cache)
const cachedFeed = nostr.query().kinds([1]).execute();

// DM conversation (uses cache for kind 14)
const dmChat = nostr.dm.with(pubkey);

// ALL stores update when new events arrive!
liveFeed.subscribe(posts => console.log('Live:', posts.length));
cachedFeed.subscribe(posts => console.log('Cache:', posts.length));
dmChat.subscribe(messages => console.log('DMs:', messages.length));
```

## UniversalNostrStore

### Core Interface

Every data access returns a `UniversalNostrStore`:

```typescript
interface UniversalNostrStore<T> {
  // Svelte store interface - subscribe to changes
  subscribe(callback: (value: T) => void): () => void;
  
  // Synchronous access to current value  
  current: T;
}
```

### Basic Usage

```typescript
// Get a store
const posts = nostr.query().kinds([1]).execute();

// Subscribe to changes (reactive)
const unsubscribe = posts.subscribe(events => {
  console.log(`Store updated: ${events.length} events`);
  
  events.forEach(event => {
    console.log(`${event.pubkey}: ${event.content}`);
  });
});

// Access current data (synchronous)
const currentPosts = posts.current;
console.log(`Right now: ${currentPosts.length} posts`);

// Stop listening
unsubscribe();
```

### Store Characteristics

- **Reactive**: Automatically updates when cache changes
- **Cached**: Data persists between subscriptions  
- **Filtered**: Only contains events matching the query
- **Svelte Compatible**: Works with `$store` syntax
- **Framework Agnostic**: Works with React, Vue, etc.

## Reactive Patterns

### Query + Subscription Pattern

Perfect for getting history + live updates:

```typescript
// 1. Get cached history (instant)
const cachedPosts = nostr.query()
  .kinds([1])
  .authors(['alice-pubkey'])
  .execute();

// 2. Start live subscription (fills cache)
const livePosts = nostr.sub()
  .kinds([1])
  .authors(['alice-pubkey'])  
  .execute();

// Both stores update with same data
cachedPosts.subscribe(posts => {
  console.log(`History: ${posts.length} posts`);
});

livePosts.subscribe(posts => {
  console.log(`Live: ${posts.length} posts`);
});

// They contain identical data (cache synchronization)
```

### Multiple Store Coordination

All stores using the same cache data stay synchronized:

```typescript
// Different queries on same data
const allPosts = nostr.query().kinds([1]).execute();
const alicePosts = nostr.query().kinds([1]).authors(['alice-pubkey']).execute();
const nostrPosts = nostr.query().kinds([1]).tags('t', ['nostr']).execute();

// Start subscription to fill cache
const liveStream = nostr.sub().kinds([1]).execute();

// All stores update when new posts arrive
allPosts.subscribe(posts => console.log('All:', posts.length));
alicePosts.subscribe(posts => console.log('Alice:', posts.length));
nostrPosts.subscribe(posts => console.log('Nostr:', posts.length));

// New post from Alice with #nostr → all 3 stores update!
```

### DM Store Integration

DM conversations are also UniversalNostrStores:

```typescript
// DM conversation
const chat = nostr.dm.with('alice-pubkey');

// Subscribe to conversation updates
chat.subscribe(messages => {
  console.log(`Conversation: ${messages.length} messages`);
  
  messages.forEach(msg => {
    console.log(`${msg.isFromMe ? 'Me' : 'Alice'}: ${msg.content}`);
  });
});

// Send message (store updates automatically)
await chat.send('Hello Alice!');

// Current messages (synchronous)
const currentMessages = chat.current;
console.log(`Currently ${currentMessages.length} messages`);
```

## Framework Integration

### Svelte Integration

Perfect integration with Svelte's reactive system:

```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  await nostr.connect();
  
  // Create reactive stores
  const posts = nostr.query().kinds([1]).execute();
  const dmChat = nostr.dm.with('alice-pubkey');
  
  // Derived state (optional - could be computed directly)
  $: postCount = $posts.length;
  $: hasNewMessages = $dmChat.some(msg => msg.isNew);
</script>

<!-- Automatically reactive with $ syntax -->
<div class="feed">
  <h2>Posts ({postCount})</h2>
  
  {#each $posts as post (post.id)}
    <article class="post">
      <strong>{post.pubkey.slice(0, 8)}...</strong>
      <p>{post.content}</p>
      <time>{new Date(post.created_at * 1000).toLocaleString()}</time>
    </article>
  {/each}
</div>

<div class="chat">
  <h3>Chat with Alice {#if hasNewMessages}(New!){/if}</h3>
  
  {#each $dmChat as message}
    <div class="message" class:from-me={message.isFromMe}>
      {message.content}
    </div>
  {/each}
  
  <button on:click={() => dmChat.send('Hello!')}>
    Send Message
  </button>
</div>

<!-- Current data access -->
<p>Currently {posts.current.length} cached posts</p>
```

### React Integration

Easy integration with React hooks:

```tsx
import { useState, useEffect } from 'react';
import { NostrUnchained } from 'nostr-unchained';

// Custom hook for UniversalNostrStore
function useNostrStore<T>(store: UniversalNostrStore<T>): T {
  const [data, setData] = useState<T>(store.current);
  
  useEffect(() => {
    const unsubscribe = store.subscribe(newData => {
      setData(newData);
    });
    
    return unsubscribe; // Cleanup
  }, [store]);
  
  return data;
}

function PostFeed() {
  const nostr = new NostrUnchained();
  const postsStore = nostr.query().kinds([1]).execute();
  const posts = useNostrStore(postsStore);
  
  return (
    <div className="feed">
      <h2>Posts ({posts.length})</h2>
      {posts.map(post => (
        <article key={post.id} className="post">
          <strong>{post.pubkey.slice(0, 8)}...</strong>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}

function ChatComponent({ pubkey }: { pubkey: string }) {
  const nostr = new NostrUnchained();
  const chatStore = nostr.dm.with(pubkey);
  const messages = useNostrStore(chatStore);
  
  const sendMessage = async () => {
    await chatStore.send('Hello from React!');
  };
  
  return (
    <div className="chat">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.eventId} className={msg.isFromMe ? 'from-me' : 'from-them'}>
            {msg.content}
          </div>
        ))}
      </div>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
}
```

### Vue Integration

Works great with Vue's reactivity:

```vue
<template>
  <div class="app">
    <div class="feed">
      <h2>Posts ({{ posts.length }})</h2>
      <article v-for="post in posts" :key="post.id" class="post">
        <strong>{{ post.pubkey.slice(0, 8) }}...</strong>
        <p>{{ post.content }}</p>
      </article>
    </div>
    
    <div class="chat">
      <h3>DM Chat</h3>
      <div v-for="message in dmMessages" :key="message.eventId" 
           :class="{ 'from-me': message.isFromMe }" class="message">
        {{ message.content }}
      </div>
      <button @click="sendMessage">Send Message</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { NostrUnchained } from 'nostr-unchained';

const posts = ref([]);
const dmMessages = ref([]);

let nostr;
let unsubscribePosts;
let unsubscribeDMs;

onMounted(async () => {
  nostr = new NostrUnchained();
  await nostr.connect();
  
  // Setup posts store
  const postsStore = nostr.query().kinds([1]).execute();
  unsubscribePosts = postsStore.subscribe(newPosts => {
    posts.value = newPosts;
  });
  
  // Setup DM store
  const dmStore = nostr.dm.with('alice-pubkey');
  unsubscribeDMs = dmStore.subscribe(newMessages => {
    dmMessages.value = newMessages;
  });
});

onUnmounted(() => {
  unsubscribePosts?.();
  unsubscribeDMs?.();
});

const sendMessage = async () => {
  const dmStore = nostr.dm.with('alice-pubkey');
  await dmStore.send('Hello from Vue!');
};
</script>
```

## Advanced Usage

### Custom Store Wrappers

Create specialized store wrappers:

```typescript
// Profile store wrapper
class ProfileStore {
  private store: UniversalNostrStore<NostrEvent[]>;
  
  constructor(pubkey: string, nostr: NostrUnchained) {
    this.store = nostr.query()
      .kinds([0])
      .authors([pubkey])
      .execute();
  }
  
  // Svelte store interface
  subscribe(callback: (profile: UserProfile | null) => void) {
    return this.store.subscribe(events => {
      const profileEvent = events[0]; // Most recent profile
      const profile = profileEvent ? JSON.parse(profileEvent.content) : null;
      callback(profile);
    });
  }
  
  get current(): UserProfile | null {
    const events = this.store.current;
    const profileEvent = events[0];
    return profileEvent ? JSON.parse(profileEvent.content) : null;
  }
}

// Usage
const aliceProfile = new ProfileStore('alice-pubkey', nostr);
aliceProfile.subscribe(profile => {
  console.log('Alice profile:', profile?.name || 'Unknown');
});
```

### Store Composition

Combine multiple stores for complex state:

```typescript
class SocialFeedState {
  private nostr: NostrUnchained;
  
  // Base stores
  private postsStore: UniversalNostrStore<NostrEvent[]>;
  private reactionsStore: UniversalNostrStore<NostrEvent[]>;
  private profilesStore: UniversalNostrStore<NostrEvent[]>;
  
  constructor(nostr: NostrUnchained, authorPubkeys: string[]) {
    this.nostr = nostr;
    
    // Create base stores
    this.postsStore = nostr.query().kinds([1]).authors(authorPubkeys).execute();
    this.reactionsStore = nostr.query().kinds([7]).execute(); 
    this.profilesStore = nostr.query().kinds([0]).authors(authorPubkeys).execute();
  }
  
  // Composed reactive state
  subscribe(callback: (feedData: FeedData) => void) {
    let posts: NostrEvent[] = [];
    let reactions: NostrEvent[] = [];
    let profiles: NostrEvent[] = [];
    
    const updateFeed = () => {
      const feedData = this.composeFeedData(posts, reactions, profiles);
      callback(feedData);
    };
    
    // Subscribe to all base stores
    const unsubPosts = this.postsStore.subscribe(newPosts => {
      posts = newPosts;
      updateFeed();
    });
    
    const unsubReactions = this.reactionsStore.subscribe(newReactions => {
      reactions = newReactions;
      updateFeed();
    });
    
    const unsubProfiles = this.profilesStore.subscribe(newProfiles => {
      profiles = newProfiles;
      updateFeed();
    });
    
    // Return cleanup function
    return () => {
      unsubPosts();
      unsubReactions();
      unsubProfiles();
    };
  }
  
  private composeFeedData(posts: NostrEvent[], reactions: NostrEvent[], profiles: NostrEvent[]): FeedData {
    // Combine data from all stores
    return {
      posts: posts.map(post => ({
        ...post,
        author: this.getAuthorProfile(post.pubkey, profiles),
        reactions: this.getPostReactions(post.id, reactions)
      }))
    };
  }
}
```

### Performance Patterns

Optimize store usage for better performance:

```typescript
// Lazy store creation
class LazyStoreManager {
  private stores = new Map<string, UniversalNostrStore<any>>();
  private nostr: NostrUnchained;
  
  constructor(nostr: NostrUnchained) {
    this.nostr = nostr;
  }
  
  // Only create stores when first accessed
  getPostsStore(authorPubkey: string): UniversalNostrStore<NostrEvent[]> {
    const key = `posts:${authorPubkey}`;
    
    if (!this.stores.has(key)) {
      const store = this.nostr.query()
        .kinds([1])
        .authors([authorPubkey])
        .execute();
      
      this.stores.set(key, store);
    }
    
    return this.stores.get(key)!;
  }
  
  getDMStore(pubkey: string): UniversalNostrStore<DMMessage[]> {
    const key = `dm:${pubkey}`;
    
    if (!this.stores.has(key)) {
      const store = this.nostr.dm.with(pubkey);
      this.stores.set(key, store);
    }
    
    return this.stores.get(key)!;
  }
}

// Usage
const storeManager = new LazyStoreManager(nostr);

// Stores created only when needed
const alicePosts = storeManager.getPostsStore('alice-pubkey');
const dmChat = storeManager.getDMStore('bob-pubkey');
```

## API Reference

### UniversalNostrStore Interface

```typescript
interface UniversalNostrStore<T> {
  // Svelte store interface
  subscribe(callback: (value: T) => void): () => void;
  
  // Synchronous current value access
  current: T;
}
```

### Store Types

```typescript
// Query stores (cache-based)
UniversalNostrStore<NostrEvent[]> = nostr.query().execute();

// Subscription stores (live updates)  
UniversalNostrStore<NostrEvent[]> = nostr.sub().execute();

// DM conversation stores
UniversalNostrStore<DMMessage[]> = nostr.dm.with(pubkey);

// DM room stores
UniversalNostrStore<RoomMessage[]> = nostr.dm.room(participants, options);
```

### Data Types

```typescript
// Nostr events
interface NostrEvent {
  id: string;
  pubkey: string;
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
  sig: string;
}

// DM messages  
interface DMMessage {
  content: string;
  timestamp: number;
  isFromMe: boolean;
  subject?: string;
  eventId: string;
  pubkey: string;
}

// Room messages
interface RoomMessage {
  content: string;
  timestamp: number;
  senderPubkey: string;
  eventId: string;
}
```

## Architecture Benefits

### For Users
- ✅ **Universal Interface**: Same API everywhere
- ✅ **Automatic Updates**: Stores update when cache changes  
- ✅ **Synchronous Access**: Get current data instantly
- ✅ **Framework Agnostic**: Works with any UI framework

### For Developers
- ✅ **Svelte Compatible**: Use `$store` syntax naturally
- ✅ **Predictable**: Same patterns for all data access
- ✅ **Composable**: Build complex state from simple stores
- ✅ **Reactive**: Automatic UI updates

### Performance & Reliability
- ✅ **Cached**: Data persists between subscriptions
- ✅ **Efficient**: No unnecessary re-renders
- ✅ **Memory Safe**: Automatic cleanup when unsubscribed
- ✅ **Error Resilient**: Graceful handling of failures

---

**Next Steps:**
- [Query Engine](../query/README.md) - Understanding store data sources
- [Direct Messages](../dm/README.md) - DM store usage patterns
- [Social Media](../social/README.md) - Social store integration