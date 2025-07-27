/**
 * ContactManager Unit Tests
 * Session 4 Phase 2: Contact Management (NIP-02 Kind 3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContactManager } from '../../src/social/contacts/ContactManager.js';
import type { ContactManagerConfig, ContactList, FollowRequest, UnfollowRequest } from '../../src/social/types/contact-types.js';

// Mock dependencies
const mockSubscriptionManager = {
  subscribe: vi.fn(),
  close: vi.fn()
};

const mockRelayManager = {
  publishToAll: vi.fn()
};

const mockSigningProvider = {
  getPublicKey: vi.fn(),
  signEvent: vi.fn()
};

const mockEventBuilder = {
  kind: vi.fn().mockReturnThis(),
  content: vi.fn().mockReturnThis(),
  tags: vi.fn().mockReturnThis(),
  build: vi.fn()
};

describe('ContactManager', () => {
  let contactManager: ContactManager;
  let config: ContactManagerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      signingProvider: mockSigningProvider as any,
      eventBuilder: mockEventBuilder as any,
      debug: false
    };

    contactManager = new ContactManager(config);
  });

  afterEach(async () => {
    await contactManager.close();
  });

  describe('Follow Management', () => {
    it('should follow a new contact successfully', async () => {
      // Setup mocks
      const testPubkey = 'test-pubkey-123';
      const targetPubkey = 'target-pubkey-456';
      const testEventId = 'contact-event-789';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock empty existing contact list
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(null);
      
      mockEventBuilder.build.mockResolvedValue({
        id: testEventId,
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', targetPubkey, 'wss://test-relay.com', 'Alice']],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: testEventId,
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', targetPubkey, 'wss://test-relay.com', 'Alice']],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const followRequest: FollowRequest = {
        pubkey: targetPubkey,
        relayUrl: 'wss://test-relay.com',
        petname: 'Alice'
      };

      // Execute
      const result = await contactManager.follow(followRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(testEventId);
      expect(result.contactList).toBeDefined();
      expect(result.contactList!.contacts).toHaveLength(1);
      expect(result.contactList!.contacts[0].pubkey).toBe(targetPubkey);
      expect(result.contactList!.contacts[0].relayUrl).toBe('wss://test-relay.com');
      expect(result.contactList!.contacts[0].petname).toBe('Alice');

      // Verify event builder was called correctly
      expect(mockEventBuilder.kind).toHaveBeenCalledWith(3);
      expect(mockEventBuilder.content).toHaveBeenCalledWith('');
      expect(mockEventBuilder.tags).toHaveBeenCalledWith([['p', targetPubkey, 'wss://test-relay.com', 'Alice']]);
      expect(mockEventBuilder.build).toHaveBeenCalled();

      // Verify relay publish
      expect(mockRelayManager.publishToAll).toHaveBeenCalled();
    });

    it('should fail follow without signing provider', async () => {
      // Create ContactManager without signing provider
      const configWithoutSigner: ContactManagerConfig = {
        ...config,
        signingProvider: undefined as any
      };
      
      const contactManagerNoSigner = new ContactManager(configWithoutSigner);

      const followRequest: FollowRequest = {
        pubkey: 'target-pubkey'
      };

      // Execute
      const result = await contactManagerNoSigner.follow(followRequest);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('No signing provider');

      await contactManagerNoSigner.close();
    });

    it('should update existing contact when following again', async () => {
      const testPubkey = 'test-pubkey-123';
      const targetPubkey = 'target-pubkey-456';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock existing contact list with the target already followed
      const existingContactList: ContactList = {
        contacts: [
          { pubkey: targetPubkey, relayUrl: 'wss://old-relay.com', petname: 'OldName' }
        ],
        ownerPubkey: testPubkey,
        lastUpdated: Date.now() - 1000,
        isOwn: true
      };
      
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(existingContactList);
      
      mockEventBuilder.build.mockResolvedValue({
        id: 'update-event-id',
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', targetPubkey, 'wss://new-relay.com', 'NewName']],
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: 'update-event-id',
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', targetPubkey, 'wss://new-relay.com', 'NewName']],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const followRequest: FollowRequest = {
        pubkey: targetPubkey,
        relayUrl: 'wss://new-relay.com',
        petname: 'NewName'
      };

      // Execute
      const result = await contactManager.follow(followRequest);

      // Verify - should update existing contact, not add new one
      expect(result.success).toBe(true);
      expect(result.contactList!.contacts).toHaveLength(1);
      expect(result.contactList!.contacts[0].relayUrl).toBe('wss://new-relay.com');
      expect(result.contactList!.contacts[0].petname).toBe('NewName');
    });
  });

  describe('Unfollow Management', () => {
    it('should unfollow contact successfully', async () => {
      const testPubkey = 'test-pubkey-123';
      const targetPubkey = 'target-pubkey-456';
      const keepPubkey = 'keep-pubkey-789';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock existing contact list with multiple contacts
      const existingContactList: ContactList = {
        contacts: [
          { pubkey: targetPubkey, relayUrl: 'wss://test-relay.com', petname: 'Alice' },
          { pubkey: keepPubkey, relayUrl: 'wss://test-relay.com', petname: 'Bob' }
        ],
        ownerPubkey: testPubkey,
        lastUpdated: Date.now() - 1000,
        isOwn: true
      };
      
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(existingContactList);
      
      mockEventBuilder.build.mockResolvedValue({
        id: 'unfollow-event-id',
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', keepPubkey, 'wss://test-relay.com', 'Bob']], // Only Bob remains
        sig: 'test-signature'
      });
      
      mockSigningProvider.signEvent.mockResolvedValue({
        id: 'unfollow-event-id',
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', keepPubkey, 'wss://test-relay.com', 'Bob']],
        sig: 'test-signature'
      });
      
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const unfollowRequest: UnfollowRequest = {
        pubkey: targetPubkey
      };

      // Execute
      const result = await contactManager.unfollow(unfollowRequest);

      // Verify
      expect(result.success).toBe(true);
      expect(result.contactList!.contacts).toHaveLength(1);
      expect(result.contactList!.contacts[0].pubkey).toBe(keepPubkey);
      expect(result.contactList!.contacts.find(c => c.pubkey === targetPubkey)).toBeUndefined();
    });

    it('should fail unfollow for non-existent contact', async () => {
      const testPubkey = 'test-pubkey-123';
      const targetPubkey = 'target-pubkey-456';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock existing contact list without target
      const existingContactList: ContactList = {
        contacts: [
          { pubkey: 'other-pubkey-789', relayUrl: 'wss://test-relay.com', petname: 'Bob' }
        ],
        ownerPubkey: testPubkey,
        lastUpdated: Date.now() - 1000,
        isOwn: true
      };
      
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(existingContactList);

      const unfollowRequest: UnfollowRequest = {
        pubkey: targetPubkey
      };

      // Execute
      const result = await contactManager.unfollow(unfollowRequest);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('Contact not found');
    });
  });

  describe('Contact List Fetching', () => {
    it('should fetch contact list by pubkey', async () => {
      const testPubkey = 'target-pubkey-789';
      
      // Mock subscription response
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        // Simulate receiving a contact list event
        setTimeout(() => {
          const mockContactEvent = {
            id: 'contact-event-id',
            kind: 3,
            content: '',
            pubkey: testPubkey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
              ['p', 'contact1-pubkey', 'wss://relay1.com', 'Alice'],
              ['p', 'contact2-pubkey', 'wss://relay2.com', 'Bob'],
              ['p', 'contact3-pubkey'] // No relay or petname
            ],
            sig: 'test-signature'
          };
          options.onEvent(mockContactEvent);
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const contactList = await contactManager.get(testPubkey);

      // Verify
      expect(contactList).toBeDefined();
      expect(contactList!.ownerPubkey).toBe(testPubkey);
      expect(contactList!.contacts).toHaveLength(3);
      
      expect(contactList!.contacts[0].pubkey).toBe('contact1-pubkey');
      expect(contactList!.contacts[0].relayUrl).toBe('wss://relay1.com');
      expect(contactList!.contacts[0].petname).toBe('Alice');
      
      expect(contactList!.contacts[1].pubkey).toBe('contact2-pubkey');
      expect(contactList!.contacts[1].relayUrl).toBe('wss://relay2.com');
      expect(contactList!.contacts[1].petname).toBe('Bob');
      
      expect(contactList!.contacts[2].pubkey).toBe('contact3-pubkey');
      expect(contactList!.contacts[2].relayUrl).toBeUndefined();
      expect(contactList!.contacts[2].petname).toBeUndefined();

      expect(contactList!.isOwn).toBe(false);

      // Verify subscription was created with correct filter
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [{ kinds: [3], authors: [testPubkey], limit: 1 }],
        expect.any(Object)
      );
    });

    it('should return null for non-existent contact list', async () => {
      const testPubkey = 'non-existent-pubkey';
      
      // Mock subscription that receives EOSE without events
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const contactList = await contactManager.get(testPubkey);

      // Verify
      expect(contactList).toBeNull();
    });

    it('should use cache when available', async () => {
      const testPubkey = 'cached-pubkey';
      
      // First call - should subscribe
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          const mockContactEvent = {
            id: 'contact-event-id',
            kind: 3,
            content: '',
            pubkey: testPubkey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [['p', 'cached-contact', 'wss://cached-relay.com', 'CachedUser']],
            sig: 'test-signature'
          };
          options.onEvent(mockContactEvent);
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute first call to populate cache
      const contactList1 = await contactManager.get(testPubkey);
      expect(contactList1).toBeDefined();
      
      // Clear mock to test cache usage
      mockSubscriptionManager.subscribe.mockClear();

      // Execute second call - should use cache
      const contactList2 = await contactManager.get(testPubkey, { useCache: true });
      expect(contactList2).toBeDefined();
      expect(contactList2!.contacts[0].petname).toBe('CachedUser');
      expect(mockSubscriptionManager.subscribe).not.toHaveBeenCalled(); // Should not subscribe again
    });
  });

  describe('Helper Methods', () => {
    it('should check if following a specific pubkey', async () => {
      const testPubkey = 'test-pubkey-123';
      const targetPubkey = 'target-pubkey-456';
      
      // Mock contact list with target
      const contactList: ContactList = {
        contacts: [
          { pubkey: targetPubkey, relayUrl: 'wss://test-relay.com', petname: 'Alice' },
          { pubkey: 'other-pubkey', relayUrl: 'wss://test-relay.com', petname: 'Bob' }
        ],
        ownerPubkey: testPubkey,
        lastUpdated: Date.now(),
        isOwn: true
      };
      
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(contactList);

      // Execute
      const isFollowing = await contactManager.isFollowing(targetPubkey);
      const isNotFollowing = await contactManager.isFollowing('unknown-pubkey');

      // Verify
      expect(isFollowing).toBe(true);
      expect(isNotFollowing).toBe(false);
    });

    it('should get list of following pubkeys', async () => {
      const testPubkey = 'test-pubkey-123';
      
      // Mock contact list
      const contactList: ContactList = {
        contacts: [
          { pubkey: 'pubkey1', relayUrl: 'wss://test-relay.com', petname: 'Alice' },
          { pubkey: 'pubkey2', relayUrl: 'wss://test-relay.com', petname: 'Bob' },
          { pubkey: 'pubkey3' }
        ],
        ownerPubkey: testPubkey,
        lastUpdated: Date.now(),
        isOwn: true
      };
      
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(contactList);

      // Execute
      const following = await contactManager.getFollowing();

      // Verify
      expect(following).toEqual(['pubkey1', 'pubkey2', 'pubkey3']);
    });
  });

  describe('Reactive Updates', () => {
    it('should provide reactive contact updates via mine store', (done) => {
      const testPubkey = 'reactive-pubkey';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: 'reactive-event-id',
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', 'new-contact', 'wss://test-relay.com', 'ReactiveUser']],
        sig: 'test-signature'
      });
      mockSigningProvider.signEvent.mockResolvedValue({
        id: 'reactive-event-id',
        kind: 3,
        content: '',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', 'new-contact', 'wss://test-relay.com', 'ReactiveUser']],
        sig: 'test-signature'
      });
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      // Mock empty existing contact list
      vi.spyOn(contactManager, 'getMine').mockResolvedValue(null);

      // Subscribe to reactive updates
      let updateCount = 0;
      const unsubscribe = contactManager.mine.subscribe((contactList) => {
        updateCount++;
        
        if (updateCount === 1) {
          // First update should be null (initial state)
          expect(contactList).toBeNull();
        } else if (updateCount === 2) {
          // Second update should be the new contact list
          expect(contactList).toBeDefined();
          expect(contactList!.contacts).toHaveLength(1);
          expect(contactList!.contacts[0].petname).toBe('ReactiveUser');
          expect(contactList!.isOwn).toBe(true);
          
          unsubscribe();
          done();
        }
      });

      // Trigger contact follow to test reactive update
      contactManager.follow({ pubkey: 'new-contact', relayUrl: 'wss://test-relay.com', petname: 'ReactiveUser' });
    });
  });

  describe('Cleanup', () => {
    it('should close all subscriptions and clear cache', async () => {
      // Setup some state
      await contactManager.get('test-pubkey');
      
      // Execute cleanup
      await contactManager.close();

      // Verify cleanup was called
      expect(mockSubscriptionManager.close).toHaveBeenCalled();
    });
  });
});