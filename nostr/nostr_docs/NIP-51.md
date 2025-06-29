# NIP-51: Lists

## Meta
- **Status**: draft optional
- **Category**: Lists/Collections
- **Required**: optional
- **Purpose**: Defines standardized list events for organizing and categorizing Nostr content and users

## Summary
Enables creation of various types of lists using addressable events for organizing people, content, and other Nostr entities.

## Core Concepts
- **Addressable lists**: Use kind:30000-30003 addressable events
- **List types**: Different kinds for different list purposes
- **P-tags and E-tags**: Reference people and events in lists
- **Private/Public**: Support for both public and private lists
- **List metadata**: Titles, descriptions, and other metadata

## Standard List Types

### Follow Categorization (Kind 30000)
**Purpose**: Categorize follows into groups
```json
{
  "kind": 30000,
  "content": "",
  "tags": [
    ["d", "friends"],
    ["title", "Close Friends"],
    ["p", "pubkey1", "wss://relay.com", "Alice"],
    ["p", "pubkey2", "wss://relay.com", "Bob"]
  ]
}
```

### Generic Lists (Kind 30001)
**Purpose**: General-purpose lists of people and/or events
```json
{
  "kind": 30001,
  "content": "My favorite Bitcoin articles",
  "tags": [
    ["d", "bitcoin-articles"],
    ["title", "Bitcoin Reading List"],
    ["e", "event-id-1", "wss://relay.com"],
    ["e", "event-id-2", "wss://relay.com"],
    ["a", "30023:author:article-slug", "wss://relay.com"]
  ]
}
```

### Relay Lists (Kind 30002)
**Purpose**: Organize relay collections
```json
{
  "kind": 30002,
  "content": "My preferred relays",
  "tags": [
    ["d", "my-relays"],
    ["title", "Main Relays"],
    ["relay", "wss://relay1.com"],
    ["relay", "wss://relay2.com"]
  ]
}
```

### Bookmark Lists (Kind 30003)
**Purpose**: Bookmark events for later reference
```json
{
  "kind": 30003,
  "content": "Important posts to remember",
  "tags": [
    ["d", "bookmarks"],
    ["title", "Bookmarks"],
    ["e", "bookmark-event-1"],
    ["a", "30023:author:article"]
  ]
}
```

## List Structure
**Standard tags**:
- **d**: List identifier (required for addressable events)
- **title**: Human-readable list name
- **description**: Longer description of list purpose
- **image**: Cover image URL for the list

**Content tags**:
- **p**: People (pubkeys) `["p", "<pubkey>", "<relay>", "<petname>"]`
- **e**: Events `["e", "<event-id>", "<relay>"]`
- **a**: Addressable events `["a", "<kind>:<pubkey>:<d-tag>", "<relay>"]`
- **relay**: Relay URLs `["relay", "<relay-url>"]`
- **t**: Topic tags `["t", "<hashtag>"]`

## Private Lists
**Encrypted list content**:
- Use standard list structure but encrypt sensitive content
- Public metadata (title, description) remain unencrypted
- Private member lists using encrypted p-tags or content field

## List Management
**Adding items**:
- Create new list event with updated tags
- Preserve existing items and add new ones
- Use replaceable event behavior

**Removing items**:
- Create new list event without removed items
- Complete replacement of previous list version

**List discovery**:
- Query by author and kind for user's lists
- Search by title or description
- Browse public lists by topic

## Use Cases
- **Contact organization**: Organize follows into meaningful groups
- **Content curation**: Curate lists of interesting content
- **Reading lists**: Save articles and posts for later
- **Relay management**: Organize personal relay collections
- **Topic collections**: Collect content around specific topics
- **Recommendation lists**: Share curated recommendations

## Client Implementation
**List UI**:
- **List browser**: Browse and search available lists
- **List editor**: Create and edit lists with intuitive interface
- **Quick actions**: Add to list from context menus
- **Import/export**: Share lists between clients

**List features**:
- **Collaborative lists**: Multiple contributors to lists
- **List templates**: Pre-made list templates
- **Auto-categorization**: Suggest categorization for new items
- **List analytics**: Show list engagement and popularity

## Privacy Considerations
- **Public lists**: All content visible to everyone
- **Private lists**: Use encryption for sensitive content
- **Selective sharing**: Share specific lists with specific people
- **List discovery**: Control whether lists are discoverable

## Performance Considerations
- **List size**: Consider performance impact of very large lists
- **Update frequency**: Efficient handling of frequent list updates
- **Caching**: Cache list data for better performance
- **Pagination**: Handle large lists with pagination

## List Interactions
- **Following lists**: Subscribe to others' public lists
- **List reactions**: React to or comment on lists
- **List sharing**: Share lists via nostr: URIs
- **List forking**: Create copies of others' lists

## Migration from NIP-02
- **Follow lists**: Migrate kind:3 follows to kind:30000 categories
- **Enhanced metadata**: Add titles and descriptions to follow lists
- **Multiple lists**: Create multiple categorized follow lists
- **Backward compatibility**: Maintain compatibility with kind:3

## Related NIPs
- NIP-01 (addressable events)
- NIP-02 (follow lists - superseded functionality)
- NIP-19 (naddr codes for sharing lists)
- NIP-23 (long-form content in lists)
- NIP-65 (relay lists) 