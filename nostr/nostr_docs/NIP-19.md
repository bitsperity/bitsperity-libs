# NIP-19: Bech32-encoded Entities

## Meta
- **Status**: draft optional
- **Category**: Encoding/Identity
- **Required**: optional
- **Purpose**: Defines bech32 encoding for keys, IDs, and shareable identifiers with metadata

## Summary
Human-readable bech32 encoding for Nostr entities, enabling safe copy-paste sharing and QR codes with embedded metadata.

## Core Concepts
- **Bech32 encoding**: Human-readable, error-detecting encoding
- **Display only**: Not for use in core protocol, only UI/sharing
- **Metadata embedding**: Include relay hints and additional context
- **Error detection**: Built-in checksum prevents typos

## Bare Key/ID Formats
- **npub**: Public keys (32 bytes)
- **nsec**: Private keys (32 bytes) 
- **note**: Note/event IDs (32 bytes)

**Example:**
- Hex: `3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d`
- npub: `npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6`

## Shareable Identifiers with Metadata
- **nprofile**: Nostr profile + relay hints
- **nevent**: Nostr event + relay/author hints  
- **naddr**: Addressable event coordinates + metadata
- **nrelay**: Relay URL (deprecated)

## TLV (Type-Length-Value) Structure
- **Type**: 1 byte (0-255)
- **Length**: 1 byte (0-255)
- **Value**: Variable length data

**TLV Types:**
- **0**: Special (pubkey for nprofile, event-id for nevent, d-tag for naddr)
- **1**: Relay URL (may appear multiple times)
- **2**: Author pubkey (32 bytes)
- **3**: Kind number (4 bytes, big-endian)

## Format Examples
**nprofile** (profile + relays):
```
nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p
```
Decoded:
- pubkey: `3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d`
- relay: `wss://r.x.com`
- relay: `wss://djbas.sadkb.com`

## Use Cases
- **Profile sharing**: Share profiles with relay context
- **Event linking**: Link to events with discovery hints
- **QR codes**: Encode identifiers for mobile scanning
- **Cross-platform**: Consistent format across clients
- **Deep linking**: App-to-app event/profile sharing

## Security Considerations
- **Display only**: Never use in NIP-01 events or filters
- **Client validation**: Verify decoded data makes sense
- **Unknown TLVs**: Ignore unrecognized TLV types
- **Relay hints**: Optional guidance, not requirements

## Implementation Notes
- **Hex for protocol**: Always use hex in actual protocol
- **Bech32 for humans**: Only for display/input/sharing
- **TLV parsing**: Ignore unknown TLV types gracefully
- **Client compatibility**: Support both hex and bech32 input

## Encoding Guidelines
- **Include relay hints**: When known, add relay information
- **Minimal metadata**: Only include useful context
- **Future compatibility**: Design for unknown TLV extensions
- **Error handling**: Graceful fallback for decode failures

## Related NIPs
- NIP-01 (basic keys and IDs)
- NIP-21 (nostr: URI scheme)
- NIP-05 (DNS-based identifiers) 