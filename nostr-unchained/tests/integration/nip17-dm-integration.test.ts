/**
 * NIP-17 DM Integration Tests
 * 
 * Tests the complete DM functionality integration including:
 * - DMConversation reactive stores
 * - DMModule management
 * - NostrUnchained API integration
 * - Message sending/receiving pipeline
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import type { DMMessage } from '../../src/dm/index.js';

// Mock the RelayManager to avoid real network calls
vi.mock('../../src/relay/RelayManager.js', () => ({
  RelayManager: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    publishToAll: vi.fn().mockResolvedValue([{ success: true, relay: 'wss://test.relay' }]),
    connectedRelays: ['wss://test.relay'],
    relayUrls: ['wss://test.relay'],
    getStats: vi.fn().mockReturnValue({}),
    sendToAll: vi.fn().mockResolvedValue(undefined),
    sendToRelays: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock the signing provider to avoid extension dependency
vi.mock('../../src/crypto/SigningProvider.js', () => ({
  SigningProviderFactory: {
    createBestAvailable: vi.fn().mockResolvedValue({
      provider: {
        getPublicKey: vi.fn().mockResolvedValue('test-pubkey-64-char-string-abcdef1234567890abcdef1234567890'),
        signEvent: vi.fn().mockResolvedValue('test-signature')
      },
      method: 'test'
    })
  },
  ExtensionSigner: {
    isAvailable: vi.fn().mockResolvedValue(false)
  }
}));

// Mock NIP-59 GiftWrapProtocol for testing
vi.mock('../../src/dm/protocol/GiftWrapProtocol.js', () => ({
  GiftWrapProtocol: {
    createGiftWrappedDM: vi.fn().mockResolvedValue({
      rumor: {
        content: 'test message',
        created_at: Math.floor(Date.now() / 1000),
        pubkey: 'sender-pubkey'
      },
      seal: { id: 'seal-id' },
      giftWraps: [{
        giftWrap: {
          id: 'giftwrap-id',
          kind: 1059,
          content: 'encrypted-content',
          created_at: Math.floor(Date.now() / 1000)
        },
        recipient: 'recipient-pubkey'
      }]
    }),
    decryptGiftWrappedDM: vi.fn().mockResolvedValue({
      isValid: true,
      rumor: {
        content: 'received message',
        created_at: Math.floor(Date.now() / 1000),
        pubkey: 'sender-pubkey'
      },
      senderPubkey: 'sender-pubkey'
    }),
    createSimpleConfig: vi.fn().mockReturnValue({
      recipients: [{ pubkey: 'recipient-pubkey' }]
    })
  }
}));

describe('NIP-17 DM Integration', () => {
  let nostr: NostrUnchained;

  // Helper function to initialize signing
  const initializeSigning = async (nostrInstance: NostrUnchained) => {
    try {
      await nostrInstance.publish('test message');
    } catch {
      // Publishing might fail but signing should be initialized
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    nostr = new NostrUnchained({ debug: true });
  });

  describe('DMModule Integration', () => {
    it('should expose dm property on NostrUnchained', () => {
      expect(nostr.dm).toBeDefined();
      expect(typeof nostr.dm.with).toBe('function');
    });

    it('should create conversation stores', async () => {
      await initializeSigning(nostr);
      
      const recipientPubkey = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const conversation = nostr.dm.with(recipientPubkey);
      
      expect(conversation).toBeDefined();
      expect(typeof conversation.send).toBe('function');
      expect(typeof conversation.subscribe).toBe('function');
    });

    it('should provide reactive store interface', async () => {
      await initializeSigning(nostr);
      
      const recipientPubkey = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const conversation = nostr.dm.with(recipientPubkey);
      
      // Test reactive properties
      expect(conversation.messages).toBeDefined();
      expect(conversation.status).toBeDefined();
      expect(conversation.latest).toBeDefined();
      expect(conversation.subject).toBeDefined();
      
      // Test subscription interface
      let messages: DMMessage[] = [];
      const unsubscribe = conversation.subscribe(msgs => {
        messages = msgs;
      });
      
      expect(Array.isArray(messages)).toBe(true);
      unsubscribe();
    });
  });

  describe('DMConversation API', () => {
    it('should match the high-level vision API', async () => {
      await initializeSigning(nostr);
      
      // Target API from requirements:
      // const conversation = nostr.dm.with('npub1234...');
      // await conversation.send("Hello!");
      // $: messages = $conversation.messages;
      
      const conversation = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      
      // Test send method exists and returns promise
      const sendPromise = conversation.send("Hello!");
      expect(sendPromise).toBeInstanceOf(Promise);
      
      // Test reactive properties
      expect(conversation.messages).toBeDefined();
      expect(conversation.status).toBeDefined();
      expect(conversation.latest).toBeDefined();
    });

    it('should handle message status tracking', async () => {
      await initializeSigning(nostr);
      
      const conversation = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      
      // Track status changes
      let currentStatus = 'connecting';
      conversation.status.subscribe(status => {
        currentStatus = status;
      });
      
      // Should start in connecting state
      expect(currentStatus).toBe('connecting');
    });
  });

  describe('Message Processing Pipeline', () => {
    it('should handle outgoing message flow', async () => {
      await initializeSigning(nostr);
      
      const conversation = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      
      // Should handle the complete outgoing flow
      // The mock private key should work in test mode
      const result = await conversation.send("Test message");
      
      // Should return success/failure result
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.messageId).toBe('string');
    });
  });

  describe('Multi-conversation Support', () => {
    it('should manage multiple conversations independently', async () => {
      await initializeSigning(nostr);
      
      const pubkey1 = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const pubkey2 = 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
      
      const conversation1 = nostr.dm.with(pubkey1);
      const conversation2 = nostr.dm.with(pubkey2);
      
      // Should be different conversation instances
      expect(conversation1).not.toBe(conversation2);
      
      // Should return same instance for same pubkey
      const conversation1Again = nostr.dm.with(pubkey1);
      expect(conversation1).toBe(conversation1Again);
    });

    it('should provide conversation list and room support', async () => {
      await nostr.hasExtension();
      
      // Test global DM properties
      expect(nostr.dm.conversations$).toBeDefined();
      
      // Test conversation and room management methods
      expect(typeof nostr.dm.getConversations).toBe('function');
      expect(typeof nostr.dm.with).toBe('function');
      expect(typeof nostr.dm.room).toBe('function');
    });
  });

  describe('Integration with Existing Components', () => {
    it('should use existing SubscriptionManager', () => {
      // Verify that DM module uses the same subscription manager
      expect((nostr as any).subscriptionManager).toBeDefined();
      expect((nostr.dm as any).config.subscriptionManager).toBe((nostr as any).subscriptionManager);
    });

    it('should use existing RelayManager', () => {
      // Verify that DM module uses the same relay manager
      expect((nostr as any).relayManager).toBeDefined();
      expect((nostr.dm as any).config.relayManager).toBe((nostr as any).relayManager);
    });

    it('should integrate with signing provider initialization', async () => {
      // Before signing initialization
      expect((nostr.dm as any).config.signingProvider).toBeUndefined();
      
      // Trigger signing initialization
      await initializeSigning(nostr);
      
      // After signing initialization, DM module should have the provider
      expect((nostr.dm as any).config.signingProvider).toBeDefined();
    });
  });
});

describe('Advanced DM Features', () => {
  let nostr: NostrUnchained;

  const initializeSigning = async (nostrInstance: NostrUnchained) => {
    try {
      await nostrInstance.publish('test message');
    } catch {
      // Publishing might fail but signing should be initialized
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    nostr = new NostrUnchained({ debug: true });
  });

  it('should support the magical first experience API', async () => {
    await initializeSigning(nostr);
    
    // Target: Epic 1: Magical First Experience  
    // const nostr = new NostrUnchained();
    // const conversation = nostr.dm.with('npub1234...');
    // await conversation.send("Hello!");
    // $: messages = $conversation.messages;
    
    const conversation = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    
    // Should provide clean reactive interface
    let messages: DMMessage[] = [];
    let status = '';
    let latest: DMMessage | null = null;
    let subject: string | undefined;
    
    const unsubMessages = conversation.messages.subscribe(m => { messages = m; });
    const unsubStatus = conversation.status.subscribe(s => { status = s; });  
    const unsubLatest = conversation.latest.subscribe(l => { latest = l; });
    const unsubSubject = conversation.subject.subscribe(s => { subject = s; });
    
    expect(Array.isArray(messages)).toBe(true);
    expect(typeof status).toBe('string');
    expect(latest).toBeNull(); // No messages yet
    expect(subject).toBeUndefined(); // No subject set initially
    
    unsubMessages();
    unsubStatus();
    unsubLatest();
    unsubSubject();
  });

  it('should handle real-time updates', async () => {
    await initializeSigning(nostr);
    
    const conversation = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    
    // Track reactive updates
    const updates: any[] = [];
    conversation.messages.subscribe(messages => {
      updates.push({ type: 'messages', data: messages });
    });
    
    conversation.status.subscribe(status => {
      updates.push({ type: 'status', data: status });
    });
    
    // Should have initial updates
    expect(updates.length).toBeGreaterThan(0);
  });
});

describe('NIP-17 Room Support', () => {
  let nostr: NostrUnchained;

  const initializeSigning = async (nostrInstance: NostrUnchained) => {
    try {
      await nostrInstance.publish('test message');
    } catch {
      // Publishing might fail but signing should be initialized
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    nostr = new NostrUnchained({ debug: true });
  });

  it('should create multi-participant rooms', async () => {
    await initializeSigning(nostr);
    
    const participants = [
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
    ];
    
    const room = nostr.dm.room(participants, { subject: 'Team Meeting' });
    
    expect(room).toBeDefined();
    expect(typeof room.send).toBe('function');
    expect(typeof room.updateSubject).toBe('function');
    expect(typeof room.addParticipant).toBe('function');
    expect(typeof room.removeParticipant).toBe('function');
  });

  it('should provide reactive room interface', async () => {
    await initializeSigning(nostr);
    
    const participants = [
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    ];
    
    const room = nostr.dm.room(participants, { subject: 'Test Room' });
    
    // Test reactive properties
    expect(room.messages).toBeDefined();
    expect(room.status).toBeDefined();
    expect(room.latest).toBeDefined();
    expect(room.subject).toBeDefined();
    expect(room.participants).toBeDefined();
    
    // Test subscription interface
    let messages: DMMessage[] = [];
    let subject = '';
    let participants_list: string[] = [];
    
    const unsubMessages = room.messages.subscribe(m => { messages = m; });
    const unsubSubject = room.subject.subscribe(s => { subject = s; });
    const unsubParticipants = room.participants.subscribe(p => { participants_list = p; });
    
    expect(Array.isArray(messages)).toBe(true);
    expect(subject).toBe('Test Room');
    expect(Array.isArray(participants_list)).toBe(true);
    expect(participants_list.length).toBeGreaterThan(0); // Should include sender
    
    unsubMessages();
    unsubSubject();
    unsubParticipants();
  });

  it('should handle subject updates', async () => {
    await initializeSigning(nostr);
    
    const participants = [
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    ];
    
    const room = nostr.dm.room(participants, { subject: 'Old Subject' });
    
    // Track subject changes
    let currentSubject = '';
    room.subject.subscribe(subject => {
      currentSubject = subject;
    });
    
    expect(currentSubject).toBe('Old Subject');
    
    // Update subject
    const result = await room.updateSubject('New Subject');
    expect(result.success).toBe(true);
    expect(currentSubject).toBe('New Subject');
  });

  it('should return same room instance for same participants', async () => {
    await initializeSigning(nostr);
    
    const participants = [
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
    ];
    
    const room1 = nostr.dm.room(participants, { subject: 'Meeting' });
    const room2 = nostr.dm.room(participants, { subject: 'Different Subject' });
    
    // Should return same instance regardless of options
    expect(room1).toBe(room2);
  });
});

describe('NIP-17 Clean API (No Unread Spam)', () => {
  let nostr: NostrUnchained;

  const initializeSigning = async (nostrInstance: NostrUnchained) => {
    try {
      await nostrInstance.publish('test message');
    } catch {
      // Publishing might fail but signing should be initialized
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    nostr = new NostrUnchained({ debug: true });
  });

  it('should not expose unread count properties', async () => {
    await initializeSigning(nostr);
    
    const conversation = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    
    // These should NOT exist (unread spam)
    expect((conversation as any).unreadCount).toBeUndefined();
    expect((conversation as any).markAsRead).toBeUndefined();
    expect((conversation as any).markAllAsRead).toBeUndefined();
    expect((nostr.dm as any).inboxCount).toBeUndefined();
    expect((nostr.dm as any).getTotalUnreadCount).toBeUndefined();
    expect((nostr.dm as any).markAllAsRead).toBeUndefined();
  });

  it('should provide clean conversation summaries without unread spam', async () => {
    await initializeSigning(nostr);
    
    // Create some conversations
    const conversation1 = nostr.dm.with('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    const room1 = nostr.dm.room(['fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'], { subject: 'Test Room' });
    
    const summaries = nostr.dm.getConversations();
    
    // Should have summaries
    expect(Array.isArray(summaries)).toBe(true);
    
    // Check that summaries don't have unread properties
    summaries.forEach(summary => {
      expect((summary as any).unreadCount).toBeUndefined();
      expect(summary.type).toBeDefined();
      expect(['conversation', 'room'].includes(summary.type)).toBe(true);
      
      if (summary.type === 'room') {
        expect(summary.subject).toBeDefined();
        expect(Array.isArray(summary.participants)).toBe(true);
      }
    });
  });
});