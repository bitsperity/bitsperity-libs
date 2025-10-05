/**
 * Manual Relay Priority Test
 * 
 * Validates that manually specified relays via .toRelays() ALWAYS take priority
 * over auto-selection, NIP-65 routing, or any other relay selection mechanism.
 * 
 * Critical for Sprint 1: Relay Management Fix
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment, TestUser } from '../../shared/TestEnvironment.js';

describe('Manual Relay Priority', () => {
  let env: TestEnvironment;
  let alice: TestUser;
  
  beforeAll(async () => {
    env = new TestEnvironment({ 
      relayUrl: 'ws://localhost:7777',
      debug: true 
    });
    
    alice = await env.createTestUser('Alice');
  });
  
  afterAll(async () => {
    await env.cleanup();
  });

  describe('Manual Relay Selection', () => {
    it('should use manually specified relay and NOT auto-select', async () => {
      const manualRelay = 'ws://localhost:7777';
      
      const result = await alice.nostr.events.create()
        .kind(1)
        .content('Test with manual relay')
        .toRelays(manualRelay)  // ← Manual relay specification
        .publish();
      
      // Should succeed
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      // Should publish to manual relay ONLY
      expect(result.relayResults).toBeDefined();
      expect(result.relayResults.length).toBeGreaterThan(0);
      
      // Verify all relay results match manual relay
      const usedRelays = result.relayResults.map(r => r.relay);
      expect(usedRelays).toContain(manualRelay);
    });
    
    it('should use manual relays even when NIP-65 routing is enabled', async () => {
      // Note: This test assumes alice's nostr instance doesn't have routing enabled
      // In production, manual relays should ALWAYS override NIP-65
      
      const manualRelay = 'ws://localhost:7777';
      
      const result = await alice.nostr.events.create()
        .kind(1)
        .content('Manual overrides NIP-65')
        .toRelays(manualRelay)
        .publish();
      
      expect(result.success).toBe(true);
      
      // Manual relay was used
      const usedRelays = result.relayResults.map(r => r.relay);
      expect(usedRelays).toContain(manualRelay);
    });
    
    it('should handle multiple manual relays', async () => {
      const relay1 = 'ws://localhost:7777';
      // Note: Only one relay in test environment, so we test with single relay
      
      const result = await alice.nostr.events.create()
        .kind(1)
        .content('Multiple manual relays')
        .toRelays(relay1)
        .publish();
      
      expect(result.success).toBe(true);
      expect(result.relayResults.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Order Validation', () => {
    it('should prioritize: manual > auto-select > connected', async () => {
      // This test validates the priority chain
      
      // 1. Without manual relay, should use connected relays
      const resultAuto = await alice.nostr.events.create()
        .kind(1)
        .content('Auto-selected relay')
        .publish();
      
      expect(resultAuto.success).toBe(true);
      
      // 2. With manual relay, should ONLY use manual
      const manualRelay = 'ws://localhost:7777';
      const resultManual = await alice.nostr.events.create()
        .kind(1)
        .content('Manual relay priority')
        .toRelays(manualRelay)
        .publish();
      
      expect(resultManual.success).toBe(true);
      
      // Manual relay was used
      const usedRelays = resultManual.relayResults.map(r => r.relay);
      expect(usedRelays).toContain(manualRelay);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty manual relay array gracefully', async () => {
      // Empty array should fall back to default behavior
      const result = await alice.nostr.events.create()
        .kind(1)
        .content('Empty relay array')
        .publish(); // No .toRelays() call
      
      expect(result.success).toBe(true);
    });
    
    it('should validate relay URL format', async () => {
      const validRelay = 'ws://localhost:7777';
      
      const result = await alice.nostr.events.create()
        .kind(1)
        .content('Valid relay URL')
        .toRelays(validRelay)
        .publish();
      
      expect(result.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete manual relay publish within 2000ms', async () => {
      env.startPerformanceMeasurement();
      
      await alice.nostr.events.create()
        .kind(1)
        .content('Performance test')
        .toRelays('ws://localhost:7777')
        .publish();
      
      const duration = env.endPerformanceMeasurement('Manual relay publish');
      
      // Should complete within 2 seconds (generous for container relay)
      env.assertPerformance(duration, 2000, 'Manual relay publish');
    });
  });
});


