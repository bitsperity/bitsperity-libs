# 🧪 Nostr-Unchained: Comprehensive Test Strategy Blueprint
> Datum: 2025-10-05  
> Version: 1.0  
> Ziel: 100% NIP-Compliance Testing mit Real Relay Infrastructure

---

## 📐 Test-Architektur-Prinzipien

### 1. **Layer-Aware Testing** (respektiert 3-Schicht-Architektur)

```
┌─────────────────────────────────────────────────────┐
│ Layer 2 Tests: High-Level APIs                    │
│ ✅ Nur pub/sub/query nutzen                       │
│ ❌ NIEMALS direkt cache/signer                    │
├─────────────────────────────────────────────────────┤
│ Layer 1 Tests: Core Protocol                      │
│ ✅ pub/sub/query/delete operations                │
│ ✅ Relay management                               │
│ ✅ Signing provider integration                   │
├─────────────────────────────────────────────────────┤
│ Layer 0 Tests: Universal Cache                    │
│ ✅ Cache operations & performance                 │
│ ✅ Gift wrap decryption pipeline                  │
│ ✅ Memory management & LRU                        │
└─────────────────────────────────────────────────────┘
```

### 2. **Zero Mocks Philosophy**

**Principle:** Protocol libraries MÜSSEN gegen echte Implementierungen getestet werden

✅ **Was wir nutzen:**
- Real Nostr relays (Docker containers)
- Real cryptographic operations
- Real network conditions
- Official NIP test vectors

❌ **Was wir NICHT nutzen:**
- Mocked relays
- Fake encryption
- Simulated delays
- Stubbed dependencies (außer externe Services wie LNURL)

### 3. **NIP-First Organization**

Jeder implementierte NIP bekommt:
- ✅ Dedicated test file: `nipXX-[name].test.ts`
- ✅ Official spec reference in comments
- ✅ Happy path scenarios
- ✅ Edge cases
- ✅ Error scenarios
- ✅ Performance assertions

---

## 📁 Test-Structure (Final)

```
nostr-unchained/
├── docker-compose.test.yml           # Container relay config
├── tests-v2/
│   ├── 00-infrastructure/            # Test environment validation
│   │   ├── relay-health.test.ts
│   │   ├── relay-auth-hint.test.ts
│   │   └── relay-list.test.ts
│   │
│   ├── 01-core/                      # Layer 1: Core Protocol Tests
│   │   ├── cache-initialization.test.ts
│   │   ├── query-guards.test.ts
│   │   ├── query-search-nip50.test.ts
│   │   ├── query-tags.test.ts
│   │   └── nip21-uri.test.ts
│   │
│   ├── 02-protocol-compliance/       # NIP-by-NIP Tests
│   │   │
│   │   ├── core/                     # Core Protocol NIPs
│   │   │   ├── nip01-basic-protocol.test.ts    # TODO
│   │   │   ├── nip09-deletion.test.ts          # TODO
│   │   │   ├── nip11-relay-info.test.ts        # TODO
│   │   │   ├── nip19-encoding.test.ts          # TODO
│   │   │   └── nip21-uri.test.ts               # ✅ EXISTS
│   │   │
│   │   ├── social/                   # Social NIPs
│   │   │   ├── nip02-follow-list.test.ts       # TODO
│   │   │   ├── nip10-threading.test.ts         # TODO
│   │   │   ├── nip18-reposts.test.ts           # TODO (exists basic)
│   │   │   ├── nip22-comments.test.ts          # ✅ EXISTS
│   │   │   ├── nip25-reactions.test.ts         # TODO (expand)
│   │   │   ├── nip28-channels.test.ts          # ✅ EXISTS
│   │   │   └── nip51-lists.test.ts             # TODO (expand)
│   │   │
│   │   ├── crypto/                   # Encryption & Privacy NIPs
│   │   │   ├── nip44-encryption.test.ts        # ✅ EXISTS
│   │   │   ├── nip59-gift-wrap.test.ts         # TODO
│   │   │   └── nip17-private-dm.test.ts        # TODO (part of DM tests)
│   │   │
│   │   ├── relay/                    # Relay Management NIPs
│   │   │   ├── nip42-auth.test.ts              # ✅ EXISTS
│   │   │   ├── nip65-relay-lists.test.ts       # TODO (expand)
│   │   │   └── nip66-relay-discovery.test.ts   # TODO (expand)
│   │   │
│   │   ├── moderation/               # Moderation & Safety NIPs
│   │   │   ├── nip32-labels.test.ts            # ✅ EXISTS
│   │   │   ├── nip36-content-warning.test.ts   # ✅ EXISTS
│   │   │   ├── nip56-reporting.test.ts         # TODO (not implemented)
│   │   │   └── nip72-communities.test.ts       # ✅ EXISTS
│   │   │
│   │   ├── media/                    # Media & Content NIPs
│   │   │   ├── nip23-longform.test.ts          # ✅ EXISTS
│   │   │   ├── nip92-attachments.test.ts       # ✅ EXISTS
│   │   │   ├── nip94-file-metadata.test.ts     # ✅ EXISTS
│   │   │   └── nip96-http-storage.test.ts      # ✅ EXISTS
│   │   │
│   │   ├── payments/                 # Lightning & Payments NIPs
│   │   │   └── nip57-zaps.test.ts              # TODO (expand)
│   │   │
│   │   ├── signing/                  # Signing & Key Management NIPs
│   │   │   ├── nip46-nostr-connect.test.ts     # ✅ EXISTS
│   │   │   └── signer-conformance.test.ts      # ✅ EXISTS
│   │   │
│   │   └── advanced/                 # Advanced NIPs
│   │       ├── nip13-pow.test.ts               # TODO (not implemented)
│   │       ├── nip40-expiration.test.ts        # TODO (not implemented)
│   │       └── nip98-http-auth.test.ts         # ✅ EXISTS
│   │
│   ├── 03-integration/               # Multi-Module Integration Tests
│   │   ├── dm-with-relay-routing.test.ts       # TODO
│   │   ├── community-full-flow.test.ts         # TODO
│   │   ├── profile-follow-integration.test.ts  # TODO
│   │   └── content-moderation-flow.test.ts     # TODO
│   │
│   ├── 04-performance/               # Performance & Load Tests
│   │   ├── cache-performance.test.ts           # TODO
│   │   ├── subscription-dedup.test.ts          # TODO
│   │   ├── large-feed-rendering.test.ts        # TODO
│   │   └── memory-leak-detection.test.ts       # TODO
│   │
│   ├── 05-edge-cases/                # Robustness & Error Handling
│   │   ├── relay-failures.test.ts              # TODO
│   │   ├── partial-subscription-failures.test.ts # TODO
│   │   ├── invalid-events.test.ts              # TODO
│   │   └── encryption-failures.test.ts         # TODO
│   │
│   ├── debug/                        # Debugging Helpers
│   │   └── (various debug tests)
│   │
│   └── shared/                       # Shared Test Infrastructure
│       ├── TestEnvironment.ts
│       └── BugAnalysisFramework.ts
│
├── vitest.v2.config.ts               # Vitest configuration
└── package.json                      # Test scripts
```

---

## 🎯 Test-Template & Patterns

### Standard NIP Test Template

```typescript
/**
 * NIP-XX: [Name]
 * 
 * Reference: https://github.com/nostr-protocol/nips/blob/master/XX.md
 * 
 * Tests:
 * - Core functionality as per spec
 * - Edge cases and boundary conditions
 * - Error handling and validation
 * - Performance requirements
 * 
 * Architecture: Layer [0/1/2]
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment, TestUser } from '../../shared/TestEnvironment.js';
import { NostrUnchained } from '../../../src/index.js';

describe('NIP-XX: [Name]', () => {
  let env: TestEnvironment;
  let alice: TestUser;
  let bob: TestUser;
  
  beforeAll(async () => {
    env = new TestEnvironment({ 
      relayUrl: 'ws://localhost:7777',
      debug: false 
    });
    
    // Create test users
    [alice, bob] = await env.createTestUsers(['Alice', 'Bob']);
  });
  
  afterAll(async () => {
    await env.cleanup();
  });

  describe('Core Functionality', () => {
    it('should [requirement 1 from NIP spec]', async () => {
      // Arrange: Setup initial state
      const content = env.getTestContent('NIP-XX');
      
      // Act: Perform operation
      const result = await alice.nostr.[operation](content);
      
      // Assert: Validate result
      expect(result.success).toBe(true);
      expect(result.eventId).toMatch(/^[a-f0-9]{64}$/);
      
      // Wait for relay propagation
      await env.waitForPropagation(100);
      
      // Validate via query
      const events = bob.nostr.query()
        .kinds([XX])
        .authors([alice.publicKey])
        .execute();
      
      expect(events.current).toHaveLength(1);
      expect(events.current[0].content).toBe(content);
    });
    
    it('should [requirement 2 from NIP spec]', async () => {
      // Similar structure...
    });
  });

  describe('Tag Validation', () => {
    it('should include required tags', async () => {
      const result = await alice.nostr.[operation]('test');
      expect(result.event?.tags).toBeDefined();
      
      // Validate specific tags
      const requiredTag = result.event?.tags.find(t => t[0] === 'x');
      expect(requiredTag).toBeDefined();
      expect(requiredTag?.[1]).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const result = await alice.nostr.[operation]('');
      expect(result.success).toBe(true);
    });
    
    it('should handle very long content', async () => {
      const longContent = 'x'.repeat(100000);
      const result = await alice.nostr.[operation](longContent);
      expect(result.success).toBe(true);
    });
    
    it('should handle special characters', async () => {
      const specialContent = '🔥 Test with émojis and spëcial chars: <>&"\'';
      const result = await alice.nostr.[operation](specialContent);
      expect(result.success).toBe(true);
      expect(result.event?.content).toBe(specialContent);
    });
  });

  describe('Error Scenarios', () => {
    it('should error when [invalid condition]', async () => {
      await expect(
        alice.nostr.[operation](null as any)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete operation within 1000ms', async () => {
      env.startPerformanceMeasurement();
      
      await alice.nostr.[operation]('Performance test');
      
      const duration = env.endPerformanceMeasurement('NIP-XX operation');
      env.assertPerformance(duration, 1000, 'NIP-XX operation');
    });
  });

  describe('Architecture Compliance', () => {
    it('should use Layer 1 APIs only (no direct cache access)', () => {
      // This is a meta-test to ensure Layer 2 modules
      // don't bypass architecture by accessing cache directly
      
      const module = alice.nostr.[moduleProperty];
      
      // Verify no direct cache access
      expect(module).not.toHaveProperty('cache');
      expect(module).not.toHaveProperty('getCache');
    });
  });
});
```

---

## 🎪 Spezielle Test-Patterns

### Pattern 1: Multi-User Interaction Tests

```typescript
describe('Multi-User Interaction', () => {
  it('should handle Alice → Bob interaction', async () => {
    // Alice performs action
    const aliceResult = await alice.nostr.social.react(targetEvent, '❤️');
    expect(aliceResult.success).toBe(true);
    
    // Bob queries and sees Alice's action
    await env.waitForPropagation(200);
    
    const bobView = bob.nostr.query()
      .kinds([7])
      .tags('e', [targetEvent])
      .execute();
    
    const aliceReaction = bobView.current.find(
      e => e.pubkey === alice.publicKey
    );
    
    expect(aliceReaction).toBeDefined();
    expect(aliceReaction?.content).toBe('❤️');
  });
});
```

### Pattern 2: Subscription & Reactive Updates

```typescript
describe('Reactive Updates', () => {
  it('should receive real-time updates via subscription', async () => {
    // Bob starts listening
    const updates: NostrEvent[] = [];
    const sub = bob.nostr.sub()
      .kinds([1])
      .authors([alice.publicKey])
      .execute();
    
    sub.subscribe(events => {
      updates.push(...events);
    });
    
    // Alice publishes
    await alice.nostr.events.note('Real-time test').publish();
    
    // Wait for subscription
    await env.waitForSubscription(1000);
    
    // Verify Bob received it
    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0].content).toBe('Real-time test');
    
    // Cleanup
    sub.unsubscribe();
  });
});
```

### Pattern 3: Cache Performance Tests

```typescript
describe('Cache Performance', () => {
  it('should return cached results in <10ms', async () => {
    // Pre-populate cache
    await alice.nostr.events.note('Cached content').publish();
    await env.waitForPropagation(200);
    
    // First query (might be slower - fills cache)
    const firstQuery = alice.nostr.query()
      .kinds([1])
      .authors([alice.publicKey])
      .execute();
    
    expect(firstQuery.current.length).toBeGreaterThan(0);
    
    // Second query (should be from cache)
    env.startPerformanceMeasurement();
    
    const cachedQuery = alice.nostr.query()
      .kinds([1])
      .authors([alice.publicKey])
      .execute();
    
    const duration = env.endPerformanceMeasurement('Cached query');
    
    // Assert <10ms cache hit
    env.assertPerformance(duration, 10, 'Cached query');
    expect(cachedQuery.current.length).toBe(firstQuery.current.length);
  });
});
```

### Pattern 4: Error Recovery Tests

```typescript
describe('Error Recovery', () => {
  it('should recover from relay disconnect', async () => {
    // Disconnect relay (simulate network failure)
    await alice.nostr.disconnect();
    
    // Try to publish (should queue or fail gracefully)
    const result = await alice.nostr.events
      .note('During disconnect')
      .publish()
      .catch(err => ({ success: false, error: err }));
    
    expect(result.success).toBe(false);
    
    // Reconnect
    await alice.nostr.connect();
    
    // Should work again
    const retryResult = await alice.nostr.events
      .note('After reconnect')
      .publish();
    
    expect(retryResult.success).toBe(true);
  });
});
```

### Pattern 5: NIP Compliance with Official Vectors

```typescript
describe('Official Test Vectors', () => {
  it('should match official NIP-44 encryption vectors', async () => {
    // Load official vectors
    const vectors = await import('../../../test-vectors/nip44-official-vectors-latest.json');
    
    for (const vector of vectors.v2.valid.encrypt_decrypt) {
      const { sec1, pub2, plaintext, ciphertext } = vector;
      
      // Test encryption
      const encrypted = await NIP44Crypto.encrypt(
        plaintext,
        sec1,
        pub2
      );
      
      // Should match expected ciphertext (or be valid alternative)
      expect(encrypted.ciphertext).toBeTruthy();
      
      // Test decryption
      const decrypted = await NIP44Crypto.decrypt(
        ciphertext,
        sec1,
        pub2
      );
      
      expect(decrypted).toBe(plaintext);
    }
  });
});
```

---

## 📋 Test Checklists per NIP

### Checklist: Core Protocol NIPs

#### NIP-01: Basic Protocol
- [ ] Event structure validation (id, pubkey, created_at, kind, tags, content, sig)
- [ ] Event ID calculation (SHA256 hash)
- [ ] Signature verification (schnorr)
- [ ] REQ/EOSE/CLOSE message flow
- [ ] Filter matching (kinds, authors, ids, tags, since, until, limit)
- [ ] Tag parsing and validation

#### NIP-02: Follow List
- [ ] kind:3 event creation
- [ ] p-tag format (pubkey, relay, petname)
- [ ] Parsing follow list from event
- [ ] Adding/removing follows
- [ ] Batch follow operations
- [ ] Edge: duplicate follows
- [ ] Edge: invalid pubkeys

#### NIP-09: Event Deletion
- [ ] kind:5 deletion request
- [ ] e-tags referencing deleted events
- [ ] Cache removes referenced events
- [ ] Multiple events deletion
- [ ] Edge: delete non-existent event
- [ ] Edge: delete own vs. other's events

#### NIP-10: Threading
- [ ] Root tag (e-tag with "root" marker)
- [ ] Reply tag (e-tag with "reply" marker)
- [ ] Mention tags (e-tag with "mention" marker)
- [ ] Positional tags (deprecated but supported)
- [ ] Complex thread structures
- [ ] Thread traversal

#### NIP-11: Relay Information
- [ ] HTTP GET to relay URL
- [ ] Parse relay info JSON
- [ ] NIP support array
- [ ] Software version
- [ ] Contact info

#### NIP-19: Encoding
- [ ] npub encoding/decoding
- [ ] nsec encoding/decoding
- [ ] note encoding/decoding
- [ ] nprofile encoding/decoding
- [ ] nevent encoding/decoding
- [ ] naddr encoding/decoding
- [ ] NIP-21 URI format (nostr:...)
- [ ] Edge: invalid encodings

### Checklist: Social NIPs

#### NIP-18: Reposts
- [ ] kind:6 repost event
- [ ] e-tag to original event
- [ ] p-tag to original author
- [ ] Optional relay hints
- [ ] Query reposts of event
- [ ] Edge: repost of repost

#### NIP-22: Comments
- [ ] kind:1111 comment event
- [ ] Root tag (e, a, or external URL)
- [ ] Reply threading
- [ ] Query comments for event
- [ ] Query comments for address
- [ ] Edge: comments on non-existent events

#### NIP-25: Reactions
- [ ] kind:7 reaction event
- [ ] e-tag to reacted event
- [ ] content: emoji or "+" / "-"
- [ ] Custom emoji reactions
- [ ] Unreact (kind:5 deletion)
- [ ] Aggregate reaction counts
- [ ] Edge: multiple reactions from same user

#### NIP-28: Public Chat
- [ ] kind:40 channel creation
- [ ] kind:41 channel metadata
- [ ] kind:42 channel messages
- [ ] kind:43 hide message
- [ ] kind:44 mute user
- [ ] Channel message threading
- [ ] Edge: messages to non-existent channel

#### NIP-51: Lists
- [ ] kind:30000 follow sets
- [ ] kind:30001 generic lists
- [ ] kind:30002 relay sets
- [ ] kind:30003 bookmark lists
- [ ] p-tags for people
- [ ] e-tags for events
- [ ] a-tags for addresses
- [ ] CRUD operations
- [ ] Edge: empty lists

#### NIP-72: Communities
- [ ] kind:34550 community definition
- [ ] kind:1111 community posts
- [ ] kind:4550 moderation approvals
- [ ] Relay markers (author, requests, approvals)
- [ ] Moderator management
- [ ] Post approval/rejection
- [ ] Revoke approval (kind:5)
- [ ] Edge: posts to non-existent community

### Checklist: Crypto & Privacy NIPs

#### NIP-17: Private DMs
- [ ] kind:14 DM event (sealed rumor)
- [ ] Subject tag for conversation grouping
- [ ] Gift wrap (kind:1059)
- [ ] Ephemeral key per message
- [ ] Auto gift-wrap subscription
- [ ] Lazy loading (only when DM accessed)
- [ ] Multi-party conversations
- [ ] Edge: decrypt failure handling

#### NIP-44: Encryption
- [ ] v2 encryption (ChaCha20-Poly1305)
- [ ] ECDH shared secret
- [ ] HKDF key derivation
- [ ] Padding scheme
- [ ] MAC authentication
- [ ] Official test vectors
- [ ] Edge: invalid keys
- [ ] Edge: corrupted ciphertext

#### NIP-59: Gift Wrap
- [ ] 3-layer: Rumor → Seal → Wrap
- [ ] Ephemeral keys for seal & wrap
- [ ] Timestamp randomization
- [ ] Auto-unwrap pipeline
- [ ] Cache stores both 1059 and unwrapped
- [ ] publishSigned for pre-signed events
- [ ] Edge: unwrap failures

### Checklist: Relay Management NIPs

#### NIP-42: Relay Auth
- [ ] AUTH challenge/response flow
- [ ] kind:22242 auth event
- [ ] Challenge tag
- [ ] Relay tag
- [ ] Auto-auth when challenged
- [ ] Edge: auth rejection

#### NIP-65: Relay Lists
- [ ] kind:10002 relay list
- [ ] r-tags (relay URL + read/write marker)
- [ ] Read relays vs. write relays
- [ ] Relay router integration
- [ ] Auto-adopt user's relay list
- [ ] Routing: manual > auto > nip65
- [ ] Edge: empty relay list

#### NIP-66: Relay Discovery
- [ ] Discover relays from network
- [ ] Health monitoring (NIP-11 + ping)
- [ ] Automatic failover
- [ ] Geographic distribution
- [ ] Performance tracking
- [ ] Edge: all relays down

### Checklist: Moderation NIPs

#### NIP-32: Labels
- [ ] kind:1985 label event
- [ ] L-tag (namespace)
- [ ] l-tag (label value + mark)
- [ ] Target tags (e, p, a, r, t)
- [ ] Reason field
- [ ] Query labels for event
- [ ] Query labels for author
- [ ] Edge: labels without target

#### NIP-36: Content Warning
- [ ] content-warning tag
- [ ] Reason string (optional)
- [ ] Fluent builder: .contentWarning()
- [ ] Client respects warnings
- [ ] Edge: multiple warnings

#### NIP-56: Reporting (TODO)
- [ ] kind:1984 report event
- [ ] Report types (spam, illegal, nudity, etc.)
- [ ] Target tags (e, p)
- [ ] Edge: report non-existent content

### Checklist: Media NIPs

#### NIP-23: Long-form Content
- [ ] kind:30023 article event
- [ ] d-tag (identifier)
- [ ] title tag
- [ ] summary tag
- [ ] published_at tag
- [ ] Markdown content
- [ ] naddr encoding
- [ ] Edge: articles without identifier

#### NIP-92: Media Attachments
- [ ] imeta tags
- [ ] url, m (mime), alt, dim, blurhash, x (hash)
- [ ] attachMedia() builder
- [ ] parseImetaTags() helper
- [ ] Multiple attachments
- [ ] Edge: invalid MIME types

#### NIP-94: File Metadata
- [ ] kind:1063 file metadata event
- [ ] url, m, x, ox, size, dim, blurhash
- [ ] Event can be empty (just metadata)
- [ ] Integration with NIP-96
- [ ] Edge: metadata without file

#### NIP-96: HTTP File Storage
- [ ] Discovery via /.well-known/nostr/nip96.json
- [ ] Upload (multipart/form-data)
- [ ] NIP-98 auth integration
- [ ] Response parsing (nip94_event)
- [ ] Error handling
- [ ] Edge: upload failures

### Checklist: Advanced NIPs

#### NIP-13: Proof of Work (TODO)
- [ ] Mining algorithm
- [ ] nonce tag
- [ ] Difficulty calculation
- [ ] Validation
- [ ] Edge: invalid difficulty

#### NIP-40: Expiration (TODO)
- [ ] expiration tag
- [ ] Cache cleanup on expiry
- [ ] Query excludes expired
- [ ] Edge: already expired events

#### NIP-46: Nostr Connect
- [ ] Client-initiated pairing
- [ ] nostrconnect:// URI
- [ ] RPC request/response
- [ ] Multi-relay communication
- [ ] ACK waiting
- [ ] Capabilities negotiation
- [ ] Edge: remote signer offline

#### NIP-57: Zaps (EXPAND)
- [ ] LNURL-pay flow
- [ ] Zap request (kind:9734)
- [ ] Zap receipt (kind:9735)
- [ ] Amount validation
- [ ] Callback verification
- [ ] Edge: invalid LNURL

#### NIP-98: HTTP Auth
- [ ] kind:27235 HTTP auth event
- [ ] u-tag (URL)
- [ ] method tag (GET/POST/etc.)
- [ ] Authorization header building
- [ ] Edge: expired auth events

---

## 🚀 Implementation Plan

### Sprint 1: Critical Gaps (Woche 1)
**Goal:** Fix relay management + fill core social NIP gaps

**Tasks:**
```bash
# 1. Relay Management Tests
✅ Create: tests-v2/02-protocol-compliance/relay/nip65-relay-routing.test.ts
  - Test: manual relays override auto-selection
  - Test: NIP-65 routing fallback
  - Test: routing-sensitive events (communities, DMs)
  
✅ Create: tests-v2/03-integration/relay-routing-with-communities.test.ts
  - Test: community posts go to correct relay
  - Test: approvals go to approval relay
  - Test: resolveRelays() timeout handling

# 2. Core Social NIPs
✅ Create: tests-v2/02-protocol-compliance/social/nip02-follow-list-complete.test.ts
  - Test: all follow list operations
  - Test: petname + relay parsing
  - Test: batch operations
  - Test: edge cases (duplicates, removals)

✅ Create: tests-v2/02-protocol-compliance/social/nip10-threading-complex.test.ts
  - Test: complex thread structures
  - Test: root vs reply vs mention
  - Test: positional vs marked tags
  - Test: thread traversal

✅ Expand: tests-v2/03-social/reactions.test.ts
  - Add: custom emoji reactions
  - Add: unreact flow validation
  - Add: reaction count aggregation
  - Add: multi-user reaction scenarios

✅ Expand: tests-v2/03-social/lists.test.ts
  - Add: all list types (30000-30003)
  - Add: CRUD operations
  - Add: query operations
  - Add: edge cases (empty, invalid)
```

### Sprint 2: Missing NIPs (Woche 2-3)
**Goal:** Implement + test high-priority missing NIPs

**Tasks:**
```bash
# 1. NIP-13: Proof of Work
✅ Implement: src/core/ProofOfWork.ts
  - Mining function
  - Difficulty calculation
  - Validation function

✅ Create: tests-v2/02-protocol-compliance/advanced/nip13-pow.test.ts
  - Test: mining produces valid nonce
  - Test: difficulty validation
  - Test: edge cases (invalid difficulty)

# 2. NIP-40: Expiration
✅ Implement: src/core/EventExpiration.ts
  - Expiration tag support
  - Cache cleanup logic
  - Query filtering

✅ Create: tests-v2/02-protocol-compliance/advanced/nip40-expiration.test.ts
  - Test: events expire correctly
  - Test: cache removes expired
  - Test: query excludes expired
  - Test: edge cases (already expired)

# 3. NIP-56: Reporting
✅ Implement: src/social/moderation/ReportingModule.ts
  - kind:1984 report creation
  - Report types (spam, illegal, etc.)
  - Query reports

✅ Create: tests-v2/02-protocol-compliance/moderation/nip56-reporting.test.ts
  - Test: all report types
  - Test: query reports for event
  - Test: query reports for user
  - Test: edge cases (report non-existent)

# 4. NIP-57: Zaps (Complete)
✅ Expand: src/social/payments/ZapModule.ts
  - LNURL-pay flow
  - Callback validation
  - payProfile() / payNote() completion

✅ Expand: tests-v2/03-social/zaps-nip57.test.ts
  - Test: LNURL flow
  - Test: zap request creation
  - Test: zap receipt validation
  - Test: amount validation
  - Test: edge cases (invalid LNURL)
```

### Sprint 3: Performance & Integration (Woche 4)
**Goal:** Validate performance + multi-module integration

**Tasks:**
```bash
# 1. Performance Tests
✅ Create: tests-v2/04-performance/cache-performance.test.ts
  - Test: <10ms for cached queries (99th percentile)
  - Test: cache hit rate >90% for repeated queries
  - Test: O(log n) performance for indexed queries

✅ Create: tests-v2/04-performance/subscription-dedup.test.ts
  - Test: identical subscriptions share underlying REQ
  - Test: subscription reuse metrics
  - Test: memory overhead of subscriptions

✅ Create: tests-v2/04-performance/large-feed-rendering.test.ts
  - Test: 1000+ events query performance
  - Test: memory usage with large feeds
  - Test: pagination performance

✅ Create: tests-v2/04-performance/memory-leak-detection.test.ts
  - Test: LRU eviction works
  - Test: no memory growth over time
  - Test: resource cleanup on disconnect

# 2. Integration Tests
✅ Create: tests-v2/03-integration/dm-with-relay-routing.test.ts
  - Test: DMs use recipient's NIP-65 relays
  - Test: fallback when no relay list
  - Test: multi-relay redundancy

✅ Create: tests-v2/03-integration/community-full-flow.test.ts
  - Test: create → post → approve → query
  - Test: moderation workflow
  - Test: relay routing for all operations

✅ Create: tests-v2/03-integration/profile-follow-integration.test.ts
  - Test: profile + follow list + relay list
  - Test: discovery via NIP-05
  - Test: batch follow operations

✅ Create: tests-v2/03-integration/content-moderation-flow.test.ts
  - Test: content warning + labels + reports
  - Test: moderation actions flow
  - Test: query moderated content
```

### Sprint 4: Edge Cases & Hardening (Woche 5)
**Goal:** Robustness and error handling

**Tasks:**
```bash
# 1. Edge Case Tests
✅ Create: tests-v2/05-edge-cases/relay-failures.test.ts
  - Test: relay disconnect during publish
  - Test: all relays down scenario
  - Test: partial relay failure
  - Test: relay reconnection

✅ Create: tests-v2/05-edge-cases/partial-subscription-failures.test.ts
  - Test: some relays timeout
  - Test: mixed success/failure
  - Test: EOSE from subset of relays

✅ Create: tests-v2/05-edge-cases/invalid-events.test.ts
  - Test: malformed JSON
  - Test: invalid signatures
  - Test: missing required fields
  - Test: invalid kinds/tags

✅ Create: tests-v2/05-edge-cases/encryption-failures.test.ts
  - Test: corrupted ciphertext
  - Test: wrong keys
  - Test: failed gift wrap unwrap
  - Test: partial decryption success
```

---

## 📊 Success Metrics

### Coverage Targets
- **Unit Tests:** 95%+ line coverage
- **Integration Tests:** 90%+ scenario coverage
- **NIP Compliance:** 100% of implemented NIPs tested
- **Performance:** 100% of assertions passing

### Quality Gates
- ✅ All tests pass (100% success rate)
- ✅ No flaky tests (deterministic)
- ✅ Performance assertions met
- ✅ Zero architecture violations

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start test relay
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 5  # Wait for relay to start
      
      - name: Run tests
        run: npm run test:v2
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      
      - name: Stop test relay
        if: always()
        run: docker-compose -f docker-compose.test.yml down
```

---

## 🔍 Final Checklist

### Before Starting Implementation
- [ ] Review NIP specifications
- [ ] Understand architecture layers
- [ ] Set up test environment
- [ ] Verify relay container works

### During Implementation
- [ ] Follow test template
- [ ] Include happy path + edge cases
- [ ] Add performance assertions
- [ ] Document test purpose
- [ ] Verify architecture compliance

### After Implementation
- [ ] All tests pass
- [ ] Coverage targets met
- [ ] Performance benchmarks pass
- [ ] Documentation updated
- [ ] CI/CD integration verified

---

*Blueprint Version: 1.0*  
*Last Updated: 2025-10-05*  
*Next Review: After Sprint 1*

