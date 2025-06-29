# NIP-50: Search Capability

## Meta
- **Status**: draft optional
- **Category**: Relay/Search
- **Required**: optional
- **Purpose**: Defines search functionality for relays to provide content search capabilities

## Summary
Enables relays to provide search functionality through a "search" filter parameter in REQ queries.

## Core Concepts
- **Search filter**: New "search" field in REQ filter objects
- **Full-text search**: Search through event content and metadata
- **Relay implementation**: Optional relay feature for content discovery
- **Query flexibility**: Support for various search query formats

## Search Filter Format
```json
{
  "search": "<search-query>",
  "kinds": [1],
  "limit": 20
}
```
- **search field**: Contains the search query string
- **Combined filters**: Can combine with other standard filters
- **Query format**: Relay-specific query format

## Example Search Queries
**Simple text search**:
```json
["REQ", "search-123", {"search": "bitcoin nostr", "kinds": [1]}]
```

**Search with time limits**:
```json
["REQ", "search-456", {
  "search": "lightning network",
  "kinds": [1],
  "since": 1677426000,
  "limit": 50
}]
```

**Author-specific search**:
```json
["REQ", "search-789", {
  "search": "protocol development",
  "authors": ["abc123..."],
  "kinds": [1, 30023]
}]
```

## Search Query Formats
**Basic text search**:
- **Simple terms**: `bitcoin lightning`
- **Phrase search**: `"exact phrase"`
- **Boolean operators**: `bitcoin AND lightning`
- **Exclusion**: `bitcoin -scam`
- **Wildcards**: `bitcoin*` (relay dependent)

**Advanced search**:
- **Field-specific**: `author:alice content:bitcoin`
- **Date ranges**: `after:2023-01-01 before:2023-12-31`
- **Tag search**: `tag:bitcoin tag:lightning`
- **Kind-specific**: `kind:1 kind:30023`

## Relay Implementation
**Search indexing**:
- **Content indexing**: Full-text search of event content
- **Metadata indexing**: Search event tags and metadata
- **Performance optimization**: Efficient search indices
- **Update handling**: Keep search index updated with new events

**Search capabilities**:
- **Tokenization**: Break text into searchable tokens
- **Stemming**: Match word variations (optional)
- **Ranking**: Relevance-based result ordering
- **Fuzzy matching**: Handle typos and variations (optional)

## Search Scope
**Searchable fields**:
- **Content field**: Primary search target
- **Tag values**: Search within tag values
- **Profile metadata**: Search user profiles (kind:0)
- **Article titles**: Search article titles and summaries

**Event types**:
- **Text notes**: kind:1 content search
- **Profiles**: kind:0 metadata search
- **Long-form**: kind:30023 article search
- **Custom kinds**: Relay-defined searchable kinds

## Client Implementation
**Search interface**:
- **Search input**: User-friendly search interface
- **Query building**: Help users build effective queries
- **Result display**: Show search results with relevance
- **Pagination**: Handle large result sets

**Search features**:
- **Autocomplete**: Suggest search terms
- **Filters**: Allow filtering by kind, author, date
- **Sorting**: Sort by relevance, date, engagement
- **Export**: Export search results

## Performance Considerations
**Relay optimization**:
- **Index efficiency**: Optimize search indices for performance
- **Query limits**: Limit complex or expensive queries
- **Caching**: Cache popular search results
- **Rate limiting**: Prevent search abuse

**Client optimization**:
- **Debouncing**: Debounce search input to reduce queries
- **Result caching**: Cache search results locally
- **Progressive loading**: Load results progressively
- **Query optimization**: Use specific filters when possible

## Use Cases
- **Content discovery**: Find interesting content on topics
- **Historical search**: Search through past events
- **User discovery**: Find users by interests or content
- **Research**: Academic or journalistic research
- **Monitoring**: Monitor mentions of specific topics

## Search Quality
**Relevance factors**:
- **Text matching**: How well query matches content
- **Recency**: Newer content may rank higher
- **Engagement**: Popular content may rank higher
- **Author relevance**: Author's relevance to query

**Result presentation**:
- **Snippets**: Show relevant text snippets
- **Highlighting**: Highlight matching terms
- **Context**: Provide context for matches
- **Metadata**: Show relevant event metadata

## Privacy Considerations
- **Search logging**: Be transparent about search query logging
- **User privacy**: Respect user privacy in search results
- **Content filtering**: Respect content-warning and NSFW flags
- **Access control**: Respect event visibility settings

## Limitations
- **Relay-specific**: Search capabilities vary by relay
- **No standardized syntax**: Query syntax not standardized
- **Performance impact**: Search can be resource-intensive
- **Index completeness**: May not index all historical content

## Related NIPs
- NIP-01 (basic query filters)
- NIP-11 (relay information document - could advertise search support)
- NIP-45 (counting results - complement to search) 