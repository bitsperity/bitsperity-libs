/**
 * Performance Optimization Tests
 * 
 * Tests real performance characteristics of the NostrUnchained API.
 * NO mocks, NO fakes - only real performance measurements.
 * 
 * Focus: Day 6 Performance optimization features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '@/index';

describe('Performance Optimization', () => {
  let nostr: NostrUnchained;

  beforeEach(() => {
    nostr = new NostrUnchained({
      relays: [
        'ws://umbrel.local:4848',
        'wss://relay.damus.io'
      ],
      debug: true,
      timeout: 15000
    });
  });

  afterEach(async () => {
    await nostr.disconnect();
  });

  describe('Event Processing Performance', () => {
    it('should handle event processing with good performance', async () => {
      const startTime = Date.now();
      
      const store = nostr.query()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 2400) // Last 40 minutes
        .limit(50)
        .execute();

      const events = store.current;
      const totalTime = Date.now() - startTime;

      console.log(`⚡ Performance: ${events.length} events in ${totalTime}ms`);

      // Performance assertions
      expect(totalTime).toBeLessThan(15000); // Should complete within 15s
      expect(Array.isArray(events)).toBe(true);

      if (events.length > 0) {
        const avgTimePerEvent = totalTime / events.length;
        expect(avgTimePerEvent).toBeLessThan(1000); // <1s per event
        console.log(`⚡ Average time per event: ${avgTimePerEvent.toFixed(2)}ms`);
      }
    }, 20000);

    it('should maintain real-time responsiveness under load', async () => {
      const startTime = Date.now();
      let eventCount = 0;

      const handle = await nostr.sub()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 300) // Last 5 minutes
        .limit(20)
        .execute();

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 5000));

      const events = handle.store.current;
      const responseTime = Date.now() - startTime;

      console.log(`⚡ Real-time responsiveness: ${events.length} events in ${responseTime}ms`);

      // Performance requirements
      expect(responseTime).toBeLessThan(10000); // Should respond within 10s
      expect(handle.isActive()).toBe(true);

      await handle.stop();
    }, 15000);

    it('should scale subscription management efficiently', async () => {
      const startTime = Date.now();
      const handles = [];

      // Create multiple concurrent subscriptions
      for (let i = 0; i < 3; i++) {
        const handle = await nostr.sub()
          .kinds([1])
          .since(Math.floor(Date.now() / 1000) - 600 - (i * 60)) // Staggered time windows
          .limit(10)
          .execute();
        
        handles.push(handle);
      }

      const subscriptionTime = Date.now() - startTime;
      console.log(`⚡ Subscription scaling: ${handles.length} subscriptions in ${subscriptionTime}ms`);

      // All subscriptions should be active
      expect(handles.every(h => h.isActive())).toBe(true);
      expect(subscriptionTime).toBeLessThan(15000); // Should scale within 15s

      // Clean up all subscriptions
      await Promise.all(handles.map(h => h.stop()));
      
      // All should be inactive
      expect(handles.every(h => !h.isActive())).toBe(true);
    }, 25000);
  });

  describe('Memory Efficiency', () => {
    it('should demonstrate real memory efficiency with large event volumes', async () => {
      const initialMemory = process.memoryUsage();
      
      // Query for larger dataset
      const store = nostr.query()
        .kinds([1])
        .since(Math.floor(Date.now() / 1000) - 7200) // Last 2 hours
        .limit(100)
        .execute();

      const events = store.current;
      
      // Wait for any async cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalMemory = process.memoryUsage();
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerEvent = events.length > 0 ? memoryDelta / events.length : 0;

      console.log(`💾 Memory efficiency: ${events.length} events, ${(memoryDelta / 1024 / 1024).toFixed(2)}MB delta`);
      
      if (events.length > 0) {
        console.log(`💾 Memory per event: ${(memoryPerEvent / 1024).toFixed(2)}KB`);
        expect(memoryPerEvent).toBeLessThan(50 * 1024); // <50KB per event
      }
      
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // <100MB total
    }, 20000);
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent operations efficiently', async () => {
      const concurrentTasks = [
        // Multiple query operations
        async () => {
          const store = nostr.query().kinds([1]).limit(10).execute();
          return store.current.length;
        },
        async () => {
          const store = nostr.query().kinds([1]).limit(10).execute();
          return store.current.length;
        },
        async () => {
          const store = nostr.query().kinds([1]).limit(10).execute();
          return store.current.length;
        },
        // Multiple subscription operations
        async () => {
          const handle = await nostr.sub().kinds([1]).limit(10).execute();
          await new Promise(resolve => setTimeout(resolve, 2000));
          const eventCount = handle.store.current.length;
          await handle.stop();
          return eventCount;
        },
        async () => {
          const handle = await nostr.sub().kinds([1]).limit(10).execute();
          await new Promise(resolve => setTimeout(resolve, 2000));
          const eventCount = handle.store.current.length;
          await handle.stop();
          return eventCount;
        }
      ];

      const startTime = Date.now();
      const results = await Promise.all(concurrentTasks);
      const totalTime = Date.now() - startTime;

      console.log(`🔄 Concurrent operations: ${results.length} tasks in ${totalTime}ms`);
      console.log(`🔄 Results: ${results.join(', ')} events respectively`);

      // Performance requirements
      expect(totalTime).toBeLessThan(15000); // Should complete within 15s
      expect(results.every(r => typeof r === 'number')).toBe(true);
    }, 20000);
  });
});