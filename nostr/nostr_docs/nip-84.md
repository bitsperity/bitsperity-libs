# NIP-84: Highlights

## Meta
- **Status**: Draft, Optional
- **Category**: Content/Bookmarking
- **Required**: No
- **Purpose**: Signal valuable content portions users want to preserve

## Summary
Defines kind 9802 "highlight" events to mark content portions users find valuable. Content field contains highlighted text, with source attribution and optional context for enhanced discoverability.

## Core Concepts
- **Content Highlighting**: Mark specific valuable text portions
- **Source Attribution**: Reference original content via tags
- **Multi-Media Support**: Works with text and non-text media
- **Author Recognition**: Tag original authors when possible
- **Quote Highlights**: Comment on highlights like quote reposts

## Implementation Details
### Event Structure (9802)
- Content field contains highlighted text portion
- May be empty for non-text media (audio/video)
- References source with `a`, `e`, or `r` tags
- Optional `context` tag for surrounding content

### Source References
- **Nostr Events**: Use `a` or `e` tags
- **External URLs**: Use `r` tags with cleaned URLs
- **Author Attribution**: `p` tags with optional role markers
- **Quote Comments**: `comment` tag creates quote highlight

### Attribution Features
- Multiple author `p` tags with roles (author, editor)
- Context preservation for partial quotes
- Mention vs attribution distinction
- Source URL tracking

## Use Cases
- **Research**: Academic and professional reference collection
- **Knowledge Management**: Personal content curation
- **Social Sharing**: Share interesting passages with commentary
- **Study Tools**: Educational content highlighting
- **Content Discovery**: Find valuable information via highlights

## Related NIPs
- NIP-18: Quote reposts (similar pattern)
- Standard URL cleaning practices 