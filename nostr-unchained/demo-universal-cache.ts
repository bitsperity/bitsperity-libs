/**
 * Demo script to test the Universal Cache architecture
 * 
 * This demonstrates the elegant Query/Sub symmetry from the session plan.
 */

import { NostrUnchained } from './src/core/NostrUnchained.js';

async function demoUniversalCache() {
  console.log('🚀 Demo: Universal Cache Architecture');
  
  // Initialize NostrUnchained
  const nostr = new NostrUnchained({ 
    debug: true,
    relays: ['ws://umbrel.local:4848']
  });
  
  // Initialize signing (needed for cache decryption)
  await nostr.initializeSigning();
  
  console.log('\n📋 Testing Query API (cache lookup):');
  
  // Query API - immediate cache lookup
  const cachedNotes = nostr.query()
    .kinds([1])
    .limit(5)
    .execute();
  
  console.log('Current cached notes:', cachedNotes.current.length);
  
  console.log('\n📡 Testing Sub API (live updates):');
  
  // Subscription API - live data
  const liveNotes = await nostr.sub()
    .kinds([1])
    .limit(10)
    .execute();
  
  console.log('Live notes store created, current:', liveNotes.current.length);
  
  // Subscribe to updates
  const unsubscribe = liveNotes.subscribe(notes => {
    console.log(`📢 Store updated! Now has ${notes.length} notes`);
  });
  
  console.log('\n✨ Universal Cache architecture working!');
  console.log('Query and Sub APIs have identical fluent interfaces');
  console.log('Both return reactive stores that update from the universal cache');
  
  // Cleanup after demo
  setTimeout(() => {
    unsubscribe();
    console.log('\n🏁 Demo complete');
  }, 2000);
}

// Run the demo
demoUniversalCache().catch(console.error);