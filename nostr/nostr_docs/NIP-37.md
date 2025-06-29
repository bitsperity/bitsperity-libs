# NIP-37: Draft Events

## Meta
- **Status**: draft optional
- **Category**: Content/Publishing
- **Required**: optional
- **Purpose**: Defines draft versions of events before publication

## Summary
Enables creation of draft versions for various event types using specialized draft event kinds parallel to their published counterparts.

## Core Concepts
- **Draft kinds**: Special event kinds for draft versions
- **Draft-to-published**: Mechanism to convert drafts to published events
- **Addressable drafts**: Using d-tag for draft identification
- **Ephemeral nature**: Drafts may be deleted after publication

## Draft Event Kinds
- **Kind 30024**: Draft long-form articles (published as kind:30023)
- **Kind 21000-22999**: Draft versions of kinds 1000-1999
- **Kind 31000-31999**: Draft versions of kinds 1000-1999 (addressable)
- **Pattern**: Draft kind = published kind + 20000 (for addressable events)

## Draft Structure
Draft events mirror their published counterparts but:
- **Different kind**: Use draft-specific kind number
- **Same tags**: Include same metadata tags as published version
- **Draft markers**: May include draft-specific tags
- **Content**: Same content format as published version

## Example Draft Article
```json
{
  "kind": 30024,
  "content": "# My Draft Article\n\nThis is still being written...",
  "tags": [
    ["d", "my-article-draft"],
    ["title", "My Draft Article"],
    ["published_at", "1675642635"]
  ]
}
```

## Publishing Workflow
1. **Create draft**: Author creates draft event
2. **Edit iteratively**: Update draft with new versions
3. **Publish**: Create published event with published kind
4. **Optional cleanup**: Delete or keep draft for history

## Draft Management
- **Private drafts**: Drafts may be kept on private relays
- **Collaboration**: Multiple authors can collaborate on drafts
- **Version history**: Keep history of draft iterations
- **Preview sharing**: Share draft links for feedback

## Client Implementation
- **Draft UI**: Separate interface for managing drafts
- **Auto-save**: Automatically save drafts while editing
- **Publish button**: Easy conversion from draft to published
- **Draft list**: Show user's draft events separately

## Use Cases
- **Article writing**: Draft blog posts and articles
- **Content review**: Get feedback before publishing
- **Collaborative writing**: Multiple contributors to content
- **Version control**: Track changes during writing process
- **Private notes**: Keep private drafts for later publication

## Draft-Specific Tags
- **draft**: Mark as draft `["draft", "true"]`
- **version**: Draft version number `["version", "1"]`
- **collaborators**: Co-authors `["p", "<pubkey>", "", "collaborator"]`
- **review**: Request review `["review", "requested"]`

## Privacy Considerations
- **Private relays**: Use private relays for sensitive drafts
- **Access control**: Limit access to draft content
- **Accidental publication**: Prevent accidental draft publication
- **Leak prevention**: Be cautious about draft content leaking

## Conversion Process
When publishing draft:
1. **Create published event**: Same content, published kind
2. **Preserve metadata**: Copy relevant tags to published version
3. **Update timestamps**: Use current time for published event
4. **Reference draft**: Optionally reference original draft

## Draft Deletion
- **Post-publication**: May delete drafts after publishing
- **Abandoned drafts**: Delete drafts that won't be published
- **Client cleanup**: Clients may automatically clean old drafts
- **User choice**: Users decide whether to keep draft history

## Related NIPs
- NIP-01 (basic event structure)
- NIP-23 (long-form content for article drafts)
- NIP-33 (addressable events for draft management)
- NIP-09 (event deletion for draft cleanup) 