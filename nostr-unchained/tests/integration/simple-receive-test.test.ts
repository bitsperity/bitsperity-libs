/**
 * Simple Receive Test - No global inbox, just conversation subscription
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 30000;

describe('Simple Receive Test', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;

  beforeEach(async () => {
    alice = new NostrUnchained({ relays: [LIVE_RELAY_URL], debug: true });
    bob = new NostrUnchained({ relays: [LIVE_RELAY_URL], debug: true });

    (alice as any).signingProvider = new TemporarySigner();
    (bob as any).signingProvider = new TemporarySigner();

    await Promise.all([alice.connect(), bob.connect()]);
    
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    await bob.dm.updateSigningProvider((bob as any).signingProvider);

    await new Promise(resolve => setTimeout(resolve, 2000));
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await Promise.all([alice?.disconnect(), bob?.disconnect()]);
  }, TEST_TIMEOUT);

  it('should receive DM via conversation subscription only', async () => {
    const alicePubkey = await (alice as any).signingProvider.getPublicKey();
    const bobPubkey = await (bob as any).signingProvider.getPublicKey();

    // Create conversations (this starts individual subscriptions)
    const aliceConversation = await alice.dm.with(bobPubkey);
    const bobConversation = await bob.dm.with(alicePubkey);
    
    // Wait for subscriptions to be active
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check conversation statuses
    const aliceStatus = await new Promise(resolve => {
      aliceConversation.status.subscribe(resolve);
    });
    
    const bobStatus = await new Promise(resolve => {
      bobConversation.status.subscribe(resolve);
    });

    console.log(`Alice conversation status: ${aliceStatus}`);
    console.log(`Bob conversation status: ${bobStatus}`);

    // Send message from Alice
    const message = `Test message ${Date.now()}`;
    const sendResult = await aliceConversation.send(message);
    
    expect(sendResult.success).toBe(true);
    console.log('✅ Alice sent message');

    // Wait longer for Bob to receive
    console.log('Waiting 10 seconds for Bob to receive...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check Bob's messages
    const bobMessages = await new Promise(resolve => {
      bobConversation.messages.subscribe(resolve);
    });

    console.log(`Bob has ${bobMessages.length} messages`);
    if (bobMessages.length > 0) {
      console.log('Bob messages:', bobMessages.map(m => ({
        content: m.content,
        from: m.senderPubkey.slice(0, 8),
        isFromMe: m.isFromMe
      })));
    }

    // If this fails, we have a subscription/decryption problem
    expect(bobMessages.length).toBeGreaterThan(0);
    expect(bobMessages[0].content).toBe(message);
  }, TEST_TIMEOUT);
});