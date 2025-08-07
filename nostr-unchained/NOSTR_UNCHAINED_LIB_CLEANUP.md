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

## J) File‑by‑File Audit (laufend aktualisiert)

### J1) core/NostrUnchained.ts
- **Probleme/Abweichungen**:
  - Versions‑Log immer aktiv (Zeile ~58) – nicht an `debug` gebunden.
  - `_initializeCache()` nutzt noch Raw‑Key‑Pfad (Capabilities `rawKey`, `getPrivateKeyForEncryption`) – widerspricht H/I Policy.
  - Öffentliche Methode `getPrivateKeyForEncryption()` – muss entfernt werden (keine Raw‑Key‑APIs).
  - Cache‑Konstruktion mit Private‑Key (''/hex) – ersetzen durch key‑freies Konstrukt + Decryptor‑Injection.
  - DX‑Convenience‑APIs fehlen (hasExtension/useExtensionSigner/useLocalKeySigner/getSigningInfo/publish(content)).

- **Maßnahmen**:
  1) `constructor`: Versions‑Log nur, wenn `config.debug`.
  2) `_initializeCache()`:
     - Raw‑Key‑Zweig löschen.
     - `this.cache = new UniversalEventCache({ ...config })` (ohne Key) – API wird in K angepasst.
     - Bei `capabilities().nip44Decrypt` Decryptor setzen; danach `reprocessGiftWraps()` (ohne Key‑Pfad).
  3) Entferne `getPrivateKeyForEncryption()` komplett.
  4) Ergänze DX‑APIs:
     - `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getSigningInfo()`
     - Overload `publish(content: string, kind = 1)`.
  5) `getDebugInfo()` um Versionsinfo erweitern (statt immer zu loggen).

### J2) cache/UniversalEventCache.ts
- **Ist‑Stand**:
  - Hält `privateKey`, `setPrivateKey()`, unwrap‑Fallback via `GiftWrapProtocol` + Raw‑Key, Decryptor optional.

- **Soll (gemäß H/I)**:
  - Entferne Private‑Key‑State komplett; kein `setPrivateKey()` mehr.
  - Konstruktor ohne Key; nur konfig‑Parameter.
  - `unwrapGiftWrap()` nutzt ausschließlich Decryptor; ohne Decryptor: keine Entschlüsselung (Event bleibt 1059 im Cache).
  - `reprocessGiftWraps()` versucht ausschließlich Decryptor‑Pfad.

- **Zusatz**:
  - Behalte Gift‑Wrap‑Speicherung und Indexierung bei; 14‑Events weiterhin nach erfolgreicher Entschlüsselung hinzufügen.
  - Stats/Indexes/Subscribe unverändert.

### J3) crypto/SigningProvider.ts
- **Ist‑Stand**:
  - `ExtensionSigner`: OK, hat `nip44Encrypt/Decrypt`.
  - `LocalKeySigner`: implementiert NIP‑44 intern, exponiert aber `getPrivateKeyForEncryption()` und `capabilities().rawKey`.

- **Soll**:
  - Entferne `getPrivateKeyForEncryption()` und `rawKey` aus `capabilities()`.
  - Belasse NIP‑44 Implementierung intern; API nur `nip44Encrypt/Decrypt`.
  - Passe `SigningProvider` Typen entsprechend I1 an.
  - `SigningProviderFactory.createBestAvailable()` unverändert (Extension bevorzugt, sonst DEV‑Signer), aber ohne Raw‑Key APIs.

### J4) dm/api/UniversalDMModule.ts
- **Beobachtungen**:
  - Robust gegen npub/hex mit Auto‑Konvertierung; gutes Lazy‑Start der Inbox.
  - `UniversalDMRoom.send()`/Teilnehmer‑Mgmt TODO – unvollständig.

- **Maßnahmen**:
  - Implementiere Room‑Send (mehrere Empfänger, Gift Wrap je Empfänger; Aggregation von PublishResult).
  - Teilnehmerverwaltung: Events für Join/Leave oder definierte Tagging‑Konvention dokumentieren/umsetzen.
  - Validierung vereinheitlichen (Helper für Pubkey‑Normierung zentralisieren).
  - Optional: `.with()`/`.room()` geben klaren Fehlerzustand zurück (statt silent warn) – bessere DX für UI.

### J5) relay/RelayManager.ts
- **Beobachtungen**:
  - Solide Connection/Retry/Backoff; Pending Publishes werden bei Disconnect bereinigt.
  - Debug‑Logs reichlich, gut hinter `debug`.

- **Maßnahmen (optional)**:
  - Hook für Subscription‑Rehydration nach Reconnect (falls benötigt durch höhere Schicht; derzeit Sub‑Layer steuert das).
  - Optionale Metrik: real gemessene Latenzen pro Publish (falls Relay OK/Timeout messen).
  - Optional: Circuit‑Breaker/Zeitfenster für instabile Relays (temporär skippen).


