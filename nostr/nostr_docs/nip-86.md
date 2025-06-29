# NIP-86: Relay Management API

## Meta
- **Status**: Draft, Optional
- **Category**: Relay Management/Administration
- **Required**: No
- **Purpose**: HTTP REST API for relay administration tasks

## Summary
Defines JSON-RPC-like HTTP API for relay management operations. Enables administrative tasks like banning users, managing events, configuring relay settings, and monitoring moderation queues through HTTP requests with NIP-98 authentication.

## Core Concepts
- **HTTP Management**: REST API over same URI as WebSocket
- **JSON-RPC Style**: Request/response with method and parameters
- **NIP-98 Authentication**: Cryptographic authorization required
- **Administrative Operations**: User/event/content management
- **Configuration Control**: Relay settings and policies

## Implementation Details
### API Methods
- **User Management**: banpubkey, allowpubkey, listbannedpubkeys
- **Event Moderation**: allowevent, banevent, listeventsneedingmoderation
- **Content Filtering**: allowkind, disallowkind, listallowedkinds
- **Network Control**: blockip, unblockip, listblockedips
- **Relay Configuration**: changerelayname, description, icon
- **Discovery**: supportedmethods for capability detection

### Request Format
```json
{
  "method": "<method-name>",
  "params": ["<array>", "<of>", "<parameters>"]
}
```

### Authorization Requirements
- NIP-98 Authorization header required
- Base64-encoded event with payload validation
- 401 Unauthorized for invalid/missing auth

## Use Cases
- **Relay Administration**: Administrative control interfaces
- **Moderation Tools**: Content and user management systems
- **Automated Management**: Scripted relay operation
- **Monitoring Systems**: Relay health and policy enforcement
- **Configuration Management**: Dynamic relay setting updates

## Related NIPs
- NIP-98: HTTP authentication mechanism
- NIP-01: Basic event and relay protocol 