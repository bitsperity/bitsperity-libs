# 👥 Social Media Core Module

The Social module provides complete social networking primitives with reactive state management, covering profiles, contacts, threading, reactions, and feeds.

## Table of Contents

- [Quick Start](#quick-start)
- [Profile Management](#profile-management)
- [Contact System](#contact-system)
- [Threaded Conversations](#threaded-conversations)
- [Reaction System](#reaction-system)
- [Social Feeds](#social-feeds)
- [Real-time Updates](#real-time-updates)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();

// Profile management
await nostr.social.profiles.update({
  name: 'Alice',
  about: 'Nostr enthusiast and developer',
  picture: 'https://example.com/alice.jpg'
});

// Follow someone
await nostr.social.contacts.follow('npub1bob...');

// Create a thread
const thread = await nostr.social.threads.create({
  content: 'What do you think about decentralized social media?',
  mentions: ['npub1bob...', 'npub1charlie...']
});

// React to content
await nostr.social.reactions.react({
  targetEventId: thread.eventId,
  targetAuthorPubkey: thread.authorPubkey,
  reactionType: '🔥'
});

// Get feeds
const globalFeed = await nostr.social.feeds.getGlobalFeed({ limit: 20 });
const followingFeed = await nostr.social.feeds.getFollowingFeed({ limit: 10 });
```

## Profile Management

Profiles in Nostr are NIP-01 Kind 0 events containing user metadata:

### Creating and Updating Profiles

```typescript
// Create/update your profile
const result = await nostr.social.profiles.update({
  name: 'Alice Smith',
  about: 'Software developer interested in decentralized protocols',
  picture: 'https://example.com/alice-avatar.jpg',
  banner: 'https://example.com/alice-banner.jpg',
  website: 'https://alice.dev',
  nip05: 'alice@alice.dev',
  lud16: 'alice@getalby.com' // Lightning address
});

if (result.success) {
  console.log(`Profile updated: ${result.eventId}`);
} else {
  console.error(`Profile update failed: ${result.error}`);
}
```

### Fetching Profiles

```typescript
// Get a specific user's profile
const profile = await nostr.social.profiles.get('npub1alice...');

if (profile) {
  console.log(`Name: ${profile.name}`);
  console.log(`About: ${profile.about}`);
  console.log(`Picture: ${profile.picture}`);
  console.log(`Website: ${profile.website}`);
} else {
  console.log('Profile not found');
}

// Get multiple profiles
const profiles = await nostr.social.profiles.getMany([
  'npub1alice...',
  'npub1bob...',
  'npub1charlie...'
]);

profiles.forEach(profile => {
  console.log(`${profile.pubkey}: ${profile.name || 'Anonymous'}`);
});
```

### Reactive Profile Updates

```typescript
// Watch for profile changes
const profileStore = nostr.social.profiles.watch('npub1alice...');

profileStore.subscribe(profile => {
  if (profile) {
    console.log(`Profile updated: ${profile.name}`);
    
    // Update UI
    document.getElementById('username').textContent = profile.name;
    document.getElementById('avatar').src = profile.picture;
  }
});

// Stop watching
profileStore.unsubscribe();
```

### Profile Validation

```typescript
// Verify NIP-05 identifier
const verification = await nostr.social.profiles.verifyNip05('alice@alice.dev');

if (verification.valid) {
  console.log(`✅ Verified: ${verification.pubkey}`);
} else {
  console.log(`❌ Verification failed: ${verification.error}`);
}

// Check profile completeness
const completeness = await nostr.social.profiles.checkCompleteness('npub1alice...');

console.log(`Profile completeness: ${completeness.score}%`);
console.log(`Missing fields: ${completeness.missing.join(', ')}`);
```

## Contact System

The contact system implements NIP-02 for managing follow/follower relationships:

### Following Users

```typescript
// Follow a user
const followResult = await nostr.social.contacts.follow('npub1alice...');

if (followResult.success) {
  console.log('Successfully followed Alice');
} else {
  console.error(`Follow failed: ${followResult.error}`);
}

// Follow with relay hint
await nostr.social.contacts.follow('npub1bob...', {
  relayHint: 'wss://relay.example.com',
  name: 'Bob' // Display name
});

// Unfollow a user
await nostr.social.contacts.unfollow('npub1charlie...');
```

### Managing Contact Lists

```typescript
// Get your contact list
const contacts = await nostr.social.contacts.getContacts();

console.log(`Following: ${contacts.followingCount}`);
console.log(`Followers: ${contacts.followerCount}`);

// List all people you follow
contacts.followingList.forEach(pubkey => {
  console.log(`Following: ${pubkey}`);
});

// List your followers
contacts.followersList.forEach(pubkey => {
  console.log(`Follower: ${pubkey}`);
});
```

### Reactive Contact Updates

```typescript
// Watch for contact list changes
const contactsStore = nostr.social.contacts.watchContacts();

contactsStore.subscribe(contacts => {
  console.log(`Following: ${contacts.followingCount}`);
  console.log(`Followers: ${contacts.followerCount}`);
  
  // Update UI
  updateFollowingList(contacts.followingList);
  updateFollowerCount(contacts.followerCount);
});
```

### Relationship Queries

```typescript
// Check if you follow someone
const isFollowing = await nostr.social.contacts.isFollowing('npub1alice...');
console.log(`Following Alice: ${isFollowing}`);

// Check if someone follows you
const isFollower = await nostr.social.contacts.isFollower('npub1bob...');
console.log(`Bob follows me: ${isFollower}`);

// Get mutual follows
const mutuals = await nostr.social.contacts.getMutualFollows('npub1charlie...');
console.log(`${mutuals.length} mutual connections with Charlie`);

// Find follow suggestions
const suggestions = await nostr.social.contacts.getSuggestions({
  limit: 10,
  basedOn: 'mutual_follows' // Algorithm for suggestions
});

suggestions.forEach(suggestion => {
  console.log(`Suggested: ${suggestion.pubkey} (${suggestion.score} relevance)`);
});
```

## Threaded Conversations

Implement NIP-10 threaded conversations with proper reply chains:

### Creating Threads

```typescript
// Start a new thread
const thread = await nostr.social.threads.create({
  content: 'What are your thoughts on the latest NIP proposals?',
  mentions: ['npub1alice...', 'npub1bob...'],
  hashtags: ['nostr', 'nips']
});

console.log(`Thread created: ${thread.eventId}`);
```

### Replying to Threads

```typescript
// Reply to a thread
const reply = await nostr.social.threads.reply({
  content: 'I think NIP-17 is a game changer for privacy!',
  replyToEventId: thread.eventId,
  rootEventId: thread.eventId, // Same as replyTo for direct replies
  mentions: ['npub1alice...'] // Mention original author
});

// Reply to a specific message in the thread
const nestedReply = await nostr.social.threads.reply({
  content: 'Agreed! The gift wrap protocol is brilliant.',
  replyToEventId: reply.eventId, // Replying to the reply
  rootEventId: thread.eventId,   // Original thread root
  mentions: ['npub1bob...']      // Mention the reply author
});
```

### Reading Threads

```typescript
// Get a complete thread
const threadData = await nostr.social.threads.getThread(thread.eventId);

console.log(`Thread: "${threadData.rootMessage.content}"`);
console.log(`${threadData.messageCount} total messages`);

// Display thread structure
threadData.messages.forEach(message => {
  const indent = '  '.repeat(message.depth);
  console.log(`${indent}${message.authorPubkey}: ${message.content}`);
});

// Get thread participants
const participants = threadData.participants;
console.log(`${participants.length} participants in thread`);
```

### Real-time Thread Updates

```typescript
// Watch a thread for new replies
const threadWatcher = await nostr.social.threads.watch(thread.eventId);

threadWatcher.subscribe(threadUpdate => {
  const newMessages = threadUpdate.messages.filter(m => m.isNew);
  
  if (newMessages.length > 0) {
    console.log(`${newMessages.length} new replies in thread`);
    
    newMessages.forEach(message => {
      console.log(`New reply from ${message.authorPubkey}: ${message.content}`);
    });
  }
});

// Stop watching
await nostr.social.threads.unwatch(thread.eventId);
```

### Thread Navigation

```typescript
// Get thread ancestors (parent messages)
const ancestors = await nostr.social.threads.getAncestors(message.eventId);
ancestors.forEach((ancestor, depth) => {
  console.log(`Level ${depth}: ${ancestor.content}`);
});

// Get thread descendants (child messages)
const descendants = await nostr.social.threads.getDescendants(message.eventId);
console.log(`${descendants.length} replies to this message`);

// Find thread root
const root = await nostr.social.threads.getRoot(message.eventId);
console.log(`Thread root: ${root.content}`);
```

## Reaction System

Implement NIP-25 reactions with comprehensive emoji support:

### Basic Reactions

```typescript
// Like a post
await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: '+' // Standard like
});

// Dislike a post
await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: '-' // Standard dislike
});

// Custom emoji reaction
await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: '🔥' // Fire emoji
});
```

### Reaction Types

```typescript
// Standard reaction types
import { REACTION_TYPES } from 'nostr-unchained';

await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: REACTION_TYPES.LIKE        // '+'
});

await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: REACTION_TYPES.DISLIKE     // '-'
});

await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: REACTION_TYPES.LOVE        // '❤️'
});

await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: REACTION_TYPES.LAUGH       // '😂'
});

await nostr.social.reactions.react({
  targetEventId: 'note1abc...',
  targetAuthorPubkey: 'npub1alice...',
  reactionType: REACTION_TYPES.THUMBS_UP   // '👍'
});
```

### Reading Reactions

```typescript
// Get reaction summary for an event
const reactionSummary = await nostr.social.reactions.getSummary('note1abc...');

console.log(`Total reactions: ${reactionSummary.totalCount}`);
console.log(`User reacted: ${reactionSummary.userReacted}`);

// Show reaction breakdown
Object.entries(reactionSummary.reactions).forEach(([type, data]) => {
  console.log(`${type}: ${data.count} reactions from ${data.authors.length} users`);
});

// Get detailed reaction list
const reactions = await nostr.social.reactions.getReactions('note1abc...');

reactions.reactions.forEach(reaction => {
  console.log(`${reaction.reactionType} from ${reaction.authorPubkey}`);
});
```

### Real-time Reaction Updates

```typescript
// Watch for reactions on an event
const reactionWatcher = await nostr.social.reactions.watch('note1abc...');

reactionWatcher.subscribe(reactionUpdate => {
  console.log(`Total reactions: ${reactionUpdate.totalCount}`);
  console.log(`User reacted: ${reactionUpdate.userReacted}`);
  
  // Update UI
  updateReactionButtons(reactionUpdate);
  showReactionCounts(reactionUpdate.reactions);
});

// Stop watching
await nostr.social.reactions.unwatch('note1abc...');
```

## Social Feeds

Get curated feeds of social content:

### Global Feed

```typescript
// Get recent global posts
const globalFeed = await nostr.social.feeds.getGlobalFeed({
  limit: 50,
  since: '1 hour ago',
  kinds: [1] // Text notes only
});

globalFeed.forEach(post => {
  console.log(`${post.authorPubkey}: ${post.content}`);
});
```

### Following Feed

```typescript
// Get posts from people you follow
const followingFeed = await nostr.social.feeds.getFollowingFeed({
  limit: 20,
  since: '6 hours ago'
});

console.log(`${followingFeed.length} posts from people you follow`);

followingFeed.forEach(post => {
  console.log(`${post.authorProfile?.name || post.authorPubkey}: ${post.content}`);
});
```

### Real-time Feed Updates

```typescript
// Start real-time feed updates
await nostr.social.feeds.startFeedUpdates();

// Subscribe to global feed updates
nostr.social.feeds.globalFeed.subscribe(feed => {
  console.log(`Global feed updated: ${feed.length} posts`);
  updateGlobalFeedUI(feed);
});

// Subscribe to following feed updates
nostr.social.feeds.followingFeed.subscribe(feed => {
  console.log(`Following feed updated: ${feed.length} posts`);
  updateFollowingFeedUI(feed);
});

// Stop real-time updates
await nostr.social.feeds.stopFeedUpdates();
```

### Custom Feeds

```typescript
// Create a hashtag feed
const nostrFeed = await nostr.query()
  .kind(1)
  .tag('t', 'nostr')
  .since('1 day ago')
  .limit(30)
  .fetch();

// Create a mentions feed
const mentions = await nostr.query()
  .kind(1)
  .tag('p', await nostr.getPublicKey())
  .since('1 week ago')
  .fetch();

// Create a geographic feed
const localFeed = await nostr.query()
  .kind(1)
  .tag('g', 'city:san-francisco')
  .since('1 day ago')
  .fetch();
```

## Real-time Updates

All social components support real-time updates through reactive stores:

### Reactive Architecture

```typescript
// Profile updates
const profile = nostr.social.profiles.watch('npub1alice...');
profile.subscribe(p => updateProfileUI(p));

// Contact list updates
const contacts = nostr.social.contacts.watchContacts();
contacts.subscribe(c => updateContactsUI(c));

// Thread updates
const thread = nostr.social.threads.watch('note1abc...');
thread.subscribe(t => updateThreadUI(t));

// Reaction updates
const reactions = nostr.social.reactions.watch('note1abc...');
reactions.subscribe(r => updateReactionsUI(r));

// Feed updates
nostr.social.feeds.globalFeed.subscribe(f => updateFeedUI(f));
```

### Using with Svelte

```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  
  // Reactive stores automatically work with Svelte
  const profile = nostr.social.profiles.watch('npub1alice...');
  const thread = nostr.social.threads.watch('note1abc...');
  const reactions = nostr.social.reactions.watch('note1abc...');
</script>

<!-- Automatically reactive to updates -->
{#if $profile}
  <div class="profile">
    <img src={$profile.picture} alt={$profile.name} />
    <h2>{$profile.name}</h2>
    <p>{$profile.about}</p>
  </div>
{/if}

<div class="thread">
  {#each $thread.messages as message}
    <div class="message" style="margin-left: {message.depth * 20}px">
      <strong>{message.authorPubkey}</strong>
      <p>{message.content}</p>
      
      <!-- Reaction buttons -->
      <div class="reactions">
        {#each Object.entries($reactions.reactions) as [type, data]}
          <button class="reaction-btn">
            {type} {data.count}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>
```

## API Reference

### Profile Manager

```typescript
// Profile operations
profiles.update(metadata: ProfileMetadata): Promise<ProfileResult>
profiles.get(pubkey: string): Promise<Profile | null>
profiles.getMany(pubkeys: string[]): Promise<Profile[]>
profiles.watch(pubkey: string): Readable<Profile | null>
profiles.verifyNip05(identifier: string): Promise<VerificationResult>
```

### Contact Manager

```typescript
// Contact operations
contacts.follow(pubkey: string, options?: FollowOptions): Promise<ContactResult>
contacts.unfollow(pubkey: string): Promise<ContactResult>
contacts.getContacts(pubkey?: string): Promise<ContactList>
contacts.watchContacts(pubkey?: string): Readable<ContactList>
contacts.isFollowing(pubkey: string): Promise<boolean>
contacts.getMutualFollows(pubkey: string): Promise<string[]>
```

### Thread Manager

```typescript
// Thread operations
threads.create(request: ThreadCreateRequest): Promise<ThreadResult>
threads.reply(request: ThreadReplyRequest): Promise<ThreadResult>
threads.getThread(eventId: string): Promise<ThreadData>
threads.watch(eventId: string): Readable<ThreadData>
threads.getAncestors(eventId: string): Promise<ThreadMessage[]>
threads.getDescendants(eventId: string): Promise<ThreadMessage[]>
```

### Reaction Manager

```typescript
// Reaction operations
reactions.react(request: ReactionRequest): Promise<ReactionResult>
reactions.getReactions(eventId: string): Promise<ReactionCacheEntry | null>
reactions.getSummary(eventId: string): Promise<ReactionSummary | null>
reactions.watch(eventId: string): Readable<ReactionSummary>
```

### Feed Manager

```typescript
// Feed operations
feeds.getGlobalFeed(options?: FeedOptions): Promise<FeedItem[]>
feeds.getFollowingFeed(options?: FeedOptions): Promise<FeedItem[]>
feeds.startFeedUpdates(): Promise<void>
feeds.stopFeedUpdates(): Promise<void>

// Reactive feeds
feeds.globalFeed: Readable<FeedItem[]>
feeds.followingFeed: Readable<FeedItem[]>
```

---

**Next Steps:**
- [Reactive Stores](../stores/README.md) - Advanced state management patterns
- [Query Engine](../query/README.md) - Custom social queries  
- [Direct Messages](../dm/README.md) - Private messaging integration