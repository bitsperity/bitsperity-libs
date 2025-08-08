### Research: Moderne Fluent‑API‑Designprinzipien für „göttliche“ DX

Ziel: Fundierte, praxisnahe Leitlinien für eine ultra-leichte, elegante Fluent‑API in `nostr-unchained`, die sich wie eine Domain-Sprache liest, strikt SOLID folgt, tree-shakeable ist und hervorragende DX bietet. Inklusive konkreter Anwendung auf `nostr-unchained` (Golden Paths, DSL-Grammatik, API‑Skizze).

---

## 1) State of the Art – Kerngedanken Fluent APIs
- Fluent Interfaces: Method Chaining als domänenspezifische Sprache (DSL) – geprägt durch Evans/Fowler.
  - Lesbare, deklarative Syntax statt imperative Schritt‑für‑Schritt‑Aufzählungen.
  - Quellen: [Fluent Interface – Wikipedia](https://en.wikipedia.org/wiki/Fluent_interface)
- Trenne Pure Builders von Side‑Effects:
  - Builder sind pure, lazy, immutable; Side‑Effects erfolgen ausschließlich an expliziten Terminatoren (`publish`, `send`, `start`, `execute`).
  - Erhöht Testbarkeit, Vorhersagbarkeit und Lesbarkeit.
- Immutabilität:
  - Jede Konfiguration erzeugt eine neue Builder‑Instanz (Copy‑on‑Write); vermeidet versteckte Zustandsänderungen.
- Konsistenz & Grammatik:
  - Nomen als Einstiegspunkte (`events`, `dm`, `query`, `sub`), präzisierende Verben/Präpositionen (`to`, `with`, `tag`, `since`), klare Terminatoren.
- SOLID als Architekturrahmen:
  - SRP (ein Purpose pro Builder), ISP (kleine, fokussierte Interfaces), DIP (High‑Level hängt an Abstraktionen), OCP (erweiterbar ohne Modifikation), LSP (Sub‑Builder respektieren Basiskontrakte).

Weitere Lesetipps: 
- Überblick/Best Practices: [BrowserStack – Fluent Interface Guide](https://www.browserstack.com/guide/fluent-interface)
- Praxisartikel: [SitePoint – Understanding Fluent APIs](https://www.sitepoint.com/javascript-like-boss-understanding-fluent-apis/)

---

## 2) Asynchronie, Fehler, Abbruch, Performance
- Asynchronie:
  - Terminatoren sind `async`/geben Promises zurück. Streaming via `AsyncIterable` für kontinuierliche Ergebnisse, Adapter nach Bedarf (z. B. `.toStore()`).
- Fehlerbehandlung:
  - Erwartbare Fehler als `Result<T>` zurückgeben (DX freundlich); unerwartete als Exceptions mit klaren Typen (z. B. `RelayTimeoutError`).
- Abbruch & Timeouts:
  - Einheitlich `AbortSignal` und optional `timeoutMs` unterstützen; verkettbar (z. B. `.withAbort(signal)`).
- Performance & Bundling:
  - ESM‑First, `exports`/Subpath‑Exports pro Domäne, `sideEffects: false`, minimale Runtimes, keine Side‑Effects beim Import (nur an Terminatoren).

Nützliche Standards:
- [MDN – AbortController/AbortSignal](https://developer.mozilla.org/docs/Web/API/AbortController)
- [TC39 – Async Iteration](https://github.com/tc39/proposal-async-iteration)

---

## 3) Discoverability & Naming
- Autocomplete‑optimiert: „Was“ zuerst (Kind/Domäne), „mit wem/wo“ danach (Empfänger/Filter), „tun“ am Ende (Terminator).
- Keine boolean traps; stattdessen Options‑Objekte mit benannten Feldern.
- Kurze Alias‑Pfade für 80%‑Use‑Cases (Short Paths), tiefere Pfade für komplexe Fälle (Deep Paths).

Referenzen & Stil‑Vorbilder:
- SDK‑Ergonomie: Prisma (Builder/Selectoren), Stripe (klare Terminatoren), Playwright (chainbare Konfigurationen). 

---

## 4) Risiken & Gegenmaßnahmen
- Lange Ketten/Debuggability: gezielte `.log()`/`.inspect()`‑Hooks; konsistente Result‑Typen mit `details`.
- Interface‑Explosion (gegen ISP): Builder pro Domäne klein halten; Komposition statt monolithischer Interfaces.
- Testbarkeit: Pure Builder via Snapshot/Property Tests; Terminatoren via Integration/Infra.

Einordnung/Vertiefung:
- Diskussionen zu ISP/Fluent: incusdata.com, VisualStudioMagazine, diverse Praxisbeiträge.

---

## 5) Anwendung auf `nostr-unchained` (konkret)

### 5.1 Golden Paths (DX‑Einzeiler)
```ts
await nostr.events.note("gm").publish();

await nostr.events
  .note("shipping v0.1.1")
  .tag("t", "release")
  .refEvent(parentId)
  .publish();

await nostr.dm().to("npub1...").message("ping").send();

const stream = nostr.query()
  .kinds([1, 6])
  .authors([aliceHex])
  .since(hoursAgo(1))
  .stream();

for await (const evt of stream) {
  /* ... */
}
```

### 5.2 DSL‑Grammatik
- Root‑Nomen: `events`, `dm()`, `query()`, `sub()`
- Modifikatoren: `tag(k,v)`, `refEvent(id)`, `refProfile(pubkey)`, `to(pubkeyOrNpub)`, `since(ts)`, `until(ts)`
- Terminatoren: `publish()`, `send()`, `execute()`, `stream()`, `start()`
- Regeln:
  - Nur Terminatoren lösen IO aus.
  - Builder sind immutable; jeder Schritt liefert eine neue Instanz.
  - Result‑Rückgaben sind strukturiert (kein „nacktes any“).

### 5.3 API‑Skizze (vereinheitlicht)
```ts
class NostrUnchained {
  hasExtension(): Promise<boolean>;
  useExtensionSigner(): Promise<Result<{ pubkey: PubkeyHex }>>;
  useLocalKeySigner(): Promise<Result<{ pubkey: PubkeyHex }>>;
  getSigningInfo(): { method: 'extension' | 'temporary' | 'unknown'; pubkey: PubkeyHex | null };

  events: EventsNamespace;
  dm(): DMBuilderRoot;
  query(): FilterBuilder;
  sub(): SubscriptionBuilderRoot;

  publish(content: string, kind?: number, options?: PublishOptions): Promise<PublishResult>;

  getRelayStats(): RelayStats;
  getStats(): RelayStats; // alias
}

interface EventsNamespace {
  note(content: string): NoteBuilder;
  reaction(target: EventId, emoji?: string): ReactionBuilder;
  repost(target: EventId): RepostBuilder;
  follow(pubkey: PubkeyHex): FollowBuilder;
  batch(): BatchBuilder;
}

interface BaseEventBuilder<K extends number> {
  kind(k: K): this;
  tag(key: string, value: string): this;
  refEvent(id: EventId): this;
  refProfile(pubkey: PubkeyHex): this;
  content(data: string | ((prev: string) => string)): this;
  withAbort(signal: AbortSignal): this;
  publish(options?: PublishOptions): Promise<PublishResult>;
}

interface DMBuilderRoot {
  to(pubkeyOrNpub: string): DMToBuilder;
  room(): DMRoomBuilder;
}
interface DMToBuilder { message(text: string): DMSendBuilder; }
interface DMSendBuilder {
  withAbort(signal: AbortSignal): this;
  send(options?: SendOptions): Promise<SendResult>;
}

interface FilterBuilder {
  kinds(k: number[]): this;
  authors(a: PubkeyHex[]): this;
  ids(ids: EventId[]): this;
  tag(tag: string, values: string[]): this;
  since(ts: number): this;
  until(ts: number): this;
  execute(options?: QueryOptions): Promise<NostrEvent[]>;
  first(): Promise<NostrEvent | null>;
  stream(options?: StreamOptions): AsyncIterable<NostrEvent> & { toStore(): Readable<NostrEvent[]> };
}
```

### 5.4 Typisierung & Ergonomie
- Branded Types: `PubkeyHex`, `Npub`, `EventId` zur Compile‑Time‑Sicherheit.
- Generics für Kinds (`EventBuilder<Kind>`), Narrowing entlang der Kette.
- Options‑Objekte statt Positionals/Bools: `publish({ timeoutMs, abort, idempotencyKey })`.
- Ergebnis‑Typen:
```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorLike };
```

### 5.5 Capability‑Driven UX
- Shortcuts: `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getSigningInfo()`.
- NIP‑44‑First: DMs verlangen `nip44Encrypt/Decrypt`; kein Raw‑Key‑Fallback.
- Giftwrap‑Policy: Giftwraps (NIP‑59) werden automatisch entpackt und im Cache gemappt; App decryptet nicht manuell.

---

## 6) Konkrete Ableitungen für den Umsetzungsplan (P0/P1/P2)
- P0 (DX, non‑breaking):
  - Convenience‑APIs ergänzen; Logging an `config.debug`; `publish(content, kind=1)`.
  - Terminatoren definieren; Result‑Typen und `AbortSignal` einheitlich stützen; Golden Paths dokumentieren.
- P1 (Security, breaking):
  - `SigningProviderV1` (nur `nip44Encrypt/Decrypt`, kein Raw‑Key); Cache Decryptor‑only; Conformance‑Tests.
- P2 (Architektur):
  - Social‑Module auf Query/Sub‑only; eigene Caches entfernen; Store‑Mapper; Streams + `.toStore()` als First‑Class.

Diese Punkte sind mit dem DX‑Masterplan (`DX-LIB-APP-IMPROVEMENT-PLAN.md`) abgestimmt und sorgen dafür, dass jede Lib‑Verbesserung die App unmittelbar vereinfacht.

---

## 7) Referenzen (Auswahl)
- Grundlagen:
  - [Fluent Interface – Wikipedia](https://en.wikipedia.org/wiki/Fluent_interface)
  - [MDN – AbortController/AbortSignal](https://developer.mozilla.org/docs/Web/API/AbortController)
  - [TC39 – Async Iteration](https://github.com/tc39/proposal-async-iteration)
- Praxis/Guides:
  - [BrowserStack – Fluent Interface Guide](https://www.browserstack.com/guide/fluent-interface)
  - [SitePoint – Understanding Fluent APIs](https://www.sitepoint.com/javascript-like-boss-understanding-fluent-apis/)

---

## 8) Kurzfazit
- Göttliche DX entsteht durch: pure, immutable Builder; explizite Terminatoren; starke Typen; Result/Abort/Timeout‑Standards; tree‑shakeable Architekturen; klare Grammatik und Golden Paths.
- Die oben skizzierte `nostr-unchained`‑DSL operationalisiert diese Prinzipien unmittelbar und ist kompatibel mit dem bestehenden Phasenplan (P0–P2).
