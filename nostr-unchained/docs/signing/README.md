# 🔑 Remote Signing mit Nostr Connect (NIP‑46)

Dieses Kapitel erklärt Schritt für Schritt, was Nostr Connect ist, warum es nützlich ist, und wie du es mit Nostr Unchained verwendest – ohne Vorwissen.

## Was ist Nostr Connect (NIP‑46)?

- "Remote Signing" bedeutet: Deine App signiert Events nicht selbst, sondern beauftragt einen getrennten "Remote‑Signer" (z. B. deine Wallet/App) über einen Relay‑Kanal.
- Die App sieht niemals deinen Private Key. Sie sendet nur eine Signaturanfrage, der Remote‑Signer antwortet mit einer Signatur.
- Transport ist Nostr‑nativ: Anfragen/Antworten laufen als Events vom Typ `kind: 24133` und sind mit NIP‑44 Ende‑zu‑Ende verschlüsselt.

## Warum ist das gut?

- Sicherheit: Kein Private Key im Browser/Frontend. Minimiert Angriffsfläche.
- Geräte‑/App‑Flexibilität: Du kannst einen vertrauenswürdigen Signer (z. B. Mobile Wallet) verwenden und mehrere Clients anbinden.
- Compliance: Standardisiertes Protokoll (NIP‑46), verbreitet in modernen Nostr‑Apps.

## Wie funktioniert das technisch?

- Die App erzeugt eine signierte Anfrage (Event `kind: 24133`) an den Remote‑Signer. Inhalt (JSON‑RPC ähnlich) wird mit NIP‑44 verschlüsselt.
- Der Remote‑Signer liest diese Anfrage (über Relay), prüft Berechtigungen und antwortet ebenfalls mit `kind: 24133` (verschlüsselt) zurück.
- Übliche Methoden: `get_public_key`, `sign_event`, optional `nip44_encrypt`/`nip44_decrypt`, `ping` usw.

## Was brauchst du vom Remote‑Signer?

- Seine `pubkey` (64‑stellige Hex).
- Eine oder mehrere Relay‑URLs, auf denen er Nachrichten empfängt.
- Häufig stellt der Signer einen Verbindungs‑URI bereit (z. B. `nostrconnect://...`), aus dem du `pubkey` und `relay` Werte ausliest.

## Quickstart mit Nostr Unchained

1) Installation/Setup wie üblich

```ts
import { NostrUnchained, NostrConnectSigner } from 'nostr-unchained';

const nostr = new NostrUnchained({ relays: ['wss://relay.example'] });
await nostr.connect();
```

2) Remote‑Signer konfigurieren

```ts
// Diese Werte kommen vom Remote‑Signer (App/Wallet)
const remoteSignerPubkey = 'fa984b...';
const signerRelays = ['wss://relay1.example', 'wss://relay2.example'];

// Minimaler NIP‑46‑Client: nutzt eine interne Transport‑Identität (ephemeral)
const remoteSigner = new NostrConnectSigner({
  remoteSignerPubkey,
  relays: signerRelays,
  nostr
});

// App auf Remote‑Signatur umstellen
await nostr.useCustomSigner(remoteSigner);
```

3) Normal weiterarbeiten – publizieren, lesen, etc.

```ts
// Hinweis: publish() nutzt nun den Remote‑Signer
await nostr.events.note('Hallo aus Remote‑Signing!').publish();
```

## Client‑initiierter Flow: nostrconnect:// Token erzeugen

Du kannst einen Verbindungs‑Token erzeugen, den der Remote‑Signer konsumiert. Damit können Permissions/Relays vorab kommuniziert werden.

```ts
const token = await remoteSigner.createClientToken({
  name: 'My Web App',
  relays: ['wss://relay1.example','wss://relay2.example'],
  perms: ['sign_event:1','sign_event:14','nip44_encrypt','nip44_decrypt']
});

// Anzeige als QR oder Link
console.log(token);
// z.B. nostrconnect://<client-pubkey>?relay=wss%3A%2F%2Frelay1.example&...
```

## Vollständiges Beispiel inkl. Parse eines nostrconnect:// URIs

Einige Signer geben eine `nostrconnect://` URL aus. Hier ein simples Beispiel, wie du `pubkey` und `relays` extrahierst:

```ts
function parseNostrConnect(uri: string): { pubkey: string; relays: string[] } {
  // Erwartetes Format: nostrconnect://<pubkey>?relay=wss%3A%2F%2F...&relay=wss%3A%2F%2F...
  if (!uri.startsWith('nostrconnect://')) throw new Error('Invalid nostrconnect URI');
  const body = uri.replace('nostrconnect://', '');
  const [pubkey, query] = body.split('?');
  const params = new URLSearchParams(query || '');
  const relays = params.getAll('relay').map((r) => decodeURIComponent(r));
  return { pubkey, relays };
}

const uri = 'nostrconnect://fa984b...?relay=wss%3A%2F%2Frelay1.example&relay=wss%3A%2F%2Frelay2.example';
const { pubkey, relays } = parseNostrConnect(uri);

const signer = new NostrConnectSigner({ remoteSignerPubkey: pubkey, relays, nostr });
await nostr.useCustomSigner(signer);
```

## Fehlerbilder & Timeouts

- Kein echter Remote‑Signer online → Anfragen laufen ins Timeout (Default ~10s) mit Fehlermeldung `NIP-46 request timeout`.
- Falsche `pubkey`/Relay‑Liste → Der Signer sieht die Anfrage nicht, ebenfalls Timeout.
- Fehlermeldung vom Signer → Die RPC‑Antwort enthält `error`; die Library wirft einen Fehler mit dieser Nachricht.

## Grenzen dieser ersten Implementierung

- Fokus: Minimal‑Flow `get_public_key` & `sign_event`.
- Noch nicht implementiert:
  - `connect`‑Handshake/Permissions (Secret, Permission Strings).
  - Auth‑Challenges/Redirect‑Flows.
  - Zusätzliche Methoden (`nip04_*`, `nip44_*`) via Remote‑Signer.
- Sicherheit/Produktionsbetrieb: Für echte Produktions‑Remote‑Signer bitte Handshake/Permissions ergänzen (Roadmap).

## Best Practices

- Verwende Remote‑Signer aus vertrauenswürdigen Quellen (Wallets/Apps), ideal mit NIP‑05/NIP‑89 Discovery.
- Nutze mehrere Relays (Redundanz).
- Zeige dem User klar an, wenn Requests warten/abgelehnt wurden.
- Kombiniere mit NIP‑42 (Relay Auth), wenn deine Relays Auth erzwingen.

## TL;DR

- Nostr Connect = Remote‑Signing via Nostr (Events `24133` + NIP‑44 Verschlüsselung).
- In Nostr Unchained: `new NostrConnectSigner({ remoteSignerPubkey, relays, nostr })` → `nostr.useCustomSigner(...)` → fertig.
- App sieht nie den Private Key – bessere Sicherheit, bessere DX.
