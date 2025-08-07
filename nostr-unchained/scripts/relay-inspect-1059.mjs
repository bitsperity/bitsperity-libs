#!/usr/bin/env node
// Inspect a relay for gift wraps (1059) to a specific recipient and show unwrap status

import { NostrUnchained, nsecToHex } from 'nostr-unchained';
import * as secp256k1 from '@noble/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';

class RawKeySigner {
  constructor(hex) {
    this.sk = hex.toLowerCase();
    this.pk = bytesToHex(secp256k1.schnorr.getPublicKey(this.sk));
  }
  async getPublicKey(){ return this.pk; }
  getPublicKeySync(){ return this.pk; }
  async signEvent(e){ const { EventBuilder } = await import('nostr-unchained'); const id = EventBuilder.calculateEventId(e); return bytesToHex(await secp256k1.schnorr.sign(id, this.sk)); }
  async getPrivateKeyForEncryption(){ return this.sk; }
}

function parseArgs(argv){
  const args = { relay: 'ws://localhost:7777', nsec: null, since: 0, limit: 50 };
  for (let i=2;i<argv.length;i++){
    const k = argv[i], v = argv[i+1];
    if (k === '--relay' && v) { args.relay = v; i++; }
    if (k === '--nsec' && v) { args.nsec = v; i++; }
    if (k === '--since' && v) { args.since = Number(v)||0; i++; }
    if (k === '--limit' && v) { args.limit = Number(v)||50; i++; }
  }
  return args;
}

async function main(){
  const args = parseArgs(process.argv);
  if (!args.nsec) { console.error('Usage: relay-inspect-1059.mjs --relay ws://host:port --nsec <nsec1...> [--since <unix>] [--limit <n>]'); process.exit(1); }
  const sk = nsecToHex(args.nsec);
  const signer = new RawKeySigner(sk);
  const me = await signer.getPublicKey();
  console.log('Relay:', args.relay);
  console.log('Me   :', me);

  const nostr = new NostrUnchained({ relays:[args.relay], signingProvider: signer, debug: true });
  await nostr.connect();
  await nostr.startUniversalGiftWrapSubscription();

  // Live sub for 1059 to me
  const handle = await nostr.sub().kinds([1059]).tags('p',[me]).limit(args.limit).execute();
  console.log('📡 Live 1059 sub started');

  // Snapshot current 1059 and kind14 to me
  const wrapsStore = nostr.query().kinds([1059]).tags('p',[me]).limit(args.limit).execute();
  const dmsStore = nostr.query().kinds([14]).tags('p',[me]).limit(args.limit).execute();
  const logSnapshot = (label)=>{
    const wraps = wrapsStore.current||[];
    const dms = dmsStore.current||[];
    console.log(`[${label}] wraps(1059)->me=${wraps.length} dms(14)->me=${dms.length}`);
    wraps.slice(-5).forEach((e,i)=> console.log(`  • wrap#${wraps.length-5+i+1}: ${e.id.slice(0,8)}.. from ${e.pubkey.slice(0,8)}.. ts=${e.created_at}`));
    dms.slice(-5).forEach((e,i)=> console.log(`  • dm#${dms.length-5+i+1}: kind=${e.kind} from=${e.pubkey.slice(0,8)}.. ts=${e.created_at} content="${String(e.content).slice(0,60)}${String(e.content).length>60?'…':''}"`));
  };

  logSnapshot('initial');
  let lastW = wrapsStore.current?.length||0, lastD = dmsStore.current?.length||0;
  wrapsStore.subscribe((evs)=>{
    if (!evs) return;
    if (evs.length !== lastW){
      console.log(`📨 wraps(1059) update: ${evs.length}`);
      evs.slice(-3).forEach((e,i)=> console.log(`   • ${e.id.slice(0,8)}.. from ${e.pubkey.slice(0,8)}..`));
      lastW = evs.length;
      logSnapshot('after-wrap-update');
    }
  });
  dmsStore.subscribe((evs)=>{
    if (!evs) return;
    if (evs.length !== lastD){
      console.log(`📩 dms(14) update: ${evs.length}`);
      evs.slice(-3).forEach((e,i)=> console.log(`   • dm ${e.id?.slice?.(0,8)||''} from ${String(e.pubkey).slice(0,8)}..`));
      lastD = evs.length;
    }
  });

  console.log('⏳ Inspecting for 30s...');
  setTimeout(async ()=>{
    await handle.stop();
    logSnapshot('final');
    process.exit(0);
  }, 30000);
}

main().catch(err=>{ console.error(err); process.exit(1); });


