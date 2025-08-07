### Nostr Unchained – Cleanup & DX-Verbesserungen (mit Fokus DM/NIP‑44/NIP‑59)

Dieses Dokument hält strukturierte Architektur- und DX-Baustellen fest und schlägt konkrete Lösungen mit klarer Priorisierung vor. Ziel: Frontend-DX vereinfachen, API-Entdeckbarkeit erhöhen, DM-/Signer-Pfade konsistent machen.

---

## A) DM/Encryption/Signer – Bewertung & Maßnahmen

### A1) UniversalEventCache und Giftwrap-Unwrapping

- **Status**: Sehr solide. Cache speichert Gift Wraps (1059) unabhängig von Decryption, versucht optional zu entschlüsseln und transformiert Rumors (→ 14) mit Tag-Preservation. `setPrivateKey()` akzeptiert `nsec` und normalisiert auf Hex. Optionaler `decryptor` unterstützt NIP‑44 der Extension.
- **Risiko**: `normalizeRumorFromWrap()` setzt `id` neu via `EventBuilder.calculateEventId()`. Das ist korrekt (Rumor ist eigenes Event), aber dokumentieren, dass resultierende DMs synthetisiert werden und `id` nicht die Wrap-ID ist.
- **Maßnahmen**:
  - [Doc] In `docs/dm/README.md` „Rumor-ID vs. Wrap-ID“ und Mapping klarer beschreiben (inkl. Store-Sicht).
  - [Nice-to-have] `unwrapGiftWrap()` Fehlerpfade debug-baren Rückgabewert geben (z. B. Grund warum Decrypt failte) – aktuell silent fallback, was ok ist, aber Debug optional verbessern.

### A2) Signer-Integration und Cache-Init

- **Status**: `initializeSigning()` ruft `_initializeCache()` auf, injiziert Decryptor, reprocess’t Gift Wraps, startet Lazy-Inbox via `startUniversalGiftWrapSubscription()` beim ersten DM-Zugriff. Gut.
- **Risiko**: Public Logs sind nicht komplett an `config.debug` gebunden (Version-Log immer aktiv). Kleinere Inkonsistenzen in Methodennamen (siehe B).
- **Maßnahmen**:
  - [Fix] Alle Logs konsequent an `config.debug` binden (Version-Banner optional nur im Debug).
  - [Doc] „DM-Ready Flow“: Reihenfolge (connect → initializeSigning → erste DM) prominent dokumentieren; klarstellen, dass `with()` die Inbox lazy startet.

### A3) NIP‑44 Crypto über Extension vs. LocalKeySigner

- **Status**: `ExtensionSigner` bewirbt `nip44Encrypt/Decrypt` (falls vorhanden); `LocalKeySigner` liefert `getPrivateKeyForEncryption()` und interne NIP‑44 Utility-Nutzung. Gut für Dev.
- **Risiko**: App-Teams erwarten teils Convenience-APIs „useExtensionSigner/useLocalKeySigner“. Aktuell nur `SigningProviderFactory.createBestAvailable()` + manuelles Übergeben möglich.
- **Maßnahmen**: Siehe B1 (DX-APIs ergänzen).

---

## B) DX/API – Vereinheitlichungen

### B1) Convenience-Methoden in `NostrUnchained`

- **Probleme (App-Mismatch)**: In der App werden Methoden erwartet, die in `NostrUnchained` fehlen oder anders heißen.
- **Vorschlag (neue, dünne Facade-APIs; implementieren als Wrapper auf bestehender Logik):**
  - `async hasExtension(): Promise<boolean>` → Delegiert an `ExtensionSigner.isAvailable()`
  - `async useExtensionSigner(): Promise<{ success: boolean; pubkey?: string; error?: string }>` → Erstellt `ExtensionSigner`, ruft `initializeSigning()` und gibt Pubkey zurück.
  - `async useLocalKeySigner(): Promise<{ success: boolean; pubkey?: string; error?: string }>` → Erstellt `LocalKeySigner`, ruft `initializeSigning()`.
  - `getSigningInfo(): { method: 'extension' | 'temporary'; pubkey: string | null }` → Wrapper um `getDebugInfo()` und `.me`.
  - Overload: `publish(content: string, kind = 1)` → baut minimalen UnsignedEvent und nutzt bestehende `publish(event)`-Pipeline.
  - Aliase: `getStats()` → `getRelayStats()`

> Wirkung: App-Services werden dünner, Onboarding einfacher, API entdeckbarer. Keine Architekturänderungen nötig.

### B2) Logging-Policy

- **Problem**: Immer aktives Versions-Log in `constructor`.
- **Lösung**: Nur loggen, wenn `config.debug === true`. Optional: `getDebugInfo()` erweitern um Build/Version.

### B3) Naming-Konsistenz

- `getDM()` ist getter-artig, aber liefert `undefined`, bis Signer bereit ist. Das ist technisch ok (Lazy), sollte aber klar dokumentiert werden und in TS-Typen optional geführt sein.
- `publishSigned()` ist korrekt und wichtig (Ephemeral-Key-Signaturen). Doku bereits vorhanden – hervorheben in Events-Doku „Wann publish vs. publishSigned“.

---

## C) Architektursauberkeit – Social Module (Bestandsdokument stützt Befund)

- Vorliegendes Dokument `ARCHITECTURE_ISSUES.md` benennt Direct-Cache- und Direct-Subscription-Verstöße in Social-Managern (eigene Maps, direkter Zugriff auf `SubscriptionManager`).
- **Maßnahmen (schrittweise):**
  - Alle Social-Manager auf `nostr.query()`/`nostr.sub()` umstellen, eigene Caches entfernen.
  - Ggf. „Store-Mapper“ einsetzen, um Domain-Modelle aus `UniversalNostrStore<NostrEvent[]>` abzuleiten.
  - Große Dateien splitten (Thread/Subscription/Store) gemäß Plan im Dokument.

---

## D) Tests & Compliance – DM/NIP‑44

- **Status**: Starker Fokus mit offiziellen Vektoren, E2E-Tests, Debug-Szenarien. Sehr gut.
- **Verbesserung**: Ein expliziter Test „Rumor-ID vs. Wrap-ID“ in Cache/DM, um künftige Regressionen zu vermeiden.

---

## E) Kurzfristige Edits (Low-Risk, High-DX)

1. `NostrUnchained` ergänzen:
   - `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getSigningInfo()`
   - `publish(content: string, kind = 1)` Overload
   - `getStats()` Alias auf `getRelayStats()`
2. `constructor`-Log nur bei `debug` ausgeben.
3. Doku-Updates: DM-Ready-Flow, Rumor vs. Wrap ID, Publish vs. PublishSigned.

---

## F) Roadmap (Priorisierung)

- **P0 (DX/Compat)**: B1 + B2 + E1/E2/E3 – sofortige Entlastung im Frontend, weniger Wrapper-Code.
- **P1 (Architektur Social)**: C – Social-Module refactor auf Query/Sub-Layer, große Dateien splitten.
- **P2 (Nice-to-have)**: A1 Debug-Verschönerung, zusätzliche Tests (D), optionale Telemetrie in `getDebugInfo()`.

---

## G) Ergebnis

Mit den oben vorgeschlagenen Low-Risk-Erweiterungen erhält die App die fehlenden, erwarteten UX-/DX-Schalter direkt an der Lib. Der DM-Flow bleibt sauber (Lazy Inbox, Cache-Entschlüsselung, NIP‑44 via Signer/Decryptor), die Frontend-Integration wird einfacher und robuster. Mittel- bis langfristig erhöht die Social-Layer-Bereinigung (Query/Sub-only) die strukturelle Qualität weiter.


