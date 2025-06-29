# NIP-68: Picture-first feeds

## Meta
- **Status**: Draft, Optional
- **Category**: Media/Social
- **Required**: No
- **Purpose**: Instagram-style picture-centric posts

## Summary
Defines kind 20 events for picture-first clients where images take center stage. Self-contained posts with externally hosted images referenced via imeta tags, designed for visual-first social platforms.

## Core Concepts
- **Picture-First**: Images are the primary content
- **Multiple Images**: Support for image carousels/galleries
- **External Hosting**: Images hosted externally, referenced by URL
- **Rich Metadata**: Comprehensive image information and tags
- **User Tagging**: Tag users in specific image locations

## Implementation Details
### Event Structure (20)
- Required `title` tag for short post title
- Content field contains image description
- Multiple `imeta` tags for each image
- Support for image annotation and user tagging

### Image Metadata (imeta)
- URL, media type, dimensions, alt text
- Blurhash for loading previews
- SHA256 hash for verification
- Multiple fallback URLs for redundancy
- User annotation with position coordinates

### Supported Formats
- APNG, AVIF, GIF, JPEG, PNG, WebP
- Filtering by media type support
- Language tags for text in images

## Use Cases
- **Visual Social Media**: Instagram-like photo sharing
- **Photography**: Professional photo galleries
- **Art Sharing**: Digital art and creative content
- **Documentation**: Visual storytelling and documentation
- **Commerce**: Product photography and showcases

## Related NIPs
- NIP-92: Image metadata (imeta) specification
- NIP-71: Video events for mixed media feeds
- NIP-94: File metadata standards 