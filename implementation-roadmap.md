# Nostr Unchained - Implementation Roadmap

## 🚀 MVP Ziele (Bitspark Replacement)

Basierend auf den Bitspark-Problemen, die ihr identifiziert habt:

### Kernprobleme von Bitspark die gelöst werden müssen:
1. ❌ **Unhandliches Event-Handling** → ✅ Fluent API mit Event-Builder
2. ❌ **Kompliziertes Relay-Management** → ✅ Auto-Discovery + NIP-65 Integration  
3. ❌ **Umständliche Profile-Bearbeitung** → ✅ Einfache Profile API
4. ❌ **Fehlende DX beim Subscriben** → ✅ Store-basierte Subscriptions
5. ❌ **Keine komplexen Queries** → ✅ Subgraph-basierte Query Engine

---

## 📋 Phase 1: Core Foundation (4-6 Wochen)

### 1.1 Unified Cache System
```typescript
// Priority: CRITICAL - Basis für alles andere
class UnifiedCache {
  private events = new Map<string, NostrEvent>();
  private indexManager = new IndexManager();
  
  addEvent(event: NostrEvent): void;
  queryEvents(filter: NostrFilter): NostrEvent[];
  getEventReferences(eventId: string): string[];
}
```

**Akzeptanzkriterien:**
- [ ] Alle Event-Arten in einem Cache
- [ ] Sub-100ms Query-Performance bei 10k Events
- [ ] Automatische Index-Updates
- [ ] Memory-efficient LRU eviction

### 1.2 Store-based Subscription System
```typescript
// Priority: HIGH - Ersetzt Callback-Pattern
interface NostrStore<T> {
  subscribe(callback: (value: T) => void): () => void;
  get(): T;
}

const dmStore = nostr.dm.createStore({withUser: pubkey});
$: messages = $dmStore; // Svelte kompatibel
```

**Akzeptanzkriterien:**
- [ ] Svelte Store Interface
- [ ] Automatische Cache-Integration
- [ ] Subscription merging
- [ ] Memory leak prevention

### 1.3 NIP-07 Signing Integration
```typescript
// Priority: HIGH - Alby Support
const nostr = new NostrUnchained({
  signer: 'alby',
  relays: defaultRelays
});

await nostr.events.create().kind(1).content("test").sign().send();
```

**Akzeptanzkriterien:**
- [ ] Alby Extension Detection
- [ ] Graceful fallback zu anderen NIP-07 Signern
- [ ] Private Key als Opt-in
- [ ] Error handling für fehlende Extensions

---

## 📋 Phase 2: Query Engine (3-4 Wochen)

### 2.1 Subgraph Query System
```typescript
// Priority: CRITICAL - Löst Bitspark Query-Probleme
const jobSubgraph = await nostr.query()
  .startFrom(jobEventId)
  .includeReferencing(true)
  .includeReplies(true)  
  .depth(3)
  .execute(); // Returns: Subgraph[]
```

**Akzeptanzkriterien:**
- [ ] Subgraph-basierte Results
- [ ] Event-Relationship mapping
- [ ] Configurable traversal depth
- [ ] Performance: <500ms für medium graphs

### 2.2 Fluent Query Builder
```typescript
// Priority: HIGH - Entwickler-freundliche API
const events = await nostr.query()
  .kinds([1, 30023])
  .tags('#t', ['jobs'])
  .authors([pubkey1, pubkey2])
  .since(timestamp)
  .limit(100)
  .execute();
```

**Akzeptanzkriterien:**
- [ ] Chainable query methods
- [ ] Type-safe tag filtering
- [ ] Nostr filter compatibility
- [ ] Query validation

---

## 📋 Phase 3: Relay Management (2-3 Wochen)

### 3.1 NIP-65 Auto-Discovery
```typescript
// Priority: HIGH - Löst Bitspark Relay-Probleme
const profile = await nostr.profile.get(pubkey);
console.log(profile.relays); // Auto aus NIP-65 events

await nostr.dm.send({
  to: [recipientPubkey],
  content: "Hello!"
  // Relays automatisch aus recipient's relay list
});
```

**Akzeptanzkriterien:**
- [ ] Automatische Relay-Discovery aus NIP-65
- [ ] Smart relay selection (read/write)
- [ ] Fallback zu default relays
- [ ] Relay health monitoring

### 3.2 Connection Pooling
```typescript
// Priority: MEDIUM - Performance optimization
interface RelayManager {
  getConnection(relayUrl: string): WebSocket;
  subscribeToMultiple(relays: string[], filter: NostrFilter): void;
}
```

**Akzeptanzkriterien:**
- [ ] Shared WebSocket connections
- [ ] Automatic reconnection
- [ ] Subscription merging across relays
- [ ] Connection timeout handling

---

## 📋 Phase 4: DM System (2-3 Wochen)

### 4.1 NIP-17 Direct Messages
```typescript
// Priority: HIGH - Ersetzt Bitspark DMManager
await nostr.dm.send({
  to: [pubkey1, pubkey2],
  content: "Group message",
  subject: "Meeting"
});

const conversations = await nostr.dm.getConversations();
const messageStore = nostr.dm.createStore({withUser: pubkey});
```

**Akzeptanzkriterien:**
- [ ] NIP-17 encryption (nicht NIP-04)
- [ ] Multi-recipient support
- [ ] Conversation threading
- [ ] Subject support
- [ ] Store-based updates

### 4.2 Chat Room Management
```typescript
// Priority: MEDIUM - Erweiterte DM Features
const roomStore = nostr.dm.createRoomStore({
  participants: [pubkey1, pubkey2, pubkey3]
});

const rooms = await nostr.dm.getRooms();
```

**Akzeptanzkriterien:**
- [ ] Multi-participant chats
- [ ] Room persistence
- [ ] Message ordering
- [ ] Read status tracking

---

## 📋 Phase 5: Profile Management (1-2 Wochen)

### 5.1 Profile + Relay Management
```typescript
// Priority: MEDIUM - Ersetzt Bitspark Profile handling
await nostr.profile.update({
  name: "Alice",
  about: "Developer",
  picture: "https://example.com/pic.jpg"
});

await nostr.relayList.update([
  ['r', 'wss://relay.com'],
  ['r', 'wss://backup.com', 'write']
]);
```

**Akzeptanzkriterien:**
- [ ] Kind:0 und Kind:10002 korrekt getrennt
- [ ] Aber DX kombiniert im Cache
- [ ] Transactional updates
- [ ] Field-level updates

---

## 📋 Phase 6: Advanced Features (2-3 Wochen)

### 6.1 Event Building API
```typescript
// Priority: MEDIUM - DX improvements
await nostr.events.create()
  .kind(30023)
  .content("Long form content")
  .tag('d', uniqueId)
  .tag('title', 'My Article')
  .tag('t', 'technology')
  .replyTo(originalEventId) // Automatische e-tag und p-tag
  .sign()
  .broadcast(['wss://relay1.com', 'wss://relay2.com']);
```

**Akzeptanzkriterien:**
- [ ] Fluent event builder
- [ ] Automatic tag management
- [ ] Reply/mention helpers
- [ ] Validation before send

### 6.2 Advanced Query Features
```typescript
// Priority: LOW - Power user features
const exists = await nostr.query()
  .kinds([5]) // deletion events
  .tags('#e', [eventId])
  .exists();

const stats = await nostr.query()
  .kinds([7]) // reactions
  .tags('#e', [eventId])
  .groupBy('content') // Group by reaction type
  .count();
```

**Akzeptanzkriterien:**
- [ ] Existence queries
- [ ] Aggregation functions
- [ ] Complex relationship queries
- [ ] Statistical operations

---

## 🎯 Success Metrics

### Phase 1-2 (MVP):
- [ ] **Bitspark Migration möglich**: Gleiche Features aber bessere DX
- [ ] **Performance**: <200ms für standard queries
- [ ] **Memory**: <50MB für 10k Events
- [ ] **Developer Onboarding**: <30min für ersten DM

### Phase 3-4 (Beta):
- [ ] **Relay Efficiency**: 50% weniger connections als aktuell
- [ ] **DM Reliability**: 99% message delivery
- [ ] **Profile Sync**: <5s für profile updates

### Phase 5-6 (v1.0):
- [ ] **Complex Queries**: Subgraph queries <1s
- [ ] **Event Building**: Zero boilerplate für standard events
- [ ] **Advanced Features**: Power user workflows unterstützt

---

## 🛠 Technology Stack

### Core Libraries:
- **TypeScript**: Strikte Typensicherheit
- **ws**: WebSocket connections
- **@noble/secp256k1**: Schnelle crypto operations
- **@noble/hashes**: SHA256 und andere hashes

### Testing:
- **Vitest**: Fast unit testing
- **WebSocket Mock**: Relay simulation
- **Test Vectors**: Nostr event test cases

### Build:
- **tsup**: Fast TypeScript bundling
- **publint**: Package validation
- **changeset**: Version management

---

## 🚦 Risiken & Mitigation

### Hohe Risiken:
1. **Performance bei großen Event-Mengen**
   - *Mitigation*: Early benchmarking, Profile-driven optimization
   
2. **Relay-Kompatibilität Probleme**  
   - *Mitigation*: Test gegen populäre Relays, Fallback strategies

3. **Browser Extension Integration instabil**
   - *Mitigation*: Robuste Error handling, Fallback methoden

### Mittlere Risiken:
1. **Memory Leaks bei lange-laufenden Apps**
   - *Mitigation*: Strict cleanup patterns, Memory profiling

2. **Query-Performance degradiert mit Complex graphs**
   - *Mitigation*: Query optimization, Caching strategies

---

Dieser Roadmap priorisiert die **kritischen Bitspark-Probleme** und liefert schrittweise Value. Nach Phase 2 habt ihr bereits ein deutlich besseres System als das aktuelle Bitspark Setup! 