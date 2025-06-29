# NIP-01: Basic Protocol Flow Description

## Meta
- **Status**: draft mandatory
- **Category**: Core Protocol
- **Required**: mandatory
- **Purpose**: Defines the fundamental Nostr protocol for events, signatures, and client-relay communication

## Summary
Foundation of the Nostr protocol. Defines event structure, signature scheme, tag system, and WebSocket communication between clients and relays.

## Core Concepts
- **Event**: Only object type with JSON format (id, pubkey, created_at, kind, tags, content, sig)
- **Signatures**: Schnorr signatures over secp256k1 curve
- **Event ID**: SHA256 hash of serialized event data
- **Tags**: Array of string arrays for metadata and references
- **Kinds**: Integer for event type classification (0-65535)

## Event Types (Kinds)
- **Kind 0**: User metadata (profile info as JSON)
- **Kind Ranges**:
  - 1000-9999, 4-44, 1-2: Regular (stored)
  - 10000-19999, 0, 3: Replaceable (only latest version)
  - 20000-29999: Ephemeral (not stored)
  - 30000-39999: Addressable (identified by kind+pubkey+d-tag)

## Standard Tags
- **e-tag**: Reference to another event `["e", <event-id>, <relay-url>, <pubkey>]`
- **p-tag**: Reference to user `["p", <pubkey>, <relay-url>]`
- **a-tag**: Reference to addressable event `["a", "<kind>:<pubkey>:<d-tag>", <relay-url>]`

## Client-Relay Communication
- **WebSocket-based**: One connection per relay
- **Client→Relay**: EVENT (publish), REQ (subscribe), CLOSE (unsubscribe)
- **Relay→Client**: EVENT (data), OK (confirm), EOSE (end of stored), CLOSED (sub ended), NOTICE (info)

## Filter System
Subscription filters support: ids, authors, kinds, tag filters (#e, #p), since/until, limit

## Implementation Details
- UTF-8 JSON serialization with specific escape rules
- Single-letter tags are indexed by relays
- Only first tag element used for indexing
- Replaceable events: With same timestamp, lowest ID wins

## Related NIPs
Foundation for all other NIPs - especially NIP-10 (Text Notes), NIP-02 (Follow Lists) 