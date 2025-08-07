# 📚 Nostr Unchained Documentation

**Komplette Dokumentation der Universal Cache Architecture für Nostr-Anwendungen**

## 🎯 Schnellstart-Guide

Neueinstieg in Nostr Unchained? Folge diesem optimalen Lernpfad:

### 1️⃣ **Foundation:** [Universal Query & Subscription Engine](./query/README.md)
**Beginne hier!** Verstehe die Kern-APIs, die alles antreiben:
- 🔍 **Cache Queries**: Sofortige Daten-Lookups mit `nostr.query()`
- 📡 **Live Subscriptions**: Echtzeit-Updates mit `nostr.sub()`
- 🔄 **Identische APIs**: Eine Syntax für Cache und Live-Daten

### 2️⃣ **Messaging:** [Direct Messages](./dm/README.md)
Siehe die Architektur in Aktion mit **elegantem DM-System**:
- 💬 **Conversations**: `nostr.dm.with()` als Query-Wrapper
- 🎁 **Lazy Loading**: Gift-Wrap-Subscriptions starten bei Bedarf
- 🔐 **End-to-End Verschlüsselung**: NIP-17/NIP-44 völlig transparent

### 3️⃣ **Core Data:** [Universal Store System](./stores/README.md)
Master **reaktive Datenflüsse** durch deine App:
- 🏪 **Svelte Stores**: Kompatibel mit allen Frameworks
- 🔄 **Automatische Updates**: Cache-Änderungen updaten alle Stores
- ⚡ **Current Access**: Synchroner Datenzugriff wenn nötig

### 4️⃣ **Profiles:** [Profile Management](./profile/README.md)
Beherrsche **soziale Identität** mit cache-optimierten Operationen:
- 👤 **Reaktive Profile**: `nostr.profile.get()` mit <10ms Cache-Hits
- 🛠️ **Fluent Builders**: Intuitive Profil-Erstellung und Updates
- 🔍 **Advanced Discovery**: Profile-Suche mit Relevance-Scoring
- 📦 **Batch Operations**: Effiziente Bulk-Verwaltung

### 5️⃣ **Publishing:** [Event Publishing](./events/README.md)
Erstelle **reiche Inhalte** mit Benutzer-Kontrolle:
- 📝 **Zero-Config**: `nostr.publish()` funktioniert einfach
- 🎛️ **User Control**: Wähle Extension, Local oder Custom Signer
- 🔧 **Fluent Builder**: Komplexe Events einfach gemacht

### 6️⃣ **Social Features:** [Social Media Core](./social/README.md)
Skaliere zu **vollständigen sozialen Apps**:
- 👤 **Profile**: Benutzer-Metadaten und Verifikation
- 👥 **Kontakte**: Follow/Follower-Beziehungen
- 💬 **Threads**: Verschachtelte Konversationen
- ❤️ **Reactions**: Like, Emoji, Custom-Reactions
- 📰 **Feeds**: Globale und Following-Timelines

## 🏗️ Architektur-Deep-Dive

### [Universal Cache Architecture](./architecture/README.md)
**Das Herzstück von Nostr Unchained** - Innovative 4-Schichten-Architektur:
- 📊 **Schicht-für-Schicht-Analyse** der Universal Cache Architecture
- ⚡ **Performance-Details** und O(log n) Implementierungen
- 🔐 **Kryptographische Excellence** der Gift-Wrap-Behandlung
- 🧪 **Architektur-Testing** mit Real-Relay-Validierung

## 📖 Dokumentations-Struktur

```
docs/
├── README.md                 # Diese Übersicht
├── architecture/             # 🏗️ Architektur-Deep-Dive
│   └── README.md            
├── query/                    # 🔍 Query & Subscription Engine
│   └── README.md
├── stores/                   # 🏪 Reactive Store System
│   └── README.md
├── dm/                       # 💬 Direct Messages
│   └── README.md
├── profile/                  # 👤 Profile Management
│   ├── README.md
│   ├── caching.md           # Cache-Strategien
│   └── examples.md          # Praktische Beispiele
├── events/                   # 📝 Event Publishing
│   └── README.md
└── social/                   # 👥 Social Media Core
    └── README.md
```

## 🎯 Use Case Guides

### Für Nostr-Neueinsteiger
1. **Start**: [Query Engine](./query/README.md) - Verstehe die Basis
2. **Erste App**: [Event Publishing](./events/README.md) - Publiziere Content  
3. **Interaktionen**: [Social Media Core](./social/README.md) - Soziale Features

### Für Entwickler mit Nostr-Erfahrung
1. **Architektur**: [Universal Cache Architecture](./architecture/README.md) - Was macht es besonders
2. **Performance**: [Profile Management](./profile/README.md) - Cache-First Optimierungen
3. **Kryptographie**: [Direct Messages](./dm/README.md) - NIP-17/44/59 Excellence

### Für Framework-Integration
1. **Reaktivität**: [Universal Store System](./stores/README.md) - Svelte/React/Vue
2. **Datenfluss**: [Query Engine](./query/README.md) - Identische APIs
3. **State Management**: [Social Media Core](./social/README.md) - Komplexe Apps

## 📊 API-Referenz-Matrix

| Feature | API | Cache-First | Live Updates | Lazy Loading |
|---------|-----|-------------|--------------|--------------|
| **Posts** | `nostr.query().kinds([1])` | ✅ <10ms | ✅ Auto | ❌ Always |
| **Profiles** | `nostr.profile.get()` | ✅ <10ms | ✅ Auto | ❌ Always |
| **DMs** | `nostr.dm.with()` | ✅ <10ms | ✅ Auto | ✅ On-Demand |
| **Follows** | `nostr.profile.follows` | ✅ <10ms | ✅ Auto | ❌ Always |
| **Reactions** | `nostr.social.reactions` | ✅ <10ms | ✅ Auto | ❌ Always |
| **Feeds** | `nostr.social.feeds` | ✅ <10ms | ✅ Auto | 🟡 Configurable |

## 🔍 Suchindex für Entwickler

### Performance-kritische Features
- **<10ms Cache-Zugriffe**: [Profile Management](./profile/README.md#cache-first-performance)
- **O(log n) Queries**: [Architecture](./architecture/README.md#cache-performance) 
- **LRU-Eviction**: [Architecture](./architecture/README.md#layer-1-universal-event-cache)
- **Shared Subscriptions**: [Query Engine](./query/README.md#performance-optimization)

### Kryptographie & Sicherheit
- **NIP-44 v2 Encryption**: [Direct Messages](./dm/README.md#cryptographic-excellence)
- **Gift-Wrap Protocol**: [Architecture](./architecture/README.md#automatic-gift-wrap-handling)
- **Perfect Forward Secrecy**: [DM Crypto Details](./dm/README.md#security-features)
- **Noble.js Integration**: [Architecture](./architecture/README.md#cryptographic-implementation)

### Framework-Integration
- **Svelte Stores**: [Store System](./stores/README.md#svelte-integration)
- **React Hooks**: [Store System](./stores/README.md#react-integration)  
- **Vue Composition**: [Store System](./stores/README.md#vue-integration)
- **TypeScript Types**: [All Modules] - Vollständige Typsicherheit

### Protokoll-Support
- **NIP-01**: Basic Events - [Event Publishing](./events/README.md#event-types)
- **NIP-17**: Private DMs - [Direct Messages](./dm/README.md)
- **NIP-44**: Versioned Encryption - [DM Crypto](./dm/README.md#cryptographic-excellence)
- **NIP-59**: Gift Wraps - [Architecture](./architecture/README.md#gift-wrap-handling)
- **NIP-25**: Reactions - [Social Core](./social/README.md#reactions--engagement)

## 🎓 Learning Resources

### Hands-on Tutorials
- [**5-Minute Quickstart**](../README.md#5-minute-setup) - Sofort funktionsfähig
- [**Profile Examples**](./profile/examples.md) - Praktische Code-Samples
- [**DM Examples**](./dm/README.md#quick-start) - End-to-End Verschlüsselung
- [**Social Feed Examples**](./social/README.md#quick-start) - Timeline-Implementierung

### Architektur-Verstehen
- [**4-Layer Architecture**](./architecture/README.md#architecture-overview) - System-Design
- [**Cache-First Philosophy**](./architecture/README.md#performance-first-design) - Performance-Ansatz  
- [**Identical APIs Concept**](./query/README.md#universal-cache-architecture) - API-Konsistenz
- [**Reactive Data Flow**](./stores/README.md#reactive-patterns) - Store-System

### Best Practices
- [**Performance Patterns**](./stores/README.md#performance-patterns) - Optimale Store-Nutzung
- [**Error Handling**](./events/README.md#error-handling) - Robuste Implementierungen
- [**Memory Management**](./social/README.md#best-practices) - Subscription Cleanup
- [**Security Guidelines**](./dm/README.md#security-features) - Kryptographische Sicherheit

## 🚀 Von der Dokumentation zur Implementation

### Phase 1: Verstehen
1. Lese [Universal Cache Architecture](./architecture/README.md)
2. Experimentiere mit [Query Engine](./query/README.md)
3. Verstehe [Store System](./stores/README.md)

### Phase 2: Erste App
1. Setup mit [Event Publishing](./events/README.md)
2. Profile-Features mit [Profile Management](./profile/README.md)
3. Basic Social mit [Social Core](./social/README.md)

### Phase 3: Production-Ready
1. Optimierungen aus [Performance Patterns](./stores/README.md#performance-patterns)
2. Sichere DMs mit [Direct Messages](./dm/README.md)
3. Advanced Features aus [Social Core](./social/README.md)

---

## 🤝 Beitragen zur Dokumentation

Erkennst du Verbesserungspotential? Feedback ist willkommen!

- **Missing Examples**: Konkrete Use-Cases fehlen?
- **Unclear Explanations**: Etwas nicht verständlich erklärt?
- **Performance Tips**: Weitere Optimierungen bekannt?
- **Framework Examples**: Andere Frameworks nicht abgedeckt?

**Die Dokumentation ist ein lebendes System - genau wie die Universal Cache Architecture die sie beschreibt.**