/**
 * Subscription Setup Debug Test
 * Tests if subscriptions are correctly established and receiving events
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';
import type { TestUser } from '../shared/TestEnvironment.js';

describe('Subscription Setup Debug', () => {
  let alice: TestUser;
  let bob: TestUser;
  
  beforeAll(async () => {
    [alice, bob] = await testEnv.createTestUsers(['Alice_Sub', 'Bob_Sub']);
    console.log('🔍 Debug users created:', {
      alicePubkey: alice.publicKey.slice(0, 8) + '...',
      bobPubkey: bob.publicKey.slice(0, 8) + '...'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should test basic subscription functionality', async () => {
    console.log('\n🔍 SUBSCRIPTION DEBUG: Testing basic subscription setup...');
    
    // Step 1: Create a basic subscription for kind 1 notes (easier to test)
    console.log('\n📡 Creating subscription for kind 1 notes...');
    const noteSubscription = await alice.nostr.sub()
      .kinds([1])
      .execute();
    
    console.log('Subscription created:', {
      id: noteSubscription.id,
      isActive: noteSubscription.isActive(),
      store: !!noteSubscription.store
    });
    
    // Step 2: Check initial state
    console.log('Initial store state:', {
      currentCount: noteSubscription.store.current.length,
      events: noteSubscription.store.current.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind
      }))
    });
    
    // Step 3: Publish a basic note
    console.log('\n📝 Publishing a test note...');
    const testNote = 'Test note for subscription: ' + Date.now();
    const publishResult = await alice.nostr.publish(await EventBuilder.createEvent(
      testNote,
      alice.publicKey,
      { kind: 1, tags: [] }
    ));
    
    console.log('Publish result:', {
      success: publishResult.success,
      eventId: publishResult.eventId?.slice(0, 8) + '...'
    });
    
    expect(publishResult.success).toBe(true);
    
    // Step 4: Wait and check if the event appears in the subscription
    console.log('\n⏳ Waiting for event to appear in subscription...');
    await testEnv.waitForSubscription(3000);
    
    const updatedEvents = noteSubscription.store.current;
    console.log('After waiting - store state:', {
      currentCount: updatedEvents.length,
      events: updatedEvents.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        content: e.content?.slice(0, 30) + '...'
      }))
    });
    
    const foundOurNote = updatedEvents.find(e => e.content === testNote);
    
    if (foundOurNote) {
      console.log('✅ SUCCESS: Our published note appeared in the subscription!');
      console.log('This means subscriptions work for same-session publishing.');
    } else {
      console.log('❌ PROBLEM: Our published note did NOT appear in the subscription!');
      console.log('This indicates a fundamental issue with subscription/cache integration.');
    }
    
    // Step 5: Test if Bob can subscribe to Alice's published events
    console.log('\n🔄 Testing cross-user subscription...');
    const bobSubscription = await bob.nostr.sub()
      .kinds([1])
      .authors([alice.publicKey])
      .execute();
    
    await testEnv.waitForSubscription(2000);
    
    const bobSeesAliceEvents = bobSubscription.store.current;
    console.log('Bob subscription for Alice events:', {
      count: bobSeesAliceEvents.length,
      events: bobSeesAliceEvents.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        author: e.pubkey?.slice(0, 8) + '...',
        content: e.content?.slice(0, 30) + '...'
      }))
    });
    
    const bobFoundOurNote = bobSeesAliceEvents.find(e => e.content === testNote);
    
    if (bobFoundOurNote) {
      console.log('✅ SUCCESS: Bob can see Alice\'s published notes via subscription!');
    } else {
      console.log('❌ PROBLEM: Bob cannot see Alice\'s published notes via subscription!');
    }
    
    // Final analysis
    console.log('\n📊 SUBSCRIPTION DEBUG SUMMARY:');
    console.log('- Alice published note:', publishResult.success);
    console.log('- Alice subscription sees own note:', !!foundOurNote);  
    console.log('- Bob subscription sees Alice note:', !!bobFoundOurNote);
    console.log('- Same-session subscription works:', !!foundOurNote);
    console.log('- Cross-user subscription works:', !!bobFoundOurNote);
    
    await noteSubscription.stop();
    await bobSubscription.stop();
  });

  it('should test Gift Wrap specific subscriptions', async () => {
    console.log('\n🎁 GIFT WRAP SUBSCRIPTION DEBUG...');
    
    // Step 1: Create Gift Wrap subscription for Bob
    console.log('Creating Gift Wrap subscription for Bob...');
    const bobGiftWrapSub = await bob.nostr.sub()
      .kinds([1059])
      .tags('p', [bob.publicKey])
      .execute();
      
    console.log('Bob Gift Wrap subscription:', {
      id: bobGiftWrapSub.id,
      isActive: bobGiftWrapSub.isActive(),
      initialCount: bobGiftWrapSub.store.current.length
    });
    
    // Step 2: Send DM from Alice to Bob
    console.log('\n📨 Sending DM from Alice to Bob...');
    const aliceConv = alice.nostr.getDM()?.with(bob.publicKey);
    const testMessage = 'Subscription debug message: ' + Date.now();
    
    const dmResult = await aliceConv!.send(testMessage);
    console.log('DM send result:', {
      success: dmResult.success,
      messageId: dmResult.messageId?.slice(0, 8) + '...',
      error: dmResult.error
    });
    
    expect(dmResult.success).toBe(true);
    
    // Step 3: Check if Gift Wrap appears in Bob's subscription
    console.log('\n⏳ Waiting for Gift Wrap to appear in Bob\'s subscription...');
    await testEnv.waitForSubscription(5000);
    
    const bobGiftWraps = bobGiftWrapSub.store.current;
    console.log('Bob Gift Wrap subscription after DM:', {
      count: bobGiftWraps.length,
      events: bobGiftWraps.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        tags: e.tags,
        fromEphemeral: e.pubkey?.slice(0, 8) + '...'
      }))
    });
    
    if (bobGiftWraps.length > 0) {
      console.log('✅ SUCCESS: Gift Wrap events are appearing in subscription!');
      
      // Try to decrypt one to see if it works
      const { GiftWrapProtocol } = await import('../../src/dm/protocol/GiftWrapProtocol.js');
      const bobPrivateKey = await bob.nostr.getPrivateKeyForEncryption();
      
      for (const giftWrap of bobGiftWraps) {
        try {
          const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(giftWrap as any, bobPrivateKey);
          console.log('Decryption attempt:', {
            isValid: decryption.isValid,
            senderPubkey: decryption.senderPubkey?.slice(0, 8) + '...',
            content: decryption.rumor?.content?.slice(0, 30) + '...'
          });
          
          if (decryption.isValid && decryption.rumor?.content === testMessage) {
            console.log('🎉 PERFECT: Gift Wrap decryption works perfectly!');
            break;
          }
        } catch (error) {
          console.log('Decryption error:', error.message);
        }
      }
    } else {
      console.log('❌ CRITICAL: No Gift Wrap events in Bob\'s subscription!');
      console.log('This means the core issue is that Gift Wraps don\'t reach subscriptions.');
    }
    
    await bobGiftWrapSub.stop();
    
    console.log('\n📊 GIFT WRAP SUBSCRIPTION SUMMARY:');
    console.log('- DM was sent successfully:', dmResult.success);
    console.log('- Gift Wrap events in subscription:', bobGiftWraps.length);
    console.log('- Gift Wrap subscription works:', bobGiftWraps.length > 0);
  });
});