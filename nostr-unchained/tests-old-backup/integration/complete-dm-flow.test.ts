/**
 * Complete DM Flow Test
 * 
 * Tests the full cycle:
 * 1. Alice sends encrypted DM → relay
 * 2. Bob subscribes to encrypted events  
 * 3. Bob receives gift wrap event
 * 4. Bob automatically decrypts in background
 * 5. Bob's message cache contains decrypted message
 * 6. User only sees the real, decrypted message
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import type { DMMessage } from '../../src/dm/conversation/DMConversation.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 30000;

describe('Complete DM Flow', () => {
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

    console.log(`🔑 Alice: ${alicePubkey.slice(0, 8)}...`);
    console.log(`🔑 Bob: ${bobPubkey.slice(0, 8)}...`);

    await new Promise(resolve => setTimeout(resolve, 2000));
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await Promise.all([alice?.disconnect(), bob?.disconnect()]);
  }, TEST_TIMEOUT);

  it('should complete full send → receive → decrypt cycle', async () => {
    // 1. Create conversations
    const aliceConversation = await alice.dm.with(bobPubkey);
    const bobConversation = await bob.dm.with(alicePubkey);
    
    console.log('✅ Conversations created');

    // 2. Bob starts listening (this subscribes to encrypted gift wrap events)
    await bob.dm.startInboxSubscription();
    console.log('✅ Bob inbox subscription active');

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Alice sends message (this encrypts and publishes gift wrap)
    const testMessage = `Hello Bob! Complete flow test ${Date.now()}`;
    console.log(`📤 Alice sending: "${testMessage}"`);
    
    const sendResult = await aliceConversation.send(testMessage);
    expect(sendResult.success).toBe(true);
    console.log('✅ Alice sent message successfully');

    // 4. Wait for Bob to receive and decrypt
    console.log('⏳ Waiting for Bob to receive and decrypt...');
    
    let bobReceivedMessage: DMMessage | null = null;
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total
    
    while (attempts < maxAttempts && !bobReceivedMessage) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
      
      // Check Bob's message cache (should contain decrypted messages)
      const bobMessages = await new Promise<DMMessage[]>((resolve) => {
        bobConversation.messages.subscribe(messages => resolve(messages));
      });
      
      console.log(`🔍 Attempt ${attempts}: Bob has ${bobMessages.length} messages`);
      
      if (bobMessages.length > 0) {
        bobReceivedMessage = bobMessages.find(m => m.content === testMessage);
        if (bobReceivedMessage) {
          console.log('✅ Bob received the message!');
          break;
        }
      }
    }

    // 5. Verify Bob received the decrypted message
    expect(bobReceivedMessage).toBeDefined();
    expect(bobReceivedMessage!.content).toBe(testMessage);
    expect(bobReceivedMessage!.senderPubkey).toBe(alicePubkey);
    expect(bobReceivedMessage!.isFromMe).toBe(false);
    expect(bobReceivedMessage!.status).toBe('received');

    console.log('🎉 Complete DM flow successful!');
    console.log(`📨 Bob received: "${bobReceivedMessage!.content}"`);
    console.log(`👤 From: ${bobReceivedMessage!.senderPubkey.slice(0, 8)}...`);
  }, TEST_TIMEOUT);

  it('should handle bidirectional messaging', async () => {
    const aliceConversation = await alice.dm.with(bobPubkey);
    const bobConversation = await bob.dm.with(alicePubkey);
    
    // Both start listening
    await Promise.all([
      alice.dm.startInboxSubscription(),
      bob.dm.startInboxSubscription()
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Alice → Bob
    const aliceMessage = `Hi Bob! ${Date.now()}`;
    await aliceConversation.send(aliceMessage);
    console.log(`Alice → Bob: "${aliceMessage}"`);

    // Wait for Bob to receive
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Bob → Alice  
    const bobMessage = `Hi Alice! Got your message. ${Date.now()}`;
    await bobConversation.send(bobMessage);
    console.log(`Bob → Alice: "${bobMessage}"`);

    // Wait for Alice to receive
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check both have received messages
    const aliceMessages = await new Promise<DMMessage[]>((resolve) => {
      aliceConversation.messages.subscribe(resolve);
    });
    
    const bobMessages = await new Promise<DMMessage[]>((resolve) => {
      bobConversation.messages.subscribe(resolve);
    });

    console.log(`Alice has ${aliceMessages.length} messages`);
    console.log(`Bob has ${bobMessages.length} messages`);

    // Each should have 2 messages: one sent, one received
    expect(aliceMessages.length).toBeGreaterThanOrEqual(1);
    expect(bobMessages.length).toBeGreaterThanOrEqual(1);

    // Verify Alice received Bob's message
    const aliceReceivedFromBob = aliceMessages.find(m => 
      m.content === bobMessage && m.senderPubkey === bobPubkey
    );
    
    // Verify Bob received Alice's message  
    const bobReceivedFromAlice = bobMessages.find(m =>
      m.content === aliceMessage && m.senderPubkey === alicePubkey
    );

    expect(aliceReceivedFromBob).toBeDefined();
    expect(bobReceivedFromAlice).toBeDefined();

    console.log('🎉 Bidirectional messaging successful!');
  }, TEST_TIMEOUT);
});