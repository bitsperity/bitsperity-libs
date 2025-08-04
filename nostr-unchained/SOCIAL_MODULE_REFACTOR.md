# Social Module Refactoring Plan

## Current State Analysis

The social module is currently **0% compliant** with the 3-layer architecture and has never been used or tested. It contains:

### Architecture Violations
- **ContactManager**: Own cache + direct SubscriptionManager access
- **ReactionManager**: Own cache + direct SubscriptionManager access  
- **ThreadManager**: Own cache + direct SubscriptionManager access (861 lines!)
- **FeedManager**: Own cache + direct SubscriptionManager access

### Implemented NIPs
- **NIP-02**: Contact Lists (Kind 3)
- **NIP-10**: Threading Conventions (e-tags, p-tags)
- **NIP-25**: Reactions (Kind 7)

## Recommendation: Complete Rewrite

Since the module has never been used and is architecturally broken, a complete rewrite following the clean 3-layer pattern would be the best approach.

## Proposed Clean Architecture

### 1. Remove All Existing Social Module Code
```bash
rm -rf src/social/
```

### 2. New Clean Social Module Structure

```typescript
// src/social/SocialModule.ts
export class SocialModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Sub-modules following ProfileModule pattern
  get contacts() { return new ContactsModule(this.nostr); }
  get threads() { return new ThreadsModule(this.nostr); }
  get reactions() { return new ReactionsModule(this.nostr); }
}
```

### 3. Clean Contacts Implementation (NIP-02)

```typescript
// src/social/ContactsModule.ts
export class ContactsModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Get contact list (reactive)
  getContacts(pubkey: string) {
    return this.nostr.query()
      .kinds([3])
      .authors([pubkey])
      .limit(1)
      .execute()
      .map(events => this.parseContactList(events));
  }
  
  // Follow someone
  async follow(pubkey: string) {
    const current = await this.getCurrentContacts();
    const updated = [...current, { pubkey }];
    return this.publishContactList(updated);
  }
}
```

### 4. Clean Reactions Implementation (NIP-25)

```typescript
// src/social/ReactionsModule.ts
export class ReactionsModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Get reactions for an event (reactive)
  getReactions(eventId: string) {
    return this.nostr.query()
      .kinds([7])
      .tags('e', [eventId])
      .execute()
      .map(events => this.parseReactions(events));
  }
  
  // React to an event
  async react(eventId: string, content = '+') {
    return this.nostr.events
      .reaction(eventId)
      .content(content)
      .publish();
  }
}
```

### 5. Clean Threading Implementation (NIP-10)

```typescript
// src/social/ThreadsModule.ts
export class ThreadsModule {
  constructor(private nostr: NostrUnchained) {}
  
  // Get thread for an event (reactive)
  getThread(eventId: string) {
    return this.nostr.query()
      .kinds([1])
      .tags('e', [eventId])
      .execute()
      .map(events => this.buildThread(events));
  }
  
  // Reply to an event
  async reply(eventId: string, content: string) {
    return this.nostr.events
      .note(content)
      .tag('e', eventId, '', 'reply')
      .publish();
  }
}
```

## Benefits of Clean Rewrite

1. **100% Clean Architecture**: Following the proven ProfileModule pattern
2. **No Duplicate Caches**: Uses UniversalEventCache through query layer
3. **Reactive Stores**: All data is reactive by default
4. **Simple API**: Much cleaner than current implementation
5. **Testable**: Easy to test with clean dependencies
6. **Maintainable**: Following SOLID principles

## Migration Strategy

Since the social module was never used:
1. Delete the entire current implementation
2. Implement the clean version module by module
3. Start with ContactsModule (simplest)
4. Then ReactionsModule
5. Finally ThreadsModule (most complex)

## Code to Extract/Reuse

### NIP-10 Tag Parsing Logic
The thread tag parsing logic from ThreadManager could be extracted into utility functions.

### NIP-02 Contact List Parsing
The contact list parsing is simple and can be reimplemented cleanly.

### NIP-25 Reaction Types
The reaction content types ('+', '-', '❤️', etc.) can be preserved as constants.

## Conclusion

A complete rewrite is the best approach because:
- Current code is 0% architecturally compliant
- Never been used or tested
- Would take more effort to refactor than rewrite
- Clean implementation would be much simpler
- Following ProfileModule pattern ensures consistency