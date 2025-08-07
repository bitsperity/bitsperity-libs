# Nostr Unchained

[![NPM Version](https://img.shields.io/npm/v/nostr-unchained)](https://www.npmjs.com/package/nostr-unchained)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen)](#testing)

> **Universal Cache Architecture für dezentrale soziale Protokolle.**  
> Zero-Config Nostr mit intelligenter Cache-First Performance, Lazy Loading und reaktiven Datenflüssen.

**Nostr Unchained** ist eine hochmoderne TypeScript-First Nostr-Bibliothek, die auf der **Universal Cache Architecture** basiert - einem raffinierten 4-Schichten-System, das blitzschnellen Cache-Zugriff mit Live-Relay-Subscriptions kombiniert. Perfekt für Entwickler, die mächtige Nostr-Anwendungen ohne Komplexität erstellen wollen.

## 🚀 Kernmerkmale

- **🏗️ Universal Cache Architecture** - Intelligente 4-Layer-Architektur mit automatischer Gift-Wrap-Behandlung
- **⚡ Cache-First Performance** - <10ms Antwortzeiten für gecachte Daten
- **🔄 Identische APIs** - `nostr.query()` und `nostr.sub()` funktionieren identisch
- **🎛️ Benutzer-Kontrolle** - Lazy Loading, explizite Signing-Provider-Wahl
- **📊 Reaktive Stores** - Svelte Store Integration für automatische UI-Updates
- **🔐 End-to-End Verschlüsselung** - NIP-17/NIP-44 mit Perfect Forward Secrecy
- **🎁 Transparente Gift-Wrap-Behandlung** - Automatische Kind 1059 → 14 Entschlüsselung

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

### 🏗️ **Architecture:** [Universal Cache Architecture](./docs/architecture/README.md)
Erfahre die innovative 4-Schichten-Architektur im Detail.

### 👥 **Scale:** [Social Media Core](./docs/social/README.md)
Build complete social apps with profiles, contacts, threading, reactions, and feeds.

---

## ✨ Design-Philosophie

**Universal, Reaktiv, Benutzer-Kontrolliert**

Nostr Unchained folgt einer klaren Design-Philosophie, die auf drei Säulen basiert:

### 🏗️ Universal Cache Architecture
Elegante 4-Schichten-Architektur, die Komplexität abstrahiert:
```
┌─────────────────────────────────────────┐
│  Schicht 4: Zero-Config Developer API  │ ← Du arbeitest hier
├─────────────────────────────────────────┤
│  Schicht 3: Spezialisierte APIs (DM)   │ ← Basiert auf Queries
├─────────────────────────────────────────┤
│  Schicht 2: Query/Sub Engine           │ ← Identische APIs
├─────────────────────────────────────────┤
│  Schicht 1: Universal Event Cache      │ ← Auto Gift-Wrap-Handling
└─────────────────────────────────────────┘
```

### ⚡ Performance-First Design
- **Cache-First**: Sofortige Antworten mit Live-Updates im Hintergrund
- **O(log n) Queries**: Effiziente Indexierung nach Kind, Autor und Tags
- **Intelligente Deduplication**: Keine doppelten Events in Stores
- **LRU-Eviction**: Optimale Speicherverwaltung

### 🎛️ Benutzer-Kontrolle
- **Lazy Loading**: Features aktivieren sich nur bei Bedarf
- **Explizite Signing-Provider-Wahl**: Keine versteckten Überraschungen
- **Privacy by Design**: DM-Subscriptions nur bei expliziter Nutzung

```typescript
// Das ist alles, was du für eine vollständige Nostr-App brauchst
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
await nostr.connect();

// 📝 Publishing - Zero Config
await nostr.events.note("Hallo, dezentrale Welt! 🌍");

// 🔍 Cache Queries - Sofortiger Zugriff (<10ms)
const cachedPosts = nostr.query().kinds([1]).execute();
console.log(`${cachedPosts.current.length} Posts aus Cache`);

// 📡 Live Subscriptions - Identische API!
const livePosts = nostr.sub().kinds([1]).execute();
livePosts.subscribe(posts => console.log(`Live: ${posts.length} Posts`));

// 💬 Direct Messages - Lazy Loading mit End-to-End Verschlüsselung
const chat = nostr.dm.with('recipient-pubkey');
await chat.send('Verschlüsselte Nachricht! 🔐');
chat.subscribe(messages => console.log(`${messages.length} Nachrichten`));

// 👤 Profile Management - Cache-First mit <10ms Response
const profile = nostr.profile.get('npub1...');
await nostr.profile.edit()
  .name('Alice Cooper')
  .about('Bitcoin & Nostr Enthusiast')
  .nip05('alice@domain.com')
  .publish();

// 🔗 Follow Management - Fluent Builder APIs
await nostr.profile.follows.add('npub1...')
  .petname('Bob')
  .relay('wss://relay.example.com')
  .publish();

// 📊 Alle APIs returnieren reaktive Svelte Stores
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

## 🏗️ Universal Cache Architecture im Detail

Nostr Unchained implementiert eine innovative **4-Schichten-Architektur**, die Komplexität vollständig abstrahiert:

### Architektur-Überblick
```
┌─────────────────────────────────────────┐
│  Schicht 4: Zero-Config Developer API  │ ← Hier entwickelst du
├─────────────────────────────────────────┤
│  Schicht 3: Spezialisierte APIs        │ ← DM, Profile, Social
├─────────────────────────────────────────┤
│  Schicht 2: Query/Subscription Engine  │ ← Identische APIs
├─────────────────────────────────────────┤
│  Schicht 1: Universal Event Cache      │ ← Intelligente Speicherung
└─────────────────────────────────────────┘
```

### Kernvorteile der Architektur

#### ⚡ Performance Excellence
- **<10ms Cache-Zugriffe** durch O(log n) Indexierung
- **Intelligente LRU-Eviction** für optimale Speichernutzung
- **Automatische Deduplication** verhindert doppelte Events
- **Shared Subscriptions** reduzieren Netzwerk-Traffic

#### 🔄 API-Konsistenz
```typescript
// IDENTISCHE APIs für Cache und Live-Daten
const cached = nostr.query().kinds([1]).authors(['alice']).execute();
const live = nostr.sub().kinds([1]).authors(['alice']).execute();

// Beide returnieren reaktive Stores mit identischer API
cached.subscribe(posts => console.log('Cache:', posts.length));
live.subscribe(posts => console.log('Live:', posts.length));
```

#### 🎁 Transparente Verschlüsselung
- **Automatische Gift-Wrap-Behandlung**: Kind 1059 → 14 Transformation
- **NIP-44 v2 Verschlüsselung** mit ChaCha20-Poly1305
- **Perfect Forward Secrecy** durch Ephemeral Keys
- **Zero-Config Encryption**: Verschlüsselung funktioniert transparent

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

#### 🏗️ **Deep Dive:** [Universal Cache Architecture](./docs/architecture/README.md)
Verstehe die **innovative 4-Schichten-Architektur** im Detail:
- 🎯 **Schicht-für-Schicht-Analyse** der Universal Cache Architecture
- ⚡ **Performance-Optimierungen** und O(log n) Implementierungen
- 🔐 **Kryptographische Details** der Gift-Wrap-Behandlung
- 📊 **Architektur-Testing** mit Real-Relay-Validierung

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

## 🎯 Technische Highlights

### 🏗️ **Universal Cache Architecture Excellence**

**Intelligente 4-Schichten-Trennung:**
- **Schicht 1 (Cache)**: O(log n) Performance mit LRU-Eviction und automatischer Gift-Wrap-Entschlüsselung
- **Schicht 2 (Query/Sub)**: Identische APIs für Cache-Zugriff und Live-Subscriptions
- **Schicht 3 (APIs)**: Spezialisierte Module (DM, Profile, Social) basierend auf Query-Engine
- **Schicht 4 (DX)**: Zero-Config Developer Experience ohne technische Details

**Performance-Optimierungen:**
```typescript
// Cache-Performance: <10ms für gecachte Daten
const profile = nostr.profile.get(pubkey); // Sofortiger Cache-Zugriff
console.log(profile.current?.name); // Synchroner Zugriff möglich

// Intelligente Deduplication
const sub1 = nostr.sub().kinds([1]).execute(); // Startet Subscription
const sub2 = nostr.sub().kinds([1]).execute(); // Nutzt dieselbe Subscription!
```

### 🎛️ **Benutzer-Kontrolle & Privacy by Design**

**Explizite Signing-Provider-Wahl:**
```typescript
// Benutzer entscheidet bewusst
await nostr.useExtensionSigner();  // Browser Extension (empfohlen)
await nostr.useLocalKeySigner();   // Lokale Keys (Development)
await nostr.useCustomSigner(customSigner); // Custom Provider

// Transparenter Status
const info = nostr.getSigningInfo();
console.log(`Aktiv: ${info.method}, Pubkey: ${info.pubkey}`);
```

**Lazy Loading für maximale Privacy:**
```typescript
// Phase 1: Verbindung ohne DM-Overhead
await nostr.connect(); // Nur Relay-Verbindungen

// Phase 2: Normale Nutzung ohne DM-Subscriptions
await nostr.publish('Hallo Welt!'); // Funktioniert ohne DMs
const posts = nostr.query().kinds([1]).execute();

// Phase 3: Erste DM-Nutzung startet Gift-Wrap-Subscription
const chat = nostr.dm.with(pubkey); // JETZT startet DM-Subscription
```

### 🔐 **Kryptographische Exzellenz**

**Multi-Layer-Verschlüsselung (NIP-17/NIP-44/NIP-59):**
- **3-Layer-Verschlüsselung**: Rumor → Seal → Gift Wrap
- **NIP-44 v2**: ChaCha20-Poly1305 mit HKDF-Schlüsselableitung
- **Perfect Forward Secrecy**: Ephemeral Keys für jede Nachricht
- **Noble.js Integration**: Industriestandard-Kryptographie

**Automatische Gift-Wrap-Behandlung:**
```typescript
// User sieht nur die einfache API
const chat = nostr.dm.with(pubkey);
await chat.send('Geheime Nachricht');

// Cache behandelt automatisch:
// 1. Verschlüsselung (NIP-44)
// 2. Seal Creation (NIP-59)
// 3. Gift Wrap Creation (Kind 1059)
// 4. Entschlüsselung eingehender Gift Wraps
// 5. Kind 1059 → Kind 14 Transformation
```

### 💻 **Developer Experience der Spitzenklasse**

**TypeScript-First mit intelligenter Typisierung:**
```typescript
// Vollständige Typsicherheit
const posts: UniversalNostrStore<NostrEvent[]> = nostr.query().kinds([1]).execute();
const profile: UniversalNostrStore<UserProfile | null> = nostr.profile.get(pubkey);

// Fluent Builders mit Autocompletion
const result = await nostr.profile.edit()
  .name('Alice') // string
  .about('Bio')  // string
  .nip05('alice@domain.com') // validierte Email
  .publish(); // PublishResult
```

**Framework-agnostische Reaktivität:**
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
// React Hook Pattern
function useNostrStore(store) {
  const [data, setData] = useState(store.current);
  useEffect(() => store.subscribe(setData), [store]);
  return data;
}
```

## 🧪 Qualitätssicherung

Nostr Unchained setzt auf **No-Mock Testing** mit echten Relays für authentische Protokoll-Validierung:

### Test-Philosophie

**Real Relay Testing Excellence:**
- **42+ Test-Dateien** mit umfassender Abdeckung
- **Keine Mocks**: Authentische Nostr-Protokoll-Validierung
- **Live-Relay-Integration**: Tests gegen echte Relay-Server
- **End-to-End Verschlüsselung**: Multi-Teilnehmer-DM-Flows

**Test-Kategorien:**
```
tests-old-backup/
├── infrastructure/     # Vitest Setup & Relay Health
├── unit/              # Einzelmodule (Crypto, Builder, etc.)
├── integration/       # Vollständige Protokoll-Flows
└── social/           # Soziale Features mit echten Relays
```

**Beispiel für Test-Qualität:**
```typescript
// Echte Signer, echte Relay-Verbindungen
const alice = new NostrUnchained({ relays: [LIVE_RELAY_URL] });
const bob = new NostrUnchained({ relays: [LIVE_RELAY_URL] });

// End-to-End DM Test
const aliceChat = alice.dm.with(bobPubkey);
const bobChat = bob.dm.with(alicePubkey);

await aliceChat.send('Hallo Bob! 🔐');
const messages = await bobChat.messages.waitFor(1);
assert(messages[0].content === 'Hallo Bob! 🔐');
```

### Architektur-Tests

**4-Schichten-Architektur Testing:**
- **Layer 1**: UniversalEventCache mit O(log n) Performance-Tests
- **Layer 2**: Query/Sub Engine mit identischen APIs
- **Layer 3**: DM/Profile/Social Module Integration
- **Layer 4**: Zero-Config Developer Experience

**Performance & Security Testing:**
- **Cache Performance**: >100 Events/Sekunde Verarbeitung
- **Memory Management**: LRU-Eviction und Memory-Leak-Tests
- **Kryptographie**: NIP-44 Official Test Vectors Compliance
- **Gift Wrap Handling**: Automatische 1059 → 14 Transformation

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

[🔍 Query Engine](./docs/query/README.md) • [💬 Direct Messages](./docs/dm/README.md) • [🏪 Stores](./docs/stores/README.md) • [📝 Events](./docs/events/README.md) • [👥 Social](./docs/social/README.md) • [🏗️ Architecture](./docs/architecture/README.md)

**Start with [Query & Subscription Engine](./docs/query/README.md) to understand the foundation!**

</div>