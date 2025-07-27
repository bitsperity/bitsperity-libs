# Session 4: Social Media Core - Implementation Plan

## Overview
Detailed implementation plan for building clean, intuitive, and complete social media APIs for nostr-unchained. This plan addresses the user's threading API concerns and provides a roadmap for professional-grade social media functionality.

## Architecture Overview

### Core Module Structure
```
src/social/
├── SocialModule.ts           # Main entry point (nostr.social)
├── profile/
│   ├── ProfileManager.ts     # Kind 0 profile management
│   ├── ProfileStore.ts       # Reactive profile state
│   └── ProfileValidator.ts   # Profile data validation
├── contacts/
│   ├── ContactManager.ts     # Kind 3 contact lists
│   ├── ContactStore.ts       # Reactive contact state
│   └── SocialGraph.ts        # Social graph algorithms
├── threads/
│   ├── ThreadManager.ts      # Thread construction & navigation
│   ├── ThreadStore.ts        # Reactive thread state
│   ├── ThreadBuilder.ts      # Thread tree building
│   └── ReplyTarget.ts        # Clear reply targeting
├── reactions/
│   ├── ReactionManager.ts    # Kind 7 reaction handling
│   ├── ReactionStore.ts      # Reactive reaction state
│   └── ReactionAggregator.ts # Reaction counting & analytics
├── feeds/
│   ├── FeedManager.ts        # Feed construction & management
│   ├── FeedStore.ts          # Reactive feed state
│   ├── FeedFilter.ts         # Content filtering
│   └── FeedAlgorithms.ts     # Feed ranking algorithms
└── types/
    ├── social-types.ts       # TypeScript interfaces
    └── nip-types.ts          # NIP-specific types
```

## Phase 1: Foundation & Profile Management (Days 1-2)

### Day 1: Core Infrastructure

#### 1.1 Create SocialModule Entry Point
```typescript
// src/social/SocialModule.ts
export class SocialModule {
  public readonly profile: ProfileManager;
  public readonly contacts: ContactManager;
  public readonly threads: ThreadManager;
  public readonly reactions: ReactionManager;
  public readonly feeds: FeedManager;

  constructor(private nostr: NostrUnchained) {
    this.profile = new ProfileManager(nostr);
    this.contacts = new ContactManager(nostr);
    this.threads = new ThreadManager(nostr);
    this.reactions = new ReactionManager(nostr);
    this.feeds = new FeedManager(nostr);
  }
}
```

#### 1.2 Define Social Types
```typescript
// src/social/types/social-types.ts
export interface ProfileData {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud06?: string;
  lud16?: string;
  website?: string;
  display_name?: string;
}

export interface ContactEntry {
  pubkey: string;
  relayUrl?: string;
  petname?: string;
}

export interface ThreadNode {
  event: NostrEvent;
  parent?: ThreadNode;
  children: ThreadNode[];
  depth: number;
}

export interface ReactionSummary {
  likes: number;
  dislikes: number;
  reactions: Record<string, number>;
  myReactions: string[];
}
```

#### 1.3 Integration with NostrUnchained
```typescript
// src/core/NostrUnchained.ts - Add social module
export class NostrUnchained {
  // ... existing code ...
  public readonly social: SocialModule;

  constructor(config: NostrUnchainedConfig = {}) {
    // ... existing initialization ...
    this.social = new SocialModule(this);
  }
}
```

### Day 2: Profile Management

#### 2.1 ProfileManager Implementation
```typescript
// src/social/profile/ProfileManager.ts
export class ProfileManager {
  private store: ProfileStore;

  async set(profileData: ProfileData): Promise<PublishResult> {
    // Validate profile data
    const validation = ProfileValidator.validate(profileData);
    if (!validation.valid) {
      throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
    }

    // Create Kind 0 event
    const event = await this.nostr.events.create()
      .kind(0)
      .content(JSON.stringify(profileData))
      .publish();

    // Update local store
    this.store.updateProfile(profileData);
    
    return event;
  }

  async get(pubkey?: string): Promise<ProfileData | null> {
    const targetPubkey = pubkey || await this.nostr.getExtensionPubkey();
    
    // Check cache first
    const cached = this.store.getProfile(targetPubkey);
    if (cached) return cached;

    // Query relays for latest profile
    const events = await this.nostr.query
      .kinds([0])
      .authors([targetPubkey])
      .limit(1)
      .execute();

    if (events.length === 0) return null;

    const profileData = JSON.parse(events[0].content);
    this.store.setProfile(targetPubkey, profileData);
    return profileData;
  }

  // Reactive store access
  get data() {
    return this.store;
  }
}
```

#### 2.2 ProfileStore (Reactive State)
```typescript
// src/social/profile/ProfileStore.ts
export class ProfileStore extends NostrStore<ProfileData> {
  private profiles = new Map<string, ProfileData>();
  private loadingStates = new Map<string, boolean>();

  getProfile(pubkey: string): ProfileData | null {
    return this.profiles.get(pubkey) || null;
  }

  setProfile(pubkey: string, profile: ProfileData): void {
    this.profiles.set(pubkey, profile);
    this.loadingStates.set(pubkey, false);
    this.notifySubscribers();
  }

  isLoading(pubkey: string): boolean {
    return this.loadingStates.get(pubkey) || false;
  }

  // Svelte store interface
  subscribe(run: (profile: ProfileData | null) => void) {
    return super.subscribe(run);
  }
}
```

## Phase 2: Contact Management & Threading (Days 3-4)

### Day 3: Contact Management

#### 3.1 ContactManager Implementation
```typescript
// src/social/contacts/ContactManager.ts
export class ContactManager {
  private store: ContactStore;

  async follow(pubkey: string, relayUrl?: string, petname?: string): Promise<PublishResult> {
    // Get current follow list
    const currentContacts = await this.getFollowing();
    
    // Add new contact
    const updatedContacts = [
      ...currentContacts,
      { pubkey, relayUrl, petname }
    ];

    return this.publishContactList(updatedContacts);
  }

  async unfollow(pubkey: string): Promise<PublishResult> {
    const currentContacts = await this.getFollowing();
    const updatedContacts = currentContacts.filter(c => c.pubkey !== pubkey);
    return this.publishContactList(updatedContacts);
  }

  async getFollowing(): Promise<ContactEntry[]> {
    const myPubkey = await this.nostr.getExtensionPubkey();
    
    // Query for latest contact list (Kind 3)
    const events = await this.nostr.query
      .kinds([3])
      .authors([myPubkey])
      .limit(1)
      .execute();

    if (events.length === 0) return [];

    // Parse p-tags to contacts
    return events[0].tags
      .filter(tag => tag[0] === 'p')
      .map(tag => ({
        pubkey: tag[1],
        relayUrl: tag[2] || undefined,
        petname: tag[3] || undefined
      }));
  }

  async getFollowers(): Promise<string[]> {
    const myPubkey = await this.nostr.getExtensionPubkey();
    
    // Query for contact lists that include me
    const events = await this.nostr.query
      .kinds([3])
      .tags('p', [myPubkey])
      .execute();

    return events.map(event => event.pubkey);
  }

  private async publishContactList(contacts: ContactEntry[]): Promise<PublishResult> {
    const tags = contacts.map(contact => {
      const tag = ['p', contact.pubkey];
      if (contact.relayUrl) tag.push(contact.relayUrl);
      if (contact.petname) {
        if (!contact.relayUrl) tag.push(''); // Ensure index consistency
        tag.push(contact.petname);
      }
      return tag;
    });

    return this.nostr.events.create()
      .kind(3)
      .content('')
      .tags.push(...tags)
      .publish();
  }
}
```

### Day 4: Threading System (Addressing User's Concern)

#### 4.1 ThreadManager - Clear Reply Targeting
```typescript
// src/social/threads/ThreadManager.ts
export class ThreadManager {
  
  /**
   * Get a complete thread structure from root event
   * Addresses the user's concern by providing clear thread context
   */
  async get(rootEventId: string): Promise<Thread> {
    const allEvents = await this.getAllThreadEvents(rootEventId);
    const threadTree = ThreadBuilder.buildTree(allEvents, rootEventId);
    
    return new Thread(threadTree, this.nostr);
  }

  /**
   * Get a specific event with reply capabilities
   * SOLVES: "how do we know which specific event we're replying to?"
   */
  async getEvent(eventId: string): Promise<ThreadEvent> {
    const event = await this.nostr.query
      .ids([eventId])
      .execute()
      .then(events => events[0]);

    if (!event) throw new Error(`Event ${eventId} not found`);

    return new ThreadEvent(event, this.nostr);
  }

  private async getAllThreadEvents(rootEventId: string): Promise<NostrEvent[]> {
    // Get all events that reference this root event
    const replies = await this.nostr.query
      .kinds([1])
      .tags('e', [rootEventId])
      .execute();

    // Get the root event itself
    const rootEvent = await this.nostr.query
      .ids([rootEventId])
      .execute()
      .then(events => events[0]);

    return [rootEvent, ...replies].filter(Boolean);
  }
}

/**
 * Thread class providing clear reply context
 */
export class Thread {
  constructor(
    private root: ThreadNode,
    private nostr: NostrUnchained
  ) {}

  get rootEvent(): NostrEvent {
    return this.root.event;
  }

  get replies(): NostrEvent[] {
    return this.getAllReplies(this.root);
  }

  get participants(): string[] {
    return [...new Set(this.replies.map(r => r.pubkey))];
  }

  /**
   * Reply to the root event - CLEAR intent
   */
  async replyToRoot(content: string): Promise<PublishResult> {
    return this.nostr.events.note(content)
      .replyTo(this.root.event.id, '', 'root')
      .mention(this.root.event.pubkey)
      .publish();
  }

  /**
   * Reply to a specific event in the thread - ADDRESSES USER'S CONCERN
   */
  async replyTo(eventId: string, content: string): Promise<PublishResult> {
    const targetEvent = this.findEventInThread(eventId);
    if (!targetEvent) {
      throw new Error(`Event ${eventId} not found in this thread`);
    }

    return this.nostr.events.note(content)
      .replyTo(eventId, '', 'reply')
      .replyTo(this.root.event.id, '', 'root') // Maintain thread context
      .mention(targetEvent.pubkey)
      .publish();
  }

  private findEventInThread(eventId: string): NostrEvent | null {
    // Search the thread tree for the specific event
    return this.searchNode(this.root, eventId);
  }

  private searchNode(node: ThreadNode, eventId: string): NostrEvent | null {
    if (node.event.id === eventId) return node.event;
    
    for (const child of node.children) {
      const found = this.searchNode(child, eventId);
      if (found) return found;
    }
    
    return null;
  }
}

/**
 * Individual event with reply capabilities - CLEAREST API
 */
export class ThreadEvent {
  constructor(
    private event: NostrEvent,
    private nostr: NostrUnchained
  ) {}

  get id(): string { return this.event.id; }
  get content(): string { return this.event.content; }
  get author(): string { return this.event.pubkey; }
  get createdAt(): number { return this.event.created_at; }

  /**
   * Reply to this specific event - CRYSTAL CLEAR which event we're replying to
   */
  async reply(content: string): Promise<PublishResult> {
    const rootEventId = this.getThreadRoot();
    
    return this.nostr.events.note(content)
      .replyTo(this.event.id, '', 'reply')        // THIS specific event
      .replyTo(rootEventId, '', 'root')           // Thread root for context
      .mention(this.event.pubkey)                 // Notify original author
      .publish();
  }

  /**
   * Get the parent event this event is replying to
   */
  async getParent(): Promise<ThreadEvent | null> {
    const replyTags = this.event.tags.filter(
      tag => tag[0] === 'e' && tag[3] === 'reply'
    );
    
    if (replyTags.length === 0) return null;
    
    const parentEvent = await this.nostr.query
      .ids([replyTags[0][1]])
      .execute()
      .then(events => events[0]);

    return parentEvent ? new ThreadEvent(parentEvent, this.nostr) : null;
  }

  /**
   * Get all direct replies to this event
   */
  async getReplies(): Promise<ThreadEvent[]> {
    const replies = await this.nostr.query
      .kinds([1])
      .tags('e', [this.event.id])
      .execute();

    return replies.map(event => new ThreadEvent(event, this.nostr));
  }

  private getThreadRoot(): string {
    const rootTags = this.event.tags.filter(
      tag => tag[0] === 'e' && tag[3] === 'root'
    );
    return rootTags.length > 0 ? rootTags[0][1] : this.event.id;
  }
}
```

## Phase 3: Reactions & Feeds (Days 5-6)

### Day 5: Reaction System

#### 5.1 ReactionManager Implementation
```typescript
// src/social/reactions/ReactionManager.ts
export class ReactionManager {
  
  async like(eventId: string): Promise<PublishResult> {
    return this.react(eventId, '+');
  }

  async dislike(eventId: string): Promise<PublishResult> {
    return this.react(eventId, '-');
  }

  async react(eventId: string, reaction: string): Promise<PublishResult> {
    // Get the original event to include author in p-tag
    const originalEvent = await this.nostr.query
      .ids([eventId])
      .execute()
      .then(events => events[0]);

    if (!originalEvent) {
      throw new Error(`Event ${eventId} not found`);
    }

    return this.nostr.events.create()
      .kind(7)
      .content(reaction)
      .tag('e', eventId)
      .tag('p', originalEvent.pubkey)
      .tag('k', originalEvent.kind.toString())
      .publish();
  }

  async get(eventId: string): Promise<ReactionSummary> {
    // Query all reactions to this event
    const reactions = await this.nostr.query
      .kinds([7])
      .tags('e', [eventId])
      .execute();

    return ReactionAggregator.aggregate(reactions);
  }

  // Reactive store for live reaction updates
  for(eventId: string): ReactionStore {
    return new ReactionStore(eventId, this.nostr);
  }
}
```

### Day 6: Feed Management

#### 6.1 FeedManager Implementation
```typescript
// src/social/feeds/FeedManager.ts
export class FeedManager {
  
  global(): FeedStore {
    const filter = this.nostr.query.kinds([1]);
    return new FeedStore(filter, this.nostr);
  }

  following(): FeedStore {
    return new FollowingFeedStore(this.nostr);
  }

  byAuthor(pubkey: string): FeedStore {
    const filter = this.nostr.query
      .kinds([1])
      .authors([pubkey]);
    return new FeedStore(filter, this.nostr);
  }

  byTopic(topic: string): FeedStore {
    const filter = this.nostr.query
      .kinds([1])
      .tags('t', [topic]);
    return new FeedStore(filter, this.nostr);
  }

  trending(): FeedStore {
    return new TrendingFeedStore(this.nostr);
  }
}

export class FeedStore extends NostrStore<NostrEvent[]> {
  private events: NostrEvent[] = [];
  private isLoading = false;
  private subscription?: SubscriptionResult;

  constructor(
    private query: QueryBuilder,
    private nostr: NostrUnchained
  ) {
    super();
    this.startRealtimeUpdates();
  }

  async loadMore(limit = 20): Promise<void> {
    this.isLoading = true;
    this.notifySubscribers();

    const olderEvents = await this.query
      .until(this.getOldestTimestamp())
      .limit(limit)
      .execute();

    this.events.push(...olderEvents);
    this.events.sort((a, b) => b.created_at - a.created_at);
    
    this.isLoading = false;
    this.notifySubscribers();
  }

  async refresh(): Promise<void> {
    const newerEvents = await this.query
      .since(this.getNewestTimestamp())
      .execute();

    this.events.unshift(...newerEvents);
    this.events.sort((a, b) => b.created_at - a.created_at);
    this.notifySubscribers();
  }

  private async startRealtimeUpdates(): Promise<void> {
    this.subscription = await this.query
      .since(Math.floor(Date.now() / 1000))
      .subscribe({
        onEvent: (event) => {
          this.events.unshift(event);
          this.events.sort((a, b) => b.created_at - a.created_at);
          this.notifySubscribers();
        }
      });
  }
}
```

## Phase 4: Testing & Documentation (Days 7-8)

### Day 7: Comprehensive Testing

#### 7.1 API Design Tests
```typescript
// tests/integration/social-api-clarity.test.ts
describe('Social API Clarity - Addressing User Concerns', () => {
  test('thread.reply() clearly shows which event is targeted', async () => {
    const nostr = new NostrUnchained();
    
    // Create original post
    const originalPost = await nostr.social.threads.getEvent(originalEventId);
    
    // CLEAR: We know exactly which event we're replying to
    const replyResult = await originalPost.reply("This clearly replies to the original post");
    
    expect(replyResult.success).toBe(true);
    expect(replyResult.event.tags).toContainEqual(['e', originalEventId, '', 'reply']);
  });

  test('thread.replyTo() explicitly targets specific events', async () => {
    const thread = await nostr.social.threads.get(rootEventId);
    
    // EXPLICIT: We specify exactly which event in the thread we're replying to
    const replyResult = await thread.replyTo(specificEventId, "Replying to that specific message");
    
    expect(replyResult.event.tags).toContainEqual(['e', specificEventId, '', 'reply']);
    expect(replyResult.event.tags).toContainEqual(['e', rootEventId, '', 'root']);
  });
});
```

#### 7.2 NIP Compliance Tests
```typescript
// tests/integration/nip-compliance.test.ts
describe('NIP Compliance', () => {
  test('NIP-02: Contact lists are properly formatted', async () => {
    await nostr.social.contacts.follow('pubkey123', 'wss://relay.com', 'alice');
    
    const followingList = await nostr.social.contacts.getFollowing();
    expect(followingList).toContainEqual({
      pubkey: 'pubkey123',
      relayUrl: 'wss://relay.com',
      petname: 'alice'
    });
  });

  test('NIP-10: Reply tags follow conventions exactly', async () => {
    const event = await nostr.social.threads.getEvent(eventId);
    const reply = await event.reply("Test reply");
    
    // Verify proper e and p tag structure
    expect(reply.event.tags).toContainEqual(['e', eventId, '', 'reply']);
    expect(reply.event.tags).toContainEqual(['p', originalAuthorPubkey]);
  });
});
```

### Day 8: Documentation & Examples

#### 8.1 API Documentation
```markdown
# Social Media API Documentation

## Threading API - Clear Reply Targeting

The threading API addresses the key concern: "how do we know which specific event we're replying to?"

### Three Clear Approaches:

1. **Event-based replies (Clearest)**
```typescript
const event = await nostr.social.getEvent(eventId);
await event.reply("I know exactly which event this replies to");
```

2. **Thread-based replies**
```typescript
const thread = await nostr.social.getThread(rootEventId);
await thread.replyTo(specificEventId, "Replying to this specific message");
```

3. **Builder pattern**
```typescript
await nostr.events.note("My reply")
  .replyTo(eventId, relayUrl)  // Clear target
  .publish();
```
```

## Success Criteria Validation

### ✅ API Clarity Achieved
- **Threading concern addressed**: Multiple clear APIs show exactly which event is being replied to
- **Clean**: Simple method names with obvious intent
- **Eingängig (Intuitive)**: Natural workflow patterns
- **Vollständig (Complete)**: Covers all social media use cases

### ✅ NIP Compliance Ensured
- **NIP-01**: Proper event structure and validation
- **NIP-02**: Standard contact list format
- **NIP-10**: Correct threading conventions
- **NIP-25**: Standard reaction implementation

### ✅ Developer Experience Optimized
- **TypeScript**: Full type safety and IntelliSense
- **Reactive**: Svelte store compatibility
- **Performant**: Efficient queries and caching
- **Reliable**: Comprehensive error handling

## Implementation Timeline Summary

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 1 | Days 1-2 | Foundation & Profiles | SocialModule, ProfileManager, Integration |
| 2 | Days 3-4 | Contacts & Threading | ContactManager, ThreadManager with clear APIs |
| 3 | Days 5-6 | Reactions & Feeds | ReactionManager, FeedManager, Real-time updates |
| 4 | Days 7-8 | Testing & Polish | Comprehensive tests, Documentation, Examples |

This implementation plan directly addresses the user's threading API concerns while delivering a professional-grade social media foundation that is clean, intuitive, and complete.