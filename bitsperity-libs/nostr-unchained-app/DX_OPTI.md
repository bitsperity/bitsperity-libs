### DX-Optimierungen für nostr-unchained-app

Dieser Leitfaden dokumentiert konkrete DX-Probleme in der App-Integration von `nostr-unchained` und liefert klare Lösungsvorschläge inklusive API-Angleichungen, Architekturhinweisen und kurzfristigen Workarounds. Fokus: DM-Flow (NIP-44/NIP-59), Signer/Encryption und reaktive Stores.

---

## 1) API-Mismatches zwischen App und Library

- Probleme:
  - App erwartet `hasExtension()`, `useExtensionSigner()`, `useLocalKeySigner()`, `getSigningInfo()`, `getStats()`, `publish(content: string)`.
  - Lib bietet aktuell: `getRelayStats()`, `publish(unsignedEvent)`, `getDebugInfo()`.
- Kurzfristige App-Lösungen (kompatible Wrapper im Service):
  - `hasExtension()` → `ExtensionSigner.isAvailable()` statisch aufrufen.
  - `useExtensionSigner()` → `new ExtensionSigner()` erstellen und `nostr.initializeSigning(provider)`.
  - `useLocalKeySigner()` → `new LocalKeySigner()` erstellen und `nostr.initializeSigning(provider)`.
  - `getSigningInfo()` → aus `nostr.getDebugInfo()` + `nostr.getMe()` ableiten.
  - `getStats()` → `nostr.getRelayStats()` nutzen.
  - `publish(content: string)` → `nostr.events.note(content).publish()` verwenden.
- Langfristig (Lib‑Änderung vorgesehen): Convenience‑APIs direkt in `NostrUnchained` (siehe Cleanup‑Dokument B1/E).

---

## 2) DM-Ready-Flow und Gift-Wrap-Subscription

- Problem: Manuelles Starten der Inbox/Subscriptions in der App erzeugt Race‑Conditions.
- Empfehlung:
  - Nach `initializeSigning(provider)` erst DM verwenden:
    ```ts
    await nostr.initializeSigning(provider);
    const dm = nostr.getDM()?.with(recipientHexOrNpub);
    ```
  - Lazy‑Start über `with()` nutzen; kein paralleles manuelles Starten.
  - UI‑Guard: DM‑Bereich erst anzeigen, wenn `await nostr.getMe()` nicht `null` ist.

---

## 3) Logging und Debug-Kontrolle

- Problem: Versions‑Log in der Lib aktuell immer aktiv (stört Prod‑Konsole).
- App‑Seite: Debug‑Logs kapseln; Prod‑Builds minimieren.
- Sobald Lib angepasst: Alle Logs an `config.debug` gebunden (siehe Cleanup B2/L).

---

## 4) Publish-DX in der App

- Problem: `nostr.publish(content)` nicht vorhanden.
- Workaround:
  ```ts
  await nostr.events.note(content).publish();
  ```
- Nach Lib‑Angleichung: `publish(content: string, kind=1)` direkt nutzbar.

---

## 5) Einheitliche DM-Nutzung in der App

- Ist: `nostr.getDM()?.with(pubkey).send(...)` (UniversalDM) – richtig.
- Verbesserungen:
  - Eingabevalidierung früh (npub/hex) und klare Fehler.
  - `send()` Ergebnis prüfen und nutzerfreundlich anzeigen.
  - Reaktive Anzeige über Stores beibehalten.

---

## 6) Security-Guards und Fallbacks

- Verbot: Keine Raw‑Private‑Keys in der App anfordern/loggen/halten.
- Wenn `nip44Decrypt` fehlt:
  - UI zeigt Hinweis „DM‑Decrypt nicht verfügbar“.
  - DMs weiterhin empfangbar (Gift Wraps cachen), aber nicht lokal entschlüsselbar.
- Keine Dev‑Fallback‑Keys im App‑Code verwenden.

---

## 7) NostrService-Verschlankung (Wrapper bis Lib-Update)

```ts
import { ExtensionSigner, LocalKeySigner } from 'nostr-unchained';

async function hasExtension() {
  return await ExtensionSigner.isAvailable();
}

async function useExtensionSigner(nostr) {
  const signer = new ExtensionSigner();
  await nostr.initializeSigning(signer);
  return { success: true, pubkey: await signer.getPublicKey() };
}

async function useLocalKeySigner(nostr) {
  const signer = new LocalKeySigner();
  await nostr.initializeSigning(signer);
  return { success: true, pubkey: await signer.getPublicKey() };
}

function getSigningInfo(nostr) {
  const info = nostr.getDebugInfo();
  return { method: info.signingMethod, pubkey: nostr.me };
}

function getStats(nostr) {
  return nostr.getRelayStats();
}

async function publish(nostr, content) {
  return await nostr.events.note(content).publish();
}
```

---

## 8) UX-Guards und Fehlertexte

- DM erst bei `getMe() !== null` aktivieren.
- Inbox‑Status optional anzeigen (wenn Universal‑Gift‑Wrap‑Subscription aktiv ist).
- Fehlertexte über `ErrorHandler.formatErrorForUser()` standardisieren.

---

## 9) Testbarkeit in der App

- Regelmäßig Integrationstests gegen Test‑Relays ausführen.
- DM‑Edge‑Cases (leer/zu lang/UTF‑8) automatisiert prüfen.

---

## 10) Roadmap‑Abgleich

- Nach Lib‑Updates (Convenience‑APIs, Logging‑Policy, Decryptor‑Only) kann der Service vereinfacht werden (Wrapper entfernen), App‑DX steigt.