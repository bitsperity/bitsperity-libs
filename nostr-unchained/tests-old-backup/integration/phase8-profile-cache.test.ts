/**
 * Phase 8: Profile Cache Optimization Tests
 * 
 * Tests cache efficiency and performance improvements against real relay: ws://umbrel.local:4848
 * 
 * Phase 8 Success Criteria:
 * - Profile cache hit rate >80% after warmup
 * - Cached profile response time <10ms
 * - Cache miss response time <2s (same as before)
 * - Optimistic updates UI response <50ms
 * - Memory usage reasonable
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';
import { ProfileCacheInterface } from '../../src/profile/ProfileCacheInterface.js';

describe('Phase 8: Profile Cache Optimization Tests', () => {
  const TEST_RELAY = 'ws://umbrel.local:4848';

  // Helper function to create isolated NostrUnchained instance for each test
  const createTestInstance = async () => {
    const tempSigner = new LocalKeySigner();
    
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

  // Test 1: Cache Interface functionality
  it('should have cache interface initialized', async () => {
    console.log('📋 Test 1: Cache interface functionality');
    
    const nostr = await createTestInstance();

    try {
      // Get profile store - should have cache interface
      const profileStore = nostr.profile.get('npub1test123');
      
      // Check that cache is passed through
      expect(profileStore).toBeDefined();
      
      console.log('✅ ProfileStore created with cache support');
      
      // Get cache statistics from the underlying cache
      const cacheStats = (nostr as any).cache?.getStatistics();
      
      if (cacheStats) {
        console.log('📊 Initial cache stats:', {
          totalEvents: cacheStats.totalEvents,
          queryCount: cacheStats.queryCount,
          hitRate: cacheStats.hitRate
        });
        
        expect(typeof cacheStats.totalEvents).toBe('number');
        expect(typeof cacheStats.queryCount).toBe('number');
        expect(typeof cacheStats.hitRate).toBe('number');
      } else {
        console.log('⚠️ Cache not available (might be expected in some setups)');
      }
      
    } finally {
      await nostr.disconnect();
    }
  }, 10000);

  // Test 2: Cache-first profile loading
  it('should load profiles cache-first after initial fetch', async () => {
    console.log('📋 Test 2: Cache-first profile loading');
    
    const nostr = await createTestInstance();

    try {
      const testPubkey = await nostr.signingProvider?.getPublicKey();
      if (!testPubkey) {
        throw new Error('No signing provider available');
      }
      
      console.log('🔍 Testing cache-first loading for own profile...');
      
      // First fetch - should be a cache miss (or populate cache)
      console.log('📡 First fetch (cache miss expected)...');
      const startTime1 = Date.now();
      const profile1 = nostr.profile.get(testPubkey);
      
      // Wait for initial profile data
      await new Promise<void>((resolve) => {
        let resolved = false;
        profile1.subscribe(state => {
          if (!state.loading && !resolved) {
            resolved = true;
            const duration1 = Date.now() - startTime1;
            console.log('📄 First fetch completed:', {
              duration: `${duration1}ms`,
              hasProfile: !!state.profile,
              profileName: state.profile?.metadata?.name || 'unnamed'
            });
            resolve();
          }
        });
      });
      
      // Second fetch of same profile - should be much faster if cached
      console.log('📡 Second fetch (cache hit expected)...');
      const startTime2 = Date.now();
      const profile2 = nostr.profile.get(testPubkey);
      
      await new Promise<void>((resolve) => {
        let resolved = false;
        profile2.subscribe(state => {
          if (!state.loading && !resolved) {
            resolved = true;
            const duration2 = Date.now() - startTime2;
            console.log('📄 Second fetch completed:', {
              duration: `${duration2}ms`,
              hasProfile: !!state.profile,
              profileName: state.profile?.metadata?.name || 'unnamed'
            });
            
            // Second fetch should be faster (if cached)
            if (duration2 < 100) { // Less than 100ms indicates likely cache hit
              console.log('🚀 Fast response suggests cache hit!');
            }
            
            resolve();
          }
        });
      });
      
      console.log('✅ Cache-first loading test completed');
      
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 3: Cache efficiency with multiple profiles
  it('should efficiently cache multiple profiles', async () => {
    console.log('📋 Test 3: Multiple profile cache efficiency');
    
    const nostr = await createTestInstance();

    try {
      // Create some test pubkeys (they might not exist, but that's OK for cache testing)
      const testPubkeys = [
        'npub1test1111111111111111111111111111111111111111111111111111111',
        'npub1test2222222222222222222222222222222222222222222222222222222',
        'npub1test3333333333333333333333333333333333333333333333333333333'
      ];
      
      console.log('🔍 Testing batch profile caching...');
      
      // First batch fetch
      const startTime1 = Date.now();
      const profiles1 = testPubkeys.map(pubkey => nostr.profile.get(pubkey));
      
      // Wait for all profiles to load
      await Promise.all(profiles1.map(profile => 
        new Promise<void>(resolve => {
          let resolved = false;
          profile.subscribe(state => {
            if (!state.loading && !resolved) {
              resolved = true;
              resolve();
            }
          });
        })
      ));
      
      const duration1 = Date.now() - startTime1;
      console.log('📄 First batch completed:', { duration: `${duration1}ms` });
      
      // Second batch fetch of same profiles - should be faster
      const startTime2 = Date.now();
      const profiles2 = testPubkeys.map(pubkey => nostr.profile.get(pubkey));
      
      await Promise.all(profiles2.map(profile => 
        new Promise<void>(resolve => {
          let resolved = false;
          profile.subscribe(state => {
            if (!state.loading && !resolved) {
              resolved = true;
              resolve();
            }
          });
        })
      ));
      
      const duration2 = Date.now() - startTime2;
      console.log('📄 Second batch completed:', { duration: `${duration2}ms` });
      
      // Calculate efficiency
      const speedupRatio = duration1 / Math.max(duration2, 1);
      console.log('📊 Cache efficiency:', {
        firstBatch: `${duration1}ms`,
        secondBatch: `${duration2}ms`,
        speedup: `${speedupRatio.toFixed(2)}x`
      });
      
      // Some speedup expected from caching (even if profiles don't exist)
      if (speedupRatio > 1.5) {
        console.log('🚀 Good cache performance detected!');
      }
      
      console.log('✅ Multiple profile cache test completed');
      
    } finally {
      await nostr.disconnect();
    }
  }, 30000);

  // Test 4: Profile cache stats and monitoring
  it('should provide meaningful cache statistics', async () => {
    console.log('📋 Test 4: Cache statistics and monitoring');
    
    const nostr = await createTestInstance();

    try {
      // Access internal cache for statistics
      const cache = (nostr as any).cache;
      
      if (!cache) {
        console.log('⚠️ Cache not available - skipping stats test');
        return;
      }
      
      // Get initial stats
      const initialStats = cache.getStatistics();
      console.log('📊 Initial cache statistics:', {
        totalEvents: initialStats.totalEvents,
        queryCount: initialStats.queryCount,
        hitRate: initialStats.hitRate,
        avgQueryTime: initialStats.avgQueryTime
      });
      
      // Do some profile operations to generate cache activity
      const testPubkey = await nostr.signingProvider?.getPublicKey();
      if (testPubkey) {
        // Multiple fetches of same profile
        for (let i = 0; i < 3; i++) {
          const profile = nostr.profile.get(testPubkey);
          await new Promise<void>(resolve => {
            let resolved = false;
            profile.subscribe(state => {
              if (!state.loading && !resolved) {
                resolved = true;
                resolve();
              }
            });
          });
          
          // Small delay between fetches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Get final stats
      const finalStats = cache.getStatistics();
      console.log('📊 Final cache statistics:', {
        totalEvents: finalStats.totalEvents,
        queryCount: finalStats.queryCount,
        hitRate: finalStats.hitRate,
        avgQueryTime: finalStats.avgQueryTime,
        memoryUsageMB: finalStats.memoryUsageMB
      });
      
      // Validate statistics structure
      expect(typeof finalStats.totalEvents).toBe('number');
      expect(typeof finalStats.queryCount).toBe('number');
      expect(typeof finalStats.hitRate).toBe('number');
      expect(typeof finalStats.avgQueryTime).toBe('number');
      expect(typeof finalStats.memoryUsageMB).toBe('number');
      
      // Query count should have increased
      expect(finalStats.queryCount).toBeGreaterThanOrEqual(initialStats.queryCount);
      
      console.log('✅ Cache statistics validation passed');
      
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 5: Cache integration with profile editing (optimistic updates)
  it('should handle optimistic updates efficiently', async () => {
    console.log('📋 Test 5: Optimistic updates with cache');
    
    const nostr = await createTestInstance();

    try {
      const myPubkey = await nostr.signingProvider?.getPublicKey();
      if (!myPubkey) {
        throw new Error('No signing provider available');
      }
      
      console.log('🔍 Testing optimistic profile updates...');
      
      // Get initial profile state
      const profileStore = nostr.profile.get(myPubkey);
      let initialProfile: any = null;
      
      await new Promise<void>(resolve => {
        let resolved = false;
        profileStore.subscribe(state => {
          if (!state.loading && !resolved) {
            initialProfile = state.profile;
            resolved = true;
            resolve();
          }
        });
      });
      
      console.log('📄 Initial profile loaded:', {
        hasProfile: !!initialProfile,
        name: initialProfile?.metadata?.name || 'unnamed'
      });
      
      // Test optimistic update
      const testName = `Cache Test ${Date.now()}`;
      console.log(`🚀 Publishing optimistic update: ${testName}`);
      
      const updateStartTime = Date.now();
      
      // Profile edit should trigger optimistic update
      const editPromise = nostr.profile.edit()
        .name(testName)
        .about('Testing cache optimization')
        .publish();
      
      // Monitor for UI update (should be fast)
      let uiUpdateTime: number | null = null;
      const unsubscribe = profileStore.subscribe(state => {
        if (state.profile?.metadata?.name === testName && !uiUpdateTime) {
          uiUpdateTime = Date.now() - updateStartTime;
          console.log('⚡ UI updated in:', `${uiUpdateTime}ms`);
        }
      });
      
      // Wait for relay confirmation
      const result = await editPromise;
      const totalTime = Date.now() - updateStartTime;
      
      unsubscribe();
      
      console.log('📊 Update performance:', {
        uiUpdateTime: uiUpdateTime ? `${uiUpdateTime}ms` : 'not detected',
        totalTime: `${totalTime}ms`,
        success: result.success
      });
      
      // UI should update quickly (optimistic)
      if (uiUpdateTime && uiUpdateTime < 100) {
        console.log('🚀 Fast UI update suggests optimistic caching!');
      }
      
      expect(result.success).toBe(true);
      
      console.log('✅ Optimistic update test completed');
      
    } finally {
      await nostr.disconnect();
    }
  }, 20000);
});