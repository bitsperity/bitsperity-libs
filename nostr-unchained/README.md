# Nostr Unchained

[![NPM Version](https://img.shields.io/npm/v/nostr-unchained)](https://www.npmjs.com/package/nostr-unchained)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen)](#testing)

> **Universal Cache Architecture for decentralized social protocols.**  
> Zero-config Nostr with lazy loading, user control, and reactive data flows.

**Nostr Unchained** is a TypeScript-first Nostr library built on the **Universal Cache Architecture** - a sophisticated 4-layer system that combines instant cache access with live relay subscriptions. Perfect for developers who want powerful Nostr applications without complexity.

---

## 📖 Documentation Walkthrough

This README provides an overview and quickstart guide. For comprehensive documentation, follow this learning path:

### 🚀 **Start Here:** [Universal Query & Subscription Engine](./docs/query/README.md)
Learn the core architecture with **identical APIs** for cache queries and live subscriptions. This is the foundation everything else builds on.

### 💬 **Then:** [Direct Messages](./docs/dm/README.md)
See how DMs work as elegant **query wrappers** with lazy gift wrap subscriptions and end-to-end encryption.

### 👤 **Essential:** [Profile Management](./docs/profile/README.md)
Master **reactive profile and follow list management** with intelligent caching:
- ⚡ **Cache-First Loading**: <10ms response times for cached profiles
- 🛠️ **Fluent Builders**: Intuitive profile creation and updates
- 🔍 **Advanced Discovery**: Search by name, NIP-05, metadata with relevance scoring
- 📦 **Batch Operations**: Efficient bulk profile fetching and follow management

### 🏪 **Next:** [Universal Store System](./docs/stores/README.md) 
Understand how **reactive Svelte stores** provide automatic UI updates across all data access.

### 📝 **Build:** [Event Publishing](./docs/events/README.md)
Master zero-config publishing with **user-controlled signing** providers and fluent event builders.

### 👥 **Scale:** [Social Media Core](./docs/social/README.md)
Build complete social apps with profiles, contacts, threading, reactions, and feeds.

---

## ✨ Core Philosophy

**Universal, Reactive, User-Controlled**

- 🏗️ **Universal Cache Architecture** - 4-layer system: Cache → Query/Sub → APIs → Zero-Config DX
- 🔄 **Identical APIs** - Same fluent interface for cache queries and live subscriptions
- ⚡ **Lazy Loading** - Features activate only when needed (like DM gift wrap subscriptions)
- 🎛️ **User Control** - Full control over signing providers and subscriptions
- 📊 **Reactive Everything** - Svelte stores everywhere for automatic UI updates

```typescript
// This is all you need for a complete Nostr app
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.connect();

// 📝 Publishing
await nostr.publish("Hello, decentralized world! 🌍");

// 🔍 Queries (instant cache access)
const cachedPosts = nostr.query().kinds([1]).execute();

// 📡 Subscriptions (live relay updates)  
const livePosts = nostr.sub().kinds([1]).execute();

// 💬 Direct Messages (lazy-loaded gift wrap subscriptions)
const chat = nostr.dm.with('recipient-pubkey');
await chat.send('Encrypted message!');

// 👤 Profile Management (cache-first with <10ms response)
const profile = nostr.profile.get('npub1...');
await nostr.profile.edit().name('Alice').about('Nostr dev').publish();
await nostr.profile.follows.add('npub1...').petname('Bob').publish();

// 🏪 All return reactive Svelte stores
cachedPosts.subscribe(posts => console.log('Cache:', posts.length));
livePosts.subscribe(posts => console.log('Live:', posts.length));
chat.subscribe(messages => console.log('DMs:', messages.length));
profile.subscribe(state => console.log('Profile:', state.profile?.metadata?.name));
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

### 5-Minute Setup

```typescript
import { NostrUnchained } from 'nostr-unchained';

// 1️⃣ Initialize with zero config
const nostr = new NostrUnchained();

// 2️⃣ Connect to relays (no automatic subscriptions)
await nostr.connect();

// 3️⃣ Choose your signing provider (user control)
await nostr.useExtensionSigner(); // Browser extension (recommended)
// or await nostr.useLocalKeySigner(); // For development

// 4️⃣ Start building!
// 📝 Publish content
const result = await nostr.publish("My first Nostr note!");
console.log(`Published to ${result.successCount} relays`);

// 🔍 Query cached data (instant)
const posts = nostr.query().kinds([1]).execute();
console.log(`Found ${posts.current.length} cached posts`);

// 📡 Subscribe to live updates 
const liveData = nostr.sub().kinds([1]).execute();
liveData.subscribe(events => console.log(`Live: ${events.length}`));

// 💬 Send encrypted DMs
const chat = nostr.dm.with('recipient-pubkey');
await chat.send('Hello! 🔐');
chat.subscribe(messages => console.log(`${messages.length} messages`));

// 👤 Profile & Follow Management
const profile = nostr.profile.get('npub1...'); // <10ms from cache
profile.subscribe(state => console.log('Profile:', state.profile?.metadata?.name));

await nostr.profile.edit()
  .name('Alice Cooper')
  .about('Bitcoin & Nostr enthusiast')
  .nip05('alice@domain.com')
  .publish();

await nostr.profile.follows.add('npub1...')
  .petname('Bob')
  .relay('wss://relay.example.com')
  .publish();

// 🔍 Discover profiles
const results = await nostr.profile.discover()
  .byName('bitcoin')
  .verified()
  .limit(10)
  .execute();
```

> **Next Step:** Read the [Query & Subscription Guide](./docs/query/README.md) to understand the core architecture.

## 🏗️ Universal Cache Architecture Overview

Nostr Unchained is built around a sophisticated **4-layer architecture**:

```
┌─────────────────────────────────────────┐
│  Layer 4: Zero-Config Developer API     │ ← You work here
├─────────────────────────────────────────┤
│  Layer 3: Specialized APIs (DM, Social) │ ← Built on queries
├─────────────────────────────────────────┤
│  Layer 2: Query/Sub Engine              │ ← Identical APIs  
├─────────────────────────────────────────┤
│  Layer 1: Universal Event Cache         │ ← Auto gift wrap handling
└─────────────────────────────────────────┘
```

**Key Benefits:**
- 🔄 **Identical APIs**: `nostr.query()` and `nostr.sub()` work the same way
- ⚡ **Cache-First**: Instant results with live updates
- 🎁 **Auto Gift Wraps**: Kind 1059 → 14 transparent unwrapping
- 📊 **Reactive**: Svelte stores everywhere
- 🔐 **User Control**: Choose signing providers and lazy loading

> **Deep Dive:** Read the [Query & Subscription Engine](./docs/query/README.md) guide to understand how this elegant architecture works.

## 🎛️ User Control Philosophy

**Users decide, code automates.**

### 🔐 Signing Provider Control
```typescript
// ✅ Users choose explicitly
await nostr.useExtensionSigner();  // Browser extension
await nostr.useLocalKeySigner();   // Local keys  
await nostr.useCustomSigner(signer); // Custom provider

// 🔍 Check what's active
const info = nostr.getSigningInfo();
console.log(`Using: ${info.method}`);
```

### ⚡ Lazy Loading
```typescript
// ✅ Connect = relay connections only
await nostr.connect(); 

// ✅ Other features work without DM overhead
await nostr.publish('Hello!'); 
const posts = nostr.query().kinds([1]).execute();

// 🎁 First DM usage = gift wrap subscription starts
const chat = nostr.dm.with(pubkey);
```

> **Complete Guide:** See [Event Publishing](./docs/events/README.md) for all signing options and patterns.

## 📚 Complete Documentation Guide

### 🎯 **Learning Path** (Recommended Order)

#### 1️⃣ **Foundation:** [Universal Query & Subscription Engine](./docs/query/README.md)
**Start here!** Learn the core identical APIs that power everything:
- 🔍 **Queries**: Instant cache lookups with `nostr.query()`
- 📡 **Subscriptions**: Live relay updates with `nostr.sub()`  
- 📊 **Reactive Stores**: Automatic UI updates everywhere

#### 2️⃣ **Messaging:** [Direct Messages](./docs/dm/README.md) 
See the architecture in action with **elegant DM implementation**:
- 💬 **Conversations**: `nostr.dm.with()` as query wrappers
- 🎁 **Lazy Loading**: Gift wrap subscriptions start when needed
- 🔐 **End-to-End Encryption**: NIP-17/NIP-44 transparency

#### 3️⃣ **Profiles:** [Profile Management](./docs/profile/README.md)
Master **social identity** with cache-optimized profile operations:
- 👤 **Reactive Profiles**: `nostr.profile.get()` with <10ms cache hits
- 🛠️ **Fluent Builders**: Intuitive profile creation and updates
- 🔍 **Advanced Discovery**: Search profiles by name, NIP-05, metadata
- 📦 **Batch Operations**: Efficient bulk profile and follow management
- ⚡ **Optimistic Updates**: Instant UI feedback with async relay confirmation

#### 4️⃣ **State Management:** [Universal Store System](./docs/stores/README.md)
Master **reactive data flow** across your entire app:
- 🏪 **Svelte Stores**: Compatible with all frameworks 
- 🔄 **Automatic Updates**: Cache changes update all stores
- ⚡ **Current Access**: Synchronous data when needed

#### 5️⃣ **Publishing:** [Event Publishing](./docs/events/README.md)
Build rich **content creation** with user control:
- 📝 **Zero-Config**: `nostr.publish()` just works
- 🎛️ **User Control**: Choose extension, local, or custom signers
- 🔧 **Fluent Builder**: Complex events made simple

#### 6️⃣ **Social Features:** [Social Media Core](./docs/social/README.md)
Scale to **full social applications**:
- 👤 **Profiles**: User metadata and verification
- 👥 **Contacts**: Follow/follower relationships  
- 💬 **Threads**: Nested conversations
- ❤️ **Reactions**: Like, emoji, custom reactions
- 📰 **Feeds**: Global and following timelines

---

## 🎯 Why Choose Nostr Unchained?

### 🚀 **For Users**
- ✅ **Zero-Config**: Works automatically without setup
- ✅ **User Control**: Choose when features activate  
- ✅ **Privacy**: DM subscriptions only when explicitly used
- ✅ **Performance**: No unnecessary network traffic

### 👩‍💻 **For Developers**
- ✅ **Identical APIs**: Learn once, use everywhere
- ✅ **Reactive**: Automatic UI updates via Svelte stores
- ✅ **Predictable**: Same patterns for all data access
- ✅ **Composable**: Build complex features from simple queries

### 📱 **For Applications**
- ✅ **Scalable**: Cache-first architecture with live updates
- ✅ **Reliable**: Automatic error handling and reconnection
- ✅ **Secure**: End-to-end encryption with perfect forward secrecy
- ✅ **Fast**: Instant cache access with background updates

## ⭐ Key Features

### 🏗️ **Universal Cache Architecture**
- **4-Layer Design** - Clean separation: Cache → Query/Sub → APIs → DX
- **Auto Gift Wrap Handling** - Kind 1059 → 14 transformation transparent
- **Reactive Updates** - All stores update when cache changes
- **Framework Agnostic** - Works with Svelte, React, Vue, vanilla JS

### 🎛️ **User Control & Lazy Loading**
- **Signing Provider Control** - Users choose extension, local, or custom signers
- **Lazy Gift Wrap Subscriptions** - DM features activate only when used
- **Performance Optimized** - No unnecessary subscriptions or network traffic
- **Privacy Focused** - Users control when DM activity becomes visible

### 🔐 **Protocol Support**
- **NIP-01** - Basic protocol flow (events, signatures)
- **NIP-17** - Private Direct Messages with gift wrap protocol
- **NIP-44** - Versioned Encryption (ChaCha20-Poly1305)
- **NIP-59** - Gift Wrap Protocol (automatic unwrapping)
- **NIP-25** - Reactions (extensible for custom emoji)

### 💻 **Developer Experience**
- **TypeScript First** - Complete type safety with intelligent inference
- **Svelte Stores** - Reactive data everywhere with `$store` syntax
- **Identical APIs** - Same fluent interface for queries and subscriptions
- **Rich Error Handling** - Detailed error messages with debugging context

## 🧪 Testing

We maintain high-quality standards with comprehensive testing:

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

**Test Philosophy:**
- **Real Relay Testing** - No mocks, authentic Nostr protocol validation
- **Universal Architecture** - All layers tested in integration
- **User Control Scenarios** - Lazy loading and signing provider switching
- **Multi-participant DMs** - End-to-end encryption testing

## ⚙️ Configuration

```typescript
import { NostrUnchained } from 'nostr-unchained';

// Custom configuration
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

// User chooses signing provider
const result = await nostr.useExtensionSigner();
if (!result.success) {
  // Fallback to local key signer
  await nostr.useLocalKeySigner();
}
```

> **Advanced Configuration:** See [Event Publishing](./docs/events/README.md) for all signing options and error handling patterns.

## 🌐 Framework Integration

### Svelte (Perfect Integration)

```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  await nostr.connect();
  
  // Reactive stores with $ syntax
  const posts = nostr.query().kinds([1]).execute();
  const dmChat = nostr.dm.with('alice-pubkey');
</script>

<!-- Automatically reactive -->
{#each $posts as post}
  <div>{post.content}</div>
{/each}

{#each $dmChat as message}
  <div class:from-me={message.isFromMe}>
    {message.content}
  </div>
{/each}
```

### React Hook

```tsx
import { useState, useEffect } from 'react';

function useNostrStore(store) {
  const [data, setData] = useState(store.current);
  useEffect(() => store.subscribe(setData), [store]);
  return data;
}

function App() {
  const nostr = new NostrUnchained();
  const posts = useNostrStore(nostr.query().kinds([1]).execute());
  
  return (
    <div>
      {posts.map(post => <div key={post.id}>{post.content}</div>)}
    </div>
  );
}
```

> **Framework Integration:** See [Universal Store System](./docs/stores/README.md) for React, Vue, and vanilla JS examples.

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
- **Documentation**: [Complete Documentation](./docs/)

---

<div align="center">

**Built with ❤️ for the Nostr ecosystem**

### 📖 **Complete Documentation Guide**

[🔍 Query Engine](./docs/query/README.md) • [💬 Direct Messages](./docs/dm/README.md) • [🏪 Stores](./docs/stores/README.md) • [📝 Events](./docs/events/README.md) • [👥 Social](./docs/social/README.md)

**Start with [Query & Subscription Engine](./docs/query/README.md) to understand the foundation!**

</div>