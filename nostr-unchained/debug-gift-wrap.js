/**
 * Minimal Gift Wrap Debugging Script
 * Tests if basic Gift Wrap creation and publishing works
 */

import { NostrUnchained } from './dist/index.js';
import { GiftWrapCreator } from './dist/dm/protocol/GiftWrapCreator.js';
import { SealCreator } from './dist/dm/protocol/SealCreator.js';

async function debugGiftWrap() {
  console.log('🔍 Starting minimal Gift Wrap debug...');
  
  // Create NostrUnchained instance
  const nostr = new NostrUnchained({
    relays: ['ws://localhost:7777'],
    debug: true
  });
  
  await nostr.connect();
  
  // Initialize signing with local key
  await nostr.useLocalKeySigner();
  const myPubkey = await nostr.getPublicKey();
  const myPrivateKey = await nostr.getPrivateKeyForEncryption();
  
  console.log('✅ NostrUnchained initialized:', {
    pubkey: myPubkey.slice(0, 8) + '...',
    connected: true
  });
  
  // Step 1: Test normal event publishing first
  console.log('\n📝 Testing normal event publishing...');
  const normalResult = await nostr.publish({
    kind: 1,
    content: 'Debug test: Normal event ' + Date.now(),
    tags: []
  });
  
  console.log('Normal event result:', {
    success: normalResult.success,
    eventId: normalResult.eventId?.slice(0, 8) + '...',
    errors: normalResult.relayResults?.map(r => r.error).filter(Boolean)
  });
  
  if (!normalResult.success) {
    console.error('❌ Normal event publishing failed! Can\'t proceed with Gift Wrap test');
    return;
  }
  
  // Step 2: Create minimal Gift Wrap manually
  console.log('\n🎁 Testing minimal Gift Wrap creation...');
  
  try {
    // Create a simple rumor
    const rumor = {
      pubkey: myPubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 14,
      tags: [],
      content: 'Debug test: Gift Wrap content ' + Date.now()
    };
    
    // Create a seal
    const seal = await SealCreator.createSeal(
      rumor,
      myPrivateKey,
      myPubkey // encrypt to myself for testing
    );
    
    console.log('✅ Seal created successfully');
    
    // Create Gift Wrap
    const giftWrapResult = await GiftWrapCreator.createGiftWrap(
      seal,
      {
        pubkey: myPubkey,
        relayHint: undefined
      },
      undefined, // auto ephemeral key
      Math.floor(Date.now() / 1000) // current timestamp
    );
    
    console.log('✅ Gift Wrap created:', {
      id: giftWrapResult.giftWrap.id?.slice(0, 8) + '...',
      kind: giftWrapResult.giftWrap.kind,
      hasSignature: !!giftWrapResult.giftWrap.sig,
      signatureLength: giftWrapResult.giftWrap.sig?.length
    });
    
    // Step 3: Try to publish the Gift Wrap
    console.log('\n🚀 Testing Gift Wrap publishing...');
    const giftWrapPublishResult = await nostr.publish(giftWrapResult.giftWrap);
    
    console.log('Gift Wrap publish result:', {
      success: giftWrapPublishResult.success,
      eventId: giftWrapPublishResult.eventId?.slice(0, 8) + '...',
      errors: giftWrapPublishResult.relayResults?.map(r => r.error).filter(Boolean)
    });
    
    if (giftWrapPublishResult.success) {
      console.log('✅ SUCCESS! Gift Wrap published successfully!');
    } else {
      console.log('❌ Gift Wrap publishing failed');
      console.log('Detailed error:', giftWrapPublishResult.relayResults?.[0]?.error);
    }
    
  } catch (error) {
    console.error('❌ Gift Wrap creation failed:', error.message);
  }
  
  console.log('\n🏁 Debug complete');
}

debugGiftWrap().catch(console.error);