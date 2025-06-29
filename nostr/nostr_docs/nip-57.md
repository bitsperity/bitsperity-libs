# NIP-57: Lightning Zaps

## Meta
- **Status**: Draft, Optional
- **Category**: Payments/Lightning 
- **Required**: No
- **Purpose**: Lightning payment integration with Nostr events

## Summary
Defines two event types for recording Lightning payments between users: `zap request` (kind 9734) and `zap receipt` (kind 9735). Enables Lightning payments with receipts stored on Nostr, allowing clients to display payments and implement spam deterrence.

## Core Concepts
- **Zap Request (9734)**: Unsigned event sent to LNURL endpoint requesting invoice
- **Zap Receipt (9735)**: Signed proof that invoice was paid, published to relays  
- **LNURL Integration**: Uses LNURL-pay protocol with Nostr extensions
- **P2PK Locking**: Supports locking payments to specific pubkeys

## Implementation Details
### Zap Request Structure
- Not published to relays, sent to LNURL callback
- Required tags: `relays`, `amount`, `lnurl`, `p` (recipient)
- Optional tags: `e` (event being zapped), `a` (addressable event)
- Content: optional payment message

### Zap Receipt Structure  
- Kind 9735 event published by recipient's LNURL server
- Contains `bolt11` tag with invoice
- Contains `description` tag with original zap request
- Includes `p` tag for recipient, optional `P` tag for sender

### Protocol Flow
1. Client fetches recipient's LNURL endpoint from profile/event
2. Creates signed zap request event
3. Sends request to LNURL callback URL
4. Server validates request and returns invoice
5. Sender pays invoice
6. Server publishes zap receipt to specified relays

## Use Cases
- **Micropayments**: Small Lightning payments for content
- **Spam Prevention**: Requiring payment to reduce spam
- **Creator Support**: Direct payments to content creators
- **Social Signaling**: Public proof of financial support
- **Split Payments**: Multiple recipients with weight distribution

## Related NIPs
- NIP-01: Basic protocol foundation
- NIP-57: Zap tag extensions for split payments
- NIP-47: Wallet Connect for payment processing 