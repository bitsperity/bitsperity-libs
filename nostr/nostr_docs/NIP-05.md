# NIP-05: DNS-based Internet Identifiers

## Meta
- **Status**: final optional
- **Category**: Identity
- **Required**: optional
- **Purpose**: Maps Nostr pubkeys to DNS-based email-like identifiers

## Summary
Enables human-readable identifiers (like email addresses) for Nostr pubkeys using DNS well-known URLs.

## Core Concepts
- **NIP05 Field**: In kind:0 metadata, format: `name@domain.com`
- **Well-known Endpoint**: `https://domain/.well-known/nostr.json?name=localpart`
- **Verification**: JSON response maps names to pubkeys
- **Bidirectional**: Both verification and discovery supported

## Verification Process
1. Parse identifier: `bob@example.com` → name="bob", domain="example.com"
2. Fetch: `https://example.com/.well-known/nostr.json?name=bob`
3. Check JSON response has matching pubkey in "names" object
4. Optionally use "relays" object for relay hints

## JSON Response Format
```json
{
  "names": {
    "bob": "pubkey_hex"
  },
  "relays": {
    "pubkey_hex": ["wss://relay1.com", "wss://relay2.com"]
  }
}
```

## Special Cases
- **Root identifier**: `_@domain.com` displays as just `domain.com`
- **Character restrictions**: Local part limited to `a-z0-9-_.` (case-insensitive)
- **No redirects**: Endpoint must not return HTTP redirects

## Security Considerations
- **Identification, not verification**: For contact exchange, not authentication
- **Follow pubkeys, not addresses**: Clients must track pubkeys as primary reference
- **CORS required**: `Access-Control-Allow-Origin: *` for browser clients
- **Hex format only**: Pubkeys must be hex, not NIP-19 format

## Use Cases
- **User Discovery**: Search for users by familiar identifiers
- **Profile Verification**: Domain owners can attest to their Nostr identity
- **Contact Sharing**: Easy-to-remember identifiers for sharing
- **Corporate Identity**: Companies can verify their official accounts

## Implementation Notes
- Dynamic or static server support via query parameter
- Relay hints optional but recommended
- Client should handle network failures gracefully
- Domain ownership provides trust element

## Related NIPs
- NIP-01 (kind:0 metadata events)
- NIP-19 (bech32 encoding - not used here) 