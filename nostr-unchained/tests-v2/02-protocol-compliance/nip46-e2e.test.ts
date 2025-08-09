import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import { NostrUnchained, LocalKeySigner, EventBuilder } from '../../src/index.js';

describe('Protocol Compliance: NIP-46 Remote Signing End-to-End (in-process harness)', () => {
  let appUser: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let harnessNostr: NostrUnchained;
  let remoteSigner: LocalKeySigner; // acts as the remote signer's keypair
  let remotePubkey: string;

  beforeAll(async () => {
    appUser = await testEnv.createTestUser('AppClient');
    harnessNostr = new NostrUnchained({ relays: [testEnv.relayUrl], debug: false } as any);
    await harnessNostr.connect();
    remoteSigner = new LocalKeySigner();
    remotePubkey = await remoteSigner.getPublicKey();
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should sign and publish a note via remote signer over kind 24133', async () => {
    const appNostr: any = appUser.nostr;

    // Start remote-signer harness listener for requests addressed to remotePubkey
    const requestHandle = await harnessNostr
      .sub()
      .kinds([24133])
      .tags('p', [remotePubkey])
      .execute();
    const requestStore = requestHandle.store;
    requestStore.subscribe(async (events: any[]) => {
      for (const ev of events) {
        try {
          const clientPubkey = ev.pubkey; // author of the request
          const decrypted = await remoteSigner.nip44Decrypt!(clientPubkey, ev.content);
          const msg = JSON.parse(decrypted);
          if (msg.method === 'get_public_key') {
            const payload = JSON.stringify({ id: msg.id, result: remotePubkey });
            const cipher = await remoteSigner.nip44Encrypt!(clientPubkey, payload);
            const unsigned = {
              pubkey: remotePubkey,
              created_at: Math.floor(Date.now() / 1000),
              kind: 24133,
              tags: [['p', clientPubkey]],
              content: cipher
            } as const;
            const id = EventBuilder.calculateEventId(unsigned as any);
            const sig = await remoteSigner.signEvent(unsigned as any);
            await harnessNostr.publishSigned({ ...(unsigned as any), id, sig } as any);
          } else if (msg.method === 'sign_event') {
            const [json] = msg.params;
            const e = JSON.parse(json);
            // Ensure pubkey matches the remote signer's pubkey
            e.pubkey = remotePubkey;
            const id = EventBuilder.calculateEventId(e);
            const sig = await remoteSigner.signEvent(e);
            const signed = { ...e, id, sig };
            const payload = JSON.stringify({ id: msg.id, result: JSON.stringify(signed) });
            const cipher = await remoteSigner.nip44Encrypt!(clientPubkey, payload);
            const unsigned = {
              pubkey: remotePubkey,
              created_at: Math.floor(Date.now() / 1000),
              kind: 24133,
              tags: [['p', clientPubkey]],
              content: cipher
            } as const;
            const rid = EventBuilder.calculateEventId(unsigned as any);
            const rsig = await remoteSigner.signEvent(unsigned as any);
            await harnessNostr.publishSigned({ ...(unsigned as any), id: rid, sig: rsig } as any);
          }
        } catch {
          // ignore malformed
        }
      }
    });

    // Configure app to use NostrConnectSigner pointing to harness remote signer
    const { NostrConnectSigner } = await import('../../src/index.js');
    const signer = new (NostrConnectSigner as any)({
      remoteSignerPubkey: remotePubkey,
      relays: [testEnv.relayUrl],
      nostr: appNostr
    });
    await appNostr.useCustomSigner(signer);

    // Now publish a note - should trigger get_public_key + sign_event via harness
    const res = await appNostr.events.note('Signed via NIP-46 harness').publish();
    expect(res.success).toBe(true);

    // Verify note appears via subscription
    const sub = appNostr.sub().kinds([1]).authors([await appNostr.getPublicKey()]).execute();
    await testEnv.waitForSubscription(800);
    const q = appNostr.query().kinds([1]).authors([await appNostr.getPublicKey()]).execute();
    const events = q.current || [];
    const found = events.find((e: any) => e.content.includes('Signed via NIP-46 harness'));
    expect(!!found).toBe(true);
  }, 25000);
});


