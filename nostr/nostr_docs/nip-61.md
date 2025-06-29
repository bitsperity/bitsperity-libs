# NIP-61: Nutzaps

## Meta
- **Status**: Draft, Optional
- **Category**: Payments/Cashu
- **Required**: No
- **Purpose**: Cashu-based payments where token is receipt

## Summary
Nutzaps are P2PK-locked Cashu tokens where the payment itself serves as the receipt. Uses mint information events (10019) and nutzap events (9321) for sending/receiving ecash payments.

## Core Concepts
- **P2PK Tokens**: Cashu tokens locked to recipient's pubkey
- **Self-Receipt**: Payment token is the proof of payment
- **Mint Agreement**: Recipients specify trusted mints
- **DLEQ Proofs**: Cryptographic proof of token validity
- **Relay Routing**: Specific relays for receiving payments

## Implementation Details
### Mint Info Event (10019)
- Lists trusted mints with supported units
- Specifies P2PK public key (not Nostr key)
- Indicates preferred relays for nutzaps
- Replaceable configuration event

### Nutzap Event (9321)
- Contains P2PK-locked proofs
- Tags recipient and optionally event being zapped
- Includes mint URL exactly as specified
- Optional comment in content field

### Security Requirements
- MUST use recipient's specified P2PK key
- MUST prefix P2PK key with "02"
- MUST include DLEQ proof
- MUST use recipient's approved mints

## Use Cases
- **Micropayments**: Small direct payments
- **Content Tipping**: Reward creators with Cashu
- **Anonymous Payments**: P2PK provides privacy
- **Cross-Platform**: Works across Cashu-supporting apps
- **Offline Verification**: Recipients can verify without online mint

## Related NIPs
- NIP-60: Cashu wallet integration
- NIP-65: Relay list for routing
- NIP-44: History encryption 