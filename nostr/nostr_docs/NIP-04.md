# NIP-04: Encrypted Direct Message

## Meta
- **Status**: final unrecommended optional
- **Category**: Communication
- **Required**: optional
- **Purpose**: Deprecated encrypted messaging - superseded by NIP-17

## Summary
**DEPRECATED** - Defines kind:4 encrypted direct messages using AES-256-CBC. Replaced by NIP-17 for security reasons.

## Core Concepts
- **Kind 4**: Encrypted direct message event
- **AES-256-CBC**: Encryption algorithm used
- **ECDH**: Elliptic Curve Diffie-Hellman for shared secret
- **Base64 Encoding**: For encrypted content and IV

## Structure
- **Content**: `"<encrypted_text>?iv=<initialization_vector>"`
- **Tags**:
  - p-tag: Recipient pubkey (required)
  - e-tag: Optional reply reference

## Encryption Process
1. Generate shared secret using ECDH (X coordinate only, not hashed)
2. Create random 16-byte IV
3. Encrypt plaintext with AES-256-CBC
4. Base64 encode encrypted content and IV
5. Format as "content?iv=iv_base64"

## Security Warnings
- **Metadata Leakage**: Tags and timing visible to relays
- **Not State-of-Art**: Weak compared to modern encrypted messaging
- **Relay AUTH Required**: Must use authenticated relays
- **Content Processing**: Don't process @mentions in encrypted content

## Implementation Notes
- Uses custom ECDH (X coordinate only, not SHA256 hashed)
- Requires special handling in libsecp256k1
- IV must be random for each message
- Recipients identified by p-tag (relay routing)

## Deprecation
- **Replaced by**: NIP-17 (Private Direct Messages)
- **Reason**: Better security, forward secrecy, metadata protection
- **Status**: Unrecommended for new implementations

## Related NIPs
- NIP-17 (replacement - Private Direct Messages)
- NIP-44 (improved encryption standard) 