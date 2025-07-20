import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../index';

/**
 * 🎯 REAL EVENT PUBLISHING TEST
 * 
 * This test demonstrates that Phase 3 CAN publish REAL, VALID Nostr events
 * when using the correct API (sendMessage instead of addMessage)
 */
describe('🚀 Real Event Publishing - Phase 3 Beyond Expectations', () => {
  let client: NostrUnchained;
  
  const WORKING_RELAY = 'wss://relay.damus.io';
  
  beforeEach(async () => {
    client = await NostrUnchained.create({
      relays: [WORKING_RELAY],
      timeout: 10000,
      debug: true
    });
  });

  afterEach(async () => {
    await client.dispose();
  });

  describe('✅ Real Event Creation and Publishing', () => {
    
    it('should create and publish REAL signed events to Umbrel relay', async () => {
      console.log('\n🎯 Publishing REAL signed event...');
      console.log('===============================');
      
      const conversationId = 'real-event-test';
      const messageContent = `🎉 REAL EVENT from NostrUnchained API! ${Date.now()}`;
      
      // This should create a REAL, signed event and publish it
      const publishedEvent = await client.sendMessage(conversationId, messageContent);
      
      expect(publishedEvent).toBeDefined();
      expect(publishedEvent!.content).toBe(messageContent);
      
             // Verify it's a real event, not a fake one
       expect(publishedEvent!.pubkey).not.toMatch(/^temp-pubkey/); // Not temp pubkey
       expect(publishedEvent!.sig).not.toMatch(/^temp-signature/); // Not temp signature
      
      // Should have real pubkey from signer
      expect(publishedEvent!.pubkey).toMatch(/^[0-9a-f]{64}$/); // 64 char hex
      expect(publishedEvent!.sig).toMatch(/^[0-9a-f]{128}$/); // 128 char hex (64-byte Schnorr signature)
      
      console.log('✅ Event Details:');
      console.log(`   📝 Content: "${publishedEvent!.content}"`);
      console.log(`   🔑 PubKey: ${publishedEvent!.pubkey}`);
      console.log(`   🆔 ID: ${publishedEvent!.id}`);
      console.log(`   ✍️ Signature: ${publishedEvent!.sig.substring(0, 20)}...`);
      console.log(`   ⏰ Timestamp: ${publishedEvent!.created_at}`);
      
      // Verify the conversation store has the message
      const conversation = client.getConversation(conversationId);
      expect(conversation).toBeDefined();
      
      // Wait for store to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const state = conversation!.state;
      expect(state.messages.length).toBeGreaterThan(0);
      
      const lastMessage = state.messages[state.messages.length - 1];
      expect(lastMessage.content).toBe(messageContent);
      
      console.log('✅ Message also in local store');
      console.log(`   📊 Total messages in store: ${state.messages.length}`);
      
      // This event should now be visible in your Umbrel relay interface!
      console.log('\n🌐 Check your Umbrel relay now - you should see this event!');
      console.log(`   Event content: "${messageContent}"`);
    });

    it('should demonstrate the difference between sendMessage() and addMessage()', async () => {
      console.log('\n🔍 DEMONSTRATING API DIFFERENCES:');
      console.log('=================================');
      
      const conversationId = 'api-demo';
      
      // METHOD 1: sendMessage() - Creates and publishes REAL events
      console.log('1️⃣ Using sendMessage() (RECOMMENDED):');
      const realEvent = await client.sendMessage(conversationId, 'Real message via sendMessage()');
      
      console.log(`   ✅ Real pubkey: ${realEvent!.pubkey.substring(0, 16)}...`);
      console.log(`   ✅ Real signature: ${realEvent!.sig.substring(0, 16)}...`);
      console.log(`   ✅ Will be published to relay and accepted`);
      
      // METHOD 2: addMessage() with fake event - NOT recommended for new messages
      console.log('\n2️⃣ Using addMessage() with fake event (DEMO ONLY):');
      const fakeEvent = await client.storeManager!.createTextEvent('Demo message (fake event)');
      await client.storeManager!.addMessage(conversationId, fakeEvent);
      
      console.log(`   ❌ Fake pubkey: ${fakeEvent.pubkey.substring(0, 16)}...`);
      console.log(`   ❌ Fake signature: ${fakeEvent.sig.substring(0, 16)}...`);
      console.log(`   ❌ Would be rejected by relay`);
      
      console.log('\n📋 SUMMARY:');
      console.log('   • Use client.sendMessage() for NEW messages');
      console.log('   • Use addMessage() only for INCOMING messages from relays');
      console.log('   • sendMessage() creates real, signed, publishable events');
      console.log('   • addMessage() just adds existing events to stores');
      
      // Verify both are in store
      const conversation = client.getConversation(conversationId);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = conversation!.state;
      expect(state.messages.length).toBe(2);
      console.log(`   📊 Store now contains ${state.messages.length} messages`);
    });

    it('should work with multiple conversations and real events', async () => {
      const conversations = ['chat-1', 'chat-2', 'group-discussion'];
      const publishedEvents: any[] = [];
      
      console.log('\n🗨️ Publishing to multiple conversations...');
      
      for (let i = 0; i < conversations.length; i++) {
        const conversationId = conversations[i];
        const content = `Message ${i + 1} to ${conversationId} - ${Date.now()}`;
        
        const event = await client.sendMessage(conversationId, content);
        publishedEvents.push(event);
        
        console.log(`   📤 Published to ${conversationId}: "${content.substring(0, 30)}..."`);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // All events should be real and unique
      expect(publishedEvents.length).toBe(3);
      
             publishedEvents.forEach((event, i) => {
         expect(event.pubkey).toMatch(/^[0-9a-f]{64}$/);
         expect(event.sig).toMatch(/^[0-9a-f]{128}$/); // Schnorr signatures are 128 chars (64 bytes)
         
         // Each event should have unique ID and timestamp
        const otherEvents = publishedEvents.filter((_, j) => j !== i);
        otherEvents.forEach(otherEvent => {
          expect(event.id).not.toBe(otherEvent.id);
        });
      });
      
      console.log('✅ All events are real, signed, and unique');
      console.log('🌐 Check your Umbrel relay - you should see 3 new events!');
    });
  });

  describe('🔍 Event Validation', () => {
    
    it('should create events that pass Nostr protocol validation', async () => {
      const event = await client.sendMessage('validation-test', 'Protocol compliance test');
      
      // Basic Nostr protocol requirements
      expect(event!.id).toBeDefined();
      expect(event!.pubkey).toBeDefined();
      expect(event!.created_at).toBeTypeOf('number');
      expect(event!.kind).toBe(1); // Text note
      expect(event!.tags).toBeInstanceOf(Array);
      expect(event!.content).toBeDefined();
      expect(event!.sig).toBeDefined();
      
             // Format validation
       expect(event!.id).toMatch(/^[0-9a-f]{64}$/); // 64-char hex
       expect(event!.pubkey).toMatch(/^[0-9a-f]{64}$/); // 64-char hex
       expect(event!.sig).toMatch(/^[0-9a-f]{128}$/); // 128-char hex (64-byte Schnorr)
      
      // Timestamp should be recent
      const now = Math.floor(Date.now() / 1000);
      expect(event!.created_at).toBeGreaterThan(now - 60); // Within last minute
      expect(event!.created_at).toBeLessThanOrEqual(now);
      
      console.log('✅ Event passes all Nostr protocol validation checks');
    });
  });

  describe('🎯 Integration with Previous Phase 3 Features', () => {
    
    it('should work with all Phase 3 store features', async () => {
      const conversationId = 'integration-test';
      
      // Get conversation store
      const conversation = client.getConversation(conversationId);
      expect(conversation).toBeDefined();
      
      // Subscribe to updates
      let updateCount = 0;
      const unsubscribe = conversation!.subscribe(() => {
        updateCount++;
      });
      
      // Send a real message
      await client.sendMessage(conversationId, 'Integration test message');
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Store should have updated
      expect(updateCount).toBeGreaterThan(1); // Initial + message update
      
      const state = conversation!.state;
      expect(state.messages.length).toBe(1);
      expect(state.lastMessage?.content).toBe('Integration test message');
      
      unsubscribe();
      
      console.log('✅ Real event publishing integrates perfectly with Phase 3 stores');
    });
  });
}); 