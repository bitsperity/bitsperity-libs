# NIP-92: Media Attachments

## Meta
- **Status**: Standard
- **Category**: Media/Metadata
- **Required**: No
- **Purpose**: Inline metadata for media URLs in events

## Summary
Defines `imeta` ("inline metadata") tags for adding information about media URLs in event content. Enables rich media previews and provides comprehensive metadata without requiring separate file events.

## Core Concepts
- **Inline Metadata**: Metadata directly in event tags
- **URL Matching**: Each imeta tag matches URL in content
- **Rich Previews**: Enhanced media display in clients
- **Comprehensive Info**: Dimensions, hashes, alt text, fallbacks
- **Space-Delimited**: Key/value pairs in single tag

## Implementation Details
### Imeta Tag Structure
- Variadic tag with space-delimited key/value pairs
- MUST include `url` and at least one other field
- MAY include any NIP-94 field
- One imeta tag per URL maximum

### Supported Fields
- `url`: Media file URL (required)
- `m`: MIME type
- `blurhash`: Loading preview
- `dim`: Dimensions in pixels
- `alt`: Accessibility description
- `x`: SHA-256 hash
- `fallback`: Alternative URLs

## Use Cases
- **Social Media**: Rich image/video sharing
- **Content Publishing**: Enhanced media presentation
- **Accessibility**: Alt text for screen readers
- **Performance**: Blurhash previews during loading
- **Reliability**: Fallback URLs for redundancy

## Related NIPs
- NIP-94: File metadata standard (extended by this)
- Media processing and display standards 