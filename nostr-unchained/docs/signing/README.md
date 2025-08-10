# 🔑 Remote Signing with Nostr Connect (NIP‑46)

This chapter explains what Nostr Connect is, why it’s useful, and how to use it with Nostr Unchained — no prior knowledge required.

## What is Nostr Connect (NIP‑46)?

- Remote signing: your app delegates signing to a remote signer (e.g., wallet) via relays.
- The app never sees your private key — it sends a signing request, the signer returns a signature.
- Transport is Nostr‑native: requests/responses are `kind: 24133` events encrypted with NIP‑44.

## Why it’s great

- Security: no private key in the client, reduced attack surface
- Flexibility: use trusted signers (mobile wallets), connect multiple clients
- Compliance: standardized protocol (NIP‑46)

## How it works

- The app creates a signed request (`kind: 24133`) to the signer; payload is NIP‑44 encrypted.
- The signer processes the request (via relay) and replies with `kind: 24133` (encrypted).
- Common RPCs: `get_public_key`, `sign_event`, optional `nip44_encrypt`/`nip44_decrypt`, `ping`.

## Requirements from the remote signer

- Signer `pubkey` (64‑hex)
- One or more relay URLs
- Often a `nostrconnect://...` URI that includes both

## Quickstart with Nostr Unchained

1) Installation/Setup wie üblich

```ts
import { NostrUnchained, NostrConnectSigner } from 'nostr-unchained';

const nostr = new NostrUnchained({ relays: ['wss://relay.example'] });
await nostr.connect();
```

2) Configure the remote signer

```ts
// Provided by remote signer (wallet/app)
const remoteSignerPubkey = 'fa984b...';
const signerRelays = ['wss://relay1.example', 'wss://relay2.example'];

// Minimal NIP‑46 client: uses an internal transport identity (ephemeral)
const remoteSigner = new NostrConnectSigner({
  remoteSignerPubkey,
  relays: signerRelays,
  nostr
});

// Switch app to remote signer
await nostr.useCustomSigner(remoteSigner);
```

3) Continue as normal — publish, read, etc.

```ts
// Hinweis: publish() nutzt nun den Remote‑Signer
await nostr.events.note('Hello from remote signing!').publish();
```

## Client‑initiated flow: create nostrconnect:// token

Du kannst einen Verbindungs‑Token erzeugen, den der Remote‑Signer konsumiert. Damit können Permissions/Relays vorab kommuniziert werden.

```ts
const token = await remoteSigner.createClientToken({
  name: 'My Web App',
  relays: ['wss://relay1.example','wss://relay2.example'],
  perms: ['sign_event:1','sign_event:14','nip44_encrypt','nip44_decrypt']
});

// Show as QR or link
console.log(token);
// e.g. nostrconnect://<client-pubkey>?relay=wss%3A%2F%2Frelay1.example&...
```

## Full example including nostrconnect:// URI parsing

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

## Errors & timeouts

- No signer online → request timeout (~10s)
- Wrong `pubkey`/relays → signer never sees the request
- Signer error → RPC response contains `error`; library throws with that message

## Current limitations

- Focus: minimal flow `get_public_key` & `sign_event`.
- Not yet implemented:
  - `connect` handshake/permissions
  - Auth challenges/redirect flows
  - Additional RPCs (`nip04_*`, `nip44_*`)
- Production: implement handshake/permissions for real deployments.

## Best practices

- Use trusted signers, ideally with NIP‑05/NIP‑89
- Use multiple relays (redundancy)
- Clear UX for pending/denied requests
- Combine with NIP‑42 if relays require auth

## TL;DR

- Nostr Connect = remote signing via Nostr (`24133` + NIP‑44)
- In Nostr Unchained: `new NostrConnectSigner({ remoteSignerPubkey, relays, nostr })` → `nostr.useCustomSigner(...)`
- App never sees the private key — better security, better DX
