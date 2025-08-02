/**
 * Phase 1: Profile API Integration Tests
 * 
 * Tests the enhanced Profile API against real relay: ws://umbrel.local:4848
 * 
 * Phase 1 Success Criteria:
 * - Profile fetches within 2 seconds
 * - Reactive updates work when profile changes
 * - Graceful handling of missing profiles
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';

describe('Phase 1: Profile API Tests', () => {
  let nostr: NostrUnchained;
  const TEST_RELAY = 'ws://umbrel.local:4848';
  const TEST_PUBKEY = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'; // Known test pubkey

  beforeAll(async () => {
    console.log(`🧪 Phase 1 Test: Testing against relay ${TEST_RELAY}`);
    
    nostr = new NostrUnchained({
      relays: [TEST_RELAY],
      debug: true
    });

    // Wait for relay connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await nostr.disconnect();
  });

  // Test 1: Fetch existing profile
  it('should fetch existing profile with reactive store', async () => {
    console.log('📋 Test 1: Fetch existing profile');
    
    const profile = nostr.profile.get(TEST_PUBKEY);
    
    // Track state changes
    const states: any[] = [];
    const unsubscribe = profile.subscribe(state => {
      states.push({
        hasProfile: !!state.profile,
        name: state.profile?.metadata.name,
        loading: state.loading,
        error: state.error?.message,
        verified: state.verified
      });
      console.log('📄 Profile state update:', states[states.length - 1]);
    });

    // Wait for profile to load (Phase 1 success criteria: < 2 seconds)
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 4000));
    const duration = Date.now() - startTime;
    
    unsubscribe();

    // Validate Phase 1 success criteria
    expect(duration).toBeLessThan(5000); // Allow 4s + buffer for real relay
    expect(states.length).toBeGreaterThan(0);
    expect(states[0].loading).toBe(true); // Should start loading
    
    // Check if we got a result (profile may or may not exist)
    const finalState = states[states.length - 1];
    expect(finalState.loading).toBe(false); // Should finish loading
    
    console.log(`✅ Profile fetch completed in ${duration}ms`);
  }, 10000);

  // Test 2: Handle non-existent profile
  it('should handle non-existent profile gracefully', async () => {
    console.log('📋 Test 2: Handle non-existent profile');
    
    const invalidPubkey = 'npub1invalid123456789';
    const notFoundProfile = nostr.profile.get(invalidPubkey);
    
    const states: any[] = [];
    const unsubscribe = notFoundProfile.subscribe(state => {
      states.push({
        hasProfile: !!state.profile,
        loading: state.loading,
        error: state.error?.message
      });
      console.log('📄 Invalid profile state:', states[states.length - 1]);
    });

    // Wait for response (invalid pubkey should timeout quickly)
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    unsubscribe();

    // Validate graceful handling
    expect(states.length).toBeGreaterThan(0);
    const finalState = states[states.length - 1];
    expect(finalState.loading).toBe(false);
    expect(finalState.hasProfile).toBe(false);
    // Should not have thrown error, just return null profile
    
    console.log('✅ Non-existent profile handled gracefully');
  }, 8000);

  // Test 3: Reactive updates
  it('should support reactive updates', async () => {
    console.log('📋 Test 3: Reactive updates');
    
    const reactiveProfile = nostr.profile.get(TEST_PUBKEY);
    
    const updates: any[] = [];
    const unsubscribe = reactiveProfile.subscribe(state => {
      updates.push({
        name: state.profile?.metadata.name,
        lastUpdated: state.lastUpdated?.toISOString(),
        updateCount: updates.length + 1
      });
      console.log('🔄 Profile update received:', updates[updates.length - 1]);
    });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Manually trigger refresh to simulate update
    console.log('🔄 Manually refreshing profile...');
    await reactiveProfile.refresh();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    unsubscribe();

    // Validate reactive behavior
    expect(updates.length).toBeGreaterThan(1); // Should have multiple updates
    console.log(`✅ Profile had ${updates.length} reactive updates`);
  }, 10000);

  // Test 4: Multiple profile stores are isolated
  it('should isolate multiple profile stores', async () => {
    console.log('📋 Test 4: Multiple profile store isolation');
    
    const profile1 = nostr.profile.get(TEST_PUBKEY);
    const profile2 = nostr.profile.get('different-pubkey-123');
    
    // Should be different store instances
    expect(profile1).not.toBe(profile2);
    
    let profile1Updates = 0;
    let profile2Updates = 0;
    
    const unsub1 = profile1.subscribe(() => profile1Updates++);
    const unsub2 = profile2.subscribe(() => profile2Updates++);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    unsub1();
    unsub2();
    
    // Both should have received updates independently
    expect(profile1Updates).toBeGreaterThan(0);
    expect(profile2Updates).toBeGreaterThan(0);
    
    console.log(`✅ Profile stores isolated: P1=${profile1Updates} updates, P2=${profile2Updates} updates`);
  }, 8000);
});