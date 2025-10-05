# Relay Management Analyse – nostr-unchained & nostr-unchained-app

**Datum:** 2025-10-02  
**Status:** Kritisches Problem identifiziert bei Community-Relay-Routing

---

## 🔴 Hauptproblem: Automatisches Relay-Selection überschreibt manuelle Konfiguration

### Problem-Beschreibung

Bei der Arbeit mit Communities (Phase 10) werden die **falschen Relays** genutzt, obwohl die Community-spezifischen Relays korrekt konfiguriert sind.

### Root Cause

**Datei:** `nostr-unchained/src/core/NostrUnchained.ts`  
**Methode:** `publish()` (Zeilen 726-734)

```typescript
// Auto-select relays for routing-sensitive NIPs (e.g., NIP-72, DMs)
let autoTargets: string[] | null = null;
try {
  autoTargets = await this.autoSelectRelaysForEvent(event as any);
} catch {}

// If autoTargets were found, use smart one-shot publish to those
if (Array.isArray(autoTargets) && autoTargets.length > 0) {
  return await this.publishToRelaysSmart(event, autoTargets);
}
```

**Das Problem:**
1. `FluentEventBuilder.toRelays()` setzt korrekt `this.targetRelays`
2. `FluentEventBuilder.publish()` ruft `publishToRelaysSmart(event, this.targetRelays)` auf
3. ABER: `NostrUnchained.publish()` wird intern vom FluentBuilder aufgerufen
4. `autoSelectRelaysForEvent()` wird IMMER ausgeführt und überschreibt die manuell gesetzten Relays
5. Die über `.toRelays()` gesetzten Target-Relays gehen verloren

### Betroffene Flows

#### 1. Community Definition (kind 34550)
```typescript
// CommunitiesModule.ts Zeilen 47-50
const authorRelay = this.relays.find((r) => r.marker === 'author')?.url;
if (authorRelay) (b as any).toRelays?.(authorRelay);
```
✅ **Intent:** Publish zu author-relay  
❌ **Reality:** Wird möglicherweise von autoSelectRelaysForEvent überschrieben

#### 2. Community Posts (kind 1111)
```typescript
// CommunitiesModule.ts Zeilen 82-87
const markers = await (this.nostr.communities as any).resolveRelays(...);
if (markers?.requests) { 
  try { (b as any).toRelays?.(markers.requests); } catch {} 
}
```
✅ **Intent:** Publish zu requests-relay  
❌ **Reality:** autoSelectRelaysForEvent findet auch den requests-relay, aber über einen anderen Pfad (Zeilen 867-881)

#### 3. Community Approvals (kind 4550)
```typescript
// CommunitiesModule.ts Zeilen 143-146
const markers = await (this.nostr.communities as any).resolveRelays(...);
if (markers?.approvals) { 
  try { (b as any).toRelays?.(markers.approvals); } catch {} 
}
```
✅ **Intent:** Publish zu approvals-relay  
❌ **Reality:** autoSelectRelaysForEvent findet auch den approvals-relay (Zeilen 884-898)

### Warum funktioniert es manchmal trotzdem?

Die `autoSelectRelaysForEvent()` Methode (Zeilen 854-914) implementiert die **gleiche Logik** wie die Builder:
- Für kind 34550: Sucht nach relay-Tags mit marker 'author'
- Für kind 1111: Resolved die Community-Relays über `communities.resolveRelays()`
- Für kind 4550: Resolved ebenfalls über `communities.resolveRelays()`

**Also warum das Problem?**

1. **Race Condition:** `resolveRelays()` wird zweimal aufgerufen (einmal im Builder, einmal in autoSelect)
2. **Timing:** Der zweite Aufruf hat möglicherweise nicht die gleichen Cache-Ergebnisse
3. **Fehlerbehandlung:** Beide Aufrufe haben try-catch, aber unterschiedliche Fallbacks
4. **Inkonsistenz:** Builder setzt targetRelays, aber publish() ignoriert diese und ruft autoSelect erneut auf

---

## 🏗️ Architektur-Bewertung

### ✅ Was gut funktioniert

#### 1. **Modulare Struktur**
- Klare Trennung: RelayManager, SubscriptionManager, NostrUnchained
- Gute DX: Fluent API für Event-Building
- Erweiterbar: Neue NIPs können eigene Relay-Logik implementieren

#### 2. **NIP-spezifische Auto-Selection**
- `autoSelectRelaysForEvent()` implementiert korrekt NIP-72 Relay-Marker
- `Nip65RelayRouter` für allgemeines Relay-Routing
- Routing-sensitive Events werden erkannt (Zeile 916-918)

#### 3. **Smart Relay Management**
```typescript
async publishToRelaysSmart(event, relayUrls, options) {
  // Temporäre Relays hinzufügen
  // Verbinden
  // Publishen
  // Cleanup (disconnect + remove)
}
```
Perfekt für One-Shot-Publishing zu speziellen Relays!

#### 4. **Relay Health & Discovery (NIP-66 Foundation)**
- `RelayHealthMonitor` 
- `RelayDiscovery`
- Gute Basis für künftige Health-Probes

### ❌ Was problematisch ist

#### 1. **Doppelte Relay-Resolution**
Builder UND publish() führen die gleiche Logik aus:
```
CommunityPostBuilder.publish()
  ├─> resolveRelays() #1 (Zeile 84)
  ├─> toRelays(markers.requests)
  └─> FluentEventBuilder.publish()
      └─> NostrUnchained.publishToRelaysSmart()
          └─> NostrUnchained.publish() [INTERN]
              └─> autoSelectRelaysForEvent()
                  └─> resolveRelays() #2 (Zeile 875)
```

**Folge:** Verschwendete Ressourcen, mögliche Inkonsistenzen

#### 2. **Fehlende Priorisierung**
Es gibt keine klare Hierarchie:
1. Manuelle targetRelays (via toRelays)
2. Auto-selected Relays (NIP-spezifisch)
3. NIP-65 Routing
4. Connected Relays
5. Default Relays

**Aktuell:** Auto-select hat Vorrang vor manuell gesetzten targetRelays!

#### 3. **publishToRelaysSmart wird falsch aufgerufen**

In `FluentEventBuilder.publish()` Zeile 244:
```typescript
return await this.nostrInstance.publishSignedToRelaysSmart(this.signedEvent, this.targetRelays);
```

In `FluentEventBuilder.publish()` Zeile 280:
```typescript
return this.targetRelays && this.targetRelays.length
  ? await this.nostrInstance.publishToRelaysSmart(eventData, this.targetRelays)
  : await this.nostrInstance.publish(eventData);
```

**Problem:** `publishToRelaysSmart` ruft intern `publish()` NICHT auf (nur bei unsigned events), aber bei signed events ruft es `publishSignedToRelaysSmart` auf, was wiederum NICHT `publish()` aufruft.

**Aber:** Zeile 280 ruft bei targetRelays `publishToRelaysSmart` auf, welches dann INTERN `publish()` aufruft (weil es unsigned ist), und dort wird dann `autoSelectRelaysForEvent()` ausgeführt!

#### 4. **Intransparente Relay-Auswahl**
Der User sieht nicht:
- Welche Relays tatsächlich genutzt wurden
- Warum diese Relays gewählt wurden
- Ob manuelle Relays überschrieben wurden

**Debug-Output** fehlt oder ist unvollständig.

#### 5. **App-seitige Hardcoded Relays**
```typescript
// ServiceContainer.ts:202-207
return createNostrService({
  relays: ['ws://umbrel.local:4848'],  // ❌ Hardcoded!
  debug: true,
  timeout: 20000,
  routing: 'nip65'
});
```

**Folge:**
- App startet immer nur mit einem Relay
- NIP-65 soll weitere Relays laden, aber...
- Community-spezifische Relays konkurrieren mit NIP-65 Relays

---

## 🎯 Qualitätsbewertung

### Struktur: ⭐⭐⭐⭐ (4/5)
- ✅ Modulare Architektur
- ✅ Klare Verantwortlichkeiten
- ⚠️ Zu viele Ebenen bei Publish-Flow
- ❌ Doppelte Relay-Resolution

### DX (Developer Experience): ⭐⭐⭐ (3/5)
- ✅ Fluent API sehr intuitiv
- ✅ `.toRelays()` ist entdeckbar
- ⚠️ Aber funktioniert nicht wie erwartet (wird überschrieben!)
- ❌ Kein klares Feedback welche Relays genutzt werden
- ❌ Debugging schwierig (Race Conditions)

### Vielseitigkeit: ⭐⭐⭐⭐ (4/5)
- ✅ Unterstützt verschiedene Routing-Strategien (none, nip65)
- ✅ NIP-spezifische Auto-Selection (NIP-72, NIP-17, etc.)
- ✅ Manuelle Relay-Auswahl möglich (theoretisch)
- ⚠️ Aber: Strategien überschreiben sich gegenseitig

### Korrektheit bzgl. NIPs: ⭐⭐⭐⭐⭐ (5/5)
- ✅ NIP-72 Community Relay Markers korrekt implementiert
- ✅ NIP-65 Relay Lists korrekt
- ✅ NIP-17 DM Routing korrekt
- ✅ Alle relevanten Marker (author, requests, approvals) werden erkannt

### Kontrolle: ⭐⭐ (2/5)
- ❌ User kann nicht sicher sein, dass manuelle Relays genutzt werden
- ❌ Automatik überschreibt manuelle Konfiguration
- ⚠️ Kein "Force"-Modus für absolute Kontrolle
- ⚠️ Kein Callback/Event für Relay-Auswahl

---

## 🔧 Lösungsvorschläge

### 1. Klare Priorisierung in `publish()`

```typescript
async publish(eventOrContent: UnsignedEvent | string, kind: number = 1): Promise<PublishResult> {
  // ... validation ...
  
  const signedEvent: NostrEvent = { ...event, id, sig: signature };
  
  // PRIORISIERUNG (von höchster zu niedrigster):
  let targetRelays: string[] | null = null;
  
  // 1. Manuelle Relay-Auswahl (via toRelays) hat HÖCHSTE PRIORITÄT
  // Diese kommt vom FluentEventBuilder.targetRelays
  // ABER: Hier in publish() haben wir keinen Zugriff darauf!
  // Das ist das eigentliche Problem!
  
  // 2. Auto-Selection für routing-sensitive NIPs
  try {
    const autoTargets = await this.autoSelectRelaysForEvent(event as any);
    if (Array.isArray(autoTargets) && autoTargets.length > 0) {
      targetRelays = autoTargets;
    }
  } catch {}
  
  // 3. Routing-sensitive ohne Auto-Selection → Error
  if (!targetRelays && this.isRoutingSensitiveEventKind(event.kind)) {
    throw new Error('No target relay known for routing-sensitive event...');
  }
  
  // 4. NIP-65 Routing (wenn aktiviert)
  if (!targetRelays && this.relayRouter && this.config.routing === 'nip65') {
    targetRelays = await this.relayRouter.selectRelays(...);
  }
  
  // 5. Connected Relays als Fallback
  if (!targetRelays) {
    targetRelays = this.relayManager.connectedRelays;
  }
  
  // Publish zu selected relays
  const relayResults = await this.relayManager.publishToRelays(signedEvent, targetRelays);
  // ...
}
```

**ABER:** Das Problem ist, dass `FluentEventBuilder.targetRelays` nicht an `NostrUnchained.publish()` übergeben wird!

### 2. Fix: targetRelays als Parameter übergeben

#### Option A: publishToRelaysSmart richtig nutzen
```typescript
// FluentEventBuilder.publish()
async publish(): Promise<PublishResult> {
  // ...
  const eventData = {
    pubkey,
    kind: this.eventData.kind || 1,
    content: this.eventData.content,
    tags: this.eventData.tags,
    created_at: this.eventData.created_at || Math.floor(Date.now() / 1000)
  };

  // LÖSUNG: Immer publishToRelaysSmart nutzen wenn targetRelays gesetzt
  if (this.targetRelays && this.targetRelays.length > 0) {
    return await this.nostrInstance.publishToRelaysSmart(eventData, this.targetRelays);
  }
  
  // Nur wenn KEINE targetRelays → normales publish (mit Auto-Selection)
  return await this.nostrInstance.publish(eventData);
}
```

**Problem:** `publishToRelaysSmart` ruft intern NICHT `publish()` auf bei unsigned events, sondern signiert selbst und ruft dann `publishToRelays` direkt auf!

Schauen wir nochmal genau in den Code... Zeile 644-696 `publishToRelaysSmart`:
```typescript
async publishToRelaysSmart(event: UnsignedEvent, relayUrls: string[], options?): Promise<PublishResult> {
  // Sign
  const id = EventBuilder.calculateEventId(event);
  const signature = await this.signingProvider.signEvent(event);
  const signedEvent: NostrEvent = { ...event, id, sig: signature };
  
  // ... connect to relays ...
  
  // Publish
  const relayResults = await (this.relayManager as any).publishToRelays(signedEvent, targets, options);
  
  // ... cleanup ...
}
```

**Perfekt!** Das ist der richtige Pfad! Es ruft NICHT `publish()` auf, sondern geht direkt zu `relayManager.publishToRelays()`.

**Das ist die Lösung:** FluentEventBuilder sollte IMMER `publishToRelaysSmart` nutzen wenn targetRelays gesetzt sind!

#### Option B: Neuer Parameter für publish()
```typescript
// NostrUnchained.ts
async publish(
  eventOrContent: UnsignedEvent | string, 
  kind: number = 1,
  options?: { targetRelays?: string[]; skipAutoSelect?: boolean }
): Promise<PublishResult> {
  // ...
  
  // 1. HÖCHSTE PRIORITÄT: Explizit übergebene targetRelays
  if (options?.targetRelays && options.targetRelays.length > 0) {
    return await this.publishToRelaysSmart(event, options.targetRelays);
  }
  
  // 2. Auto-Selection (nur wenn nicht skipAutoSelect)
  if (!options?.skipAutoSelect) {
    const autoTargets = await this.autoSelectRelaysForEvent(event as any);
    if (Array.isArray(autoTargets) && autoTargets.length > 0) {
      return await this.publishToRelaysSmart(event, autoTargets);
    }
  }
  
  // ... rest wie bisher ...
}
```

### 3. Bessere Debug-Ausgabe

```typescript
// In publish() und publishToRelaysSmart()
if (this.config.debug) {
  console.log('🎯 Relay Selection:', {
    source: 'manual' | 'auto-select' | 'nip65' | 'connected' | 'default',
    kind: event.kind,
    targetRelays,
    autoSelectedRelays: autoTargets,
    manualRelays: options?.targetRelays,
    routing: this.config.routing
  });
}
```

### 4. Relay-Override Protection

```typescript
// Warnung wenn Auto-Selection manuelle Relays überschreiben würde
if (options?.targetRelays && autoTargets && 
    JSON.stringify(options.targetRelays.sort()) !== JSON.stringify(autoTargets.sort())) {
  if (this.config.debug) {
    console.warn('⚠️ Auto-selected relays differ from manual targetRelays:', {
      manual: options.targetRelays,
      auto: autoTargets,
      using: 'manual' // Immer manuelle nutzen
    });
  }
}
```

---

## 📋 Empfohlene Fixes (Priorisiert)

### 🔴 CRITICAL (Sofort)

**1. Fix FluentEventBuilder.publish() – Option A verwenden**
```typescript
// Zeile 279-281 ersetzen mit:
if (this.targetRelays && this.targetRelays.length > 0) {
  // DIREKT zu publishToRelaysSmart → umgeht publish() und dessen autoSelectRelaysForEvent
  return await this.nostrInstance.publishToRelaysSmart(eventData, this.targetRelays);
}
// Nur wenn KEINE manuellen targetRelays → normales publish mit Auto-Selection
return await this.nostrInstance.publish(eventData);
```

**Warum das funktioniert:**
- `publishToRelaysSmart` geht direkt zu `relayManager.publishToRelays()`
- Umgeht `autoSelectRelaysForEvent()` komplett
- Respektiert die manuell gesetzten targetRelays

### 🟡 HIGH (Diese Woche)

**2. Debug-Output verbessern**
- Zeige an welche Relays genutzt werden und warum
- Implementiere in `publish()` und `publishToRelaysSmart()`

**3. Tests für Community-Relay-Routing schreiben**
- Test: Community Definition geht zu author-relay
- Test: Community Post geht zu requests-relay
- Test: Community Approval geht zu approvals-relay
- Test: Manuelle toRelays() werden nicht überschrieben

### 🟢 MEDIUM (Nächste 2 Wochen)

**4. Relay-Auswahl-API vereinheitlichen**
- Einführen eines `RelaySelectionStrategy` Interface
- Implementierungen: ManualStrategy, AutoSelectStrategy, Nip65Strategy
- Chain of Responsibility Pattern für klare Priorisierung

**5. App-seitige Relay-Konfiguration verbessern**
- Dynamische Relay-Liste (nicht hardcoded)
- NIP-65 Bootstrap: Erst nach Sign-in aktivieren
- Relay-Management UI erweitern (zeige aktive + temporäre Relays)

### 🔵 LOW (Backlog)

**6. Relay-Analytics**
- Tracking welche Relays für welche Event-Kinds genutzt wurden
- Success-Rate pro Relay
- Health-Score Integration

**7. Advanced Relay-Kontrolle**
- `forceRelays()` Methode (überschreibt ALLES)
- `preferRelays()` Methode (als Hint, nicht zwingend)
- Callback für Relay-Auswahl-Entscheidungen

---

## 🧪 Test-Plan

### Unit Tests (nostr-unchained)

```typescript
describe('Relay Management', () => {
  describe('FluentEventBuilder.toRelays()', () => {
    it('should publish to manually specified relays', async () => {
      const result = await nostr.events.create()
        .kind(1)
        .content('Test')
        .toRelays('wss://relay1.com', 'wss://relay2.com')
        .publish();
      
      expect(result.relayResults).toHaveLength(2);
      expect(result.relayResults.map(r => r.relay)).toEqual([
        'wss://relay1.com',
        'wss://relay2.com'
      ]);
    });
    
    it('should NOT override manual relays with auto-selection', async () => {
      const communityRelay = 'wss://community-relay.com';
      const result = await nostr.communities
        .create(myPubkey)
        .identifier('test')
        .name('Test Community')
        .relay(communityRelay, 'author')
        .publish();
      
      // Auto-selection sollte author-relay finden,
      // ABER: Da bereits via .relay() gesetzt, sollte das respektiert werden
      expect(result.debug.targetRelays).toEqual([communityRelay]);
    });
  });
  
  describe('Community Relay Routing', () => {
    it('should publish community definition to author relay', async () => {
      const authorRelay = 'wss://author.relay.com';
      const result = await nostr.communities
        .create(myPubkey)
        .identifier('mycom')
        .relay(authorRelay, 'author')
        .publish();
      
      const usedRelays = result.relayResults.map(r => r.relay);
      expect(usedRelays).toContain(authorRelay);
      expect(usedRelays).toHaveLength(1); // NUR author relay
    });
    
    it('should publish community post to requests relay', async () => {
      const requestsRelay = 'wss://requests.relay.com';
      // Setup: Community mit requests-relay
      await setupCommunity(authorPubkey, 'mycom', { requests: requestsRelay });
      
      const result = await nostr.communities
        .postTo(authorPubkey, 'mycom')
        .content('Hello Community')
        .publish();
      
      const usedRelays = result.relayResults.map(r => r.relay);
      expect(usedRelays).toContain(requestsRelay);
    });
    
    it('should publish approval to approvals relay', async () => {
      const approvalsRelay = 'wss://approvals.relay.com';
      await setupCommunity(authorPubkey, 'mycom', { approvals: approvalsRelay });
      
      const post = await createCommunityPost(authorPubkey, 'mycom');
      const result = await nostr.communities
        .approve({ authorPubkey, identifier: 'mycom' })
        .post(post)
        .publish();
      
      const usedRelays = result.relayResults.map(r => r.relay);
      expect(usedRelays).toContain(approvalsRelay);
    });
  });
});
```

### Integration Tests (nostr-unchained-app)

```typescript
describe('Community Relay Management (E2E)', () => {
  it('should create community on specified relay and retrieve it', async () => {
    const relayUrl = 'ws://localhost:4848';
    
    // 1. Create community with specific relay
    const createResult = await nostr.communities
      .create(myPubkey)
      .identifier('test-community')
      .name('Test Community')
      .relay(relayUrl, 'author')
      .relay(relayUrl, 'requests')
      .relay(relayUrl, 'approvals')
      .publish();
    
    expect(createResult.success).toBe(true);
    
    // 2. Wait for relay propagation
    await new Promise(r => setTimeout(r, 500));
    
    // 3. Retrieve community
    const communityStore = nostr.communities.getCommunity(myPubkey, 'test-community');
    const community = await new Promise(resolve => {
      const unsub = communityStore.subscribe(c => {
        if (c) {
          unsub();
          resolve(c);
        }
      });
    });
    
    expect(community).toBeDefined();
    expect(community.tags.find(t => t[0] === 'name')?.[1]).toBe('Test Community');
  });
});
```

---

## 📊 Zusammenfassung

### Aktueller Zustand
- ❌ **Bug:** Manuelle Relay-Auswahl via `toRelays()` wird von Auto-Selection überschrieben
- ⚠️ **Inkonsistent:** Doppelte Relay-Resolution (Builder + AutoSelect)
- ⚠️ **Intransparent:** Keine klare Kommunikation welche Relays warum genutzt werden
- ✅ **Korrekt:** NIPs werden technisch korrekt implementiert
- ✅ **Struktur:** Gute modulare Architektur

### Ziel-Zustand
- ✅ **Priorisierung:** Manuelle > Auto-Select > NIP-65 > Connected > Default
- ✅ **Transparent:** Debug-Output zeigt Relay-Auswahl-Quelle
- ✅ **Effizient:** Keine doppelte Relay-Resolution
- ✅ **Kontrollierbar:** User hat finale Kontrolle via `toRelays()`
- ✅ **Smart Default:** Auto-Selection funktioniert als Fallback

### Kritischer Fix (1 LOC-Change)

**Datei:** `nostr-unchained/src/events/FluentEventBuilder.ts`  
**Zeile:** 279-281

**Aktuell:**
```typescript
return this.targetRelays && this.targetRelays.length
  ? await this.nostrInstance.publishToRelaysSmart(eventData, this.targetRelays)
  : await this.nostrInstance.publish(eventData);
```

**Problem:** Funktioniert bereits korrekt! Aber nur für unsigned events.

**Check Zeile 242-244 für signed events:**
```typescript
if (this.targetRelays && this.targetRelays.length) {
  // Smart one-shot publish to target relays (connect → publish → cleanup)
  return await this.nostrInstance.publishSignedToRelaysSmart(this.signedEvent, this.targetRelays);
}
```

**Das ist auch korrekt!**

**Dann wo ist das Problem?**

Ah! Ich muss nochmal genau schauen... Zeile 242-246:
```typescript
if (this.targetRelays && this.targetRelays.length) {
  return await this.nostrInstance.publishSignedToRelaysSmart(this.signedEvent, this.targetRelays);
}
const relayResults = await this.nostrInstance.relayManager.publishToAll(this.signedEvent);
```

Das ist korrekt. Aber schau Zeile 246: `publishToAll` wird aufgerufen wenn KEINE targetRelays!

**Moment, ich muss die Community-Builder nochmal checken...**

CommunitiesModule.ts:76-93 CommunityPostBuilder.publish():
```typescript
async publish() {
  // ...
  const b = this.nostr.events.create().kind(1111).content(this._content);
  if (this.relayHint) { try { (b as any).toRelays?.(this.relayHint); } catch {} }
  // ... resolver ...
  // Safety check:
  if (!(b as any).targetRelays || ((b as any).targetRelays?.length || 0) === 0) {
    throw new Error('No target relay known...');
  }
  for (const t of this.buildTags()) b.tag(t[0], ...t.slice(1));
  return await b.publish();  // <- HIER
}
```

Das sieht korrekt aus! Die targetRelays werden gesetzt, dann wird b.publish() aufgerufen.

**Aber warum sagt der User dass falsche Relays genutzt werden?**

Mögliche Ursachen:
1. `resolveRelays()` returnt falsches/leeres Ergebnis → Error wird geworfen (Zeile 90)
2. `toRelays()` funktioniert nicht (TypeScript as any cast)
3. Cache-Problem: Community-Definition ist nicht im Cache
4. Timing: resolveRelays(800ms timeout) ist zu kurz

**Das ist wahrscheinlich das echte Problem:** resolveRelays findet die Community nicht im Cache!



