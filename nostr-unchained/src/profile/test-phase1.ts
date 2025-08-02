/**
 * Phase 1 Test - Basic Profile Read Operations
 * 
 * Tests against real relay: ws://umbrel.local:4848
 * 
 * Test Scenarios:
 * 1. Fetch existing profile
 * 2. Handle non-existent profile  
 * 3. Reactive updates
 */

import { NostrUnchained } from '../core/NostrUnchained.js';

const TEST_RELAY = 'ws://umbrel.local:4848';

async function testPhase1() {
  console.log('🧪 Phase 1 Test: Basic Profile Read Operations');
  console.log(`📡 Testing against relay: ${TEST_RELAY}`);

  // Initialize NostrUnchained with test relay
  const nostr = new NostrUnchained({
    relays: [TEST_RELAY],
    debug: true
  });

  try {
    // Test 1: Fetch existing profile
    console.log('\n📋 Test 1: Fetch existing profile');
    
    // Use a well-known test pubkey (you might need to adjust this)
    const testPubkey = 'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9';
    
    const profile = nostr.profile.get(testPubkey);
    
    // Subscribe to profile changes
    const unsubscribe = profile.subscribe(state => {
      console.log('📄 Profile state:', {
        hasProfile: !!state.profile,
        name: state.profile?.metadata.name,
        loading: state.loading,
        error: state.error?.message,
        verified: state.verified
      });
    });

    // Wait for profile to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    unsubscribe();

    // Test 2: Handle non-existent profile
    console.log('\n📋 Test 2: Handle non-existent profile');
    
    const invalidPubkey = 'npub1invalid123456789';
    const notFoundProfile = nostr.profile.get(invalidPubkey);
    
    const unsubscribe2 = notFoundProfile.subscribe(state => {
      console.log('📄 Invalid profile state:', {
        hasProfile: !!state.profile,
        loading: state.loading,
        error: state.error?.message
      });
    });

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    unsubscribe2();

    // Test 3: Reactive updates test
    console.log('\n📋 Test 3: Reactive updates (simulated)');
    
    const reactiveProfile = nostr.profile.get(testPubkey);
    
    console.log('🔄 Subscribing to profile updates...');
    const unsubscribe3 = reactiveProfile.subscribe(state => {
      console.log('🔄 Profile update received:', {
        name: state.profile?.metadata.name,
        lastUpdated: state.lastUpdated?.toISOString()
      });
    });

    // Wait and then refresh to simulate update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔄 Manually refreshing profile...');
    await reactiveProfile.refresh();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    unsubscribe3();

    console.log('\n✅ Phase 1 tests completed');

  } catch (error) {
    console.error('❌ Phase 1 test failed:', error);
  } finally {
    // Clean up
    await nostr.close();
  }
}

// Export for testing
export { testPhase1 };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhase1().catch(console.error);
}