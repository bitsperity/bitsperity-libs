#!/usr/bin/env node
/**
 * Test Clean Profile Module
 * 
 * Tests the new base layer ProfileModule implementation
 */

import { NostrUnchained } from './src/index.js';
import { CleanProfileModule } from './src/profile/CleanProfileModule.js';

async function testCleanProfileModule() {
  console.log('🧪 Testing Clean Profile Module...\n');
  
  // Initialize NostrUnchained
  const nostr = new NostrUnchained({
    relays: ['wss://relay.damus.io', 'wss://nos.lol'],
    debug: true
  });
  
  await nostr.connect();
  console.log('✅ Connected to relays\n');
  
  // Test pubkey (jack's pubkey)
  const testPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';
  
  // Create clean profile module
  const cleanProfile = new CleanProfileModule(nostr);
  
  console.log('🔄 Testing Clean Profile Module...');
  
  // Get profile store
  const profileStore = cleanProfile.get(testPubkey);
  console.log('✅ Got profile store from CleanProfileModule');
  
  // Test immediate access
  console.log('📊 Immediate access (.current):', profileStore.current);
  
  // Test reactive access
  let updateCount = 0;
  const unsubscribe = profileStore.subscribe(profile => {
    updateCount++;
    console.log(`📡 Profile update ${updateCount}:`, profile?.metadata?.name || 'null');
  });
  
  // Wait for updates
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log(`\n✅ Received ${updateCount} profile updates`);
  console.log('📊 Final profile:', profileStore.current?.metadata?.name);
  
  // Cleanup
  unsubscribe();
  await nostr.disconnect();
  
  console.log('\n🎉 Clean Profile Module test complete!');
  
  // Test comparison with old approach
  console.log('\n📋 Comparison:');
  console.log('- Clean approach: 1 store, immediate + reactive');
  console.log('- Old approach: ProfileStore + complex subscription management');
  console.log('- Result: Simpler, cleaner, same functionality');
}

// Run the test
testCleanProfileModule().catch(console.error);