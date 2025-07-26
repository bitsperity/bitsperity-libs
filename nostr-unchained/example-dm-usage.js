/**
 * NIP-17 Direct Message API Demo
 * 
 * This example demonstrates the high-level vision API for NIP-17 DMs
 * that was implemented in Session 3.
 */

import { NostrUnchained } from './dist/index.js';

async function demonstrateDMAPI() {
  console.log('🚀 NIP-17 Direct Message API Demo\n');

  // Epic 1: Magical First Experience
  console.log('1. Creating NostrUnchained instance...');
  const nostr = new NostrUnchained({ debug: true });

  // Initialize signing by publishing something (triggers initialization)
  console.log('2. Initializing signing provider...');
  try {
    await nostr.publish('Hello Nostr! Setting up DM capabilities.');
  } catch (error) {
    console.log('   Publishing may fail, but signing is initialized');
  }

  // Target API: nostr.dm.with('pubkey') 
  console.log('3. Creating conversation with user...');
  const recipientPubkey = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const conversation = nostr.dm.with(recipientPubkey);

  console.log('4. Setting up reactive subscriptions...');
  
  // Reactive message updates
  conversation.messages.subscribe(messages => {
    console.log(`   📨 Messages updated: ${messages.length} total`);
    messages.forEach((msg, i) => {
      console.log(`     ${i + 1}. ${msg.isFromMe ? '→' : '←'} ${msg.content} (${msg.status})`);
    });
  });

  // Status tracking
  conversation.status.subscribe(status => {
    console.log(`   📊 Status: ${status}`);
  });

  // Latest message
  conversation.latest.subscribe(latest => {
    if (latest) {
      console.log(`   💬 Latest: "${latest.content}" from ${latest.isFromMe ? 'me' : 'them'}`);
    }
  });

  // Advanced features: Send messages
  console.log('5. Sending test message...');
  try {
    const result = await conversation.send("Hello! This is a test DM.");
    console.log(`   ✅ Message sent: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.messageId) {
      console.log(`   📋 Message ID: ${result.messageId}`);
    }
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Send failed: ${error.message}`);
  }

  // Multi-conversation support
  console.log('6. Demonstrating multi-conversation support...');
  const conversation2 = nostr.dm.with('fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321');
  console.log(`   Created second conversation: ${conversation2 !== conversation}`);

  // Global DM properties
  console.log('7. Global DM status...');
  
  nostr.dm.conversations$.subscribe(conversations => {
    console.log(`   📊 Active conversations: ${conversations.length}`);
    conversations.forEach((conv, i) => {
      console.log(`     ${i + 1}. ${conv.pubkey.slice(0, 8)}... (${conv.unreadCount} unread)`);
    });
  });

  nostr.dm.inboxCount.subscribe(count => {
    console.log(`   📥 Total unread: ${count}`);
  });

  console.log('\n✨ NIP-17 DM API demonstration complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('  ✅ Magical first experience: nostr.dm.with(pubkey)');
  console.log('  ✅ Reactive store interface with Svelte compatibility');
  console.log('  ✅ Multi-conversation support');
  console.log('  ✅ Message sending with NIP-17 encryption');
  console.log('  ✅ Real-time status and message tracking');
  console.log('  ✅ Integration with existing NostrUnchained architecture');

  // Cleanup
  await conversation.close();
  await conversation2.close();
  await nostr.disconnect();
}

// Run the demo
demonstrateDMAPI().catch(console.error);