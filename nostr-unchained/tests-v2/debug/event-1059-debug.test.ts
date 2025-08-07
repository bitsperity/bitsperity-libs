/**
 * Event 1059 Reception Debug Test
 * Prüft ob Gift Wrap Events (kind 1059) korrekt über Subscriptions ankommen
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import type { TestUser } from '../shared/TestEnvironment.js';

describe('Event 1059 Reception Debug', () => {
  let alice: TestUser;
  let bob: TestUser;
  
  beforeAll(async () => {
    [alice, bob] = await testEnv.createTestUsers(['Alice_1059', 'Bob_1059']);
    console.log('🔍 Debug users created:', {
      alicePubkey: alice.publicKey.slice(0, 8) + '...',
      bobPubkey: bob.publicKey.slice(0, 8) + '...'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should verify Gift Wrap events (1059) arrive via subscriptions', async () => {
    console.log('\n🎁 TESTING: Do Gift Wrap Events (1059) arrive at Bob?');
    
    // Step 1: Bob creates subscription for Gift Wrap events tagged to him
    console.log('\n📡 Bob creating subscription for kind 1059 events tagged to him...');
    const bobGiftWrapSub = await bob.nostr.sub()
      .kinds([1059])
      .tags('p', [bob.publicKey])
      .execute();
      
    console.log('Bob Gift Wrap subscription:', {
      id: bobGiftWrapSub.id,
      isActive: bobGiftWrapSub.isActive(),
      initialEvents: bobGiftWrapSub.store.current.length
    });
    
    // Step 2: Also create a broader subscription to catch ALL 1059 events (for comparison)
    console.log('\n📡 Bob creating broad subscription for ALL kind 1059 events...');
    const bobAllGiftWrapSub = await bob.nostr.sub()
      .kinds([1059])
      .execute();
      
    console.log('Bob ALL Gift Wrap subscription:', {
      id: bobAllGiftWrapSub.id,
      isActive: bobAllGiftWrapSub.isActive(),
      initialEvents: bobAllGiftWrapSub.store.current.length
    });
    
    // Step 3: Wait for subscriptions to be established
    console.log('\n⏳ Waiting for subscriptions to be fully established...');
    await testEnv.waitForSubscription(3000);
    
    // Step 4: Alice sends DM to Bob (creates Gift Wrap)
    console.log('\n📨 Alice sending DM to Bob (will create Gift Wrap event)...');
    const aliceConv = alice.nostr.getDM()?.with(bob.publicKey);
    const testMessage = 'Event 1059 debug test: ' + Date.now();
    
    const dmResult = await aliceConv!.send(testMessage);
    console.log('Alice DM send result:', {
      success: dmResult.success,
      messageId: dmResult.messageId?.slice(0, 8) + '...',
      error: dmResult.error
    });
    
    expect(dmResult.success).toBe(true);
    
    // Step 5: Wait for event to propagate
    console.log('\n⏳ Waiting for Gift Wrap event to propagate...');
    await testEnv.waitForSubscription(5000);
    
    // Step 6: Check Bob's targeted subscription
    console.log('\n🔍 Checking Bob\'s targeted Gift Wrap subscription (p-tagged to Bob)...');
    const bobTargetedEvents = bobGiftWrapSub.store.current;
    console.log('Bob targeted subscription results:', {
      eventCount: bobTargetedEvents.length,
      events: bobTargetedEvents.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        pubkey: e.pubkey?.slice(0, 8) + '...',
        tags: e.tags.map(tag => `${tag[0]}:${tag[1]?.slice(0, 8) + '...' || tag[1]}`),
        contentLength: e.content?.length
      }))
    });
    
    // Step 7: Check Bob's broad subscription 
    console.log('\n🔍 Checking Bob\'s broad Gift Wrap subscription (ALL 1059 events)...');
    const bobAllEvents = bobAllGiftWrapSub.store.current;
    console.log('Bob ALL subscription results:', {
      eventCount: bobAllEvents.length,
      events: bobAllEvents.map(e => ({
        id: e.id?.slice(0, 8) + '...',
        kind: e.kind,
        pubkey: e.pubkey?.slice(0, 8) + '...',
        tags: e.tags.map(tag => `${tag[0]}:${tag[1]?.slice(0, 8) + '...' || tag[1]}`),
        contentLength: e.content?.length
      }))
    });
    
    // Step 8: Analysis and diagnosis
    console.log('\n📊 ANALYSIS:');
    
    if (bobTargetedEvents.length > 0) {
      console.log('✅ SUCCESS: Bob receives Gift Wrap events via targeted subscription!');
      console.log('→ Subscription system is working correctly');
      console.log('→ Problem must be in the DECRYPTION pipeline');
      
      // Test decryption on received events
      console.log('\n🔐 Testing decryption of received Gift Wrap events...');
      const { GiftWrapProtocol } = await import('../../src/dm/protocol/GiftWrapProtocol.js');
      const bobPrivateKey = await bob.nostr.getPrivateKeyForEncryption();
      
      for (const [index, giftWrap] of bobTargetedEvents.entries()) {
        console.log(`\n🧪 Decrypting Gift Wrap ${index + 1}...`);
        try {
          const decryption = await GiftWrapProtocol.decryptGiftWrappedDM(giftWrap as any, bobPrivateKey);
          console.log(`Decryption ${index + 1} result:`, {
            isValid: decryption.isValid,
            senderPubkey: decryption.senderPubkey?.slice(0, 8) + '...',
            expectedSender: alice.publicKey.slice(0, 8) + '...',
            rumorContent: decryption.rumor?.content?.slice(0, 50) + '...',
            matchesTestMessage: decryption.rumor?.content === testMessage
          });
          
          if (decryption.isValid && decryption.rumor?.content === testMessage) {
            console.log(`🎉 PERFECT: Gift Wrap ${index + 1} decryption SUCCESS!`);
            console.log('→ Both subscription AND decryption work perfectly!');
          } else if (decryption.isValid) {
            console.log(`⚠️  Gift Wrap ${index + 1} decrypts but content doesn't match`);
            console.log('→ Might be from a different conversation or older test');
          } else {
            console.log(`❌ Gift Wrap ${index + 1} decryption FAILED`);
            console.log('→ This is where the bug is!');
          }
        } catch (error) {
          console.log(`❌ Gift Wrap ${index + 1} decryption ERROR:`, error.message);
        }
      }
      
    } else if (bobAllEvents.length > 0) {
      console.log('⚠️  Bob receives Gift Wrap events via broad subscription but NOT targeted');
      console.log('→ Problem is in TAG FILTERING');
      console.log('→ The p-tag filter is not working correctly');
      
    } else {
      console.log('❌ Bob receives NO Gift Wrap events at all');
      console.log('→ Problem is in SUBSCRIPTION SYSTEM');
      console.log('→ Events are not reaching Bob\'s subscriptions');
    }
    
    // Step 9: Summary
    console.log('\n📋 FINAL DIAGNOSIS:');
    console.log(`- Alice published Gift Wrap: ${dmResult.success}`);
    console.log(`- Bob targeted subscription events: ${bobTargetedEvents.length}`);
    console.log(`- Bob broad subscription events: ${bobAllEvents.length}`);
    console.log(`- Subscription system works: ${bobAllEvents.length > 0 || bobTargetedEvents.length > 0}`);
    console.log(`- Tag filtering works: ${bobTargetedEvents.length > 0}`);
    
    await bobGiftWrapSub.stop();
    await bobAllGiftWrapSub.stop();
  });

  it('should test direct event reception without DM wrapper', async () => {
    console.log('\n🔄 CONTROL TEST: Direct Gift Wrap event creation and reception');
    
    // Step 1: Bob creates subscription
    const bobSub = await bob.nostr.sub()
      .kinds([1059])
      .execute();
    
    await testEnv.waitForSubscription(2000);
    
    // Step 2: Manually create and publish a Gift Wrap event
    console.log('\n🛠️  Manually creating Gift Wrap event...');
    
    const { GiftWrapProtocol } = await import('../../src/dm/protocol/GiftWrapProtocol.js');
    const alicePrivateKey = await alice.nostr.getPrivateKeyForEncryption();
    
    const giftWrapResult = await GiftWrapProtocol.createGiftWrappedDM(
      'Manual Gift Wrap test: ' + Date.now(),
      alicePrivateKey,
      {
        recipients: [{ pubkey: bob.publicKey, relayUrl: '' }],
        maxTimestampAge: 0
      }
    );
    
    console.log('Manual Gift Wrap created:', {
      hasGiftWrap: !!giftWrapResult.giftWraps?.[0],
      giftWrapId: giftWrapResult.giftWraps?.[0]?.giftWrap.id?.slice(0, 8) + '...'
    });
    
    // Step 3: Publish manually
    const publishResult = await alice.nostr.publishSigned(giftWrapResult.giftWraps[0].giftWrap);
    console.log('Manual publish result:', {
      success: publishResult.success,
      eventId: publishResult.eventId?.slice(0, 8) + '...'
    });
    
    // Step 4: Check reception
    await testEnv.waitForSubscription(3000);
    
    const receivedEvents = bobSub.store.current;
    console.log('Manual Gift Wrap reception:', {
      eventCount: receivedEvents.length,
      containsOurEvent: receivedEvents.some(e => e.id === giftWrapResult.giftWraps[0].giftWrap.id)
    });
    
    await bobSub.stop();
    
    if (receivedEvents.length > 0 && receivedEvents.some(e => e.id === giftWrapResult.giftWraps[0].giftWrap.id)) {
      console.log('✅ Manual Gift Wrap reception works perfectly!');
    } else {
      console.log('❌ Manual Gift Wrap reception failed!');
    }
  });
});