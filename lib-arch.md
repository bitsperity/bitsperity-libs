# Nostr Unchained - Library Architecture

## 🏗️ Übersicht

Diese Architektur zeigt die **komplette technische Struktur** von Nostr Unchained mit **exaktem Tech Stack** und **direkter Zuordnung zu User Stories**.

---

## 📊 **High-Level Architecture**

```mermaid
graph TB
    subgraph "🎯 Developer API Layer"
        API[Nostr Unchained API]
        DM[DM Manager]
        QUERY[Query Engine]
        PROFILE[Profile Manager]
        EVENTS[Event Builder]
        RELAYS[Relay Manager]
    end
    
    subgraph "⚡ Core Services Layer"
        CACHE[Cache Service<br/>Dexie.js]
        STORE[Store System<br/>Custom Reactive]
        SIGN[Signing Service<br/>NIP-07 + Crypto]
        CONN[Connection Pool<br/>WebSocket]
    end
    
    subgraph "🔧 Infrastructure Layer"
        CRYPTO[@noble/secp256k1<br/>@noble/hashes]
        WS[ws Library<br/>WebSocket Client]
        IDB[IndexedDB<br/>via Dexie.js]
        EXT[Browser Extensions<br/>NIP-07]
    end
    
    API --> DM
    API --> QUERY
    API --> PROFILE
    API --> EVENTS
    API --> RELAYS
    
    DM --> CACHE
    DM --> STORE
    DM --> SIGN
    
    QUERY --> CACHE
    QUERY --> STORE
    
    PROFILE --> CACHE
    PROFILE --> SIGN
    
    EVENTS --> SIGN
    EVENTS --> CONN
    
    RELAYS --> CONN
    RELAYS --> CACHE
    
    CACHE --> IDB
    SIGN --> CRYPTO
    SIGN --> EXT
    CONN --> WS
```

---

## 🎯 **Tech Stack Details**

### **Core Dependencies**
```typescript
{
  "dependencies": {
    "dexie": "^3.2.4",           // IndexedDB wrapper (~50KB)
    "@noble/secp256k1": "^2.0.0", // Crypto operations (~25KB)
    "@noble/hashes": "^1.3.0",    // SHA256 etc. (~15KB)
    "ws": "^8.14.0"               // WebSocket client (~10KB)
  },
  "peerDependencies": {
    // Keine - vollständig standalone
  }
}
```

### **Bundle Size Breakdown**
- **Dexie.js**: ~50KB (Cache & IndexedDB)
- **@noble/crypto**: ~40KB (Signierung & Hashing)
- **ws**: ~10KB (WebSocket connections)
- **Core Logic**: ~20KB (Query Engine, Stores, etc.)
- **Total**: ~120KB raw, **~80KB gzipped**

---

## 🔄 **Component Architecture**

### **1. Cache Service (Dexie.js)**

```mermaid
graph LR
    subgraph "Cache Service"
        DEXIE[Dexie Database]
        EVENTS_TABLE[Events Table]
        INDEXES[Smart Indexes]
        QUERY_OPT[Query Optimizer]
    end
    
    subgraph "User Stories"
        US037[US-037: Auto Cache]
        US038[US-038: Cache Status]
        US039[US-039: Offline Data]
    end
    
    DEXIE --> EVENTS_TABLE
    EVENTS_TABLE --> INDEXES
    INDEXES --> QUERY_OPT
    
    QUERY_OPT -.-> US037
    QUERY_OPT -.-> US038
    QUERY_OPT -.-> US039
```

**Implementation:**
```typescript
// Dexie Schema
class NostrCache extends Dexie {
  events!: Dexie.Table<NostrEvent, string>;
  
  constructor() {
    super('NostrUnchained');
    this.version(1).stores({
      events: 'id, pubkey, created_at, kind, *tags'
    });
  }
}

// Supports US-037, US-038, US-039
```

### **2. Store System (Custom Reactive)**

```mermaid
graph LR
    subgraph "Store System"
        STORE_BASE[NostrStore Base]
        DM_STORE[DM Store]
        EVENT_STORE[Event Store]
        PROFILE_STORE[Profile Store]
        REACTIVE[Reactive Engine]
    end
    
    subgraph "User Stories"
        US006[US-006: Live DM]
        US034[US-034: Event Updates]
        US035[US-035: Profile Updates]
        US036[US-036: Svelte Stores]
    end
    
    STORE_BASE --> DM_STORE
    STORE_BASE --> EVENT_STORE
    STORE_BASE --> PROFILE_STORE
    REACTIVE --> STORE_BASE
    
    DM_STORE -.-> US006
    EVENT_STORE -.-> US034
    PROFILE_STORE -.-> US035
    STORE_BASE -.-> US036
```

**Implementation:**
```typescript
// Svelte-compatible Store
interface NostrStore<T> {
  subscribe: (callback: (value: T) => void) => () => void;
  update: (updater: (value: T) => T) => void;
  set: (value: T) => void;
}

// Supports US-006, US-034, US-035, US-036
```

### **3. Query Engine (Subgraph-based)**

```mermaid
graph LR
    subgraph "Query Engine"
        BUILDER[Fluent Builder]
        FILTER[Filter Engine]
        SUBGRAPH[Subgraph Engine]
        RELATIONSHIP[Relationship Analyzer]
        EXECUTOR[Query Executor]
    end
    
    subgraph "User Stories"
        US008[US-008: Filter by Kind]
        US009[US-009: Filter by Author]
        US010[US-010: Filter by Time]
        US011[US-011: Filter by Tags]
        US012[US-012: Limit Results]
        US013[US-013: Find Related]
        US014[US-014: Analyze Relations]
        US015[US-015: Graph Traversal]
        US016[US-016: Check Deleted]
    end
    
    BUILDER --> FILTER
    FILTER --> SUBGRAPH
    SUBGRAPH --> RELATIONSHIP
    RELATIONSHIP --> EXECUTOR
    
    FILTER -.-> US008
    FILTER -.-> US009
    FILTER -.-> US010
    FILTER -.-> US011
    FILTER -.-> US012
    SUBGRAPH -.-> US013
    RELATIONSHIP -.-> US014
    SUBGRAPH -.-> US015
    RELATIONSHIP -.-> US016
```

**Implementation:**
```typescript
// Fluent Query API
const results = await nostr.query()
  .kinds([1, 6, 7])           // US-008
  .authors([pubkey1, pubkey2]) // US-009
  .since(timestamp)           // US-010
  .tags('#t', ['nostr'])      // US-011
  .limit(100)                 // US-012
  .subgraph(eventId)          // US-013, US-015
  .relationship(eventId)      // US-014, US-016
  .execute();
```

### **4. DM Manager (NIP-17)**

```mermaid
graph LR
    subgraph "DM Manager"
        ENCRYPT[NIP-17 Encryption]
        SEND[Send Engine]
        RECEIVE[Receive Engine]
        CONV[Conversation Manager]
    end
    
    subgraph "User Stories"
        US003[US-003: Simple Send]
        US004[US-004: Explicit Relays]
        US005[US-005: Get Conversation]
        US006[US-006: Live Follow]
        US007[US-007: List Conversations]
    end
    
    ENCRYPT --> SEND
    ENCRYPT --> RECEIVE
    RECEIVE --> CONV
    SEND --> CONV
    
    SEND -.-> US003
    SEND -.-> US004
    CONV -.-> US005
    RECEIVE -.-> US006
    CONV -.-> US007
```

**Implementation:**
```typescript
// DM API
await nostr.dm.send({
  to: pubkey,                 // US-003
  message: "Hello!",
  relays: ['wss://...']       // US-004
});

const conv = await nostr.dm.getConversation(pubkey); // US-005
const dmStore = nostr.dm.subscribe();               // US-006 (alle DMs an mich)
const conversations = await nostr.dm.getConversations(); // US-007

// DM Flow: Verschlüsselt empfangen → Entschlüsseln → Cache speichern
```

### **5. Profile Manager (NIP-01 + NIP-65)**

```mermaid
graph LR
    subgraph "Profile Manager"
        PROFILE_API[Profile API]
        RELAY_API[Relay API]
        COMBINER[Data Combiner]
        VALIDATOR[Data Validator]
    end
    
    subgraph "User Stories"
        US017[US-017: Full Update]
        US018[US-018: Field Update]
        US019[US-019: Get Profile]
        US020[US-020: Manage Relays]
        US021[US-021: Combined Data]
    end
    
    PROFILE_API --> COMBINER
    RELAY_API --> COMBINER
    COMBINER --> VALIDATOR
    
    PROFILE_API -.-> US017
    PROFILE_API -.-> US018
    COMBINER -.-> US019
    RELAY_API -.-> US020
    COMBINER -.-> US021
```

**Implementation:**
```typescript
// Profile Management
await nostr.profile.update({...});        // US-017
await nostr.profile.set('name', 'Alice'); // US-018
const profile = await nostr.profile.get(pubkey); // US-019
await nostr.relays.updateMine([...]);     // US-020 (nur eigene!)
// profile.relays automatically combined   // US-021 (read-only für andere)
```

### **6. Event Builder (Fluent API)**

```mermaid
graph LR
    subgraph "Event Builder"
        BUILDER[Fluent Builder]
        VALIDATOR[Event Validator]
        TAGGER[Tag Manager]
        SIGNER[Sign Coordinator]
        BROADCASTER[Broadcast Engine]
    end
    
    subgraph "User Stories"
        US022[US-022: Simple Post]
        US023[US-023: With Tags]
        US024[US-024: Reply]
        US025[US-025: Specific Relays]
        US026[US-026: Long-form]
        US042[US-042: Validate]
    end
    
    BUILDER --> TAGGER
    TAGGER --> VALIDATOR
    VALIDATOR --> SIGNER
    SIGNER --> BROADCASTER
    
    BUILDER -.-> US022
    TAGGER -.-> US023
    TAGGER -.-> US024
    BROADCASTER -.-> US025
    BUILDER -.-> US026
    VALIDATOR -.-> US042
```

**Implementation:**
```typescript
// Event Building
await nostr.events.create()
  .kind(1)                    // US-022 (standard text note)
  .content("Hello!")
  .tag('t', 'nostr')          // US-023
  .replyTo(eventId)           // US-024
  .relays(['wss://...'])      // US-025
  .validate()                 // US-042 (reject if invalid)
  .sign()
  .broadcast();

// Spezielle Event-Arten (US-026)
await nostr.events.create()
  .kind(30023)                // Custom kind
  .content("Special content")
  .sign()
  .broadcast();
```

### **7. Signing Service (NIP-07 + Crypto)**

```mermaid
graph LR
    subgraph "Signing Service"
        NIP07[NIP-07 Detector]
        EXTENSION[Extension Signer]
        PRIVATE[Private Key Signer]
        VALIDATOR[Signature Validator]
    end
    
    subgraph "User Stories"
        US027[US-027: Extension Sign]
        US028[US-028: Private Key]
        US029[US-029: Validate Sigs]
    end
    
    NIP07 --> EXTENSION
    NIP07 --> PRIVATE
    EXTENSION --> VALIDATOR
    PRIVATE --> VALIDATOR
    
    EXTENSION -.-> US027
    PRIVATE -.-> US028
    VALIDATOR -.-> US029
```

**Implementation:**
```typescript
// Signing Options
await event.sign();                    // US-027 (NIP-07 default)
await event.signWith(privateKey);     // US-028 (explicit)

// US-029: Validation happens automatically
// Invalid events are discarded, never reach cache
// No manual validation needed - transparent background process
```

### **8. Relay Manager (Connection Pool)**

```mermaid
graph LR
    subgraph "Relay Manager"
        DISCOVERY[Auto Discovery]
        POOL[Connection Pool]
        HEALTH[Health Monitor]
        COMBINER[List Combiner]
    end
    
    subgraph "User Stories"
        US030[US-030: Auto Discover]
        US031[US-031: Combine Lists]
        US032[US-032: Check Status]
        US033[US-033: Error Notify]
    end
    
    DISCOVERY --> POOL
    POOL --> HEALTH
    HEALTH --> COMBINER
    
    DISCOVERY -.-> US030
    COMBINER -.-> US031
    HEALTH -.-> US032
    HEALTH -.-> US033
```

**Implementation:**
```typescript
// Relay Management
const relays = await nostr.relays.getForUser(pubkey); // US-030
const combined = nostr.relays.union(list1, list2);    // US-031
const status = await nostr.relays.checkStatus();      // US-032
nostr.relays.onFailure((relay, error) => {...});      // US-033
```

---

## 🔄 **Data Flow Architecture**

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant API as Nostr API
    participant Cache as Dexie Cache
    participant Relay as Relay Network
    participant Store as Reactive Store
    
    Note over Dev,Store: US-003: Send DM Flow
    
    Dev->>API: dm.send({to, message})
    API->>Cache: getRelaysForUser(to)
    Cache-->>API: relayList || null
    
    alt Relays cached
        API->>Relay: send to cached relays
    else No relays cached
        API->>Relay: fetch user profile
        Relay-->>API: profile + relay list
        API->>Cache: store profile & relays
        API->>Relay: send to discovered relays
    end
    
    Relay-->>API: send confirmations
    API-->>Dev: success/failure report
    
    Note over Dev,Store: US-006: Live DM Flow
    
    Dev->>API: dm.subscribe({authors})
    API->>Store: createDMStore(filter)
    Store->>Relay: subscribe to DM events
    
    loop New DMs arrive
        Relay->>Store: new DM event
        Store->>Cache: store event
        Store->>Dev: notify via store update
    end
```

---

## 🎯 **User Story Mapping**

### **Initialisierung & Setup**
- **US-001, US-002**: Handled by main API constructor and config system

### **Direct Messages (US-003 to US-007)**
- **Component**: DM Manager + NIP-17 Encryption
- **Dependencies**: Cache (relay discovery), Store (live updates), Signing Service

### **Event Queries Simple (US-008 to US-012)**
- **Component**: Query Engine (Filter Engine)
- **Dependencies**: Cache (Dexie indexes), Fluent Builder

### **Event Queries Complex (US-013 to US-016)**
- **Component**: Query Engine (Subgraph + Relationship Engine)
- **Dependencies**: Cache (relationship mapping), Graph algorithms

### **Profile Management (US-017 to US-021)**
- **Component**: Profile Manager + Data Combiner
- **Dependencies**: Cache (profile storage), Event Builder (updates)

### **Event Creation (US-022 to US-026)**
- **Component**: Event Builder + Fluent API
- **Dependencies**: Signing Service, Relay Manager (broadcast)

### **Signing & Security (US-027 to US-029)**
- **Component**: Signing Service + NIP-07 Integration
- **Dependencies**: @noble/crypto, Browser Extensions

### **Relay Management (US-030 to US-033)**
- **Component**: Relay Manager + Connection Pool
- **Dependencies**: WebSocket (ws), Health Monitor

### **Reactive Updates (US-034 to US-036)**
- **Component**: Store System + Reactive Engine
- **Dependencies**: Cache (data source), Custom event system

### **Caching & Performance (US-037 to US-039)**
- **Component**: Cache Service (Dexie.js)
- **Dependencies**: IndexedDB, Smart indexing

### **Debugging & Development (US-040 to US-042)**
- **Component**: Error System + Validator
- **Dependencies**: Event Builder (validation), Debug logger

---

## 📦 **Module Structure**

```
src/
├── core/
│   ├── NostrUnchained.ts      # Main API (US-001, US-002)
│   ├── Cache.ts               # Dexie wrapper (US-037, US-038, US-039)
│   └── Store.ts               # Reactive stores (US-034, US-035, US-036)
├── dm/
│   ├── DMManager.ts           # DM operations (US-003, US-004, US-005)
│   ├── Encryption.ts          # NIP-17 crypto (US-003, US-004)
│   └── Conversations.ts       # Chat management (US-006, US-007)
├── query/
│   ├── QueryBuilder.ts        # Fluent API (US-008 to US-012)
│   ├── SubgraphEngine.ts      # Complex queries (US-013, US-015)
│   └── RelationshipAnalyzer.ts # Event relations (US-014, US-016)
├── profile/
│   ├── ProfileManager.ts      # Profile ops (US-017, US-018, US-019)
│   ├── RelayManager.ts        # Relay lists (US-020, US-030, US-031)
│   └── DataCombiner.ts        # Merge profile+relays (US-021)
├── events/
│   ├── EventBuilder.ts        # Fluent builder (US-022 to US-026)
│   ├── Validator.ts           # Event validation (US-042)
│   └── Broadcaster.ts         # Multi-relay send (US-025)
├── signing/
│   ├── SigningService.ts      # Sign coordination (US-027, US-028)
│   ├── NIP07Detector.ts       # Extension detection (US-027)
│   └── SignatureValidator.ts  # Verify sigs (US-029)
├── relays/
│   ├── ConnectionPool.ts      # WebSocket pool (US-032, US-033)
│   ├── HealthMonitor.ts       # Relay status (US-032, US-033)
│   └── AutoDiscovery.ts       # NIP-65 discovery (US-030)
└── utils/
    ├── ErrorHandler.ts        # Error system (US-040)
    ├── Logger.ts              # Debug logging (US-041)
    └── Types.ts               # TypeScript definitions
```

---

## 🎯 **Performance Targets**

| Component | Target | User Stories |
|-----------|--------|--------------|
| Cache Queries | <50ms | US-008 to US-016, US-037 |
| DM Send | <2s | US-003, US-004 |
| Profile Load | <1s | US-019, US-021 |
| Event Build | <10ms | US-022 to US-026 |
| Store Updates | <5ms | US-034 to US-036 |
| Relay Discovery | <3s | US-030 |

---

## 🚀 **Implementation Priority**

### **Phase 1: Foundation (Weeks 1-4)**
1. Cache Service (Dexie.js) → US-037, US-038, US-039
2. Store System → US-034, US-035, US-036
3. Basic Query Engine → US-008 to US-012
4. Signing Service → US-027, US-028, US-029

### **Phase 2: Core Features (Weeks 5-8)**
1. DM Manager → US-003 to US-007
2. Profile Manager → US-017 to US-021
3. Event Builder → US-022 to US-026
4. Relay Manager → US-030 to US-033

### **Phase 3: Advanced (Weeks 9-12)**
1. Complex Query Engine → US-013 to US-016
2. Error & Debug System → US-040 to US-042
3. Performance Optimization
4. Documentation & Examples

Diese Architektur stellt sicher, dass **jede User Story** einem **konkreten Component** zugeordnet ist und der **Tech Stack** exakt definiert ist. 