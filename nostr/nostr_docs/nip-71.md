# NIP-71: Video Events

## Meta
- **Status**: Draft, Optional
- **Category**: Media/Video
- **Required**: No
- **Purpose**: Dedicated video content posts with metadata

## Summary
Defines video events for dedicated video posts: normal videos (kind 21) and short videos (kind 22). Designed for video-specific clients like YouTube/TikTok rather than general microblogging, with comprehensive metadata support.

## Core Concepts
- **Video-Centric**: Videos are the primary content, not attachments
- **Dual Formats**: Normal (horizontal) vs short (vertical) videos
- **Rich Metadata**: Complete video information and variants
- **External Hosting**: Videos hosted externally with fallbacks
- **Multi-Resolution**: Different quality/resolution variants

## Implementation Details
### Event Types
- **Kind 21**: Normal videos (landscape, longer form)
- **Kind 22**: Short videos (portrait, social media style)
- Content field contains video description/summary

### Video Metadata (imeta)
- Multiple resolution variants with dimensions
- Video URLs with fallback servers
- Preview images at matching resolutions
- File hashes for verification
- Service provider information (NIP-96 support)

### Additional Tags
- `title`: Required video title
- `published_at`: Original publication timestamp
- `duration`: Video length in seconds
- `text-track`: WebVTT subtitle/caption files
- `segment`: Chapter markers with timestamps
- `content-warning`: NSFW or sensitive content

## Use Cases
- **Video Platforms**: YouTube-like video sharing
- **Short-Form Content**: TikTok-style vertical video feeds
- **Educational Content**: Instructional videos with chapters
- **Live Streaming**: Event recordings and replays
- **Entertainment**: Movie clips, comedy, music videos

## Related NIPs
- NIP-92: Image metadata (imeta) specification
- NIP-96: File storage and server integration
- NIP-68: Picture events for mixed media feeds 