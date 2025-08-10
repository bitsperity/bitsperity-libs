# 👥 Social Media Core

The Social Media Core provides end‑to‑end social features for Nostr apps — profiles, contacts, threads, reactions, feeds — built on the Universal Cache Architecture.

## 🎯 Core Features

### 👤 Profile Management
- Cache‑first profile loading (<10ms)
- Automatic NIP‑05 verification (DNS based)
- Fluent profile builders
- Batch operations

### 👥 Contact Management  
- Follow/Unfollow with optimistic updates
- Contact list synchronization (NIP‑02)
- Petnames
- Relay‑specific contacts

### 💬 Threading & Conversations
- Nested threads with proper reply markers
- Thread root detection
- Real‑time updates via cache synchronization

### ❤️ Reactions & Engagement
- NIP‑25 reactions (emoji/custom)
- Like/dislike aggregation
- Reaction counts

### 📰 Social Feeds
- Global timeline
- Following feed
- Custom feeds with advanced filters
- Real‑time updates

## 🚀 Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.connect();
await nostr.useExtensionSigner();

// 👤 Profile Management
const myProfile = nostr.profile.get('my-pubkey');
myProfile.subscribe(state => {
  console.log('Profile:', state.profile?.name);
  console.log('Followers:', state.followersCount);
  console.log('Following:', state.followingCount);
});

// Update profile
await nostr.profile.edit()
  .name('Alice Cooper')
  .about('Bitcoin & Nostr Enthusiast')
  .picture('https://example.com/avatar.jpg')
  .nip05('alice@domain.com')
  .publish();

// 👥 Contact Management  
await nostr.profile.follows.add('npub1bob...')
  .petname('Bob Bitcoin')
  .relay('wss://relay.example.com')
  .publish();

// 💬 Social Interactions
await nostr.social.post('Hello Nostr! 🌍')
  .hashtag('nostr')
  .hashtag('introduction')
  .publish();

// React to posts
await nostr.social.react('note1xyz...', '🔥');
await nostr.social.react('note1abc...', '❤️');

// 📰 Social Feeds
const globalFeed = nostr.social.feeds.global();
const followingFeed = nostr.social.feeds.following();

globalFeed.subscribe(posts => {
  console.log(`Global: ${posts.length} posts`);
});

followingFeed.subscribe(posts => {
  console.log(`Following: ${posts.length} posts`);
});
```

## 📊 API Architecture

### Social Module Structure
```typescript
nostr.social.
├── profiles.           // Profile discovery & management
├── contacts.           // Follow/unfollow operations  
├── threads.            // Thread creation & navigation
├── reactions.          // Like/reaction system
├── feeds.              // Timeline & feed generation
└── content.            // Content creation helpers
```

### Query‑Based Implementation

All social features are query wrappers – no direct network access:

```typescript
// Social feed = cache query for posts + profile enrichment
const feed = nostr.query()
  .kinds([1])                           // Text posts
  .authors(followingList)               // From contacts
  .execute();

// Reactions = cache query for kind 7 events  
const reactions = nostr.query()
  .kinds([7])                           // Reaction events
  .tags('e', [postId])                  // For specific post
  .execute();

// Profiles = cache query for kind 0 events
const profiles = nostr.query()
  .kinds([0])                           // Profile metadata
  .authors([...authorPubkeys])          // For post authors
  .execute();
```

## 👤 Profile Management

### Reactive Profile Access

```typescript
// Get reactive profile store
const profile = nostr.social.profiles.get('npub1alice...');

profile.subscribe(state => {
  console.log('Name:', state.profile?.name);
  console.log('Verified:', state.verified);
  console.log('Loading:', state.loading);
  console.log('Followers:', state.followersCount);
  console.log('Following:', state.followingCount);
});

// Current profile data (synchronous)
const currentProfile = profile.current;
console.log(`Currently: ${currentProfile.profile?.name || 'Unknown'}`);
```

### Profile Creation & Updates

```typescript
// Fluent profile builder
await nostr.social.profiles.edit()
  .name('Alice Cooper')
  .about('Bitcoin maximalist, Nostr developer')
  .picture('https://alice.com/avatar.jpg')
  .banner('https://alice.com/banner.jpg')
  .nip05('alice@bitcoin.org')
  .website('https://alice.com')
  .lud16('alice@getalby.com')
  .publish();

// Batch profile updates
const updates = nostr.social.profiles.batch()
  .name('New Name')
  .about('Updated bio')
  .picture('https://new-avatar.jpg');

const result = await updates.publish();
console.log(`Profile updated on ${result.successCount} relays`);
```

### Profile Discovery

```typescript
// Search profiles by various criteria
const results = await nostr.social.profiles.discover()
  .byName('bitcoin')              // Search in display names
  .byNip05('*.bitcoin.org')       // Search NIP-05 domains
  .byAbout('developer')           // Search bio content
  .verified()                     // Only NIP-05 verified
  .limit(20)
  .execute();

console.log(`Found ${results.length} profiles`);

// Advanced discovery with relevance scoring
const bitcoinDevs = await nostr.social.profiles.discover()
  .byKeywords(['bitcoin', 'btc', 'lightning'])
  .byAbout('developer')
  .minFollowers(100)
  .sortBy('relevance')
  .execute();
```

## 👥 Contact Management

### Follow Operations

```typescript
// Follow user with metadata
await nostr.social.contacts.follow('npub1bob...')
  .petname('Bob Bitcoin')                    // Personal alias
  .relay('wss://relay.bob.com')             // Preferred relay
  .note('Met at Bitcoin conference 2024')    // Personal note
  .publish();

// Unfollow
await nostr.social.contacts.unfollow('npub1bob...');

// Batch follow operations
const batch = nostr.social.contacts.batch();
await batch
  .follow('npub1alice...').petname('Alice')
  .follow('npub1charlie...').petname('Charlie')
  .unfollow('npub1old...')
  .publish();
```

### Contact List Management

```typescript
// Get reactive contact lists
const following = nostr.social.contacts.following();
const followers = nostr.social.contacts.followers();

following.subscribe(contacts => {
  console.log(`Following ${contacts.length} users:`);
  contacts.forEach(contact => {
    console.log(`- ${contact.petname || contact.pubkey}: ${contact.relay || 'default'}`);
  });
});

followers.subscribe(followers => {
  console.log(`${followers.length} followers`);
});

// Get specific contact info
const bobContact = nostr.social.contacts.get('npub1bob...');
bobContact.subscribe(contact => {
  console.log('Bob contact info:', {
    petname: contact?.petname,
    relay: contact?.relay,
    note: contact?.note,
    isFollowing: contact?.isFollowing,
    isFollower: contact?.isFollower
  });
});
```

## 💬 Threading & Conversations

### Thread Creation

```typescript
// Create root post
const rootPost = await nostr.social.threads.create()
  .content('What do you think about the Lightning Network?')
  .hashtag('bitcoin')
  .hashtag('lightning')
  .publish();

// Reply to root post
await nostr.social.threads.reply(rootPost.eventId)
  .content('I think it\'s revolutionary for micropayments!')
  .publish();

// Continue thread
await nostr.social.threads.reply(replyEventId)
  .content('Agreed! The UX improvements have been amazing.')
  .replyTo(rootPost.eventId)  // Reference thread root
  .publish();
```

### Thread Navigation

```typescript
// Get thread tree
const thread = nostr.social.threads.get('note1root...');

thread.subscribe(threadData => {
  console.log('Thread structure:');
  console.log('Root:', threadData.root);
  console.log('Replies:', threadData.replies.length);
  console.log('Total messages:', threadData.totalCount);
  
  // Navigate thread tree
  threadData.replies.forEach(reply => {
    console.log(`Reply by ${reply.author}: ${reply.content}`);
    reply.replies.forEach(nestedReply => {
      console.log(`  └─ ${nestedReply.author}: ${nestedReply.content}`);
    });
  });
});

// Get thread with context
const contextThread = nostr.social.threads.getWithContext('note1reply...', {
  contextSize: 5,      // Show 5 messages before/after
  maxDepth: 3          // Maximum thread nesting
});
```

## ❤️ Reactions & Engagement

### Reaction System

```typescript
// React to posts
await nostr.social.reactions.like('note1xyz...');
await nostr.social.reactions.dislike('note1abc...');
await nostr.social.reactions.emoji('note1def...', '🔥');
await nostr.social.reactions.custom('note1ghi...', '+1', 'upvote');

// Remove reactions
await nostr.social.reactions.remove('note1xyz...');

// Get reactions for post
const postReactions = nostr.social.reactions.get('note1xyz...');
postReactions.subscribe(reactions => {
  console.log('Reactions summary:');
  console.log('Likes:', reactions.likes.count, reactions.likes.users);
  console.log('Dislikes:', reactions.dislikes.count);
  console.log('Emojis:', reactions.emojis); // { '🔥': 5, '❤️': 3 }
  console.log('My reaction:', reactions.myReaction);
});
```

### Engagement Analytics

```typescript
// Get engagement stats for user's posts
const myEngagement = nostr.social.analytics.engagement('my-pubkey');
myEngagement.subscribe(stats => {
  console.log('Engagement Statistics:');
  console.log('Total posts:', stats.totalPosts);
  console.log('Total likes received:', stats.totalLikes);
  console.log('Average likes per post:', stats.avgLikes);
  console.log('Most popular post:', stats.topPost);
  console.log('Engagement rate:', stats.engagementRate);
});

// Get reaction leaderboard
const topReactors = nostr.social.analytics.topReactors('my-pubkey');
topReactors.subscribe(reactors => {
  console.log('Top people who react to my posts:');
  reactors.forEach(reactor => {
    console.log(`${reactor.name}: ${reactor.reactionCount} reactions`);
  });
});
```

## 📰 Social Feeds

## 🗂️ Lists (NIP‑51)

Addressable lists (30000–30003):

- 30000: Follow categories
- 30001: Generic lists
- 30002: Relay collections
- 30003: Bookmarks

Publish and read with fluent API (subscription‑first caching):

```ts
// Bookmark-Liste anlegen
await nostr.lists
  .edit(30003, 'bookmarks')
  .title('Bookmarks')
  .description('Important posts to remember')
  .addEvent('e'.repeat(64))
  .addAddress(`30023:${await nostr.getPublicKey()}:article`)
  .addPerson(await nostr.getPublicKey(), 'wss://relay.example', 'Me')
  .topic('nostr')
  .publish();

// Lesen (reactive)
const bookmarks = nostr.lists.get(await nostr.getPublicKey(), 30003, 'bookmarks');
bookmarks.subscribe(list => {
  console.log(list?.title, list?.p?.length, list?.e?.length, list?.a?.length);
});
```

## 🏷️ Labels (NIP‑32)

Labeling via `kind:1985`. Targets: Events (`e`), Authors (`p`), Addressables (`a`), Relays (`r`), Topics (`t`). Namespaces with `L` tag; label values with `l` tag (with namespace mark).

```ts
// Event mit Namespace labeln
await nostr.labels
  .edit()
  .namespace('ISO-639-1')
  .label('en', 'ISO-639-1')
  .targetEvent('e'.repeat(64))
  .reason('language: English')
  .publish();

// Reactive lesen
const labelsForEvent = nostr.labels.forEvent('e'.repeat(64));
labelsForEvent.subscribe(events => console.log('labels', events.length));
```

Notes:
- `kind:1985` allows empty content (reason text is optional via `content`).
- Relay hints on `e`/`p` targets are recommended.

## 💬 Comments (NIP-22)

Universal comments (`kind: 1111`) on addressables, events or external content — with clear root/parent separation via tag case.

```ts
// Addressable (z. B. Artikel) kommentieren
const myPubkey = await nostr.getPublicKey();
await nostr.events.create().kind(30023).tag('d', 'article-1').content('My article').sign().then(async b => {
  await nostr.publishSigned(await b.build());
});

await nostr.comments
  .create()
  .onAddressableRoot(30023, myPubkey, 'article-1') // A/K/P root
  .replyToAddress(30023, myPubkey, 'article-1')     // a/k/p parent
  .content('Great article!')
  .publish();

// Reactive lesen
const comments = nostr.comments.getForAddressable(30023, myPubkey, 'article-1');
comments.subscribe(list => console.log('comments', list.length));
```

## 🧩 Communities (NIP‑72)

Moderated communities with replaceable definitions (`kind:34550`), posts (`kind:1111`), and approvals (`kind:4550`). This implementation uses the clean, modern NIP‑72 form (no legacy `kind:1` fallback).

```ts
// Create a community (34550)
const author = await nostr.getPublicKey();
await nostr.communities
  .create(author)
  .identifier('dev-community')
  .name('Dev Community')
  .description('All about Nostr dev')
  .moderator(author) // add moderators via p-tags with role=moderator
  .publish();

// Post into a community (1111) with proper NIP-72 tags (A/a, P/p, K/k)
await nostr.communities
  .postTo(author, 'dev-community')
  .content('Hello community!')
  .publish();

// Approve a post (4550) as moderator
const posts = nostr.communities.posts(author, 'dev-community');
const firstPost = posts.current?.[0];
if (firstPost) {
  await nostr.communities
    .approve({ authorPubkey: author, identifier: 'dev-community' })
    .post(firstPost)
    .publish();
}

// Readers
const community = nostr.communities.getCommunity(author, 'dev-community');
const moderators = nostr.communities.moderators(author, 'dev-community');
const approvals = nostr.communities.approvals(author, 'dev-community', firstPost?.id);
```

Notes:
- Community posts and replies carry community context via uppercase tags (`A/P/K`) and use lowercase tags (`e/p/k`) to reference parent posts.
- Replaceable community definitions use `d` identifiers; latest `created_at` wins.
- Approvals are normal events (`4550`); consumer logic can restrict to moderator pubkeys.

### Feed Types

```typescript
// Global timeline (all public posts)
const globalFeed = nostr.social.feeds.global({
  limit: 100,
  kinds: [1],                    // Text notes only
  since: Date.now() - 86400000   // Last 24 hours
});

// Following feed (posts from contacts)
const followingFeed = nostr.social.feeds.following({
  includeReplies: false,         // Exclude replies
  includeReposts: true           // Include reposts
});

// Hashtag feeds
const bitcoinFeed = nostr.social.feeds.hashtag('bitcoin', {
  limit: 50,
  includeReplies: true
});

// Custom feeds with advanced filters
const customFeed = nostr.social.feeds.create()
  .authors(['npub1alice...', 'npub1bob...'])
  .hashtags(['bitcoin', 'lightning'])
  .excludeReplies()
  .minEngagement(5)              // Minimum 5 reactions
  .sortBy('engagement')          // Sort by reaction count
  .execute();
```

### Feed Management

```typescript
// Create saved feed configurations
const savedFeed = await nostr.social.feeds.save('Bitcoin Experts', {
  authors: bitcoinExpertPubkeys,
  hashtags: ['bitcoin', 'btc'],
  minFollowers: 1000,
  verified: true
});

// Load saved feeds
const myFeeds = nostr.social.feeds.saved();
myFeeds.subscribe(feeds => {
  console.log('My saved feeds:');
  feeds.forEach(feed => {
    console.log(`${feed.name}: ${feed.config.authors.length} authors`);
  });
});

// Feed analytics
const feedStats = nostr.social.feeds.analytics('Bitcoin Experts');
feedStats.subscribe(stats => {
  console.log('Feed statistics:');
  console.log('Posts today:', stats.postsToday);
  console.log('Active authors:', stats.activeAuthors);
  console.log('Avg posts/day:', stats.avgPostsPerDay);
  console.log('Top hashtags:', stats.topHashtags);
});
```

## 🔍 Content Discovery

### Trending Content

```typescript
// Get trending posts
const trending = nostr.social.discover.trending({
  timeWindow: '24h',             // Last 24 hours
  minReactions: 10,             // At least 10 reactions
  kinds: [1]                    // Text notes only
});

trending.subscribe(posts => {
  console.log('Trending posts:');
  posts.forEach(post => {
    console.log(`${post.content.slice(0, 100)}... (${post.engagementScore} engagement)`);
  });
});

// Trending hashtags
const trendingTags = nostr.social.discover.trendingHashtags();
trendingTags.subscribe(tags => {
  console.log('Trending hashtags:', tags.map(t => `#${t.tag} (${t.count})`));
});

// Content recommendations
const recommendations = nostr.social.discover.recommended({
  basedOn: 'following',          // Based on who I follow
  diversity: 0.3,               // 30% diverse content
  limit: 20
});
```

### Search & Discovery

```typescript
// Full-text search (requires relay support)
const searchResults = await nostr.social.search.content('lightning network', {
  kinds: [1],
  timeRange: '7d',
  minEngagement: 2
});

// User search
const userResults = await nostr.social.search.users('bitcoin developer', {
  verified: true,
  minFollowers: 100
});

// Advanced search with filters
const advancedSearch = await nostr.social.search.advanced()
  .content('nostr')
  .hashtags(['protocol', 'decentralized'])
  .authors(verifiedDevelopersList)
  .dateRange(startDate, endDate)
  .sortBy('relevance')
  .execute();
```

## 🎯 Framework Integration

### Svelte Integration

```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  await nostr.connect();
  
  // Reactive social data
  const globalFeed = nostr.social.feeds.global();
  const myProfile = nostr.social.profiles.get('my-pubkey');
  const following = nostr.social.contacts.following();
</script>

<!-- Global feed -->
<div class="feed">
  <h2>Global Feed ({$globalFeed.length} posts)</h2>
  {#each $globalFeed as post (post.id)}
    <article class="post">
      <header>
        <strong>{post.author?.name || post.pubkey.slice(0, 8)}</strong>
        {#if post.author?.verified}✅{/if}
        <time>{new Date(post.created_at * 1000).toLocaleString()}</time>
      </header>
      <p>{post.content}</p>
      <footer class="reactions">
        <button on:click={() => nostr.social.reactions.like(post.id)}>
          ❤️ {post.reactions?.likes?.count || 0}
        </button>
        <button on:click={() => nostr.social.threads.reply(post.id)}>
          💬 Reply
        </button>
      </footer>
    </article>
  {/each}
</div>

<!-- Profile sidebar -->
<aside class="profile">
  {#if $myProfile.profile}
    <img src={$myProfile.profile.picture} alt="Avatar" />
    <h3>{$myProfile.profile.name}</h3>
    <p>{$myProfile.profile.about}</p>
    <div class="stats">
      <span>Following: {$following.length}</span>
      <span>Followers: {$myProfile.followersCount}</span>
    </div>
  {/if}
</aside>
```

### React Integration

```tsx
import { useState, useEffect } from 'react';
import { NostrUnchained } from 'nostr-unchained';

function SocialDashboard() {
  const [nostr] = useState(() => new NostrUnchained());
  const [feed, setFeed] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const setup = async () => {
      await nostr.connect();
      
      // Setup feed
      const globalFeed = nostr.social.feeds.global();
      const unsubFeed = globalFeed.subscribe(posts => setFeed(posts));
      
      // Setup profile
      const myProfile = nostr.social.profiles.get('my-pubkey');
      const unsubProfile = myProfile.subscribe(p => setProfile(p));
      
      return () => {
        unsubFeed();
        unsubProfile();
      };
    };
    
    setup();
  }, [nostr]);

  const handleLike = async (postId) => {
    await nostr.social.reactions.like(postId);
  };

  return (
    <div className="social-dashboard">
      <div className="feed">
        <h2>Global Feed ({feed.length} posts)</h2>
        {feed.map(post => (
          <article key={post.id} className="post">
            <header>
              <strong>{post.author?.name || post.pubkey.slice(0, 8)}</strong>
              {post.author?.verified && <span>✅</span>}
            </header>
            <p>{post.content}</p>
            <footer>
              <button onClick={() => handleLike(post.id)}>
                ❤️ {post.reactions?.likes?.count || 0}
              </button>
            </footer>
          </article>
        ))}
      </div>
      
      {profile && (
        <aside className="profile">
          <h3>{profile.profile?.name}</h3>
          <p>{profile.profile?.about}</p>
        </aside>
      )}
    </div>
  );
}
```

## 🚀 Performance Optimizations

### Lazy Loading Patterns

```typescript
// Lazy feed loading
class LazyFeedManager {
  private feeds = new Map();
  
  getFeed(type: string, options = {}) {
    const key = `${type}:${JSON.stringify(options)}`;
    
    if (!this.feeds.has(key)) {
      let feed;
      switch (type) {
        case 'global':
          feed = nostr.social.feeds.global(options);
          break;
        case 'following':
          feed = nostr.social.feeds.following(options);
          break;
        case 'hashtag':
          feed = nostr.social.feeds.hashtag(options.tag, options);
          break;
      }
      
      this.feeds.set(key, feed);
    }
    
    return this.feeds.get(key);
  }
}

// Usage
const feedManager = new LazyFeedManager();
const bitcoinFeed = feedManager.getFeed('hashtag', { tag: 'bitcoin' });
```

### Caching Strategies

```typescript
// Profile caching with TTL
class ProfileCache {
  private cache = new Map();
  private ttl = 300000; // 5 minutes
  
  async getProfile(pubkey: string) {
    const cached = this.cache.get(pubkey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.ttl) {
      return cached.profile;
    }
    
    // Cache miss - get from nostr
    const profileStore = nostr.social.profiles.get(pubkey);
    const profile = profileStore.current;
    
    this.cache.set(pubkey, {
      profile,
      timestamp: now
    });
    
    return profile;
  }
}
```

## 📊 API Reference

### Social Module Structure
```typescript
nostr.social: {
  profiles: ProfileManager;     // Profile operations
  contacts: ContactManager;     // Follow/unfollow operations
  threads: ThreadManager;       // Thread creation & navigation
  reactions: ReactionManager;   // Like/reaction system  
  feeds: FeedManager;           // Timeline generation
  discover: DiscoveryManager;   // Content discovery
  search: SearchManager;        // Search functionality
  analytics: AnalyticsManager;  // Engagement analytics
}
```

### Core Data Types
```typescript
interface UserProfile {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  website?: string;
  lud16?: string;
}

interface Contact {
  pubkey: string;
  petname?: string;
  relay?: string;
  note?: string;
  isFollowing: boolean;
  isFollower: boolean;
}

interface SocialPost {
  id: string;
  content: string;
  author: UserProfile | null;
  timestamp: number;
  replies: SocialPost[];
  reactions: ReactionSummary;
  hashtags: string[];
  mentions: string[];
}

interface ReactionSummary {
  likes: { count: number; users: string[] };
  dislikes: { count: number; users: string[] };
  emojis: Record<string, number>;
  myReaction?: string;
}
```

## 🎯 Best Practices

### Feed Performance
```typescript
// ✅ Good: Specific feed filters
const feed = nostr.social.feeds.global({
  limit: 50,                    // Reasonable limit
  since: Date.now() - 86400000, // Last 24 hours only
  kinds: [1]                    // Specific kinds
});

// ❌ Avoid: Too broad
const broadFeed = nostr.social.feeds.global(); // No limits
```

### Memory Management
```typescript
// ✅ Good: Cleanup subscriptions
const feed = nostr.social.feeds.global();
const unsubscribe = feed.subscribe(posts => updateUI(posts));

// Clean up when component unmounts
onDestroy(() => unsubscribe());
```

### Batch Operations
```typescript
// ✅ Good: Batch multiple operations
const batch = nostr.social.contacts.batch()
  .follow('npub1alice...').petname('Alice')
  .follow('npub1bob...').petname('Bob')  
  .unfollow('npub1old...');

await batch.publish(); // Single relay operation

// ❌ Less efficient: Individual operations
await nostr.social.contacts.follow('npub1alice...');
await nostr.social.contacts.follow('npub1bob...');
await nostr.social.contacts.unfollow('npub1old...');
```

---

Nostr Unchained’s Social Media Core powers robust, modern Nostr apps with an elegant, cache‑first architecture.

## 🔗 Related Documentation

- [Profile Management](../profile/README.md) - Detailed profile operations
- [Direct Messages](../dm/README.md) - Private messaging features  
- [Query Engine](../query/README.md) - Understanding the underlying queries
- [Universal Store System](../stores/README.md) - Reactive data management