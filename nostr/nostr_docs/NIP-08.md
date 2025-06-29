# NIP-08: Handling Mentions

## Meta
- **Status**: final unrecommended optional
- **Category**: Text Processing
- **Required**: optional  
- **Purpose**: DEPRECATED - Defines inline mention handling in text notes

## Summary
**DEPRECATED** - Replaced by NIP-27. Originally defined #[index] notation for inline mentions of users and events in kind:1 notes.

## Core Concepts
- **Inline mentions**: References to users (@user) or events in text content
- **Index notation**: Replace mentions with #[index] referencing tags array
- **Tag correlation**: #[0] refers to tags[0], #[1] to tags[1], etc.
- **Autocomplete**: Client-side mention suggestions and replacement

## Original Mechanism
1. User types @mention or includes mention via UI
2. Client adds corresponding p-tag or e-tag to tags array  
3. Replace mention in content with #[index] notation
4. Reader clients expand #[index] back to rich content

## Content Processing
- **Authoring**: @mention → #[index] + corresponding tag
- **Rendering**: #[index] → rich display (profile link, event preview)
- **Validation**: Index must be valid array position
- **Tag types**: Only p-tags and e-tags supported for mentions

## Security Considerations
- **Index bounds**: Must validate index within tags array bounds
- **Tag type validation**: Only process p/e tags, ignore others
- **Invalid indices**: Display as plain text if index invalid
- **Content isolation**: Don't process mentions in encrypted content

## Deprecation Status
- **Replaced by**: NIP-27 (Text Note References)  
- **New approach**: Direct nostr: URI embedding in content
- **Advantages**: Better context, no index fragility, universal support
- **Migration**: New implementations should use NIP-27

## Problems with NIP-08
- **Index fragility**: Tag reordering breaks mention indices
- **Limited context**: Hard to understand mentions without full event
- **Implementation complexity**: Complex index management
- **Poor UX**: Confusing #[index] notation for users

## Related NIPs
- NIP-27 (replacement - Text Note References)
- NIP-01 (basic event structure and tags)
- NIP-10 (text note threading) 