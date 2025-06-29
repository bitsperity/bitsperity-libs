# NIP-46: Nostr Connect

## Meta
- **Status**: draft optional
- **Category**: Key Management/Remote Signing
- **Required**: optional
- **Purpose**: Enables remote signing of events by delegating to external key management services

## Summary
Protocol for remote event signing where applications can request signatures from external services without direct access to private keys.

## Core Concepts
- **Remote signing**: Apps request signatures from external signers
- **Request-response**: JSON-RPC style communication over Nostr
- **Key isolation**: Private keys stay with signer, never shared
- **Multi-app support**: One signer can serve multiple applications
- **Encrypted communication**: All requests/responses encrypted with NIP-44

## Architecture
```
[Client App] <-- encrypted --> [Relay] <-- encrypted --> [Remote Signer]
```
- **Client**: Application needing signatures
- **Remote Signer**: Service holding private keys
- **Relay**: Nostr relay facilitating communication
- **Encryption**: NIP-44 encryption for all messages

## Connection Flow
1. **Signer advertises**: Signer publishes connection info
2. **Client discovers**: Client finds signer connection info
3. **Connection request**: Client requests connection to signer
4. **Authorization**: Signer approves/denies connection
5. **Signing requests**: Client sends signing requests

## Request Event Structure (Kind 24133)
```json
{
  "kind": 24133,
  "content": "<encrypted-request>",
  "tags": [
    ["p", "<signer-pubkey>"]
  ]
}
```

## Response Event Structure (Kind 24133)
```json
{
  "kind": 24133,
  "content": "<encrypted-response>",
  "tags": [
    ["p", "<client-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

## Request/Response Methods

### get_public_key
**Request**: Get signer's public key
```json
{
  "id": "req-123",
  "method": "get_public_key",
  "params": []
}
```

**Response**:
```json
{
  "id": "req-123",
  "result": "<public-key-hex>",
  "error": null
}
```

### sign_event
**Request**: Sign an event
```json
{
  "id": "req-456",
  "method": "sign_event",
  "params": [<unsigned-event>]
}
```

**Response**:
```json
{
  "id": "req-456",
  "result": "<signature>",
  "error": null
}
```

### get_relays
**Request**: Get signer's relay list
```json
{
  "id": "req-789",
  "method": "get_relays",
  "params": []
}
```

### nip04_encrypt/nip04_decrypt
**Request**: NIP-04 encryption/decryption (deprecated)
```json
{
  "id": "req-101",
  "method": "nip04_encrypt",
  "params": ["<pubkey>", "<plaintext>"]
}
```

### nip44_encrypt/nip44_decrypt
**Request**: NIP-44 encryption/decryption
```json
{
  "id": "req-102",
  "method": "nip44_encrypt",
  "params": ["<pubkey>", "<plaintext>"]
}
```

## Connection Info Format
**Signer advertises connection info**:
```
nostrconnect://<pubkey>?relay=<relay-url>&metadata=<metadata>
```
- **pubkey**: Signer's public key
- **relay**: Preferred relay for communication
- **metadata**: Optional JSON metadata about signer

## Authorization Levels
- **read**: Get public key, relay list
- **write**: Sign events
- **encrypt**: Perform encryption/decryption
- **full**: All permissions

## Client Implementation
- **Connection management**: Handle signer connections
- **Request queuing**: Queue signing requests
- **Error handling**: Handle signer unavailability
- **User permission**: Request user approval for connections

## Signer Implementation
- **Key security**: Secure storage and use of private keys
- **Request validation**: Verify and approve signing requests
- **Session management**: Manage client sessions
- **User interface**: UI for approving requests

## Use Cases
- **Mobile wallets**: Remote signing for desktop apps
- **Hardware signers**: Integration with hardware security modules
- **Multi-device**: Sign from any device without key sharing
- **Corporate usage**: Centralized key management for organizations
- **Web applications**: Sign without exposing keys to browsers

## Security Considerations
- **Key isolation**: Private keys never leave signer
- **Request approval**: Users should approve signing requests
- **Connection security**: All communication encrypted
- **Session management**: Proper session lifecycle management
- **Request validation**: Validate all signing requests

## Error Handling
**Common error responses**:
- **unauthorized**: Connection not authorized
- **rate_limited**: Too many requests
- **invalid_params**: Invalid request parameters
- **method_not_found**: Unsupported method
- **internal_error**: Signer internal error

## Related NIPs
- NIP-01 (basic event structure and signatures)
- NIP-44 (encryption used for communication)
- NIP-05 (DNS-based discovery for signers)
- NIP-07 (browser extension alternative) 