# DM Fix Session Requirements - Agent-to-Agent Output

## Executive Summary
**Milestone**: Fix 4 critical P0 DM failures blocking core functionality
**Timeline**: 5 days maximum 
**Success Criteria**: All DM tests passing + Zero-Config DX implementation

## Functional Requirements

### FR-1: Message Reception Fix (Priority: P0)
**Requirement**: DMs must be received and stored in conversation
**Current State**: `should send and receive messages with real end-to-end encryption` FAILING
**Target Behavior**: 
- Gift-wrapped events (kind 1059) filtered correctly in subscription
- Decrypted messages auto-added to conversation store
- Real-time reactive updates in UI components

**Acceptance Criteria**:
- [ ] Messages sent by Alice appear in Bob's conversation store
- [ ] Subscription filters `kinds: [1059], "#p": [recipientPubkey]` 
- [ ] Auto-decryption pipeline: gift wrap → seal → rumor → conversation
- [ ] Store reactivity triggers UI updates immediately

### FR-2: Bidirectional Conversation Fix (Priority: P0)  
**Requirement**: Both participants see all messages in shared conversation
**Current State**: `should handle bidirectional conversation with real crypto` FAILING - expects 2 messages, gets 1
**Target Behavior**:
- Alice sends message → appears in Alice's and Bob's conversation
- Bob replies → appears in both conversations  
- Message aggregation by conversation ID, not sender

**Acceptance Criteria**:
- [ ] Bidirectional test shows 2 messages (Alice → Bob, Bob → Alice)
- [ ] Conversation store aggregates messages from all participants
- [ ] Message deduplication prevents duplicates
- [ ] Sender identification preserved in message metadata

### FR-3: Subject Threading Fix (Priority: P0)
**Requirement**: Subject field must be extracted and preserved through encryption layers
**Current State**: `should handle conversation with subject threading` FAILING - "Cannot read properties of undefined (reading 'subject')"
**Target Behavior**:
- Subject preserved in rumor event during gift wrap creation
- Subject extracted during decryption and stored with message
- Room identity includes subject: `participants + subject = room ID`

**Acceptance Criteria**:
- [ ] Subject field accessible in decrypted message objects
- [ ] Room.id includes subject in identity calculation
- [ ] Subject threading works across conversation sessions
- [ ] Subject changes create new room contexts

### FR-4: Multi-participant Room Fix (Priority: P1)
**Requirement**: Group rooms with >2 participants must work correctly  
**Current State**: `should create and manage room with real encryption` FAILING
**Target Behavior**:
- Messages sent to all room participants individually
- Each participant receives all messages from all other participants
- Room identity based on full participant list + subject

**Acceptance Criteria**:
- [ ] 3+ participant rooms receive all messages
- [ ] Message broadcasting to each participant via individual gift wraps
- [ ] Room message aggregation across all participants
- [ ] Participant addition/removal creates new room identity

## Non-Functional Requirements

### NFR-1: Zero-Config Developer Experience
**Requirement**: Perfect DX through elegant, generic architecture
**Implementation**: Query/Sub symmetry with universal cache

**Design Principles**:
- **Identical APIs**: `query()` and `sub()` have same fluent interface
- **DMs are queries**: No special DM logic - just `query().kinds([14])`
- **Auto-decryption**: Gift wraps unwrapped transparently
- **Universal encryption**: ANY event type can be encrypted

### NFR-2: Performance & Reliability
**Requirement**: DM functionality must be production-ready
**Targets**:
- **Latency**: <100ms message delivery (local processing)
- **Memory**: Bounded cache size with LRU eviction
- **Reliability**: 99.9% message delivery success rate
- **Concurrency**: Support 10+ simultaneous conversations

### NFR-3: Protocol Compliance
**Requirement**: Perfect adherence to NIP-17, NIP-44, NIP-59
**Validation**:
- **NIP-17**: Kind 14 events, proper p-tags, subject handling
- **NIP-44**: Version 2 encryption, proper key derivation
- **NIP-59**: 3-layer gift wrap structure, timestamp obfuscation

## Technical Constraints

### TC-1: Backward Compatibility
**Constraint**: Existing DM API must remain functional
**Current API**: `nostr.dm.with(pubkey).send(message)`
**Requirement**: No breaking changes to public interfaces

### TC-2: Architecture Migration
**Constraint**: Migrate to 4-layer design without disrupting working features
**Approach**: Incremental layer implementation with feature flags

### TC-3: Test Coverage
**Constraint**: All fixes must have corresponding test coverage
**Requirement**: 95%+ test coverage for DM functionality

## Implementation Strategy

### Phase 1: Universal Event Cache (Day 1)
**Focus**: Core cache with auto-decryption
- Implement UniversalEventCache with efficient indexing
- Auto-unwrap gift wraps (kind 1059) transparently
- O(log n) query performance with proper indexes
- Memory management with configurable limits

### Phase 2: Query/Sub Engine (Day 2)
**Focus**: Perfect API symmetry
- QueryBuilder for cache lookups
- SubBuilder for live subscriptions
- Unified NostrStore interface
- Simple subscription deduplication

### Phase 3: Protocol Fixes & Integration (Day 3)
**Focus**: Fix bugs and wire up cache
- Fix NIP44Crypto.validatePayload bug
- Enhance GiftWrapProtocol for universal events
- Integrate cache with NostrUnchained
- Start gift wrap subscription on init

### Phase 4: Specialized APIs (Day 4)
**Focus**: Convenience wrappers
- DMModule as simple query wrapper
- SocialModule for common queries
- ProfileModule for kind 0 events
- Backward compatibility maintained

### Phase 5: Testing & Optimization (Day 5)
**Focus**: End-to-end validation
- All DM tests passing
- Performance benchmarking
- Memory usage validation
- Documentation and examples

## Success Criteria

### Primary Success Metrics
1. **Test Success**: All 4 failing DM tests pass consistently
2. **API Simplicity**: DM usage requires <5 lines of code
3. **Protocol Compliance**: 100% adherence to NIPs 17, 44, 59
4. **Zero Regressions**: No existing functionality broken

### Secondary Success Metrics
1. **Performance**: <100ms local message processing
2. **Developer Experience**: Zero encryption knowledge required
3. **Universal Encryption**: Any event type can be gift-wrapped
4. **Documentation**: Complete API examples and tutorials

## Risk Mitigation

### High Risk: Complex State Management
**Risk**: Message flow coordination between subscription, decryption, and stores
**Mitigation**: Incremental testing with isolated layer validation

### Medium Risk: Real-time Reactivity
**Risk**: Store updates not triggering UI updates properly  
**Mitigation**: Dedicated reactivity tests with mock and real scenarios

### Low Risk: Protocol Security
**Risk**: Encryption/decryption implementation errors
**Mitigation**: Extensive crypto test coverage and NIP compliance validation

## Hand-off to System Design Agent

### Key Design Decisions Required
1. **Store Architecture**: Modify existing stores vs create conversation-specific stores
2. **Subscription Strategy**: Single universal subscription vs targeted subscriptions  
3. **Caching Strategy**: Memory management and cache eviction policies
4. **Error Handling**: Retry logic, graceful degradation, user feedback

### Technical Architecture Inputs
1. **Component Boundaries**: Which systems need modification for each layer
2. **Integration Points**: How new layers interact with existing NostrCore
3. **Performance Targets**: Latency, throughput, memory requirements
4. **Migration Path**: Incremental deployment strategy with feature flags

This requirements specification provides complete functional and technical requirements for fixing all DM failures while implementing the revolutionary 4-layer Zero-Config architecture.