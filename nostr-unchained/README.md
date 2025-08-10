# Nostr Unchained

[![NPM Version](https://img.shields.io/npm/v/nostr-unchained)](https://www.npmjs.com/package/nostr-unchained)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen)](#testing)

> SOLID universal cache architecture for the Nostr protocol.  
> Subscription‑first caching, 100% NIP compliance, zero‑config DX with reactive data flows.

**Nostr Unchained** is a SOLID TypeScript‑first Nostr library built on the **Universal Cache Architecture** — a clean 3‑layer system (cache, core, high‑level APIs) that combines subscription‑first caching with live relay synchronization. Ideal for building robust Nostr apps with outstanding DX.

## 🚀 Key features

- 🏗️ Universal Cache Architecture — subscription‑first (cache, core, high‑level)
- ⚡ SOLID implementation — SRP, OCP, LSP, ISP, DIP
- 🔄 Subscription‑first caching — only subscribed data enters the cache
- 🎛️ Excellent DX — zero‑config, intuitive fluent APIs, reactive stores
- 📊 100% protocol compliance — NIP‑17/44/59, and more
- 🔐 Relay Auth (NIP‑42) — automatic AUTH handshake on challenge
- 🛰️ Relay Lists (NIP‑65) — publish/read read/write/both relay lists
- 🗂️ Lists (NIP‑51) — generic lists (30000–30003) with fluent builder and reactive reads
- 💬 Public Chat (NIP‑28) — channels (40/41) & messages (42), hide (43), mute (44)
- 🏷️ Labels (NIP‑32) — `kind:1985` with `L`/`l` and target tags; reactive retrieval
- 💬 Comments (NIP‑22) — universal comments on events/addressables/externals
- 🖼️ Media Attachments (NIP‑92) — `attachMedia()` + `imeta` helpers
- ⚠️ Content Warning (NIP‑36) — `.contentWarning(reason?)`
- 🔐 Advanced cryptography — ChaCha20‑Poly1305, HKDF, PFS
- 🎁 Pre‑signed event support — `publishSigned()` for gift wraps
- 🧪 Real relay testing — no mocks, only protocol‑true validation

---

## 📖 Documentation Walkthrough

This README is the only entry point. For comprehensive documentation, follow this path:

### 🔎 Feature Index (Overview)

- Notes & Events: see [Events & Publishing](./docs/events/README.md)
- Direct Messages (NIP‑17/44/59): see [Direct Messages](./docs/dm/README.md)
- Profiles & Contacts (NIP‑02): see [Social](./docs/social/README.md)
- Threads & Replies (NIP‑10): see [Social](./docs/social/README.md)
- Reactions (NIP‑25): see [Social](./docs/social/README.md)
- Feeds: see [Social](./docs/social/README.md)
- Public Chat (NIP‑28): see [Social → Public Chat](./docs/social/README.md#-public-chat-nip-28)
- Labels (NIP‑32): see [Social → Labels](./docs/social/README.md#-labels-nip-32)
- Comments (NIP‑22): see [Social → Comments](./docs/social/README.md#-comments-nip-22)
- Lists (NIP‑51): see [Social → Lists](./docs/social/README.md#-lists-nip-51)
- Search (NIP‑50): see [Query Engine → NIP‑50](./docs/query/README.md#nip-50-search)
- Media Attachments (NIP‑92): see [Events](./docs/events/README.md#-nip-92-media-attachments)
- Content Warning (NIP‑36): see [Events](./docs/events/README.md#-nip-36-content-warning)
- Relay Auth (NIP‑42): see [Events](./docs/events/README.md#-nip-42-relay-authentication)
- Relay Lists (NIP‑65): see [Events](./docs/events/README.md#-nip-65-relay-lists)
- NIP‑65 Routing (opt‑in): see [Events](./docs/events/README.md#-nip-65-routing-opt-in)
- Remote Signing (NIP‑46): see [Remote Signing](./docs/signing/README.md)
- Query & Subscription Engine: see [Query Engine](./docs/query/README.md)
- Universal Stores (Svelte‑compatible): see [Stores](./docs/stores/README.md)

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

### 🏗️ **Architecture:** [Universal Cache Architecture](./docs/architecture/README.md)
Deep dive into the 4‑layer architecture.

### 👥 **Scale:** [Social Media Core](./docs/social/README.md)
Build complete social apps with profiles, contacts, threading, reactions, feeds.

### 🔎 Feature Snapshots (TL;DR)

- Public Chat (NIP‑28):
  ```ts
  const ch = await nostr.channels.create().name('Demo').publish();
  await nostr.channels.message(ch.eventId).content('Hi!').publish();
   const msgs = nostr.channels.messagesFor(ch.eventId);
   // See: docs/social/README.md#-public-chat-nip-28
  ```
- Labels (NIP‑32):
  ```ts
   await nostr.labels.edit().namespace('ISO-639-1').label('en','ISO-639-1').targetEvent('e'.repeat(64)).publish();
   // See: docs/social/README.md#-labels-nip-32
  ```
- Relay Auth (NIP‑42) & Relay Lists (NIP‑65):
  ```ts
   const nostr = new NostrUnchained({ routing: 'nip65' });
   await nostr.connect(); // AUTH happens automatically if required
   // See: docs/events/README.md and docs/social/README.md
  ```

---

## ✨ Design philosophy

Universal, reactive, user‑controlled.

### 🏗️ Universal Cache Architecture (3‑layer system)
SOLID architecture with clear separation:
```
┌─────────────────────────────────────────┐
│  Layer 2: High‑level APIs              │ ← DM, Profile, Social Modules
├─────────────────────────────────────────┤
│  Layer 1: Core (pub/sub/query/delete)  │ ← NostrUnchained Core Layer
├─────────────────────────────────────────┤
│  Layer 0: Universal Event Cache        │ ← Subscription‑first caching
└─────────────────────────────────────────┘
```

Core principle: only subscribed data enters the cache. No automatic subscriptions; full user control.

### ⚡ Performance‑first design
- Cache‑first: instant responses with background live updates
- O(log n) queries: efficient indexing by kind, author, and tags
- Smart deduplication: no duplicate events in stores
- LRU eviction: optimal memory management

### 🎛️ User control
- Lazy loading: features activate only when needed
- Explicit signer choice: no hidden surprises
- Privacy by design: DM subscriptions only on explicit use

```typescript
// Everything you need for a full Nostr app
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.connect();

// 📝 Publishing — zero config
await nostr.events.note("Hello, decentralized world! 🌍");

// 🔍 Cache queries — instant access (<10ms)
const cachedPosts = nostr.query().kinds([1]).execute();
console.log(`${cachedPosts.current.length} posts from cache`);

// 📡 Live subscriptions — identical API!
const livePosts = nostr.sub().kinds([1]).execute();
livePosts.subscribe(posts => console.log(`Live: ${posts.length} Posts`));

// 💬 Direct Messages — NIP‑44 encryption with gift‑wrap protocol
const chat = nostr.getDM().with('recipient-pubkey');
await chat.send('Encrypted message! 🔐'); // Auto gift‑wrapped
chat.subscribe(messages => console.log(`${messages.length} messages`));

// 👤 Profile management — cache‑first with <10ms response
const profile = nostr.profile.get('npub1...');
await nostr.profile.edit()
  .name('Alice Cooper')
  .about('Bitcoin & Nostr Enthusiast')
  .nip05('alice@domain.com')
  .publish();

// 🔗 Follow management — fluent builder APIs
await nostr.profile.follows.add('npub1...')
  .petname('Bob')
  .relay('wss://relay.example.com')
  .publish();

// 📊 All APIs return reactive Svelte stores
cachedPosts.subscribe(posts => updateUI(posts));
profile.subscribe(state => displayProfile(state.profile));
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
const result = await nostr.events.note("My first Nostr note!");
console.log(`Published to ${result.successCount} relays`);

// 🔍 Query cached data (instant)
const posts = nostr.query().kinds([1]).execute();
console.log(`Found ${posts.current.length} cached posts`);

// 📡 Subscribe to live updates 
const liveData = nostr.sub().kinds([1]).execute();
liveData.subscribe(events => console.log(`Live: ${events.length}`));

// 💬 Send encrypted DMs (NIP-44 compliant)
const chat = nostr.getDM()?.with('recipient-pubkey');
await chat.send('Hello! 🔐'); // Auto Gift-Wrapped mit publishSigned()
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

## 🏗️ Universal Cache Architecture im Detail

Nostr Unchained implements a **SOLID 3‑layer architecture** with subscription‑first caching:

### Architecture overview
```
┌─────────────────────────────────────────┐
│  Layer 2: High‑level APIs              │ ← DM, Profile, Social Modules
├─────────────────────────────────────────┤
│  Layer 1: Core layer                   │ ← pub/sub/query/delete + publishSigned()
├─────────────────────────────────────────┤
│  Layer 0: Universal Event Cache        │ ← Subscription‑first storage
└─────────────────────────────────────────┘
```

Core principle: subscription‑first caching — only subscribed events enter the cache.

### Key architecture benefits

#### ⚡ Performance excellence
- <10ms cache hits via O(log n) indexing
- Tag‑filter support — complete #p/#e/#t filtering
- Gift‑wrap storage — independent of decryption success
- Auto‑subscribe DM — automatic message conversion

#### 🔄 API consistency
```typescript
// IDENTICAL APIs for cache and live data
const cached = nostr.query().kinds([1]).authors(['alice']).execute();
const live = nostr.sub().kinds([1]).authors(['alice']).execute();

// Both return reactive stores with identical API
cached.subscribe(posts => console.log('Cache:', posts.length));
live.subscribe(posts => console.log('Live:', posts.length));
```

#### 🎁 100% NIP‑compliant encryption
- NIP‑44 v2: ChaCha20‑Poly1305 with HKDF
- NIP‑59 gift wrap: 3‑layer pipeline (Rumor → Seal → Gift Wrap)
- NIP‑17 private DMs: full compliance
- publishSigned(): pre‑signed gift‑wrap events
- bytesToHex() fix: correct hex conversion for ephemeral keys

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

### ⚡ Lazy loading
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

### 🛰️ NIP-65 Relay Routing (opt-in)

Enable optional routing per NIP‑65. Events are sent to your write relays as well as mentioned recipients' read relays (p‑tags); default relays are always included (robust).

```typescript
import { NostrUnchained } from 'nostr-unchained';

// 1) Opt-in aktivieren
const nostr = new NostrUnchained({
  relays: ['wss://relay.example'],
  routing: 'nip65'
});
await nostr.useExtensionSigner();
await nostr.connect();

// 2) (Optional) maintain own/recipient relay lists
await nostr.relayList.edit()
  .read('wss://read.example.com')
  .write('wss://write.example.com')
  .publish();

// 3) Routing in action: mention note → also recipient read relays
const result = await nostr.publish({
  pubkey: await nostr.getPublicKey(),
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [['p', 'abcdef...peerhex...']],
  content: 'Hello with routing!'
});
// Debug contains the actual target relays used
console.log(result.debug?.targetRelays);

// 4) DMs profitieren automatisch
// DM → Gift Wrap (kind 1059 mit p‑Tag) → publishSigned() → NIP-65 Routing aktiv
const chat = nostr.dm.with('abcdef...peerhex...');
await chat.send('Hi there!');
```

Notes:
- Default remains unchanged (`routing: 'none'`).
- Routing is additive: default relays are always considered.
- URL normalization: scheme added, trailing slashes removed.

### 🗂️ NIP‑51 Lists (30000–30003)

Create and read lists (follow categories, generic lists, relay collections, bookmarks). Subscription‑first ensures cache fill without breaking layers.

```ts
// Publish Bookmark‑Liste (30003)
await nostr.lists
  .edit(30003, 'bookmarks')
  .title('Bookmarks')
  .description('Important posts to remember')
  .addEvent('e'.repeat(64))
  .addAddress(`30023:${await nostr.getPublicKey()}:article`)
  .addPerson(await nostr.getPublicKey(), 'wss://relay.example', 'Me')
  .topic('nostr')
  .publish();

// Reactive read
const list = nostr.lists.get(await nostr.getPublicKey(), 30003, 'bookmarks');
list.subscribe(v => console.log(v?.title, v?.p?.length, v?.e?.length));
```

### 🏷️ NIP‑32 Labels (kind 1985)

Labels enable moderation/organization using namespaces (`L`) and label values (`l`) on events/authors/addresses/relays/topics.

```ts
// Event labeln
await nostr.labels
  .edit()
  .namespace('ISO-639-1')       // L‑Tag
  .label('en', 'ISO-639-1')     // l‑Tag mit Mark (Namespace)
  .targetEvent('e'.repeat(64))  // Ziel: Event (e‑Tag, optional Relay‑Hint)
  .reason('language: English')  // Optionaler Freitext
  .publish();

// Reactive lesen
const labels = nostr.labels.forEvent('e'.repeat(64));
labels.subscribe(list => console.log('labels for event', list.length));
```

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

#### 🏗️ **Deep Dive:** [Universal Cache Architecture](./docs/architecture/README.md)
Understand the innovative 4‑layer architecture in detail:
- Layer‑by‑layer analysis of the Universal Cache Architecture
- Performance optimizations and O(log n) implementations
- Cryptographic details of gift‑wrap handling
- Architecture testing with real relays

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

## 🎯 Technical highlights

### 🏗️ **Universal Cache Architecture Excellence**

**Intelligent 4‑layer separation:**
- Layer 1 (Cache): O(log n) performance with LRU eviction and automatic gift‑wrap decryption
- Layer 2 (Query/Sub): identical APIs for cache access and live subscriptions
- Layer 3 (APIs): specialized modules (DM, Profile, Social) built on the query engine
- Layer 4 (DX): zero‑config developer experience without protocol details

**Performance optimizations:**
```typescript
// Cache performance: <10ms for cached data
const profile = nostr.profile.get(pubkey); // instant cache access
console.log(profile.current?.name); // synchronous access possible

// Smart deduplication
const sub1 = nostr.sub().kinds([1]).execute(); // starts subscription
const sub2 = nostr.sub().kinds([1]).execute(); // reuses the same subscription
```

### 🖼️ NIP-92 Media Attachments

```ts
const img = 'https://nostr.build/i/my-image.jpg';
await nostr.events
  .create()
  .kind(1)
  .content('Post with image')
  .attachMedia(img, { mimeType: 'image/jpeg', alt: 'Coastal view', dim: '3024x4032' })
  .publish();

// Parser/Helper
import { parseImetaTags } from 'nostr-unchained';
const posts = nostr.query().kinds([1]).execute();
const imetas = posts.current.flatMap(e => parseImetaTags(e));
```

### 🎛️ **User control & privacy by design**

**Explicit signer choice:**
```typescript
// User decides explicitly
await nostr.useExtensionSigner();  // browser extension (recommended)
await nostr.useLocalKeySigner();   // local keys (development)
await nostr.useCustomSigner(customSigner); // custom provider

// Transparent status
const info = nostr.getSigningInfo();
console.log(`Active: ${info.method}, Pubkey: ${info.pubkey}`);
```

**Lazy loading for maximum privacy:**
```typescript
// Phase 1: connect without DM overhead
await nostr.connect(); // only relay connections

// Phase 2: normal usage without DM subscriptions
await nostr.publish('Hello world!'); // works without DMs
// Subscription‑first: publish() does NOT fill the cache automatically.
// Use sub() to receive reactive data and fill the cache.
const posts = nostr.query().kinds([1]).execute();

// Phase 3: first DM usage starts gift‑wrap subscription
const chat = nostr.dm.with(pubkey); // DM subscription starts now
```

### 🔐 **Cryptographic excellence**

**Multi‑layer encryption (NIP‑17/NIP‑44/NIP‑59):**
- 3‑layer pipeline: Rumor → Seal → Gift Wrap
- NIP‑44 v2: ChaCha20‑Poly1305 with HKDF key derivation
- Perfect forward secrecy: ephemeral keys per message
- Noble.js integration

**Automatic gift‑wrap handling:**
```typescript
// User sees only the simple API
const chat = nostr.dm.with(pubkey);
await chat.send('Secret message');

// Cache automatically handles:
// 1. NIP‑44 encryption
// 2. NIP‑59 seal creation
// 3. Gift wrap creation (kind 1059)
// 4. Decryption of incoming gift wraps
// 5. 1059 → 14 transformation
```

### 💻 **Developer experience excellence**

**TypeScript‑first with strong typing:**
```typescript
// Full type safety
const posts: UniversalNostrStore<NostrEvent[]> = nostr.query().kinds([1]).execute();
const profile: UniversalNostrStore<UserProfile | null> = nostr.profile.get(pubkey);

// Fluent builders with autocompletion
const result = await nostr.profile.edit()
  .name('Alice') // string
  .about('Bio')  // string
  .nip05('alice@domain.com') // validated email
  .publish(); // PublishResult
```

**Framework‑agnostic reactivity:**
```svelte
<!-- Svelte (native) -->
<script>
  const posts = nostr.query().kinds([1]).execute();
</script>
{#each $posts as post}
  <div>{post.content}</div>
{/each}
```

```tsx
// React hook pattern
function useNostrStore(store) {
  const [data, setData] = useState(store.current);
  useEffect(() => store.subscribe(setData), [store]);
  return data;
}
```

## 🔧 Recent Critical Fixes (v2.0+)

### Gift Wrap Protocol Compliance
- publishSigned() method
  - Issue: `publish()` re-signed gift-wrap events and invalidated them
  - Fix: `publishSigned()` keeps original signature with ephemeral keys
- Tag filter implementation: full #p/#e/#t filtering
  - Issue: `matchesFilter()` had no tag filtering implemented
  - Fix: complete tag-filter logic for all standard tags
- Gift-wrap caching: events stored regardless of decryption
  - Issue: gift wraps were dropped when decryption failed
  - Fix: all gift wraps are cached; decryption is optional
- Auto-subscribe fix: DMConversation now subscribes automatically
  - Issue: `convertEventsToMessages()` was never called
  - Fix: auto-subscribe in constructor for message conversion

### API Improvements
- DMMessage.sender: new alias property for better compatibility
- getDM() method: explicit getter instead of direct property
- Hex conversion fix: `bytesToHex()` instead of manual conversion

## 🧪 Testing Philosophy: Real Relay Validation

Nostr Unchained uses NO MOCKS — only real relay tests for authentic protocol validation:

### Test philosophy

Mock-first is wrong for protocol libraries.
- Real relay testing: all tests run against real Nostr relays
- Container-based relays: ephemeral test relays without persistence
- Protocol compliance: official NIP test vectors (NIP-44 v2)
- End-to-end validation: multi-user DM flows with real cryptography
- Subscription-first: tests validate cache population via subscriptions

Test structure (v2):
```
tests-v2/
├── 00-infrastructure/   # Relay health, container setup
├── 01-core/            # Cache, Pub/Sub, Query tests
├── 02-high-level/      # DM, Profile, Social module tests  
├── 03-integration/     # Multi-user end-to-end flows
├── 04-protocol-compliance/ # NIP-44, NIP-59 official vectors
└── debug/              # Deep debugging tests
```

Example of test quality:
```typescript
// Real signers, real relay connections
const alice = new NostrUnchained({ relays: [LIVE_RELAY_URL] });
const bob = new NostrUnchained({ relays: [LIVE_RELAY_URL] });

// End-to-end DM test
const aliceChat = alice.dm.with(bobPubkey);
const bobChat = bob.dm.with(alicePubkey);

await aliceChat.send('Hello Bob! 🔐');
const messages = await bobChat.messages.waitFor(1);
assert(messages[0].content === 'Hello Bob! 🔐');
```

### Architecture tests

4-layer architecture testing:
- Layer 1: UniversalEventCache with O(log n) performance tests
- Layer 2: Query/Sub engine with identical APIs
- Layer 3: DM/Profile/Social module integration
- Layer 4: Zero-config developer experience

Performance & security testing:
- Cache performance: >100 events/second processing
- Memory management: LRU eviction and memory leak tests
- Cryptography: NIP-44 official test vectors compliance
- Gift wrap handling: automatic 1059 → 14 transformation

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

[🔍 Query Engine](./docs/query/README.md) • [💬 Direct Messages](./docs/dm/README.md) • [🏪 Stores](./docs/stores/README.md) • [📝 Events](./docs/events/README.md) • [👥 Social](./docs/social/README.md) • [🔑 Remote Signing](./docs/signing/README.md) • [🏗️ Architecture](./docs/architecture/README.md)

**Start with [Query & Subscription Engine](./docs/query/README.md) to understand the foundation!**

</div>