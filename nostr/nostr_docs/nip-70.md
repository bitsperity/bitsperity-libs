# NIP-70: Protected Events

## Meta
- **Status**: Draft, Optional
- **Category**: Access Control/Privacy
- **Required**: No
- **Purpose**: Events publishable only by their author

## Summary
Defines the `"-"` tag to mark events as "protected", meaning they can only be published by their author. Relays must authenticate the author before accepting protected events or reject them outright.

## Core Concepts
- **Author-Only Publishing**: Only event authors can publish their protected events
- **Authentication Required**: Relays must verify author identity
- **Default Rejection**: Relays reject protected events by default
- **Compartmentalization**: Keep information within specific communities
- **Anti-Piracy**: Prevent unauthorized republishing

## Implementation Details
### Protected Tag
- Simple tag with single item: `["-"]`
- Can be added to any event type
- Default relay behavior: reject events with this tag

### Relay Requirements
- MUST reject protected events by default
- To accept: require NIP-42 AUTH flow first
- MUST verify authenticated pubkey matches event pubkey
- Only accept event if author is authenticated

### Authentication Flow
1. Client sends protected event
2. Relay responds with AUTH challenge
3. Client completes NIP-42 authentication
4. Client resends protected event
5. Relay verifies and accepts if author matches

## Use Cases
- **Private Communities**: Semi-closed relay content
- **Closed Access Feeds**: Relationship-based content sharing
- **Anti-Republishing**: Prevent unauthorized event spreading
- **Compartmentalized Info**: Keep content within specific demographics
- **Trust-Based Systems**: Publisher-relay trust relationships

## Related NIPs
- NIP-42: Authentication of clients to relays
- Anti-piracy and content control mechanisms 