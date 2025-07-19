import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../index';
import { createMockNostrEvent } from '../../test-utils/setup-phase3';

/**
 * 🎯 PHASE 3 INTEGRATION TEST - THE REAL DEAL
 * 
 * This test validates that Phase 3 Store System is ACTUALLY integrated
 * into the main NostrUnchained API that developers will use!
 */
describe('🔥 NostrUnchained + Phase 3 Store Integration', () => {
  let client: NostrUnchained;
  
  const UMBREL_RELAY = 'ws://umbrel.local:4848';
  
  beforeEach(async () => {
    // This is how REAL developers will use nostr-unchained
    client = await NostrUnchained.create({
      relays: [UMBREL_RELAY],
      timeout: 10000,
      debug: true
    });
  });

  afterEach(async () => {
    await client.dispose();
  });

  describe('✅ Public API Integration', () => {
    
    it('should expose store system through main API', async () => {
      // Developers should be able to access store system
      expect(client.storeManager).toBeDefined();
      expect(client.storeManager).not.toBeNull();
      
      console.log('✅ StoreManager accessible via client.storeManager');
    });

    it('should provide conversation stores via getConversation()', async () => {
      const conversationId = 'test-chat-api';
      
      // This is the MAIN API developers will use!
      const conversation = client.getConversation(conversationId);
      
      expect(conversation).toBeDefined();
      expect(conversation).not.toBeNull();
      expect(conversation!.conversationId).toBe(conversationId);
      
      console.log('✅ client.getConversation() working correctly');
    });

    it('should work with Svelte $conversation reactive syntax', async () => {
      const conversation = client.getConversation('svelte-test');
      
      // This is what Svelte developers expect to work:
      let reactiveState: any = null;
      const unsubscribe = conversation!.subscribe((state) => {
        reactiveState = state;
      });
      
      expect(reactiveState).toBeDefined();
      expect(reactiveState.conversationId).toBe('svelte-test');
      expect(reactiveState.messages).toEqual([]);
      
      unsubscribe();
      
      console.log('✅ Svelte reactive subscription working');
    });
  });

  describe('🌐 Real-world Usage Patterns', () => {
    
    it('should support the developer workflow: create client → get conversation → add message', async () => {
      console.log('\n🎯 Testing real developer workflow...');
      
      // Step 1: Developer creates client (already done in beforeEach)
      console.log('1️⃣ Client created and initialized');
      
      // Step 2: Developer gets a conversation
      const chat = client.getConversation('user-workflow-test');
      expect(chat).toBeDefined();
      console.log('2️⃣ Conversation obtained via API');
      
      // Step 3: Developer subscribes to updates
      const updates: any[] = [];
      const unsubscribe = chat!.subscribe((state) => {
        updates.push({
          messageCount: state.messages.length,
          lastMessage: state.lastMessage?.content
        });
      });
      console.log('3️⃣ Subscribed to conversation updates');
      
      // Step 4: Send a REAL message that gets published to relay
      const messageContent = 'Hello from the integrated API!';
      
      // This creates a REAL event and publishes it to Umbrel!
      await client.sendMessage('user-workflow-test', messageContent);
      console.log('4️⃣ REAL message sent and published to relay!');
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the workflow worked
      expect(updates.length).toBeGreaterThan(1); // Initial + update
      expect(updates[updates.length - 1].messageCount).toBe(1);
      expect(updates[updates.length - 1].lastMessage).toBe(messageContent);
      
      unsubscribe();
      
      console.log('✅ Complete developer workflow successful!');
    });

    it('should handle multiple conversations independently', async () => {
      const chat1 = client.getConversation('multi-chat-1');
      const chat2 = client.getConversation('multi-chat-2');
      
      expect(chat1!.conversationId).toBe('multi-chat-1');
      expect(chat2!.conversationId).toBe('multi-chat-2');
      
      // They should be different instances
      expect(chat1).not.toBe(chat2);
      
      // But both should work
      let chat1Updates = 0;
      let chat2Updates = 0;
      
      const unsub1 = chat1!.subscribe(() => chat1Updates++);
      const unsub2 = chat2!.subscribe(() => chat2Updates++);
      
      // Send REAL messages to different chats
      await client.sendMessage('multi-chat-1', 'Message to chat 1');
      await client.sendMessage('multi-chat-2', 'Message to chat 2');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(chat1Updates).toBeGreaterThan(1);
      expect(chat2Updates).toBeGreaterThan(1);
      
      unsub1();
      unsub2();
      
      console.log('✅ Multiple conversations working independently');
    });

    it('should integrate with Umbrel relay through unified API', async () => {
      // Test that the main API is connected to Umbrel
      const status = client.storeManager!.getConnectionStatus();
      
      expect(status.connectedRelays).toBeGreaterThan(0);
      console.log(`🌐 Connected to ${status.connectedRelays} relay(s)`);
      
      // Verify Umbrel is in the relay list
      expect(client.config.relays).toContain(UMBREL_RELAY);
      console.log(`✅ Umbrel relay configured: ${UMBREL_RELAY}`);
    });
  });

  describe('🧪 Phase 3 Integration Validation', () => {
    
    it('should demonstrate that Phase 3 is ACTUALLY integrated', () => {
      console.log('\n🧪 PHASE 3 INTEGRATION VALIDATION');
      console.log('==================================');
      
      const validation = {
        mainApiExposed: !!client.storeManager,
        conversationMethod: typeof client.getConversation === 'function',
        storeManagerInitialized: client.storeManager !== null,
        relayConfiguration: client.config.relays.length > 0,
        publicApiUsable: true
      };
      
      console.log('✅ Main API exposes StoreManager:', validation.mainApiExposed);
      console.log('✅ getConversation() method available:', validation.conversationMethod);
      console.log('✅ StoreManager initialized:', validation.storeManagerInitialized);
      console.log('✅ Relay configuration present:', validation.relayConfiguration);
      
      // This is the key test - can developers use the public API?
      try {
        const testConversation = client.getConversation('integration-test');
        expect(testConversation).toBeDefined();
        expect(testConversation!.conversationId).toBe('integration-test');
        
        // Can they subscribe?
        const unsubscribe = testConversation!.subscribe(() => {});
        unsubscribe();
        
        validation.publicApiUsable = true;
        console.log('✅ Public API fully usable:', validation.publicApiUsable);
      } catch (error) {
        validation.publicApiUsable = false;
        console.log('❌ Public API broken:', error);
      }
      
      const allValid = Object.values(validation).every(Boolean);
      
      if (allValid) {
        console.log('\n🎉 PHASE 3 INTEGRATION: COMPLETE SUCCESS!');
        console.log('   Developers can now use:');
        console.log('   - await NostrUnchained.create()');
        console.log('   - client.getConversation(id)');
        console.log('   - $conversation.messages in Svelte');
        console.log('   - Real-time updates with Umbrel relay');
      } else {
        console.log('\n❌ PHASE 3 INTEGRATION: INCOMPLETE');
        Object.entries(validation).forEach(([key, value]) => {
          if (!value) console.log(`   ❌ ${key}: FAILED`);
        });
      }
      
      expect(allValid).toBe(true);
    });

    it('should match the originally promised Phase 3 API', async () => {
      // This is what was promised in Phase 3 specs
      const expectedAPI = {
        // Store System accessible
        storeManager: 'object',
        
        // Conversation method
        getConversation: 'function',
        
        // Svelte integration
        svelteSubscription: 'function'
      };
      
      expect(typeof client.storeManager).toBe(expectedAPI.storeManager);
      expect(typeof client.getConversation).toBe(expectedAPI.getConversation);
      
      const conversation = client.getConversation('api-validation');
      expect(typeof conversation!.subscribe).toBe(expectedAPI.svelteSubscription);
      
      console.log('✅ API matches Phase 3 specifications');
    });
  });

  describe('🚀 Performance with Real API', () => {
    
    it('should maintain sub-100ms performance through public API', async () => {
      const conversation = client.getConversation('performance-test');
      
      const updateTimes: number[] = [];
      const unsubscribe = conversation!.subscribe(() => {
        updateTimes.push(performance.now());
      });
      
      const startTime = performance.now();
      
      // Add message through API
      const testMessage = createMockNostrEvent({ content: 'Performance test message' });
      await client.storeManager!.addMessage('performance-test', testMessage);
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      expect(totalDuration).toBeLessThan(100);
      console.log(`✅ API update time: ${totalDuration.toFixed(2)}ms (<100ms requirement)`);
      
      unsubscribe();
    });
  });

  describe('🔄 Resource Management', () => {
    
    it('should cleanup Phase 3 resources on dispose', async () => {
      const conversation = client.getConversation('cleanup-test');
      expect(conversation).toBeDefined();
      
      // Add a subscription
      const unsubscribe = conversation!.subscribe(() => {});
      
      // Dispose should cleanup everything
      await client.dispose();
      
      // After dispose, store manager should be cleaned up
      expect(client.isInitialized).toBe(false);
      
      console.log('✅ Resource cleanup working correctly');
      
      // Clean up the subscription manually since client is disposed
      unsubscribe();
    });
  });
}); 