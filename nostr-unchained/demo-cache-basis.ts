/**
 * Demo: Universal Cache als echte Basis von nostr-unchained
 * 
 * Zeigt wie Subscription → Cache → Query → ReactiveStore funktioniert
 */

import { NostrUnchained } from './src/core/NostrUnchained.js';

async function demoCacheBasis() {
  console.log('🎯 Demo: Universal Cache als Basis-System');
  
  const nostr = new NostrUnchained({ 
    debug: true,
    relays: ['ws://umbrel.local:4848']
  });
  
  await nostr.initializeSigning();
  await nostr.connect();
  
  console.log('\n1. 📡 SUBSCRIPTION: Events landen im Cache');
  
  // Subscription startet - Events landen automatisch im Cache
  const subscription = await nostr.sub()
    .kinds([1]) // Notes
    .limit(5)
    .execute();
  
  console.log('Subscription gestartet, Cache wird gefüllt...');
  
  // Warten bis Events da sind
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n2. 🔍 QUERY: Svelte Store aus Cache erstellen');
  
  // Query erstellt einen reaktiven Store vom Cache
  const cacheStore = nostr.query()
    .kinds([1])
    .limit(5)
    .execute();
  
  console.log(`Cache hat jetzt: ${cacheStore.current.length} Events`);
  
  console.log('\n3. ⚡ REAKTIVITÄT: Store reagiert auf neue Cache-Events');
  
  let updateCount = 0;
  const unsubscribe = cacheStore.subscribe(events => {
    updateCount++;
    console.log(`📢 Store Update #${updateCount}: ${events.length} Events`);
    
    if (events.length > 0) {
      console.log(`   Letztes Event: "${events[0].content?.substring(0, 50)}..."`);
    }
  });
  
  console.log('\n4. 🔄 NEUES EVENT: Subscription bringt neues Event');
  
  // Subscription läuft weiter und bringt mehr Events
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n5. 🎯 PERFEKTE SYMMETRIE: Query und Sub haben identische APIs');
  
  // Query API
  const queryStore = nostr.query().kinds([1]).authors(['somekey']).limit(10).execute();
  
  // Sub API - IDENTISCH!  
  const subStore = await nostr.sub().kinds([1]).authors(['somekey']).limit(10).execute();
  
  console.log('✅ Beide APIs sind identisch - nur execute() unterscheidet sich');
  
  console.log('\n🏆 FAZIT:');
  console.log('- Universal Cache ist die BASIS von allem');  
  console.log('- Subscription → Cache (automatisch)');
  console.log('- Query → Svelte Store (reaktiv)');
  console.log('- Store reagiert auf neue Cache-Events');
  console.log('- Perfekte API-Symmetrie zwischen Query/Sub');
  
  // Cleanup
  setTimeout(() => {
    unsubscribe();
    console.log('\n🏁 Demo beendet');
  }, 1000);
}

demoCacheBasis().catch(console.error);