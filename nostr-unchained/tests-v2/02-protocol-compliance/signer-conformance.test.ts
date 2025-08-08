import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/index.js';
import type { SigningProvider, UnsignedEvent } from '../../src/core/types.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

class Nip44OnlySigner implements SigningProvider {
  private inner: LocalKeySigner;

  constructor() {
    this.inner = new LocalKeySigner();
  }

  async getPublicKey(): Promise<string> {
    return this.inner.getPublicKey();
  }

  getPublicKeySync(): string | null {
    return this.inner.getPublicKeySync?.() || null;
  }

  async signEvent(event: UnsignedEvent): Promise<string> {
    return this.inner.signEvent(event);
  }

  async capabilities(): Promise<{ nip44Encrypt: boolean; nip44Decrypt: boolean; rawKey: boolean }> {
    return { nip44Encrypt: true, nip44Decrypt: true, rawKey: false };
  }

  async nip44Encrypt(peerPubkey: string, plaintext: string): Promise<string> {
    return this.inner.nip44Encrypt!(peerPubkey, plaintext);
  }

  async nip44Decrypt(peerPubkey: string, ciphertext: string): Promise<string> {
    return this.inner.nip44Decrypt!(peerPubkey, ciphertext);
  }
}

class NoDecryptSigner extends Nip44OnlySigner {
  async capabilities(): Promise<{ nip44Encrypt: boolean; nip44Decrypt: boolean; rawKey: boolean }> {
    return { nip44Encrypt: true, nip44Decrypt: false, rawKey: false };
  }
  async nip44Decrypt(): Promise<string> {
    throw new Error('NIP-44 decrypt not supported');
  }
}

const RELAY = 'ws://localhost:7777';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('SigningProviderV1 Conformance (nip44-only, no raw key)', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;

  beforeAll(async () => {
    alice = new NostrUnchained({ relays: [RELAY], debug: true, timeout: 15000, signingProvider: new Nip44OnlySigner() });
    bob = new NostrUnchained({ relays: [RELAY], debug: true, timeout: 15000, signingProvider: new Nip44OnlySigner() });
    await alice.connect();
    await bob.connect();
  });

  afterAll(async () => {
    await alice.disconnect();
    await bob.disconnect();
  });

  it('should send and decrypt DMs successfully with nip44-only signers', async () => {
    const alicePub = await alice.getPublicKey();
    const bobPub = await bob.getPublicKey();

    // Trigger lazy inbox
    bob.getDM()?.with(alicePub);
    alice.getDM()?.with(bobPub);

    const sendResult = await alice.getDM()!.with(bobPub).send('Conformance DM ✅');
    expect(sendResult.success).toBe(true);

    // Wait for relay propagation and cache processing
    await wait(500);

    const bobConv = bob.getDM()!.with(alicePub);

    // Pull messages via store subscription once
    let received = 0;
    const unsubscribe = bobConv.subscribe((msgs) => {
      received = msgs.filter(m => m.content.includes('Conformance DM')).length;
    });
    await wait(500);
    unsubscribe();

    expect(received).toBeGreaterThan(0);
  });
});

describe('Negative path: receiver without nip44Decrypt capability', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;

  beforeAll(async () => {
    alice = new NostrUnchained({ relays: [RELAY], debug: true, timeout: 15000, signingProvider: new Nip44OnlySigner() });
    bob = new NostrUnchained({ relays: [RELAY], debug: true, timeout: 15000, signingProvider: new NoDecryptSigner() });
    await alice.connect();
    await bob.connect();
  });

  afterAll(async () => {
    await alice.disconnect();
    await bob.disconnect();
  });

  it('should store gift wraps but not decrypt into kind 14 without decryptor', async () => {
    const alicePub = await alice.getPublicKey();
    const bobPub = await bob.getPublicKey();

    // Trigger lazy inbox attempt
    bob.getDM()?.with(alicePub);
    alice.getDM()?.with(bobPub);

    const sendResult = await alice.getDM()!.with(bobPub).send('No-decrypt DM ❌');
    expect(sendResult.success).toBe(true);

    await wait(700);

    // Recipient should not see decrypted kind:14
    const conv = bob.getDM()!.with(alicePub);
    let decryptedCount = 0;
    const unsub = conv.subscribe((msgs) => {
      decryptedCount = msgs.length;
    });
    await wait(400);
    unsub();
    expect(decryptedCount).toBe(0);

    // But gift wrap 1059 should be queryable in cache store (no decrypt)
    // Note: Gift Wrap author is ephemeral; filter by #p tag (recipient) instead of authors
    const wrapStore = bob.query().kinds([1059]).tags('p', [bobPub]).execute();
    let count = wrapStore.current.length;
    // Give cache a bit of time to ingest via subscription
    await wait(400);
    count = wrapStore.current.length;
    expect(count).toBeGreaterThan(0);
  });
});


