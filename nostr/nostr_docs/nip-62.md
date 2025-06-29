# NIP-62: Request to Vanish

## Meta
- **Status**: Draft, Optional
- **Category**: Privacy/Legal
- **Required**: No
- **Purpose**: Nostr-native complete key fingerprint reset request

## Summary
Offers a legally binding way to request complete deletion of all events from a public key. Uses kind 62 events to request relays delete everything from a pubkey up to a certain timestamp, including NIP-09 deletion events.

## Core Concepts
- **Complete Reset**: Delete all events from a pubkey
- **Legal Binding**: May be legally enforceable in some jurisdictions
- **Relay-Specific**: Can target specific relays or all relays
- **Irreversible**: No "unrequest vanish" functionality
- **Comprehensive**: Includes deletion of gift wraps and DMs

## Implementation Details
### Request to Vanish Event (62)
- Required `relay` tag specifying target relay URL
- Optional content with reason or legal notice
- Targets all events from `.pubkey` until `.created_at`
- Special `ALL_RELAYS` value for global requests

### Relay Responsibilities
- MUST delete all events from specified pubkey
- SHOULD delete gift wraps p-tagging the pubkey
- MUST prevent re-broadcasting of deleted events
- MAY store signed request for bookkeeping
- MUST honor requests regardless of user's paid status

### Client Behavior
- SHOULD send to target relays only
- For global requests, broadcast to many relays
- Cannot issue deletion requests against vanish requests

## Use Cases
- **Legal Compliance**: GDPR-style data deletion
- **Privacy Protection**: Complete identity reset
- **Account Abandonment**: Clean slate for new identity
- **Mistake Recovery**: Remove all traces after errors
- **Reputation Reset**: Start fresh after controversies

## Related NIPs
- NIP-09: Event deletion (explicitly overridden)
- NIP-59: Gift wrap deletion included
- NIP-42: Authentication requirements for verification 