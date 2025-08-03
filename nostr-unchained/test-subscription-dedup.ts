#!/usr/bin/env node
/**
 * Test script to verify subscription deduplication is working
 * 
 * This script creates multiple ProfileStore instances for the same pubkey
 * and verifies that only one actual relay subscription is created.
 */

import { NostrUnchained } from './src/index.js';

async function testSubscriptionDeduplication() {
  console.log('🧪 Testing Subscription Deduplication...\n');
  
  // Initialize NostrUnchained with debug mode
  const nostr = new NostrUnchained({
    relays: ['wss://relay.damus.io', 'wss://nos.lol'],
    debug: true
  });
  
  await nostr.connect();
  console.log('✅ Connected to relays\n');
  
  // Test pubkey (jack's pubkey for example)
  const testPubkey = '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2';
  
  console.log('📊 Initial subscription analytics:');
  const initialStats = nostr.subscriptionManager.getSubscriptionAnalytics();
  console.log(initialStats);
  console.log();
  
  // Create multiple ProfileStore instances for the same pubkey
  console.log('🔄 Creating 3 ProfileStore instances for the same pubkey...\n');
  
  const profileStore1 = nostr.profile.get(testPubkey);
  console.log('✅ Created ProfileStore 1');
  
  // Wait a bit to let the subscription establish
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const profileStore2 = nostr.profile.get(testPubkey);
  console.log('✅ Created ProfileStore 2');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const profileStore3 = nostr.profile.get(testPubkey);
  console.log('✅ Created ProfileStore 3');
  
  // Wait for subscriptions to establish
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n📊 Subscription analytics after creating 3 ProfileStores:');
  const afterStats = nostr.subscriptionManager.getSubscriptionAnalytics();
  console.log(afterStats);
  
  // Also create FollowListStore for the same pubkey
  console.log('\n🔄 Creating FollowListStore for the same pubkey...\n');
  const followStore = nostr.profile.follows.of(testPubkey);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('📊 Final subscription analytics:');
  const finalStats = nostr.subscriptionManager.getSubscriptionAnalytics();
  console.log(finalStats);
  
  // Subscribe to profile changes on all stores
  console.log('\n👂 Setting up listeners on all ProfileStores...\n');
  
  let updateCount = 0;
  profileStore1.subscribe(state => {
    if (state.profile) {
      console.log('ProfileStore 1 received update:', state.profile.metadata?.name);
      updateCount++;
    }
  });
  
  profileStore2.subscribe(state => {
    if (state.profile) {
      console.log('ProfileStore 2 received update:', state.profile.metadata?.name);
      updateCount++;
    }
  });
  
  profileStore3.subscribe(state => {
    if (state.profile) {
      console.log('ProfileStore 3 received update:', state.profile.metadata?.name);
      updateCount++;
    }
  });
  
  // Wait for profile data
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`\n✅ Total profile updates received: ${updateCount}`);
  console.log('Expected: 3 (one per store) if deduplication is working\n');
  
  // Clean up
  console.log('🧹 Cleaning up...');
  await profileStore1.close();
  await profileStore2.close();
  await profileStore3.close();
  await followStore.close();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📊 Subscription analytics after cleanup:');
  const cleanupStats = nostr.subscriptionManager.getSubscriptionAnalytics();
  console.log(cleanupStats);
  
  await nostr.disconnect();
  console.log('\n✅ Test complete!');
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`- Created 3 ProfileStore instances for same pubkey`);
  console.log(`- Total subscriptions created: ${afterStats.totalSubscriptions}`);
  console.log(`- Shared subscriptions: ${afterStats.sharedSubscriptions}`);
  console.log(`- Duplicates avoided: ${afterStats.duplicatesAvoided}`);
  console.log(`- All stores received updates: ${updateCount === 3 ? '✅' : '❌'}`);
  
  if (afterStats.duplicatesAvoided >= 2) {
    console.log('\n🎉 Deduplication is working! Multiple stores share the same subscription.');
  } else {
    console.log('\n⚠️  Deduplication might not be working as expected.');
  }
}

// Run the test
testSubscriptionDeduplication().catch(console.error);