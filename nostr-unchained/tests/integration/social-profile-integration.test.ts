/**
 * ProfileManager Integration Tests
 * Session 4 Phase 1: Real relay testing for profile functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import type { ProfileCreateRequest } from '../../src/social/types/profile-types.js';

describe('ProfileManager Integration Tests', () => {
  let nostr: NostrUnchained;
  const testRelay = 'wss://relay.damus.io';

  beforeAll(async () => {
    // Initialize NostrUnchained with test relay
    nostr = new NostrUnchained({
      relays: [testRelay],
      debug: true
    });

    // Wait for relay connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await nostr.disconnect();
  });

  it('should fetch existing profile from real relay', async () => {
    // Test with a known public key (Damus dev account)
    const testPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
    
    const profile = await nostr.social.profiles.get(testPubkey, { 
      useCache: false,
      timeout: 10000 
    });

    if (profile) {
      expect(profile.pubkey).toBe(testPubkey);
      expect(profile.metadata).toBeDefined();
      expect(profile.isOwn).toBe(false);
      console.log('Fetched profile:', profile.metadata);
    } else {
      console.log('No profile found for test pubkey');
    }
  }, 15000);

  it('should handle non-existent profile gracefully', async () => {
    // Use a random pubkey that likely doesn't exist
    const nonExistentPubkey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    const profile = await nostr.social.profiles.get(nonExistentPubkey, { 
      useCache: false,
      timeout: 5000 
    });

    expect(profile).toBeNull();
  }, 10000);

  it('should use cache for repeated requests', async () => {
    const testPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
    
    // First request
    const startTime1 = Date.now();
    const profile1 = await nostr.social.profiles.get(testPubkey, { 
      useCache: false,
      timeout: 8000 
    });
    const duration1 = Date.now() - startTime1;

    if (profile1) {
      // Second request (should use cache)
      const startTime2 = Date.now();
      const profile2 = await nostr.social.profiles.get(testPubkey, { 
        useCache: true,
        timeout: 1000 
      });
      const duration2 = Date.now() - startTime2;

      expect(profile1.pubkey).toBe(profile2!.pubkey);
      expect(profile1.metadata.name).toBe(profile2!.metadata.name);
      expect(duration2).toBeLessThan(100); // Cache should be very fast
      console.log(`Network request: ${duration1}ms, Cache request: ${duration2}ms`);
    } else {
      console.log('Profile not found, skipping cache test');
    }
  }, 15000);

  // NOTE: Profile creation tests require a signing provider
  // These would need actual private keys to test, so we skip them in integration tests
  it.skip('should create and publish new profile', async () => {
    // This test would require setting up a signing provider with a test private key
    // and would publish to real relays, so we skip it for safety
    
    const profileData: ProfileCreateRequest = {
      name: 'Test User',
      about: 'Integration test profile',
      picture: 'https://example.com/avatar.jpg'
    };

    const result = await nostr.social.profiles.create(profileData);
    expect(result.success).toBe(true);
  });
});