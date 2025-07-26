# Session 3 Implementation Plan: NIP-17 Private Direct Messages

## Phase Overview
Implement NIP-17 Private Direct Messages following CLAUDE.md pipeline methodology with TDD approach.

## Implementation Phases

### Phase 1: NIP-44 v2 Cryptography Foundation 🔐
**Duration**: 2-3 dev sessions  
**Priority**: Critical - Everything depends on this

#### Tasks:
1. **Create NIP44Crypto Core**
   - Implement ECDH key derivation (secp256k1)
   - Implement HKDF key expansion (SHA256)
   - Implement ChaCha20 encryption/decryption
   - Implement HMAC-SHA256 authentication
   - Add custom padding scheme

2. **Key Management System**
   - ConversationKey caching (bidirectional)
   - Secure nonce generation (CSPRNG)
   - MessageKeys derivation pipeline
   - Memory-safe key handling

3. **Test Vector Validation**
   - Import official NIP-44 test vectors
   - Validate all encryption/decryption scenarios
   - Cross-test with reference implementations
   - Performance benchmarking

#### Success Criteria:
- [ ] All NIP-44 v2 test vectors pass
- [ ] Cross-compatible with reference implementations
- [ ] Constant-time operations verified
- [ ] Memory leaks prevention confirmed

### Phase 2: NIP-59 Gift Wrap Protocol 🎁
**Duration**: 2-3 dev sessions  
**Priority**: Critical - Core privacy mechanism

#### Tasks:
1. **Rumor Builder (Kind 14/15)**
   - Create unsigned event structure
   - Support subject tags for conversation threading
   - Multi-recipient p-tag handling
   - Validation and sanitization

2. **Seal Manager (Kind 13)**
   - NIP-44 encrypt rumor content
   - Sign with sender's private key
   - Timestamp randomization (±2 days)
   - Seal verification and decryption

3. **Gift Wrap Manager (Kind 1059)**
   - Ephemeral key generation (per recipient)
   - NIP-44 encrypt seal with ephemeral key
   - Multi-recipient gift wrap creation
   - Gift wrap unwrapping and validation

4. **Timestamp Privacy**
   - Randomization algorithm (up to 2 days past)
   - Consistent randomization across layers
   - Timezone-aware implementation
   - Replay attack prevention

#### Success Criteria:
- [ ] Proper 3-layer encryption (rumor→seal→gift wrap)
- [ ] Ephemeral keys are single-use and secure
- [ ] Timestamp randomization prevents correlation
- [ ] Multi-recipient support working correctly

### Phase 3: Conversation Management & Threading 💬
**Duration**: 2-3 dev sessions  
**Priority**: High - User experience foundation

#### Tasks:
1. **Conversation Identity System**
   - Subject + participants hashing
   - Conversation ID generation
   - Thread matching and discovery
   - Participant management (add/remove)

2. **Conversation Store**
   - Message storage and retrieval
   - Conversation metadata management
   - Message ordering with randomized timestamps
   - History pagination and limits

3. **Real-time Message Flow**
   - Incoming message processing pipeline
   - Conversation routing and threading
   - Message deduplication
   - Error handling and recovery

4. **Group Conversation Logic**
   - Multi-participant conversation creation
   - Subject-based thread identification
   - Participant list synchronization
   - Group dynamics handling

#### Success Criteria:
- [ ] Messages correctly threaded by subject + participants
- [ ] Real-time conversation updates working
- [ ] Group conversations properly managed
- [ ] Message history persists correctly

### Phase 4: Relay Integration & Inbox Management 📡
**Duration**: 2-3 dev sessions  
**Priority**: High - Message delivery mechanism

#### Tasks:
1. **Kind 10050 Relay Discovery**
   - Parse DM inbox relay lists
   - Fallback to general relay lists
   - Relay preference handling (read/write)
   - Relay availability checking

2. **Message Delivery System**
   - Multi-relay publishing strategy
   - Delivery confirmation tracking
   - Retry logic for failed deliveries
   - Partial delivery handling

3. **Inbox Subscription Management**
   - Subscribe to user's inbox relays
   - Filter for kind 1059 gift wraps
   - Real-time message reception
   - AUTH-protected relay support

4. **Relay Coordination**
   - Optimal relay selection algorithms
   - Load balancing across relays
   - Network error handling
   - Relay blacklisting/failover

#### Success Criteria:
- [ ] Messages delivered to correct inbox relays
- [ ] Inbox subscriptions receive messages real-time
- [ ] Delivery failures handled gracefully
- [ ] Relay discovery working correctly

### Phase 5: High-Level DM API Implementation 🎯
**Duration**: 2-3 dev sessions  
**Priority**: Medium - User interface layer

#### Tasks:
1. **DMManager Main Interface**
   - Simple conversation creation API
   - Message sending with error handling
   - Conversation listing and filtering
   - Real-time message subscriptions

2. **Conversation Objects**
   - DMConversation (1:1 messages)
   - GroupConversation (multi-recipient)
   - Message history access
   - Typing indicators (optional)

3. **Integration with NostrUnchained**
   - Extend main NostrUnchained class
   - Integrate with existing QueryBuilder
   - Use SubscriptionManager for real-time
   - Leverage RelayManager for connections

4. **Error Handling & UX**
   - User-friendly error messages
   - Delivery status indicators
   - Message state tracking (sent/delivered/read)
   - Offline message queuing

#### Success Criteria:
- [ ] Simple API: `nostr.dm.with(pubkey).send("hello")`
- [ ] Group API: `nostr.dm.withSubject("topic", [pubkeys])`
- [ ] Real-time message updates: `$conversation.messages`
- [ ] Error handling provides useful feedback

### Phase 6: Testing & Validation 🧪
**Duration**: 2-3 dev sessions  
**Priority**: Critical - Interoperability assurance

#### Tasks:
1. **Comprehensive Test Suite**
   - Unit tests for all crypto operations
   - Integration tests for message flow
   - End-to-end tests with real relays
   - Performance and stress testing

2. **Cross-Client Compatibility**
   - Test with Damus message format
   - Test with Amethyst encryption
   - Validate against reference implementations
   - Test message exchange scenarios

3. **Security Validation**
   - Cryptographic audit checklist
   - Metadata leakage analysis
   - Timing attack resistance
   - Memory safety verification

4. **Production Readiness**
   - Error rate monitoring
   - Performance profiling
   - Memory usage optimization
   - Documentation completion

#### Success Criteria:
- [ ] 100% test coverage for crypto operations
- [ ] Cross-client message exchange works
- [ ] Security audit passes all checks
- [ ] Performance meets benchmarks

## Development Strategy

### TDD Approach
1. **Write Tests First**: Start with test vectors and expected behaviors
2. **Red-Green-Refactor**: Make tests pass, then optimize
3. **Integration Tests**: Test real relay interactions early
4. **Cross-Client Validation**: Test with other Nostr clients regularly

### Risk Mitigation
1. **Crypto Implementation**: Use well-tested libraries where possible
2. **Specification Compliance**: Validate against official test vectors
3. **Multi-Recipient Complexity**: Start with 1:1 messages, then scale
4. **Performance**: Profile early and optimize bottlenecks

### Dependencies Integration
- **QueryBuilder**: Use for message history queries
- **SubscriptionManager**: Real-time message subscriptions
- **RelayManager**: Connection pooling and management
- **EventBuilder**: Extend for DM-specific event creation
- **NostrStore**: Message persistence and caching

## File Structure
```
src/
├── dm/
│   ├── crypto/
│   │   ├── NIP44Crypto.ts
│   │   ├── KeyManager.ts
│   │   └── NonceGenerator.ts
│   ├── protocol/
│   │   ├── RumorBuilder.ts
│   │   ├── SealManager.ts
│   │   └── GiftWrapManager.ts
│   ├── conversation/
│   │   ├── ConversationManager.ts
│   │   ├── ConversationIdentity.ts
│   │   └── ConversationStore.ts
│   ├── transport/
│   │   ├── InboxManager.ts
│   │   ├── RelayDiscovery.ts
│   │   └── MessageDelivery.ts
│   ├── api/
│   │   ├── DMManager.ts
│   │   ├── DMConversation.ts
│   │   └── GroupConversation.ts
│   └── types/
│       ├── dm-types.ts
│       └── crypto-types.ts
├── test-vectors/
│   ├── nip44-vectors.json
│   ├── nip59-vectors.json
│   └── nip17-vectors.json
└── tests/
    ├── unit/
    │   ├── nip44-crypto.test.ts
    │   ├── gift-wrap.test.ts
    │   └── conversation.test.ts
    ├── integration/
    │   ├── message-flow.test.ts
    │   ├── cross-client.test.ts
    │   └── relay-integration.test.ts
    └── e2e/
        ├── dm-scenarios.test.ts
        └── group-messaging.test.ts
```

## Success Metrics
1. **Specification Compliance**: 100% test vector pass rate
2. **Cross-Client Compatibility**: Messages work with 3+ other clients
3. **Performance**: <100ms encryption time, <500ms delivery time
4. **Security**: Pass security audit, no metadata leakage
5. **Usability**: Simple API that hides complexity completely

This plan ensures step-by-step implementation with validation at each phase, building toward a robust and interoperable NIP-17 implementation.