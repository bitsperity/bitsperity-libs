## NIP-Implementierungsstatus für @nostr-unchained

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
| 25 | Reactions | Social | `ReactionModule` (Kind 7), Unreact via NIP‑09; Tests |
| 44 | Versioned Encryption | Crypto | NIP‑44 v2 (ChaCha20‑Poly1305), offizielle Testvektoren in `tests-v2` |
| 59 | Gift Wrap | Privacy | Auto‑Unwrap im Cache, Lazy Subscription, `publishSigned` für bereits signierte Wraps |
| 32 | Labeling | Moderation/Organisation | `kind:1985` Builder + reaktives Lesen (`nostr.labels`), `L`/`l` + Ziel‑Tags |

### Teilweise/indirekt abgedeckt
- NIP‑14 (Subject Tag): In DMs (NIP‑17) genutzt für Threading (Subject‑Tags), kein separater Note‑Subject‑Support.
- NIP‑39 (External Identities): Profile-Metadaten (GitHub/Twitter/Telegram) im `ProfileBuilder` unterstützt; keine vollständige End‑to‑End‑Flows.

### Nicht implementiert (oder nur erwähnt/geplant)
- 21, 22, 23, 28, 29, 30, 31, 32, 36, 37, 40, 42, 43, 45, 46, 47, 50, 51, 52, 53, 54, 57, 58, 60, 61, 65, 66, 68, 69, 70, 71, 72, 73, 75, 77, 78, 84, 86, 88, 89, 90, 92, 94, 96, 98
  - Hinweise: NIP‑51/28/72 sind im Social‑Module als TODO notiert; NIP‑65/78 in Doku erwähnt; NIP‑42 als fehlend in Test-Fixes markiert.

### Priorisierte Roadmap der fehlenden NIPs
1. NIP‑42 (Client Auth) – Authentifizierung gegenüber Relays; in Tests als fehlend notiert. Kritisch für reale Schreib-/Admin‑Relays.
2. NIP‑65 (Relay List Metadata) – Inbox/Outbox/General Relay‑Listen; wichtig für zuverlässige DM‑Zustellung und Discovery.
3. NIP‑51 (Lists) – Grundlage für Mutes/Bookmarks/Kuratoren‑Listen; Social‑Core (ListModule TODO).
4. NIP‑22 (Comments) – Ergänzt Threads (NIP‑10); weit verbreitet in Clients.
5. NIP‑92 (Media Attachments) – Häufige Social‑Usecases; saubere Media‑Metadaten in Feeds.
6. NIP‑46 (Nostr Connect) – Passt zur „no raw keys“-Policy; Remote‑Signing erhöht Sicherheit deutlich.
7. NIP‑50 (Search Capability) – Serverseitige Suche; verbessert Discovery über lokale/Feed‑Suche hinaus.
8. NIP‑36 (Content Warning) – UX/Mediation; wichtig für Social‑Feeds.
9. NIP‑32 (Labeling) – Moderation/Organisation; Grundlage für Trust/Filtering. (JETZT IMPLEMENTIERT)
10. NIP‑28 (Public Chat) – Realtime‑Chats; Social‑Feature mit breiter Nutzung.
11. NIP‑72 (Moderated Communities) – Größerer Funktionsblock; wichtig für Gruppen/Moderation.
12. NIP‑21 (URI Scheme) – Interop/Deep‑Links (`nostr:`) für App‑Integration.
13. NIP‑23 (Long‑form Content) – Artikel/Blog‑Usecases.
14. NIP‑66 (Relay Discovery & Liveness) – Autom. Health/Discovery über bestehende Health‑Checks hinaus.
15. NIP‑57 (Lightning Zaps) – Payments/Engagement; produktabhängig, aber verbreitet.
16. NIP‑98 (HTTP Auth) – Für HTTP‑APIs/Dienste; weniger zentral für WS‑Flow.
17. NIP‑70 (Protected Events) – Spezialfälle/Privacy.
18. NIP‑94/96 (File Metadata/HTTP File Storage) – Medien/Dateien; nach NIP‑92 sinnvoll.
19. NIP‑78 (Custom App Data) – App‑spezifische Datenhaltung.
20. Rest (29, 30, 31, 37, 40, 43, 45, 47, 52, 53, 54, 58, 60, 61, 68, 69, 71, 73, 75, 77, 84, 86, 88, 89, 90) – abhängig von Produktvision.

### Kurze Begründung der Gewichtung
- Sicherheit/Interop zuerst (NIP‑42, 46), dann Infrastruktur/Delivery (NIP‑65, 66), dann Social‑Core (NIP‑51, 22, 92), gefolgt von Moderation (NIP‑36, 32) und verbreiteten Social‑Features (NIP‑28, 72, 23, 21). Payments/HTTP/Auth und Medien‑Erweiterungen anschließend.

### Verweise (nicht vollständig)
- DMs: `src/dm/**` (NIP‑17/44/59), `tests-v2/04-protocol-compliance/nip44-encryption.test.ts`
- Social: `src/social/**` (NIP‑01/10/18/25), `tests-v2/03-social/**`
- Encoding: `src/utils/encoding-utils.ts` (NIP‑19)
- Relay: `src/relay/RelayManager.ts` (NIP‑11)
- Cache: `src/cache/UniversalEventCache.ts` (Giftwrap Auto‑Unwrap)


