# NIP-59: Gift Wrap

## Meta
- **Status**: Optional
- **Category**: Privacy/Encryption
- **Required**: No
- **Purpose**: Obscure metadata for any Nostr event

## Summary
Protocol for encapsulating any Nostr event through three layers: rumor (unsigned event), seal (encrypted rumor), and gift wrap (encrypted seal). Provides metadata privacy, collaborative signing capability, and deniability.

## Core Concepts
- **Rumor**: Unsigned event that can't be authenticated if leaked
- **Seal (13)**: Encrypted rumor signed by real author
- **Gift Wrap (1059)**: Encrypted seal with routing metadata
- **NIP-44 Encryption**: Versioned encryption throughout
- **Metadata Protection**: Hides sender, recipient, content relationships

## Implementation Details
### Three-Layer Structure
1. **Rumor**: Normal event without signature
2. **Seal**: Kind 13, empty tags, encrypted rumor content
3. **Gift Wrap**: Kind 1059, routing tags, encrypted seal

### Encryption Process
- Each layer encrypted with NIP-44
- Rumor encrypted to recipient's pubkey
- Seal encrypted to ephemeral pubkey
- Gift wrap uses random one-time-use keypair

### Timestamp Obfuscation
- Canonical time in rumor
- Outer timestamps tweaked to prevent timing analysis
- All timestamps should be in past (relay compatibility)

## Use Cases
- **Private Messaging**: Secure communication protocols
- **Anonymous Publishing**: Content without author linkage
- **Collaborative Signing**: Multi-party event creation
- **Whistleblowing**: Deniable information sharing
- **Protected Metadata**: Hide communication patterns

## Related NIPs
- NIP-44: Versioned encryption algorithms
- NIP-13: Proof of work for spam prevention
- NIP-42: Relay authentication for access control 