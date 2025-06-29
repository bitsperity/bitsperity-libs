# NIP-17: Private Direct Messages

## Meta
- **Status**: draft optional
- **Category**: Communication/Privacy
- **Required**: optional
- **Purpose**: Defines secure private messaging using NIP-44 encryption and NIP-59 gift wraps

## Summary
Modern encrypted messaging system replacing NIP-04, using gift wraps and seals for metadata protection and forward secrecy.

## Core Concepts
- **Kind 14**: Chat message (never signed directly)
- **Kind 15**: File message (encrypted file sharing)
- **Gift wrapping**: NIP-59 envelope hiding sender/receiver
- **Sealing**: NIP-44 encrypted inner layer
- **Metadata protection**: Hides participants, timing, content

## Message Types
**Kind 14 (Chat):**
- Plain text content
- p-tags for recipients
- e-tags for replies
- subject tags for conversation titles

**Kind 15 (File):**
- File URL in content
- Encryption metadata tags (algorithm, key, nonce)
- File metadata (type, size, dimensions, blurhash)

## Encryption Process
1. Create unsigned kind:14/15 event
2. Seal with NIP-44 encryption (kind:13)
3. Gift wrap with random key (kind:1059)  
4. Send to each recipient individually
5. Randomize timestamps (up to 2 days past)

## Gift Wrap Structure
```json
{
  "kind": 1059,
  "pubkey": "<random-pubkey>",
  "created_at": "<random-past-timestamp>",
  "tags": [["p", "<recipient-pubkey>", "<relay-hint>"]],
  "content": "<nip44-encrypted-seal>",
  "sig": "<signed-by-random-key>"
}
```

## Chat Rooms
- **Room definition**: Set of pubkeys + p-tags
- **Subject changes**: Any member can update conversation topic
- **Message threading**: Continuous conversation history
- **Member changes**: Adding/removing p-tags creates new room

## Relay Discovery (Kind 10050)
```json
{
  "kind": 10050,
  "tags": [
    ["relay", "wss://inbox.nostr.wine"],
    ["relay", "wss://myrelay.com"]
  ],
  "content": ""
}
```

## File Sharing (Kind 15)
- **Encrypted files**: AES-GCM encryption before upload
- **Metadata**: MIME type, size, dimensions, blurhash
- **Decryption info**: Key and nonce in tags
- **File verification**: SHA-256 hashes (encrypted and original)

## Privacy Features
- **No metadata leakage**: Participants, timing, content all hidden
- **No group identifiers**: No central channels or public groups
- **Forward secrecy**: Optional disappearing messages
- **Public relay compatible**: Works with public relays
- **Cold storage**: Backup keys for message recovery

## Implementation Requirements
- **Pubkey validation**: Verify seal pubkey matches inner event
- **Timestamp randomization**: Randomize within 2-day window
- **NIP-44 encryption**: Must use latest encryption version
- **Relay publishing**: Send to recipients' kind:10050 relay lists

## Limitations
- **Group size**: Not suitable for >100 participants
- **Relay coordination**: Requires publishing to multiple relays
- **Implementation complexity**: More complex than NIP-04

## Related NIPs
- NIP-44 (encryption standard)
- NIP-59 (gift wraps and seals)  
- NIP-04 (deprecated predecessor) 