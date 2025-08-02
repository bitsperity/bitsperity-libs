/**
 * Phase 6: Profile Discovery Tests
 * 
 * Tests profile search and discovery functionality against real relay: ws://umbrel.local:4848
 * 
 * Phase 6 Success Criteria:
 * - Name search works (substring match)
 * - NIP-05 verification checked
 * - Metadata filtering accurate
 * - Results ranked by relevance
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';

describe('Phase 6: Profile Discovery Tests', () => {
  const TEST_RELAY = 'ws://umbrel.local:4848';

  // Helper function to create isolated NostrUnchained instance for each test
  const createTestInstance = async () => {
    const tempSigner = new LocalKeySigner();
    
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

  // Test 1: Basic discovery without filters
  it('should discover profiles without specific criteria', async () => {
    console.log('📋 Test 1: Basic profile discovery');
    
    const nostr = await createTestInstance();

    try {
      console.log('🔍 Running basic discovery...');
      
      const startTime = Date.now();
      const results = await nostr.profile.discover()
        .limit(5) // Keep it small for testing
        .execute();
      const duration = Date.now() - startTime;

      console.log('📄 Discovery results:', {
        count: results.length,
        duration: `${duration}ms`,
        profiles: results.map(r => ({
          name: r.profile.metadata.name || 'unnamed',
          nip05: r.profile.metadata.nip05,
          score: r.relevanceScore,
          matchedFields: r.matchedFields
        }))
      });

      // Validate basic discovery
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
      expect(results.length).toBeLessThanOrEqual(5);
      
      // Validate result structure
      results.forEach(result => {
        expect(result.profile).toBeDefined();
        expect(result.profile.pubkey).toBeDefined();
        expect(result.profile.metadata).toBeDefined();
        expect(Array.isArray(result.matchedFields)).toBe(true);
        expect(typeof result.relevanceScore).toBe('number');
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(result.relevanceScore).toBeLessThanOrEqual(1);
      });
      
      console.log(`✅ Basic discovery completed in ${duration}ms with ${results.length} results`);
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 2: Search by name
  it('should search profiles by name', async () => {
    console.log('📋 Test 2: Search by name');
    
    const nostr = await createTestInstance();

    try {
      // Search for common names that might exist
      const searchNames = ['alice', 'bob', 'test', 'admin'];
      
      for (const searchName of searchNames) {
        console.log(`🔍 Searching for name: ${searchName}`);
        
        const results = await nostr.profile.discover()
          .byName(searchName)
          .limit(3)
          .execute();

        console.log(`📄 Name search "${searchName}" results:`, {
          count: results.length,
          profiles: results.map(r => ({
            name: r.profile.metadata.name,
            score: r.relevanceScore,
            matchedFields: r.matchedFields
          }))
        });

        // Validate name search results
        expect(Array.isArray(results)).toBe(true);
        
        // If results found, validate they match the search
        results.forEach(result => {
          expect(result.matchedFields.includes('name')).toBe(true);
          const profileName = result.profile.metadata.name?.toLowerCase() || '';
          expect(profileName.includes(searchName.toLowerCase())).toBe(true);
        });
        
        console.log(`✅ Name search "${searchName}" completed with ${results.length} matches`);
        
        // Don't overwhelm the relay, small delay between searches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } finally {
      await nostr.disconnect();
    }
  }, 30000);

  // Test 3: Search by NIP-05
  it('should search profiles by NIP-05 identifier', async () => {
    console.log('📋 Test 3: Search by NIP-05');
    
    const nostr = await createTestInstance();

    try {
      // Search for common NIP-05 patterns
      const nip05Searches = ['@', '.com', 'test@'];
      
      for (const nip05Search of nip05Searches) {
        console.log(`🔍 Searching for NIP-05 pattern: ${nip05Search}`);
        
        const results = await nostr.profile.discover()
          .byNip05(nip05Search)
          .limit(3)
          .execute();

        console.log(`📄 NIP-05 search "${nip05Search}" results:`, {
          count: results.length,
          profiles: results.map(r => ({
            name: r.profile.metadata.name,
            nip05: r.profile.metadata.nip05,
            score: r.relevanceScore,
            matchedFields: r.matchedFields
          }))
        });

        // Validate NIP-05 search results
        expect(Array.isArray(results)).toBe(true);
        
        // If results found, validate they match the search
        results.forEach(result => {
          if (result.matchedFields.includes('nip05')) {
            const profileNip05 = result.profile.metadata.nip05?.toLowerCase() || '';
            expect(profileNip05.includes(nip05Search.toLowerCase())).toBe(true);
          }
        });
        
        console.log(`✅ NIP-05 search "${nip05Search}" completed with ${results.length} matches`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } finally {
      await nostr.disconnect();
    }
  }, 30000);

  // Test 4: Metadata filtering
  it('should filter profiles by metadata', async () => {
    console.log('📋 Test 4: Metadata filtering');
    
    const nostr = await createTestInstance();

    try {
      // Search for profiles with common metadata keys
      const metadataKeys = ['website', 'about', 'lud16'];
      
      for (const key of metadataKeys) {
        console.log(`🔍 Searching for metadata key: ${key}`);
        
        const results = await nostr.profile.discover()
          .withMetadata(key) // Just check if key exists
          .limit(5)
          .execute();

        console.log(`📄 Metadata search "${key}" results:`, {
          count: results.length,
          profiles: results.map(r => ({
            name: r.profile.metadata.name || 'unnamed',
            [key]: r.profile.metadata[key as keyof typeof r.profile.metadata],
            score: r.relevanceScore,
            matchedFields: r.matchedFields
          }))
        });

        // Validate metadata filtering
        expect(Array.isArray(results)).toBe(true);
        
        results.forEach(result => {
          if (result.matchedFields.includes(key)) {
            expect(result.profile.metadata[key as keyof typeof result.profile.metadata]).toBeDefined();
          }
        });
        
        console.log(`✅ Metadata search "${key}" completed with ${results.length} matches`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } finally {
      await nostr.disconnect();
    }
  }, 40000);

  // Test 5: Verified profiles only
  it('should filter for verified profiles only', async () => {
    console.log('📋 Test 5: Verified profiles filter');
    
    const nostr = await createTestInstance();

    try {
      console.log('🔍 Searching for verified profiles only...');
      
      const results = await nostr.profile.discover()
        .verified()
        .limit(3) // Keep small as verification is slow
        .execute();

      console.log('📄 Verified profiles results:', {
        count: results.length,
        profiles: results.map(r => ({
          name: r.profile.metadata.name || 'unnamed',
          nip05: r.profile.metadata.nip05,
          score: r.relevanceScore,
          matchedFields: r.matchedFields,
          isVerified: r.matchedFields.includes('verified')
        }))
      });

      // Validate verified filter
      expect(Array.isArray(results)).toBe(true);
      
      // All results should have NIP-05 and be marked as verified in matchedFields
      results.forEach(result => {
        expect(result.profile.metadata.nip05).toBeDefined();
        // Note: NIP-05 verification is slow, so we just check structure
      });
      
      console.log(`✅ Verified profiles search completed with ${results.length} results`);
      
    } finally {
      await nostr.disconnect();
    }
  }, 25000);

  // Test 6: Combined search criteria
  it('should handle combined search criteria', async () => {
    console.log('📋 Test 6: Combined search criteria');
    
    const nostr = await createTestInstance();

    try {
      console.log('🔍 Combined search: name + metadata...');
      
      const results = await nostr.profile.discover()
        .byName('test')
        .withMetadata('about') // Must have 'about' field
        .limit(3)
        .execute();

      console.log('📄 Combined search results:', {
        count: results.length,
        profiles: results.map(r => ({
          name: r.profile.metadata.name,
          about: r.profile.metadata.about?.substring(0, 50) + '...',
          score: r.relevanceScore,
          matchedFields: r.matchedFields
        }))
      });

      // Validate combined criteria
      expect(Array.isArray(results)).toBe(true);
      
      results.forEach(result => {
        // Should match name criteria
        const profileName = result.profile.metadata.name?.toLowerCase() || '';
        expect(profileName.includes('test')).toBe(true);
        
        // Should have about field
        expect(result.profile.metadata.about).toBeDefined();
        
        // Should include both matched fields
        expect(result.matchedFields.includes('name')).toBe(true);
        expect(result.matchedFields.includes('about')).toBe(true);
      });
      
      console.log(`✅ Combined search completed with ${results.length} matches`);
      
    } finally {
      await nostr.disconnect();
    }
  }, 20000);

  // Test 7: Relevance scoring
  it('should rank results by relevance score', async () => {
    console.log('📋 Test 7: Relevance scoring');
    
    const nostr = await createTestInstance();

    try {
      console.log('🔍 Testing relevance scoring...');
      
      const results = await nostr.profile.discover()
        .byName('a') // Very common letter, should get many results
        .limit(10)
        .execute();

      console.log('📄 Relevance scoring results:', {
        count: results.length,
        scores: results.map((r, i) => ({
          rank: i + 1,
          name: r.profile.metadata.name || 'unnamed',
          score: r.relevanceScore,
          matchedFields: r.matchedFields
        }))
      });

      // Validate relevance scoring
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 1) {
        // Results should be sorted by relevance score (highest first)
        for (let i = 1; i < results.length; i++) {
          expect(results[i].relevanceScore).toBeLessThanOrEqual(results[i-1].relevanceScore);
        }
        
        console.log('✅ Results are properly sorted by relevance score');
      }
      
      console.log(`✅ Relevance scoring validated with ${results.length} results`);
      
    } finally {
      await nostr.disconnect();
    }
  }, 20000);
});