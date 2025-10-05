# 🎯 Nostr-Unchained: Immediate Action Plan
> Start: 2025-10-05  
> Goal: Production-Ready Library in 5 Wochen

---

## 📌 Quick Summary

**Du hast vollkommen Recht:** Die parallele Demo-App-Entwicklung war verfrüht. Die Library ist zu ~80% fertig, aber die kritischen 20% (Relay-Management + vollständige Tests) fehlen für Production-Use.

**Strategy:** Library-First. Erst 100% stabile, getestete Library, DANN Demo-App.

---

## 🔴 Sprint 1: Relay-Management Fix (Woche 1)

### Tag 1-2: Analyze & Fix Double Resolution

#### Task 1: Fix `FluentEventBuilder.publish()`
```bash
# File: src/events/FluentEventBuilder.ts

# Current Problem (Zeile 279-281):
# - targetRelays werden gesetzt, aber publish() ignoriert sie manchmal
# - autoSelectRelaysForEvent() überschreibt manuelle Relays

# Fix:
# - Pass targetRelays to publish() as options parameter
# - Ensure publishToRelaysSmart() is used when targetRelays exist
```

**Konkrete Änderung:**
```typescript
// src/events/FluentEventBuilder.ts:~270-290
async publish(): Promise<PublishResult> {
  // ... existing validation ...
  
  const eventData = {
    pubkey,
    kind: this.eventData.kind || 1,
    content: this.eventData.content,
    tags: this.eventData.tags,
    created_at: this.eventData.created_at || Math.floor(Date.now() / 1000)
  };

  // PRIORITY: Manual targetRelays ALWAYS win
  if (this.targetRelays && this.targetRelays.length > 0) {
    // Direct to publishToRelaysSmart → bypasses autoSelectRelaysForEvent
    return await this.nostrInstance.publishToRelaysSmart(
      eventData, 
      this.targetRelays
    );
  }
  
  // No manual relays → use normal publish (with auto-selection)
  return await this.nostrInstance.publish(eventData);
}
```

**Test:**
```typescript
// tests-v2/02-protocol-compliance/relay/manual-relay-priority.test.ts
describe('Manual Relay Priority', () => {
  it('should use manually specified relays and NOT auto-select', async () => {
    const manualRelay = 'ws://localhost:7777';
    
    const result = await alice.nostr.events.create()
      .kind(1)
      .content('Test')
      .toRelays(manualRelay)  // Manual relay
      .publish();
    
    // Should publish to manual relay ONLY
    expect(result.relayResults).toHaveLength(1);
    expect(result.relayResults[0].relay).toBe(manualRelay);
  });
});
```

#### Task 2: Improve `resolveRelays()` in CommunitiesModule

```bash
# File: src/social/communities/CommunitiesModule.ts:209-253
```

**Konkrete Änderungen:**
```typescript
// src/social/communities/CommunitiesModule.ts
async resolveRelays(
  authorPubkey: string, 
  identifier: string, 
  timeoutMs: number = 2000  // ← Increased from 1000ms
): Promise<{ author?: string; requests?: string; approvals?: string }> {
  const addr = `34550:${authorPubkey}:${identifier}`;
  
  // 1. Cache check (quick return)
  const cached = this.relayMap.get(addr);
  if (cached && (cached.author || cached.requests || cached.approvals)) {
    if (this.nostr.getDebug()) {
      console.log('✅ Community relays from cache:', cached);
    }
    return cached;
  }
  
  // 2. Query ALL relays (not just connected)
  const allRelays = Array.from(new Set([
    ...this.nostr.relayManager.connectedRelays,
    ...this.nostr.config.relays
  ]));
  
  if (this.nostr.getDebug()) {
    console.log('🔍 Resolving community relays:', {
      author: authorPubkey.slice(0, 8),
      identifier,
      searchingRelays: allRelays
    });
  }
  
  // 3. Start subscription (explicitly to all relays)
  await this.nostr.sub()
    .kinds([34550])
    .authors([authorPubkey])
    .relays(allRelays)
    .execute();
  
  // 4. Query cache
  const store = this.nostr.query()
    .kinds([34550])
    .authors([authorPubkey])
    .execute();
  
  let latest = pickLatest((store as any).current || [], identifier);
  
  // 5. Wait for result (with longer timeout)
  if (!latest) {
    latest = await new Promise((resolve) => {
      const timer = setTimeout(() => {
        unsub();
        resolve(null);
      }, Math.max(2000, timeoutMs));  // Min 2 seconds
      
      const unsub = store.subscribe((events) => {
        const l = pickLatest(events, identifier);
        if (l) {
          clearTimeout(timer);
          unsub();
          resolve(l);
        }
      });
    });
  }
  
  // 6. Extract relays or return empty
  if (latest) {
    const relays = this.learnRelaysFromEvent(latest);
    this.relayMap.set(addr, relays);
    
    if (this.nostr.getDebug()) {
      console.log('✅ Resolved community relays:', {
        author: authorPubkey.slice(0, 8),
        identifier,
        relays,
        cacheSize: (store as any).current?.length || 0
      });
    }
    
    return relays;
  }
  
  if (this.nostr.getDebug()) {
    console.warn('⚠️ Community NOT FOUND:', {
      author: authorPubkey.slice(0, 8),
      identifier,
      searchedRelays: allRelays,
      cacheSize: (store as any).current?.length || 0
    });
  }
  
  return {};
}
```

**Test:**
```typescript
// tests-v2/03-integration/community-relay-resolution.test.ts
describe('Community Relay Resolution', () => {
  it('should find community across multiple relays', async () => {
    // Create community on relay 1
    const result = await alice.nostr.communities
      .create(alice.publicKey)
      .identifier('test-cross-relay')
      .name('Cross-Relay Test')
      .relay('ws://localhost:7777', 'author')
      .publish();
    
    expect(result.success).toBe(true);
    
    // Wait for propagation
    await env.waitForPropagation(500);
    
    // Bob (connected to same relay) should find it
    const resolved = await (bob.nostr.communities as any).resolveRelays(
      alice.publicKey,
      'test-cross-relay',
      3000  // Generous timeout
    );
    
    expect(resolved.author).toBe('ws://localhost:7777');
  });
  
  it('should handle timeout gracefully when community not found', async () => {
    const resolved = await (alice.nostr.communities as any).resolveRelays(
      'nonexistent'.repeat(8),
      'fake-community',
      1000  // Short timeout
    );
    
    // Should return empty object (not throw)
    expect(resolved).toEqual({});
  });
});
```

### Tag 3-4: Test Implementation

**Create Tests:**
```bash
# 1. Relay Priority Test
touch tests-v2/02-protocol-compliance/relay/manual-relay-priority.test.ts

# 2. NIP-65 Routing Test
touch tests-v2/02-protocol-compliance/relay/nip65-relay-routing.test.ts

# 3. Community Relay Integration
touch tests-v2/03-integration/community-relay-resolution.test.ts
```

**Run & Validate:**
```bash
npm run test:relay:start
npm run test:v2 -- tests-v2/02-protocol-compliance/relay/
npm run test:v2 -- tests-v2/03-integration/community-relay-resolution.test.ts
npm run test:relay:stop
```

### Tag 5: Documentation & Review

**Update Docs:**
- [ ] Update README.md: Relay-Management-Sektion
- [ ] Add RELAY_ROUTING.md: Detailed guide
- [ ] Update CHANGELOG.md: Breaking changes (if any)

**Review Checklist:**
- [ ] All relay tests pass (100%)
- [ ] Manual relays ALWAYS override auto-selection
- [ ] resolveRelays() timeout increased to 2s
- [ ] Debug logging comprehensive
- [ ] No regressions in existing tests

---

## 🟡 Sprint 2: Core Social NIPs Complete (Woche 2)

### Monday: NIP-02 Follow Lists

```bash
# Create comprehensive test file
touch tests-v2/02-protocol-compliance/social/nip02-follow-list-complete.test.ts
```

**Test Coverage:**
- [ ] kind:3 event creation
- [ ] p-tag parsing (pubkey, relay, petname)
- [ ] Add follow
- [ ] Remove follow
- [ ] Batch add/remove
- [ ] Edge: duplicate follows
- [ ] Edge: invalid pubkeys
- [ ] Edge: very long petnames

**Implementation Check:**
```typescript
// Verify FollowsModule.ts has all features
// - Add single follow ✅
// - Remove follow ✅
// - Batch operations ✅
// - Parse existing list ✅
```

### Tuesday: NIP-10 Threading

```bash
touch tests-v2/02-protocol-compliance/social/nip10-threading-complex.test.ts
```

**Test Coverage:**
- [ ] Root marker (e-tag with "root")
- [ ] Reply marker (e-tag with "reply")
- [ ] Mention marker (e-tag with "mention")
- [ ] Positional tags (deprecated support)
- [ ] Complex thread (root → reply → reply to reply)
- [ ] Thread traversal (get all replies)
- [ ] Edge: reply without root

**Implementation Check:**
```typescript
// Verify ThreadModule.ts handles all tag types
```

### Wednesday: NIP-18 Reposts

```bash
# Expand existing test
vim tests-v2/03-social/reposts.test.ts
```

**Add Coverage:**
- [ ] Repost event structure
- [ ] Query reposts of event
- [ ] Count reposts
- [ ] Edge: repost own event
- [ ] Edge: repost of repost
- [ ] Edge: repost non-existent event

### Thursday: NIP-25 Reactions

```bash
# Expand existing test
vim tests-v2/03-social/reactions.test.ts
```

**Add Coverage:**
- [ ] Custom emoji reactions (🔥, ❤️, etc.)
- [ ] Text reactions ("+", "-")
- [ ] Unreact flow (kind:5 deletion)
- [ ] Aggregate reaction counts
- [ ] Multi-user reactions
- [ ] Edge: react twice
- [ ] Edge: react to non-existent event

### Friday: NIP-51 Lists

```bash
# Expand existing test
vim tests-v2/03-social/lists.test.ts
```

**Add Coverage:**
- [ ] kind:30000 (follow sets)
- [ ] kind:30001 (generic lists)
- [ ] kind:30002 (relay sets)
- [ ] kind:30003 (bookmark lists)
- [ ] CRUD operations (create, read, update, delete)
- [ ] Query operations (get list, get all lists)
- [ ] Edge: empty lists
- [ ] Edge: invalid d-tag

---

## 🟢 Sprint 3: Missing NIPs (Woche 3-4)

### Week 3: Implement NIPs

#### Monday-Tuesday: NIP-13 (Proof of Work)

**Implementation:**
```bash
# Create new module
touch src/core/ProofOfWork.ts
```

```typescript
// src/core/ProofOfWork.ts
export class ProofOfWork {
  /**
   * Mine event to meet difficulty target
   */
  static async mine(
    event: UnsignedEvent, 
    difficulty: number
  ): Promise<{ nonce: number; id: string }> {
    let nonce = 0;
    while (true) {
      const testEvent = { ...event, tags: [...event.tags, ['nonce', nonce.toString(), difficulty.toString()]] };
      const id = EventBuilder.calculateEventId(testEvent);
      
      if (this.checkDifficulty(id, difficulty)) {
        return { nonce, id };
      }
      nonce++;
    }
  }
  
  /**
   * Check if event ID meets difficulty
   */
  static checkDifficulty(eventId: string, targetDifficulty: number): boolean {
    let count = 0;
    for (const char of eventId) {
      if (char === '0') count++;
      else break;
    }
    return count >= targetDifficulty;
  }
  
  /**
   * Validate event has valid PoW
   */
  static validate(event: NostrEvent, requiredDifficulty: number): boolean {
    const nonceTag = event.tags.find(t => t[0] === 'nonce');
    if (!nonceTag) return false;
    
    const difficulty = parseInt(nonceTag[2] || '0');
    return this.checkDifficulty(event.id, requiredDifficulty);
  }
}
```

**Test:**
```bash
touch tests-v2/02-protocol-compliance/advanced/nip13-pow.test.ts
```

#### Wednesday-Thursday: NIP-40 (Expiration)

**Implementation:**
```bash
touch src/core/EventExpiration.ts
```

```typescript
// src/core/EventExpiration.ts
export class EventExpiration {
  /**
   * Check if event is expired
   */
  static isExpired(event: NostrEvent): boolean {
    const expirationTag = event.tags.find(t => t[0] === 'expiration');
    if (!expirationTag || !expirationTag[1]) return false;
    
    const expirationTime = parseInt(expirationTag[1]);
    return Date.now() / 1000 > expirationTime;
  }
  
  /**
   * Filter out expired events
   */
  static filterExpired(events: NostrEvent[]): NostrEvent[] {
    return events.filter(e => !this.isExpired(e));
  }
}
```

**Integration with Cache:**
```typescript
// src/cache/UniversalEventCache.ts
// Add periodic cleanup of expired events
private startExpirationCleanup() {
  setInterval(() => {
    for (const event of this.events.values()) {
      if (EventExpiration.isExpired(event)) {
        this.removeEvent(event.id);
      }
    }
  }, 60000); // Check every minute
}
```

**Test:**
```bash
touch tests-v2/02-protocol-compliance/advanced/nip40-expiration.test.ts
```

#### Friday: NIP-56 (Reporting)

**Implementation:**
```bash
touch src/social/moderation/ReportingModule.ts
```

```typescript
// src/social/moderation/ReportingModule.ts
export class ReportingModule {
  constructor(private nostr: NostrUnchained) {}
  
  /**
   * Report content or user
   */
  async report(opts: {
    target: string;          // event id or pubkey
    type: 'e' | 'p';         // event or profile
    reportType: 'spam' | 'illegal' | 'nudity' | 'profanity' | 'impersonation' | 'other';
    reason?: string;
  }): Promise<PublishResult> {
    const tags: string[][] = [
      [opts.type, opts.target],
      ['report', opts.reportType]
    ];
    
    if (opts.reason) {
      tags.push(['reason', opts.reason]);
    }
    
    return await this.nostr.events.create()
      .kind(1984)
      .content(opts.reason || '')
      .tags(tags)
      .publish();
  }
  
  /**
   * Query reports for event
   */
  queryReportsForEvent(eventId: string) {
    return this.nostr.query()
      .kinds([1984])
      .tags('e', [eventId])
      .execute();
  }
  
  /**
   * Query reports for user
   */
  queryReportsForUser(pubkey: string) {
    return this.nostr.query()
      .kinds([1984])
      .tags('p', [pubkey])
      .execute();
  }
}
```

**Integrate into NostrUnchained:**
```typescript
// src/core/NostrUnchained.ts
private _reporting?: ReportingModule;

get reporting(): ReportingModule {
  if (!this._reporting) {
    this._reporting = new ReportingModule(this);
  }
  return this._reporting;
}
```

**Test:**
```bash
touch tests-v2/02-protocol-compliance/moderation/nip56-reporting.test.ts
```

### Week 4: NIP-57 Zaps (Complete)

**Expand ZapModule:**
```typescript
// src/social/payments/ZapModule.ts
export class ZapModule {
  // Existing basic implementation
  
  /**
   * Complete LNURL-pay flow
   */
  async payProfile(
    recipientPubkey: string,
    amountSats: number,
    comment?: string
  ): Promise<{ invoice: string; zapReceipt?: NostrEvent }> {
    // 1. Get LNURL from profile (NIP-05 or metadata)
    const profile = await this.getProfile(recipientPubkey);
    const lnurl = this.extractLNURL(profile);
    
    // 2. Fetch LNURL-pay callback
    const callback = await this.fetchLNURLCallback(lnurl);
    
    // 3. Create zap request (kind:9734)
    const zapRequest = await this.createZapRequest({
      recipient: recipientPubkey,
      amount: amountSats * 1000, // convert to msats
      comment,
      relays: this.nostr.relays
    });
    
    // 4. Request invoice
    const invoice = await this.requestInvoice(callback, zapRequest, amountSats);
    
    // 5. Wait for zap receipt (kind:9735)
    const zapReceipt = await this.waitForZapReceipt(invoice);
    
    return { invoice, zapReceipt };
  }
  
  // ... implement helper methods
}
```

**Test:**
```bash
# Expand existing test
vim tests-v2/03-social/zaps-nip57.test.ts
```

---

## 🔵 Sprint 4: Performance & Integration (Woche 5)

### Performance Tests

```bash
mkdir -p tests-v2/04-performance
touch tests-v2/04-performance/cache-performance.test.ts
touch tests-v2/04-performance/subscription-dedup.test.ts
touch tests-v2/04-performance/large-feed-rendering.test.ts
touch tests-v2/04-performance/memory-leak-detection.test.ts
```

### Integration Tests

```bash
mkdir -p tests-v2/03-integration
touch tests-v2/03-integration/dm-with-relay-routing.test.ts
touch tests-v2/03-integration/community-full-flow.test.ts
touch tests-v2/03-integration/profile-follow-integration.test.ts
touch tests-v2/03-integration/content-moderation-flow.test.ts
```

---

## 🎯 Daily Workflow

### Morning (9:00 - 12:00)
1. **Review previous day's work**
2. **Run full test suite**
3. **Implement scheduled feature**
4. **Write tests for feature**

### Afternoon (13:00 - 17:00)
1. **Debug failing tests**
2. **Refactor if needed**
3. **Update documentation**
4. **Commit & push**

### Evening (optional)
1. **Review progress**
2. **Plan next day**
3. **Update sprint board**

---

## 📊 Progress Tracking

### Sprint 1 Checklist
- [ ] Day 1: Fix FluentEventBuilder
- [ ] Day 2: Fix resolveRelays()
- [ ] Day 3: Write relay tests
- [ ] Day 4: Integration tests
- [ ] Day 5: Documentation

### Sprint 2 Checklist
- [ ] Monday: NIP-02 complete
- [ ] Tuesday: NIP-10 complete
- [ ] Wednesday: NIP-18 complete
- [ ] Thursday: NIP-25 complete
- [ ] Friday: NIP-51 complete

### Sprint 3 Checklist (Week 3)
- [ ] Mon-Tue: NIP-13 POW
- [ ] Wed-Thu: NIP-40 Expiration
- [ ] Fri: NIP-56 Reporting

### Sprint 3 Checklist (Week 4)
- [ ] Mon-Fri: NIP-57 Zaps complete

### Sprint 4 Checklist
- [ ] Mon-Tue: Performance tests
- [ ] Wed-Thu: Integration tests
- [ ] Fri: Review & polish

---

## 🚀 Success Criteria

### Sprint 1
- ✅ Relay-Management: 0 race conditions
- ✅ Community posts: 100% correct relay
- ✅ All relay tests: PASS

### Sprint 2
- ✅ Core Social NIPs: 100% tested
- ✅ All social tests: PASS
- ✅ No missing edge cases

### Sprint 3
- ✅ Missing NIPs: Implemented
- ✅ All new NIPs: 100% tested
- ✅ All compliance tests: PASS

### Sprint 4
- ✅ Performance: <10ms cache hits
- ✅ Integration: All flows work
- ✅ 95%+ coverage

### Overall
- ✅ 100% test success rate
- ✅ 0 TODOs in critical paths
- ✅ Production-ready library

---

## 📝 Notes

### Git Workflow
```bash
# Feature branches
git checkout -b sprint-1/relay-management-fix
git checkout -b sprint-2/core-social-nips
git checkout -b sprint-3/missing-nips
git checkout -b sprint-4/performance-integration

# Commit frequently
git commit -m "fix: relay management double resolution"
git commit -m "test: add NIP-02 comprehensive tests"
git commit -m "feat: implement NIP-13 PoW"

# Merge to main after each sprint
git checkout main
git merge sprint-1/relay-management-fix
```

### Testing Commands
```bash
# Start relay
npm run test:relay:start

# Run all tests
npm run test:v2

# Run specific suite
npm run test:v2 -- tests-v2/02-protocol-compliance/relay/

# Watch mode
npm run test:v2 -- --watch

# Coverage
npm run test:v2 -- --coverage

# Stop relay
npm run test:relay:stop
```

### Documentation to Update
- [ ] README.md (features list)
- [ ] NIP_STATUS.md (implementation status)
- [ ] CHANGELOG.md (breaking changes)
- [ ] docs/ (API documentation)

---

*Action Plan erstellt: 2025-10-05*  
*Start: Montag, 2025-10-07*  
*Ende: Freitag, 2025-11-08 (5 Wochen)*

**Let's build a rock-solid Nostr library! 🚀**

