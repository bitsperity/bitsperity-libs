### DX-Optimierungen für nostr-unchained-app

Dieser Leitfaden dokumentiert konkrete DX-Probleme in der App-Integration von `nostr-unchained` und liefert klare Lösungsvorschläge inklusive API-Angleichungen, Architekturhinweisen und kurzfristigen Workarounds. Fokus: DM-Flow (NIP-44/NIP-59), Signer/Encryption und reaktive Stores.

---

## 1) API-Mismatches zwischen App und Library

- **Problem**: Die App nutzt Methoden, die in der aktuellen `NostrUnchained`-Klasse nicht vorhanden sind oder anders heißen:
  - `hasExtension()` → fehlt in `NostrUnchained`
  - `useExtensionSigner()` → fehlt in `NostrUnchained`
  - `useLocalKeySigner()` → fehlt in `NostrUnchained`
  - `getSigningInfo()` → fehlt; es gibt `getDebugInfo()`
  - `getStats()` → in der Lib heißt es `getRelayStats()`
  - `publish(content: string)` → `publish()` erwartet aktuell ein `UnsignedEvent`; App übergibt `string`

- **Auswirkung**: Reibungsverluste, unnötige Service-Wrapper-Logik und erhöhte Integrationskomplexität. Kompilations-/Runtime-Risiken bei strikter Typisierung.

- **Kurzfristige App-Lösungen (kompatible Wrapper im Service):**
  - `hasExtension()` → `ExtensionSigner.isAvailable()` statisch aufrufen.
  - `useExtensionSigner()` → `new ExtensionSigner()` erstellen und `nostr.initializeSigning(provider)` aufrufen.
  - `useLocalKeySigner()` → `new LocalKeySigner()` erstellen und `nostr.initializeSigning(provider)` aufrufen.
  - `getSigningInfo()` → aus `nostr.getDebugInfo()` ableiten; ggf. Pubkey via `nostr.getMe()` erfragen.
  - `getStats()` → `nostr.getRelayStats()` nutzen.
  - `publish(content: string)` → vorerst über `nostr.events.note(content).publish()` oder per manueller Event-Erstellung über den Fluent Builder.

- **Langfristige Lib-Angleichung (siehe Library-Dokument):** Einheitliche, discoverable Convenience-Methoden direkt in `NostrUnchained` bereitstellen, damit der App-Service dünner wird und die DX steigt.

---

## 2) DM-Ready-Flow und Gift-Wrap-Subscription

- **Problem**: `getDM()` ist `undefined`, solange kein Signer initialisiert ist. Die App ruft manuell `startUniversalGiftWrapSubscription()` auf, obwohl `DMModule.with()` die Lazy-Subscription bereits triggert.

- **Auswirkung**: Race-Conditions (DM vor Signer), doppelte Verantwortung für Subscriptions im Frontend, unnötige Komplexität.

- **Empfohlene App-Anpassungen:**
  - Nach erfolgreichem `initializeSigning(provider)` erst DM verwenden:
    ```ts
    await nostr.initializeSigning(provider);
    // optional: await nostr.connect(); // falls noch nicht verbunden
    const dm = nostr.getDM()?.with(recipientHexOrNpub);
    ```
  - Auf den expliziten Aufruf von `startUniversalGiftWrapSubscription()` im Service verzichten. Der erste `with()`-Zugriff aktiviert sie bereits (Lazy Loading). Falls Inbox „sofort“ benötigt wird, weiter zulässig: `await nostr.startUniversalGiftWrapSubscription()` – aber nicht beides mischen.
  - UI/UX: DM-Bereich in der App erst nach Signer-Ready anzeigen (z. B. Guard via `await nostr.getMe()` oder expliziter Auth-Status).

---

## 3) Logging und Debug-Kontrolle

- **Problem**: Die Lib loggt Versionsinfo immer (`console.log('🔥 NostrUnchained v0.1.0-FIX ...')`), unabhängig von `debug`.

- **Auswirkung**: Rauschen in der App-Konsole, erschwerte Fehlersuche.

- **App-Seite**: Bis zur Lib-Anpassung Debug-Logs in der App konsequent kapseln und in Prod-Builds minimieren (z. B. Vite-Define/Strip-Logs).

- **Lib-Anpassung (siehe Library-Dokument)**: Alle Logs an `config.debug` binden.

---

## 4) Publish-DX in der App

- **Problem**: App nutzt `nostr.publish(content)`, die aktuelle Lib erwartet aber ein `UnsignedEvent`.

- **Workaround in der App:**
  - Kurzfristig auf den Fluent Builder wechseln:
    ```ts
    await nostr.events.note(content).publish();
    ```
  - Alternativ: Minimal-Helper im Service, der `kind: 1` Events baut und `nostr.publish()` korrekt füttert.

- **Langfristig (Lib)**: Ein einfaches `publishText(content: string)` oder Overload für `publish(content: string, kind = 1)` anbieten.

---

## 5) Einheitliche DM-Nutzung in der App

- **Ist-Zustand**: App verwendet `nostr.getDM()?.with(pubkey).send(...)` – korrekt für Universal-DM.

- **Verbesserungen:**
  - Eingabevalidierung (npub/hex) zentralisieren. Die Lib konvertiert bereits npub→hex; in der App trotzdem früh validieren, um UX-Fehler zu vermeiden.
  - Fehlerkommunikation: Ergebnisse von `send()` prüfen und nutzerfreundlich anzeigen (z. B. leere Nachricht, zu lang, etc.).
  - Reaktive Anzeige: Konversationen als Stores konzipieren und UI systematisch via `$store` updaten (Svelte: bereits vorgesehen).

---

## 6) NostrService-Verschlankung (konkrete Edits)

- **Ziel**: Dünner Service, starke Lib. Bis zur Lib-Angleichung folgende Mappings einbauen:

```ts
// hasExtension
import { ExtensionSigner, LocalKeySigner } from 'nostr-unchained';
async hasExtension() {
  return await ExtensionSigner.isAvailable();
}

// useExtensionSigner / useLocalKeySigner
async useExtensionSigner() {
  const signer = new ExtensionSigner();
  await this.nostr.initializeSigning(signer);
  return { success: true, pubkey: await signer.getPublicKey() };
}
async useLocalKeySigner() {
  const signer = new LocalKeySigner();
  await this.nostr.initializeSigning(signer);
  return { success: true, pubkey: await signer.getPublicKey() };
}

// getSigningInfo
getSigningInfo() {
  const info = this.nostr.getDebugInfo();
  return { method: info.signingMethod, pubkey: this.nostr.me };
}

// getStats
getStats() {
  return this.nostr.getRelayStats();
}

// publish
async publish(content: string) {
  return await this.nostr.events.note(content).publish();
}
```

---

## 7) UX-Guards und leise Fehler

- **DM-Guards**: „DM verfügbar“ erst anzeigen, wenn `await nostr.getMe()` nicht `null` ist.
- **Inbox-Status**: Optionalen Indikator „DM-Inbox aktiv“ anzeigen, sobald `startUniversalGiftWrapSubscription()` einmal erfolgreich war (oder `UniversalDMModule` initialisiert ist).
- **Fehlertexte**: `ErrorHandler.formatErrorForUser()` aus der Lib im Service nutzen, um konsistente, hilfreiche Meldungen zu erzeugen.

---

## 8) Testbarkeit in der App

- **Ziel**: Stabilität der DM-Flows und Publishing sicherstellen.
- **Empfehlungen:**
  - Integrationstests gegen Test-Relays (docker-compose) regelmäßig ausführen (`test:infrastructure`).
  - DM-Edge-Cases (leer, lang, UTF‑8/Emoji) über Service testen und UI-Regressionen vermeiden.

---

## 9) Checkliste (App)

- [ ] Service-Wrapper wie oben skizziert ergänzen, bis die Lib Convenience-APIs liefert.
- [ ] DM-UI an Signer-Ready koppeln; keine DM-Funktionen vor `initializeSigning()`.
- [ ] Gift-Wrap-Subscription nicht doppelt aktivieren (entweder Lazy via `with()` oder explizit).
- [ ] `publish` auf Fluent-API umstellen.
- [ ] Debug-Logs in Prod reduzieren.
- [ ] Fehlermeldungen einheitlich ausgeben (Lib `ErrorHandler`).

---

## 10) Roadmap-Abgleich mit Library-Arbeiten

Sobald die Lib die geplanten Convenience-Methoden bereitstellt (siehe `NOSTR_UNCHAINED_LIB_CLEANUP.md`), kann der App-Service deutlich verschlankt werden. Ziel: minimaler Glue-Code, maximale Entdeckbarkeit direkt an der Lib.


