# 📚 Nostr Unchained Documentation

Complete documentation for the Universal Cache Architecture and high‑level modules.

## 🎯 Quickstart Path

New to Nostr Unchained? Follow this path:

### 1️⃣ Foundation: [Universal Query & Subscription Engine](./query/README.md)
Start here to learn the core identical APIs powering everything:
- 🔍 Cache Queries with `nostr.query()`
- 📡 Live Subscriptions with `nostr.sub()`
- 🔄 Identical fluent APIs for cache and live data

### 2️⃣ Messaging: [Direct Messages](./dm/README.md)
See the architecture in action with an elegant DM system:
- 💬 Conversations via `nostr.dm.with()`
- 🎁 Lazy gift‑wrap subscriptions
- 🔐 End‑to‑end encryption (NIP‑17/NIP‑44/NIP‑59)

### 3️⃣ Core Data: [Universal Store System](./stores/README.md)
Master reactive data flow across your app:
- 🏪 Svelte‑compatible stores (framework agnostic)
- 🔄 Automatic updates from cache changes
- ⚡ Synchronous `current` access

### 4️⃣ Profiles: [Profile Management](./profile/README.md)
Cache‑first social identity with advanced discovery:
- 👤 Reactive profiles with <10ms cache hits
- 🛠️ Fluent builders
- 🔍 Discovery with relevance scoring
- 📦 Batch operations

### 5️⃣ Publishing: [Event Publishing](./events/README.md)
Build rich content with user‑controlled signing:
- 📝 Zero‑config `publish()`
- 🎛️ Explicit signer choice
- 🔧 Fluent builder for complex events

### 6️⃣ Social Features: [Social Media Core](./social/README.md)
Scale to complete social apps:
- 👤 Profiles • 👥 Contacts • 💬 Threads • ❤️ Reactions • 📰 Feeds

## 🏗️ Architecture Deep‑Dive

### [Universal Cache Architecture](./architecture/README.md)
The heart of Nostr Unchained — modern layered design:
- 📊 Layer‑by‑layer analysis
- ⚡ Performance details and O(log n) indexing
- 🔐 Gift‑wrap handling and crypto details
- 🧪 Real‑relay validation

## 📖 Docs Structure

```
docs/
├── README.md                 # This overview
├── architecture/             # 🏗️ Architecture deep‑dive
│   └── README.md            
├── query/                    # 🔍 Query & Subscription Engine
│   └── README.md
├── stores/                   # 🏪 Universal Store System
│   └── README.md
├── dm/                       # 💬 Direct Messages
│   └── README.md
├── profile/                  # 👤 Profile Management
│   ├── README.md
│   ├── caching.md           # Caching strategies
│   └── examples.md          # Practical examples
├── events/                   # 📝 Event Publishing
│   └── README.md
├── social/                   # 👥 Social Media Core
│   └── README.md
└── status/                  # 📈 NIP status (short EN summary)
    └── nip-status.md
```

## 📊 API Matrix

| Feature | API | Cache‑first | Live updates | Lazy loading |
|---------|-----|-------------|--------------|--------------|
| Posts | `nostr.query().kinds([1])` | ✅ <10ms | ✅ Auto | ❌ Always |
| Profiles | `nostr.profile.get()` | ✅ <10ms | ✅ Auto | ❌ Always |
| DMs | `nostr.dm.with()` | ✅ <10ms | ✅ Auto | ✅ On‑demand |
| Follows | `nostr.profile.follows` | ✅ <10ms | ✅ Auto | ❌ Always |
| Reactions | `nostr.social.reactions` | ✅ <10ms | ✅ Auto | ❌ Always |
| Feeds | `nostr.social.feeds` | ✅ <10ms | ✅ Auto | 🟡 Configurable |

## 🔍 Developer Index

### Performance
- <10ms cache access: [Profile Management](./profile/README.md#performance--caching)
- O(log n) indexing: [Architecture](./architecture/README.md)
- LRU eviction: [Architecture](./architecture/README.md)
- Shared subscriptions: [Query Engine](./query/README.md#performance-optimization)

### Cryptography & Security
- NIP‑44 v2 encryption: [Direct Messages](./dm/README.md)
- Gift‑wrap protocol: [Architecture](./architecture/README.md)
- Perfect Forward Secrecy: [DM Security](./dm/README.md)

### Framework Integration
- Svelte stores: [Store System](./stores/README.md)
- React hooks: [Store System](./stores/README.md)
- Vue composition: [Store System](./stores/README.md)

## 🤝 Contributing to Docs

Found something to improve? PRs are welcome — examples, clarifications, performance tips, or framework integrations.