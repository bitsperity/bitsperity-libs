# NIP-23: Long-form Content

## Meta
- **Status**: draft optional
- **Category**: Content/Publishing
- **Required**: optional
- **Purpose**: Defines kind:30023 addressable events for articles and blog posts

## Summary
Standard for long-form text content (articles, blog posts) using kind:30023 addressable events with Markdown content.

## Core Concepts
- **Kind 30023**: Published articles (addressable events)
- **Kind 30024**: Draft articles (same structure)
- **Markdown content**: Rich text formatting in content field
- **Addressable**: Identified by kind:pubkey:d-tag for editability
- **Metadata tags**: Title, summary, image, publication date

## Content Format
- **Markdown**: Content field contains Markdown-formatted text
- **Plain text focus**: Maximize compatibility across clients
- **No HTML**: Must not add HTML to Markdown
- **No line breaks**: Don't hard-break paragraphs at arbitrary column limits

## Standard Metadata Tags
- **title**: Article title `["title", "My Article Title"]`
- **summary**: Brief article summary `["summary", "This article discusses..."]`
- **image**: Header/cover image URL `["image", "https://example.com/cover.jpg"]`
- **published_at**: First publication timestamp `["published_at", "1675642635"]`
- **t**: Topic/hashtag tags `["t", "bitcoin"]` (lowercase)

## Editability
- **D-tag required**: Identifier for article `["d", "my-article-slug"]`
- **Replaceable**: New versions replace old ones
- **Relay support**: Requires relays that implement addressable events
- **Version management**: Clients should hide old versions

## Linking and References
- **NIP-27 references**: Use nostr: URIs for mentions/quotes
- **NIP-21 format**: `nostr:npub1...`, `nostr:nevent1...`, etc.
- **A-tag links**: Reference with `["a", "30023:pubkey:d-tag"]`
- **NIP-19 naddr**: Share with naddr codes

## Example Article Event
```json
{
  "kind": 30023,
  "content": "# My Article\n\nThis is the content in Markdown...",
  "tags": [
    ["d", "my-article-slug"],
    ["title", "My Article Title"],
    ["summary", "A brief summary of the article"],
    ["published_at", "1675642635"],
    ["t", "nostr"],
    ["t", "publishing"]
  ]
}
```

## Comments
- **NIP-22 comments**: Use kind:1111 for article comments
- **Threading**: Comments can have nested replies
- **Scope**: Comments reference article via A-tag

## Client Considerations
- **Social client exemption**: Kind:1 focused clients not expected to implement
- **Rich rendering**: Support Markdown formatting
- **Metadata display**: Show title, summary, publication date
- **Edit detection**: Handle article updates appropriately

## Discovery and Sharing
- **A-tag queries**: Find articles by author or topic
- **T-tag filtering**: Discover by hashtags/topics
- **Cross-references**: Articles can reference each other
- **External links**: Link to articles from other content

## Use Cases
- **Blogging**: Personal or professional blog posts
- **Documentation**: Technical documentation and guides
- **News articles**: Journalistic content
- **Academic papers**: Long-form research and analysis
- **Creative writing**: Stories, essays, poetry

## Implementation Notes
- **Markdown compatibility**: Standard Markdown without HTML
- **Image hosting**: External image URLs (no inline images)
- **Text wrapping**: Let clients handle line wrapping
- **Metadata consistency**: Use standardized tag names

## Related NIPs
- NIP-01 (addressable events)
- NIP-19 (naddr codes for sharing)
- NIP-21 (nostr: URI references)
- NIP-22 (comments on articles)
- NIP-27 (text note references) 