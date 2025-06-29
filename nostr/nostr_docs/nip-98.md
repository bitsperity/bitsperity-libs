# NIP-98: HTTP Auth

## Meta
- **Status**: Draft, Optional
- **Category**: Authentication/HTTP
- **Required**: No
- **Purpose**: Ephemeral event-based HTTP authorization

## Summary
Defines kind 27235 ephemeral events for authorizing HTTP requests using Nostr cryptographic signatures. Enables secure authentication to HTTP services built for Nostr without traditional account systems.

## Core Concepts
- **Cryptographic Auth**: Public key cryptography for HTTP
- **Ephemeral Events**: Temporary authorization tokens
- **Request Binding**: Auth tied to specific HTTP requests
- **Timestamp Validation**: Prevents replay attacks
- **Nostr Integration**: Native auth for Nostr-based services

## Implementation Details
### Auth Event (27235)
- Kind 27235 (RFC 7235 reference)
- Empty content field
- Required tags: `u` (URL), `method` (HTTP method)
- Optional `payload` tag with SHA-256 hash

### Validation Requirements
- Correct kind (27235)
- Recent timestamp (±60 seconds recommended)
- Exact URL match including query parameters
- Matching HTTP method
- Optional payload hash verification

### Authorization Header
- Base64-encoded event with "Nostr" scheme
- Example: `Authorization: Nostr <base64-event>`
- 401 Unauthorized for invalid auth

## Use Cases
- **API Authentication**: Secure API access without passwords
- **Service Integration**: Auth for Nostr-native services
- **Relay Management**: Administrative operations (NIP-86)
- **File Upload**: Secure file storage (NIP-96)
- **Premium Services**: Paid access authentication

## Related NIPs
- NIP-86: Relay management API
- NIP-96: File storage authentication
- RFC 7235: HTTP authentication framework 