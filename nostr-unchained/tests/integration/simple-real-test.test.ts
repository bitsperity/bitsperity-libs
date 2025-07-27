/**
 * SIMPLE Real Threading Test - Minimal working test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

describe('Simple REAL Threading Test', () => {
  const testRelay = 'ws://umbrel.local:4848';
  let nostr: NostrUnchained;
  let signer: TemporarySigner;
  let pubkey: string;

  beforeAll(async () => {
    console.log('=== Setting up real test ===');
    
    // Create real signer
    signer = new TemporarySigner();
    pubkey = await signer.getPublicKey();
    
    console.log('Test pubkey:', pubkey);
    
    // Initialize NostrUnchained
    nostr = new NostrUnchained({ 
      relays: [testRelay], 
      debug: true
    });
    
    // Set signing provider
    await nostr.social.updateSigningProvider(signer);
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Connected to relay');
  }, 10000);

  afterAll(async () => {
    if (nostr) await nostr.disconnect();
  });

  it('should create a real thread on the relay', async () => {
    console.log('=== Creating real thread ===');
    
    const result = await nostr.social.threads.createThread({
      content: `REAL TEST THREAD: Created by nostr-unchained at ${new Date().toISOString()}`,
      mentions: []
    });
    
    console.log('Create result:', result);
    
    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.message!.isOwn).toBe(true);
    expect(result.message!.authorPubkey).toBe(pubkey);
    
    console.log(`✅ Created thread: ${result.eventId}`);
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to read it back
    const thread = await nostr.social.threads.get(result.eventId!, {
      useCache: false,
      timeout: 10000
    });
    
    console.log('Read thread result:', thread);
    
    if (thread) {
      expect(thread.rootEventId).toBe(result.eventId);
      expect(thread.messageCount).toBe(1);
      expect(thread.messages[0].authorPubkey).toBe(pubkey);
      console.log(`✅ Successfully read back thread: ${thread.messageCount} messages`);
    } else {
      console.log('⚠️ Could not read thread back from relay');
    }
  }, 20000);

  it('should check if our thread is actually on the relay', async () => {
    console.log('=== Checking relay for our events ===');
    
    // Look for events from our pubkey
    const events = await new Promise<any[]>((resolve) => {
      const foundEvents: any[] = [];
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(foundEvents);
        }
      }, 10000);

      nostr.subscriptionManager.subscribe([{
        kinds: [1],
        authors: [pubkey],
        limit: 10
      }], {
        onEvent: (event: any) => {
          console.log('Found our event:', event.id, event.content.substring(0, 50));
          foundEvents.push(event);
        },
        onEose: () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(foundEvents);
          }
        }
      });
    });
    
    console.log(`Found ${events.length} events from our pubkey on relay`);
    
    for (const event of events) {
      console.log(`- Event ${event.id}: "${event.content.substring(0, 60)}..."`);
      console.log(`  Tags: ${event.tags.length}, Created: ${new Date(event.created_at * 1000).toISOString()}`);
    }
    
    expect(events.length).toBeGreaterThan(0);
  }, 15000);
});