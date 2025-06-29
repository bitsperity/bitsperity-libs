# NIP-B0: Web Bookmarking

## Meta
- **Status**: Draft, Optional
- **Category**: Content/Bookmarking
- **Required**: No
- **Purpose**: HTTP/HTTPS web bookmark storage

## Summary
Defines addressable events (kind 39701) for web bookmarks using HTTP/HTTPS scheme. Provides editable bookmark storage with structured metadata and URL normalization for consistent querying.

## Core Concepts
- **Web-Specific**: Only HTTP/HTTPS URLs supported
- **Addressable Events**: Editable and deletable bookmarks
- **URL Normalization**: Consistent URL handling for queries
- **Rich Metadata**: Titles, descriptions, and categorization
- **Relay Requirements**: Proper replaceable event support needed

## Implementation Details
### Bookmark Event (39701)
- Addressable event with `d` tag containing normalized URL
- Content field for detailed description (required, can be empty)
- URL normalization removes scheme, querystring, and hash
- Exception for URLs requiring querystring for routing

### Metadata Tags
- `d`: Normalized URL identifier (required)
- `published_at`: First publication timestamp
- `title`: HTML link title attribute
- `t`: Topic hashtags for categorization
- Additional custom metadata as needed

### URL Processing Rules
- Remove `https://` or `http://` scheme
- Remove querystring and hash fragments
- Keep querystring only when explicitly required
- Use normalized URL as unique identifier

## Use Cases
- **Personal Bookmarks**: Private bookmark collection
- **Shared Links**: Public link sharing with descriptions
- **Content Curation**: Organized link collections
- **Reading Lists**: Articles and resources for later
- **Research Collections**: Academic and professional references

## Related NIPs
- NIP-09: Event deletion for bookmark management
- NIP-22: Comments (1111) for bookmark discussion 