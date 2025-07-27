/**
 * ProfileManager Unit Tests
 * Session 4 Phase 1: Profile Management (NIP-01 Kind 0)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfileManager } from '../../src/social/profiles/ProfileManager.js';
import type { ProfileManagerConfig, UserProfile, ProfileCreateRequest, ProfileUpdate } from '../../src/social/types/profile-types.js';

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
  build: vi.fn()
};

describe('ProfileManager', () => {
  let profileManager: ProfileManager;
  let config: ProfileManagerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      subscriptionManager: mockSubscriptionManager as any,
      relayManager: mockRelayManager as any,
      signingProvider: mockSigningProvider as any,
      eventBuilder: mockEventBuilder as any,
      debug: false
    };

    profileManager = new ProfileManager(config);
  });

  afterEach(async () => {
    await profileManager.close();
  });

  describe('Profile Creation', () => {
    it('should create a new user profile successfully', async () => {
      // Setup mocks
      const testPubkey = 'test-pubkey-123';
      const testEventId = 'test-event-456';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: testEventId,
        kind: 0,
        content: '{"name":"Alice","about":"Test user"}',
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'test-signature'
      });
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      const profileData: ProfileCreateRequest = {
        name: 'Alice',
        about: 'Test user',
        picture: 'https://example.com/avatar.jpg'
      };

      // Execute
      const result = await profileManager.create(profileData);

      // Verify
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(testEventId);
      expect(result.profile).toBeDefined();
      expect(result.profile!.pubkey).toBe(testPubkey);
      expect(result.profile!.metadata.name).toBe('Alice');
      expect(result.profile!.isOwn).toBe(true);

      // Verify event builder was called correctly
      expect(mockEventBuilder.kind).toHaveBeenCalledWith(0);
      expect(mockEventBuilder.content).toHaveBeenCalledWith(JSON.stringify(profileData));
      expect(mockEventBuilder.build).toHaveBeenCalled();

      // Verify relay publish
      expect(mockRelayManager.publishToAll).toHaveBeenCalled();
    });

    it('should fail profile creation without signing provider', async () => {
      // Create ProfileManager without signing provider
      const configWithoutSigner: ProfileManagerConfig = {
        ...config,
        signingProvider: undefined as any
      };
      
      const profileManagerNoSigner = new ProfileManager(configWithoutSigner);

      const profileData: ProfileCreateRequest = {
        name: 'Alice'
      };

      // Execute
      const result = await profileManagerNoSigner.create(profileData);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('No signing provider');

      await profileManagerNoSigner.close();
    });

    it('should validate profile data before creation', async () => {
      mockSigningProvider.getPublicKey.mockResolvedValue('test-pubkey');
      
      const invalidProfileData: ProfileCreateRequest = {
        name: 'Alice',
        picture: 'invalid-url',  // Invalid URL
        website: 'also-invalid'  // Invalid URL
      };

      // Execute
      const result = await profileManager.create(invalidProfileData);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
      expect(mockEventBuilder.build).not.toHaveBeenCalled();
    });
  });

  describe('Profile Updates', () => {
    it('should update existing profile', async () => {
      const testPubkey = 'test-pubkey-123';
      
      // Mock existing profile
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock get existing profile (simulate no existing profile for simplicity)
      vi.spyOn(profileManager, 'getMine').mockResolvedValue(null);
      
      const updates: ProfileUpdate = {
        name: 'Alice Updated',
        about: 'Updated bio'
      };

      // Should treat as create since no existing profile
      mockEventBuilder.build.mockResolvedValue({
        id: 'update-event-id',
        kind: 0,
        content: JSON.stringify(updates),
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'test-signature'
      });
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      // Execute
      const result = await profileManager.update(updates);

      // Verify - should succeed as create
      expect(result.success).toBe(true);
      expect(result.profile?.metadata.name).toBe('Alice Updated');
    });

    it('should merge updates with existing profile data', async () => {
      const testPubkey = 'test-pubkey-123';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      
      // Mock existing profile
      const existingProfile: UserProfile = {
        pubkey: testPubkey,
        metadata: {
          name: 'Alice',
          about: 'Original bio',
          picture: 'https://example.com/old-avatar.jpg'
        },
        lastUpdated: Date.now() - 1000,
        isOwn: true
      };
      
      vi.spyOn(profileManager, 'getMine').mockResolvedValue(existingProfile);
      
      const updates: ProfileUpdate = {
        name: 'Alice Updated',
        website: 'https://alice.example.com'
      };

      mockEventBuilder.build.mockResolvedValue({
        id: 'merge-event-id',
        kind: 0,
        content: JSON.stringify({
          ...existingProfile.metadata,
          ...updates
        }),
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'test-signature'
      });
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      // Execute
      const result = await profileManager.update(updates);

      // Verify
      expect(result.success).toBe(true);
      expect(result.profile?.metadata.name).toBe('Alice Updated');
      expect(result.profile?.metadata.about).toBe('Original bio'); // Preserved
      expect(result.profile?.metadata.picture).toBe('https://example.com/old-avatar.jpg'); // Preserved
      expect(result.profile?.metadata.website).toBe('https://alice.example.com'); // Added
    });
  });

  describe('Profile Fetching', () => {
    it('should fetch profile by pubkey', async () => {
      const testPubkey = 'target-pubkey-789';
      
      // Mock subscription response
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        // Simulate receiving a profile event
        setTimeout(() => {
          const mockProfileEvent = {
            id: 'profile-event-id',
            kind: 0,
            content: JSON.stringify({
              name: 'Bob',
              about: 'Test user Bob'
            }),
            pubkey: testPubkey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            sig: 'test-signature'
          };
          options.onEvent(mockProfileEvent);
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const profile = await profileManager.get(testPubkey);

      // Verify
      expect(profile).toBeDefined();
      expect(profile!.pubkey).toBe(testPubkey);
      expect(profile!.metadata.name).toBe('Bob');
      expect(profile!.metadata.about).toBe('Test user Bob');
      expect(profile!.isOwn).toBe(false);

      // Verify subscription was created with correct filter
      expect(mockSubscriptionManager.subscribe).toHaveBeenCalledWith(
        [{ kinds: [0], authors: [testPubkey], limit: 1 }],
        expect.any(Object)
      );
    });

    it('should return null for non-existent profile', async () => {
      const testPubkey = 'non-existent-pubkey';
      
      // Mock subscription that receives EOSE without events
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          options.onEose();
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute
      const profile = await profileManager.get(testPubkey);

      // Verify
      expect(profile).toBeNull();
    });

    it('should use cache when available', async () => {
      const testPubkey = 'cached-pubkey';
      
      // First call - should subscribe
      mockSubscriptionManager.subscribe.mockImplementation((filters, options) => {
        setTimeout(() => {
          const mockProfileEvent = {
            id: 'profile-event-id',
            kind: 0,
            content: JSON.stringify({ name: 'Cached User' }),
            pubkey: testPubkey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            sig: 'test-signature'
          };
          options.onEvent(mockProfileEvent);
        }, 10);
        
        return Promise.resolve({ success: true });
      });

      // Execute first call to populate cache
      const profile1 = await profileManager.get(testPubkey);
      expect(profile1).toBeDefined();
      
      // Clear mock to test cache usage
      mockSubscriptionManager.subscribe.mockClear();

      // Execute second call - should use cache
      const profile2 = await profileManager.get(testPubkey, { useCache: true });
      expect(profile2).toBeDefined();
      expect(profile2!.metadata.name).toBe('Cached User');
      expect(mockSubscriptionManager.subscribe).not.toHaveBeenCalled(); // Should not subscribe again
    });
  });

  describe('Reactive Updates', () => {
    it('should provide reactive profile updates via mine store', (done) => {
      const testPubkey = 'reactive-pubkey';
      
      mockSigningProvider.getPublicKey.mockResolvedValue(testPubkey);
      mockEventBuilder.build.mockResolvedValue({
        id: 'reactive-event-id',
        kind: 0,
        content: JSON.stringify({ name: 'Reactive Alice' }),
        pubkey: testPubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        sig: 'test-signature'
      });
      mockRelayManager.publishToAll.mockResolvedValue([
        { success: true, relay: 'wss://test-relay.com' }
      ]);

      // Subscribe to reactive updates
      let updateCount = 0;
      const unsubscribe = profileManager.mine.subscribe((profile) => {
        updateCount++;
        
        if (updateCount === 1) {
          // First update should be null (initial state)
          expect(profile).toBeNull();
        } else if (updateCount === 2) {
          // Second update should be the created profile
          expect(profile).toBeDefined();
          expect(profile!.metadata.name).toBe('Reactive Alice');
          expect(profile!.isOwn).toBe(true);
          
          unsubscribe();
          done();
        }
      });

      // Trigger profile creation to test reactive update
      profileManager.create({ name: 'Reactive Alice' });
    });
  });

  describe('Cleanup', () => {
    it('should close all subscriptions and clear cache', async () => {
      // Setup some state
      await profileManager.get('test-pubkey');
      
      // Execute cleanup
      await profileManager.close();

      // Verify cleanup was called
      expect(mockSubscriptionManager.close).toHaveBeenCalled();
    });
  });
});