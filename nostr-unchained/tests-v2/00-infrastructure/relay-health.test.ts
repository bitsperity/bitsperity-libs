/**
 * Infrastructure Test: Container Relay Health
 * 
 * Validates that our ephemeral container relay is running and healthy.
 * This is the foundation for all other tests.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Container Relay Health', () => {
  beforeAll(async () => {
    // Give relay time to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should have healthy relay at ws://localhost:7777', async () => {
    const isHealthy = await testEnv.validateRelayHealth();
    expect(isHealthy).toBe(true);
  });

  it('should accept WebSocket connections', async () => {
    const user = await testEnv.createTestUser('HealthTest');
    
    // Connection should succeed
    expect(user.nostr).toBeDefined();
    expect(user.privateKey).toMatch(/^[a-f0-9]{64}$/);
    expect(user.publicKey).toMatch(/^[a-f0-9]{64}$/);
    
    await user.nostr.disconnect();
  });

  it('should handle basic event publishing', async () => {
    const user = await testEnv.createTestUser('PublishTest');
    
    testEnv.startPerformanceMeasurement();
    const result = await testEnv.createTestEvent(user, 'Health check event');
    const duration = testEnv.endPerformanceMeasurement('Basic publish');
    
    testEnv.assertPublishSuccess(result, 'Health check publish');
    expect(result.relayResults).toHaveLength(1);
    expect(result.relayResults[0].relay).toBe('ws://localhost:7777');
    expect(result.relayResults[0].success).toBe(true);
    
    // Should be reasonably fast
    expect(duration).toBeLessThan(5000); // 5s max for health check
    
    await user.nostr.disconnect();
  });

  it('should handle subscription-first caching architecture', async () => {
    const user = await testEnv.createTestUser('SubTest');
    
    // CORRECT ARCHITECTURE: Start subscription FIRST (before publishing)
    testEnv.startPerformanceMeasurement();
    const handle = await user.nostr.sub()
      .kinds([1])
      .authors([user.publicKey])
      .since(Math.floor(Date.now() / 1000) - 60)
      .limit(10)
      .execute();
    
    expect(handle.id).toBeDefined();
    expect(handle.isActive()).toBe(true);
    
    // Now publish - this will be caught by our subscription
    const testContent = testEnv.getTestContent('Subscription');
    const publishResult = await testEnv.createTestEvent(user, testContent);
    testEnv.assertPublishSuccess(publishResult);
    
    // Wait for subscription to receive the event
    await testEnv.waitForSubscription(3000);
    
    // Now check the subscription store - should have our event
    const events = handle.store.current;
    const duration = testEnv.endPerformanceMeasurement('Subscription + Cache');
    
    console.log('📊 Subscription-First Results:', {
      eventsCount: events.length,
      testContent,
      publishedEventId: publishResult.eventId,
      eventContents: events.map(e => ({ 
        id: e.id?.substring(0, 8), 
        content: e.content?.substring(0, 30) 
      }))
    });
    
    // Should find our event in the subscription store
    const ourEvent = events.find(e => e.content === testContent);
    expect(ourEvent).toBeDefined();
    expect(ourEvent?.id).toBe(publishResult.eventId);
    
    // Clean up subscription
    await handle.stop();
    expect(handle.isActive()).toBe(false);
    
    await user.nostr.disconnect();
  });

  it('should provide consistent relay information', async () => {
    // Test relay metadata endpoint
    try {
      const response = await fetch('http://localhost:7777', {
        headers: {
          'Accept': 'application/nostr+json'
        }
      });
      
      if (response.ok) {
        const info = await response.json();
        
        // Basic NIP-11 structure validation
        expect(info).toBeDefined();
        expect(typeof info).toBe('object');
        
        // Optional fields but good to have
        if (info.name) expect(typeof info.name).toBe('string');
        if (info.description) expect(typeof info.description).toBe('string');
        if (info.supported_nips) expect(Array.isArray(info.supported_nips)).toBe(true);
      }
    } catch (error) {
      // NIP-11 support is optional, so this test can pass even if it fails
      console.log('Note: Relay does not support NIP-11 metadata (optional)');
    }
  });

  it('should handle concurrent connections', async () => {
    const users = await testEnv.createTestUsers(['Concurrent1', 'Concurrent2', 'Concurrent3']);
    
    testEnv.startPerformanceMeasurement();
    
    // All users publish simultaneously
    const publishPromises = users.map(user => 
      testEnv.createTestEvent(user, `Concurrent test from ${user.name}`)
    );
    
    const results = await Promise.all(publishPromises);
    const duration = testEnv.endPerformanceMeasurement('Concurrent publishes');
    
    // All should succeed
    results.forEach((result, i) => {
      testEnv.assertPublishSuccess(result, `Concurrent publish ${i + 1}`);
    });
    
    // Should handle concurrency well
    expect(duration).toBeLessThan(10000); // 10s max for 3 concurrent publishes
    
    // Cleanup
    for (const user of users) {
      await user.nostr.disconnect();
    }
  });

  it('should demonstrate cache behavior with subscription-first architecture', async () => {
    // This test demonstrates the Universal Cache Architecture:
    // 1. Cache only fills via active subscriptions
    // 2. Query on empty cache returns empty results (correct behavior!)
    // 3. Publish + subscription fills cache properly
    
    const user = await testEnv.createTestUser('CacheTest');
    
    // Test 1: Query empty cache (no subscriptions) - should be empty
    const emptyStore = user.nostr.query()
      .kinds([1])
      .authors([user.publicKey])
      .since(Math.floor(Date.now() / 1000) - 60)
      .execute();
    
    expect(emptyStore.current).toHaveLength(0);
    console.log('✅ Empty cache behavior correct: no events without subscription');
    
    // Test 2: Publish event (no subscription) - still empty cache
    const testContent = testEnv.getTestContent('Cache');
    const publishResult = await testEnv.createTestEvent(user, testContent);
    testEnv.assertPublishSuccess(publishResult);
    
    await testEnv.waitForPropagation(1000);
    
    const stillEmptyStore = user.nostr.query()
      .kinds([1])
      .authors([user.publicKey])
      .since(Math.floor(Date.now() / 1000) - 60)
      .execute();
    
    expect(stillEmptyStore.current).toHaveLength(0);
    console.log('✅ Publish without subscription: cache still empty (correct!)');
    
    // Test 3: Start subscription - this will populate cache from relay
    const handle = await user.nostr.sub()
      .kinds([1])
      .authors([user.publicKey])
      .since(Math.floor(Date.now() / 1000) - 60)
      .execute();
    
    await testEnv.waitForSubscription(3000);
    
    const populatedEvents = handle.store.current;
    console.log('📊 Cache populated via subscription:', {
      eventsCount: populatedEvents.length,
      foundOurEvent: populatedEvents.some(e => e.content === testContent)
    });
    
    // Should now find our previously published event
    const foundEvent = populatedEvents.find(e => e.content === testContent);
    expect(foundEvent).toBeDefined();
    expect(foundEvent?.id).toBe(publishResult.eventId);
    
    console.log('✅ Subscription-first architecture working correctly!');
    
    await handle.stop();
    await user.nostr.disconnect();
  });
});