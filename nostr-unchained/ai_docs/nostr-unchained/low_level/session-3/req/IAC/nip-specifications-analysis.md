# NIP Specifications Deep Dive Analysis

## NIP-17: Private Direct Messages

### Core Specification Summary
NIP-17 defines encrypted direct messaging using NIP-44 encryption and NIP-59 gift wraps for maximum privacy and metadata protection.

### Message Types
- **Kind 14**: Chat messages (unsigned rumors)
- **Kind 15**: File messages (unsigned rumors)
- **Kind 13**: Seals (encrypted rumors, signed by sender)
- **Kind 1059**: Gift wraps (encrypted seals with ephemeral keys)

### Subject and Multi-Recipient Support
```json
{
  "kind": 14,
  "content": "Hello everyone!",
  "tags": [
    ["p", "recipient1_pubkey"],
    ["p", "recipient2_pubkey"], 
    ["p", "recipient3_pubkey"],
    ["subject", "Project Planning Meeting"]
  ],
  "created_at": 1234567890
}
```

**Critical Requirements:**
- **Subject field**: Optional tag that identifies conversation thread
- **Multi-recipient**: Each recipient gets individual gift wrap with same rumor
- **Unsigned rumors**: Kind 14/15 events MUST NEVER be signed
- **Individual encryption**: One gift wrap per recipient with ephemeral keys

### Privacy Features
- **No metadata leakage**: Participants, timestamps, kinds all hidden
- **No public identifiers**: No central queues or group markers
- **Deniability**: Unsigned rumors provide plausible deniability
- **Forward secrecy**: Through ephemeral keys in gift wraps

## NIP-44 v2: Encryption Specification

### Cryptographic Stack
```
secp256k1 ECDH → HKDF-SHA256 → ChaCha20 + HMAC-SHA256
```

### Encryption Process Detail

#### 1. Conversation Key Derivation
```typescript
// ECDH between sender private key and recipient public key
shared_x = secp256k1_ecdh(sender_private_key, recipient_public_key)

// HKDF Extract with fixed salt
conversation_key = HKDF_extract(
  hash: 'sha256',
  salt: utf8_encode('nip44-v2'),
  ikm: shared_x
)
```

#### 2. Per-Message Key Derivation
```typescript
// Generate random 32-byte nonce
nonce = random_bytes(32)

// HKDF Expand for message-specific keys
expanded = HKDF_expand(
  hash: 'sha256',
  prk: conversation_key,
  info: nonce,
  length: 76
)

// Split into component keys
chacha_key = expanded[0:32]      // ChaCha20 key
chacha_nonce = expanded[32:44]   // ChaCha20 nonce (12 bytes)
hmac_key = expanded[44:76]       // HMAC-SHA256 key
```

#### 3. Encryption and Authentication
```typescript
// Pad and encrypt plaintext
padded_plaintext = apply_padding(utf8_encode(message))
ciphertext = chacha20(chacha_key, chacha_nonce, padded_plaintext)

// Authenticate with HMAC
mac = HMAC_SHA256(hmac_key, nonce + ciphertext)

// Final payload
encrypted_payload = base64_encode(version + nonce + ciphertext + mac)
```

### Security Properties
- **Bidirectional**: `conv(a, B) == conv(b, A)`
- **Nonce uniqueness**: Each message uses fresh random nonce
- **Authenticated encryption**: HMAC prevents tampering
- **Padding**: Custom scheme reduces length leakage

### Limitations
- **No forward secrecy**: Compromise of long-term keys reveals all messages
- **No post-quantum security**: Relies on secp256k1
- **Metadata leakage**: Still reveals sender/recipient in events
- **Replay attacks**: No sequence numbers or timestamps in MAC

## NIP-59: Gift Wrap Protocol

### Three-Layer Architecture

#### Layer 1: Rumor (Original Event)
```json
{
  "kind": 14,
  "content": "Hello!",
  "tags": [["p", "recipient_pubkey"], ["subject", "Chat Topic"]],
  "created_at": 1234567890,
  "pubkey": "sender_pubkey"
  // NOTE: No "id" or "sig" - this is unsigned!
}
```

#### Layer 2: Seal (Kind 13)
```json
{
  "kind": 13,
  "content": "<encrypted rumor using NIP-44>",
  "tags": [],
  "created_at": 1234567888, // Randomized ±2 days
  "pubkey": "sender_pubkey",
  "id": "...",
  "sig": "..." // Signed by sender
}
```

#### Layer 3: Gift Wrap (Kind 1059)
```json
{
  "kind": 1059,
  "content": "<encrypted seal using NIP-44>",
  "tags": [["p", "recipient_pubkey"]],
  "created_at": 1234567777, // Randomized ±2 days  
  "pubkey": "ephemeral_pubkey", // Random single-use key
  "id": "...",
  "sig": "..." // Signed by ephemeral key
}
```

### Multi-Recipient Implementation
```typescript
// For message to [A, B, C]
const rumor = create_rumor({
  content: "Hello everyone!",
  recipients: ["pubkey_A", "pubkey_B", "pubkey_C"],
  subject: "Group Chat"
})

const seal = create_seal(rumor, sender_private_key)

// Create individual gift wrap for each recipient
const gift_wrap_A = create_gift_wrap(seal, "pubkey_A", ephemeral_key_A)
const gift_wrap_B = create_gift_wrap(seal, "pubkey_B", ephemeral_key_B)  
const gift_wrap_C = create_gift_wrap(seal, "pubkey_C", ephemeral_key_C)

// Send to each recipient's inbox relays
await send_to_inbox_relays(gift_wrap_A, "pubkey_A")
await send_to_inbox_relays(gift_wrap_B, "pubkey_B")
await send_to_inbox_relays(gift_wrap_C, "pubkey_C")
```

### Timestamp Randomization
- **Purpose**: Prevent timing correlation attacks
- **Range**: ±2 days from actual timestamp
- **Application**: Both seal and gift wrap timestamps
- **Constraint**: Must be in the past (some relays reject future timestamps)

### Ephemeral Key Management
- **Generation**: Cryptographically secure random per gift wrap
- **Usage**: Single-use for encryption and signing
- **Disposal**: Immediately discard after use
- **Privacy**: Prevents linking multiple gift wraps to same sender

## Kind 10050: Relay Lists (DM Inbox)

### Purpose
Allows users to specify which relays should receive their private messages.

### Event Structure
```json
{
  "kind": 10050,
  "content": "",
  "tags": [
    ["relay", "wss://relay1.example.com"],
    ["relay", "wss://relay2.example.com", "read"],
    ["relay", "wss://relay3.example.com", "write"]
  ]
}
```

### Implementation Requirements
- **Discovery**: Query recipient's kind 10050 for inbox relays
- **Fallback**: Use general relay list if no DM-specific relays
- **Respect preferences**: Only send to specified inbox relays
- **Authentication**: Relays should protect kind 1059 events behind AUTH

## Technical Implementation Challenges

### 1. Cryptographic Complexity
- **Multiple algorithms**: ECDH, HKDF, ChaCha20, HMAC all must be correct
- **Key derivation**: Conversation keys must be deterministic and bidirectional
- **Nonce handling**: Must be cryptographically random and never reused
- **Constant-time operations**: Prevent timing attacks

### 2. Multi-Recipient Scaling
- **N gift wraps**: One per recipient increases bandwidth linearly
- **Ephemeral keys**: Need N random keypairs per message
- **Relay coordination**: Must discover and send to N different relay sets
- **Error handling**: Partial failures in multi-recipient scenarios

### 3. Metadata Privacy
- **Timestamp correlation**: Must randomize across all layers consistently
- **Traffic analysis**: Gift wrap distribution patterns can reveal groups
- **Relay cooperation**: Requires relay AUTH support for full privacy
- **Network-level correlation**: IP addresses can still correlate users

### 4. Conversation Threading
- **Subject consistency**: Must be preserved across encryption layers
- **Participant tracking**: Complex with ephemeral keys hiding senders
- **Message ordering**: Randomized timestamps complicate chronological ordering
- **Group dynamics**: Adding/removing participants from ongoing conversations

## Security Analysis

### Threat Model
- **Relay operators**: Cannot read content or identify participants
- **Network observers**: Cannot correlate encrypted events
- **Compromised recipients**: Cannot forge messages from sender
- **Long-term key compromise**: Reveals all historical conversations (no forward secrecy)

### Attack Vectors
- **Timing correlation**: Mitigated by timestamp randomization
- **Traffic analysis**: Partially mitigated by gift wrap obfuscation
- **Relay collusion**: Multiple relay operators could correlate patterns
- **Client vulnerabilities**: Implementation bugs could leak metadata

### Compliance Requirements
- **Exact specification adherence**: Required for interoperability
- **Test vector validation**: Must pass all reference test cases
- **Cross-client compatibility**: Must work with Damus, Amethyst, etc.
- **Security audit**: Consider third-party review for production use