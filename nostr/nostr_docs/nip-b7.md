# NIP-B7: Blossom media

## Meta
- **Status**: Draft, Optional
- **Category**: Media/File Storage
- **Required**: No
- **Purpose**: Blossom protocol integration for file storage

## Summary
Specifies how Nostr clients integrate with Blossom servers for media handling. Uses kind 10063 server lists and SHA-256 addressable files with automatic fallback when URLs become unavailable.

## Core Concepts
- **Blossom Integration**: Uses Blossom BUD standards
- **SHA-256 Addressing**: Files identified by their hash
- **Server Lists**: Kind 10063 events list user's Blossom servers
- **Automatic Fallback**: Client searches alternative servers
- **Hash Verification**: Downloaded files verified against SHA-256

## Implementation Details
### Server List Event (10063)
- Contains user's trusted Blossom servers
- `server` tags list available endpoints
- Clients use BUD-03 standard for discovery
- Published by users to advertise their storage

### File Resolution Process
1. Detect 64-character hex string in broken URL
2. Fetch user's kind 10063 server list
3. Try hex string as path on each server
4. Verify SHA-256 hash of downloaded content
5. Optional file extension preservation

### URL Pattern
- Original: `https://broken.server/abc123...def.png`
- Fallback: `https://working.server/abc123...def.png`
- Hash verification ensures file integrity

## Use Cases
- **Decentralized CDN**: Multiple file storage providers
- **Media Backup**: Redundant file storage across servers
- **File Recovery**: Recover files from alternative sources
- **Self-Hosted Media**: Personal Blossom server integration
- **Content Distribution**: Efficient file sharing network

## Related NIPs
- BUD-03: Blossom server discovery standard
- File storage and media handling protocols 