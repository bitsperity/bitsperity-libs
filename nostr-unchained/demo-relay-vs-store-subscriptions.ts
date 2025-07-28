/**
 * Demo: Relay vs Store Subscriptions - Unterschied klären
 * 
 * Zeigt den wichtigen Unterschied zwischen:
 * 1. RELAY Subscriptions (WebSocket zu Nostr Relays)
 * 2. STORE Subscriptions (Reactive UI Updates)
 */

import { NostrUnchained } from './src/core/NostrUnchained.js';

async function demoRelayVsStoreSubscriptions() {
  console.log('🔍 Demo: Relay vs Store Subscriptions');
  
  const nostr = new NostrUnchained({ debug: true });
  await nostr.initializeSigning();
  const myPubkey = await nostr.getPublicKey();
  
  console.log('\n📡 1. RELAY SUBSCRIPTIONS (WebSocket zu Nostr Relays):');
  console.log('Das sind die eigentlichen Nostr-Protokoll Subscriptions\n');
  
  console.log('❌ SCHLECHT - User muss manuell gift wrap subscription machen:');
  console.log(`
  // User müsste das machen (NICHT Zero-Config DX!):
  await nostr.sub()
    .kinds([1059])           // Gift wraps - WTF ist das?
    .tags('p', [myPubkey])   // Für mich - Warum muss ich das wissen?
    .execute();              // WebSocket subscription starten
  
  const chat = nostr.dm.with(friendPubkey);
  `);
  
  console.log('✅ GUT - Gift wrap subscription passiert automatisch:');
  console.log(`
  // User macht nur das (Zero-Config DX!):
  await nostr.connect();   // ✅ Startet automatisch gift wrap subscription!
  
  const chat = nostr.dm.with(friendPubkey);
  `);
  
  console.log('\n📱 2. STORE SUBSCRIPTIONS (Reactive UI Updates):');
  console.log('Das sind Svelte Store subscriptions für UI reactvity\n');
  
  console.log('✅ Das muss der User machen (ist educativ und eingängig):');
  console.log(`
  const chat = nostr.dm.with(friendPubkey);
  
  // Das ist eine STORE subscription (nicht Relay!):
  chat.subscribe(messages => {
    console.log('New messages:', messages); // UI Update!
  });
  `);
  
  console.log('\n🎯 ANTWORT AUF DEINE FRAGE:');
  console.log('📡 RELAY Subscriptions → ✅ AUTOMATISCH bei connect()');
  console.log('📱 STORE Subscriptions → ✅ MANUELL durch User (educativ)');
  
  console.log('\n🔧 Was aktuell automatisch passiert:');
  
  await nostr.connect(); // Das startet automatisch:
  console.log('✅ Gift wrap RELAY subscription (kind 1059) gestartet');
  
  console.log('\n📋 Was der User machen muss:');
  console.log('✅ connect() - bewusste Entscheidung');
  console.log('✅ dm.with() - eingängig'); 
  console.log('✅ chat.subscribe() - STORE subscription, educativ');
  
  console.log('\n🏆 FAZIT:');
  console.log('✅ RELAY subs → automatisch (User weiß nichts von kind 1059)');
  console.log('✅ STORE subs → manuell (User lernt reactive programming)');
  console.log('✅ Perfekte Balance zwischen Zero-Config und Education!');
}

demoRelayVsStoreSubscriptions().catch(console.error);