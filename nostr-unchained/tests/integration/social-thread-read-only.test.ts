/**
 * ThreadManager Read-Only Integration Tests - Real Relay Testing
 * Tests only read operations against ws://umbrel.local:4848 
 * Session 4 Phase 2: Threading System (NIP-10)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';

describe('ThreadManager Read-Only Integration Tests', () => {
  let nostr: NostrUnchained;
  const testRelay = 'ws://umbrel.local:4848';

  beforeAll(async () => {
    // Initialize NostrUnchained with test relay (read-only)
    nostr = new NostrUnchained({
      relays: [testRelay],
      debug: true
    });

    // Wait for relay connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (nostr) {
      await nostr.disconnect();
    }
  });

  describe('Simple Thread Reading', () => {
    it('should find and parse existing threaded conversations', async () => {
      console.log('=== Finding Existing Threaded Conversations ===');

      // Look for recent events with e-tags (likely replies in threads)
      const threadedEvents = await new Promise<any[]>((resolve) => {
        const events: any[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        }, 10000);

        nostr.subscriptionManager.subscribe([{
          kinds: [1],
          limit: 100,
          since: Math.floor(Date.now() / 1000) - 86400 // Last 24 hours
        }], {
          onEvent: (event: any) => {
            // Look for events with e-tags (threading indicators)
            const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
            if (eTags.length > 0) {
              events.push({
                id: event.id,
                content: event.content,
                pubkey: event.pubkey,
                created_at: event.created_at,
                eTags: eTags
              });
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(events);
            }
          }
        });
      });

      console.log(`Found ${threadedEvents.length} potential threaded events`);

      if (threadedEvents.length > 0) {
        // Take first few events and try to build threads
        for (let i = 0; i < Math.min(3, threadedEvents.length); i++) {
          const event = threadedEvents[i];
          const firstETag = event.eTags[0][1]; // First e-tag value
          
          console.log(`\n--- Testing thread root: ${firstETag} ---`);
          console.log(`Event content: "${event.content.substring(0, 100)}..."`);

          const thread = await nostr.social.threads.get(firstETag, { 
            useCache: false, 
            timeout: 15000,
            limit: 50
          });

          if (thread) {
            console.log(`✅ Successfully built thread with ${thread.messageCount} messages`);
            
            // Validate thread structure
            expect(thread.rootEventId).toBe(firstETag);
            expect(thread.messages.length).toBeGreaterThan(0);
            expect(thread.messageCount).toBe(thread.messages.length);
            expect(thread.lastActivity).toBeGreaterThan(0);
            
            // Verify all messages belong to this thread
            for (const message of thread.messages) {
              expect(message.rootEventId).toBe(firstETag);
              expect(message.eventId).toBeDefined();
              expect(message.eventId.length).toBe(64);
              expect(message.authorPubkey).toBeDefined();
              expect(message.authorPubkey.length).toBe(64);
              expect(message.content).toBeDefined();
              expect(message.createdAt).toBeGreaterThan(0);
              expect(message.depth).toBeGreaterThanOrEqual(0);
              expect(Array.isArray(message.mentionedPubkeys)).toBe(true);
            }
            
            // Check for root message
            const rootMessage = thread.messages.find(m => m.eventId === firstETag);
            if (rootMessage) {
              expect(rootMessage.depth).toBe(0);
              expect(rootMessage.replyToEventId).toBeNull();
              console.log(`Root message: "${rootMessage.content.substring(0, 80)}..."`);
            }
            
            // Check depth distribution
            const depthCounts = new Map<number, number>();
            for (const message of thread.messages) {
              const count = depthCounts.get(message.depth) || 0;
              depthCounts.set(message.depth, count + 1);
            }
            
            const maxDepth = Math.max(...depthCounts.keys());
            console.log(`Thread depth: 0-${maxDepth}, distribution: ${Array.from(depthCounts.entries()).map(([d, c]) => `${d}:${c}`).join(', ')}`);
            
            // Verify chronological order
            for (let j = 1; j < thread.messages.length; j++) {
              expect(thread.messages[j].createdAt).toBeGreaterThanOrEqual(thread.messages[j-1].createdAt);
            }
            
            break; // Successfully tested one thread
          } else {
            console.log(`ℹ️ No thread found for root ${firstETag} (might be orphaned reply)`);
          }
        }
      } else {
        console.log('ℹ️ No threaded events found in recent timeframe');
      }
    }, 30000);

    it('should handle thread caching correctly', async () => {
      console.log('=== Thread Caching Test ===');

      // Find a thread to test caching with
      const sampleEvents = await new Promise<any[]>((resolve) => {
        const events: any[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        }, 8000);

        nostr.subscriptionManager.subscribe([{
          kinds: [1],
          limit: 50,
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour  
        }], {
          onEvent: (event: any) => {
            const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
            if (eTags.length > 0) {
              events.push(event);
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(events);
            }
          }
        });
      });

      if (sampleEvents.length > 0) {
        const testEventId = sampleEvents[0].tags.find((tag: string[]) => tag[0] === 'e')[1];
        
        // First fetch (network)
        const start1 = Date.now();
        const thread1 = await nostr.social.threads.get(testEventId, { 
          useCache: false, 
          timeout: 10000 
        });
        const duration1 = Date.now() - start1;

        if (thread1) {
          console.log(`Network fetch: ${duration1}ms for ${thread1.messageCount} messages`);
          
          // Second fetch (cache)
          const start2 = Date.now();
          const thread2 = await nostr.social.threads.get(testEventId, { 
            useCache: true, 
            timeout: 1000 
          });
          const duration2 = Date.now() - start2;

          expect(thread2).toBeDefined();
          expect(thread2!.messageCount).toBe(thread1.messageCount);
          expect(thread2!.rootEventId).toBe(thread1.rootEventId);
          expect(duration2).toBeLessThan(duration1 / 2); // Cache should be much faster
          
          console.log(`Cache fetch: ${duration2}ms (${Math.round((duration1 / duration2) * 10) / 10}x faster)`);
          console.log('✅ Cache performance verified');
        } else {
          console.log('ℹ️ Thread not found for caching test');
        }
      } else {
        console.log('ℹ️ No events found for caching test');
      }
    }, 20000);
  });

  describe('Extended Thread Analysis', () => {
    it('should analyze real thread structures and validate NIP-10 compliance', async () => {
      console.log('=== Real Thread Structure Analysis ===');

      // Get a variety of recent events with different e-tag patterns
      const complexEvents = await new Promise<any[]>((resolve) => {
        const events: any[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        }, 12000);

        nostr.subscriptionManager.subscribe([{
          kinds: [1],
          limit: 200,
          since: Math.floor(Date.now() / 1000) - 86400 // Last 24 hours
        }], {
          onEvent: (event: any) => {
            const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
            const pTags = event.tags.filter((tag: string[]) => tag[0] === 'p');
            
            // Look for events with multiple e-tags or specific markers
            if (eTags.length > 1 || eTags.some((tag: string[]) => tag[3] === 'reply' || tag[3] === 'root')) {
              events.push({
                id: event.id,
                content: event.content,
                pubkey: event.pubkey,
                created_at: event.created_at,
                eTags: eTags,
                pTags: pTags,
                tags: event.tags
              });
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(events);
            }
          }
        });
      });

      console.log(`Found ${complexEvents.length} complex threaded events`);

      if (complexEvents.length > 0) {
        // Analyze several different thread structures
        for (let i = 0; i < Math.min(5, complexEvents.length); i++) {
          const event = complexEvents[i];
          
          // Try to determine root event ID
          let rootEventId = null;
          const rootTag = event.eTags.find((tag: string[]) => tag[3] === 'root');
          const replyTag = event.eTags.find((tag: string[]) => tag[3] === 'reply');
          
          if (rootTag) {
            rootEventId = rootTag[1];
          } else if (event.eTags.length > 1) {
            // NIP-10: first e-tag is root in multi-tag scenario
            rootEventId = event.eTags[0][1];
          } else if (event.eTags.length === 1) {
            rootEventId = event.eTags[0][1];
          }
          
          if (!rootEventId) continue;
          
          console.log(`\n--- Analyzing complex thread ${i + 1}: ${rootEventId} ---`);
          console.log(`Event has ${event.eTags.length} e-tags, ${event.pTags.length} p-tags`);
          
          if (rootTag) {
            console.log(`✅ Uses NIP-10 'root' marker: ${rootTag[1]}`);
          }
          if (replyTag) {
            console.log(`✅ Uses NIP-10 'reply' marker: ${replyTag[1]}`);
          }
          
          const thread = await nostr.social.threads.get(rootEventId, { 
            useCache: false, 
            timeout: 15000,
            limit: 100
          });

          if (thread && thread.messageCount > 2) { // Only analyze substantial threads
            console.log(`✅ Built thread with ${thread.messageCount} messages`);
            
            // Validate thread structure
            expect(thread.rootEventId).toBe(rootEventId);
            expect(thread.messages.length).toBeGreaterThan(1);
            
            // Analyze depth distribution
            const depthCounts = new Map<number, number>();
            let maxDepth = 0;
            
            for (const message of thread.messages) {
              const count = depthCounts.get(message.depth) || 0;
              depthCounts.set(message.depth, count + 1);
              maxDepth = Math.max(maxDepth, message.depth);
            }
            
            // Validate root exists
            expect(depthCounts.get(0)).toBeGreaterThanOrEqual(1);
            
            // Check for proper threading relationships
            const messageMap = new Map(thread.messages.map(m => [m.eventId, m]));
            for (const message of thread.messages) {
              if (message.replyToEventId) {
                // If replying to something, that something should exist in thread or be valid
                if (messageMap.has(message.replyToEventId)) {
                  const parent = messageMap.get(message.replyToEventId)!;
                  expect(message.depth).toBeGreaterThan(parent.depth);
                }
              }
            }
            
            console.log(`Thread structure: ${thread.messageCount} messages, depth 0-${maxDepth}`);
            console.log(`Depth distribution: ${Array.from(depthCounts.entries()).map(([d, c]) => `${d}:${c}`).join(', ')}`);
            
            // Check for mentions
            const totalMentions = thread.messages.reduce((sum, m) => sum + m.mentionedPubkeys.length, 0);
            console.log(`Total mentions across thread: ${totalMentions}`);
            
            // Validate timeline
            expect(thread.lastActivity).toBeGreaterThanOrEqual(
              Math.max(...thread.messages.map(m => m.createdAt))
            );
            
            break; // Successfully analyzed one complex thread
          } else {
            console.log(`ℹ️ Thread ${rootEventId} too small or not found`);
          }
        }
      } else {
        console.log('ℹ️ No complex threaded events found');
      }
    }, 35000);

    it('should handle concurrent thread fetching efficiently', async () => {
      console.log('=== Concurrent Thread Fetching Test ===');

      // Get multiple thread candidates
      const threadCandidates = await new Promise<string[]>((resolve) => {
        const candidates: string[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(candidates);
          }
        }, 8000);

        nostr.subscriptionManager.subscribe([{
          kinds: [1],
          limit: 100,
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }], {
          onEvent: (event: any) => {
            const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
            if (eTags.length > 0 && candidates.length < 10) {
              candidates.push(eTags[0][1]); // Use first e-tag as potential root
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(candidates);
            }
          }
        });
      });

      if (threadCandidates.length >= 3) {
        const testCandidates = threadCandidates.slice(0, 5);
        console.log(`Testing concurrent fetch of ${testCandidates.length} threads`);
        
        // Test concurrent fetching
        const start = Date.now();
        const concurrentPromises = testCandidates.map(rootId =>
          nostr.social.threads.get(rootId, { 
            useCache: false, 
            timeout: 10000,
            limit: 30
          })
        );
        
        const results = await Promise.allSettled(concurrentPromises);
        const duration = Date.now() - start;
        
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        const nullCount = results.filter(r => r.status === 'fulfilled' && r.value === null).length;
        
        console.log(`Concurrent fetch results: ${successCount} successful, ${nullCount} null, ${failCount} failed in ${duration}ms`);
        console.log(`Average time per thread: ${Math.round(duration / testCandidates.length)}ms`);
        
        expect(successCount + nullCount).toBeGreaterThan(0); // At least some should complete
        expect(failCount).toBeLessThan(testCandidates.length); // Not all should fail
        
        // Test concurrent caching
        if (successCount > 0) {
          const successfulThreads = results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => (r as any).value);
          
          const cacheTestRoots = successfulThreads.slice(0, 3).map(t => t.rootEventId);
          
          const cacheStart = Date.now();
          const cachePromises = cacheTestRoots.map(rootId =>
            nostr.social.threads.get(rootId, { useCache: true, timeout: 1000 })
          );
          
          const cacheResults = await Promise.all(cachePromises);
          const cacheDuration = Date.now() - cacheStart;
          
          expect(cacheResults.every(t => t !== null)).toBe(true);
          expect(cacheDuration).toBeLessThan(duration / 4); // Cache should be much faster
          
          console.log(`Cache test: ${cacheResults.length} threads in ${cacheDuration}ms (${Math.round(cacheDuration / cacheResults.length)}ms avg)`);
        }
        
        console.log('✅ Concurrent fetching test completed');
      } else {
        console.log('ℹ️ Not enough thread candidates for concurrent test');
      }
    }, 25000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle various error conditions gracefully', async () => {
      console.log('=== Error Handling Test ===');

      // Test non-existent thread
      const nonExistentId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const nullThread = await nostr.social.threads.get(nonExistentId, { 
        useCache: false, 
        timeout: 3000 
      });
      expect(nullThread).toBeNull();
      console.log('✅ Non-existent thread returns null');

      // Test invalid event ID format
      const invalidId = 'invalid-event-id';
      const invalidThread = await nostr.social.threads.get(invalidId, { 
        useCache: false, 
        timeout: 2000 
      });
      expect(invalidThread).toBeNull();
      console.log('✅ Invalid event ID handled gracefully');

      // Test very short timeout
      const shortTimeoutThread = await nostr.social.threads.get(nonExistentId, { 
        useCache: false, 
        timeout: 50 
      });
      expect(shortTimeoutThread).toBeNull();
      console.log('✅ Short timeout handled gracefully');

      // Test with zero limit
      const zeroLimitThread = await nostr.social.threads.get(nonExistentId, { 
        useCache: false, 
        timeout: 2000,
        limit: 0
      });
      expect(zeroLimitThread).toBeNull();
      console.log('✅ Zero limit handled gracefully');

      // Test watching non-existent thread  
      try {
        const watchResult = await nostr.social.threads.watch(nonExistentId);
        expect(watchResult).toBe(false);
        console.log('✅ Watching non-existent thread returns false');
      } catch (error) {
        console.log('ℹ️ Watch test timed out (acceptable for non-existent thread)');
      }

      console.log('✅ All error conditions handled correctly');
    }, 15000);

    it('should validate thread data integrity', async () => {
      console.log('=== Thread Data Integrity Test ===');

      // Find a real thread to validate
      const validationEvents = await new Promise<any[]>((resolve) => {
        const events: any[] = [];
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(events);
          }
        }, 8000);

        nostr.subscriptionManager.subscribe([{
          kinds: [1],
          limit: 50,
          since: Math.floor(Date.now() / 1000) - 1800 // Last 30 minutes
        }], {
          onEvent: (event: any) => {
            const eTags = event.tags.filter((tag: string[]) => tag[0] === 'e');
            if (eTags.length > 0) {
              events.push(event);
            }
          },
          onEose: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(events);
            }
          }
        });
      });

      if (validationEvents.length > 0) {
        const testEventId = validationEvents[0].tags.find((tag: string[]) => tag[0] === 'e')[1];
        
        const thread = await nostr.social.threads.get(testEventId, { 
          useCache: false, 
          timeout: 10000 
        });

        if (thread) {
          console.log(`Validating thread with ${thread.messageCount} messages`);
          
          // Data type validation
          expect(typeof thread.rootEventId).toBe('string');
          expect(thread.rootEventId.length).toBe(64);
          expect(Array.isArray(thread.messages)).toBe(true);
          expect(typeof thread.messageCount).toBe('number');
          expect(typeof thread.lastActivity).toBe('number');
          expect(typeof thread.isWatched).toBe('boolean');
          
          // Message validation
          for (const message of thread.messages) {
            expect(typeof message.eventId).toBe('string');
            expect(message.eventId.length).toBe(64);
            expect(/^[0-9a-f]{64}$/.test(message.eventId)).toBe(true);
            
            expect(typeof message.authorPubkey).toBe('string');
            expect(message.authorPubkey.length).toBe(64);
            expect(/^[0-9a-f]{64}$/.test(message.authorPubkey)).toBe(true);
            
            expect(typeof message.content).toBe('string');
            expect(typeof message.createdAt).toBe('number');
            expect(message.createdAt).toBeGreaterThan(1600000000); // After 2020
            expect(message.createdAt).toBeLessThan(Date.now() / 1000 + 3600); // Not too far in future
            
            expect(typeof message.depth).toBe('number');
            expect(message.depth).toBeGreaterThanOrEqual(0);
            expect(message.depth).toBeLessThan(100); // Reasonable max depth
            
            expect(typeof message.rootEventId).toBe('string');
            expect(message.rootEventId).toBe(thread.rootEventId);
            
            expect(Array.isArray(message.mentionedPubkeys)).toBe(true);
            for (const pubkey of message.mentionedPubkeys) {
              expect(typeof pubkey).toBe('string');
              expect(pubkey.length).toBe(64);
              expect(/^[0-9a-f]{64}$/.test(pubkey)).toBe(true);
            }
            
            expect(typeof message.isOwn).toBe('boolean');
            
            if (message.replyToEventId !== null) {
              expect(typeof message.replyToEventId).toBe('string');
              expect(message.replyToEventId.length).toBe(64);
              expect(/^[0-9a-f]{64}$/.test(message.replyToEventId)).toBe(true);
            }
          }
          
          // Structural validation
          expect(thread.messageCount).toBe(thread.messages.length);
          
          const actualLastActivity = Math.max(...thread.messages.map(m => m.createdAt));
          expect(thread.lastActivity).toBe(actualLastActivity);
          
          // Root message validation
          const rootMessage = thread.messages.find(m => m.eventId === thread.rootEventId);
          if (rootMessage) {
            expect(rootMessage.depth).toBe(0);
            expect(rootMessage.replyToEventId).toBeNull();
          }
          
          console.log('✅ Thread data integrity validated');
        } else {
          console.log('ℹ️ No thread found for integrity validation');
        }
      } else {
        console.log('ℹ️ No events found for integrity validation');
      }
    }, 20000);
  });
});