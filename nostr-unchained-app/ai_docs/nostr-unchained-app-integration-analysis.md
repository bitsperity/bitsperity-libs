### Ziel und Kontext

- Zweck: Identifikation ungenutzter API‑Bereiche aus `nostr-unchained` in der App sowie grobe Vorschläge, wie/wo sie integriert werden können (neue Views/Routes/Komponenten).
- Quellen: `nostr-unchained` (README, `NIP_STATUS.md`, `src/**`) und App (`src/**`).

### App-Architektur (Ist-Zustand)

- Services
  - `lib/services/NostrService.ts`: Singleton‑Wrapper um `NostrUnchained`, Connect/Disconnect, Publish, DM‑Hilfsfunktionen, Signer‑Setup (Extension/Temporary), Query‑Durchreichen.
  - `lib/services/AuthService.ts`: Schlanke Auth, Extension‑Erkennung, Session‑Handling (app‑seitig). Keine tiefe Protokoll‑Auth.
  - `lib/services/ServiceContainer.ts`: DI‑Container, registriert `nostr` (Relays: `ws://umbrel.local:4848`) und `auth`.
- Stores
  - `lib/stores/AuthStore.ts`: Reaktiver Auth‑Zustand.
- Routen/Views (Top‑Nav in `NostrApp.svelte`)
  - Explore/Terminal: `components/terminal/NostrTerminal.svelte` → `DevExplorer`, `RelayInspector`.
  - Messages: `components/terminal/DMChat.svelte` (DMs NIP‑17/44/59 inkl. Giftwrap‑Inbox).
  - Feed: `components/feed/FeedView.svelte` (Notes, Mentions, Hashtags, Own; NIP‑01/10/02).
  - Publish: `components/terminal/PublishCard.svelte` (Fluent Event Builder, generisch).
  - Profile: `components/profile/**` (Get/Edit, Follows, Counters, Listen über Sub/Query).
  - Thread: `components/thread/EventThread.svelte` (Replies über `#e`).
- UI‑Bausteine
  - `EventCard.svelte` + Unterkomponenten: Reaktionen (Like/Unlike), Repost, Reply, Delete, Inline‑`#e`‑Referenzpanel.
  - `EncodingsPanel`, `KeyDisplay` (Bech32/Hex utils).

### Genutzte Bereiche der Library (App)

- Core
  - Connect/Disconnect, `publish()`, `events.create()/note()/deletion()/replyTo()`
  - `query()`/`sub()` Filter inkl. `kinds()`, `authors()`, `tags()`, `limit()`, `ids()`
- DMs (NIP‑17/44/59)
  - `getDM().with(pubkey).send()`; `startUniversalGiftWrapSubscription()`; Inbox via `kinds(14)` + `kinds(1059)`
- Profile & Follows (NIP‑02)
  - `profile.get(pubkey)` (reaktiv), `profile.edit().publish()`, `profile.follows.mine()/of()`, `profile.follows.batch().add/remove()`
  - `profile.followerCount(pubkey)`
- Social Core
  - Reactions (NIP‑25): `social.reactions.react()/unreact()` + Summary‑Store
  - Reposts (NIP‑18): `social.content.repost(eventId)`
  - Threads (NIP‑10): Replies über `#e`
- Sonstiges
  - Encoding‑Utils: `hex<->npub` in UI (KeyDisplay, Utils)
  - Relay Inspector nutzt Connection‑Status und Cache‑Querys auf Kind 1

### Un-/teilweise genutzte Library‑Features (Lückenanalyse)

- Events/Publishing
  - Content Warning (NIP‑36): vorhanden in Builder, kein UI‑Toggle in `PublishCard` → ungenutzt.
  - Media Attachments (NIP‑92), File Metadata (NIP‑94), HTTP Storage (NIP‑96): kein Upload/Parse/Anzeige → ungenutzt.
  - Long‑form Content (NIP‑23, kind 30023): kein Artikel‑Workflow → ungenutzt.
- Search & Query
  - NIP‑50 Search: kein UI für lokale/serverseitige Suche → ungenutzt.
- Social/Organisation/Moderation
  - Comments (NIP‑22): eigener Module‑Pfad (addressable/external targets) nicht integriert; Replies als simple `#e`‑Antworten gelöst.
  - Labels (NIP‑32): kein Labeling/Label‑Viewer → ungenutzt.
  - Lists (NIP‑51, 30000–30003): keine generischen Listen/Bookmarks/Relay‑Collections → ungenutzt.
  - Communities (NIP‑72): kein Community‑Modul → ungenutzt.
  - Public Chat (NIP‑28): Channels/Messages UI fehlt → ungenutzt.
- Relay/Infra
  - Relay Lists (NIP‑65): keine Pflege eigener/anderer Relay‑Listen; `Nip65RelayRouter` nicht aktiviert → ungenutzt.
  - Relay Discovery/Health (NIP‑66): kein Health/Auto‑Discovery UI → ungenutzt.
  - HTTP Auth (NIP‑98): kein Flow/UI → ungenutzt.
- Identity/Signing
  - Nostr Connect (NIP‑46): `NostrConnectSigner` nicht integriert → ungenutzt.
  - NIP‑05 Verifikation: App‑Utility vorhanden, aber UI‑Integration offen → teilweise.
- Payments
  - Lightning Zaps (NIP‑57): kein Zap‑Flow (Request/Zap) → ungenutzt.
- Interop
  - NIP‑21 URI Scheme: kein `nostr:` Handling/Navigator → ungenutzt.

### Integrationsvorschläge (oberflächlich, pro Bereich)

- Events/Publishing
  - Content Warning (NIP‑36): Toggle/Dropdown in `PublishCard` („Inhalt sensibel: Grund…“) → `.contentWarning(reason?)` am Builder.
  - Media (NIP‑92/94/96):
    - Neue Route `/media/upload` mit `Nip96Client` (Discovery, Upload, optional NIP‑98); Rückgabe via `nip94_event` anzeigen.
    - `PublishCard`: „Datei anhängen“ → `attachMedia(url, imeta)`; Anzeige von `imeta` in `EventCard`.
  - Long‑form (NIP‑23):
    - Neue Route `/articles` mit „Neu“/„Meine Artikel“/„Alle“; Editor (Titel, Inhalt, Tags) → `content.article().publish()`; Anzeige via `getArticle()/articles()`.

- Search & Query
  - Neue Route `/search` mit zwei Modi:
    - Lokal: `query().search('text').execute()`; live auf Cache.
    - Server: `sub().search('text').limit(n).execute()`; Ergebnisliste navigierbar.

- Social/Organisation/Moderation
  - Comments (NIP‑22):
    - `EventCardActions`: „Kommentieren“ → `comments.create(target).content('...').publish()`; neue Ansicht `/comments/:id`.
    - Reader: `nostr.comments.forEvent(eventId)` im Thread integrieren.
  - Labels (NIP‑32):
    - Neue Route `/labels` (Namespace‑Filter, Zieltyp Event/Author/Address/Relay/Topic).
    - `EventCardActions`: „Label hinzufügen“ (Namespace/Label/Reason) → `labels.edit().namespace(...).label(...).targetEvent(...).publish()`; Viewer unter Karte.
  - Lists (NIP‑51):
    - Neue Route `/lists` (Bookmarks, Generic, Relay Collections). In `EventCardActions`: „Bookmark“ → `lists.edit(30003,'bookmarks').addEvent(eventId).publish()`.
  - Communities (NIP‑72):
    - Neue Route `/communities` (Browse/Meine/Moderation); Community‑Detail mit Posts (`kind:1111`), Approvals (`kind:4550`), Moderators.
  - Public Chat (NIP‑28):
    - Neue Route `/chat/public`: Channels create/list, `messagesFor(channel)`; UI ähnlich DM aber offen.

- Relay/Infra
  - Relay Lists (NIP‑65):
    - Neue Route `/relays` zur Pflege eigener Liste (`read/write/both`) via `relayList.edit().publish()`.
    - App‑Einstellung „Routing: off/nip65“ → `new NostrUnchained({ routing: 'nip65' })` bzw. via Service konfigurierbar.
  - Relay Discovery/Health (NIP‑66):
    - Erweiterung `RelayInspector`: periodische Health‑Checks, Liveness‑Score, Auto‑Failover‑Vorschläge.
  - HTTP Auth (NIP‑98):
    - Dev‑Tool‑Seite `/dev/http-auth` (signiere/prüfe Header) → `signHttpAuth()/buildHttpAuthHeader()`.

- Identity/Signing
  - Nostr Connect (NIP‑46):
    - Neue Route `/settings/signing`: Auswahl Extension/Local/Connect. Pairing‑Flow mit `NostrConnectSigner` + QR.
  - NIP‑05 Verifikation:
    - Profil‑UI: Badge + „Verifizieren“ Button → `ProfileDiscoveryBuilder.checkNip05Verification` oder App‑`verifyNip05()` Utility.

- Payments
  - Zaps (NIP‑57):
    - `EventCardActions`/`ProfileActions`: „Zap“ → `social.payments.zap(target, amount, lnurl, comment)`; Route `/zaps` für Verlauf.

- Interop
  - NIP‑21 URIs: Globaler Handler (Route `/open?nostr=...`) → `decode()/parseNostrUri()/toNostrUri()`; Deep‑Link in App‑Views.

### Empfohlene neue Routen/Views (SvelteKit)

- `/search` – Volltext (lokal/Server), Filter; nutzt NIP‑50.
- `/chat/public` – Channels/Messages; NIP‑28.
- `/communities` und `/communities/[a]` – NIP‑72.
- `/lists` – Generische Listen/Bookmarks; NIP‑51.
- `/labels` – Label‑Editor/Viewer; NIP‑32.
- `/articles` und `/articles/new` – Long‑form; NIP‑23.
- `/media/upload` – Upload + `nip94_event`; NIP‑92/94/96.
- `/relays` – Relay‑Listen, Routing‑Optionen; NIP‑65 (+ NIP‑66 Health in Inspector).
- `/settings/signing` – Extension/Local/Nostr Connect; NIP‑46.
- `/dev/http-auth` – NIP‑98 Playground.
- (Optional) `/zap` – Zap‑Flow/Verlauf; NIP‑57.

### UI‑Erweiterungen in bestehenden Komponenten

- `EventCard.svelte`
  - Buttons: Bookmark (NIP‑51), Label (NIP‑32), Zap (NIP‑57), „Kommentieren“ (NIP‑22), „Warnung“ setzen (NIP‑36).
  - Anzeige: Attachments/`imeta` (NIP‑92/94), Labels.
- `PublishCard.svelte`
  - Content‑Warning Toggle, Media‑Attachment UI, Long‑form Modus (Kind 30023), Label‑Assistent.
- `ProfileView/Actions`
  - NIP‑05 Badge/Verifikation, Zap‑Button, Listen‑Shortcuts (Bookmarks anzeigen).
- `NostrTerminal/RelayInspector`
  - Health‑Check/Discovery (NIP‑66), Routen‑Debug (NIP‑65), HTTP‑Auth Playground (Link).

### Technische Hinweise zur Integration

- Routing (NIP‑65): Konfiguration über `NostrService` zentralisieren (Option `routing: 'nip65'`), UI‑Toggle in `/relays`.
- Medien (NIP‑96): `Nip96Client` benötigt Discovery via `/.well-known/nostr/nip96.json`; optional NIP‑98 Auth.
- Comments vs Replies: NIP‑22 API unterstützt Kommentare auf Events/Addressables/Externals – UI separat von reinen `#e`‑Replies halten.
- Zaps: LNURL‑Flow (Wallet/Callback) – Fehlerfälle/Bestätigung UX einplanen.
- Nostr Connect: Pairing‑Lifecycle, Session‑Persistenz, Reconnect‑Strategien.

### Priorisierte Umsetzung (App‑Sicht)

1) Infra/UX Hebel
   - `/relays` (NIP‑65 Routing) + Relay‑Health (NIP‑66) im Inspector.
2) Social Core Komplettierung
   - Comments (NIP‑22), Lists/Bookmarks (NIP‑51), Search (NIP‑50).
3) Medien & Content
   - Media/Upload (NIP‑92/94/96), Long‑form (NIP‑23), Content Warning (NIP‑36).
4) Moderation/Organisation
   - Labels (NIP‑32), Communities (NIP‑72), Public Chat (NIP‑28).
5) Signing/Payments
   - Nostr Connect (NIP‑46), Zaps (NIP‑57), HTTP Auth (NIP‑98 Playground).

### Quick‑Mapping: Library → App‑Einstiegspunkte

- DMs: `nostr.getDM().with(pubkey)` → vorhanden (Messages‑View).
- Profile: `nostr.profile.get/edit/follows/...` → vorhanden (Profile‑View).
- Reactions/Reposts: `nostr.social.reactions/content` → vorhanden (EventCard).
- Threads: `sub().tags('e', ...)` → vorhanden (Thread‑View).
- Feeds: `sub().kinds(1)` + Filter → vorhanden (Feed‑View).
- Search: `query()/sub().search(text)` → neue `/search`.
- Comments: `nostr.comments.*` → neue `/comments/[id]`/Actions.
- Labels: `nostr.labels.*` → neue `/labels` + Actions.
- Lists: `nostr.lists.*` → neue `/lists` + EventCard Bookmark.
- Communities: `nostr.communities.*` → neue `/communities`.
- Public Chat: `nostr.channels.*` → neue `/chat/public`.
- Media: `attachMedia()`, `Nip96Client`, `Nip94` → `/media/upload` + Anzeige.
- Relay Lists/Routing: `nostr.relayList.*`, `routing:'nip65'` → `/relays`.
- Nostr Connect: `NostrConnectSigner` → `/settings/signing`.
- HTTP Auth: `signHttpAuth()/buildHttpAuthHeader()` → `/dev/http-auth`.
- NIP‑21: `decode()/parseNostrUri()` → globaler Handler `/open`.

---

Diese Analyse dient als Arbeitsgrundlage für die schrittweise Erweiterung der App. Jede vorgeschlagene Route lässt sich unabhängig umsetzen und inkrementell ins existierende `NostrApp`‑Navigationsschema integrieren.


