# Social Module - Complete Design & Implementation Plan

## 📋 Executive Summary

The current social module is **0% architecturally compliant** and has never been used. This document outlines a complete rewrite following the proven 3-layer architecture pattern from ProfileModule, implementing **15 high-priority NIPs** across **4 implementation phases**.

## 🎯 NIPs Analysis & Priority Matrix

### Phase 1: MVP Core Social (High Priority)

| NIP | Title | Status | Complexity | Implementation Focus |
|-----|-------|--------|------------|-------------------|
| **NIP-10** | Threading Conventions | Standard | Medium | Reply chains, conversation context |
| **NIP-25** | Reactions | Standard | Simple | Like/dislike, emoji reactions, aggregation |
| **NIP-18** | Reposts | Standard | Simple | Share content with attribution |
| **NIP-09** | Event Deletion Request | Standard | Simple | Content moderation, cleanup |
| **NIP-22** | Comments | Standard | Medium | Comments on arbitrary events |

### Phase 2: Extended Social (Medium Priority)

| NIP | Title | Status | Complexity | Implementation Focus |
|-----|-------|--------|------------|-------------------|
| **NIP-23** | Long-form Content | Standard | Medium | Articles, rich text content |
| **NIP-32** | Labeling | Standard | Medium | Content moderation, organization |
| **NIP-36** | Content Warning | Standard | Simple | NSFW tagging, safety |
| **NIP-51** | Lists | Standard | Medium | Generic list management |
| **NIP-56** | Reporting | Standard | Medium | Safety, content reporting |

### Phase 3: Communities & Advanced (Lower Priority)

| NIP | Title | Status | Complexity | Implementation Focus |
|-----|-------|--------|------------|-------------------|
| **NIP-28** | Public Chat | Standard | Medium | Chatroom functionality |
| **NIP-38** | User Statuses | Standard | Simple | Status messages |
| **NIP-72** | Moderated Communities | Draft | Complex | Reddit-style communities |
| **NIP-88** | Polls | Draft | Medium | Voting, surveys |
| **NIP-92** | Media Attachments | Standard | Medium | Media metadata |

## 🏗️ Clean Architecture Design

### Module Structure (Following ProfileModule Pattern)

```
src/social/
├── api/
│   ├── SocialModule.ts          # Main entry point
│   └── SocialAggregator.ts      # Cross-module data aggregation
├── content/
│   ├── ContentModule.ts         # Text notes, articles (NIP-01, NIP-23)
│   ├── ContentBuilder.ts        # Fluent content creation API
│   ├── RepostModule.ts          # NIP-18 reposts
│   └── types.ts
├── reactions/
│   ├── ReactionModule.ts        # NIP-25 reactions
│   ├── ReactionBuilder.ts       # Fluent reaction API
│   └── types.ts
├── threads/
│   ├── ThreadModule.ts          # NIP-10 threading, NIP-22 comments
│   ├── ConversationBuilder.ts   # Fluent conversation API
│   └── types.ts
├── feeds/
│   ├── FeedModule.ts            # Social timeline aggregation
│   ├── FeedBuilder.ts           # Fluent feed queries
│   └── types.ts
├── communities/
│   ├── CommunityModule.ts       # NIP-72 communities, NIP-28 chat
│   ├── ModerationModule.ts      # NIP-32 labeling, NIP-56 reporting
│   └── types.ts
├── lists/
│   ├── ListModule.ts            # NIP-51 lists
│   ├── ListBuilder.ts           # Fluent list management
│   └── types.ts
└── index.ts
```

### API Design (100% Clean Architecture)

```typescript
// Main Social Module
export class SocialModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Content operations
  content(): ContentModule;
  reactions(): ReactionModule;
  threads(): ThreadModule;
  feeds(): FeedModule;
  communities(): CommunityModule;
  lists(): ListModule;
  moderation(): ModerationModule;
}

// Example Usage - Content Creation
const note = await nostr.social.content()
  .create("Hello Nostr!")
  .subject("Introduction")        // NIP-14
  .contentWarning("Personal")     // NIP-36
  .tag("t", "introduction")
  .publish();

// Example Usage - Reactions (Reactive)
const reactionStore = nostr.social.reactions()
  .to(eventId)
  .get(); // Returns UniversalNostrStore<ReactionSummary>

// Example Usage - Threading
const thread = nostr.social.threads()
  .getThread(rootEventId)
  .execute(); // Returns UniversalNostrStore<ThreadView>

// Example Usage - Feeds
const timelineFeed = nostr.social.feeds()
  .timeline()
  .following()
  .since(timestamp)
  .limit(50)
  .execute(); // Returns UniversalNostrStore<FeedItem[]>
```

## 🔧 Implementation Details

### ContentModule (NIP-01, NIP-23, NIP-18)

```typescript
export class ContentModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Get content (reactive)
  get(eventId: string): UniversalNostrStore<ContentItem | null> {
    return this.nostr.query()
      .kinds([1, 30023]) // Text notes + articles
      .ids([eventId])
      .execute()
      .map(events => this.parseContent(events[0]));
  }
  
  // Create content
  create(content: string): ContentBuilder {
    return new ContentBuilder(this.nostr, content);
  }
  
  // Repost content (NIP-18)
  repost(eventId: string): ContentBuilder {
    return new ContentBuilder(this.nostr)
      .repost(eventId);
  }
  
  // Delete content request (NIP-09)
  async delete(eventId: string): Promise<PublishResult> {
    return this.nostr.events
      .deletion()
      .target(eventId)
      .reason("User requested deletion")
      .publish();
  }
}
```

### ReactionModule (NIP-25)

```typescript
export class ReactionModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Get reactions for event (reactive)
  to(eventId: string): UniversalNostrStore<ReactionSummary> {
    return this.nostr.query()
      .kinds([7])
      .tags('e', [eventId])
      .execute()
      .map(events => this.aggregateReactions(events));
  }
  
  // React to event
  async react(eventId: string, content = '+'): Promise<PublishResult> {
    return this.nostr.events
      .reaction(eventId)
      .content(content)
      .publish();
  }
  
  // Get my reaction to event
  myReaction(eventId: string): UniversalNostrStore<string | null> {
    const myPubkey = this.nostr.me;
    if (!myPubkey) return writable(null);
    
    return this.nostr.query()
      .kinds([7])
      .authors([myPubkey])
      .tags('e', [eventId])
      .limit(1)
      .execute()
      .map(events => events[0]?.content || null);
  }
}
```

### ThreadModule (NIP-10, NIP-22)

```typescript
export class ThreadModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Get thread for event (reactive)
  getThread(rootEventId: string): UniversalNostrStore<ThreadView> {
    return this.nostr.query()
      .kinds([1])
      .tags('e', [rootEventId])
      .execute()
      .map(events => this.buildThreadView(events, rootEventId));
  }
  
  // Reply to event
  reply(eventId: string): ConversationBuilder {
    return new ConversationBuilder(this.nostr)
      .replyTo(eventId);
  }
  
  // Comment on event (NIP-22)
  comment(eventId: string): ConversationBuilder {
    return new ConversationBuilder(this.nostr)
      .commentOn(eventId);
  }
}
```

## 📅 Implementation Timeline

### Phase 1: MVP Core Social (3 weeks)

**Week 1: Foundation & Content**
- [ ] Set up clean module structure
- [ ] Implement ContentModule (NIP-01, NIP-18, NIP-09)
- [ ] Implement ContentBuilder with fluent API
- [ ] Basic text note creation, reposts, deletions

**Week 2: Reactions & Threading**
- [ ] Implement ReactionModule (NIP-25)
- [ ] Implement ThreadModule (NIP-10, NIP-22)
- [ ] Reaction aggregation and real-time updates
- [ ] Thread building and conversation context

**Week 3: Feeds & Integration**
- [ ] Implement FeedModule for timeline aggregation
- [ ] Integrate with existing ProfileModule
- [ ] End-to-end testing of core features
- [ ] Performance optimization

### Phase 2: Extended Features (3 weeks)

**Week 4-5: Rich Content & Safety**
- [ ] Long-form content support (NIP-23)
- [ ] Content warnings and labeling (NIP-36, NIP-32)
- [ ] Reporting system (NIP-56)
- [ ] Enhanced content moderation

**Week 6: Lists & Communities**
- [ ] List management (NIP-51)
- [ ] Basic community features
- [ ] User status messages (NIP-38)
- [ ] Media attachment metadata (NIP-92)

### Phase 3: Advanced Features (2 weeks)

**Week 7-8: Communities & Polls**
- [ ] Public chat (NIP-28)
- [ ] Moderated communities (NIP-72)
- [ ] Poll creation and voting (NIP-88)
- [ ] Advanced moderation tools

## 🧪 Testing Strategy

### Architecture Tests
```typescript
describe('Social Module Architecture', () => {
  it('should only use nostr.query() for cache access', () => {
    // Verify no direct cache imports
  });
  
  it('should only use nostr.sub() for subscriptions', () => {
    // Verify no direct SubscriptionManager access
  });
  
  it('should return UniversalNostrStore for reactive data', () => {
    // Verify return types
  });
});
```

### Feature Tests
```typescript
describe('ContentModule', () => {
  it('should create text notes following NIP-01', () => {
    // Test event structure and validation
  });
  
  it('should support reposts following NIP-18', () => {
    // Test repost event structure
  });
});

describe('ReactionModule', () => {
  it('should aggregate reactions correctly', () => {
    // Test reaction counting and grouping
  });
  
  it('should handle emoji reactions', () => {
    // Test custom emoji content
  });
});
```

### Integration Tests
```typescript
describe('Social Module Integration', () => {
  it('should integrate with ProfileModule', () => {
    // Test cross-module functionality
  });
  
  it('should handle real-time updates', () => {
    // Test subscription and cache updates
  });
});
```

## 🎯 Success Metrics

### Architecture Compliance
- [ ] **100% Clean Architecture**: No direct cache/subscription access
- [ ] **SOLID Principles**: Single responsibility, clear interfaces
- [ ] **Test Coverage**: 90%+ lines, 85%+ branches
- [ ] **Performance**: <100ms response times for cached data

### Feature Completeness
- [ ] **15 NIPs Implemented**: Core social functionality covered
- [ ] **Reactive APIs**: All data reactive by default
- [ ] **Fluent Builders**: Intuitive content creation APIs
- [ ] **Error Handling**: Graceful degradation and error recovery

### Developer Experience
- [ ] **Type Safety**: Complete TypeScript coverage
- [ ] **Documentation**: Comprehensive API docs and examples
- [ ] **Testing**: Easy to test with clean interfaces
- [ ] **Consistency**: Follows ProfileModule patterns

## 🔄 Migration Strategy

### Remove Old Implementation
```bash
# Backup current implementation
mv src/social src/social-old

# Create new clean structure
mkdir -p src/social/{api,content,reactions,threads,feeds,communities,lists}
```

### Incremental Implementation
1. **Start with ContentModule** (simplest, most foundational)
2. **Add ReactionModule** (builds on ContentModule)
3. **Implement ThreadModule** (uses both Content and Reactions)
4. **Build FeedModule** (aggregates all other modules)
5. **Add community features** (most complex, uses everything)

### Testing & Validation  
- Unit tests for each module before integration
- Integration tests between modules
- Performance benchmarking against old implementation
- API compatibility testing (if needed)

This design provides a comprehensive, architecturally clean social module that follows the established patterns while implementing the most important social NIPs. The phased approach ensures quality and maintainability throughout development.