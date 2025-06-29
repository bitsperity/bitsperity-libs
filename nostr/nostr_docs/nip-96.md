# NIP-96: HTTP File Storage Integration

## Meta
- **Status**: Draft, Optional
- **Category**: File Storage/HTTP Integration
- **Required**: No
- **Purpose**: REST API for HTTP file storage servers with Nostr

## Summary
Defines REST API for HTTP file storage servers to integrate with Nostr network. Enables file upload/download with metadata, authentication, and service discovery through standardized endpoints and NIP-98 authentication.

## Core Concepts
- **HTTP File Storage**: REST API for file operations
- **Service Discovery**: /.well-known/nostr/nip96.json endpoint
- **NIP-98 Authentication**: Cryptographic auth for uploads
- **Media Transformations**: Automatic image processing
- **Payment Plans**: Multiple service tiers and pricing

## Implementation Details
### Service Discovery
- /.well-known/nostr/nip96.json configuration
- API URL, download URL, supported features
- Plans with limits and capabilities
- Terms of service and content types

### Upload API
- POST multipart/form-data to api_url
- Required: file, optional: caption, expiration
- NIP-98 Authorization header required
- Returns NIP-94 compatible metadata

### Download API
- GET api_url/<sha256-hash>(.ext)
- File extension optional but recommended
- Media transformations via query parameters
- Standard and custom download URLs

## Use Cases
- **Media Hosting**: Decentralized file storage
- **Content Distribution**: CDN-like file delivery
- **Image Processing**: Automatic resizing and optimization
- **Backup Services**: Personal file storage
- **Integration Services**: Nostr-compatible file hosts

## Related NIPs
- NIP-98: HTTP authentication
- NIP-94: File metadata format
- NIP-92: Inline media metadata 