# Nostr Unchained

[![NPM Version](https://img.shields.io/npm/v/nostr-unchained)](https://www.npmjs.com/package/nostr-unchained)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/Coverage-76%20tests-brightgreen)](#testing)

> **SQL-like elegance for decentralized event graphs.**  
> Zero-config Nostr publishing, reactive data flows, and enterprise-grade social protocols.

**Nostr Unchained** is a TypeScript-first Nostr library that combines the simplicity of modern web APIs with the power of decentralized protocols. Built for developers who want to create social applications without wrestling with low-level complexity.

## ✨ Philosophy

**Simple by Design, Powerful by Nature**

- **Zero Configuration** - Works out of the box with sensible defaults
- **SQL-like Queries** - Familiar syntax for event graph traversal  
- **Reactive Architecture** - Real-time updates using Svelte stores
- **Type Safety First** - Complete TypeScript coverage with intelligent inference
- **Production Ready** - Battle-tested with 100% real relay integration tests

```typescript
// This is all you need to start publishing to Nostr
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.publish("Hello, decentralized world! 🌍");
```

## 🚀 Quick Start

### Installation

```bash
npm install nostr-unchained
# or
yarn add nostr-unchained
# or
pnpm add nostr-unchained
```

### Basic Usage

```typescript
import { NostrUnchained } from 'nostr-unchained';

// Initialize with zero config
const nostr = new NostrUnchained();

// Publish a note
const result = await nostr.publish("My first Nostr note!");
console.log(`Published to ${result.successCount} relays`);

// Query events with SQL-like syntax
const posts = await nostr.query()
  .kind(1)
  .since('1 hour ago')
  .limit(10)
  .fetch();

console.log(`Found ${posts.length} recent posts`);
```

### With Configuration

```typescript
const nostr = new NostrUnchained({
  relays: ['wss://relay.damus.io', 'wss://nos.lol'],
  debug: true
});

// The library handles signing automatically via browser extension
await nostr.publish("Hello from my configured instance!");
```

## 🏗️ Architecture

Nostr Unchained is built around **five core modules**, each designed for specific use cases:

### 📝 [Event Publishing](./docs/events/README.md)
Zero-config publishing with automatic signing and relay management.

```typescript
// Simple publishing
await nostr.publish("Hello world!");

// Fluent API for complex events
await nostr.events
  .kind(1)
  .content("Rich content with tags")
  .tag('p', 'npub...')
  .tag('t', 'nostr')
  .publish();
```

### 🔍 [Query Engine](./docs/query/README.md)
SQL-like queries for the Nostr event graph.

```typescript
// Find all replies to a specific note
const replies = await nostr.query()
  .kind(1)
  .tag('e', originalNoteId)
  .since('1 day ago')
  .fetch();

// Reactive feeds with real-time updates
const feed = nostr.createFeed()
  .kind(1)
  .authors(['npub1...', 'npub2...'])
  .limit(50)
  .subscribe();

feed.subscribe(events => {
  console.log(`Feed updated: ${events.length} events`);
});
```

### 💬 [Direct Messages](./docs/dm/README.md)
NIP-17/NIP-44 encrypted private messaging with gift wrap protocol.

```typescript
// Send encrypted DM
await nostr.dm.send({
  recipient: 'npub1...',
  content: 'This message is end-to-end encrypted'
});

// Create a conversation
const conversation = await nostr.dm.conversation('npub1...');
await conversation.send('Hello!');

// Listen for new messages
conversation.messages.subscribe(messages => {
  console.log(`${messages.length} messages in conversation`);
});
```

### 👥 [Social Media Core](./docs/social/README.md)
Complete social networking primitives with reactive state management.

```typescript
// Profile management
await nostr.social.profiles.update({
  name: 'Alice',
  about: 'Nostr enthusiast',
  picture: 'https://...'
});

// Follow/unfollow users
await nostr.social.contacts.follow('npub1...');

// Create threaded discussions
const thread = await nostr.social.threads.create({
  content: 'What do you think about Nostr?',
  mentions: ['npub1...', 'npub2...']
});

// React to content
await nostr.social.reactions.react({
  targetEventId: thread.eventId,
  reactionType: '🔥'
});

// Get personalized feeds
const globalFeed = await nostr.social.feeds.getGlobalFeed();
const followingFeed = await nostr.social.feeds.getFollowingFeed();
```

### 🏪 [Reactive Stores](./docs/stores/README.md)
Svelte-compatible reactive state management for real-time applications.

```typescript
import { createFeed, createQueryBuilder } from 'nostr-unchained';

// Create reactive feed
const myFeed = createFeed(
  createQueryBuilder()
    .kind(1)
    .authors(['npub1...'])
    .limit(20)
);

// Subscribe to updates
myFeed.subscribe(events => {
  console.log(`Feed updated with ${events.length} events`);
});

// Use in Svelte components
export let myFeed;
$: posts = $myFeed; // Reactive to feed updates
```

## 📖 Module Documentation

Each module has comprehensive documentation with examples and API references:

| Module | Description | Documentation |
|--------|-------------|---------------|
| **Events** | Zero-config publishing & fluent builders | [📝 Event Docs](./docs/events/README.md) |
| **Query** | SQL-like queries & reactive feeds | [🔍 Query Docs](./docs/query/README.md) |
| **DM** | Encrypted private messaging (NIP-17/44) | [💬 DM Docs](./docs/dm/README.md) |
| **Social** | Profiles, contacts, threads, reactions | [👥 Social Docs](./docs/social/README.md) |
| **Stores** | Reactive state management | [🏪 Store Docs](./docs/stores/README.md) |

## 🔧 Advanced Configuration

```typescript
import { NostrUnchained, TemporarySigner } from 'nostr-unchained';

const nostr = new NostrUnchained({
  relays: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social'
  ],
  debug: true,
  retryAttempts: 3,
  retryDelay: 1000
});

// Use temporary keys for testing
const tempSigner = new TemporarySigner();
await nostr.setSigningProvider(tempSigner);

// Or use browser extension
await nostr.useExtensionSigner(); // Uses window.nostr
```

## 🎯 Key Features

### ✅ **Production Ready**
- **76 Comprehensive Tests** (62 unit + 14 integration)
- **Real Relay Testing** - No mocks, authentic Nostr protocol validation
- **Multi-participant Scenarios** - Tested with Alice, Bob, Charlie interactions
- **NIP Compliance** - Full support for NIP-01, NIP-02, NIP-10, NIP-17, NIP-25, NIP-44, NIP-59

### ✅ **Developer Experience**
- **Zero Configuration** - Works out of the box
- **TypeScript First** - Complete type safety with intelligent inference
- **Familiar APIs** - SQL-like queries, React/Svelte-compatible stores
- **Rich Error Handling** - Detailed error messages with debugging context

### ✅ **Protocol Support**
- **NIP-01** - Basic protocol flow (events, signatures)
- **NIP-02** - Contact Lists (follow/unfollow)
- **NIP-10** - Text Note References (threaded conversations)
- **NIP-17** - Private Direct Messages
- **NIP-25** - Reactions (likes, dislikes, custom emoji)
- **NIP-44** - Versioned Encryption
- **NIP-59** - Gift Wrap Protocol

### ✅ **Real-time Everything**
- **Reactive Feeds** - Auto-updating event streams
- **Live Conversations** - Real-time message delivery
- **Social Updates** - Instant reaction and thread notifications
- **WebSocket Management** - Automatic reconnection and error recovery

## 🧪 Testing

We maintain **0% mocks** in integration tests to ensure real-world reliability:

```bash
# Run all tests
npm test

# Run integration tests against real relays
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Test Coverage:**
- **62 Unit Tests** - Fast, isolated component testing
- **14 Integration Tests** - Real relay communication on `ws://umbrel.local:4848`
- **Multi-participant Scenarios** - Alice, Bob, Charlie creating threads and reactions
- **Protocol Validation** - Every feature tested against authentic Nostr data

## 📦 Package Exports

Nostr Unchained provides tree-shakeable exports for optimal bundle size:

```typescript
// Main library
import { NostrUnchained } from 'nostr-unchained';

// Direct message module only
import * as DM from 'nostr-unchained/dm';

// Event builders only  
import { FluentEventBuilder } from 'nostr-unchained/events';

// Query engine only
import { QueryBuilder } from 'nostr-unchained/query';
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/bitsperity/nostr-unchained
cd nostr-unchained
npm install

# Run tests
npm test

# Build the library
npm run build

# Lint and format
npm run lint:fix
npm run format
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **NPM Package**: [nostr-unchained](https://www.npmjs.com/package/nostr-unchained)
- **GitHub Repository**: [bitsperity/nostr-unchained](https://github.com/bitsperity/nostr-unchained)
- **Documentation**: [API Reference](./docs/)
- **Examples**: [Example Applications](./examples/)

---

<div align="center">

**Built with ❤️ for the Nostr ecosystem**

[Getting Started](./docs/getting-started.md) • [API Reference](./docs/api/) • [Examples](./examples/) • [Contributing](./CONTRIBUTING.md)

</div>