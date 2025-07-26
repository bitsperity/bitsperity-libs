# Session 3: NIP-17 Private Direct Messages - Requirements Analysis

## Overview
Implement NIP-17 Private Direct Messages with 100% specification compliance for interoperability with other Nostr clients (Damus, Amethyst, etc.).

## Target API (Simple Interface)
```typescript
// High-level API that hides complexity
const nostr = new NostrUnchained();

// Single recipient conversation
const conversation = nostr.dm.with('npub1234...');
await conversation.send("Hello!");

// Multi-recipient conversation with subject
const groupChat = nostr.dm.withSubject('Project Planning', ['npub1...', 'npub2...', 'npub3...']);
await groupChat.send("Meeting at 3pm");

// Subject-based conversation identity
$: messages = $conversation.messages;
$: groupMessages = $groupChat.messages;
```

## Complex Backend Requirements (NIP-17 Spec Compliance)

### 3-Layer Encryption Process (Per Recipient)
```
Message "Hello!" to Recipients [A, B, C]
↓
1. Rumor (kind 14, unsigned): {"content": "Hello!", "kind": 14, "subject": "Project Planning", ...}
↓  
2. Seal (kind 13): NIP-44 encrypt rumor, sign with sender key
↓
3. Gift Wrap A (kind 1059): NIP-44 encrypt seal with random key for recipient A
4. Gift Wrap B (kind 1059): NIP-44 encrypt seal with random key for recipient B  
5. Gift Wrap C (kind 1059): NIP-44 encrypt seal with random key for recipient C
↓
6. Randomize timestamps (up to 2 days past, different for each)
↓
7. Send Gift Wrap A to A's inbox relays (kind 10050)
8. Send Gift Wrap B to B's inbox relays (kind 10050)
9. Send Gift Wrap C to C's inbox relays (kind 10050)
```

### Subject-Based Conversation Identity
- **Subject field**: Part of rumor content, encrypted and shared among all recipients
- **Conversation threading**: Messages with same subject form a conversation thread
- **Group identity**: Subject + participant list defines unique conversation
- **Privacy**: Subject is encrypted, only visible to conversation participants

## Critical Dependencies

### 1. NIP-44 v2 Encryption
- **secp256k1 ECDH**: Elliptic curve Diffie-Hellman key exchange
- **HKDF**: HMAC-based Key Derivation Function
- **ChaCha20**: Stream cipher for encryption
- **HMAC-SHA256**: Message authentication
- **base64**: Encoding for wire format

### 2. NIP-59 Gift Wrap Protocol
- Seals: Encrypted events signed by sender
- Gift wraps: Double-encrypted events with random keys
- Timestamp randomization for privacy

### 3. NIP-17 Message Types
- **Kind 14**: Private direct message rumors (unsigned)
- **Kind 15**: Private direct message responses (unsigned)
- **Kind 13**: Seals (signed encrypted events)
- **Kind 1059**: Gift wraps (encrypted seals)

### 4. Kind 10050 Relay Discovery
- Inbox relay lists for message delivery
- Outbox relay lists for message retrieval

## Functional Requirements

### FR1: NIP-44 v2 Cryptography
- Implement ECDH key derivation
- Implement ChaCha20-Poly1305 encryption
- Implement HMAC-SHA256 authentication
- Support conversation keys and nonce handling

### FR2: NIP-59 Gift Wrap Protocol
- Create and encrypt seals (kind 13)
- Create and encrypt gift wraps (kind 1059)
- Generate ephemeral keys for gift wraps
- Randomize timestamps within spec limits

### FR3: NIP-17 Direct Messages
- Create kind 14/15 rumor events with subject field
- Implement 3-layer encryption pipeline per recipient
- Handle multi-recipient message distribution
- Support subject-based conversation threading
- Support message replies and reactions

### FR4: Relay Integration
- Discover inbox relays via kind 10050
- Publish to recipient's inbox relays
- Subscribe to own inbox for incoming messages
- Handle relay failures gracefully

### FR5: Conversation Management
- Track conversation state by subject + participants
- Handle message ordering across multiple recipients
- Support read receipts (optional)
- Maintain conversation history with proper threading
- Group conversation participant management
- Subject-based conversation discovery and joining

## Non-Functional Requirements

### NFR1: Security
- Zero knowledge of message content by relays
- Forward secrecy through ephemeral keys
- Timestamp privacy through randomization
- Metadata minimization

### NFR2: Interoperability
- 100% NIP-17 specification compliance
- Compatible with Damus, Amethyst, etc.
- Standard test vectors validation
- Cross-client message exchange

### NFR3: Performance
- Efficient key derivation and caching
- Batch encryption for multiple messages
- Lazy loading of conversation history
- Minimal relay round trips

### NFR4: Usability
- Simple API hiding complexity
- Real-time message delivery
- Conversation state management
- Error handling and recovery

## Technical Constraints

### TC1: Cryptographic Standards
- Must use secp256k1 curve
- Must use ChaCha20-Poly1305 AEAD
- Must use HMAC-SHA256
- Must follow HKDF-SHA256 key derivation

### TC2: Protocol Compliance
- Exact NIP-17 timestamp randomization
- Proper NIP-44 nonce generation
- Correct NIP-59 event structure
- Valid nostr event signatures

### TC3: Integration Requirements
- Build on existing QueryBuilder
- Use SubscriptionManager for real-time
- Leverage RelayManager for publishing
- Extend existing crypto utilities

## Success Criteria

### SC1: Specification Compliance
- [ ] All NIP-17 test vectors pass
- [ ] All NIP-44 test vectors pass
- [ ] All NIP-59 test vectors pass
- [ ] Compatible with reference implementations

### SC2: API Usability
- [ ] Simple conversation interface works
- [ ] Real-time message delivery
- [ ] Message history retrieval
- [ ] Error handling coverage

### SC3: Security Validation
- [ ] No plaintext message leakage
- [ ] Proper key isolation
- [ ] Timestamp privacy maintained
- [ ] Forward secrecy verified

### SC4: Integration Testing
- [ ] Works with existing components
- [ ] Multi-relay message delivery
- [ ] Conversation persistence
- [ ] Performance benchmarks met

## Implementation Dependencies

### Existing Components to Leverage
- `QueryBuilder` - Message retrieval and filtering
- `SubscriptionManager` - Real-time message subscriptions
- `RelayManager` - Multi-relay publishing and connection management
- `EventBuilder` - Basic event creation utilities
- `NostrStore` - Event storage and caching

### New Components Required
- `NIP44Crypto` - NIP-44 v2 encryption implementation
- `GiftWrapManager` - NIP-59 gift wrap protocol with multi-recipient support
- `DMConversation` - High-level conversation interface with subject support
- `GroupConversation` - Multi-recipient conversation management
- `InboxManager` - Kind 10050 relay discovery and management
- `PrivateMessageBuilder` - NIP-17 specific event builders with subject handling
- `ConversationIdentity` - Subject + participant-based conversation tracking

## Risk Analysis

### High Risk Areas
1. **Cryptographic Implementation**: Complex multi-layer encryption
2. **Specification Compliance**: Must match reference implementations exactly
3. **Key Management**: Secure handling of ephemeral and conversation keys
4. **Timestamp Randomization**: Privacy-preserving timing

### Mitigation Strategies
1. Use well-tested cryptographic libraries
2. Implement comprehensive test vectors
3. Follow reference implementation patterns
4. Extensive integration testing with other clients