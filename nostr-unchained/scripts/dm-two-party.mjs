#!/usr/bin/env node
// Two-party DM E2E script using nostr-unchained against a real relay

import { NostrUnchained, EventBuilder, nsecToHex } from 'nostr-unchained';
import * as secp256k1 from '@noble/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';

// Minimal signer that accepts a provided private key (hex)
class RawKeySigner {
  constructor(privateKeyHex) {
    if (!/^[0-9a-f]{64}$/i.test(privateKeyHex)) {
      throw new Error('Invalid private key hex');
    }
    this.privateKey = privateKeyHex.toLowerCase();
    this.publicKey = bytesToHex(secp256k1.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() { return this.publicKey; }
  getPublicKeySync() { return this.publicKey; }
  async signEvent(event) {
    const id = EventBuilder.calculateEventId(event);
    const sig = await secp256k1.schnorr.sign(id, this.privateKey);
    return bytesToHex(sig);
  }
  async getPrivateKeyForEncryption() { return this.privateKey; }
}

function parseArgs(argv) {
  const args = { relay: 'ws://localhost:7777', nsecA: null, nsecB: null, msgA: 'Hello from Alice 👋', msgB: 'Hi Alice, Bob here! ✨', verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--relay' && val) { args.relay = val; i++; }
    if (key === '--nsecA' && val) { args.nsecA = val; i++; }
    if (key === '--nsecB' && val) { args.nsecB = val; i++; }
    if (key === '--msgA' && val) { args.msgA = val; i++; }
    if (key === '--msgB' && val) { args.msgB = val; i++; }
    if (key === '--verbose' || key === '-v') { args.verbose = true; }
  }
  return args;
}

async function createClient(relayUrl, signer) {
  const nostr = new NostrUnchained({ relays: [relayUrl], debug: true, timeout: 15000, signingProvider: signer });
  await nostr.connect();
  // Ensure inbox subscription starts
  await nostr.startUniversalGiftWrapSubscription();
  return nostr;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const args = parseArgs(process.argv);
  const relay = args.relay;

  // Prepare signers
  const pkHexA = args.nsecA ? nsecToHex(args.nsecA) : null;
  const pkHexB = args.nsecB ? nsecToHex(args.nsecB) : null;
  const signerA = new RawKeySigner(pkHexA || bytesToHex(secp256k1.utils.randomPrivateKey()));
  const signerB = new RawKeySigner(pkHexB || bytesToHex(secp256k1.utils.randomPrivateKey()));

  const pubA = await signerA.getPublicKey();
  const pubB = await signerB.getPublicKey();
  console.log('Alice:', pubA.slice(0, 16) + '...');
  console.log('Bob  :', pubB.slice(0, 16) + '...');
  console.log('Relay:', relay);

  const alice = await createClient(relay, signerA);
  const bob = await createClient(relay, signerB);

  // Setup conversations
  const aliceToBob = alice.getDM()?.with(pubB);
  const bobToAlice = bob.getDM()?.with(pubA);
  if (!aliceToBob || !bobToAlice) { throw new Error('DM module not available'); }

  // Give subs a moment to activate
  await wait(1000);

  // Helper to snapshot cache state for debugging
  const snapshotState = async (label, nostrClient, me, other) => {
    const wraps = nostrClient.query().kinds([1059]).tags('p', [me]).limit(50).execute().current || [];
    const dms = nostrClient.query().kinds([14]).tags('p', [me]).limit(50).execute().current || [];
    console.log(`[${label}] cache snapshot for ${me.slice(0,8)}..`);
    console.log(`  giftwraps(1059)->me: ${wraps.length}`);
    if (args.verbose && wraps.length) {
      const w = wraps.slice(-3);
      w.forEach((e,i) => console.log(`   • wrap#${wraps.length-3+i+1}: ${e.id.slice(0,8)}.. from ${e.pubkey.slice(0,8)}..`));
    }
    console.log(`  dms(14)->me: ${dms.length}`);
    if (args.verbose && dms.length) {
      const last = dms[dms.length-1];
      console.log(`   • last dm: kind=${last.kind} from=${last.pubkey.slice(0,8)}.. at=${last.created_at} content="${String(last.content).slice(0,60)}${String(last.content).length>60?'…':''}"`);
    }
  };

  await snapshotState('before-send:Alice', alice, pubA, pubB);
  await snapshotState('before-send:Bob', bob, pubB, pubA);

  // Send messages
  console.log('Alice → Bob (send):', args.msgA);
  const r1 = await aliceToBob.send(args.msgA);
  console.log('Send A->B result:', r1);

  console.log('Bob → Alice (send):', args.msgB);
  const r2 = await bobToAlice.send(args.msgB);
  console.log('Send B->A result:', r2);

  // Wait for delivery and decryption
  const t0 = Date.now();
  const maxWaitMs = 8000;
  let receivedA = false, receivedB = false;
  while (Date.now() - t0 < maxWaitMs) {
    const bobInbox = bobToAlice.messages || [];
    const aliceInbox = aliceToBob.messages || [];
    receivedA = !!bobInbox.find(m => m.content === args.msgA && m.sender === pubA);
    receivedB = !!aliceInbox.find(m => m.content === args.msgB && m.sender === pubB);
    if (receivedA && receivedB) break;
    if (args.verbose) {
      console.log(`⏳ waiting... bobInbox=${bobInbox.length} aliceInbox=${aliceInbox.length}`);
    }
    await wait(300);
  }
  const elapsed = Date.now() - t0;
  console.log(`⏱️ delivery latency: ${elapsed}ms (timeout ${maxWaitMs}ms)`);

  const bobInbox = bobToAlice.messages || [];
  const aliceInbox = aliceToBob.messages || [];

  const bobGotA = bobInbox.find(m => m.content === args.msgA && m.sender === pubA);
  const aliceGotB = aliceInbox.find(m => m.content === args.msgB && m.sender === pubB);

  console.log('Bob inbox count   :', bobInbox.length);
  console.log('Alice inbox count :', aliceInbox.length);
  console.log('Bob got Alice msg :', !!bobGotA, bobGotA ? `(id=${bobGotA.eventId?.slice(0,8)}.. ts=${bobGotA.timestamp})` : '');
  console.log('Alice got Bob msg :', !!aliceGotB, aliceGotB ? `(id=${aliceGotB.eventId?.slice(0,8)}.. ts=${aliceGotB.timestamp})` : '');

  await snapshotState('after-send:Alice', alice, pubA, pubB);
  await snapshotState('after-send:Bob', bob, pubB, pubA);

  const ok = !!bobGotA && !!aliceGotB;
  if (!ok) {
    if (args.verbose) {
      console.log('⚠️ Detailed failure context:');
      console.log('  A->B result:', r1);
      console.log('  B->A result:', r2);
    }
    console.error('DM E2E failed');
    process.exit(1);
  }

  console.log('✅ DM E2E success');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


