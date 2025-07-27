# Session 4: Social Media Core - Requirements Analysis

## Overview
Implement core social media functionality for nostr-unchained with clean, intuitive, and complete APIs for Profiles, Following/Followers, and Threading/Replies. This session addresses key API design concerns and ensures developer-friendly interfaces while maintaining full Nostr protocol compliance.

## Key Design Concerns Addressed

### 1. Threading API Clarity Issue
**User Concern**: "The user questioned if `thread.reply()` makes sense - how do we know which specific event we're replying to?"

**Solution**: Design explicit threading APIs that clearly indicate the target event:

```typescript
// CLEAR: Explicit event reference
const originalEvent = await nostr.social.getEvent(eventId);
await originalEvent.reply("This is my reply");

// CLEAR: Thread context with explicit parent
const thread = await nostr.social.getThread(rootEventId);
await thread.replyTo(specificEventId, "Replying to this specific message");

// CLEAR: Builder pattern with explicit targeting
await nostr.events.note("My reply")
  .replyTo(eventId, relayUrl)
  .mention(authorPubkey)
  .publish();
```

### 2. API Design Principles
- **Clean**: Simple method names with obvious intent
- **Eingängig (Intuitive)**: Natural developer workflow patterns
- **Vollständig (Complete)**: Cover all essential social media use cases

## Target API Design

### Profile Management
```typescript
// Profile creation and updates (NIP-01 Kind 0)
const profile = nostr.social.profile;

// Set profile information
await profile.set({
  name: "Alice",
  about: "Nostr developer",
  picture: "https://example.com/avatar.jpg",
  nip05: "alice@example.com",
  lud16: "alice@getalby.com"
});

// Get profile information
const myProfile = await profile.get(); // Own profile
const userProfile = await profile.get(pubkey); // Another user's profile

// Reactive profile store
$: currentProfile = $profile.data;
$: profileStatus = $profile.status; // 'loading', 'loaded', 'error'
```

### Following/Followers Management
```typescript
// Contact list management (NIP-02 Kind 3)
const contacts = nostr.social.contacts;

// Follow operations
await contacts.follow(pubkey, relayUrl?, petname?);
await contacts.unfollow(pubkey);

// Batch operations
await contacts.follow([
  { pubkey: "abc123", relayUrl: "wss://relay.com", petname: "alice" },
  { pubkey: "def456", relayUrl: "wss://relay2.com", petname: "bob" }
]);

// Query following/followers
const following = await contacts.getFollowing(); // People I follow
const followers = await contacts.getFollowers(); // People following me
const mutualFollows = await contacts.getMutualFollows(pubkey);

// Reactive contact stores
$: followingList = $contacts.following;
$: followersList = $contacts.followers;
$: followingCount = $contacts.followingCount;
$: followerCount = $contacts.followerCount;

// Social graph queries
const suggestions = await contacts.getSuggestions(); // Based on mutual follows
const networkOfNetwork = await contacts.getNetworkOfNetwork(pubkey, depth: 2);
```

### Threading and Replies System
```typescript
// Clear thread management addressing the user's concern
const threads = nostr.social.threads;

// Get a complete thread structure
const thread = await threads.get(rootEventId);

// Thread properties
thread.root        // Root event
thread.replies     // All replies in chronological order
thread.tree        // Hierarchical tree structure
thread.depth       // Maximum nesting depth
thread.participants // All unique participants

// EXPLICIT reply targeting - solves the user's concern
await thread.replyToRoot("This replies to the root post");
await thread.replyTo(specificEventId, "This replies to a specific message");

// Event-based replies (clearest approach)
const event = await nostr.social.getEvent(eventId);
await event.reply("Clear which event I'm replying to");

// Builder pattern with explicit context
const replyEvent = await nostr.events.note("My thoughtful reply")
  .replyTo(eventId, relayUrl, "reply")        // Target event
  .mentionRoot(rootEventId, relayUrl, "root") // Thread root
  .mention(authorPubkey)                      // Author notification
  .publish();

// Thread navigation
const parentEvent = await event.getParent();
const childReplies = await event.getReplies();
const threadRoot = await event.getThreadRoot();
```

### Reactions and Social Interactions
```typescript
// Reaction system (NIP-25 Kind 7)
const reactions = nostr.social.reactions;

// Basic reactions
await reactions.like(eventId);
await reactions.dislike(eventId);
await reactions.react(eventId, "🔥"); // Custom emoji

// Get reaction data
const eventReactions = await reactions.get(eventId);
// Returns: { likes: 15, dislikes: 2, reactions: { "🔥": 5, "❤️": 3 } }

// Reaction stores
$: eventReactions = $reactions.for(eventId);
$: myReactions = $reactions.mine; // Events I've reacted to

// Bulk reaction queries
const popularEvents = await reactions.getMostLiked(timeframe: "week");
```

### Feed Management
```typescript
// Social feed construction
const feeds = nostr.social.feeds;

// Timeline feeds
const globalFeed = feeds.global();           // All public posts
const followingFeed = feeds.following();     // Posts from people I follow
const trendingFeed = feeds.trending();       // Popular posts by reactions

// Filtered feeds
const topicFeed = feeds.byTopic("bitcoin");
const authorFeed = feeds.byAuthor(pubkey);

// Smart feeds
const personalizedFeed = feeds.personalized(); // ML-suggested content
const conversationFeed = feeds.conversations(); // Posts with high engagement

// Feed stores with reactive updates
$: globalPosts = $globalFeed.events;
$: feedStatus = $globalFeed.status;
$: hasNewPosts = $globalFeed.hasNewPosts;

// Feed controls
await globalFeed.loadMore();
await globalFeed.refresh();
```

## NIP Specification Compliance

### NIP-01: Basic Protocol
- **Event Structure**: Full compliance with standard event format
- **Event Kinds**: 
  - Kind 0: Profile metadata
  - Kind 1: Text notes
  - Kind 3: Contact lists
  - Kind 7: Reactions
- **Tags**: Proper use of e, p, and other standardized tags

### NIP-02: Contact Lists
- **Follow Lists**: Kind 3 events with p-tags
- **Relay Hints**: Optional relay URLs for contacts
- **Petnames**: Local nickname system
- **Chronological Ordering**: Maintains follow order

### NIP-10: Reply Conventions
- **Marked Tags**: Use of "root" and "reply" markers
- **Thread Structure**: Clear parent-child relationships
- **Participant Tracking**: P-tags for all thread participants
- **Relay Hints**: Recommended relay for each referenced event

### NIP-25: Reactions
- **Kind 7 Events**: Standard reaction format
- **Content Types**: "+", "-", and emoji reactions
- **Event References**: Proper e and p tag usage
- **Custom Reactions**: Unicode emoji support

## Implementation Architecture

### Core Components

#### 1. SocialModule (`src/social/SocialModule.ts`)
```typescript
export class SocialModule {
  public readonly profile: ProfileManager;
  public readonly contacts: ContactManager;
  public readonly threads: ThreadManager;
  public readonly reactions: ReactionManager;
  public readonly feeds: FeedManager;
  
  constructor(nostrInstance: NostrUnchained) {
    // Initialize all managers with shared infrastructure
  }
}
```

#### 2. ProfileManager (`src/social/profile/ProfileManager.ts`)
- Kind 0 profile metadata management
- Profile validation and update logic
- Profile caching and reactive stores
- NIP-05 verification support

#### 3. ContactManager (`src/social/contacts/ContactManager.ts`)
- Kind 3 contact list management
- Follow/unfollow operations
- Social graph queries
- Petname and relay hint support

#### 4. ThreadManager (`src/social/threads/ThreadManager.ts`)
- Thread construction from events
- Reply chain resolution
- Tree structure building
- Participant tracking

#### 5. ReactionManager (`src/social/reactions/ReactionManager.ts`)
- Kind 7 reaction handling
- Reaction aggregation
- Real-time reaction updates
- Custom emoji support

#### 6. FeedManager (`src/social/feeds/FeedManager.ts`)
- Feed query construction
- Real-time feed updates
- Feed filtering and sorting
- Pagination support

### Integration Points
- **QueryBuilder**: Complex social graph queries
- **SubscriptionManager**: Real-time social updates
- **RelayManager**: Multi-relay social content distribution
- **EventBuilder**: Social event creation
- **NostrStore**: Social data caching and reactivity

## Functional Requirements

### FR1: Profile Management
- Create and update user profiles (Kind 0)
- Validate profile metadata format
- Cache profile data for performance
- Support all standard profile fields
- Handle profile update conflicts

### FR2: Contact Management
- Maintain following/follower lists (Kind 3)
- Support relay hints and petnames
- Efficient social graph queries
- Batch follow/unfollow operations
- Contact list backup and restore

### FR3: Thread Management
- Parse thread structures from events
- Build hierarchical conversation trees
- Handle nested replies
- Track conversation participants
- Support thread-level operations

### FR4: Reaction System
- Create and manage reactions (Kind 7)
- Aggregate reaction counts
- Support custom emoji reactions
- Real-time reaction updates
- Reaction history tracking

### FR5: Feed Generation
- Construct various feed types
- Real-time feed updates
- Efficient feed pagination
- Content filtering and ranking
- Personalized feed algorithms

## Non-Functional Requirements

### NFR1: Performance
- Efficient social graph traversal
- Cached profile and contact data
- Lazy loading of large threads
- Optimized feed generation
- Minimal relay round trips

### NFR2: Usability
- Intuitive API design
- Clear error messages
- Consistent naming conventions
- Comprehensive documentation
- Type-safe interfaces

### NFR3: Scalability
- Handle large contact lists
- Support deep conversation threads
- Efficient reaction aggregation
- Scalable feed algorithms
- Memory-efficient data structures

### NFR4: Reliability
- Robust error handling
- Graceful degradation
- Retry mechanisms
- Data consistency
- Network failure recovery

## Success Criteria

### SC1: API Clarity
- [ ] Thread reply APIs clearly indicate target events
- [ ] Profile management is intuitive and complete
- [ ] Contact operations are discoverable and efficient
- [ ] Reaction system supports all standard use cases
- [ ] Feed APIs provide flexible content access

### SC2: NIP Compliance
- [ ] All NIP-01 event structures are correct
- [ ] NIP-02 contact lists work with other clients
- [ ] NIP-10 threading follows conventions exactly
- [ ] NIP-25 reactions are interoperable
- [ ] Event validation passes all test vectors

### SC3: Developer Experience
- [ ] APIs are "clean, eingängig, and vollständig"
- [ ] TypeScript types provide helpful guidance
- [ ] Documentation covers all use cases
- [ ] Examples demonstrate real-world usage
- [ ] Error messages are actionable

### SC4: Integration Quality
- [ ] Works seamlessly with existing NostrUnchained
- [ ] Reactive stores provide real-time updates
- [ ] Performance meets benchmarks
- [ ] Memory usage is optimized
- [ ] No regressions in existing functionality

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
1. Create SocialModule structure
2. Implement ProfileManager
3. Basic contact list operations
4. Core threading logic
5. Integration with NostrUnchained

### Phase 2: Core Features (Days 3-4)
1. Complete ContactManager functionality
2. Advanced ThreadManager features
3. ReactionManager implementation
4. Basic FeedManager
5. Reactive store integration

### Phase 3: Advanced Features (Days 5-6)
1. Advanced feed algorithms
2. Social graph analysis
3. Performance optimizations
4. Advanced threading features
5. Comprehensive error handling

### Phase 4: Polish and Testing (Days 7-8)
1. Comprehensive testing suite
2. API documentation
3. Performance benchmarking
4. Cross-client compatibility testing
5. User experience refinements

## Risk Analysis

### High Risk Areas
1. **Thread Complexity**: Deep nested conversations
2. **Social Graph Scale**: Large follow networks
3. **Real-time Performance**: Feed update latency
4. **API Complexity**: Balancing power and simplicity

### Mitigation Strategies
1. Implement efficient tree algorithms
2. Use pagination and lazy loading
3. Optimize subscription patterns
4. Extensive user testing of APIs

## Test Strategy

### Unit Tests
- Individual manager functionality
- Event creation and validation
- Data structure operations
- Error handling scenarios

### Integration Tests
- Social workflows end-to-end
- Cross-manager interactions
- Reactive store updates
- Multi-relay scenarios

### Compatibility Tests
- NIP compliance validation
- Cross-client interoperability
- Standard test vector validation
- Edge case handling

### Performance Tests
- Large social graph handling
- Deep thread navigation
- Feed generation speed
- Memory usage profiling

This comprehensive requirements analysis addresses all the user's concerns about API clarity while ensuring full Nostr protocol compliance and providing a complete social media foundation for the nostr-unchained library.