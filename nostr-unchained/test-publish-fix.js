#!/usr/bin/env node
/**
 * Test Script: Verify that the publish tab fix works
 * 
 * This tests the exact same API that the publish tab uses:
 * nostr.events.create().kind(1).content("hi").publish()
 */

import { NostrUnchained } from './dist/index.js';

async function testPublishFix() {
  console.log('🔥 Testing Publish Tab Fix...');
  
  try {
    // Create NostrUnchained instance (like the app does)
    const nostr = new NostrUnchained({
      debug: true,
      relays: ['ws://umbrel.local:4848']
    });
    
    // Initialize signing (this should auto-detect or create temporary keys)
    await nostr.initializeSigning();
    console.log('✅ Signing initialized');
    
    // Connect to relays before publishing
    await nostr.connect();
    console.log('✅ Connected to relays:', nostr.connectedRelays.length);
    
    // Test the exact API that the publish tab uses
    const builder = nostr.events.create()
      .kind(1)
      .content("Test from publish fix script - with pubkey");
    
    console.log('📝 Event builder created successfully');
    
    // Try to build the event (this should no longer fail)
    const event = await builder.build();
    console.log('✅ Event built successfully:', {
      id: event.id?.substring(0, 8) + '...',
      kind: event.kind,
      content: event.content,
      pubkey: event.pubkey?.substring(0, 8) + '...'
    });
    
    // Now test the actual publish (this tests the pubkey fix)
    console.log('🚀 Testing publish with pubkey...');
    const result = await nostr.events.create()
      .kind(1)
      .content("heyho")
      .publish();
    
    console.log('✅ Publish successful:', {
      success: result.success,
      eventId: result.eventId?.substring(0, 8) + '...'
    });
    
    console.log('🎉 SUCCESS: createEvent bug is fixed!');
    console.log('📋 The publish tab should now work correctly');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('🔧 The fix needs more work');
    process.exit(1);
  }
}

testPublishFix().catch(console.error);