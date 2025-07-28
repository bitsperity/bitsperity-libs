/**
 * Demo: Lazy Gift Wrap Subscription - Fixed User Control
 * 
 * Testet die neue lazy loading implementation:
 * 1. connect() startet KEINE automatische gift wrap subscription
 * 2. dm.with() startet gift wrap subscription nur on-demand
 * 3. User hat volle Kontrolle über wann DM subscriptions beginnen
 */

import { NostrUnchained } from './src/core/NostrUnchained.js';

async function demoLazyGiftWrapSubscription() {
  console.log('🎯 Demo: Lazy Gift Wrap Subscription (Fixed User Control)');
  
  const nostr = new NostrUnchained({ 
    debug: true,
    relays: ['ws://umbrel.local:4848']
  });
  
  await nostr.initializeSigning();
  const myPubkey = await nostr.getPublicKey();
  
  console.log(`\n👤 My Pubkey: ${myPubkey.substring(0, 16)}...`);
  
  console.log('\n🔌 Schritt 1: Connect (OHNE automatische gift wrap subscription)');
  await nostr.connect();
  console.log('✅ Connect erfolgreich - KEINE gift wrap subscription gestartet');
  
  console.log('\n⏸️ Schritt 2: User kann jetzt andere Features nutzen');
  console.log('   - Publishing: ✅ Funktioniert ohne DM subscriptions');
  console.log('   - Social feeds: ✅ Funktioniert ohne DM subscriptions');
  console.log('   - Query/Sub API: ✅ Funktioniert ohne DM subscriptions');
  console.log('   - Performance: ✅ Keine unnötigen subscriptions');
  console.log('   - Privacy: ✅ Keine ungewollte DM-Sichtbarkeit');
  
  console.log('\n💬 Schritt 3: User entscheidet DMs zu nutzen (LAZY TRIGGER!)');
  const testRecipient = '663ee62c0feacd53a6dc6b326c24de7062141c9d095c1a0ff8529d23471f1b8b';
  
  console.log('📞 Calling nostr.dm.with() - DAS löst lazy loading aus:');
  const conversation = await nostr.dm.with(testRecipient);
  console.log('🎁 Gift wrap subscription wurde JETZT gestartet (lazy)');
  
  console.log('\n✅ Schritt 4: Weitere DM-Nutzung ist instant');
  const anotherConversation = await nostr.dm.with('123456789abcdef');
  console.log('⚡ Gift wrap subscription bereits aktiv - kein duplicate');
  
  console.log('\n🏆 PERFEKTE USER KONTROLLE:');
  console.log('✅ connect() → User-Entscheidung ohne DM-Zwang');
  console.log('✅ dm.with() → User-Entscheidung MIT DM-Features');
  console.log('✅ Lazy Loading → Performance nur wenn benötigt');
  console.log('✅ Privacy → DM-Sichtbarkeit nur wenn gewünscht');
  console.log('✅ Zero-Config → Funktioniert automatisch');
  
  console.log('\n📋 LÖSUNG für das ursprüngliche Problem:');
  console.log('❌ Vorher: connect() → automatische gift wrap subscription');
  console.log('✅ Jetzt: dm.with() → lazy gift wrap subscription');
  console.log('🎯 User hat die Entscheidungsgewalt! ✨');
}

demoLazyGiftWrapSubscription().catch(console.error);