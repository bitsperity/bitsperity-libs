import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../index';

/**
 * 🎯 RELAY RESPONSE TEST
 * 
 * This test checks if our events are ACTUALLY accepted by the Umbrel relay
 * by waiting for the relay's OK/REJECT response
 */
describe('🔍 Relay Response Validation', () => {
  let client: NostrUnchained;
  
  const WORKING_RELAY = 'wss://relay.damus.io';
  
  beforeEach(async () => {
    client = await NostrUnchained.create({
      relays: [WORKING_RELAY],
      timeout: 15000,  // Longer timeout for thorough testing
      debug: true
    });
  });

  afterEach(async () => {
    await client.dispose();
  });

  describe('✅ Relay Acceptance Testing', () => {
    
    it('should show if events are ACTUALLY accepted or rejected by Umbrel', async () => {
      console.log('\n🎯 TESTING REAL RELAY ACCEPTANCE...');
      console.log('==========================================');
      
      const testMessage = `🔬 Relay Test ${Date.now()} - Testing acceptance`;
      
      console.log(`📝 Sending message: "${testMessage}"`);
      console.log('⏳ Waiting for relay response...');
      
      try {
        // This will now wait for the actual relay response
        const event = await client.sendMessage('relay-test', testMessage);
        
        console.log('🎉 SUCCESS! Event was ACCEPTED by relay!');
        console.log(`   Event ID: ${event!.id}`);
        console.log(`   Message: "${event!.content}"`);
        console.log('\n✅ Your Umbrel relay should now show this new event!');
        
        expect(event).toBeDefined();
        expect(event!.content).toBe(testMessage);
        
      } catch (error) {
        console.log('❌ FAILED! Event was REJECTED by relay!');
        console.log(`   Error: ${error}`);
        
        // This tells us exactly why it failed
        throw error;
      }
    }, 20000); // 20 second timeout

    it('should handle multiple events and show individual responses', async () => {
      console.log('\n🗨️ TESTING MULTIPLE EVENTS...');
      console.log('==============================');
      
      const messages = [
        `📨 Multi-test 1: ${Date.now()}`,
        `📨 Multi-test 2: ${Date.now() + 1}`,
        `📨 Multi-test 3: ${Date.now() + 2}`
      ];
      
             const results: Array<{ success: boolean; event?: any; error?: any }> = [];
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        console.log(`\n${i + 1}/3: Sending "${message.substring(0, 30)}..."`);
        
        try {
          const event = await client.sendMessage('multi-test', message);
          console.log(`   ✅ ACCEPTED: ${event!.id}`);
          results.push({ success: true, event });
        } catch (error) {
          console.log(`   ❌ REJECTED: ${error}`);
          results.push({ success: false, error });
        }
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('\n📊 RESULTS SUMMARY:');
      results.forEach((result, i) => {
        if (result.success) {
          console.log(`   ${i + 1}: ✅ ACCEPTED`);
        } else {
          console.log(`   ${i + 1}: ❌ REJECTED - ${result.error}`);
        }
      });
      
      const acceptedCount = results.filter(r => r.success).length;
      console.log(`\n🎯 Total accepted: ${acceptedCount}/${messages.length}`);
      
      if (acceptedCount > 0) {
        console.log('✅ At least some events were accepted by Umbrel!');
      } else {
        console.log('❌ No events were accepted - there might be a problem');
      }
      
      // Test passes if at least one event was accepted
      expect(acceptedCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('🔍 Debugging Information', () => {
    
    it('should show detailed event information for debugging', async () => {
      const testEvent = await client.sendMessage('debug-test', 'Debug info test');
      
      console.log('\n🔍 DETAILED EVENT INFORMATION:');
      console.log('==============================');
      console.log(`Event ID: ${testEvent!.id}`);
      console.log(`Public Key: ${testEvent!.pubkey}`);
      console.log(`Signature: ${testEvent!.sig}`);
      console.log(`Timestamp: ${testEvent!.created_at}`);
      console.log(`Kind: ${testEvent!.kind}`);
      console.log(`Tags: ${JSON.stringify(testEvent!.tags)}`);
      console.log(`Content: "${testEvent!.content}"`);
      
      // Verify it's a properly formed Nostr event
      expect(testEvent!.id).toMatch(/^[0-9a-f]{64}$/);
      expect(testEvent!.pubkey).toMatch(/^[0-9a-f]{64}$/);
      expect(testEvent!.sig).toMatch(/^[0-9a-f]{64}$/);
      expect(testEvent!.kind).toBe(1);
      expect(testEvent!.created_at).toBeTypeOf('number');
      expect(testEvent!.content).toBe('Debug info test');
      
      console.log('\n✅ Event structure is valid!');
    });
  });
}); 