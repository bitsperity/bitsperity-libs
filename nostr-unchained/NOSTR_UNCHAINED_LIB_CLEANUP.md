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

---

## H) Signer-Sicherheits-Policy: Encrypt/Decrypt-only (kein Raw-Key-Leak)

### H1) Grundsatz
- Jeder Signer (Browser-Extension, Mobile, Custom) soll Verschlüsselung/Entschlüsselung selbst ausführen (NIP‑44), anstatt private Schlüssel offenzulegen.
- Das Herausgeben eines Raw-Private-Keys ist in Produktion untersagt. Eine Dev‑Fallback‑Option bleibt ausschließlich für lokale Tests (z. B. `LocalKeySigner`) erhalten und muss explizit aktiviert werden.

### H2) API-/Implementierungsfolgen
- SigningProvider Interface:
  - Verbindlich: `capabilities()` mit Flags für `nip44Encrypt`/`nip44Decrypt` (ohne jegliche Raw‑Key‑Angaben).
  - Verbindlich: `nip44Encrypt(peerPubkey, plaintext)` und `nip44Decrypt(peerPubkey, ciphertext)` als First‑Class.
  - Entfernen: `getPrivateKeyForEncryption()` (kein Raw‑Key‑Zugriff, auch nicht im DEV‑API).

- NostrUnchained:
  - `_initializeCache()` verkabelt ausschließlich den Decryptor, wenn verfügbar. Kein Raw‑Key‑Pfad mehr.
  - Falls kein Decryptor verfügbar: Gift Wraps werden gespeichert, aber nicht lokal entschlüsselt (kein Fallback über Private Keys).

- UniversalEventCache:
  - Nur noch Decryptor‑Injection via `setDecryptor(...)`. Private‑Key‑Pfad wird entfernt.
  - Konstruktor benötigt keinen Private‑Key mehr; Re‑Processing nutzt ausschließlich den Decryptor.

- ExtensionSigner:
  - `capabilities(): { nip44Encrypt: boolean; nip44Decrypt: boolean }` – kein Raw‑Key.
  - NIP‑44 bleibt in der Extension implementiert.

- LocalKeySigner (DEV):
  - Behält interne Schlüsselverwaltung, aber exponiert sie nie. Implementiert `nip44Encrypt/Decrypt` vollständig, ohne Raw‑Key‑API.

### H3) Migration/Kompatibilität
- Kurzfristig:
  - Entfernen aller Raw‑Key‑Nutzungen in Code und Doku.
  - `_initializeCache()` ausschließlich mit Decryptor‑Pfad betreiben.

- Mittelfristig:
  - `getPrivateKeyForEncryption()` ersatzlos streichen (Removal), Changelog und README anpassen.
  - Beispiele/Docs ausschließlich über `nip44Encrypt/Decrypt` führen.

- Langfristig:
  - `UniversalEventCache` ohne Private‑Key‑Konstruktion betreiben; alle Entschlüsselung via Decryptor.

### H4) Tests
- Sicherstellen, dass NIP‑44 Compliance‑Tests mit Decryptor laufen (ExtensionSigner‑Pfad, oder LocalKeySigner‑Decryptor ohne Raw‑Key‑Expose).
- Zusätzliche Tests: „No Raw Key in Prod“ – Simulator, der `experimental.allowRawKey=false` erzwingt und sicherstellt, dass keinerlei Schlüssel ausgelesen/geloggt werden.

---

## I) Standardisierte SigningProvider‑Spezifikation (v1) – DM mit jedem Signer

Ziel: Alle Signer verhalten sich identisch für DM‑Verschlüsselung/‑Entschlüsselung, ohne Raw‑Key‑Zugriff. Damit funktionieren DMs sofort mit jedem Signer.

### I1) Minimal‑Interface (verbindlich)
```ts
interface SigningProviderV1 {
  // Identität
  getPublicKey(): Promise<string>;
  getPublicKeySync?(): string | null;

  // Signatur (NIP‑01)
  signEvent(event: UnsignedEvent): Promise<string>; // sig hex

  // Fähigkeiten
  capabilities(): Promise<{
    nip44Encrypt: boolean;
    nip44Decrypt: boolean;
  }>;

  // NIP‑44 (Pflicht für DM‑Support)
  nip44Encrypt(peerPubkeyHex: string, plaintext: string): Promise<string>;   // returns payload (base64)
  nip44Decrypt(peerPubkeyHex: string, ciphertext: string): Promise<string>; // returns plaintext (utf‑8)
}
```

Hinweise:
- Es gibt keine Raw‑Key‑APIs. Signer dürfen interne Keys halten, aber niemals herausgeben.
- Die Parameter sind hex‑Pubkeys; npub‑Konvertierung übernimmt die Lib vor dem Aufruf.

### I2) Lib‑Handshake
- `initializeSigning(provider)` ruft `capabilities()` auf und injiziert bei `nip44Decrypt===true` den Decryptor in den Cache.
- Gift‑Wrap‑Inbox startet Lazy beim ersten `getDM().with(...)`.

### I3) Kompatibilitätsmatrix (Zielzustand)
- ExtensionSigner: `nip44Encrypt/Decrypt` via `window.nostr.nip44.*` → kompatibel.
- LocalKeySigner (DEV): implementiert `nip44Encrypt/Decrypt` intern (keine Raw‑Key‑Expose nach außen).
- Custom Signer: muss obiges Interface erfüllen; dann läuft DM out‑of‑the‑box.

### I4) Abnahme‑Tests
- Conformance‑Suite ergänzt: Signer‑Mock, der nur `nip44Encrypt/Decrypt` bereitstellt → DM‑Tests müssen bestehen (Senden/Empfangen/UTF‑8/Edge‑Cases).
- Negative‑Pfad: `nip44Decrypt=false` → kein Decryptor; Cache speichert Gift Wraps, UI zeigt Hinweis „DM‑Decrypt nicht verfügbar“ (optional), keine Raw‑Keys als Fallback in Prod.

---

## J6) dm/api/DMModule.ts

- Ist‑Stand:
  - Nutzt `getPrivateKeySecurely()` mit Zugriff auf `signingProvider.getPrivateKeyForEncryption()` und dev Fallback‑Key bei `debug`/`test`.
  - Entschlüsselt Wraps im Modul (Legacy‑Pfad) und erzeugt Konversation/Rooms mit Raw‑Key.
  - `normalizePubkey()` lehnt `npub` ab; nur 64‑Hex akzeptiert.
- Probleme:
  - Verstößt gegen H‑Policy (Raw‑Key‑Zugriff, Dev‑Fallback‑Key im Klartext, Logging von Key‑Metadaten).
  - Doppelverantwortung für Decryption (Modul vs. Cache/UniversalDM) → potenzielle Inkonsistenz.
  - DX: `npub` wird nicht akzeptiert; inkonsistent zur restlichen Lib.
- Maßnahmen:
  - Entferne Raw‑Key‑Pfad (nur Decryptor/Universal‑Flow). Delegiere Decrypt/Inbox vollständig an Universal‑Cache/UniversalDM.
  - Entferne dev Fallback‑Key. Keine Key‑Logs.
  - Akzeptiere `npub` und normalisiere zentral (siehe Utils).
  - Dokumentiere, dass dieser Pfad legacy ist und mittelfristig durch UniversalDM ersetzt wird.

---

## J7) dm/conversation/UniversalDMConversation.ts

- Ist‑Stand:
  - Nutzt `subscriptionManager.getOrCreateSubscription` via `nostr.startUniversalGiftWrapSubscription()` (global) + `query().kinds(14)` Store.
  - Send‑Pfad: bevorzugt `signer.nip44Encrypt`; Fallback auf `nostr.getPrivateKeyForEncryption()` bei fehlender NIP‑44 Capability.
- Probleme:
  - Fallback auf Raw‑Key widerspricht H‑Policy; in Prod nicht zulässig.
  - Kapselt Signer‑Capabilities partiell; Fehlerpfade liefern generische Texte.
- Maßnahmen:
  - Entferne Raw‑Key‑Fallback; wenn `nip44Encrypt`/`nip44Decrypt` nicht verfügbar: DM‑Send/Decrypt deaktivieren, UI‑Signal über Status/Fehler liefern.
  - Klarere Fehler (Capability fehlt) über `ErrorHandler`.
  - DX: Helper `with(subject?: string)` optional; `send()` Ergebnis strukturierter (Relay/IDs).

---

## J8) dm/protocol/SealCreator.ts

- Ist‑Stand:
  - Loggt sensible Private‑Key‑Metadaten in `getPublicKeyFromPrivate()` (L223 ff.).
- Probleme (kritisch):
  - Leakage sensibler Informationen im Log (auch mit Debug riskant). Verstößt gegen H‑Policy.
- Maßnahmen:
  - Entferne sämtliches Logging sensibler Key‑Infos. Fehler nur mit generischen Messages.

---

## J9) dm/protocol/GiftWrapProtocol.ts

- Ist‑Stand:
  - Saubere Protokollierung der NIP‑59 Schritte; Unwrap unterstützt lokalen Key‑Pfad (hex) und validiert Format.
- Hinweise:
  - In Prod‑Flows sollte Unwrap über Cache‑Decryptor erfolgen. Dokumentieren, dass lokale Key‑Pfade nur für DEV/Tests gelten.

---

## J10) cache/UniversalEventCache.ts

- Ist‑Stand:
  - Hält `privateKey` und `setPrivateKey()`, optionaler `decryptor` via `setDecryptor()`. Fallback‑Unwrap über lokalen Key.
- Probleme:
  - Private‑Key‑State widerspricht Zielbild (H/I). Silent Failures bei Decrypt schwer debugbar.
- Maßnahmen:
  - Entferne Private‑Key‑State; alleiniger Decryptor‑Pfad. `reprocessGiftWraps()` nutzt nur Decryptor.
  - Optional: strukturierte Fehlertelemetrie (Grund für Decrypt‑Fail), jedoch ohne sensible Daten.

---

## J11) crypto/SigningProvider.ts

- Ist‑Stand:
  - `ExtensionSigner.capabilities(): { nip44Encrypt, nip44Decrypt, rawKey: false }` – gut.
  - `LocalKeySigner` exponiert `getPrivateKeyForEncryption()` und `capabilities().rawKey = true`.
- Probleme:
  - Raw‑Key‑Expose im DEV‑Signer verletzt H‑Policy (API‑Oberfläche). Intern ok, außen nicht.
- Maßnahmen:
  - Entferne `getPrivateKeyForEncryption()` und `rawKey` aus Capabilities. Behalte interne Key‑Nutzung für NIP‑44, aber ausschließlich via `nip44Encrypt/Decrypt`.

---

## J12) core/NostrUnchained.ts

- Ist‑Stand:
  - Constructor loggt Version immer (L58). `_initializeCache()` setzt Private‑Key in Cache (`setPrivateKey`) abhängig von Capabilities.rawKey, anschließend `setDecryptor()` bei `nip44Decrypt`.
  - Öffentliche `getPrivateKeyForEncryption()` Methode vorhanden.
- Probleme:
  - Immer‑Log stört Prod‑DX. Raw‑Key‑Pfad widerspricht H‑Policy. Öffentliche Raw‑Key‑API.
- Maßnahmen:
  - Version‑Log nur bei `config.debug`.
  - Entferne Raw‑Key‑Pfad, allein `setDecryptor()` + Reprocessing.
  - Entferne öffentliche `getPrivateKeyForEncryption()`.
  - Ergänze DX‑APIs (B1/E) für App‑Kompatibilität.

---

## J13) relay/RelayManager.ts

- Ist‑Stand:
  - Saubere Retry/Backoff/Debug‑Logs hinter Flag; Pending‑Publishes Tracking gut.
- Maßnahmen (optional):
  - Export granularer Latenz‑Metriken; Hook für Sub‑Rehydration dokumentieren.

---

## J14) subscription/SubscriptionManager.ts + SharedSubscription.ts

- Ist‑Stand:
  - Dedup‑Subscriptions, Listener‑Multiplexing, solide Fehlerpfade.
- Maßnahmen (optional):
  - Metriken/Analytics im Debug aus `getStats()` harmonisieren.

---

## J15) events/FluentEventBuilder.ts

- Ist‑Stand:
  - Gute Fluent‑DX; `events.note(content).publish()` als Workaround vorhanden.
- Maßnahmen (DX):
  - In `NostrUnchained` einen `publish(content: string, kind=1)` Overload anbieten (B1/E), damit App ohne Builder publizieren kann.

---

## J16) utils/encoding-utils.ts

- Ist‑Stand:
  - Umfangreiche NIP‑19 Utilities; npub/nsec/… Round‑Trips stabil.
- Maßnahmen:
  - Nichts kritisch; zentral als Normalisierungs‑Helper in DM/API verwenden.

---

## J17) store/UniversalNostrStore.ts

- Ist‑Stand:
  - Tag‑Filter Matching implementiert (#p/#e/#t/Generic); reaktiv.
- Maßnahmen:
  - OK.

---

## K) Sicherheitsbefunde (kritisch)

- Entfernen/unterbinden:
  - Raw‑Key‑APIs/Cap‑Flags (siehe H/J11/J12/J6/J7).
  - Jegliches Logging von Private‑Keys/Derivaten (J8).
  - Dev‑Fallback‑Keys in Modulen (J6) → streichen.
- Prod‑Verhalten:
  - Wenn `nip44Decrypt` fehlt: Gift Wraps cachen, UI‑Signal „Decrypt nicht verfügbar“, kein Fallback über Raw‑Key.

---

## L) Logging‑Policy (präzisiert)

- Nur loggen bei `config.debug === true`.
- Niemals sensible Daten loggen (Keys, Ciphertexts, unmaskierte IDs).
- Versions‑/Build‑Info über `getDebugInfo()` abrufbar statt Always‑Log.

---

## M) Migrationsplan (inkrementell, ohne Breaking UX)

- PR‑1 (DX/Compat):
  - `NostrUnchained`: `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getSigningInfo()`, `publish(content, kind)`, Alias `getStats()`.
  - Constructor‑Log an `debug` binden.
- PR‑2 (Security):
  - Entferne `getPrivateKeyForEncryption()` (Core/Signer) und `rawKey` Capability.
  - Entferne Key‑Logging (SealCreator) und Dev‑Fallback‑Keys.
- PR‑3 (Cache/Decryptor‑Only):
  - `UniversalEventCache`: Private‑Key‑State entfernen; nur `setDecryptor()`; Reprocessing anpassen.
  - `NostrUnchained._initializeCache()`: nur Decryptor‑Pfad.
- PR‑4 (DM‑Konsolidierung):
  - `DMModule`/`UniversalDMConversation`: Raw‑Key‑Fallbacks entfernen; klare Fehlerpfade bei fehlenden Capabilities; `npub` Normalisierung.

---

## N) Testplan

- Conformance:
  - NIP‑44 Vektoren weiterhin grün (Signer‑Decryptor‑Pfad).
  - „No Raw Key in Prod“: Tests erzwingen fehlende Raw‑Key‑APIs, prüfen, dass DMs mit Extension/LocalSigner via `nip44*` laufen.
- Regression:
  - „Rumor‑ID vs. Wrap‑ID“ Validierung im Cache/DM‑Flow.
  - „Lazy Inbox Activation“: Erste `with()`/`send()` aktiviert Gift‑Wrap‑Sub (kein Doppelstart).
- DX:
  - `publish(content)`/`hasExtension()`/`use*Signer()` E2E in App‑Fixture; Fehlertexte via `ErrorHandler` geprüft.

---

## J18) dm/api/UniversalDMModule.ts

- Ist‑Stand:
  - Akzeptiert `npub`/hex und normalisiert; lazy startet Gift‑Wrap‑Subscription bei erstem Zugriff.
  - Kapselt Konversationen/Räume in Cache‑basierte Stores.
- Maßnahmen:
  - OK hinsichtlich Clean‑Arch (Cache/Sub). Fehlerausgaben an `debug` binden.

---

## J19) dm/crypto/NIP44Crypto.ts

- Ist‑Stand:
  - Saubere NIP‑44 v2 Implementierung (HKDF, ChaCha20, HMAC, Padding). Fehler werden als `NIP44Error` zurückgegeben.
- Maßnahmen:
  - OK. Keine sensiblen Logs. Beibehalten.

---

## J20) dm/protocol/* (GiftWrapCreator, GiftWrapProtocol, EphemeralKeyManager, TimestampRandomizer)

- Ist‑Stand:
  - Korrekte Protokollschritte, Ephemeral Keys, Timestamp‑Randomisierung, Validierungen.
  - `GiftWrapProtocol.unwrapGiftWrap()` erlaubt lokalen Key‑Pfad (DEV/Tests).
- Maßnahmen:
  - Dokumentieren: In Prod über Cache‑Decryptor nutzen. Lokaler Key nur in Tests/Tools.

---

## J21) dm/index.ts

- Ist‑Stand:
  - Exporte konsistent, inkl. Legacy‑DM und Universal‑DM.
- Maßnahmen:
  - Nach Security‑Migration (H/M) Legacy‑Exports überprüfen/kennzeichnen.

---

## J22) query/FilterBuilder.ts

- Ist‑Stand:
  - Symmetrische Fluent‑API, generische `tags()` mit Existenzprüfung.
- Maßnahmen:
  - OK.

---

## J23) profile/ProfileModule.ts

- Ist‑Stand:
  - Vorbildliche Clean‑Arch‑Nutzung von `nostr.query()`/`nostr.sub()`; DM‑Convenience via `chat()`.
- Maßnahmen:
  - OK.

---

## J24) social/* (SocialModule, Content/Reaction/Thread/Feed)

- Ist‑Stand:
  - SocialModule nutzt Clean‑Arch und lazy‑lädt Untermodule.
  - Manager‑Implementierungen folgen Clean‑Arch (keine direkten Caches/SubscriptionManager Zugriffe) – Stand hier: Module‑Shells ok.
- Maßnahmen:
  - Bei Implementierung strikt `nostr.query()/sub()` nutzen; keine eigenen Maps/Caches.

---

## J25) scripts/* (dm-two-party.mjs, relay-inspect-1059.mjs)

- Ist‑Stand:
  - Nutzen Raw‑Key‑Signers (`getPrivateKeyForEncryption()`) zu Demo-/Debug‑Zwecken.
- Maßnahmen:
  - Deutlich als DEV‑Tools markieren. In Doku kennzeichnen, dass sie nicht Prod‑geeignet sind.

---

## J26) docs/* (dm/README.md, architecture/stores/events)

- Befund:
  - DM‑README referenziert an einer Stelle `nostr.getPrivateKeyForEncryption()` (manueller Decrypt‑Test). Das widerspricht H‑Policy im Prod‑Kontext.
- Maßnahmen:
  - Doku ergänzen: Der Aufruf ist nur in DEV/Tests zulässig; in Prod wird Decrypt transparent durch den Cache‑Decryptor erledigt. Rumor‑ID vs. Wrap‑ID Hinweis ergänzen.

---


