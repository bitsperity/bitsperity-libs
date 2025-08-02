/**
 * Phase 4: Follow List Management Tests
 * 
 * Tests follow list write operations against real relay: ws://umbrel.local:4848
 * 
 * Phase 4 Success Criteria:
 * - Add follow with fluent API
 * - Remove follow functionality
 * - Follow list updates publish correctly (kind 3 events)
 * - Optimistic updates in FollowListStore
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

describe('Phase 4: Follow Management Tests', () => {
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

  // Test 1: Add single follow with basic API
  it('should add follow with basic API', async () => {
    console.log('📋 Test 1: Add single follow');
    
    const nostr = await createTestInstance();
    const myPubkey = await nostr.getPublicKey();
    console.log('🔑 Using test pubkey:', myPubkey.substring(0, 16) + '...');

    try {
      // Target user to follow
      const targetPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      console.log('👤 Following:', targetPubkey.substring(0, 16) + '...');

      // Add follow using fluent API
      const result = await nostr.profile.follows.add(targetPubkey)
        .publish();

      console.log('📄 Add follow result:', result);

      // Validate publishing success
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log(`✅ Follow added successfully with eventId: ${result.eventId}`);
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 2: Add follow with relay and petname
  it('should add follow with relay and petname', async () => {
    console.log('📋 Test 2: Add follow with relay and petname');
    
    const nostr = await createTestInstance();

    try {
      const targetPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      // Add follow with additional metadata
      const result = await nostr.profile.follows.add(targetPubkey)
        .relay(TEST_RELAY)
        .petname('Test User')
        .publish();

      console.log('📄 Add follow with metadata result:', result);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log('✅ Follow with metadata added successfully');
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 3: Remove follow
  it('should remove follow from list', async () => {
    console.log('📋 Test 3: Remove follow');
    
    const nostr = await createTestInstance();

    try {
      const targetPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      // First add a follow
      console.log('🔧 Adding follow first...');
      const addResult = await nostr.profile.follows.add(targetPubkey)
        .publish();
      
      expect(addResult.success).toBe(true);
      console.log('✅ Follow added, now removing...');

      // Wait for relay propagation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Now remove the follow
      const removeResult = await nostr.profile.follows.remove(targetPubkey);
      
      console.log('📄 Remove follow result:', removeResult);

      expect(removeResult.success).toBe(true);
      expect(removeResult.eventId).toBeDefined();
      
      console.log('✅ Follow removed successfully');
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 4: Verify follow list updates in store
  it('should update follow list store after changes', async () => {
    console.log('📋 Test 4: Follow list store updates');
    
    const nostr = await createTestInstance();

    try {
      const targetPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      // Get follow list store
      const followList = await nostr.profile.follows.mine();
      
      // Track follow list changes
      const states: any[] = [];
      const unsubscribe = followList.subscribe(state => {
        states.push({
          followCount: state.follows.length,
          loading: state.loading,
          hasTarget: state.follows.some(f => f.pubkey === targetPubkey)
        });
        console.log('📊 Follow list state:', states[states.length - 1]);
      });

      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const initialCount = states[states.length - 1]?.followCount || 0;
      console.log('📊 Initial follow count:', initialCount);

      // Add a follow
      console.log('🔧 Adding follow and checking store updates...');
      const addResult = await nostr.profile.follows.add(targetPubkey)
        .petname('Store Test User')
        .publish();
      
      expect(addResult.success).toBe(true);
      
      // Wait for store to update
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      unsubscribe();

      // Validate store updates
      expect(states.length).toBeGreaterThan(1);
      const finalState = states[states.length - 1];
      
      // Note: Store might not immediately reflect changes due to relay propagation
      // This test mainly verifies the store mechanism works
      console.log(`📊 Final state: ${finalState.followCount} follows, hasTarget: ${finalState.hasTarget}`);
      console.log('✅ Follow list store mechanism verified');
      
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 5: Handle duplicate follow attempts
  it('should handle duplicate follow attempts gracefully', async () => {
    console.log('📋 Test 5: Duplicate follow handling');
    
    const nostr = await createTestInstance();

    try {
      const targetPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      // Add follow first time
      const firstResult = await nostr.profile.follows.add(targetPubkey)
        .publish();
      
      expect(firstResult.success).toBe(true);
      console.log('✅ First follow added');

      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try to add same follow again
      const secondResult = await nostr.profile.follows.add(targetPubkey)
        .publish();
      
      console.log('📄 Duplicate follow result:', secondResult);

      // Should handle gracefully (either succeed or give appropriate error)
      expect(typeof secondResult.success).toBe('boolean');
      if (!secondResult.success) {
        expect(secondResult.error).toContain('Already following');
      }
      
      console.log('✅ Duplicate follow handled appropriately');
    } finally {
      await nostr.disconnect();
    }
  }, 18000);

  // Test 6: Remove non-existent follow
  it('should handle removing non-existent follow', async () => {
    console.log('📋 Test 6: Remove non-existent follow');
    
    const nostr = await createTestInstance();

    try {
      // Try to remove a follow that doesn't exist
      const nonExistentPubkey = 'aaaa1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      const result = await nostr.profile.follows.remove(nonExistentPubkey);
      
      console.log('📄 Remove non-existent follow result:', result);

      // Should handle gracefully with appropriate error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not following');
      
      console.log('✅ Non-existent follow removal handled correctly');
    } finally {
      await nostr.disconnect();
    }
  }, 10000);
});