## NIP-Implementierungsstatus für @nostr-unchained (kept in DE by request)

### Überblick
Dieses Dokument fasst zusammen, welche NIPs in der Bibliothek bereits implementiert sind, welche teilweise abgedeckt sind und welche fehlen. Zudem enthält es eine Priorisierung der fehlenden NIPs für die Roadmap von Nostr Unchained.

Quelle: Code, Tests und Doku im Repo (`src/`, `tests-v2/`, `docs/`). Referenz der NIPs siehe `nostr/nostr_index.md`.

### Bereits implementiert
| NIP | Titel | Bereich | Implementierungs-Hinweise |
|---|---|---|---|
| 01 | Basic Protocol Flow | Core | `EventBuilder`, Filter/REQ/EOSE/CLOSE, ID/Sig; WebSocket-Nachrichten gemäß NIP‑01 |
| 02 | Follow List | Social | Follow-Listen (Kind 3) in `FollowsModule`, Builder/Batch, Parsing |
| 05 | Mapping keys to DNS (NIP‑05) | Identity | Suche + Verifikation (`ProfileDiscoveryBuilder.checkNip05Verification`) |
| 07 | Browser Extension API | Integration | `SigningProvider` nutzt `window.nostr` (NIP‑07) |
| 09 | Event Deletion | Moderation | Cache entfernt referenzierte Events; Unreact via NIP‑09; Tests vorhanden |
| 10 | `e`/`p` Tags (Threading) | Social/Threading | `ThreadModule` (marked + positional Tags), Tests |
| 11 | Relay Information Document | Relay | `RelayManager.getRelayInfo` (NIP‑11 lesen) |
| 17 | Private Direct Messages | DMs | Voller Flow (Kind 14 + Subject) auf Basis NIP‑44/59; Giftwrap‑Handling |
| 18 | Reposts | Social | `ContentModule` (Kind 6) inkl. Struktur nach NIP‑18; Tests |
| 19 | Bech32 Entities | Encoding | `src/utils/encoding-utils.ts`; Tests (npub/…​) |
| 22 | Comments | Social | `CommentsModule` (Kind 1111) mit Wurzeln/Replies; reaktives Lesen |
| 25 | Reactions | Social | `ReactionModule` (Kind 7), Unreact via NIP‑09; Tests |
| 28 | Public Chat | Chat | Channels (40/41) & Messages (42), Hide (43), Mute (44) via `nostr.channels` |
| 32 | Labeling | Moderation/Organisation | `kind:1985` Builder + reaktives Lesen (`nostr.labels`), `L`/`l` + Ziel‑Tags |
| 36 | Content Warning | Moderation | `.contentWarning(reason?)` im Fluent Builder; E2E‑Test |
| 42 | Client Auth | Relay/Auth | Automatisches AUTH‑Handling (Challenge, AUTH‑Event); E2E‑Tests |
| 44 | Versioned Encryption | Crypto | NIP‑44 v2 (ChaCha20‑Poly1305), offizielle Testvektoren in `tests-v2` |
| 46 | Nostr Connect | Signing | `NostrConnectSigner` + in‑process Test‑Harness; E2E‑Tests |
| 59 | Gift Wrap | Privacy | Auto‑Unwrap im Cache, Lazy Subscription, `publishSigned` für bereits signierte Wraps |
| 65 | Relay List Metadata | Relay/Routing | `RelayListModule` (Kind 10002) + `Nip65RelayRouter` (opt‑in Routing) |
| 51 | Lists | Social | `ListModule` (30000–30003) inkl. Bookmark‑Beispiel und reaktivem Lesen |
| 50 | Search Capability | Query/Infra | `search`‑Filter in `query()` (lokal) und `sub()` (Relay‑Suche). Lokale Suche: case‑insensitive Substring auf `content`; serverseitige Suche: über REQ mit `{ search: '…' }` (Ranking durch Relay). Doku/Tests vorhanden |
| 72 | Moderated Communities | Social/Moderation | `kind:34550` Community‑Definition (d/name/description/image, p=moderator), Posts `kind:1111` mit `A/a/P/p/K/k`‑Tags; Approvals `kind:4550`; Revoke via NIP‑09 (`kind:5`). Reader: `getCommunity()`, `posts({ approvedOnly, moderatorsOnly })`, `approvals()`, `moderators()`. E2E‑Tests (inkl. Edge‑Cases) |
| 92 | Media Attachments | Content | `attachMedia()` + `imeta` Parser/Helper; E2E‑Test |

### Teilweise/indirekt abgedeckt
- NIP‑14 (Subject Tag): In DMs (NIP‑17) genutzt für Threading (Subject‑Tags), kein separater Note‑Subject‑Support.
- NIP‑39 (External Identities): Profile-Metadaten (GitHub/Twitter/Telegram) im `ProfileBuilder` unterstützt; keine vollständige End‑to‑End‑Flows.

### Nicht implementiert (oder nur erwähnt/geplant)
- 21, 23, 29, 30, 31, 37, 40, 43, 45, 47, 52, 53, 54, 57, 58, 60, 61, 66, 68, 69, 70, 71, 73, 75, 77, 78, 84, 86, 88, 89, 90, 94, 96, 98
  - Hinweise: Roadmap dynamisch; bereits implementierte NIPs werden laufend entfernt.

### Priorisierte Roadmap der fehlenden NIPs
1. NIP‑21 (URI Scheme) – `nostr:` Deep‑Links/Interop.
2. NIP‑23 (Long‑form Content) – Artikel/Blog‑Usecases.
3. NIP‑66 (Relay Discovery & Liveness) – Autom. Discovery/Health.
4. NIP‑57 (Lightning Zaps) – Payments/Engagement.
5. NIP‑98 (HTTP Auth) – HTTP‑APIs/Dienste.
6. NIP‑70 (Protected Events) – Spezialfälle/Privacy.
7. NIP‑94/96 (File Metadata/HTTP File Storage) – Medien/Dateien (nach NIP‑92).
8. NIP‑78 (Custom App Data) – App‑spezifische Datenhaltung.

### Kurze Begründung der Gewichtung
- Sicherheit/Interop zuerst (NIP‑42, 46), dann Infrastruktur/Delivery (NIP‑65, 66), dann Social‑Core (NIP‑51, 22, 92), gefolgt von Moderation (NIP‑36, 32) und verbreiteten Social‑Features (NIP‑28, 72, 23, 21). Payments/HTTP/Auth und Medien‑Erweiterungen anschließend.

### Verweise (nicht vollständig)
- DMs: `src/dm/**` (NIP‑17/44/59), `tests-v2/04-protocol-compliance/nip44-encryption.test.ts`
- Social: `src/social/**` (NIP‑01/10/18/25), `tests-v2/03-social/**`
- Encoding: `src/utils/encoding-utils.ts` (NIP‑19)
- Relay: `src/relay/RelayManager.ts` (NIP‑11)
- Cache: `src/cache/UniversalEventCache.ts` (Giftwrap Auto‑Unwrap)


