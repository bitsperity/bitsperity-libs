# NIP-60: Cashu Wallets

## Meta
- **Status**: Draft, Optional
- **Category**: Payments/Cashu
- **Required**: No
- **Purpose**: Relay-stored Cashu wallet state management

## Summary
Defines operations for Cashu-based wallets stored on relays for cross-application accessibility. Uses three event types: wallet configuration (17375), unspent tokens (7375), and spending history (7376).

## Core Concepts
- **Relay Storage**: Wallet state synchronized across applications
- **Encrypted Proofs**: Unspent tokens encrypted with user's key
- **Mint Support**: Multi-mint wallet capability
- **State Transitions**: Token creation/destruction tracking
- **P2PK Integration**: Private key for receiving payments

## Implementation Details
### Wallet Event (17375)
- Replaceable event with encrypted content
- Contains mint URLs and P2PK private key
- Private key separate from Nostr identity key
- NIP-44 encrypted configuration

### Token Event (7375)
- Encrypted unspent Cashu proofs
- Includes mint URL and proof array
- `del` field tracks consumed tokens
- Deleted when proofs are spent

### History Event (7376)
- Optional transaction record
- Direction (in/out), amount, related events
- References created/destroyed tokens
- Can be partially encrypted

## Use Cases
- **Cross-App Wallets**: Wallet follows user between applications
- **Easy Onboarding**: Immediate receive capability
- **Backup/Sync**: Wallet state preserved on relays
- **Multi-Mint Support**: Diversified mint usage
- **Transaction History**: Optional spending records

## Related NIPs
- NIP-44: Encryption for sensitive data
- NIP-09: Event deletion for state transitions
- NIP-61: Nutzaps receiving integration 