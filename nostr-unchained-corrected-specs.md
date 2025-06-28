# Nostr Unchained - Corrected Technical Specifications

## Kritische Korrekturen basierend auf Feedback

### 1. Query Engine - Detaillierte Erklärung

Der **Query Engine** arbeitet mit **Subgraphen** als zentralem Konzept:

```typescript
// Ein Subgraph ist IMMER eine Menge von Events
// - Einzelner Event = Subgraph mit einem Element
// - Tree einer Idee = Subgraph mit allen verwandten Events  
// - Events verschiedener Leute = Menge von Subgraphen

interface Subgraph {
  root: NostrEvent;           // Das root event des Subgraphs
  events: NostrEvent[];       // Alle Events in diesem Subgraph
  relationships: Map<string, string[]>; // event_id -> [related_event_ids]
}

// Query gibt IMMER Array von Subgraphen zurück
const results: Subgraph[] = await nostr.query()
  .kinds([1, 6, 7])           // Nostr kinds
  .authors([pubkey1, pubkey2])
  .tags('#t', ['nostr', 'bitcoin'])
  .since(timestamp)
  .until(timestamp)
  .limit(100)
  .execute();

// Subgraph-Extraktion: "Alle Events zu Job XYZ"
const jobSubgraphs = await nostr.query()
  .subgraph(jobEventId)       // Startet von diesem Event
  .depth(3)                   // Max 3 Ebenen tief
  .includeReplies(true)
  .includeReactions(true)
  .execute();

// Relationship-Query: "Hat Event A ein decline-Event?"
const hasDecline = await nostr.query()
  .relationship(eventId)
  .hasChild(5)                // kind:5 = delete events
  .where('tags', 'e', eventId) // Referenziert das ursprüngliche Event
  .exists();
```

### 2. Unified Cache - Ein Cache für alle Events

**Ihr habt recht** - alle Nostr Events haben die gleiche Struktur! Ein einziger Cache ist optimal:

```typescript
interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Ein Cache für ALLE Events
class UnifiedEventCache {
  private events = new Map<string, NostrEvent>();
  
  // Smart Indexing für schnelle Queries
  private kindIndex = new Map<number, Set<string>>();
  private authorIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private timeIndex = new Map<number, Set<string>>();
  
  // Relationship mapping für Subgraphs
  private relationships = new Map<string, Set<string>>();
}
```

### 3. Store-basierte Subscriptions statt Callbacks

**Ihr habt recht** - Callbacks sind nicht optimal. **Store Pattern** ist besser:

```typescript
// Svelte-kompatible Stores
interface NostrStore<T> {
  subscribe: (callback: (value: T) => void) => () => void;
  update: (updater: (value: T) => T) => void;
  set: (value: T) => void;
}

// DM Store
const dmStore = nostr.dm.subscribe({
  authors: [contactPubkey],
  since: Date.now() - 3600
});

// Reactive usage in Svelte
$: messages = $dmStore; // Automatisch reactive

// Manual subscription
dmStore.subscribe(messages => {
  console.log('New messages:', messages);
});

// Jede Subscription schreibt automatisch in Cache
// UND triggert Store Updates
```

### 4. Korrekte Nostr Event Struktur

**Basierend auf NIPs Research:**

```typescript
// Profile (NIP-01, kind:0)
await nostr.profile.update({
  name: "Alice",
  about: "Nostr developer", 
  picture: "https://example.com/alice.jpg"
  // KEINE relays hier - das ist ein separates Event!
});

// Relay List (NIP-65, kind:10002) 
await nostr.relays.update([
  ['wss://relay1.com', 'read'],
  ['wss://relay2.com', 'write'],
  ['wss://relay3.com', ''] // read+write
]);

// Cache managed das intelligent:
const profile = await nostr.profile.get(pubkey);
// Gibt zurück: { ...profileData, relays: [...] }
// Obwohl intern zwei separate Events
```

### 5. Realistische Event-Building API

```typescript
// Korrektes Tag-System basierend auf Nostr
await nostr.events.create()
  .kind(1)
  .content("Hello Nostr!")
  .tag('e', replyToEventId)     // Reply
  .tag('p', mentionPubkey)      // Mention
  .tag('t', 'nostr')           // Topic
  .tag('t', 'bitcoin')         // Topic
  .sign()                      // NIP-07 default
  .broadcast();

// Job Event (NIP-23 long-form)
await nostr.events.create()
  .kind(30023)
  .content("Job description...")
  .tag('d', jobId)             // Replaceable event identifier
  .tag('title', 'Senior Dev Position')
  .tag('t', 'jobs')
  .tag('location', 'remote')
  .sign()
  .broadcast();
```

### 6. Alby Integration (NIP-07)

```typescript
// Default: Immer NIP-07 (Alby, nos2x, etc.)
await nostr.events.create()
  .kind(1)
  .content("Test")
  .sign()        // Verwendet window.nostr.signEvent()
  .broadcast();

// Nur wenn explizit gewünscht: Private Key
await nostr.events.create()
  .kind(1) 
  .content("Test")
  .signWith(privateKey)  // Explizit private key
  .broadcast();
```

### 7. Realistische Query Syntax

```typescript
// REALISTISCH - Nah an Nostr Filter Syntax
const jobEvents = await nostr.query()
  .kinds([30023])                    // NIP-23 long-form content
  .tags('#d', [jobId])              // 'd' tag für addressable events
  .tags('#t', ['jobs'])             // hashtag filter
  .since(timestamp)
  .limit(100)
  .execute();

// Relationship Queries - basierend auf echter Nostr Tag-Struktur  
const hasDecline = await nostr.query()
  .kinds([5])                       // NIP-09 deletion events
  .tags('#e', [eventId])           // Events die auf unser Event referenzieren
  .tags('#k', ['1'])               // kind 1 events werden declined
  .exists();

// Event-Graph traversal
const eventSubgraph = await nostr.query()
  .startFrom(eventId)
  .includeReferencing(true)         // Events mit #e tag auf startEvent
  .includeReplies(true)            // Events mit reply marker
  .depth(3)                        // Max 3 Hops
  .execute();
```

### 8. Cache Design - In-Memory mit IndexedDB Option

Basierend auf Bitspark-Analyse:

```typescript
interface CacheConfig {
  // Primary: In-Memory (wie Bitspark)
  primary: {
    maxEvents: 50000,           // Mehr Events als Bitspark
    maxProfiles: 5000,
    evictionPolicy: 'lru',      // Least Recently Used
  },
  
  // Optional: IndexedDB für Persistence
  persistence: {
    enabled: false,             // Default aus für Dezentralisierung
    prefix: 'nostr-unchained',
    encrypt: true,              // Mit User-Password
  },
  
  // Intelligent preloading
  preload: {
    followingProfiles: true,    // Auto-load following list profiles
    recentConversations: 10,    // Last 10 DM conversations
  }
}

// Event-basierte Cache Invalidation
cache.on('profile:updated', (pubkey) => {
  cache.invalidateProfile(pubkey);
  cache.invalidateRelayList(pubkey);
});
```

### 9. Subscription System mit Connection Pooling

```typescript
interface SubscriptionManager {
  // Smart subscription merging
  subscribe(filter: NostrFilter): NostrStore<NostrEvent[]> {
    // Merge kompatible subscriptions automatisch
    const existingSub = this.findCompatibleSubscription(filter);
    if (existingSub) {
      return existingSub.createSubStore(filter);
    }
    return this.createNewSubscription(filter);
  }
  
  // Beispiel: Profile subscriptions werden gemerged
  profileSubscriptions: Map<string, WebSocket>; // Eine connection für alle profiles
  dmSubscriptions: Map<string, WebSocket>;      // Separate für privacy
}

// Automatisches subscription merging
const profileStore1 = nostr.profile.subscribe(pubkey1);
const profileStore2 = nostr.profile.subscribe(pubkey2);
// → Intern nur eine Subscription: {"kinds":[0],"authors":[pubkey1,pubkey2]}
```

### 10. Error Handling ohne Bloat

```typescript
// Minimales, informatives Error Handling
try {
  await nostr.dm.send({to: pubkey, message: "test"});
} catch (error) {
  console.error('Send failed:', error.message);
  console.error('Failed relays:', error.failedRelays);
  console.error('Successful relays:', error.successfulRelays);
}

// Debug modus nur in development
if (nostr.config.debug) {
  console.log('Event validated:', event);
  console.log('Relay response times:', responseTimes);
}
```

### 11. Realistic API Examples

```typescript
// DM Example - Korrekte Verschlüsselung
const dmManager = nostr.dm;

// Send with NIP-17 encryption (nicht NIP-04!)
await dmManager.send({
  to: [recipientPubkey],
  content: "Hello!",
  subject: "Meeting Tomorrow", // Optional
  // relays werden automatisch aus recipient profile geholt (NIP-65)
});

// DM Subscription - WICHTIG: Verschlüsselt empfangen, entschlüsselt cachen
const dmStore = dmManager.subscribe(); // Alle DMs an mich
// Flow: Encrypted Event → Decrypt → Store decrypted content in cache

// Get conversation history 
const conversations = await dmManager.getConversations();
// Returns: Array<{participants: string, messages: DecryptedDMEvent[], subject: string}>

// Query mit fluent API (Option A - konsistent!)
const events = await nostr.query()
  .kinds([1, 30023])
  .tags('#t', ['nostr', 'development'])
  .tags('#p', [pubkey1, pubkey2])
  .since(timestamp)
  .limit(50)
  .execute();
```

## Zusammenfassung der Korrekturen

1. **Query Engine**: Subgraph-basiert, gibt immer Array von Subgraphen zurück
2. **Cache**: Einheitlich für alle Events, intelligente Indizierung  
3. **Subscriptions**: Store-Pattern, automatisches Merging, Cache-Integration
4. **Profile**: Kind:0 + Kind:10002 korrekt getrennt, aber DX kombiniert
5. **Alby**: Default Browser Extension Signing, Private Key opt-in
6. **Tags**: Korrekte NIP-01/10 e-tag und p-tag Struktur
7. **Cache**: In-Memory primary, IndexedDB optional
8. **Performance**: Kein unnötiges Performance Monitoring
9. **API**: Näher an echter Nostr Filter-Syntax
10. **Error Handling**: Minimal aber informativ

Diese Spezifikation ist deutlich realistischer und näher an den echten Nostr-Standards. 

## 🏗️ **Empfohlene Cache-Library Architektur**

Basierend auf meiner Research sind die **besten Optionen**:

### **Option A: Dexie.js (Empfohlen für MVP)**
```typescript
// Pros: Mature, TypeScript, große Community
// Cons: Etwas größer (~50KB)
import Dexie from 'dexie';

class NostrCache extends Dexie {
  events!: Dexie.Table<NostrEvent, string>;
  
  constructor() {
    super('NostrUnchained');
    this.version(1).stores({
      events: 'id, pubkey, created_at, kind, *tags'
    });
  }
}
```

### **Option B: IDB-Keyval (Minimal)**
```typescript
// Pros: Tiny (~600B), einfach
// Cons: Weniger Features, eigene Indizierung nötig
import { get, set, del } from 'idb-keyval';

class MinimalCache {
  async getEvent(id: string) {
    return await get(`event:${id}`);
  }
  
  async setEvent(event: NostrEvent) {
    await set(`event:${event.id}`, event);
  }
}
```

### **Empfehlung: Nur Dexie.js für MVP**
```typescript
// Einfach und fokussiert - nur Dexie.js
import Dexie from 'dexie';

class NostrCache extends Dexie {
  events!: Dexie.Table<NostrEvent, string>;
  
  constructor() {
    super('NostrUnchained');
    this.version(1).stores({
      events: 'id, pubkey, created_at, kind, *tags'
    });
  }
  
  // Dexie hat bereits interne Optimierungen
  // Kein zusätzlicher In-Memory Layer nötig für MVP
}
```

## 🎯 **Finale Empfehlung**

**Für Nostr Unchained MVP:**

1. **Cache**: Nur Dexie.js (einfach und fokussiert)
2. **Store Pattern**: Eigene Svelte-kompatible Stores
3. **Query Engine**: Subgraph-basiert mit intelligenter Indizierung
4. **Event Building**: Fluent API nah an Nostr-Spezifikation
5. **Signing**: NIP-07 default, Private Key opt-in

**Bundle Size Ziel**: < 80KB (nur Dexie.js + Core)
**Performance Ziel**: < 50ms für typische Queries (IndexedDB)
**DX Ziel**: 5 Zeilen Code für komplexe Use Cases 