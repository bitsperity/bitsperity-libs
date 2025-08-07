/**
 * Critical Bug Test: Cache Initialization Race Condition
 * 
 * IDENTIFIED BUG: NostrUnchained.ts:87-103
 * - Cache initialized with empty private key
 * - Then "upgraded" asynchronously with _initializeCache()
 * - Gift wrap decryption broken until upgrade completes
 * 
 * This test validates whether this race condition causes real problems.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import { withBugAnalysis, type AnalysisContext } from '../shared/BugAnalysisFramework.js';
import { NostrUnchained } from '../../src/index.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

describe('Critical Bug: Cache Initialization Race Condition', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should demonstrate cache race condition bug', withBugAnalysis(
    'Cache Initialization Race Condition',
    {
      testContext: 'Testing if cache initialization race condition affects DM functionality',
      expectedBehavior: 'Cache should be properly initialized for gift wrap decryption immediately after construction',
      hasSpecReference: false,
      hasDocumentationReference: true,
      isReproducible: true
    } satisfies Partial<AnalysisContext>
  )(async () => {
    
    // Test the EXACT problematic pattern from NostrUnchained.ts:87-103
    const signer = new LocalKeySigner();
    
    const nostr = new NostrUnchained({
      relays: [testEnv.relayUrl],
      debug: true,
      signingProvider: signer  // This triggers the race condition
    });
    
    await nostr.connect();
    
    // Immediately check cache state before async initialization completes
    const cache = nostr.getCache();
    const cacheStats = cache.getStatistics();
    
    console.log('📊 Cache State Immediately After Construction:', {
      eventCount: cacheStats.eventCount,
      memoryUsage: cacheStats.memoryUsage,
      hitRate: cacheStats.hitRate,
      // Check if cache has proper decryption capability
      hasDecryptionKey: 'unknown' // We can't easily test this without private API
    });
    
    // Try to use DM functionality immediately (this might fail due to race condition)
    const testPubkey = '0'.repeat(64); // Valid hex pubkey
    
    testEnv.startPerformanceMeasurement();
    
    // This will trigger lazy DM loading which depends on cache being properly initialized
    const dmModule = nostr.getDM();
    const initDuration = testEnv.endPerformanceMeasurement('DM Module Initialization');
    
    console.log('📊 DM Module State:', {
      dmModuleExists: !!dmModule,
      initDuration,
      cacheState: cacheStats
    });
    
    // Test if we can create a conversation (depends on cache initialization)
    if (dmModule) {
      const conversation = dmModule.with(testPubkey);
      expect(conversation).toBeDefined();
      console.log('✅ DM conversation created successfully');
    } else {
      console.log('⚠️ DM module not available - possible race condition');
    }
    
    // Wait for potential async initialization to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check cache state again
    const finalCacheStats = cache.getStatistics();
    console.log('📊 Cache State After Async Init:', {
      eventCount: finalCacheStats.eventCount,
      memoryUsage: finalCacheStats.memoryUsage,
      improved: finalCacheStats.memoryUsage > cacheStats.memoryUsage
    });
    
    await nostr.disconnect();
  }));

  it('should test cache initialization with delayed signing provider', withBugAnalysis(
    'Delayed Signing Provider Cache Init',
    {
      testContext: 'Testing cache behavior when signing provider is added later',
      expectedBehavior: 'Cache should upgrade properly when signing provider becomes available',
      hasSpecReference: false,
      hasDocumentationReference: true,
      isReproducible: true
    } satisfies Partial<AnalysisContext>
  )(async () => {
    
    // Test the alternative path: NO signing provider initially
    const nostr = new NostrUnchained({
      relays: [testEnv.relayUrl],
      debug: true
      // NO signingProvider - this avoids the race condition
    });
    
    await nostr.connect();
    
    // Check initial cache state (should be empty but stable)
    const initialCache = nostr.getCache();
    const initialStats = initialCache.getStatistics();
    
    console.log('📊 Initial Cache State (No Signing Provider):', initialStats);
    
    // Now add signing provider (this should upgrade cache)
    const signer = new LocalKeySigner();
    
    testEnv.startPerformanceMeasurement();
    await nostr.initializeSigning(signer);
    const upgradeTime = testEnv.endPerformanceMeasurement('Cache Upgrade');
    
    // Check if cache was properly upgraded
    const upgradedStats = initialCache.getStatistics();
    
    console.log('📊 Cache After Signing Provider Added:', {
      ...upgradedStats,
      upgradeTime,
      changed: upgradedStats.memoryUsage !== initialStats.memoryUsage
    });
    
    // Now try DM functionality (should work properly)
    const dmModule = nostr.getDM();
    expect(dmModule).toBeDefined();
    
    if (dmModule) {
      const testPubkey = '1'.repeat(64);
      const conversation = dmModule.with(testPubkey);
      expect(conversation).toBeDefined();
      console.log('✅ DM functionality works after proper initialization');
    }
    
    await nostr.disconnect();
  }));

  it('should expose gift wrap decryption capability', withBugAnalysis(
    'Gift Wrap Decryption State',
    {
      testContext: 'Testing if we can detect when gift wrap decryption is available',
      expectedBehavior: 'Should be able to determine if cache can decrypt gift wraps',
      hasSpecReference: true, // NIP-59 spec
      hasDocumentationReference: false,
      isReproducible: true
    } satisfies Partial<AnalysisContext>
  )(async () => {
    
    const signer = new LocalKeySigner();
    const pubkey = await signer.getPublicKey();
    
    const nostr = new NostrUnchained({
      relays: [testEnv.relayUrl],
      signingProvider: signer,
      debug: true
    });
    
    await nostr.connect();
    
    // Start gift wrap subscription (this should be required for DM)
    console.log('🎁 Starting gift wrap subscription...');
    await nostr.startUniversalGiftWrapSubscription();
    
    // Check if subscription is active
    // Note: We don't have direct access to subscription state, so we infer it
    const cache = nostr.getCache();
    
    // Try to create a real gift wrap event and see if cache can handle it
    // This is indirect testing since we can't access private cache methods
    
    console.log('📊 Gift Wrap Subscription Test:', {
      cacheExists: !!cache,
      pubkey: pubkey.substring(0, 16) + '...',
      subscriptionActive: 'unknown' // We can't easily test this
    });
    
    // The real test: Can we use DM functionality end-to-end?
    const dmModule = nostr.getDM();
    expect(dmModule).toBeDefined();
    
    if (dmModule) {
      // Test DM creation (this depends on gift wrap subscription working)
      const otherUser = await testEnv.createTestUser('GiftWrapTest');
      const conversation = dmModule.with(otherUser.publicKey);
      
      expect(conversation).toBeDefined();
      console.log('✅ DM conversation with real user created');
      
      await otherUser.nostr.disconnect();
    }
    
    await nostr.disconnect();
  }));

  it('should demonstrate proper initialization order', withBugAnalysis(
    'Proper Initialization Order',
    {
      testContext: 'Testing the correct way to initialize NostrUnchained to avoid race conditions',
      expectedBehavior: 'Synchronous initialization should work without race conditions',
      hasSpecReference: false,
      hasDocumentationReference: true,
      isReproducible: true
    } satisfies Partial<AnalysisContext>
  )(async () => {
    
    // PROPOSED FIX: Initialize everything synchronously in correct order
    const signer = new LocalKeySigner();
    const pubkey = await signer.getPublicKey();
    
    console.log('🔧 Testing Proposed Fix: Synchronous Initialization');
    
    testEnv.startPerformanceMeasurement();
    
    // Step 1: Create with signing provider (current approach - has race condition)
    const nostr = new NostrUnchained({
      relays: [testEnv.relayUrl],
      signingProvider: signer,
      debug: true
    });
    
    // Step 2: Connect to relay
    await nostr.connect();
    
    // Step 3: Ensure initialization is complete before using advanced features
    // This is a workaround for the race condition
    await new Promise(resolve => setTimeout(resolve, 1000)); // Give async init time
    
    const initTime = testEnv.endPerformanceMeasurement('Full Initialization');
    
    // Step 4: Start gift wrap subscription explicitly
    await nostr.startUniversalGiftWrapSubscription();
    
    // Step 5: Now use DM functionality
    const dmModule = nostr.getDM();
    expect(dmModule).toBeDefined();
    
    console.log('✅ Proper Initialization Sequence:', {
      initTime,
      dmAvailable: !!dmModule,
      pubkey: pubkey.substring(0, 16) + '...'
    });
    
    if (dmModule) {
      const testPubkey = '2'.repeat(64);
      const conversation = dmModule.with(testPubkey);
      expect(conversation).toBeDefined();
      console.log('✅ DM functionality works with proper initialization order');
    }
    
    await nostr.disconnect();
  }));
});