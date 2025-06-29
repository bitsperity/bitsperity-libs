# NIP-94: File Metadata

## Meta
- **Status**: Draft, Optional
- **Category**: File Management/Metadata
- **Required**: No
- **Purpose**: Organization and classification of shared files

## Summary
Defines kind 1063 events for file metadata, enabling relays to filter and organize files. Provides comprehensive file information including URLs, MIME types, hashes, dimensions, and accessibility data for various file-sharing applications.

## Core Concepts
- **File Classification**: Structured metadata for organization
- **Relay Filtering**: Enable content-based file filtering
- **Comprehensive Metadata**: Complete file information set
- **Accessibility Support**: Alt text and descriptions
- **Integrity Verification**: SHA-256 hashes for validation

## Implementation Details
### Event Structure (1063)
- Content contains file description/caption
- Required tags: `url`, `m` (MIME), `x` (hash)
- Optional: size, dimensions, thumbnails, torrents
- Service integration (NIP-96) support

### File Information Tags
- `url`: Download URL
- `x`/`ox`: SHA-256 hashes (current/original)
- `size`: File size in bytes
- `dim`: Pixel dimensions
- `magnet`/`i`: Torrent information
- `thumb`/`image`: Preview images

### Accessibility Features
- `alt`: Screen reader descriptions
- `summary`: Text excerpts
- Multiple fallback URLs

## Use Cases
- **File Indexing**: Searchable file repositories
- **Portfolio Sharing**: Creative work presentation
- **Software Distribution**: Updates and configurations
- **Content Curation**: Pinterest-like file sharing
- **Torrent Promotion**: Decentralized file sharing

## Related NIPs
- NIP-92: Inline metadata (imeta) integration
- NIP-96: HTTP file storage services 