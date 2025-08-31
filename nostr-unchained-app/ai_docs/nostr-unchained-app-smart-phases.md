### SMART‑Phasenplan zur Feature‑Integration (nostr‑unchained‑app)

Ziel: Abgeschlossene, manuell testbare, hoch‑signale Phasen zur Integration der in `nostr-unchained` verfügbaren Features. Minimale Platzhalter, keine Mocks, inkrementell und stabil.

Prinzipien:
- Specific: Jede Phase hat klaren Umfang und konkrete Deliverables.
- Measurable: Präzise Abnahmekriterien und manuelle Tests.
- Achievable: Kleine, umsetzbare Schritte ohne unnötige Parallelität.
- Relevant: Direkte Nutzung existierender Library‑APIs (0% Mocking, 100% Signal).
- Time‑bound: Realistische Zeitfenster pro Phase (anpassbar).

Hinweis: Bezug auf Analyse in `ai_docs/nostr-unchained-app-integration-analysis.md`.

---

### Aktueller Stand (Live‑Projekt)

- Abgeschlossen (DONE):
  - Phase 1 – Relays/Routing/Health‑Basics. Header/Relays‑View mit Single‑Source‑of‑Truth für Connected‑Count; Health‑Probes basic. (Commit: f1f95a4)
  - Phase 3 – Listen/Bookmarks (NIP‑51). `/lists` + Bookmark‑Aktionen inkl. 30003‑Sync. (Commit: f1f95a4)
  - Phase 4 – Comments (NIP‑22). „Kommentieren“ in Karten; Thread rendert Replies (kind 1) + Comments (kind 1111) zusammengeführt. (Commit: f1f95a4)
  - Phase 5 – Content Warning (NIP‑36). Toggle in `PublishCard`; Banner in `EventCard`. (Commit: f1f95a4)

- Depriorisiert (ON HOLD):
  - Phase 2 – Suche (NIP‑50) vorerst zurückgestellt.

- Nächstes Ziel (NEXT):
  - Phase 8 – Labels (NIP‑32): Route `/labels` + Label‑Aktion in Karten. ETA: 0.5–1 Tag.

---

### Phase 1: Relays, Routing und Health‑Basics (NIP‑65, Grundstein NIP‑66)

- Ziel (S):
  - Neue Route `routes/relays` zur Pflege der eigenen Relay‑Liste (read/write/both) und Umschalter „Routing: off/nip65“.
  - `NostrService` akzeptiert `routing: 'none' | 'nip65'` und setzt weiter an `NostrUnchained` durch.
  - `RelayInspector` zeigt zusätzlich: Anzahl verbundener/fehlgeschlagener Relays und simple Health‑Probes (Ping/Response‑Zeit) als Vorstufe NIP‑66.
- Abnahmekriterien (M):
  - In `Relays` kann ich Relays hinzufügen/entfernen und Liste veröffentlichen (`relayList.edit().publish()`).
  - Routing‑Toggle beeinflusst Publish‑Debug (`result.debug?.targetRelays` zeigt NIP‑65 Pfade bei p‑Tags/DMs).
  - Health‑Anzeige zeigt pro Relay einfachen Status (OK/Fail, Latenz).
- Deliverables:
  - Neue View: `/relays` (Formulare + Tabelle der Relays).
  - `NostrService` Konfig‑Pfad für Routing, persistiert im Local Storage.
  - Erweiterte `RelayInspector`‑Infos.
- Manuelle Tests:
  - Routing off: `PublishCard` sendet nur an Default‑Relays.
  - Routing on: Note mit p‑Tag → Debug listet Empfänger‑Read‑Relays zusätzlich.
  - Relay hinzufügen → Reconnect → in Inspector als verbunden sichtbar; Fake‑Relay → als „disconnected“/Fehler.
- Zeit (T): 0.5–1.5 Tage.
- Keine Mocks: alle Aktionen nutzen echte Relays (lokal oder öffentlich).
- Risiken/Abhängigkeiten: vorhandene Umbrel‑Relay; Fallback auf öffentliche Relays möglich.
- Status: DONE (f1f95a4)

---

### Phase 2: Suche (NIP‑50) – Lokal & Serverseitig

- Ziel (S):
  - Neue Route `/search` mit zwei Modi: „Lokal (Cache)“ via `query().search(text)` und „Server“ via `sub().search(text)`.
  - Filterchips (Kinds, Authors optional), Ergebnisliste klickbar in Thread/Profile.
- Abnahmekriterien (M):
  - Lokale Suche liefert Ergebnisse ausschließlich aus Cache; Server‑Suche baut Live‑Sub auf.
  - Leere Suche hat definierte UI; keine Crashes bei 0 Treffern.
- Deliverables:
  - View `/search` inkl. Input, Tabs (Lokal/Server), Ergebnisliste.
- Manuelle Tests:
  - Eigene Note posten → nach 5–10s in lokaler Suche auffindbar.
  - Serverseitig gleiche Suche liefert (mindestens) ähnliche Resultate je Relay.
- Zeit (T): 0.5–1 Tag.
- Keine Mocks: echte `query/sub` gegen aktuelle Relays.
- Status: ON HOLD

---

### Phase 3: Listen/Bookmarks (NIP‑51)

- Ziel (S):
  - Neue Route `/lists` zur Anzeige/Bearbeitung gängiger Listen (30003 „bookmarks“, optional weitere).
  - `EventCard` erhält „Bookmark“‑Aktion → `lists.edit(30003,'bookmarks').addEvent(eventId).publish()`.
- Abnahmekriterien (M):
  - Bookmark hinzufügen/entfernen wirkt sofort auf Cache; `/lists` zeigt reaktive Inhalte.
  - Keine Duplikate; „Load more“ funktioniert.
- Deliverables:
  - View `/lists` mit Tab „Bookmarks“ + Items.
  - Action in `EventCardActions` (Bookmark/Unbookmark).
- Manuelle Tests:
  - Event bookmarken → erscheint unter `/lists`.
  - Unbookmark → verschwindet reaktiv.
- Zeit (T): 0.5–1 Tag.
- Keine Mocks.
- Status: DONE (f1f95a4)

---

### Phase 4: Comments (NIP‑22)

- Ziel (S):
  - „Kommentieren“‑Aktion in `EventCardActions` (separat von Reply/#e).
  - Reader: Kommentare zu Event in Thread‑Ansicht oder eigene Route `/comments/[id]`.
- Abnahmekriterien (M):
  - Publish eines Comments gegen Ziel‑Event möglich; Anzeige reaktiv im Thread/Comments‑View.
  - Reply bleibt unverändert; Comment wird technisch über NIP‑22 gebaut.
- Deliverables:
  - Action + minimaler Reader (Liste + Count).
- Manuelle Tests:
  - Comment auf beliebiges Event publizieren → sofort sichtbar über Reader.
- Zeit (T): 0.5–1 Tag.
- Keine Mocks; echter Publish.
- Status: DONE (f1f95a4)

---

### Phase 5: Content Warning (NIP‑36)

- Ziel (S):
  - Toggle/Dropdown in `PublishCard` („Inhalt sensibel“ + optionaler Grund) → `.contentWarning(reason?)`.
  - Anzeige: `EventCard` blendet Warnbanner ein und „Show content“.
- Abnahmekriterien (M):
  - Events mit CW tragen korrektes Tag; UI verhält sich wie erwartet.
- Deliverables: UI‑Toggle + Darstellung in Karten.
- Manuelle Tests: Publish mit/ohne CW; Rendering prüfen.
- Zeit (T): 0.25–0.5 Tag.
- Keine Mocks.
- Status: DONE (integriert)

---

### Phase 6: Media Upload & Attachments (NIP‑92/94/96)

- Ziel (S):
  - Neue Route `/media/upload` mit `Nip96Client` (Discovery, Upload, optional NIP‑98 Auth). Rückgabe (`nip94_event`) anzeigen und als Attachment nutzbar machen.
  - `PublishCard`: Button „Datei anhängen“ → `attachMedia(url, imeta)`; `EventCard` rendert Bild/Link anhand `imeta` Parser.
- Abnahmekriterien (M):
  - Erfolgreicher Upload gegen echten NIP‑96 Server; `nip94_event` lokal gespeichert/anzeigbar.
  - Publizierte Notes enthalten `imeta` und werden korrekt dargestellt.
- Deliverables: `/media/upload`, Parser‑Nutzung, UI‑Erweiterungen.
- Manuelle Tests: Bild hochladen → im Editor anhängen → veröffentlichen → Karte zeigt Vorschau/Link.
- Zeit (T): 1–2 Tage (abhängig von verfügbarem NIP‑96 Server).
- Keine Mocks; realer HTTP‑Server bevorzugt.

---

### Phase 7: Long‑form Articles (NIP‑23)

- Ziel (S):
  - Neue Routen `/articles` (Liste) und `/articles/new` (Editor) → `content.article().publish()`.
  - Anzeige einzelner Artikel; optional naddr‑Share.
- Abnahmekriterien (M):
  - Artikel veröffentlichen/anzeigen; Liste paginiert; Basics (Titel, Inhalt, Tags).
- Deliverables: Editor + Reader + Liste.
- Manuelle Tests: Artikel schreiben → publish → erscheint in Liste und Einzelansicht.
- Zeit (T): 1 Tag.
- Keine Mocks.

---

### Phase 8: Labels (NIP‑32)

- Ziel (S):
  - Neue Route `/labels` (Namespace‑Filter, Zieltyp), Viewer.
  - `EventCardActions`: „Label hinzufügen“ → `labels.edit().namespace(...).label(...).targetEvent(...).publish()`.
- Abnahmekriterien (M):
  - Label‑Events werden publiziert und reaktiv angezeigt; Namespace/Mark korrekt.
- Deliverables: `/labels` + Action in Karten.
- Implementierungsnotizen (A):
  - UI: Neue Route `/labels` mit Namespace‑Filter und Zieltyp (Event/Profile). Liste aus Cache; Live‑Update via `sub().kinds([1985,1984]).execute()` optional.
  - Action: `EventCardActions` → `labels.edit().namespace(ns).label(label).targetEvent(eventId).publish()`; Ergebnisanzeige wie bei Publish‑Result.
  - Service: kleine Helper in `NostrService` für gängige Label‑Flows (optional).
- Manuelle Tests: Label setzen/anzeigen; Wechsel Namespace.
- Zeit (T): 0.5–1 Tag.
- Keine Mocks.
- Status: NEXT

---

### Phase 9: Public Chat (NIP‑28)

- Ziel (S):
  - Neue Route `/chat/public`: Channel‑Liste (create/list), Messages, Hide/Mute minimal.
- Abnahmekriterien (M):
  - Channel anlegen; Nachricht senden; Liste und Reader funktionieren live.
- Deliverables: vollständige öffentliche Chat‑View.
- Manuelle Tests: Channel erstellen → Nachricht posten → zweites Fenster sieht Live‑Update.
- Zeit (T): 1 Tag.
- Keine Mocks.

---

### Phase 10: Communities (NIP‑72)

- Ziel (S):
  - Neue Route `/communities` + Detailansicht: Community‑Definition (d/name/image), Posts (`kind:1111`), einfache Approvals (`kind:4550`).
- Abnahmekriterien (M):
  - Community anlegen; Post erstellen; Approval Flow min.
- Deliverables: Liste, Detail, Posten, Approve.
- Manuelle Tests: Community erstellen → Posten → Approven → Anzeige gefiltert.
- Zeit (T): 1.5–2 Tage.
- Keine Mocks.

---

### Phase 11: Nostr Connect (NIP‑46)

- Ziel (S):
  - Neue Route `/settings/signing`: Auswahl Extension/Local/Nostr Connect. Pairing‑Flow mit `NostrConnectSigner` (QR/URI), Statusanzeige.
- Abnahmekriterien (M):
  - Erfolgreiches Pairing; Signatur‑Flows funktionieren; Fallbacks korrekt.
- Deliverables: Settings‑View, Service‑Integration.
- Manuelle Tests: Pairen → publish → disconnect/reconnect.
- Zeit (T): 1–2 Tage.
- Keine Mocks.

---

### Phase 12: Zaps (NIP‑57)

- Ziel (S):
  - Zap‑Aktion in `EventCard`/`ProfileActions` (Minimal‑Flow: Betrag, Kommentar); optionale Route `/zaps` (Verlauf).
- Abnahmekriterien (M):
  - Zap‑Request generiert; Callback validiert; UI Feedback.
- Deliverables: Zap‑Button + minimaler Flow.
- Manuelle Tests: Gegen LNURL fähiges Ziel zappen; Ergebnis prüfen.
- Zeit (T): 1–2 Tage (abhängig Wallet/Provider).
- Keine Mocks.

---

### Phase 13: HTTP Auth Playground (NIP‑98)

- Ziel (S):
  - Dev‑Tool `/dev/http-auth`: Signiere Request/erstelle Header via `signHttpAuth()/buildHttpAuthHeader()` und Test‑Request gegen Demo‑Endpoint.
- Abnahmekriterien (M):
  - Signierte Anfragen nachvollziehbar; Verifikation sichtbar.
- Deliverables: Kleine Dev‑Seite + Utility‑Hooks.
- Manuelle Tests: Header generieren → Request senden → Response/Verify anzeigen.
- Zeit (T): 0.5 Tag.
- Keine Mocks.

---

### Phase 14: NIP‑21 URI‑Handler

- Ziel (S):
  - Route `/open?nostr=...` die `nostr:` URIs decoded (`decode()/parseNostrUri()`), und in passende Views navigiert (Event/Profil/Adresse).
- Abnahmekriterien (M):
  - Öffnen eines `nostr:` Links funktioniert für `nevent`, `npub`, `naddr`.
- Deliverables: Router‑Hook + Utility + Deep‑Links.
- Manuelle Tests: Drei URI‑Typen öffnen, richtige Navigation.
- Zeit (T): 0.5 Tag.
- Keine Mocks.

---

### Roadmap‑Hinweise

- Reihenfolge priorisiert Fortschritt ohne breite Parallelität; jede Phase ist produktionsnah testbar.
- Feature‑Flags vermeiden; sichtbare UI nur wenn funktional.
- Logs/Debug nur kontextuell (kein Rauschen).


