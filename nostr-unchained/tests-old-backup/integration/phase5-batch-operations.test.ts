/**
 * Phase 5: Batch Operations Tests
 * 
 * Tests batch profile and follow operations against real relay: ws://umbrel.local:4848
 * 
 * Phase 5 Success Criteria:
 * - Single relay subscription for batch profile fetches
 * - All profiles load efficiently
 * - Follow list updates atomically
 * - Reactive batch stores work correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

describe('Phase 5: Batch Operations Tests', () => {
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

  // Test 1: Batch profile fetch
  it('should fetch multiple profiles efficiently', async () => {
    console.log('📋 Test 1: Batch profile fetch');
    
    const nostr = await createTestInstance();

    try {
      // Test with multiple known pubkeys
      const testPubkeys = [
        '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
        '91cf9..4e5ca', // May not exist, testing mixed results
        '14aeb..8dad4'  // May not exist, testing mixed results
      ];
      
      console.log(`🔍 Batch fetching ${testPubkeys.length} profiles...`);
      
      const startTime = Date.now();
      const result = await nostr.profile.batch()
        .get(testPubkeys)
        .execute();
      const duration = Date.now() - startTime;

      console.log('📄 Batch result:', {
        success: result.success,
        totalRequested: result.totalRequested,
        totalFound: result.totalFound,
        duration: `${duration}ms`
      });

      // Validate batch result structure
      expect(result.success).toBe(true);
      expect(result.totalRequested).toBe(testPubkeys.length);
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
      expect(result.profiles).toBeDefined();
      expect(result.profiles.size).toBe(testPubkeys.length);
      expect(result.errors).toBeDefined();
      
      // Check that all requested pubkeys are in the result
      testPubkeys.forEach(pubkey => {
        expect(result.profiles.has(pubkey)).toBe(true);
      });
      
      console.log(`✅ Batch fetch completed in ${duration}ms - found ${result.totalFound}/${result.totalRequested} profiles`);
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 2: Reactive batch store
  it('should provide reactive batch profile store', async () => {
    console.log('📋 Test 2: Reactive batch store');
    
    const nostr = await createTestInstance();

    try {
      const testPubkeys = [
        '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'
      ];
      
      // Create reactive batch store
      const batchStore = nostr.profile.batch()
        .get(testPubkeys)
        .asStore();

      const states: any[] = [];
      const unsubscribe = batchStore.subscribe(state => {
        states.push({
          profileCount: state.profiles.size,
          loading: state.loading,
          hasProfiles: Array.from(state.profiles.values()).some(p => p !== null),
          loadingStates: Array.from(state.loadingStates.entries()),
          errorCount: state.errors.size
        });
        console.log('📊 Batch state update:', states[states.length - 1]);
      });

      // Wait for batch to complete
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      unsubscribe();

      // Validate reactive batch store
      expect(states.length).toBeGreaterThan(0);
      expect(states[0].loading).toBe(true); // Should start loading
      
      const finalState = states[states.length - 1];
      expect(finalState.loading).toBe(false); // Should finish loading
      expect(finalState.profileCount).toBe(testPubkeys.length);
      
      console.log(`✅ Reactive batch store worked with ${states.length} state updates`);
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 3: Batch follow operations
  it('should handle bulk follow add/remove', async () => {
    console.log('📋 Test 3: Batch follow operations');
    
    const nostr = await createTestInstance();

    try {
      const followPubkeys = [
        '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
        'aaaa1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'
      ];
      
      const removePubkeys = [
        'bbbb1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'
      ];
      
      console.log(`🔧 Batch operation: adding ${followPubkeys.length}, removing ${removePubkeys.length}`);
      
      // Perform batch follow operation
      const result = await nostr.profile.follows.batch()
        .add(followPubkeys)
        .remove(removePubkeys)
        .publish();

      console.log('📄 Batch follow result:', result);

      // Validate batch follow result
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log(`✅ Batch follow operation completed with eventId: ${result.eventId}`);
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 4: Empty batch operations
  it('should handle empty batch operations gracefully', async () => {
    console.log('📋 Test 4: Empty batch operations');
    
    const nostr = await createTestInstance();

    try {
      // Test empty profile batch
      const emptyProfileResult = await nostr.profile.batch()
        .get([])
        .execute();
      
      expect(emptyProfileResult.success).toBe(true);
      expect(emptyProfileResult.totalRequested).toBe(0);
      expect(emptyProfileResult.totalFound).toBe(0);
      expect(emptyProfileResult.profiles.size).toBe(0);
      
      console.log('✅ Empty profile batch handled correctly');

      // Test empty follow batch
      const emptyFollowResult = await nostr.profile.follows.batch()
        .publish();
      
      expect(emptyFollowResult.success).toBe(false);
      expect(emptyFollowResult.error).toContain('No follow operations');
      
      console.log('✅ Empty follow batch rejected appropriately');
    } finally {
      await nostr.disconnect();
    }
  }, 10000);

  // Test 5: Large batch performance
  it('should handle large batch efficiently', async () => {
    console.log('📋 Test 5: Large batch performance');
    
    const nostr = await createTestInstance();

    try {
      // Generate multiple test pubkeys (most won't exist, testing performance)
      const largeBatch: string[] = [];
      for (let i = 0; i < 20; i++) {
        largeBatch.push(`test${i.toString().padStart(4, '0')}635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245`);
      }
      
      // Add one real one
      largeBatch[0] = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      console.log(`🔍 Large batch: fetching ${largeBatch.length} profiles...`);
      
      const startTime = Date.now();
      const result = await nostr.profile.batch()
        .get(largeBatch)
        .execute();
      const duration = Date.now() - startTime;

      console.log('📄 Large batch result:', {
        success: result.success,
        totalRequested: result.totalRequested,
        totalFound: result.totalFound,
        duration: `${duration}ms`,
        avgPerProfile: `${Math.round(duration / largeBatch.length)}ms`
      });

      // Validate large batch performance
      expect(result.success).toBe(true);
      expect(result.totalRequested).toBe(largeBatch.length);
      expect(result.profiles.size).toBe(largeBatch.length);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`✅ Large batch completed efficiently: ${duration}ms for ${largeBatch.length} profiles`);
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 6: Batch operation with mixed success/failure
  it('should handle mixed batch results correctly', async () => {
    console.log('📋 Test 6: Mixed batch results');
    
    const nostr = await createTestInstance();

    try {
      // Mix of potentially existing and definitely non-existing pubkeys
      const mixedPubkeys = [
        '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245', // Potentially exists
        'invalid-pubkey-format', // Invalid format
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' // Valid format but doesn't exist
      ];
      
      const result = await nostr.profile.batch()
        .get(mixedPubkeys)
        .execute();

      console.log('📄 Mixed batch result:', {
        success: result.success,
        totalRequested: result.totalRequested,
        totalFound: result.totalFound,
        errorCount: result.errors.size
      });

      // Should still succeed overall
      expect(result.success).toBe(true);
      expect(result.totalRequested).toBe(mixedPubkeys.length);
      expect(result.profiles.size).toBe(mixedPubkeys.length);
      
      // Check that all pubkeys are accounted for
      mixedPubkeys.forEach(pubkey => {
        expect(result.profiles.has(pubkey)).toBe(true);
      });
      
      console.log(`✅ Mixed batch handled correctly: ${result.totalFound} found, ${result.errors.size} errors`);
    } finally {
      await nostr.disconnect();
    }
  }, 15000);
});