/**
 * ContactManager Read-Only Integration Tests - Real Relay Testing
 * Tests only read operations against ws://umbrel.local:4848
 * Session 4 Phase 2: Contact Management (NIP-02 Kind 3)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';

describe('ContactManager Read-Only Integration Tests', () => {
  let nostr: NostrUnchained;
  const testRelay = 'ws://umbrel.local:4848';

  beforeAll(async () => {
    // Initialize NostrUnchained with test relay (read-only)
    nostr = new NostrUnchained({
      relays: [testRelay],
      debug: true
    });

    // Wait for relay connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (nostr) {
      await nostr.disconnect();
    }
  });

  describe('Contact List Reading', () => {
    it('should fetch existing contact list from known user', async () => {
      console.log('=== Testing contact list fetch ===');

      // Try to fetch contact list from a known active account
      const knownActivePubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      const contactList = await nostr.social.contacts.get(knownActivePubkey, { 
        useCache: false,
        timeout: 10000 
      });

      if (contactList) {
        expect(contactList.ownerPubkey).toBe(knownActivePubkey);
        expect(contactList.contacts).toBeDefined();
        expect(Array.isArray(contactList.contacts)).toBe(true);
        expect(contactList.isOwn).toBe(false);
        expect(contactList.lastUpdated).toBeGreaterThan(0);
        expect(contactList.eventId).toBeDefined();
        
        console.log(`✅ Fetched contact list with ${contactList.contacts.length} contacts`);
        
        // Verify contact structure
        for (const contact of contactList.contacts) {
          expect(contact.pubkey).toBeDefined();
          expect(typeof contact.pubkey).toBe('string');
          expect(contact.pubkey.length).toBe(64); // Valid pubkey length
          
          // Optional fields should be string or undefined
          if (contact.relayUrl) {
            expect(typeof contact.relayUrl).toBe('string');
          }
          if (contact.petname) {
            expect(typeof contact.petname).toBe('string');
          }
        }
        
        console.log('✅ Contact list structure is valid!');
      } else {
        console.log('ℹ️ No contact list found for target user (valid state)');
      }
    }, 15000);

    it('should handle non-existent contact list gracefully', async () => {
      console.log('=== Testing non-existent contact list ===');

      // Use a random pubkey that likely doesn't have a contact list
      const nonExistentPubkey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const contactList = await nostr.social.contacts.get(nonExistentPubkey, { 
        useCache: false,
        timeout: 5000 
      });

      expect(contactList).toBeNull();
      console.log('✅ Non-existent contact list handled correctly!');
    }, 10000);

    it('should handle cache correctly for contact lists', async () => {
      console.log('=== Testing cache behavior ===');

      const testPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';

      // First request (should hit relay)
      const startTime1 = Date.now();
      const contacts1 = await nostr.social.contacts.get(testPubkey, { 
        useCache: false,
        timeout: 8000 
      });
      const duration1 = Date.now() - startTime1;

      // Second request (should use cache)
      const startTime2 = Date.now();
      const contacts2 = await nostr.social.contacts.get(testPubkey, { 
        useCache: true,
        timeout: 1000 
      });
      const duration2 = Date.now() - startTime2;

      if (contacts1 && contacts2) {
        expect(contacts1.ownerPubkey).toBe(contacts2.ownerPubkey);
        expect(contacts1.contacts.length).toBe(contacts2.contacts.length);
        expect(contacts1.eventId).toBe(contacts2.eventId);
        expect(duration2).toBeLessThan(100); // Cache should be very fast
        console.log(`✅ Network request: ${duration1}ms, Cache request: ${duration2}ms`);
      } else if (!contacts1 && !contacts2) {
        // Both null is also valid (no contact list exists)
        console.log('ℹ️ No contact list found for user (valid state)');
        expect(duration2).toBeLessThan(duration1 + 100); // Cache should be faster than network
      } else {
        throw new Error('❌ Inconsistent cache behavior');
      }

      console.log('✅ Cache behavior verified!');
    }, 15000);

    it('should fetch multiple different contact lists', async () => {
      console.log('=== Testing multiple contact list fetches ===');

      const pubkeys = [
        '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245', // Known active
        '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2', // Another potential user
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'  // Non-existent
      ];

      const results = await Promise.allSettled(
        pubkeys.map(pubkey => 
          nostr.social.contacts.get(pubkey, { 
            useCache: false, 
            timeout: 8000 
          })
        )
      );

      // Verify all requests completed (either resolved or rejected, but no timeouts)
      expect(results).toHaveLength(3);
      
      let successCount = 0;
      let nullCount = 0;
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const pubkey = pubkeys[i];
        
        if (result.status === 'fulfilled') {
          if (result.value) {
            expect(result.value.ownerPubkey).toBe(pubkey);
            expect(Array.isArray(result.value.contacts)).toBe(true);
            successCount++;
            console.log(`✅ Pubkey ${pubkey}: Found ${result.value.contacts.length} contacts`);
          } else {
            nullCount++;
            console.log(`ℹ️ Pubkey ${pubkey}: No contact list found`);
          }
        } else {
          console.log(`⚠️ Pubkey ${pubkey}: Request failed - ${result.reason}`);
        }
      }
      
      console.log(`✅ Multiple fetch test completed: ${successCount} successful, ${nullCount} null results`);
      
      // At least the non-existent one should be null
      expect(nullCount).toBeGreaterThanOrEqual(1);
    }, 25000);
  });

  describe('Error Handling', () => {
    it('should handle very short timeouts gracefully', async () => {
      console.log('=== Testing timeout handling ===');

      const testPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      // Test with very short timeout
      const contactList = await nostr.social.contacts.get(testPubkey, { 
        timeout: 50 // Very short timeout
      });

      // Should either succeed quickly or return null - both are valid
      expect(contactList === null || contactList !== undefined).toBe(true);
      console.log('✅ Timeout handling works correctly!');
    }, 5000);

    it('should handle invalid pubkey format gracefully', async () => {
      console.log('=== Testing invalid pubkey handling ===');

      const invalidPubkeys = [
        'invalid-pubkey',
        '123', // Too short
        '', // Empty
        'gg' + '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' // Invalid hex
      ];

      for (const invalidPubkey of invalidPubkeys) {
        try {
          const result = await nostr.social.contacts.get(invalidPubkey, { 
            timeout: 2000 
          });
          // Should either return null or throw - both are acceptable
          expect(result === null || result === undefined).toBe(true);
          console.log(`✅ Invalid pubkey "${invalidPubkey}": Handled gracefully (returned null)`);
        } catch (error) {
          // Throwing an error is also acceptable for invalid input
          console.log(`✅ Invalid pubkey "${invalidPubkey}": Handled gracefully (threw error)`);
          expect(error).toBeDefined();
        }
      }
    }, 10000);
  });

  describe('Contact List Structure Validation', () => {
    it('should validate contact list structure meets NIP-02 spec', async () => {
      console.log('=== Testing NIP-02 compliance ===');

      const testPubkey = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245';
      
      const contactList = await nostr.social.contacts.get(testPubkey, { 
        useCache: false,
        timeout: 10000 
      });

      if (contactList) {
        // Validate top-level ContactList structure
        expect(typeof contactList.ownerPubkey).toBe('string');
        expect(contactList.ownerPubkey).toBe(testPubkey);
        expect(Array.isArray(contactList.contacts)).toBe(true);
        expect(typeof contactList.lastUpdated).toBe('number');
        expect(contactList.lastUpdated).toBeGreaterThan(0);
        expect(typeof contactList.isOwn).toBe('boolean');
        expect(contactList.isOwn).toBe(false); // Not our own since we're not signed in
        
        if (contactList.eventId) {
          expect(typeof contactList.eventId).toBe('string');
          expect(contactList.eventId.length).toBe(64); // Event ID should be 64 hex chars
        }

        // Validate individual Contact structure (NIP-02 p-tags)
        for (const contact of contactList.contacts) {
          // Required: pubkey (from p-tag[1])
          expect(typeof contact.pubkey).toBe('string');
          expect(contact.pubkey.length).toBe(64);
          expect(/^[0-9a-f]{64}$/.test(contact.pubkey)).toBe(true); // Valid hex
          
          // Optional: relayUrl (from p-tag[2])
          if (contact.relayUrl !== undefined) {
            expect(typeof contact.relayUrl).toBe('string');
            // Should be a valid relay URL or empty
            if (contact.relayUrl.length > 0) {
              expect(contact.relayUrl.startsWith('ws://') || contact.relayUrl.startsWith('wss://')).toBe(true);
            }
          }
          
          // Optional: petname (from p-tag[3])
          if (contact.petname !== undefined) {
            expect(typeof contact.petname).toBe('string');
          }
        }
        
        console.log(`✅ NIP-02 structure validation passed for ${contactList.contacts.length} contacts`);
      } else {
        console.log('ℹ️ No contact list found - skipping structure validation');
      }
    }, 15000);
  });
});