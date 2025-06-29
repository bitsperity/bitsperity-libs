# NIP-20: Command Results

## Meta
- **Status**: final mandatory
- **Category**: Core Protocol
- **Required**: mandatory
- **Purpose**: MOVED to NIP-01 - Command result messages from relays

## Summary
**MOVED TO NIP-01** - This NIP originally defined command result messages but content has been moved to NIP-01.

## Original Purpose
Defined OK, CLOSED, NOTICE, and other result messages that relays send to clients.

## Current Status
- **Content moved**: All functionality now described in NIP-01
- **Message types**: OK, CLOSED, NOTICE, EVENT, EOSE
- **Implementation**: Part of basic relay-client communication

## Message Types (now in NIP-01)
- **OK**: Event acceptance/rejection `["OK", <event_id>, <true|false>, <message>]`
- **CLOSED**: Subscription closed `["CLOSED", <subscription_id>, <message>]`
- **NOTICE**: Human-readable messages `["NOTICE", <message>]`
- **EVENT**: Event data `["EVENT", <subscription_id>, <event>]`
- **EOSE**: End of stored events `["EOSE", <subscription_id>]`

## Response Codes
- **Machine-readable prefixes**: duplicate, pow, blocked, rate-limited, invalid, restricted, error
- **Human-readable messages**: Follow prefix with `:` and description
- **Status indication**: Boolean for OK messages, reason for CLOSED

## Related NIPs
- NIP-01 (contains the actual implementation details)
- All NIPs that involve relay communication 