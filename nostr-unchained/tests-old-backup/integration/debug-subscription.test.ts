/**
 * Debug Subscription Test
 * 
 * Tests each step of the subscription and decryption process
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 30000;

describe('Debug Subscription', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;
  let alicePubkey: string;
  let bobPubkey: string;

  beforeEach(async () => {
    alice = new NostrUnchained({ relays: [LIVE_RELAY_URL], debug: true });
    bob = new NostrUnchained({ relays: [LIVE_RELAY_URL], debug: true });

    (alice as any).signingProvider = new TemporarySigner();
    (bob as any).signingProvider = new TemporarySigner();

    await Promise.all([alice.connect(), bob.connect()]);
    
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    await bob.dm.updateSigningProvider((bob as any).signingProvider);

    alicePubkey = await (alice as any).signingProvider.getPublicKey();
    bobPubkey = await (bob as any).signingProvider.getPublicKey();

    console.log(`🔑 Alice: ${alicePubkey}`);
    console.log(`🔑 Bob: ${bobPubkey}`);
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await Promise.all([alice?.disconnect(), bob?.disconnect()]);
  }, TEST_TIMEOUT);

  it('should check if Bob can start inbox subscription', async () => {
    console.log('📡 Starting Bob inbox subscription...');
    
    try {
      await bob.dm.startInboxSubscription();
      console.log('✅ Bob inbox subscription started successfully');
    } catch (error) {
      console.error('❌ Bob inbox subscription failed:', error);
      throw error;
    }
  }, TEST_TIMEOUT);

  it('should check Bob conversation status', async () => {
    const bobConversation = await bob.dm.with(alicePubkey);
    
    const status = await new Promise(resolve => {
      bobConversation.status.subscribe(status => {
        console.log(`📊 Bob conversation status: ${status}`);
        resolve(status);
      });
    });

    console.log(`Final status: ${status}`);
    expect(['connecting', 'active', 'error', 'disconnected']).toContain(status);
  }, TEST_TIMEOUT);

  it('should manually test subscription manager', async () => {
    console.log('🧪 Testing manual subscription...');
    
    const subscriptionManager = (bob as any).subscriptionManager;
    console.log('Subscription manager:', !!subscriptionManager);
    
    if (subscriptionManager) {
      console.log('📡 Creating manual subscription for kind 1059...');
      
      const filter = {
        kinds: [1059],
        '#p': [bobPubkey],
        limit: 10
      };
      
      let eventCount = 0;
      
      const result = await subscriptionManager.subscribe([filter], {
        onEvent: (event: any) => {
          eventCount++;
          console.log(`📨 Received event ${eventCount}:`, {
            id: event.id.slice(0, 8),
            kind: event.kind,
            pubkey: event.pubkey.slice(0, 8),
            tags: event.tags
          });
        },
        onEose: () => {
          console.log('✅ Manual subscription EOSE');
        },
        onClose: (reason?: string) => {
          console.log('🔌 Manual subscription closed:', reason);
        }
      });
      
      console.log('Subscription result:', result);
      expect(result.success).toBe(true);
      
      // Wait to see if we get any events
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log(`Total events received: ${eventCount}`);
    }
  }, TEST_TIMEOUT);

  it('should test Alice sending and check what events are created', async () => {
    console.log('📤 Testing Alice sending DM...');
    
    const aliceConversation = await alice.dm.with(bobPubkey);
    const testMessage = `Debug test ${Date.now()}`;
    
    console.log(`Sending message: "${testMessage}"`);
    console.log(`From: ${alicePubkey}`);
    console.log(`To: ${bobPubkey}`);
    
    const result = await aliceConversation.send(testMessage);
    console.log('Send result:', result);
    
    expect(result.success).toBe(true);
    
    // Check if we can see the message in Alice's conversation
    const aliceMessages = await new Promise(resolve => {
      aliceConversation.messages.subscribe(messages => {
        console.log(`Alice has ${messages.length} messages in her conversation`);
        resolve(messages);
      });
    });
    
    console.log('Alice messages:', aliceMessages);
  }, TEST_TIMEOUT);
});