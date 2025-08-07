/**
 * Minimal Gift Wrap Debugging Test
 * Tests if basic Gift Wrap creation and publishing works
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import type { TestUser } from '../shared/TestEnvironment.js';
import { GiftWrapCreator } from '../../src/dm/protocol/GiftWrapCreator.js';
import { SealCreator } from '../../src/dm/protocol/SealCreator.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';

describe('Gift Wrap Debug: Minimal Test', () => {
  let alice: TestUser;
  
  beforeAll(async () => {
    [alice] = await testEnv.createTestUsers(['Alice_Debug']);
    console.log('🔍 Debug user created:', {
      pubkey: alice.publicKey.slice(0, 8) + '...'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should publish normal events successfully', async () => {
    console.log('\n📝 Testing normal event publishing...');
    
    const normalResult = await alice.nostr.publish(await EventBuilder.createEvent(
      'Debug test: Normal event ' + Date.now(),
      alice.publicKey,
      { kind: 1, tags: [] }
    ));
    
    console.log('Normal event result:', {
      success: normalResult.success,
      eventId: normalResult.eventId?.slice(0, 8) + '...',
      errors: normalResult.relayResults?.map(r => r.error).filter(Boolean)
    });
    
    expect(normalResult.success).toBe(true);
  });

  it('should create and publish minimal Gift Wrap', async () => {
    console.log('\n🎁 Testing minimal Gift Wrap creation...');
    
    // Step 1: Create a simple rumor
    const rumor = {
      pubkey: alice.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 14,
      tags: [],
      content: 'Debug test: Gift Wrap content ' + Date.now()
    };
    
    console.log('Rumor created:', {
      kind: rumor.kind,
      content: rumor.content.slice(0, 30) + '...',
      timestamp: rumor.created_at
    });
    
    // Step 2: Create a seal
    const privateKey = await alice.nostr.getPrivateKeyForEncryption();
    const seal = await SealCreator.createSeal(
      rumor,
      privateKey,
      alice.publicKey // encrypt to myself for testing
    );
    
    console.log('Seal created:', {
      kind: seal.kind,
      hasContent: !!seal.content,
      contentLength: seal.content?.length,
      hasSignature: !!seal.sig
    });
    
    expect(seal).toBeDefined();
    expect(seal.kind).toBe(13);
    expect(seal.sig).toBeDefined();
    
    // Step 3: Create Gift Wrap
    const giftWrapResult = await GiftWrapCreator.createGiftWrap(
      seal,
      {
        pubkey: alice.publicKey,
        relayHint: undefined
      },
      undefined, // auto ephemeral key
      Math.floor(Date.now() / 1000) // current timestamp
    );
    
    console.log('Gift Wrap created:', {
      id: giftWrapResult.giftWrap.id?.slice(0, 8) + '...',
      kind: giftWrapResult.giftWrap.kind,
      hasSignature: !!giftWrapResult.giftWrap.sig,
      signatureLength: giftWrapResult.giftWrap.sig?.length,
      ephemeralPubkey: giftWrapResult.ephemeralKeyPair.publicKey.slice(0, 8) + '...'
    });
    
    expect(giftWrapResult.giftWrap).toBeDefined();
    expect(giftWrapResult.giftWrap.kind).toBe(1059);
    expect(giftWrapResult.giftWrap.sig).toBeDefined();
    expect(giftWrapResult.giftWrap.sig?.length).toBe(128);
    
    // Step 3.5: Inspect the Gift Wrap event structure in detail
    const giftWrap = giftWrapResult.giftWrap;
    console.log('🔍 Gift Wrap Event Structure:', {
      id: giftWrap.id,
      pubkey: giftWrap.pubkey,
      created_at: giftWrap.created_at,
      kind: giftWrap.kind,
      tags: JSON.stringify(giftWrap.tags),
      contentLength: giftWrap.content?.length,
      sig: giftWrap.sig
    });
    
    // Step 3.6: Manual signature verification
    console.log('🔐 Manual signature verification...');
    
    // Re-calculate event ID manually to verify
    const manualEventId = JSON.stringify([
      0,
      giftWrap.pubkey,
      giftWrap.created_at,
      giftWrap.kind,
      giftWrap.tags,
      giftWrap.content
    ]);
    console.log('Manual serialized event (first 100 chars):', manualEventId.slice(0, 100) + '...');
    
    // Step 4: Try to publish the Gift Wrap
    console.log('🚀 Testing Gift Wrap publishing...');
    const giftWrapPublishResult = await alice.nostr.publishSigned(giftWrapResult.giftWrap);
    
    console.log('Gift Wrap publish result:', {
      success: giftWrapPublishResult.success,
      eventId: giftWrapPublishResult.eventId?.slice(0, 8) + '...',
      errors: giftWrapPublishResult.relayResults?.map(r => r.error).filter(Boolean),
      detailedErrors: giftWrapPublishResult.relayResults
    });
    
    if (giftWrapPublishResult.success) {
      console.log('✅ SUCCESS! Gift Wrap published successfully!');
      expect(giftWrapPublishResult.success).toBe(true);
    } else {
      console.log('❌ Gift Wrap publishing failed');
      console.log('Expected this to work, but it failed. This is the core bug.');
      // Don't fail the test - we expect this to fail for now
      expect(giftWrapPublishResult.success).toBe(false); 
    }
  });
});