### DX‑Masterplan für `nostr-unchained` und `nostr-unchained-app`

Ziel: Alle in `DX_OPTI.md` (App) und `NOSTR_UNCHAINED_LIB_CLEANUP.md` (Lib) identifizierten Probleme in einen klaren, phasenbasierten Umsetzungsplan überführen. Anspruch: State-of-the-Art DX, kompromisslos saubere SOLID-Architektur, discoverable APIs, minimale Frontend-Wrapper. Jede Lib-Verbesserung soll messbar die Codequalität der App erhöhen.

---

## Executive Summary
- Fokus P0: Sofortige DX-Verbesserungen ohne Breaking Changes (Convenience-APIs, Logging-Gate, Publish-Overload, Docs). App verschlankt ihren Service und vermeidet doppelte Verantwortlichkeiten.
- Fokus P1: Security-Policy „no raw private keys“ (Breaking). Einheitliches `SigningProviderV1` nur mit NIP‑44 Encrypt/Decrypt. Cache/DM laufen ausschließlich über Decryptor-Injection. Giftwraps werden automatisch gespeichert/entschlüsselt, kein manueller Decrypt in der App.
- Fokus P2: Social-Layer-Refactor auf Query/Sub-only, Entfernen direkter Caches, klare Dateischnitte. Optional P3: Polish (Tests/Telemetrie/Docs).

---

## Leitprinzipien (DX & SOLID)
- Discoverable, konsistente API-Namen; keine internen Pfade in der App.
- Single Responsibility: App-Services sind dünn, Fachlogik liegt in der Lib.
- Interface Segregation: Minimal-Interfaces (z. B. `SigningProviderV1`).
- Dependency Inversion: App hängt an abstrahierten Lib-Schichten (Query/Sub/Store).
- DX: Vorhersagbares Logging (vollständig per `config.debug`), einfache Publish-/DM-Flows, klare Fehlermeldungen.

---

## Phasen- und Release-Plan (Lib/App-Kopplung)

| Phase | Zielsetzung | Library Release | App Release | Wesentliche Inhalte |
|------|-------------|------------------|-------------|---------------------|
| P0 | DX/Kompatibilität (non-breaking) | v0.1.1 | A1 (pin `^0.1.1`) | Convenience-APIs (`hasExtension`, `useExtensionSigner`, `useLocalKeySigner`, `getSigningInfo`, Alias `getStats`), `publish(content, kind=1)`, Logging-Gate, Docs-Update (DM-Ready Flow, Lazy Inbox, Publish vs. PublishSigned) |
| P1 | Security-Policy (breaking) | v0.2.0 | A2 (pin `^0.2.0`) | Entfernen aller Raw-Key-Pfade, `SigningProviderV1` (NIP‑44-first), Cache/Init Decryptor-only, Conformance-Tests, negative Pfade UX |
| P2 | Social-Refactor | v0.3.x (ggf. 0.4.0) | A3 (pin `^0.3.x/0.4.0`) | Social-Module auf Query/Sub-only, eigene Caches entfernen, Dateisplitting, Store-Mapper |
| P3 | Polish/Tests/Docs | v0.3.x+ | A3+ | Rumor‑ID vs. Wrap‑ID Test, Debug-Verbesserungen, `getDebugInfo`-Telemetrie |

Branching-Empfehlung:
- P0: `feature/dx-apis` → `release/0.1.1`
- P1: `feat/security-no-raw-key` → `release/0.2.0` (breaking)
- P2: `feat/social-refactor` → `release/0.3.x` (bei Breaking → `0.4.0`)

---

## Arbeitsstränge & Deliverables

### P0 – DX/Kompatibilität (non-breaking)
- Library
  - `NostrUnchained` ergänzt um: `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getSigningInfo()`, `getStats()` (Alias), Overload `publish(content: string, kind=1)`.
  - Logging-Policy: Version- und Debug-Logs nur bei `config.debug === true`.
  - Dokumentation: DM‑Ready‑Flow (connect → initializeSigning → erste DM), Lazy Inbox via `.with()`, Publish vs. PublishSigned.
- App
  - `NostrService` verschlanken: Wrapper durch neue Lib-APIs ersetzen.
  - DM-Flow: Zugriff erst nach `initializeSigning()`; keine doppelte Giftwrap-Subscription (Lazy via `.with()` oder explizit – nicht beides).
  - Publish: Fluent-API oder `publish(content, kind=1)` einsetzen.
  - Fehlermeldungen: Lib-`ErrorHandler` verwenden; DM-UI hinter Signer-Ready Guard (`await nostr.getMe()`).
- Tests
  - Infra-Tests gegen Test-Relays; DM Edge-Cases (leer/zu lang/Emoji) über Service.

### P1 – Security-Policy „no raw private keys“ (breaking)
- Library
  - Entfernen: `getPrivateKeyForEncryption()`, `capabilities().rawKey`, privateKey-State im `UniversalEventCache`.
  - `SigningProviderV1`: `getPublicKey`, `signEvent`, `capabilities { nip44Encrypt, nip44Decrypt }`, `nip44Encrypt/Decrypt`.
  - `_initializeCache()` nur noch Decryptor-Injection; Giftwrap-Reprocessing ohne Private-Key-Pfad.
- App
  - Keine Raw-Key-Annahmen; ausschließlich NIP‑44 via Signer.
  - Negative Pfad-UX: „DM‑Decrypt nicht verfügbar“, wenn kein Decryptor.
- Tests
  - Conformance-Suite mit reiner `nip44Encrypt/Decrypt`-Signer-Implementierung und Negativfall.

### P2 – Social-Layer-Refactor
- Library
  - Social-Manager auf `nostr.query()`/`nostr.sub()` umstellen; eigene Maps/Caches entfernen.
  - Dateisplitting (Thread/Subscription/Store); Store-Mapper zur Ableitung von Domain-Modellen.
- App
  - Nutzung der refaktorierten Social-APIs; Entfernen von Workarounds.
- Tests & Docs
  - Subscription-Rehydration nach Reconnect (wenn benötigt), optionale Latenzmetriken, aktualisierte Architektur-Guides.

### P3 – Polish/Tests/Docs
- Zusätzliche Tests (Rumor‑ID vs. Wrap‑ID), Debug-Verbesserungen, optionale Telemetrie in `getDebugInfo()`.

---

## Abnahmekriterien je Phase
- P0: Neue DX-APIs vorhanden und getestet; Logs vollständig durch `config.debug` steuerbar; App ohne doppelte Subscriptions; Publish über Fluent/Overload; Service dünn.
- P1: Keine Raw-Key-APIs (Code/Exports/Docs); Decryptor-only Pfad aktiv; Conformance-Suite grün; App zeigt Negativ-UX korrekt.
- P2: Social-Module ohne eigene Caches; Query/Sub-only; App ohne Workarounds; alle Tests grün.
- P3: Zusatztests grün; Debug/Telemetrie dokumentiert.

---

## Migrationsleitfaden (App)
- A1 (`^0.1.1`): Wrapper abbauen, neue DX-APIs nutzen; Giftwrap-Subscription nicht doppeln; Publish via Fluent/Overload.
- A2 (`^0.2.0`): Entfernen aller Raw-Key-Verwendungen/Annahmen; DM ausschließlich über NIP‑44-Funktionen des Signers.
- A3 (`^0.3.x/0.4.0`): Social-Module-Anpassungen auf Query/Sub-only; Frontend-Workarounds streichen.

---

## Governance & Quality Gates
- Code Owners & Reviews: Security-relevante Änderungen (P1) benötigen 2 Approvals.
- CI-Pipeline: Lint, Unit, Integration (Infra, NIP‑44 Vektoren), Coverage Gate, API-Diff Check (breaking detection) und Canaries (App-e2e Smoke).
- SemVer-Disziplin: Breaking Changes ausschließlich in Minor 0.X (→ 0.Y.0) mit Migrationshinweisen.
- Dokumentation als Vertragsbestandteil: PRs in P0/P1/P2 enthalten Doc-Updates.

---

## Risikoanalyse & Gegenmaßnahmen
- Breaking in P1: Frühzeitige Beta (`0.2.0-beta.1`) und App-Canary. Klare Migration.
- Extension-Verfügbarkeit: Feature Detection über `hasExtension()`; Fallback auf `LocalKeySigner` nur in DEV.
- Giftwrap-Decryption nicht möglich: Events bleiben gespeichert; UI-Hinweis; späteres Reprocessing via Decryptor.
- Subscription-Duplizierung: Einheitlicher Pfad (Lazy oder explizit), Tests sichern dies ab.

---

## API-Mapping (Kurzreferenz)
- App erwartet → Lib stellt bereit
  - `hasExtension()` → `NostrUnchained.hasExtension()`
  - `useExtensionSigner()` → `NostrUnchained.useExtensionSigner()`
  - `useLocalKeySigner()` → `NostrUnchained.useLocalKeySigner()`
  - `getSigningInfo()` → `NostrUnchained.getSigningInfo()`
  - `getStats()` → Alias von `getRelayStats()`
  - `publish(content)` → `publish(content: string, kind=1)` oder `events.note(content).publish()`

---

## Glossar der Probleme (Checkliste; eine Zeile je Problem)
- [x] [LIB] DX‑API fehlt: `hasExtension()` (DX_OPTI §1; CLEANUP B1)
- [x] [LIB] DX‑API fehlt: `useExtensionSigner()` (DX_OPTI §1; CLEANUP B1)
- [x] [LIB] DX‑API fehlt: `useLocalKeySigner()` (DX_OPTI §1; CLEANUP B1)
- [x] [LIB] DX‑API fehlt: `getSigningInfo()` (DX_OPTI §1; CLEANUP B1)
- [x] [LIB] Alias fehlt: `getStats()` → `getRelayStats()` (DX_OPTI §1; CLEANUP B1)
- [x] [LIB] `publish` akzeptiert kein `string` (Overload `publish(content, kind=1)`) (DX_OPTI §4; CLEANUP B1)
- [x] [LIB] Versions-Log immer aktiv (nicht an `debug` gebunden) (DX_OPTI §3; CLEANUP B2)
- [x] [LIB] `getDM()` vor Signer `undefined` – Dokumentation/TS-Typisierung klarstellen (DX_OPTI §2; CLEANUP B3)
- [x] [LIB] Docs: DM‑Ready‑Flow & Lazy Inbox erklären (DX_OPTI §2; CLEANUP A2)
- [x] [LIB] Docs: Rumor‑ID vs. Wrap‑ID und Mapping beschreiben (CLEANUP A1)
- [ ] [LIB] Optional: unwrap‑Fehlerpfade besser debugbar machen (CLEANUP A1)
- [x] [LIB] Raw-Key-Zweig in `_initializeCache()` entfernen (CLEANUP J1/J2/H/I)
- [ ] [LIB] Öffentliche Methode entfernen: `getPrivateKeyForEncryption()` (CLEANUP J1/J3/H2)
- [ ] [LIB] `UniversalEventCache`: privateKey-State entfernen; Decryptor-only (CLEANUP J2/H2)
- [ ] [LIB] `SigningProvider.capabilities()` ohne `rawKey` (nur NIP‑44 Flags) (CLEANUP J3/I1)
- [ ] [LIB] `SigningProviderV1` finalisieren inkl. `nip44Encrypt/Decrypt` (CLEANUP I1)
- [ ] [LIB] Conformance-Tests: reiner NIP‑44‑Signer + Negativpfad (CLEANUP I4)
- [ ] [LIB] Social-Module: direkte Caches entfernen; Query/Sub-only (CLEANUP C)
- [ ] [LIB] Social-Module: Dateisplitting/Store-Mapper (CLEANUP C)
- [ ] [LIB] `getDebugInfo()` um Version/Build erweitern (statt persistenter Logs) (CLEANUP B2/J1)
- [x] [APP] `NostrService`-Wrapper abbauen; neue Lib-APIs direkt nutzen (DX_OPTI §6)
- [ ] [APP] DM erst nach `initializeSigning()` verwenden (DX_OPTI §2)
- [x] [APP] Keine doppelte Giftwrap-Subscription (Lazy via `.with()` oder explizit) (DX_OPTI §2)
- [x] [APP] Publish via Fluent/Overload; kein `string`→`UnsignedEvent`-Fehler (DX_OPTI §4)
- [ ] [APP] Eingabevalidierung npub/hex zentralisieren (DX_OPTI §5)
- [ ] [APP] `send()`-Ergebnis prüfen, nutzerfreundliche Fehlertexte (DX_OPTI §5)
- [ ] [APP] Reaktive Stores systematisch einsetzen (Svelte `$store`) (DX_OPTI §5)
- [ ] [APP] DM-UI hinter Signer-Ready Guard (z. B. `await nostr.getMe()`) (DX_OPTI §7)
- [ ] [APP] Einheitliche Fehlermeldungen via Lib-`ErrorHandler` (DX_OPTI §7)
- [ ] [APP] Tests: Infra, DM-Edge-Cases im Service (DX_OPTI §8)
- [ ] [DOC] Events-Doku: Publish vs. PublishSigned deutlich hervorheben (CLEANUP B3/E3)
- [ ] [TEST] Test „Rumor‑ID vs. Wrap‑ID“ in Cache/DM hinzufügen (CLEANUP D)

---

## Zeit-/Meilensteinvorschlag
- Woche 1–2: P0 implementieren, App A1 migrieren, Beta verifizieren.
- Woche 3–4: P1 entwickeln (Beta), Conformance/Negativpfade, App A2 migrieren.
- Woche 5–6: P2 Social-Refactor und App A3, Architektur-Guides/Ref-Samples.
- Woche 7+: P3 Polish, Telemetrie, zusätzliche tests.

---

## Verweise
- App: `nostr-unchained-app/DX_OPTI.md`
- Lib: `nostr-unchained/NOSTR_UNCHAINED_LIB_CLEANUP.md`
