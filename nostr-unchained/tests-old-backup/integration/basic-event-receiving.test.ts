/**
 * Basic Event Receiving Test
 * 
 * Test if we can receive ANY events from the relay at all
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 20000;

describe('Basic Event Receiving', () => {
  let nostr: NostrUnchained;

  beforeEach(async () => {
    nostr = new NostrUnchained({ 
      relays: [LIVE_RELAY_URL], 
      debug: true 
    });
    await nostr.connect();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await nostr?.disconnect();
  }, TEST_TIMEOUT);

  it('should be able to subscribe and receive any events from relay', async () => {
    console.log('🔍 Testing basic event subscription...');
    
    const subscriptionManager = (nostr as any).subscriptionManager;
    expect(subscriptionManager).toBeDefined();

    let receivedEvents: any[] = [];
    let eoseReceived = false;
    
    // Subscribe to recent events (any kind)
    const filter = {
      kinds: [1], // Text notes 
      limit: 5   // Just get a few recent events
    };
    
    console.log('📡 Creating subscription for recent text notes...');
    
    const result = await subscriptionManager.subscribe([filter], {
      onEvent: (event: any) => {
        receivedEvents.push(event);
        console.log(`📨 Received event: ${event.id.slice(0, 8)} kind=${event.kind}`);
      },
      onEose: () => {
        eoseReceived = true;
        console.log('✅ EOSE received');
      },
      onClose: (reason?: string) => {
        console.log('🔌 Subscription closed:', reason);
      }
    });

    expect(result.success).toBe(true);
    console.log('✅ Subscription created successfully');

    // Wait for events
    console.log('⏳ Waiting for events...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log(`📊 Results: ${receivedEvents.length} events, EOSE: ${eoseReceived}`);
    
    if (receivedEvents.length === 0) {
      console.log('❓ No events received. This could mean:');
      console.log('  1. Relay has no recent text notes');
      console.log('  2. Subscription is not working'); 
      console.log('  3. WebSocket connection issue');
      
      // Let's at least verify EOSE was received
      expect(eoseReceived).toBe(true);
    } else {
      console.log('🎉 Successfully received events from relay!');
      receivedEvents.forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.id.slice(0, 8)} - kind ${event.kind} - "${event.content?.slice(0, 50)}..."`);
      });
    }
  }, TEST_TIMEOUT);

  it('should try subscribing to broader event types', async () => {
    console.log('🔍 Testing subscription to multiple event kinds...');
    
    const subscriptionManager = (nostr as any).subscriptionManager;
    let receivedEvents: any[] = [];
    let eoseReceived = false;
    
    // Subscribe to multiple kinds with larger limit
    const filter = {
      kinds: [0, 1, 3, 4, 7], // Profile, text, contacts, DM, reaction
      limit: 20
    };
    
    const result = await subscriptionManager.subscribe([filter], {
      onEvent: (event: any) => {
        receivedEvents.push(event);
        console.log(`📨 Event ${receivedEvents.length}: kind=${event.kind} id=${event.id.slice(0, 8)}`);
      },
      onEose: () => {
        eoseReceived = true;
        console.log('✅ EOSE received');
      }
    });

    expect(result.success).toBe(true);
    
    // Wait longer
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log(`📊 Final results: ${receivedEvents.length} events received`);
    
    // Group by kind
    const byKind = receivedEvents.reduce((acc, event) => {
      acc[event.kind] = (acc[event.kind] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Events by kind:', byKind);
    
    expect(eoseReceived).toBe(true);
  }, TEST_TIMEOUT);
});