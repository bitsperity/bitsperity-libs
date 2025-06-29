# NIP-89: Recommended Application Handlers

## Meta
- **Status**: Draft, Optional
- **Category**: Application Discovery/Interoperability
- **Required**: No
- **Purpose**: Discover applications that handle unknown event kinds

## Summary
Defines recommendation events (kind 31989) and handler information events (kind 31990) to enable discovery of applications capable of handling specific event kinds, ensuring smooth cross-client interactions.

## Core Concepts
- **App Discovery**: Find handlers for unknown event types
- **Cross-Client Compatibility**: Seamless event interaction
- **User Recommendations**: Social discovery of quality apps
- **Handler Registration**: Apps advertise their capabilities
- **Platform Support**: Different handlers for web, mobile, etc.

## Implementation Details
### Recommendation Event (31989)
- `d` tag contains supported event kind
- Multiple `a` tags reference handler apps
- Optional relay hints and platform markers
- Users recommend apps they've used successfully

### Handler Information (31990)
- `k` tags specify supported event kinds
- URL patterns with NIP-19 entity placeholders
- Platform-specific handlers (web, iOS, Android)
- Optional metadata for app information

### Client Integration
- Optional `client` tag on published events
- Identifies publishing application
- Privacy implications - users can opt out

## Use Cases
- **Unknown Event Handling**: Handle unfamiliar event kinds gracefully
- **App Ecosystem**: Build directory of Nostr applications
- **User Experience**: Seamless cross-app event interaction
- **Developer Tools**: App discovery and recommendation
- **Protocol Evolution**: Support for new event kinds

## Related NIPs
- NIP-19: Bech32-encoded entities in URLs
- NIP-01: Basic event kinds and structure 