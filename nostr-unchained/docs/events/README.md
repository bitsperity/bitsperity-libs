# 📝 Event Publishing Module

The Events module provides zero-config publishing and fluent event builders for creating any type of Nostr event.

## Table of Contents

- [Quick Start](#quick-start)
- [Zero-Config Publishing](#zero-config-publishing)
- [Fluent Event Builder](#fluent-event-builder)
- [Event Types](#event-types)
- [Signing Providers](#signing-providers)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();

// Simple text note (DX Overload)
await nostr.publish("Hello, Nostr! 🌟");

// NEW: Super-fluent API - start directly with kind or content
await nostr.events
  .kind(1)
  .content("Check out this amazing project!")
  .hashtag('nostr')
  .hashtag('decentralized')
  .publish();

// Or start with content
await nostr.events
  .content("Building something cool!")
  .kind(1)
  .tags([["t", "nostr"], ["t", "development"]])
  .publish();

// Direct JSON publishing
await nostr.events.publish({
  kind: 1,
  content: "Hello from JSON!",
  tags: [["t", "json"]]
});
```

## Zero-Config Publishing

The simplest way to publish to Nostr - just provide content and we handle everything else:

```typescript
const nostr = new NostrUnchained();

// Publishes a Kind 1 (Text Note) event
const result = await nostr.publish("My first Nostr note!");

console.log(`Published to ${result.successCount}/${result.totalAttempts} relays`);
console.log(`Event ID: ${result.eventId}`);

// Check individual relay results
result.results.forEach(relay => {
  if (relay.success) {
    console.log(`✅ ${relay.relay}: Published successfully`);
  } else {
    console.log(`❌ ${relay.relay}: ${relay.error}`);
  }
});
```

### Auto-Discovery Features

- **Automatic Signing**: Uses browser extension (`window.nostr`) if available
- **Default Relays**: Connects to popular relays out of the box
- **Smart Retries**: Automatically retries failed publishes
- **Error Recovery**: Graceful handling of relay failures

## Fluent Event Builder

The new super-fluent API makes event creation incredibly clean and discoverable:

### Basic Text Notes

```typescript
// NEW: Start with kind or content - both work!
await nostr.events
  .kind(1)
  .content("Building something cool with #nostr")
  .hashtag('nostr')
  .hashtag('development')
  .publish();

// Or start with content first
await nostr.events
  .content("Thanks for the help @alice!")
  .kind(1)
  .tag('p', 'npub1alice...', 'wss://relay.example.com', 'alice')
  .publish();

// NEW: Bulk tags for efficiency
await nostr.events
  .kind(1)
  .content("Multiple tags example")
  .tags([
    ["t", "nostr"],
    ["t", "development"],
    ["p", "npub1alice..."],
    ["e", "note1event..."]
  ])
  .publish();

// NEW: Convenience methods
await nostr.events
  .note("Hello world!")           // kind(1).content() shorthand
  .hashtag("nostr")              // tag("t", "nostr") shorthand
  .publish();

// NEW: Relay selection - publish to specific relays
await nostr.events
  .kind(1)
  .content("This goes to specific relays only")
  .toRelays("wss://nos.lol", "wss://relay.damus.io")
  .publish();

// Or use array format
await nostr.events
  .note("Targeted publishing")
  .toRelayList(["wss://relay1.com", "wss://relay2.com"])
  .publish();
```

### Advanced Event Types

```typescript
// Kind 0: User Metadata (Profile)
await nostr.events
  .kind(0)
  .content(JSON.stringify({
    name: "Alice",
    about: "Nostr developer",
    picture: "https://example.com/alice.jpg",
    nip05: "alice@example.com"
  }))
  .publish();

// Kind 3: Contact List (Following)
await nostr.events
  .kind(3)
  .content("")
  .tag('p', 'npub1user1...', 'wss://relay1.com', 'user1')
  .tag('p', 'npub1user2...', 'wss://relay2.com', 'user2')
  .publish();

// Kind 7: Reaction
await nostr.events
  .kind(7)
  .content("🔥")
  .tag('e', 'note1xyz...') // Event being reacted to
  .tag('p', 'npub1author...') // Author of the event
  .publish();
```

### Thread Replies

```typescript
// Reply to a note (creates a thread)
await nostr.events
  .kind(1)
  .content("Great point! I think...")
  .tag('e', 'note1original...', '', 'reply') // Reply marker
  .tag('e', 'note1root...', '', 'root') // Root of thread
  .tag('p', 'npub1author...') // Author being replied to
  .publish();

// Continue the thread
await nostr.events
  .kind(1)
  .content("Building on that idea...")
  .tag('e', 'note1previous...', '', 'reply') // Previous message
  .tag('e', 'note1root...', '', 'root') // Same root
  .tag('p', 'npub1author1...')
  .tag('p', 'npub1author2...')
  .publish();
```

## Event Types

Nostr Unchained supports all standard event kinds:

| Kind | Type | Usage |
|------|------|-------|
| `0` | User Metadata | Profile information |
| `1` | Text Note | Basic posts/notes |
| `2` | Recommend Relay | Relay recommendations |
| `3` | Contact List | Following/followers |
| `4` | Encrypted DM | Private messages (deprecated, use NIP-17) |
| `5` | Event Deletion | Delete events |
| `7` | Reaction | Likes, dislikes, emoji reactions |
| `40` | Channel Creation | Chat channel creation |
| `41` | Channel Metadata | Channel information |
| `42` | Channel Message | Messages in channels |
| `43` | Channel Hide Message | Hide channel messages |
| `44` | Channel Mute User | Mute users in channels |

### Custom Event Kinds

```typescript
// Custom application-specific event
await nostr.events
  .kind(30000) // Custom kind
  .content(JSON.stringify({
    app: "my-app",
    action: "user-action",
    data: { key: "value" }
  }))
  .tag('d', 'unique-identifier') // Replaceable event identifier
  .publish();
```

## Signing Providers

### Browser Extension (Recommended)

```typescript
const nostr = new NostrUnchained();

// User explicitly chooses extension signing
const result = await nostr.useExtensionSigner();

if (result.success) {
  console.log(`Using extension signer: ${result.pubkey}`);
  await nostr.publish("Signed with my extension! 🔐");
} else {
  console.log(`Extension not available: ${result.error}`);
}
```

### Local Key Signer (Testing & Development)

```typescript
const nostr = new NostrUnchained();

// User explicitly chooses local key signer
const result = await nostr.useLocalKeySigner();

if (result.success) {
  console.log(`Using local key: ${result.pubkey}`);
  await nostr.publish("Testing with local keys");
} else {
  console.log(`Local signer failed: ${result.error}`);
}
```

### Custom Signing Provider

```typescript
import { LocalKeySigner } from 'nostr-unchained';

const nostr = new NostrUnchained();
const customSigner = new LocalKeySigner(); // Or your own implementation

// User provides custom signer
const result = await nostr.useCustomSigner(customSigner);

if (result.success) {
  console.log(`Using custom signer: ${result.pubkey}`);
  await nostr.publish("Signed with custom provider!");
}
```

### Automatic Fallback (Only when no explicit choice)

```typescript
const nostr = new NostrUnchained();

// If no signer chosen, createBestAvailable() is used as fallback
await nostr.publish("This uses automatic signer detection");

// Check what signer is being used
const signingInfo = nostr.getSigningInfo();
console.log(`Active signer: ${signingInfo.method}`); // 'extension' or 'temporary'
```

### Custom Signing Provider

```typescript
import type { SigningProvider } from 'nostr-unchained';

class MyCustomSigner implements SigningProvider {
  async getPublicKey(): Promise<string> {
    // Return your public key
    return "your-pubkey-here";
  }

  async signEvent(event: UnsignedEvent): Promise<NostrEvent> {
    // Sign the event and return signed version
    // Implementation depends on your key management
  }
}

const nostr = new NostrUnchained();
await nostr.setSigningProvider(new MyCustomSigner());
```

## Error Handling

### Publish Results

```typescript
const result = await nostr.publish("Hello world!");

if (result.success) {
  console.log(`✅ Published successfully to ${result.successCount} relays`);
  console.log(`Event ID: ${result.eventId}`);
} else {
  console.log(`❌ Failed to publish to any relay`);
  
  // Check individual failures
  result.results.forEach(relay => {
    if (!relay.success) {
      console.log(`${relay.relay}: ${relay.error}`);
    }
  });
}
```

### Signing Errors

```typescript
try {
  await nostr.publish("This might fail if no signer is available");
} catch (error) {
  if (error.code === 'NO_SIGNING_PROVIDER') {
    console.log("Please set up signing first:");
    console.log("await nostr.useExtensionSigner()");
  } else if (error.code === 'SIGNING_REJECTED') {
    console.log("User rejected signing request");
  } else {
    console.log(`Unexpected error: ${error.message}`);
  }
}
```

### Relay Connection Issues

```typescript
const nostr = new NostrUnchained({
  relays: ['wss://relay1.com', 'wss://relay2.com'],
  debug: true // Enable debug logging
});

const result = await nostr.publish("Testing relay connections");

// Check relay health
result.results.forEach(relay => {
  console.log(`${relay.relay}: ${relay.success ? '✅' : '❌'} ${relay.latency}ms`);
});
```

## API Reference

### NostrUnchained.publish()

```typescript
publish(content: string, kind?: number): Promise<PublishResult>
```

**Parameters:**
- `content` - The content of the note
- `kind` - Event kind (default: 1 for text note)

**Returns:** `PublishResult` with success status and relay details

Hinweis: Das Overload `publish(content, kind=1)` ist eine DX‑Abkürzung für einfache Textevents. Für komplexe Events nutze den Fluent Builder unter `nostr.events`.

### NostrUnchained.events

The super-fluent event builder accessible via `nostr.events`:

```typescript
// Direct fluent API - start with any method!
nostr.events
  .kind(number)              // Set event kind
  .content(string)           // Set event content  
  .tag(name, ...values)      // Add single tag
  .tags(array)               // Add multiple tags
  .hashtag(tag)              // Add hashtag convenience
  .timestamp(unix)           // Set custom timestamp
  .toRelays(...urls)         // Target specific relays
  .toRelayList(array)        // Target relays via array
  .publish()                 // Build, sign, and publish

// Direct JSON publishing
nostr.events.publish(eventObject)

// Convenience methods
nostr.events.note(content)   // Quick text note
nostr.events.reaction(eventId, emoji)  // Quick reaction
```

### FluentEventBuilder Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.kind(k)` | Set event kind | `.kind(1)` |
| `.content(c)` | Set content | `.content("Hello!")` |
| `.tag(name, ...values)` | Add single tag | `.tag('p', 'npub1...')` |
| `.tags(tagArray)` | **NEW:** Add multiple tags | `.tags([["t","nostr"],["p","npub1..."]])` |
| `.hashtag(tag)` | **NEW:** Add hashtag | `.hashtag("nostr")` |
| `.timestamp(unix)` | Custom timestamp | `.timestamp(Date.now())` |
| `.toRelays(...urls)` | **NEW:** Target specific relays | `.toRelays("wss://nos.lol")` |
| `.toRelayList(array)` | **NEW:** Target relays via array | `.toRelayList(["wss://relay1.com"])` |
| `.build()` | Build unsigned event | Returns `UnsignedEvent` |
| `.publish()` | Build, sign & publish | Returns `Promise<PublishResult>` |
| `.note(content)` | **NEW:** Quick text note | `.note("Hello!")` equivalent to `.kind(1).content("Hello!")` |
| `.reaction(eventId, emoji)` | **NEW:** Quick reaction | `.reaction("note1...", "🔥")` |

### Common Tag Types

| Tag | Purpose | Example |
|-----|---------|---------|
| `e` | Event reference | `['e', 'note1abc...', 'relay', 'reply']` |
| `p` | Pubkey mention | `['p', 'npub1xyz...', 'relay', 'name']` |
| `t` | Hashtag | `['t', 'nostr']` |
| `r` | URL reference | `['r', 'https://example.com']` |
| `d` | Identifier | `['d', 'unique-id']` (for replaceable events) |

---

**Next Steps:**
- [Query Engine](../query/README.md) - Query and subscribe to events
- [Direct Messages](../dm/README.md) - Encrypted private messaging
- [Social Media](../social/README.md) - Profiles, contacts, and reactions