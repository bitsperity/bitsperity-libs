/**
 * DMModule Unit Tests
 * 
 * Comprehensive unit tests for the DMModule class covering:
 * - Conversation management (create, get, close)
 * - Room management (create, get, close)
 * - Reactive conversation list updates
 * - Signing provider integration
 * - Global inbox subscription handling
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { DMModule, type DMModuleConfig, type ConversationSummary } from '../../src/dm/api/DMModule.js';
import { DMConversation } from '../../src/dm/conversation/DMConversation.js';
import { DMRoom } from '../../src/dm/room/DMRoom.js';

// Mock dependencies
const mockSubscriptionManager = {
  subscribe: vi.fn(),
  close: vi.fn()
};

const mockRelayManager = {
  publishToAll: vi.fn(),
  connectedRelays: ['wss://test.relay'],
  relayUrls: ['wss://test.relay']
};

const mockSigningProvider = {
  getPublicKey: vi.fn().mockResolvedValue('test-sender-pubkey-64char-abcdef1234567890abcdef1234567890'),
  signEvent: vi.fn()
};

describe('DMModule', () => {
  let dmModule: DMModule;
  let config: DMModuleConfig;

  const testRecipientPubkey = 'test-recipient-pubkey-64char-fedcba0987654321fedcba0987654321';
  const testRecipient2Pubkey = 'test-recipient2-pubkey-64char-123456789abcdef123456789abcdef';

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      signingProvider: mockSigningProvider as any,
      debug: true
    };

    dmModule = new DMModule(config);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(dmModule).toBeInstanceOf(DMModule);
      expect(dmModule.conversations$).toBeDefined();
    });

    it('should initialize signing provider if available', async () => {
      expect(mockSigningProvider.getPublicKey).toHaveBeenCalled();
    });

    it('should handle missing signing provider gracefully', () => {
      const configWithoutSigning = {
        ...config,
        signingProvider: undefined as any
      };

      const dmModuleWithoutSigning = new DMModule(configWithoutSigning);
      expect(dmModuleWithoutSigning).toBeInstanceOf(DMModule);
    });
  });

  describe('Conversation Management', () => {
    it('should create new conversation for unknown pubkey', () => {
      const conversation = dmModule.with(testRecipientPubkey);
      
      expect(conversation).toBeInstanceOf(DMConversation);
    });

    it('should return same conversation instance for same pubkey', () => {
      const conversation1 = dmModule.with(testRecipientPubkey);
      const conversation2 = dmModule.with(testRecipientPubkey);
      
      expect(conversation1).toBe(conversation2);
    });

    it('should create different conversations for different pubkeys', () => {
      const conversation1 = dmModule.with(testRecipientPubkey);
      const conversation2 = dmModule.with(testRecipient2Pubkey);
      
      expect(conversation1).not.toBe(conversation2);
    });

    it('should normalize pubkeys correctly', () => {
      const lowerPubkey = testRecipientPubkey.toLowerCase();
      const upperPubkey = testRecipientPubkey.toUpperCase();
      
      const conversation1 = dmModule.with(lowerPubkey);
      const conversation2 = dmModule.with(upperPubkey);
      
      expect(conversation1).toBe(conversation2);
    });

    it('should validate pubkey format', () => {
      expect(() => dmModule.with('invalid-pubkey')).toThrow('Invalid pubkey format');
      expect(() => dmModule.with('')).toThrow('Invalid pubkey format');
      expect(() => dmModule.with('short')).toThrow('Invalid pubkey format');
    });

    it('should reject npub format with helpful error', () => {
      expect(() => dmModule.with('npub1234567890abcdef')).toThrow('npub format not yet supported');
    });

    it('should close conversation correctly', async () => {
      const conversation = dmModule.with(testRecipientPubkey);
      const closeSpy = vi.spyOn(conversation, 'close').mockResolvedValue();
      
      await dmModule.closeConversation(testRecipientPubkey);
      
      expect(closeSpy).toHaveBeenCalled();
      
      // Should create new instance after closing
      const newConversation = dmModule.with(testRecipientPubkey);
      expect(newConversation).not.toBe(conversation);
    });

    it('should handle closing non-existent conversation', async () => {
      await expect(dmModule.closeConversation('nonexistent-pubkey-64char-000000000000000000000000')).resolves.not.toThrow();
    });
  });

  describe('Room Management', () => {
    const testParticipants = [testRecipientPubkey, testRecipient2Pubkey];
    const testRoomOptions = { subject: 'Test Meeting' };

    it('should create new room for participants', () => {
      const room = dmModule.room(testParticipants, testRoomOptions);
      
      expect(room).toBeInstanceOf(DMRoom);
    });

    it('should return same room instance for same participants', () => {
      const room1 = dmModule.room(testParticipants, testRoomOptions);
      const room2 = dmModule.room(testParticipants, { subject: 'Different Subject' });
      
      expect(room1).toBe(room2);
    });

    it('should normalize participant pubkeys', () => {
      const lowerParticipants = testParticipants.map(p => p.toLowerCase());
      const upperParticipants = testParticipants.map(p => p.toUpperCase());
      
      const room1 = dmModule.room(lowerParticipants, testRoomOptions);
      const room2 = dmModule.room(upperParticipants, testRoomOptions);
      
      expect(room1).toBe(room2);
    });

    it('should handle participant order independence', () => {
      const room1 = dmModule.room([testRecipientPubkey, testRecipient2Pubkey], testRoomOptions);
      const room2 = dmModule.room([testRecipient2Pubkey, testRecipientPubkey], testRoomOptions);
      
      expect(room1).toBe(room2);
    });

    it('should close room correctly', async () => {
      const room = dmModule.room(testParticipants, testRoomOptions);
      const closeSpy = vi.spyOn(room, 'close').mockResolvedValue();
      
      // Get room ID by checking conversation list
      const summaries = dmModule.getConversations();
      const roomSummary = summaries.find(s => s.type === 'room');
      
      if (roomSummary) {
        await dmModule.closeRoom(roomSummary.pubkey);
        expect(closeSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Conversation List Management', () => {
    it('should start with empty conversation list', () => {
      const conversations = dmModule.getConversations();
      expect(conversations).toEqual([]);
    });

    it('should include conversations in list', () => {
      dmModule.with(testRecipientPubkey);
      
      const conversations = dmModule.getConversations();
      expect(conversations).toHaveLength(1);
      expect(conversations[0].type).toBe('conversation');
      expect(conversations[0].pubkey).toBe(testRecipientPubkey);
    });

    it('should include rooms in list', () => {
      dmModule.room([testRecipientPubkey], { subject: 'Test Room' });
      
      const conversations = dmModule.getConversations();
      const roomSummary = conversations.find(s => s.type === 'room');
      
      expect(roomSummary).toBeDefined();
      expect(roomSummary?.subject).toBe('Test Room');
      expect(roomSummary?.participants).toContain(testRecipientPubkey);
    });

    it('should provide reactive conversation list', (done) => {
      let updateCount = 0;
      
      const unsubscribe = dmModule.conversations$.subscribe(conversations => {
        updateCount++;
        
        if (updateCount === 1) {
          // Initial empty state
          expect(conversations).toHaveLength(0);
          dmModule.with(testRecipientPubkey);
        } else if (updateCount === 2) {
          // After adding conversation
          expect(conversations).toHaveLength(1);
          expect(conversations[0].type).toBe('conversation');
          unsubscribe();
          done();
        }
      });
    });

    it('should sort conversations by last activity', () => {
      // Create conversations (they will have different creation times)
      const conv1 = dmModule.with(testRecipientPubkey);
      const conv2 = dmModule.with(testRecipient2Pubkey);
      
      const conversations = dmModule.getConversations();
      expect(conversations).toHaveLength(2);
      
      // Most recent should be first (though they may have same timestamp in test)
      expect(conversations[0].lastActivity).toBeGreaterThanOrEqual(conversations[1].lastActivity);
    });
  });

  describe('Signing Provider Updates', () => {
    it('should update signing provider correctly', async () => {
      const newSigningProvider = {
        getPublicKey: vi.fn().mockResolvedValue('new-pubkey-64char-abcdef1234567890abcdef1234567890'),
        signEvent: vi.fn()
      };

      await dmModule.updateSigningProvider(newSigningProvider as any);
      
      expect(newSigningProvider.getPublicKey).toHaveBeenCalled();
    });

    it('should handle signing provider initialization errors', async () => {
      const faultySigningProvider = {
        getPublicKey: vi.fn().mockRejectedValue(new Error('Signing failed')),
        signEvent: vi.fn()
      };

      // Should not throw, but handle gracefully
      await expect(dmModule.updateSigningProvider(faultySigningProvider as any)).resolves.not.toThrow();
    });
  });

  describe('Global Inbox Subscription', () => {
    beforeEach(() => {
      mockSubscriptionManager.subscribe.mockResolvedValue({
        success: true,
        subscription: { id: 'test-subscription-id' }
      });
    });

    it('should start inbox subscription with correct filter', async () => {
      await dmModule.startInboxSubscription();
      
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [expect.objectContaining({
          kinds: [1059],
          '#p': ['test-sender-pubkey-64char-abcdef1234567890abcdef1234567890'],
          limit: 50
        })],
        expect.objectContaining({
          onEvent: expect.any(Function),
          onEose: expect.any(Function)
        })
      );
    });

    it('should handle subscription failure', async () => {
      mockSubscriptionManager.subscribe.mockResolvedValue({
        success: false,
        error: new Error('Subscription failed')
      });

      await expect(dmModule.startInboxSubscription()).rejects.toThrow('Subscription failed');
    });

    it('should require sender pubkey for inbox subscription', async () => {
      const dmModuleWithoutSigning = new DMModule({
        ...config,
        signingProvider: undefined as any
      });

      await expect(dmModuleWithoutSigning.startInboxSubscription()).rejects.toThrow('Sender public key not available');
    });
  });

  describe('Cleanup Operations', () => {
    it('should close all conversations and rooms', async () => {
      const conversation = dmModule.with(testRecipientPubkey);
      const room = dmModule.room([testRecipient2Pubkey], { subject: 'Test' });
      
      const convCloseSpy = vi.spyOn(conversation, 'close').mockResolvedValue();
      const roomCloseSpy = vi.spyOn(room, 'close').mockResolvedValue();
      
      await dmModule.closeAll();
      
      expect(convCloseSpy).toHaveBeenCalled();
      expect(roomCloseSpy).toHaveBeenCalled();
      
      // Conversation list should be empty
      const conversations = dmModule.getConversations();
      expect(conversations).toHaveLength(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      const conversation = dmModule.with(testRecipientPubkey);
      const closeSpy = vi.spyOn(conversation, 'close').mockRejectedValue(new Error('Close failed'));
      
      // Should complete despite individual failures
      await expect(dmModule.closeAll()).resolves.not.toThrow();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle conversation creation without signing provider', () => {
      const dmModuleWithoutSigning = new DMModule({
        ...config,
        signingProvider: undefined as any
      });

      expect(() => dmModuleWithoutSigning.with(testRecipientPubkey)).toThrow('Sender public key not available');
    });

    it('should handle room creation without signing provider', () => {
      const dmModuleWithoutSigning = new DMModule({
        ...config,
        signingProvider: undefined as any
      });

      expect(() => dmModuleWithoutSigning.room([testRecipientPubkey])).toThrow('Sender public key not available');
    });

    it('should provide debug logging when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      dmModule.with(testRecipientPubkey);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Created new DM conversation')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      const dmModuleNoDebug = new DMModule({
        ...config,
        debug: false
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      dmModuleNoDebug.with(testRecipientPubkey);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Private Key Security', () => {
    it('should use test private key in test environment', () => {
      // This is tested implicitly - the getPrivateKeySecurely method
      // should return test key in test environment without throwing
      expect(() => dmModule.with(testRecipientPubkey)).not.toThrow();
    });

    it('should warn about test private key usage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
      
      dmModule.with(testRecipientPubkey);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Using mock private key for testing')
      );
      
      consoleSpy.mockRestore();
    });
  });
});