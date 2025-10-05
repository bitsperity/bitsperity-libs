### Nostr Connect (NIP‑46) – DX/UX‑Konzept für Library und App

Ziel: Remote‑Signer (NIP‑46) „first‑class“ integrieren – Library mit perfekter DX (0 Gedanken über Relays), App mit klarer UX (Modal mit npub + Relays, optional QR‑Pairing). Testziel: nsec.app.

---

### 1) Ist‑Analyse – Library (nostr‑unchained)

- Signing‑Interface:
```88:104:nostr-unchained/src/core/types.ts
export interface SigningProvider {
  getPublicKey(): Promise<string>;
  getPublicKeySync?(): string | null; // Optional synchronous access
  signEvent(event: UnsignedEvent): Promise<string>;
  // Optional NIP-44 capabilities
  nip44Encrypt?(peerPubkey: string, plaintext: string): Promise<string>;
  nip44Decrypt?(peerPubkey: string, ciphertext: string): Promise<string>;
  // Capability discovery
  capabilities?(): Promise<{ nip44Encrypt: boolean; nip44Decrypt: boolean }>;
}
```

- NostrConnectSigner (Client‑Seite, nutzt lokalen ephemeren Key für Transport):
```13:18:nostr-unchained/src/crypto/NostrConnectSigner.ts
export class NostrConnectSigner {
  private readonly remoteSignerPubkey: string;
  private readonly relays: string[];
  private readonly nostr: any; // NostrUnchained instance
  private readonly clientTransport: LocalKeySigner; // ephemeral client key
  private remoteUserPubkey: string | null = null;
```

- RPC‑Transport (heute): sendet 24133 via „normales“ publishSigned (ohne gezielte Relays):
```97:99:nostr-unchained/src/crypto/NostrConnectSigner.ts
    await this.nostr.publishSigned(signed);
    return await response;
}
```

- Auto‑Routing der Library (für normale Events, z. B. DMs/NIP‑72):
```680:689:nostr-unchained/src/core/NostrUnchained.ts
    // Auto-select relays for routing-sensitive NIPs (e.g., NIP-72, DMs)
    let autoTargets: string[] | null = null;
    try {
      autoTargets = await this.autoSelectRelaysForEvent(event as any);
    } catch {}

    // If autoTargets were found, use smart one-shot publish to those
    if (Array.isArray(autoTargets) && autoTargets.length > 0) {
      return await this.publishToRelaysSmart(event, autoTargets);
    }
```

- Routing‑sensitive Kinds (24133 ist hier nicht enthalten):
```870:872:nostr-unchained/src/core/NostrUnchained.ts
  private isRoutingSensitiveEventKind(kind: number): boolean {
    return kind === 34550 || kind === 1111 || kind === 4550 || kind === 4 || kind === 14 || kind === 1059;
  }
```

- NIP‑65 Router (optional, DX‑freundlich):
```19:23:nostr-unchained/src/relay/Nip65RelayRouter.ts
export class Nip65RelayRouter implements RelayRoutingStrategy {
  constructor(private relayList: RelayListModule, private normalizeUrl: (u: string) => string = (u) => u) {}

  async selectRelays(event: NostrEvent, defaultRelays: string[], ctx: RelayRoutingContext): Promise<string[]> {
```

Bewertung (Gaps):
- 24133‑Transport (NIP‑46) nutzt aktuell nicht zwingend die vom Remote‑Signer vorgegebenen Relays. Bei ungünstiger Konfiguration kann der Request den Remote‑Signer nicht erreichen.
- `ensureResponseSubscription()` abonniert Antworten ohne `.relays(this.relays)` – Antworten könnten verfehlt werden, wenn die Remote‑Relays nicht verbunden sind.
- `NostrConnectSigner` erfüllt das `SigningProvider`‑Interface strukturell (Methoden vorhanden), deklariert aber nicht explizit `implements` und bietet keine `capabilities()`. NIP‑44‑Funktionen fehlen (DM‑Senden benötigt `nip44Encrypt`).

Konsequenz:
- Für perfekte DX muss die Library 24133 strikt über die vom Remote‑Signer angegebenen Relays abwickeln (Publish + Sub), ohne dass App‑Entwickler Relays managen.

---

### 2) Ist‑Analyse – Frontend (nostr‑unchained‑app)

- Sign‑in Seite: Auswahl „Extension“/„Temporary“ vorhanden, kein Remote‑Signer:
```7:16:nostr-unchained-app/src/routes/(onboarding)/signin/+page.svelte
async function choose(type: 'extension' | 'temporary') {
  ...
  if (type === 'extension') {
    const res = await svc.useExtensionSigner();
    ...
  } else {
    const res = await svc.createTemporaryAccount();
```

- Service‑Layer (`NostrService`): Signer‑Wechsel und Re‑Init sind sauber kapselt; Remote‑Signer‑API fehlt noch:
```81:90:nostr-unchained-app/src/lib/services/NostrService.ts
private async createInstance(provider?: any): Promise<void> {
  const base: any = {
    relays: this.config.relays,
    debug: this.config.debug,
    timeout: this.config.timeout,
    routing: this.routingMode,
    ...(provider ? { signingProvider: provider } : {})
  };
  this.nostr = new NostrUnchained(base as any);
```

Bewertung (Gaps):
- Es fehlt eine UX für „Remote Signer (Nostr Connect)“ inkl. Modal (npub + Relays) und optional QR‑Pairing Token.
- Es fehlt eine einfache Service‑Methode, die den Remote‑Signer setzt und den Pairing‑Flow anstößt (URI erzeugen, Status prüfen).

---

### 3) Vision – Perfekte DX (Library)

Ziel: Remote‑Signer als Plug‑and‑Play `SigningProvider`. Devs konfigurieren nur `remoteSignerPubkey` + `relays` – der Rest passiert automatisch.

DX‑Prinzipien:
- 24133‑Events (NIP‑46) werden IMMER an `transportRelays` gesendet (one‑shot connect, publish, cleanup) – unabhängig vom globalen Routing.
- Antwort‑Subscription für 24133 wird IMMER gezielt über `transportRelays` erstellt.
- Fail‑fast & hilfreiche Fehlertexte (z. B. „No NIP‑46 relays configured“).
- Kein Eingriff in normales Publish‑Routing (Notes, Communities, DMs) – bleibt unverändert (inkl. NIP‑65 Router/Heuristiken).

Konkrete Anpassungen (Library):
- `src/crypto/NostrConnectSigner.ts`
  - Explizit `implements SigningProvider` (optional, aber lesbarer) und `capabilities(): { nip44Encrypt:false, nip44Decrypt:false }`.
  - In `ensureResponseSubscription()` `.sub().relays(this.relays)` nutzen und Query optional weglassen/als Cache‑Lookup beibehalten.
  - In `rpcRequest()` statt `publishSigned()` → `publishSignedToRelaysSmart(signed, this.relays, { resolveOnFirstOk:true, minAcks:1, overallTimeoutMs:10000 })`.
  - Saubere Normalisierung von Relay‑URLs (wss/ws + Strip Slash) vor Speicherung.

- Ergonomie‑Methode in `NostrUnchained` (optional, aber DX‑Gold):
  - `async useNostrConnect(options: { remoteSignerPubkey: string; relays: string[]; perms?: string[]; name?: string })` → erstellt `NostrConnectSigner`, ruft `initializeSigning()`, gibt `{ success, pubkey, clientToken }` zurück (Client‑Token optional für QR‑Pairing).

Grenzen/Scope (Phase 11):
- NIP‑44‐Funktionen (DM‑Senden) sind mit diesem Remote‑Signer nicht aktiv, da `nip44Encrypt` am Provider fehlt. DMs bleiben vorerst Extension/Local‑Keys vorbehalten. Erweiterungsidee (später): NIP‑46 RPC‑Calls `nip44_encrypt/decrypt`.

---

### 4) Vision – Optimale UX (Frontend)

Sign‑in/Settings‑Flow:
- Neue Option „Remote Signer (Nostr Connect)“ neben Extension/Temporary.
- Klick → Modal „Remote Signer verbinden“ mit Tabs:
  - Tab „Manuell“: Eingabefelder
    - **Signer npub**: `npub1...` (wird zu Hex normalisiert)
    - **Relays**: Mehrfachfeld, Defaults (leer oder Vorschlag), Validierung (ws/wss, ohne Slash)
  - Tab „QR‑Pairing (empfohlen)“: Button „Client‑Token erzeugen“, zeigt QR für `nostrconnect://<clientPub>?relay=...&perms=sign_event,get_public_key&name=<App>` – nsec.app scannt.

UX‑Verhalten:
- Nach Speichern: Service erstellt Provider, setzt ihn (`setSigningProvider`), triggert `initializeSigning()`.
- Statuszeile im Modal: „Gekoppelt als npub…“ sobald `getPublicKey()` des Remote‑Signers erfolgreich war.
- Fehlerzustände klar anzeigen (Relay unerreichbar, Timeout 10s, falsche npub, …).

App‑Integration (Service‑API):
- `NostrService.setSigningProvider(new NostrConnectSigner({ remoteSignerPubkey, relays, nostr }))`
- Helper `createNostrConnectPairing(relays, opts)` → `{ clientToken }` (QR anzeigen).
- Persistenz: `sessionStorage.setItem('selected_signer','remote')` (analog zu extension/temporary).

---

### 5) Testplan mit nsec.app

Prereqs:
- nsec.app geöffnet (mobil oder Desktop), Remote‑Signer bereit.
- In der App Remote‑Relays identisch auf beiden Seiten konfiguriert.

Manuell (npub + Relays):
1. In Modal npub des nsec.app‑Signers eintragen und 1–3 Relays hinzufügen (z. B. `wss://relay.nsec.app` sofern bekannt, oder gemeinsame öffentliche Relays).
2. Speichern → Provider wird gesetzt; sofortiger Verbindungs‑Test: `getPublicKey()` ruft Remote‑User‑npub ab.
3. Note (kind 1) publizieren → nsec.app zeigt Signier‑Prompt → bestätigen → PublishResult OK; Debug zeigt `targetRelays` nur aus Transport für 24133 und normales Routing für die Note.

QR‑Pairing:
1. „Client‑Token erzeugen“ klicken → QR erscheint.
2. In nsec.app „Connect“/„Scan“ → QR scannen → nsec.app zeigt Anfrage.
3. In App `getPublicKey()` ausführen → erfolgreicher Rückgabewert (User‑npub); dann Publish‑Test wie oben.

Negative Tests:
- Falsche/ohne Relays → 24133‑Timeout in 10s, klarer Fehlerhinweis.
- Entfernte Relays nach Pairing → neue Requests weiterhin one‑shot über angegebene Relays; bei Nichterreichbarkeit sauberer Fehler.

Abnahmekriterien:
- 24133‑Requests/Responses laufen ausschließlich über konfigurierte Transport‑Relays.
- Normale Publishes (kind 1/…): keine Regression; NIP‑65 Routing wie vorher.
- UX: Modal führt zuverlässig durch Manuell + QR; Status/Fehler sind eindeutig.

---

### 6) Implementierungs‑Skizze (kurz)

- Library (Änderungen in `NostrConnectSigner`):
  - `.sub().relays(this.relays)` in `ensureResponseSubscription()`
  - `publishSignedToRelaysSmart(..., this.relays, { resolveOnFirstOk:true, minAcks:1, overallTimeoutMs:10000 })` in `rpcRequest()`
  - `capabilities()` hinzufügen; optional `implements SigningProvider`
  - Optional: `NostrUnchained.useNostrConnect()` Convenience

- App:
  - Neue Option im Sign‑in + Modal `RemoteSignerModal.svelte` (Form + QR)
  - `NostrService`: Helper `createNostrConnectPairing()` und Pfad `setSigningProvider(provider)` nutzen
  - Persistenz‑Flags analog zu bestehenden Signern

---

### 7) Risiken & spätere Erweiterungen

- DMs (NIP‑44) mit Remote‑Signer: aktuell nicht möglich (kein `nip44Encrypt`). Spätere Erweiterung via NIP‑46‑RPC methoden oder Hybrid (Giftwrap‑basierter Pfad) denkbar.
- Relays‑Drift: Nutzer ändert Relays in nsec.app. Lösung: UI‑Hinweis/Sync‑Knopf, oder `transportRelays` als Array pflegen und UI‑seitig editierbar machen.

---

### 8) Zusammenfassung

- DX: Remote‑Signer wird wie ein normaler `SigningProvider` konsumiert – 24133 strikt über `transportRelays`, Subscriptions ebenso; App/Dev müssen keine Spezialfälle bedenken.
- UX: Einfaches Modal mit npub+Relays (und QR‑Pairing) – klarer Status, eindeutige Fehler. Tests mit nsec.app belegen Ende‑zu‑Ende.


