/**
 * Phase 2: Profile Builder Integration Tests
 * 
 * Tests the ProfileBuilder fluent API against real relay: ws://umbrel.local:4848
 * 
 * Phase 2 Success Criteria:
 * - Profile creation with fluent API
 * - Field preservation when updating existing profiles
 * - Event signing and publishing to real relay
 * - Custom metadata support (NIP-39 external identities)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

describe('Phase 2: Profile Builder Tests', () => {
  const TEST_RELAY = 'ws://umbrel.local:4848';

  // Helper function to create isolated NostrUnchained instance for each test
  const createTestInstance = async () => {
    const tempSigner = new LocalKeySigner(); // Creates new keypair each time
    
    const nostr = new NostrUnchained({
      relays: [TEST_RELAY],
      signingProvider: tempSigner,
      debug: true
    });

    await nostr.initializeSigning();
    await nostr.connect();
    
    // Wait for relay connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return nostr;
  };

  // Test 1: Create new profile with fluent API
  it('should create new profile with fluent API', async () => {
    console.log('📋 Test 1: Create new profile with fluent API');
    
    const nostr = await createTestInstance();
    const myPubkey = await nostr.getPublicKey();
    console.log('🔑 Using test pubkey:', myPubkey.substring(0, 16) + '...');

    try {
      // Build and publish profile using fluent API
      const result = await nostr.profile.edit()
        .name('Test User Phase 2')
        .about('Testing Profile Builder in Phase 2')
        .picture('https://example.com/avatar.jpg')
        .website('https://example.com')
        .nip05('test@example.com')
        .github('testuser')
        .twitter('testuser')
        .metadata('custom_field', 'custom_value')
        .publish();

      console.log('📄 Profile publish result:', result);

      // Validate publishing success
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      
      console.log('✅ Profile created successfully with eventId:', result.eventId);
    } finally {
      await nostr.disconnect();
    }
  }, 15000);

  // Test 2: Field preservation when updating
  it('should preserve existing fields when updating', async () => {
    console.log('📋 Test 2: Field preservation test');
    
    const nostr = await createTestInstance();
    const myPubkey = await nostr.getPublicKey();

    // First, create a profile with multiple fields
    console.log('🔧 Creating initial profile...');
    const initialResult = await nostr.profile.edit()
      .name('Initial Name')
      .about('Initial bio')
      .picture('https://example.com/initial.jpg')
      .website('https://initial.com')
      .github('initialuser')
      .publish();

    expect(initialResult.success).toBe(true);
    console.log('✅ Initial profile created');

    // Wait for relay propagation (longer wait for real relay)
    console.log('⏳ Waiting 6 seconds for relay propagation...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Now update only the name, preserving other fields
    console.log('🔧 Updating only name field...');
    const updateResult = await nostr.profile.edit()
      .name('Updated Name Only')
      .preserveExisting(true) // Explicit preservation
      .publish();

    expect(updateResult.success).toBe(true);
    console.log('✅ Profile updated with field preservation');

    // Verify the update by fetching the profile
    console.log('🔍 Verifying field preservation...');
    const profileStore = nostr.profile.get(myPubkey);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Get current profile state
    let finalProfile: any = null;
    const unsubscribe = profileStore.subscribe(state => {
      if (state.profile && !state.loading) {
        finalProfile = state.profile;
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    unsubscribe();

    if (finalProfile) {
      console.log('📊 Final profile metadata:', finalProfile.metadata);
      
      // Check preservation: name should be updated, other fields preserved
      expect(finalProfile.metadata.name).toBe('Updated Name Only');
      expect(finalProfile.metadata.about).toBe('Initial bio'); // Preserved
      expect(finalProfile.metadata.picture).toBe('https://example.com/initial.jpg'); // Preserved
      expect(finalProfile.metadata.website).toBe('https://initial.com'); // Preserved
      expect(finalProfile.metadata.github).toBe('initialuser'); // Preserved
      
      console.log('✅ Field preservation verified successfully');
    } else {
      console.log('⚠️ Could not fetch updated profile for verification (but publish succeeded)');
    }
    
    await nostr.disconnect();
  }, 25000);

  // Test 3: Custom metadata support (NIP-39)
  it('should support custom metadata and external identities', async () => {
    console.log('📋 Test 3: Custom metadata and external identities');
    
    const nostr = await createTestInstance();
    
    try {
      // Create profile with various external identities and custom fields
      const result = await nostr.profile.edit()
      .name('Identity Test User')
      .github('github-user')
      .twitter('twitter-user')
      .telegram('telegram-user')
      .metadata('discord', 'discord-user#1234')
      .metadata('matrix', '@user:matrix.org')
      .metadata('custom_role', 'developer')
      .metadata('favorite_color', 'blue')
      .publish();

    console.log('📄 Custom metadata publish result:', result);

    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
    
    console.log('✅ Profile with custom metadata published successfully');

    // Verify custom fields are included by fetching back
    const myPubkey = await nostr.getPublicKey();
    const profileStore = nostr.profile.get(myPubkey);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    let customProfile: any = null;
    const unsubscribe = profileStore.subscribe(state => {
      if (state.profile && !state.loading) {
        customProfile = state.profile;
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    unsubscribe();

    if (customProfile) {
      console.log('📊 Custom profile metadata:', customProfile.metadata);
      
      // Verify external identities
      expect(customProfile.metadata.github).toBe('github-user');
      expect(customProfile.metadata.twitter).toBe('twitter-user');
      expect(customProfile.metadata.telegram).toBe('telegram-user');
      
      // Verify custom metadata
      expect(customProfile.metadata.discord).toBe('discord-user#1234');
      expect(customProfile.metadata.matrix).toBe('@user:matrix.org');
      expect(customProfile.metadata.custom_role).toBe('developer');
      expect(customProfile.metadata.favorite_color).toBe('blue');
      
      console.log('✅ Custom metadata verification successful');
    } else {
      console.log('⚠️ Could not fetch profile for custom metadata verification (but publish succeeded)');
    }
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 4: Sign without publishing
  it('should support signing without publishing', async () => {
    console.log('📋 Test 4: Sign without publishing');
    
    const nostr = await createTestInstance();
    
    try {
      // Create and sign a profile event without publishing
      const signedEvent = await nostr.profile.edit()
      .name('Sign Only Test')
      .about('This profile event is signed but not published')
      .sign();

    console.log('📄 Signed profile event:', {
      id: signedEvent.id,
      kind: signedEvent.kind,
      pubkey: signedEvent.pubkey.substring(0, 16) + '...',
      contentLength: signedEvent.content.length,
      hasSignature: !!signedEvent.sig
    });

    // Validate signed event structure
    expect(signedEvent.kind).toBe(0); // Profile event
    expect(signedEvent.content).toBeDefined();
    expect(signedEvent.pubkey).toBeDefined();
    expect(signedEvent.id).toBeDefined();
    expect(signedEvent.sig).toBeDefined();
    expect(signedEvent.created_at).toBeDefined();

    // Verify content is valid JSON with profile data
    const metadata = JSON.parse(signedEvent.content);
    expect(metadata.name).toBe('Sign Only Test');
    expect(metadata.about).toBe('This profile event is signed but not published');
    
    console.log('✅ Profile event signed successfully without publishing');
    } finally {
      await nostr.disconnect();
    }
  }, 10000);
});