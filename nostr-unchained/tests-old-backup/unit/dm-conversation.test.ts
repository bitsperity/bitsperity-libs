/**
 * Clean UniversalDMConversation Tests
 * 
 * Tests the new cache-based DM architecture:
 * - Real relay communication with ws://umbrel.local:4848
 * - Real NIP-44 v2 encryption via publishEncrypted()
 * - Real reactive stores via Universal Cache
 * - Clean API without legacy compatibility layers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import type { DMMessage } from '../../src/dm/conversation/UniversalDMConversation.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 15000;

// Helper to wait for conditions
async function waitForCondition<T>(
  checkFn: () => T | Promise<T>,
  timeoutMs: number = 10000,
  intervalMs: number = 100
): Promise<T> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await checkFn();
      if (result) {
        return result;
      }
    } catch (error) {
      // Continue trying
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

describe('Clean UniversalDMConversation Tests', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;
  let aliceSigner: TemporarySigner;
  let bobSigner: TemporarySigner;
  let alicePublicKey: string;
  let bobPublicKey: string;

  beforeEach(async () => {
    // Create real participants with authentic crypto
    aliceSigner = new TemporarySigner();
    bobSigner = new TemporarySigner();
    
    alicePublicKey = await aliceSigner.getPublicKey();
    bobPublicKey = await bobSigner.getPublicKey();

    alice = new NostrUnchained({
      relays: [LIVE_RELAY_URL],
      debug: true,
      signingProvider: aliceSigner
    });

    bob = new NostrUnchained({
      relays: [LIVE_RELAY_URL],
      debug: true,
      signingProvider: bobSigner
    });

    // Real relay connections and signing initialization
    await alice.connect();
    await bob.connect();
    await alice.initializeSigning();
    await bob.initializeSigning();
  }, TEST_TIMEOUT);

  afterEach(async () => {
    try {
      await alice?.disconnect();
      await bob?.disconnect();
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Clean API Tests', () => {
    it('should initialize conversation with clean API', async () => {
      const conversation = alice.dm.with(bobPublicKey);
      
      console.log('🧪 Test conversation debug:', {
        conversation: !!conversation,
        messages: !!conversation?.messages,
        subscribe: typeof conversation?.subscribe,
        send: typeof conversation?.send,
        constructor: conversation?.constructor?.name,
        keys: Object.keys(conversation || {})
      });
      
      expect(conversation).toBeDefined();
      expect(conversation.messages).toBeDefined();
      expect(typeof conversation.subscribe).toBe('function');
      expect(typeof conversation.send).toBe('function');
      
      // Test messages store interface
      expect(conversation.messages.current).toBeDefined();
      expect(Array.isArray(conversation.messages.current)).toBe(true);
      
      // Test reactive subscription
      let messageCount = 0;
      const unsubscribe = conversation.messages.subscribe(messages => {
        messageCount = messages.length;
      });
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should send and receive messages cleanly', async () => {
      const aliceConversation = alice.dm.with(bobPublicKey);
      const bobConversation = bob.dm.with(alicePublicKey);
      
      // Track Alice's messages
      let aliceMessages: DMMessage[] = [];
      const aliceUnsub = aliceConversation.subscribe(messages => {
        aliceMessages = messages;
      });
      
      // Track Bob's messages  
      let bobMessages: DMMessage[] = [];
      const bobUnsub = bobConversation.subscribe(messages => {
        bobMessages = messages;
      });
      
      // Alice sends message to Bob
      const testMessage = `Clean API test ${Date.now()}`;
      const sendResult = await aliceConversation.send(testMessage);
      
      console.log('🧪 Send result debug:', sendResult);
      
      expect(sendResult.success).toBe(true);
      expect(sendResult.messageId).toBeDefined();
      
      // Wait for message to appear in Alice's conversation
      await waitForCondition(() => aliceMessages.length > 0, 5000);
      
      const aliceMsg = aliceMessages[0];
      expect(aliceMsg.content).toBe(testMessage);
      expect(aliceMsg.senderPubkey).toBe(alicePublicKey);
      expect(aliceMsg.isFromMe).toBe(true);
      
      // Clean up
      aliceUnsub();
      bobUnsub();
    });

    it('should handle current messages correctly', async () => {
      const conversation = alice.dm.with(bobPublicKey);
      
      // Initial state
      expect(conversation.messages.current).toEqual([]);
      
      // Send a message
      const testMessage = `Current messages test ${Date.now()}`;
      await conversation.send(testMessage);
      
      // Wait for message to appear
      await waitForCondition(() => conversation.messages.current.length > 0, 5000);
      
      const currentMessages = conversation.messages.current;
      expect(currentMessages.length).toBe(1);
      expect(currentMessages[0].content).toBe(testMessage);
    });

    it('should handle multiple messages in order', async () => {
      const conversation = alice.dm.with(bobPublicKey);
      
      // Send multiple messages quickly
      const messages = [
        `Message 1 - ${Date.now()}`,
        `Message 2 - ${Date.now() + 1}`,
        `Message 3 - ${Date.now() + 2}`
      ];
      
      for (const msg of messages) {
        await conversation.send(msg);
        // Small delay to ensure ordering
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Wait for all messages
      await waitForCondition(() => conversation.messages.current.length === 3, 10000);
      
      const receivedMessages = conversation.messages.current;
      expect(receivedMessages.length).toBe(3);
      
      // Check content matches
      receivedMessages.forEach((msg, index) => {
        expect(msg.content).toContain(`Message ${index + 1}`);
      });
    });

    it('should handle encryption errors gracefully', async () => {
      const conversation = alice.dm.with('invalid-pubkey');
      
      const result = await conversation.send('This should fail gracefully');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('Reactive Store Tests', () => {
    it('should notify subscribers of new messages', async () => {
      const conversation = alice.dm.with(bobPublicKey);
      
      let notificationCount = 0;
      let latestMessages: DMMessage[] = [];
      
      const unsubscribe = conversation.subscribe(messages => {
        notificationCount++;
        latestMessages = messages;
      });
      
      // Initial notification should happen
      expect(notificationCount).toBeGreaterThan(0);
      
      // Send a message
      const testMessage = `Reactive test ${Date.now()}`;
      await conversation.send(testMessage);
      
      // Wait for notification
      await waitForCondition(() => latestMessages.length > 0, 5000);
      
      expect(latestMessages.length).toBe(1);
      expect(latestMessages[0].content).toBe(testMessage);
      
      unsubscribe();
    });
  });
});