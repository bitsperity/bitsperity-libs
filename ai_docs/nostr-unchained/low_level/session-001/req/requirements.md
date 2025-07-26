# Requirements: Milestone 1 - Basic Publish

## Epic Requirements (Test-Driven)

### Epic 1: Magical First Experience
**As an AI prompt engineer working late**, I want to publish to Nostr with minimal code so that I get instant gratification and see the power immediately.

**Acceptance Criteria (Test-First):**
```typescript
// This code MUST work in < 2 minutes from npm install:
const nostr = new NostrUnchained();
const result = await nostr.publish("Hello Nostr!");
expect(result.success).toBe(true);
expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
```

### Epic 3: Effortless Publishing (Simplified)
**As a developer creating content**, I want to publish events with simple syntax so that I don't need to understand Nostr event structure.

**Acceptance Criteria (Test-First):**
```typescript
// Simple publishing must work:
const result = await nostr.publish("Hello World!");
expect(result.relayResults.length).toBeGreaterThan(0);
expect(result.relayResults.some(r => r.success)).toBe(true);

// Error handling must be clear:
const failResult = await nostr.publish(""); // empty content
expect(failResult.success).toBe(false);
expect(failResult.error.message).toContain("Content cannot be empty");
```

### Epic 7: Zero-Config Setup
**As a tired developer at 9 PM**, I want the library to work immediately without configuration so that I can start building instead of reading docs.

**Acceptance Criteria (Test-First):**
```typescript
// Zero config must work:
const nostr = new NostrUnchained();
expect(nostr.relays.length).toBeGreaterThan(0);
expect(nostr.relays).toContain('ws://umbrel.local:4848');

// Auto relay discovery:
await nostr.connect();
expect(nostr.connectedRelays.length).toBeGreaterThan(0);
```

## Technical Requirements (NIP Compliance)

### NIP-01: Basic Protocol Flow
**Test-Driven Requirements:**

```typescript
describe('NIP-01 Compliance', () => {
  test('event structure must be valid', async () => {
    const event = await nostr.createEvent({
      kind: 1,
      content: "Test event"
    });
    
    // Event structure validation
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('pubkey'); 
    expect(event).toHaveProperty('created_at');
    expect(event).toHaveProperty('kind', 1);
    expect(event).toHaveProperty('tags');
    expect(event).toHaveProperty('content', "Test event");
    expect(event).toHaveProperty('sig');
    
    // ID must be SHA256 hash
    expect(event.id).toMatch(/^[a-f0-9]{64}$/);
    expect(event.pubkey).toMatch(/^[a-f0-9]{64}$/);
    expect(event.sig).toMatch(/^[a-f0-9]{128}$/);
  });
  
  test('event ID calculation must be correct', () => {
    const event = {
      pubkey: "test-pubkey",
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: "test"
    };
    
    const calculatedId = nostr.calculateEventId(event);
    expect(calculatedId).toBe(expectedSHA256Hash);
  });
});
```

### NIP-07: Browser Extension Integration
**Test-Driven Requirements:**

```typescript
describe('NIP-07 Browser Extension', () => {
  test('should detect available signing extension', async () => {
    // Mock window.nostr
    window.nostr = {
      getPublicKey: () => Promise.resolve('test-pubkey'),
      signEvent: (event) => Promise.resolve({...event, sig: 'test-sig'})
    };
    
    const nostr = new NostrUnchained();
    expect(await nostr.hasExtension()).toBe(true);
    expect(await nostr.getExtensionPubkey()).toBe('test-pubkey');
  });
  
  test('should fallback gracefully without extension', async () => {
    window.nostr = undefined;
    
    const nostr = new NostrUnchained();
    expect(await nostr.hasExtension()).toBe(false);
    
    // Should provide alternative signing
    expect(() => nostr.publish("test")).not.toThrow();
  });
});
```

### NIP-11: Relay Information
**Test-Driven Requirements:**

```typescript
describe('NIP-11 Relay Discovery', () => {
  test('should fetch relay information', async () => {
    const relayInfo = await nostr.getRelayInfo('ws://umbrel.local:4848');
    expect(relayInfo).toHaveProperty('name');
    expect(relayInfo).toHaveProperty('supported_nips');
    expect(relayInfo.supported_nips).toContain(1); // NIP-01 support
  });
  
  test('should handle relay connection failures', async () => {
    const result = await nostr.testRelay('ws://invalid-relay.local');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Performance Requirements (Test-Driven)

### Time-to-First-Post: < 2 Minutes
```typescript
describe('Performance Requirements', () => {
  test('first post must complete in under 30 seconds', async () => {
    const start = Date.now();
    const nostr = new NostrUnchained();
    const result = await nostr.publish("Performance test");
    const duration = Date.now() - start;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(30000); // 30 seconds max
  });
  
  test('relay connection must establish quickly', async () => {
    const start = Date.now();
    const nostr = new NostrUnchained();
    await nostr.connect();
    const duration = Date.now() - start;
    
    expect(nostr.connectedRelays.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(10000); // 10 seconds max
  });
});
```

### Local Relay Support
```typescript
describe('Local Relay Support', () => {
  test('must work with umbrel.local:4848', async () => {
    const nostr = new NostrUnchained({
      relays: ['ws://umbrel.local:4848']
    });
    
    const result = await nostr.publish("Local relay test");
    expect(result.relayResults.some(r => 
      r.relay === 'ws://umbrel.local:4848' && r.success
    )).toBe(true);
  });
});
```

## Error Handling Requirements (Test-Driven)

### Clear Error Messages
```typescript
describe('Error Handling', () => {
  test('should provide actionable error messages', async () => {
    const nostr = new NostrUnchained();
    
    // Test empty content
    const result1 = await nostr.publish("");
    expect(result1.error.message).toContain("Content cannot be empty");
    expect(result1.error.suggestion).toContain("Add some content");
    
    // Test network failure
    const result2 = await nostr.publish("test", { relays: ['ws://invalid'] });
    expect(result2.error.message).toContain("Failed to connect");
    expect(result2.error.retryable).toBe(true);
  });
  
  test('should handle signing failures gracefully', async () => {
    window.nostr = {
      signEvent: () => Promise.reject(new Error('User declined'))
    };
    
    const nostr = new NostrUnchained();
    const result = await nostr.publish("test");
    
    expect(result.success).toBe(false);
    expect(result.error.message).toContain("Signing failed");
    expect(result.error.userAction).toBe("User declined signing");
  });
});
```

## Success Criteria Summary

**Must Pass ALL Tests:**
1. ✅ Basic publishing works in < 2 minutes from install
2. ✅ NIP-01 compliant event structure and signing
3. ✅ NIP-07 browser extension integration (with fallback)
4. ✅ NIP-11 relay discovery and connection
5. ✅ Local relay support (`ws://umbrel.local:4848`)
6. ✅ Clear error handling and recovery
7. ✅ Performance thresholds met
8. ✅ Zero-config experience works

**Phase Gate 1 Complete when:** All acceptance tests pass + manual "cold start" test by new developer.