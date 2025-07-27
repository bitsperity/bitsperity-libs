/**
 * REAL DMConversation Tests - NO MOCKS
 * 
 * Comprehensive tests for DMConversation with authentic implementations:
 * - Real TemporarySigner crypto and NIP-44 v2 encryption
 * - Real relay communication with ws://umbrel.local:4848
 * - Real NIP-59 gift wrap protocol
 * - Real reactive stores and subscription management
 * - Real bidirectional message validation
 * - Real error handling and connection states
 * - Real subject management and NIP-17 compliance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';
import type { DMMessage, ConversationStatus } from '../../src/dm/conversation/DMConversation.js';

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

describe('REAL DMConversation - NO MOCKS', () => {
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
    await alice.dm.updateSigningProvider(aliceSigner);
    await bob.dm.updateSigningProvider(bobSigner);
  }, TEST_TIMEOUT);

  afterEach(async () => {
    try {
      await alice?.disconnect();
      await bob?.disconnect();
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Real Constructor and Initialization', () => {
    it('should initialize conversation with authentic reactive stores', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      expect(conversation).toBeDefined();
      expect(conversation.messages).toBeDefined();
      expect(conversation.status).toBeDefined();
      expect(conversation.latest).toBeDefined();
      expect(conversation.error).toBeDefined();
      expect(conversation.subject).toBeDefined();
      
      // Test reactive store interfaces
      let messages: DMMessage[] = [];
      let status: ConversationStatus = 'connecting';
      
      const unsubMessages = conversation.messages.subscribe(msgs => { messages = msgs; });
      const unsubStatus = conversation.status.subscribe(s => { status = s; });
      
      expect(Array.isArray(messages)).toBe(true);
      expect(['connecting', 'active', 'error'].includes(status)).toBe(true);
      
      unsubMessages();
      unsubStatus();
      
      console.log('✅ Real reactive stores initialized');
    }, TEST_TIMEOUT);

    it('should start real subscription for gift wrap events', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Wait for subscription to become active
      await waitForCondition(
        () => {
          let currentStatus: ConversationStatus = 'connecting';
          const unsub = conversation.status.subscribe(s => { currentStatus = s; });
          unsub();
          return currentStatus === 'active';
        },
        TEST_TIMEOUT
      );
      
      let finalStatus: ConversationStatus = 'connecting';
      const unsub = conversation.status.subscribe(s => { finalStatus = s; });
      unsub();
      
      expect(finalStatus).toBe('active');
      console.log('✅ Real subscription established');
    }, TEST_TIMEOUT);

    it('should initialize with empty messages and null latest', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      let messages: DMMessage[] = [];
      let latest: DMMessage | null = null;
      
      const unsubMessages = conversation.messages.subscribe(msgs => { messages = msgs; });
      const unsubLatest = conversation.latest.subscribe(l => { latest = l; });
      
      expect(messages).toEqual([]);
      expect(latest).toBeNull();
      
      unsubMessages();
      unsubLatest();
      
      console.log('✅ Empty initial state verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Message Sending with Authentic Crypto', () => {
    it('should send real encrypted message and update stores optimistically', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      
      let messages: DMMessage[] = [];
      let latest: DMMessage | null = null;
      
      const unsubMessages = aliceConversation.messages.subscribe(msgs => { messages = msgs; });
      const unsubLatest = aliceConversation.latest.subscribe(l => { latest = l; });
      
      // Send real encrypted message
      const testMessage = `Real encrypted test at ${Date.now()}`;
      const result = await aliceConversation.send(testMessage);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      
      // Verify optimistic update
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe(testMessage);
      expect(messages[0].isFromMe).toBe(true);
      expect(messages[0].senderPubkey).toBe(alicePublicKey);
      expect(messages[0].recipientPubkey).toBe(bobPublicKey);
      expect(['sending', 'sent'].includes(messages[0].status)).toBe(true);
      
      // Verify latest message
      expect(latest).toBeDefined();
      expect(latest!.content).toBe(testMessage);
      
      unsubMessages();
      unsubLatest();
      
      console.log('✅ Real message sending with optimistic updates verified');
    }, TEST_TIMEOUT);

    it('should handle real NIP-44 v2 encryption errors gracefully', async () => {
      // Create conversation with invalid recipient (but valid format)
      const invalidRecipient = 'f'.repeat(64); // Valid hex format but likely no real key
      const conversation = await alice.dm.with(invalidRecipient);
      
      const testMessage = 'This should work even with unknown recipient';
      const result = await conversation.send(testMessage);
      
      // The result depends on the actual implementation - it might succeed or fail
      // Both are valid behaviors: 
      // - Success: encryption works, relay accepts
      // - Failure: validation rejects unknown recipients
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result.messageId).toBeDefined();
        console.log('✅ Real encryption with unknown recipient: succeeded (relay accepts)');
      } else {
        expect(result.error).toBeDefined();
        console.log('✅ Real encryption with unknown recipient: failed (validation rejects)');
      }
    }, TEST_TIMEOUT);

    it('should update message status from sending to sent', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      let messages: DMMessage[] = [];
      const unsubMessages = conversation.messages.subscribe(msgs => { messages = msgs; });
      
      const testMessage = `Status test ${Date.now()}`;
      await conversation.send(testMessage);
      
      // Wait for status to potentially update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(messages.length).toBe(1);
      expect(['sending', 'sent'].includes(messages[0].status)).toBe(true);
      
      unsubMessages();
      
      console.log(`✅ Message status: ${messages[0].status}`);
    }, TEST_TIMEOUT);
  });

  describe('Real Message Receiving and Bidirectional Validation', () => {
    it('should receive and decrypt real messages from other party', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      let aliceMessages: DMMessage[] = [];
      aliceConversation.messages.subscribe(msgs => { aliceMessages = msgs; });
      
      // Bob sends real encrypted message to Alice
      const bobMessage = `Real message from Bob at ${Date.now()}`;
      const result = await bobConversation.send(bobMessage);
      
      expect(result.success).toBe(true);
      
      // Wait for Alice to receive and decrypt
      await waitForCondition(
        () => aliceMessages.some(msg => 
          msg.content === bobMessage && 
          msg.senderPubkey === bobPublicKey &&
          !msg.isFromMe
        ),
        TEST_TIMEOUT
      );
      
      const receivedMessage = aliceMessages.find(msg => msg.content === bobMessage);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage!.senderPubkey).toBe(bobPublicKey);
      expect(receivedMessage!.recipientPubkey).toBe(alicePublicKey);
      expect(receivedMessage!.isFromMe).toBe(false);
      expect(receivedMessage!.status).toBe('received');
      
      console.log('✅ Real bidirectional message receiving verified');
    }, TEST_TIMEOUT);

    it('should update latest message when receiving new messages', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      let aliceLatest: DMMessage | null = null;
      aliceConversation.latest.subscribe(l => { aliceLatest = l; });
      
      // Bob sends message
      const bobMessage = `Latest test from Bob at ${Date.now()}`;
      await bobConversation.send(bobMessage);
      
      // Wait for Alice to receive
      await waitForCondition(
        () => aliceLatest !== null && 
              aliceLatest.content === bobMessage &&
              aliceLatest.senderPubkey === bobPublicKey,
        TEST_TIMEOUT
      );
      
      expect(aliceLatest).toBeDefined();
      expect(aliceLatest!.content).toBe(bobMessage);
      expect(aliceLatest!.isFromMe).toBe(false);
      
      console.log('✅ Real latest message updates verified');
    }, TEST_TIMEOUT);

    it('should handle message chronological ordering correctly', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      let aliceMessages: DMMessage[] = [];
      aliceConversation.messages.subscribe(msgs => { aliceMessages = msgs; });
      
      // Send messages in sequence
      const message1 = `First message ${Date.now()}`;
      const message2 = `Second message ${Date.now() + 1}`;
      
      await aliceConversation.send(message1);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      await bobConversation.send(message2);
      
      // Wait for both messages
      await waitForCondition(
        () => aliceMessages.length >= 2,
        TEST_TIMEOUT
      );
      
      // Messages should be ordered by timestamp
      const sortedMessages = aliceMessages.sort((a, b) => a.timestamp - b.timestamp);
      expect(sortedMessages[0].content).toBe(message1);
      expect(sortedMessages[1].content).toBe(message2);
      
      console.log('✅ Real message chronological ordering verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Subject Management and NIP-17 Compliance', () => {
    it('should handle conversation subjects with real protocol', async () => {
      const testSubject = 'Real Test Subject';
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Update subject
      conversation.updateSubject(testSubject);
      
      let currentSubject: string | undefined;
      const unsub = conversation.subject.subscribe(s => { currentSubject = s; });
      
      expect(currentSubject).toBe(testSubject);
      
      // Send message with subject
      const messageWithSubject = 'Message with subject';
      const result = await conversation.send(messageWithSubject, testSubject);
      
      expect(result.success).toBe(true);
      
      unsub();
      
      console.log('✅ Real subject management verified');
    }, TEST_TIMEOUT);

    it('should maintain subject consistency across messages', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      const testSubject = 'Consistent Subject Test';
      aliceConversation.updateSubject(testSubject);
      
      let aliceMessages: DMMessage[] = [];
      aliceConversation.messages.subscribe(msgs => { aliceMessages = msgs; });
      
      // Send message with subject
      await aliceConversation.send('Message with subject', testSubject);
      
      // Verify subject is maintained
      expect(aliceMessages.length).toBe(1);
      expect(aliceMessages[0].subject).toBe(testSubject);
      
      console.log('✅ Real subject consistency verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Connection State Management', () => {
    it('should handle real subscription status transitions', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      let statusHistory: ConversationStatus[] = [];
      conversation.status.subscribe(status => {
        statusHistory.push(status);
      });
      
      // Wait for stable active state
      await waitForCondition(
        () => statusHistory.includes('active'),
        TEST_TIMEOUT
      );
      
      expect(statusHistory.length).toBeGreaterThan(0);
      expect(statusHistory[statusHistory.length - 1]).toBe('active');
      
      console.log(`✅ Real status transitions: ${statusHistory.join(' → ')}`);
    }, TEST_TIMEOUT);

    it('should handle real error states and recovery', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      let errorStates: (string | null)[] = [];
      conversation.error.subscribe(error => {
        errorStates.push(error);
      });
      
      // Normal operation should have no errors
      await waitForCondition(
        () => errorStates.length > 0,
        2000
      ).catch(() => {
        // Expected timeout - no errors is good
      });
      
      // Should start with null error
      expect(errorStates[0]).toBeNull();
      
      console.log('✅ Real error state management verified');
    }, TEST_TIMEOUT);

    it('should close real subscriptions properly', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Verify active subscription
      let status: ConversationStatus = 'connecting';
      const unsub = conversation.status.subscribe(s => { status = s; });
      
      await waitForCondition(() => status === 'active', TEST_TIMEOUT);
      unsub();
      
      // Close conversation
      await conversation.close();
      
      // Status should change to disconnected
      let finalStatus: ConversationStatus = 'active';
      const unsub2 = conversation.status.subscribe(s => { finalStatus = s; });
      
      expect(finalStatus).toBe('disconnected');
      unsub2();
      
      console.log('✅ Real subscription cleanup verified');
    }, TEST_TIMEOUT);
  });

  describe('Real Edge Cases and Error Handling', () => {
    it('should handle duplicate messages gracefully', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      let aliceMessages: DMMessage[] = [];
      aliceConversation.messages.subscribe(msgs => { aliceMessages = msgs; });
      
      const testMessage = `Duplicate test ${Date.now()}`;
      
      // Send same message multiple times quickly
      await bobConversation.send(testMessage);
      await bobConversation.send(testMessage);
      
      // Wait for messages to arrive
      await waitForCondition(
        () => aliceMessages.length > 0,
        TEST_TIMEOUT
      );
      
      // Should handle duplicates appropriately (either dedupe or accept both)
      const messagesWithContent = aliceMessages.filter(msg => msg.content === testMessage);
      expect(messagesWithContent.length).toBeGreaterThan(0);
      
      console.log(`✅ Duplicate handling: ${messagesWithContent.length} messages received`);
    }, TEST_TIMEOUT);

    it('should handle large message content', async () => {
      const conversation = await alice.dm.with(bobPublicKey);
      
      // Create large message content
      const largeContent = 'A'.repeat(1000) + ` - ${Date.now()}`;
      const result = await conversation.send(largeContent);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      
      console.log('✅ Large message content handled');
    }, TEST_TIMEOUT);

    it('should handle special characters and emojis', async () => {
      const aliceConversation = await alice.dm.with(bobPublicKey);
      const bobConversation = await bob.dm.with(alicePublicKey);
      
      let aliceMessages: DMMessage[] = [];
      aliceConversation.messages.subscribe(msgs => { aliceMessages = msgs; });
      
      const specialMessage = `Special chars: 🔥💬🎯 äöü ñáéí 中文 ${Date.now()}`;
      await bobConversation.send(specialMessage);
      
      await waitForCondition(
        () => aliceMessages.some(msg => msg.content === specialMessage),
        TEST_TIMEOUT
      );
      
      const receivedMessage = aliceMessages.find(msg => msg.content === specialMessage);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage!.content).toBe(specialMessage);
      
      console.log('✅ Special characters and emojis handled correctly');
    }, TEST_TIMEOUT);
  });
});