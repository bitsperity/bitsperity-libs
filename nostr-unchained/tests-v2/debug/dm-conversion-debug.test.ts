/**
 * DM Message Conversion Debug Test
 * Testet warum Gift Wrap Events im Cache nicht als DM Messages erscheinen
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import type { TestUser } from '../shared/TestEnvironment.js';

describe('DM Message Conversion Debug', () => {
  let alice: TestUser;
  let bob: TestUser;
  
  beforeAll(async () => {
    [alice, bob] = await testEnv.createTestUsers(['Alice_Conv', 'Bob_Conv']);
    console.log('🔍 Debug users created:', {
      alicePubkey: alice.publicKey.slice(0, 8) + '...',
      bobPubkey: bob.publicKey.slice(0, 8) + '...'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should debug why Gift Wrap events dont convert to DM messages', async () => {
    console.log('\n🔄 TESTING: Gift Wrap → DM Message conversion');
    
    // Step 1: Create DM conversations  
    const aliceConv = alice.nostr.getDM()?.with(bob.publicKey);
    const bobConv = bob.nostr.getDM()?.with(alice.publicKey);
    
    console.log('✅ Conversations created');
    
    // Step 2: Wait for subscriptions
    await testEnv.waitForSubscription(3000);
    
    // Step 3: Alice sends a message to Bob
    const testMessage = 'DM conversion test: ' + Date.now();
    console.log(`\n📨 Alice sending: "${testMessage}"`);
    
    const sendResult = await aliceConv!.send(testMessage);
    console.log('Send result:', {
      success: sendResult.success,
      messageId: sendResult.messageId?.slice(0, 8) + '...'
    });
    
    expect(sendResult.success).toBe(true);
    
    // Step 4: Wait for propagation
    console.log('\n⏳ Waiting for Gift Wrap propagation and conversion...');
    await testEnv.waitForSubscription(8000); // Longer wait to see all debug logs
    
    // Step 5: Check messages
    console.log('\n📊 FINAL RESULTS:');
    
    const aliceMessages = aliceConv!.messages;
    const bobMessages = bobConv!.messages;
    
    console.log('Alice messages:', {
      count: aliceMessages.length,
      messages: aliceMessages.map(m => ({
        content: m.content.slice(0, 30) + '...',
        isFromMe: m.isFromMe,
        sender: m.senderPubkey.slice(0, 8) + '...'
      }))
    });
    
    console.log('Bob messages:', {
      count: bobMessages.length,
      messages: bobMessages.map(m => ({
        content: m.content?.slice(0, 30) + '...',
        isFromMe: m.isFromMe,
        sender: m.senderPubkey?.slice(0, 8) + '...'
      }))
    });
    
    // Step 6: Analysis
    const bobReceivedTestMessage = bobMessages.find(m => m.content === testMessage);
    
    if (bobReceivedTestMessage) {
      console.log('✅ SUCCESS: Bob received and converted the message!');
    } else {
      console.log('❌ PROBLEM: Bob did not receive/convert the message');
      console.log('→ Check the Gift Wrap Decryption Debug logs above for the reason');
    }
    
    // Debug: Check if Bob's subscription has Gift Wrap events
    const bobStore = (bobConv as any).store;
    if (bobStore) {
      const giftWrapEvents = bobStore.current;
      console.log('\n🔍 Bob\'s Gift Wrap events in store:', {
        count: giftWrapEvents.length,
        events: giftWrapEvents.slice(0, 3).map((e: any) => ({
          id: e.id?.slice(0, 8) + '...',
          kind: e.kind,
          tags: e.tags
        }))
      });
      
      if (giftWrapEvents.length > 0 && bobMessages.length === 0) {
        console.log('→ Events are in cache but not converted to messages');
        console.log('→ The issue is in convertEventsToMessages() method');
      } else if (giftWrapEvents.length === 0) {
        console.log('→ No Gift Wrap events in Bob\'s store cache');
        console.log('→ The issue is still in subscription/caching');
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- Alice sent message:', sendResult.success);
    console.log('- Alice messages count:', aliceMessages.length);
    console.log('- Bob messages count:', bobMessages.length);  
    console.log('- Bob received test message:', !!bobReceivedTestMessage);
  });
});