# NIP-16: Event Treatment

## Meta
- **Status**: final mandatory
- **Category**: Core Protocol
- **Required**: mandatory
- **Purpose**: MOVED to NIP-01 - Event treatment and processing rules

## Summary
**MOVED TO NIP-01** - This NIP originally defined event treatment rules but content has been moved to NIP-01.

## Original Purpose
Defined how clients and relays should treat different types of events, including replaceable and ephemeral events.

## Current Status
- **Content moved**: All functionality now described in NIP-01
- **Event types**: Regular, replaceable, ephemeral, addressable events
- **Implementation**: Part of basic event handling

## Event Categories (now in NIP-01)
- **Regular events**: Stored permanently (kinds 1000-9999, 4-44, 1-2)
- **Replaceable events**: Only latest version kept (kinds 10000-19999, 0, 3)
- **Ephemeral events**: Not stored (kinds 20000-29999)
- **Addressable events**: Identified by coordinates (kinds 30000-39999)

## Processing Rules
- **Timestamp conflicts**: For replaceables, lowest ID wins with same timestamp
- **Storage behavior**: Relays implement according to event category
- **Client handling**: Must understand event lifecycle

## Related NIPs
- NIP-01 (contains the actual implementation details)
- All NIPs that define specific event kinds 