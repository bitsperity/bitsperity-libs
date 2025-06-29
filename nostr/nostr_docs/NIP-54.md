# NIP-54: Wiki

## Meta
- **Status**: draft optional
- **Category**: Content/Knowledge
- **Required**: optional
- **Purpose**: Defines wiki functionality for collaborative knowledge management

## Summary
Enables creation of wiki pages and collaborative knowledge bases using addressable events with versioning and collaborative editing.

## Core Event Types

### Wiki Article (Kind 30818)
**Purpose**: Create wiki articles/pages
```json
{
  "kind": 30818,
  "content": "# Bitcoin\n\nBitcoin is a decentralized digital currency...",
  "tags": [
    ["d", "bitcoin"],
    ["title", "Bitcoin"],
    ["summary", "Introduction to Bitcoin cryptocurrency"],
    ["published_at", "1709668800"],
    ["t", "cryptocurrency"],
    ["t", "bitcoin"],
    ["r", "https://bitcoin.org"]
  ]
}
```

### Wiki Page Request (Kind 30819)
**Purpose**: Request creation of new wiki pages
```json
{
  "kind": 30819,
  "content": "We need a page about Lightning Network payment channels",
  "tags": [
    ["d", "lightning-request-2024"],
    ["title", "Lightning Network Payment Channels"],
    ["r", "https://lightning.network"]
  ]
}
```

## Wiki Structure

### Page Hierarchy
- **Root pages**: Top-level wiki pages
- **Subpages**: Nested pages using path-like d-tags
- **Categories**: Organize pages by topic tags
- **Cross-references**: Link between wiki pages

### Content Format
- **Markdown**: Standard Markdown formatting
- **Internal links**: Link to other wiki pages
- **External references**: Links to external sources
- **Media embedding**: Images and videos in pages

## Wiki Tags

### Required Tags
- **d**: Page identifier/slug
- **title**: Page title

### Optional Tags
- **summary**: Brief page summary
- **published_at**: Original publication time
- **t**: Topic/category tags
- **r**: Reference URLs
- **previous**: Previous version event ID
- **contributors**: Contributor pubkeys
- **license**: Content license

## Collaborative Editing

### Version Control
- **Page history**: Track all versions of wiki pages
- **Change tracking**: Show what changed between versions
- **Conflict resolution**: Handle simultaneous edits
- **Rollback**: Restore previous versions

### Contribution Model
- **Open editing**: Anyone can contribute
- **Moderated editing**: Require approval for changes
- **Protected pages**: Restrict editing to specific users
- **Anonymous contributions**: Allow anonymous editing

## Page Management

### Page Creation
```json
{
  "kind": 30818,
  "content": "# New Topic\n\nThis is a new wiki page...",
  "tags": [
    ["d", "new-topic"],
    ["title", "New Topic"],
    ["t", "category"]
  ]
}
```

### Page Updates
```json
{
  "kind": 30818,
  "content": "# Updated Topic\n\nThis page has been updated...",
  "tags": [
    ["d", "new-topic"],
    ["title", "Updated Topic"],
    ["previous", "previous-version-event-id"]
  ]
}
```

## Wiki Features

### Navigation
- **Table of contents**: Auto-generated page TOCs
- **Search functionality**: Full-text search across wiki
- **Categories**: Browse pages by category
- **Recent changes**: Show recent page updates

### Content Features
- **Templates**: Reusable page templates
- **Infoboxes**: Structured information boxes
- **References**: Citation and reference management
- **Discussion pages**: Discussion for each wiki page

## Use Cases
- **Knowledge bases**: Company or community wikis
- **Documentation**: Technical documentation
- **Educational content**: Learning materials and courses
- **Research collaboration**: Collaborative research notes
- **Open source docs**: Project documentation

## Client Implementation

### Wiki Interface
- **Page editor**: Rich text or Markdown editor
- **Page browser**: Navigate and browse wiki pages
- **Search interface**: Search across all wiki content
- **History viewer**: View page history and changes

### Collaboration Features
- **Edit notifications**: Notify about page changes
- **User contributions**: Track user contributions
- **Review system**: Review and approve changes
- **Conflict resolution**: Handle editing conflicts

## Content Organization

### Page Structure
- **Hierarchical organization**: Nested page structure
- **Cross-references**: Inter-page links and references
- **Categories**: Topic-based organization
- **Tags**: Flexible tagging system

### Content Policies
- **Content guidelines**: Wiki content standards
- **Moderation**: Content moderation policies
- **Licensing**: Content licensing and attribution
- **Quality control**: Maintain content quality

## Technical Features

### Synchronization
- **Multi-relay sync**: Sync across multiple relays
- **Conflict detection**: Detect editing conflicts
- **Merge resolution**: Resolve content merges
- **Backup systems**: Backup wiki content

### Performance
- **Caching**: Cache frequently accessed pages
- **Indexing**: Index content for fast search
- **Loading optimization**: Optimize page loading
- **Scalability**: Handle large wiki systems

## Privacy and Access Control
- **Public wikis**: Open access wikis
- **Private wikis**: Restricted access wikis
- **Page permissions**: Per-page access control
- **Anonymous editing**: Allow anonymous contributions

## Related NIPs
- NIP-01 (addressable events)
- NIP-23 (long-form content)
- NIP-22 (comments for discussion pages)
- NIP-50 (search capability) 