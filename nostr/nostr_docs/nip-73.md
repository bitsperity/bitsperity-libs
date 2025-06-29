# NIP-73: External Content IDs

## Meta
- **Status**: Draft, Optional
- **Category**: Content/References
- **Required**: No
- **Purpose**: Reference established global content identifiers

## Summary
Defines `i` tags for referencing external content identifiers (ISBNs, DOIs, etc.) and `k` tags for categorizing ID types. Enables querying all Nostr events associated with established global content IDs.

## Core Concepts
- **Global Identifiers**: Established content ID systems (ISBN, DOI, ISAN)
- **Unified Tagging**: Standard format for external references
- **Queryable Content**: Find all events about specific content
- **Cross-Platform**: Reference content across different systems
- **Optional URL Hints**: Provide fallback web links

## Supported ID Types
- **Web URLs**: Normalized URLs without fragments
- **Books**: ISBN without hyphens (isbn:9780765382030)
- **Papers**: DOI in lowercase (doi:10.1000/example)
- **Movies**: ISAN without version (isan:0000-0000-401A-0000-7)
- **Podcasts**: GUID-based references for feeds/episodes
- **Blockchain**: Transaction and address references
- **Geographic**: Geohash location references

## Implementation Details
### Tag Structure
- `i` tag contains the identifier in specified format
- `k` tag contains the identifier type/category
- Optional second parameter in `i` tag for URL hint

### Identifier Formats
- Standardized prefixes (isbn:, doi:, etc.)
- Lowercase normalization where specified
- Consistent formatting for reliable queries
- Blockchain-specific formats with chain identification

## Use Cases
- **Content Discovery**: Find all discussions about a book/movie
- **Academic References**: Link papers and research
- **Media Aggregation**: Collect all content about specific media
- **Cross-Platform Integration**: Reference external content systems
- **Content Analysis**: Track mentions across different contexts

## Related NIPs
- Standard identifier systems (ISBN, DOI, ISAN, etc.)
- Blockchain reference standards 