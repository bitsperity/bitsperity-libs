/**
 * Gift Wrap Decryption Debugging Test
 * Deep debugging why published Gift Wraps aren't being decrypted for recipients
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import type { TestUser } from '../shared/TestEnvironment.js';

describe('Gift Wrap Decryption Debug', () => {
  let alice: TestUser;
  let bob: TestUser;
  
  beforeAll(async () => {
    [alice, bob] = await testEnv.createTestUsers(['Alice_Decrypt', 'Bob_Decrypt']);
    console.log('🔍 Debug users created:', {
      alicePubkey: alice.publicKey.slice(0, 8) + '...',
      bobPubkey: bob.publicKey.slice(0, 8) + '...'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should debug Gift Wrap subscription and decryption process', async () => {
    console.log('\n🔍 DEEP DEBUG: Gift Wrap Decryption Process...');
    
    // Step 1: Create DM conversations with debug logging
    const aliceToBob = alice.nostr.getDM()?.with(bob.publicKey);
    const bobToAlice = bob.nostr.getDM()?.with(alice.publicKey);
    
    console.log('✅ Conversations created');
    
    // Step 2: Check initial cache states
    console.log('\n📊 Initial Cache States:');
    console.log('Alice messages cache:', aliceToBob?.messages.length);
    console.log('Bob messages cache:', bobToAlice?.messages.length);
    
    // Step 3: Wait for subscriptions to be active
    console.log('\n⏳ Waiting for subscriptions...');
    await testEnv.waitForSubscription(3000);
    
    // Step 4: Send a test message from Alice to Bob
    const testMessage = 'Debug decryption test: ' + Date.now();
    console.log('\n📨 Sending test message from Alice to Bob...');
    const sendResult = await aliceToBob!.send(testMessage);
    
    console.log('Send result:', {
      success: sendResult.success,
      messageId: sendResult.messageId?.slice(0, 8) + '...',
      error: sendResult.error
    });
    
    expect(sendResult.success).toBe(true);
    
    // Step 5: Check Alice's cache (should include sent message)
    console.log('\n🔍 Alice cache after sending:');
    const aliceMessages = aliceToBob!.messages;
    console.log('Alice messages count:', aliceMessages.length);
    console.log('Alice messages:', aliceMessages.map(m => ({
      content: m.content.slice(0, 30) + '...',
      isFromMe: m.isFromMe,
      sender: m.senderPubkey.slice(0, 8) + '...'
    })));
    
    // Step 6: Wait for Gift Wrap to propagate and be decrypted
    console.log('\n⏳ Waiting for Gift Wrap propagation and decryption...');
    await testEnv.waitForSubscription(5000);
    
    // Step 7: Check Bob's cache (should include decrypted message)
    console.log('\n🔍 Bob cache after waiting:');
    const bobMessages = bobToAlice!.messages;
    console.log('Bob messages count:', bobMessages.length);
    console.log('Bob messages:', bobMessages.map(m => ({
      content: m.content?.slice(0, 30) + '...',
      isFromMe: m.isFromMe,
      sender: m.senderPubkey?.slice(0, 8) + '...'
    })));
    
    // Step 8: Debug: Check if Bob's subscription is receiving any events
    console.log('\n🔍 Checking Bob\'s subscription state...');
    // Access the internal store to see what events are in the cache
    const bobStore = (bobToAlice as any).store;
    if (bobStore && bobStore.current) {
      console.log('Bob store events count:', bobStore.current.length);
      console.log('Bob store events:', bobStore.current.map((e: any) => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        pubkey: e.pubkey?.slice(0, 8) + '...',
        tags: e.tags
      })));
    } else {
      console.log('❌ Bob store is not accessible or has no current property');
    }
    
    // Step 9: Test direct decryption of Alice's published Gift Wrap
    console.log('\n🔐 Testing direct Gift Wrap decryption...');
    
    // Check if we can find the Gift Wrap event in the relay directly
    const giftWrapQuery = bob.nostr.query()
      .kinds([1059])
      .tags('p', [bob.publicKey])
      .execute();
      
    await testEnv.waitForSubscription(2000);
    
    console.log('Direct Gift Wrap query results:', {
      eventCount: giftWrapQuery.current.length,
      events: giftWrapQuery.current.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        pubkey: e.pubkey?.slice(0, 8) + '...',
        tags: e.tags,
        contentLength: e.content?.length
      }))
    });
    
    // Step 10: Try manual decryption if we found Gift Wrap events
    if (giftWrapQuery.current.length > 0) {
      console.log('\n🧪 Attempting manual decryption of found Gift Wraps...');
      const { GiftWrapProtocol } = await import('../../src/dm/protocol/GiftWrapProtocol.js');
      
      for (const giftWrap of giftWrapQuery.current) {
        try {
          const bobPrivateKey = await bob.nostr.getPrivateKeyForEncryption();
          const decryptionResult = await GiftWrapProtocol.decryptGiftWrappedDM(
            giftWrap as any,
            bobPrivateKey
          );
          
          console.log('Manual decryption result:', {
            isValid: decryptionResult.isValid,
            senderPubkey: decryptionResult.senderPubkey?.slice(0, 8) + '...',
            rumorContent: decryptionResult.rumor?.content?.slice(0, 30) + '...',
            errorDetails: decryptionResult.isValid ? null : 'Decryption failed'
          });
          
          if (decryptionResult.isValid && decryptionResult.rumor?.content === testMessage) {
            console.log('✅ SUCCESS: Manual decryption worked! The issue is in the automatic decryption pipeline.');
          }
          
        } catch (error) {
          console.log('❌ Manual decryption error:', error.message);
        }
      }
    } else {
      console.log('❌ No Gift Wrap events found in direct query - subscription/relay issue?');
    }
    
    // Final analysis
    const decryptedMessage = bobMessages.find(m => m.content === testMessage);
    
    if (decryptedMessage) {
      console.log('🎉 SUCCESS: Message was decrypted and appears in Bob\'s cache!');
    } else {
      console.log('❌ PROBLEM: Message was not decrypted or not added to Bob\'s cache');
      console.log('This indicates an issue in the automatic decryption pipeline in UniversalDMConversation');
    }
    
    // For now, let's not fail the test - we're debugging
    console.log('\n📊 DEBUG SUMMARY:');
    console.log('- Alice sent message:', sendResult.success);
    console.log('- Alice cache count:', aliceMessages.length);
    console.log('- Bob cache count:', bobMessages.length);
    console.log('- Bob received target message:', !!decryptedMessage);
    console.log('- Gift Wrap events found in relay:', giftWrapQuery.current.length);
  });
});