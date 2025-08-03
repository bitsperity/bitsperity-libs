#!/usr/bin/env node
/**
 * Test Hybrid ProfileModule
 * 
 * Tests that the ProfileModule now uses the clean architecture automatically
 */

import { NostrUnchained } from './src/index.js';

async function testHybridProfileModule() {
  console.log('🧪 Testing Hybrid ProfileModule (Clean Architecture)...\n');
  
  // Initialize NostrUnchained
  const nostr = new NostrUnchained({
    relays: ['wss://relay.damus.io', 'wss://nos.lol'],
    debug: true
  });
  
  await nostr.connect();
  console.log('✅ Connected to relays\n');
  
  // Test pubkey (jack's pubkey)
  const testPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';
  
  console.log('🔄 Testing ProfileModule.get() - should use CLEAN architecture...');
  
  // Get profile store - should now use UniversalNostrStore!
  const profileStore = nostr.profile.get(testPubkey);
  console.log('✅ Got profile store from ProfileModule.get()');
  console.log('📊 Store type:', profileStore.constructor.name);
  
  // Test if it has .current property (UniversalNostrStore)
  if ('current' in profileStore) {
    console.log('✅ Has .current property - Using UniversalNostrStore!');
    console.log('📊 Immediate access (.current):', (profileStore as any).current);
  } else {
    console.log('❌ No .current property - Still using ProfileStore');
  }
  
  // Test reactive access
  let updateCount = 0;
  const unsubscribe = profileStore.subscribe((profile: any) => {
    updateCount++;
    console.log(`📡 Profile update ${updateCount}:`, profile?.metadata?.name || profile?.profile?.metadata?.name || 'null');
  });
  
  // Wait for updates
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log(`\n✅ Received ${updateCount} profile updates`);
  
  if ('current' in profileStore) {
    console.log('📊 Final profile (clean):', (profileStore as any).current?.metadata?.name);
  }
  
  // Cleanup
  unsubscribe();
  await nostr.disconnect();
  
  console.log('\n🎉 Hybrid ProfileModule test complete!');
  
  if ('current' in profileStore) {
    console.log('\n✅ SUCCESS: ProfileModule now uses Clean Architecture (UniversalNostrStore)');
  } else {
    console.log('\n❌ ISSUE: ProfileModule still uses legacy ProfileStore');
  }
}

// Run the test
testHybridProfileModule().catch(console.error);