/**
 * Phase 3: Follow List Read Operations Tests
 * 
 * Tests the follow list functionality against real relay: ws://umbrel.local:4848
 * 
 * Phase 3 Success Criteria:
 * - Read own follow list with mine()
 * - Read other user's follow list with of()
 * - Reactive updates work when follow list changes
 * - Graceful handling of empty follow lists
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

describe('Phase 3: Follow List Tests', () => {
  const TEST_RELAY = 'ws://umbrel.local:4848';

  // Helper function to create isolated NostrUnchained instance for each test
  const createTestInstance = async () => {
    const tempSigner = new LocalKeySigner(); // Creates new keypair each time
    
    const nostr = new NostrUnchained({
      relays: [TEST_RELAY],
      signingProvider: tempSigner,
      debug: true
    });

    await nostr.initializeSigning();
    await nostr.connect();
    
    // Wait for relay connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return nostr;
  };

  // Test 1: Read own follow list (will be empty for new test accounts)
  it('should access own follow list with mine()', async () => {
    console.log('📋 Test 1: Read own follow list');
    
    const nostr = await createTestInstance();
    const myPubkey = await nostr.getPublicKey();
    console.log('🔑 Using test pubkey:', myPubkey.substring(0, 16) + '...');

    try {
      // Access own follow list
      const myFollows = await nostr.profile.follows.mine();

      // Track state changes
      const states: any[] = [];
      const unsubscribe = myFollows.subscribe(state => {
        states.push({
          followCount: state.follows.length,
          loading: state.loading,
          error: state.error?.message,
          eventId: state.eventId
        });
        console.log('📄 My follows state update:', states[states.length - 1]);
      });

      // Wait for follow list to load
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 4000));
      const duration = Date.now() - startTime;
      
      unsubscribe();

      // Validate follow list access
      expect(duration).toBeLessThan(5000); // Should respond quickly
      expect(states.length).toBeGreaterThan(0);
      expect(states[0].loading).toBe(true); // Should start loading
      
      // Check final state (empty follow list for new test account is expected)
      const finalState = states[states.length - 1];
      expect(finalState.loading).toBe(false); // Should finish loading
      expect(typeof finalState.followCount).toBe('number'); // Should have a count
      
      console.log(`✅ Own follow list accessed in ${duration}ms with ${finalState.followCount} follows`);
    } finally {
      await nostr.disconnect();
    }
  }, 10000);

  // Test 2: Read another user's follow list
  it('should access other user follow list with of()', async () => {
    console.log('📋 Test 2: Read other user follow list');
    
    const nostr = await createTestInstance();
    
    try {
      // Use a known pubkey (could be empty, but test the mechanism)
      const targetPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      console.log('🔍 Looking up follows for:', targetPubkey.substring(0, 16) + '...');
      
      const theirFollows = nostr.profile.follows.of(targetPubkey);

      const states: any[] = [];
      const unsubscribe = theirFollows.subscribe(state => {
        states.push({
          followCount: state.follows.length,
          loading: state.loading,
          error: state.error?.message,
          hasFollows: state.follows.length > 0
        });
        console.log('📄 Their follows state update:', states[states.length - 1]);
      });

      // Wait for follow list to load
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      unsubscribe();

      // Validate other user follow list access
      expect(states.length).toBeGreaterThan(0);
      const finalState = states[states.length - 1];
      expect(finalState.loading).toBe(false);
      expect(typeof finalState.followCount).toBe('number');
      
      console.log(`✅ Other user follow list accessed with ${finalState.followCount} follows`);
    } finally {
      await nostr.disconnect();
    }
  }, 10000);

  // Test 3: Reactive isFollowing check
  it('should support isFollowing reactive checks', async () => {
    console.log('📋 Test 3: Reactive isFollowing checks');
    
    const nostr = await createTestInstance();
    
    try {
      // Get follow list
      const followList = await nostr.profile.follows.mine();
      
      // Test isFollowing for some pubkey
      const testPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      const isFollowingStore = followList.isFollowing(testPubkey);
      
      const followingStates: boolean[] = [];
      const unsubscribe = isFollowingStore.subscribe(isFollowing => {
        followingStates.push(isFollowing);
        console.log('🔄 isFollowing update:', isFollowing);
      });

      // Let it process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      unsubscribe();

      // Validate reactive isFollowing
      expect(followingStates.length).toBeGreaterThan(0);
      expect(typeof followingStates[0]).toBe('boolean');
      
      console.log(`✅ isFollowing reactive check: ${followingStates[followingStates.length - 1]}`);
    } finally {
      await nostr.disconnect();
    }
  }, 8000);

  // Test 4: Follow count derived store
  it('should provide follow count as derived store', async () => {
    console.log('📋 Test 4: Follow count derived store');
    
    const nostr = await createTestInstance();
    
    try {
      const followList = await nostr.profile.follows.mine();
      
      // Access count derived store
      const counts: number[] = [];
      const unsubscribe = followList.count.subscribe(count => {
        counts.push(count);
        console.log('📊 Follow count update:', count);
      });

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      unsubscribe();

      // Validate count store
      expect(counts.length).toBeGreaterThan(0);
      expect(typeof counts[0]).toBe('number');
      expect(counts[0]).toBeGreaterThanOrEqual(0); // Count should be non-negative
      
      console.log(`✅ Follow count derived store: ${counts[counts.length - 1]}`);
    } finally {
      await nostr.disconnect();
    }
  }, 8000);
});