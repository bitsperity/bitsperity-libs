# NIP-33: Parameterized Replaceable Events

## Meta
- **Status**: final mandatory
- **Category**: Core Protocol
- **Required**: mandatory
- **Purpose**: MOVED to NIP-01 - Defines addressable/parameterized replaceable events

## Summary
**MOVED TO NIP-01** - Originally defined parameterized replaceable events (kinds 30000-39999) but content has been integrated into NIP-01.

## Original Purpose
Defined addressable events that can be replaced and are identified by their kind, author pubkey, and d-tag parameter.

## Current Status
- **Content moved**: All functionality now described in NIP-01
- **Event kinds**: 30000-39999 (addressable/parameterized replaceable)
- **Implementation**: Part of basic event handling

## Addressable Event Properties (now in NIP-01)
- **Identifier**: `kind:pubkey:d-tag` coordinates
- **D-tag**: Required `["d", "<identifier>"]` tag
- **Replaceable**: New events replace old ones with same coordinates
- **Queryable**: Can be queried by coordinates
- **Relays**: Must implement addressable event handling

## Addressing Format
- **Coordinates**: `<kind>:<pubkey>:<d-tag>`
- **NIP-19 encoding**: `naddr` bech32 format for sharing
- **Queries**: Use a-filter for addressable event queries

## Examples (Implementation in NIP-01)
- **Kind 30023**: Long-form articles (NIP-23)
- **Kind 30000**: Follow categorizations (NIP-51)
- **Kind 30001**: Generic lists (NIP-51)
- **Kind 30315**: User statuses (NIP-38)

## Replacement Rules
- **Same coordinates**: Events with identical kind:pubkey:d-tag replace each other
- **Timestamp conflicts**: For same timestamp, event with lexicographically lower ID wins
- **Missing d-tag**: Treated as empty string for d-tag value

## Related NIPs
- NIP-01 (contains the actual implementation details)
- NIP-19 (naddr encoding for addressable events)
- All NIPs that define addressable event kinds (30000-39999) 