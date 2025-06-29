# NIP-78: Arbitrary custom app data

## Meta
- **Status**: Draft, Optional
- **Category**: Application Data/Storage
- **Required**: No
- **Purpose**: RemoteStorage-like capabilities for non-interoperable apps

## Summary
Enables custom applications to store arbitrary data on Nostr relays without requiring interoperability. Uses addressable events (kind 30078) with app-specific identifiers and content, providing "bring your own database" functionality.

## Core Concepts
- **Non-Interoperable Storage**: Apps that don't need cross-app compatibility
- **Relay as Database**: Use Nostr relays for application-specific storage
- **Arbitrary Format**: No restrictions on content or tag structure
- **User-Controlled**: Users specify preferred relay for data storage
- **App-Specific**: Each app manages its own data namespace

## Implementation Details
### Event Structure (30078)
- Addressable event with `d` tag containing app reference
- Content and tags can be in any format
- App name, context, or arbitrary string in `d` tag
- No standardized schema requirements

### Storage Pattern
- Each app uses unique identifiers in `d` tag
- Multiple data records per app possible
- User controls which relay stores the data
- Apps retrieve data using filters on `d` tag

## Use Cases
- **Personal Settings**: User preferences across Nostr clients
- **Dynamic Parameters**: Client developers push updates to users
- **Private Data**: Personal app data unrelated to Nostr protocol
- **Configuration Sync**: App settings synchronized across devices
- **Development Tools**: Internal app state and debugging data

## Related NIPs
- NIP-01: Addressable events (kind 30078)
- NIP-33: Parameterized replaceable events 