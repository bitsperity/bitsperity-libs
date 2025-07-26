/**
 * Milestone 1: Basic Publishing - Acceptance Tests
 * 
 * These tests define the MUST-HAVE functionality for Milestone 1.
 * All tests MUST pass before implementation is considered complete.
 * 
 * Test Philosophy: Red-Green-Refactor
 * - Write failing tests first
 * - Implement minimal code to make tests pass
 * - Refactor while keeping tests green
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NostrUnchained } from '@/index';

describe('Milestone 1: Basic Publishing - Acceptance Tests', () => {
  let nostr: NostrUnchained;

  beforeEach(() => {
    // Fresh instance for each test
    nostr = new NostrUnchained();
    
    // Mock console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('Epic 1: Magical First Experience', () => {
    it('should publish simple text in under 2 minutes', async () => {
      // This is the CORE acceptance test - must work!
      const startTime = Date.now();
      
      const result = await nostr.publish("Hello Nostr!");
      
      const duration = Date.now() - startTime;
      
      // Success criteria
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      expect(duration).toBeLessThan(120000); // 2 minutes max
      
      // Should have tried at least one relay
      expect(result.relayResults.length).toBeGreaterThan(0);
      
      // At least one relay should succeed
      const hasSuccess = result.relayResults.some(r => r.success);
      expect(hasSuccess).toBe(true);
    }, 120000); // 2 minute timeout

    it('should work with minimal developer effort', async () => {
      // Zero-config magic experience
      const nostr = new NostrUnchained(); // No configuration needed
      
      const result = await nostr.publish("Minimal effort test!");
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    }, 120000); // 2 minute timeout

    it('should provide immediate feedback', async () => {
      const result = await nostr.publish("Feedback test");
      
      // Must provide detailed feedback
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('eventId');
      expect(result).toHaveProperty('relayResults');
      expect(result).toHaveProperty('timestamp');
      
      // Relay results must be informative
      result.relayResults.forEach(relayResult => {
        expect(relayResult).toHaveProperty('relay');
        expect(relayResult).toHaveProperty('success');
        if (!relayResult.success) {
          expect(relayResult).toHaveProperty('error');
        }
      });
    }, 120000); // 2 minute timeout
  });

  describe('Epic 3: Effortless Publishing', () => {
    it('should handle simple string publishing', async () => {
      const result = await nostr.publish("Simple string test");
      
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
    }, 120000); // 2 minute timeout

    it('should validate content before publishing', async () => {
      // Empty content should fail gracefully
      const result = await nostr.publish("");
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Content cannot be empty");
      expect(result.error?.suggestion).toBeDefined();
    });

    it('should handle publishing failures gracefully', async () => {
      // Test with invalid relay to trigger failure
      const nostr = new NostrUnchained({
        relays: ['ws://definitely-invalid-relay.fake']
      });
      
      const result = await nostr.publish("Failure test");
      
      // Should fail but provide helpful information
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(result.error?.retryable).toBeDefined();
    });

    it('should provide clear error messages', async () => {
      // Test various error conditions
      const testCases = [
        { content: "", expectedError: "empty" },
        { content: "x".repeat(10000), expectedError: "too long" }
      ];

      for (const testCase of testCases) {
        const result = await nostr.publish(testCase.content);
        
        expect(result.success).toBe(false);
        expect(result.error?.message.toLowerCase()).toContain(testCase.expectedError);
      }
    });
  });

  describe('Epic 7: Zero-Config Setup', () => {
    it('should work without any configuration', () => {
      const nostr = new NostrUnchained();
      
      // Should have default relays configured
      expect(nostr.relays).toBeDefined();
      expect(nostr.relays.length).toBeGreaterThan(0);
      
      // Should include test relay
      expect(nostr.relays).toContain('ws://umbrel.local:4848');
    });

    it('should discover and connect to relays automatically', async () => {
      const nostr = new NostrUnchained();
      
      await nostr.connect();
      
      // Should have established at least one connection
      expect(nostr.connectedRelays.length).toBeGreaterThan(0);
    });

    it('should handle relay failures with fallbacks', async () => {
      const nostr = new NostrUnchained({
        relays: [
          'ws://invalid-relay.fake',     // Will fail
          'ws://umbrel.local:4848'       // Should work
        ]
      });
      
      const result = await nostr.publish("Fallback test");
      
      // Should succeed despite first relay failing
      expect(result.success).toBe(true);
      
      // Should report at least the successful connection
      expect(result.relayResults.length).toBeGreaterThan(0);
      expect(result.relayResults.some(r => r.success)).toBe(true);
    });
  });

  describe('NIP-01: Basic Protocol Compliance', () => {
    it('should create valid Nostr events', async () => {
      const event = await nostr.createEvent({
        kind: 1,
        content: "Protocol compliance test"
      });
      
      // Event structure validation (NIP-01)
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('pubkey');
      expect(event).toHaveProperty('created_at');
      expect(event).toHaveProperty('kind', 1);
      expect(event).toHaveProperty('tags');
      expect(event).toHaveProperty('content', "Protocol compliance test");
      expect(event).toHaveProperty('sig');
      
      // Format validation
      expect(event.id).toMatch(/^[a-f0-9]{64}$/);
      expect(event.pubkey).toMatch(/^[a-f0-9]{64}$/);
      expect(event.sig).toMatch(/^[a-f0-9]{128}$/);
      expect(typeof event.created_at).toBe('number');
      expect(Array.isArray(event.tags)).toBe(true);
    });

    it('should calculate event IDs correctly', () => {
      // Test event ID calculation per NIP-01
      const event = {
        pubkey: "test-pubkey-64-chars-000000000000000000000000000000000000000000",
        created_at: 1234567890,
        kind: 1,
        tags: [],
        content: "test content"
      };
      
      const calculatedId = nostr.calculateEventId(event);
      
      // Should be deterministic 64-char hex string
      expect(calculatedId).toMatch(/^[a-f0-9]{64}$/);
      
      // Same input should produce same ID
      const calculatedId2 = nostr.calculateEventId(event);
      expect(calculatedId).toBe(calculatedId2);
    });

    it('should sign events properly', async () => {
      const event = await nostr.createEvent({
        kind: 1,
        content: "Signing test"
      });
      
      // Should have valid signature
      expect(event.sig).toMatch(/^[a-f0-9]{128}$/);
      
      // Should be able to verify signature
      const isValid = await nostr.verifyEvent(event);
      expect(isValid).toBe(true);
    });
  });

  describe('NIP-07: Browser Extension Integration', () => {
    it('should detect available signing extension', async () => {
      // Mock window.nostr extension
      const mockExtension = {
        getPublicKey: vi.fn().mockResolvedValue('test-pubkey-64-chars'),
        signEvent: vi.fn().mockResolvedValue({
          id: 'test-id',
          sig: 'test-signature-128-chars'
        })
      };
      
      (globalThis as any).window = { nostr: mockExtension };
      
      const nostr = new NostrUnchained();
      
      expect(await nostr.hasExtension()).toBe(true);
      expect(await nostr.getExtensionPubkey()).toBe('test-pubkey-64-chars');
    });

    it('should fallback gracefully without extension', async () => {
      // No extension available
      (globalThis as any).window = { nostr: undefined };
      
      const nostr = new NostrUnchained();
      
      expect(await nostr.hasExtension()).toBe(false);
      
      // Should still be able to publish (with generated key)
      const result = await nostr.publish("No extension test");
      expect(result.success).toBe(true);
    }, 120000); // 2 minute timeout
  });

  describe('Performance Requirements', () => {
    it('should establish relay connections quickly', async () => {
      const start = Date.now();
      
      const nostr = new NostrUnchained();
      await nostr.connect();
      
      const duration = Date.now() - start;
      
      expect(nostr.connectedRelays.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should publish events efficiently', async () => {
      const start = Date.now();
      
      const result = await nostr.publish("Performance test event");
      
      const duration = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(30000); // 30 seconds max
    }, 120000); // 2 minute timeout
  });

  describe('Local Relay Support', () => {
    it('should work with umbrel.local:4848', async () => {
      const nostr = new NostrUnchained({
        relays: ['ws://umbrel.local:4848']
      });
      
      const result = await nostr.publish("Local relay test");
      
      expect(result.success).toBe(true);
      
      // Should have attempted the local relay
      const localRelayResult = result.relayResults.find(
        r => r.relay === 'ws://umbrel.local:4848'
      );
      expect(localRelayResult).toBeDefined();
      expect(localRelayResult?.success).toBe(true);
    });

    it('should include local relay in default configuration', () => {
      const nostr = new NostrUnchained();
      
      expect(nostr.relays).toContain('ws://umbrel.local:4848');
    });
  });

  describe('Integration Test: Complete Flow', () => {
    it('should complete full publish workflow', async () => {
      // This test validates the complete end-to-end flow
      const nostr = new NostrUnchained();
      
      // Step 1: Initialize (should be instant)
      expect(nostr).toBeDefined();
      expect(nostr.relays.length).toBeGreaterThan(0);
      
      // Step 2: Connect to relays
      await nostr.connect();
      expect(nostr.connectedRelays.length).toBeGreaterThan(0);
      
      // Step 3: Create and publish event
      const content = `Integration test at ${Date.now()}`;
      const result = await nostr.publish(content);
      
      // Step 4: Verify success
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      expect(result.relayResults.some(r => r.success)).toBe(true);
      
      // Step 5: Verify event structure
      expect(result.event).toBeDefined();
      expect(result.event?.content).toBe(content);
      expect(result.event?.kind).toBe(1);
    });
  });
});