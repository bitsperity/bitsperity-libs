## APP API Usage Map and Integration Plan (nostr-unchained-app)

Ziel: Vollständige Abbildung der `nostr-unchained` API in der Demo-App, klare Sicht auf bereits genutzte Teile, Lücken mit Integrationskonzepten schließen, und vollständiger UI-Neuentwurf der Event Card.

### Scope
- Codebasis: `nostr-unchained-app`
- Bibliothek: `nostr-unchained` (v0.2.0)
- Fokus: API-Abdeckung, Integrationskonzepte, UI-Neudesign der Event Card, Phasen-Plan, Tests

---

## 1) Bereits verwendete API (Wo und wie)

- **Verbindung & Status**
  - Methoden: `connect()`, `disconnect()`, `connectedRelays`, `getStats()`
  - Verwendung:
    - `src/lib/services/NostrService.ts`: Verbindungssteuerung und Status-Helpers
    - `src/lib/components/terminal/NostrTerminal.svelte`: Statusanzeige basierend auf `connectedRelays`
    - `src/lib/components/terminal/RelayInspector.svelte`: Status-/Statistikanzeige

- **Auth/Signer**
  - Methoden: `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getPublicKey()`, `getSigningInfo()`
  - Verwendung:
    - `src/lib/services/NostrService.ts`: Signer-Wechsel, Public Key Anzeige
    - `src/lib/components/NostrApp.svelte`: Public Key fetch on init

- **Query & Subscription (Core)**
  - Methoden: `sub()...execute()`, `query()...execute()`, `getSubscriptionManager()`
  - Verwendung:
    - `src/lib/components/terminal/DevExplorer.svelte`: Live-Subs und Cache-Queries inkl. Limit-Steuerung, Cache-Stats
    - `src/lib/components/terminal/RelayInspector.svelte`: Beispielabfragen und Live-Monitoring
    - `src/lib/components/terminal/DMChat.svelte`: gezielte Abfragen (Kinds 1059, 14)
    - `src/lib/utils/ProfileSubscriptionManager.ts`: Aggregierte Kind-0 Profile Live+Cache

- **Events/Publish**
  - Methoden: `publish(content: string)`, `events.create()` (Einstieg)
  - Verwendung:
    - `src/lib/components/terminal/PublishCard.svelte`: Fluent Compose Einstieg via `events.create()`
    - `src/lib/services/NostrService.ts`: Schnell-Publish per `publish(content)`

- **DM / NIP-59 / NIP-44**
  - Methoden: `getDM()?.with(pubkey).send(content)`, `startUniversalGiftWrapSubscription()`
  - Verwendung:
    - `src/lib/components/terminal/DMChat.svelte`: DM Senden, Lazy-Inbox
    - `src/lib/services/NostrService.ts`: DM-Service-Wrapper

- **Profile / Social (Teile)**
  - Methoden: `profile.edit()...publish()`, `profile.follows.mine()/of()`, `profile.followerCount()`
  - Verwendung:
    - `src/lib/components/profile/ProfileManager.svelte`, `ProfileView.svelte`: Profilbearbeitung
    - `src/lib/utils/followManager.ts`: Follows/FollowerCount Stores
    - `src/lib/utils/ProfileSubscriptionManager.ts`: Profile Load/Live

- **Utilities (NIP-19 etc.)**
  - Methoden: `hexToNpub`, `hexToNote`, Validierungs-Utils (teilweise via Wrapper `normalizeRecipientToHex`)
  - Verwendung:
    - `src/lib/components/ui/KeyDisplay.svelte`, `src/lib/utils/keyDisplay.ts`
    - `src/lib/utils/nostr.ts`: Normalisierung npub/hex

---

## 2) Untergenutzte oder fehlende API-Integrationen (mit Konzept)

- **Reactions (NIP-25)**
  - Status: Keine UI für Like/Unlike in Eventlisten.
  - Konzept:
    - `EventCard.svelte`: Buttons „❤️ Like / 💔 Unlike“.
    - Daten: Live-Zähler über `query().kinds([7]).tags('e',[event.id])`.
    - Fehler-/Result-Handling: Publish-Result pro Relay anzeigen.

- **Reposts (NIP-18)**
  - Status: Keine Repost-Funktion in UI.
  - Konzept:
    - `EventCard.svelte`: Button „🔄 Repost“ (und ggf. Undo).
    - Anzeige: Repost-Badges; Filter im Explorer „Show Reposts“.

- **Replies / Threads (NIP-10)**
  - Status: Kein Thread-Baum / keine Detailansicht.
  - Konzept:
    - `EventDetail.svelte`: Thread-Ansicht (Root + Replies), Reply Composer via Fluent API.
    - Daten: `tags('e',[rootId])`, optional ThreadModule falls exposed.

- **Delete (NIP-09)**
  - Status: Keine Lösch-UI.
  - Konzept:
    - `EventCard.svelte`: „🗑️ Delete (own)“ mit Bestätigung.
    - Daten: nach Delete Cache-Refresh/Wait, UI aktualisiert Counts.

- **Feeds / Timelines**
  - Status: Kein dedizierter Feed-Tab (nur Explorer).
  - Konzept:
    - Neuer Tab „Feed“: Home (following), Mentions, Hashtags, Own.
    - Technik: `sub/query` Guards, Paginierung via `until`/`since`.

- **Lists / Communities**
  - Status: In UI nicht abgebildet.
  - Konzept:
    - Seite „Lists“ (Mute/Bookmarks/Custom). Communities als Filter-Presets, Subs pro Community.

- **Events Fluent API (volle Breite)**
  - Status: Nur `create()` Einstieg sichtbar.
  - Konzept:
    - `PublishCard` erweitern: Note/Reply/Repost/Delete/Custom JSON.
    - Publish-Result Table pro Relay, Retry/Abort (AbortSignal) Optionen.

- **Profile erweitert**
  - Status: Keine Tabs für Followers/Following/Notes/Replies/Reposts/Likes, NIP-05 Verify fehlt.
  - Konzept:
    - Tabs im Profil, Queries je Tab, Live-Updates, Verify-UI.

- **Encodings Playground**
  - Status: Utilities teils genutzt.
  - Konzept:
    - „Encodings“-Panel: npub↔hex, note↔id, Fehlerhinweise, Copy-Buttons.

---

## 3) Event Card – vollständige Neugestaltung

Ziele:
- Vollständige, präzise Repräsentation eines Nostr Events (State, Beziehungen, Aktionen, Delivery/Result je Relay).
- Beste DX: klare Struktur, konsistente Interaktionen, schnelle Einblicke in Tags/Bezüge.

Inhalte (sichtbar):
- Header: Kind-Icon, `note1...` (click-to-copy), `id` (truncate), `created_at` (relativ + Tooltip ISO), Author Avatar/Name/npub (clickbar), NIP-05 Status.
- Content: gerenderter Text (Links, Hashtags als Filter-Links), optional Media (später), JSON-Toggle (kompakt).
- Tags: typisiert gruppiert (e, p, a, t, g, pow, ...), klickbar (setzt Explorer-Filter).
- Beziehungen: Repost-of, Reply-to, Root/Ancestor Links (öffnet Thread).
- Aktionen: ❤️ React / 💔 Unlike, 🔄 Repost (Undo), 💬 Reply, 🗑️ Delete (own), 🔗 Share (npub/note/copy), ↗ Open in Relay.
- Delivery/Result: Pro Relay Status (OK/Fail/Pending), EOSE, Latenz; Retry-Option.
- Counts: Reactions, Reposts, Replies (live); Fallback Lazy-Query.

Technik & Architektur:
- Svelte-Komponenten: `EventCard.svelte` (Container) + Unterkomponenten (Header, Content, Tags, Actions, Meta/Results, JSONView).
- Daten: Haupt-Store liefert Event; Neben-Stores für Counts (reaction/repost/reply) via `query()` und optional `sub()`.
- Performance: Virtualized Lists, Equality Guards, minimale reaktive Abhängigkeiten.
- A11y: Fokus-/Keyboard, ARIA Labels, Kontrast.

Akzeptanz-Checkliste:
- [ ] Zeigt alle relevanten Felder (Kind, Id, Author, Zeit, Content, Tags) korrekt an
- [ ] Aktionen funktionieren inkl. Result-Feedback je Relay
- [ ] Counters live-aktualisiert, ohne spürbare UI-Lags
- [ ] Thread-/Repost-/Reply-Bezüge korrekt auflösbar und navigierbar
- [ ] JSON-Ansicht komprimiert, kopierbar
- [ ] Keine Svelte-Update-Loops; konsistente Unsubscribes

---

## 4) Phasen-Plan (App-Integration)

- P0 – Event Card Redesign (Basis)
  - [ ] Neue `EventCard.svelte` + Unterkomponenten
  - [ ] Reactions/Repost/Delete/Reply Buttons verdrahten (happy path)
  - [ ] Result-Table (pro Relay) + JSON Toggle

- P1 – Social & Feeds
  - [ ] Feed-Tab (Home/Own/Mentions/Hashtags)
  - [ ] Thread-Detailansicht, Reply Composer
  - [ ] Repost/Like Counters stabil/live

- P2 – Lists/Communities & Profile-Tabs
  - [ ] Lists Seite (Mute/Bookmark/Custom)
  - [ ] Profil-Tabs: Followers/Following/Notes/Replies/Reposts/Likes
  - [ ] NIP-05 Verify UI

- P3 – Fluent Compose Pro & Playground
  - [ ] PublishCard Pro: alle Compose-Modi inkl. Abort/Retry
  - [ ] Encodings Playground

---

## 5) Tests (Erweiterung `tests-v2` + App-E2E)

- Library (bereits gestartet): Reactions, Reposts, Delete, Threads, Profile Updates, Query Guards.
- App (neu):
  - [ ] EventCard Actions happy/edge cases mit sichtbarem Result-Feedback
  - [ ] Feed-Rendering + Paging (until/since)
  - [ ] Thread-Auflösung & Reply Publish
  - [ ] Profil-Tabs Laden + Live-Updates

---

## 6) Appendix – Fundstellen (Auswahl)

- Verbindung/Status: `src/lib/services/NostrService.ts`, `src/lib/components/terminal/NostrTerminal.svelte`, `src/lib/components/terminal/RelayInspector.svelte`
- Query/Sub: `src/lib/components/terminal/DevExplorer.svelte`, `src/lib/utils/ProfileSubscriptionManager.ts`, `src/lib/components/terminal/DMChat.svelte`
- Publish/Events: `src/lib/components/terminal/PublishCard.svelte`, `src/lib/services/NostrService.ts`
- DM: `src/lib/components/terminal/DMChat.svelte`, `src/lib/services/NostrService.ts`
- Profile/Social: `src/lib/components/profile/ProfileManager.svelte`, `ProfileView.svelte`, `src/lib/utils/followManager.ts`
- Utilities: `src/lib/components/ui/KeyDisplay.svelte`, `src/lib/utils/keyDisplay.ts`, `src/lib/utils/nostr.ts`


