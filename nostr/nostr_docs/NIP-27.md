# NIP-27: Text Note References

## Meta
- **Status**: draft optional
- **Category**: Text Processing/References
- **Required**: optional
- **Purpose**: Defines how to handle nostr: URI references in text note content

## Summary
Standardizes mention and reference handling in kind:1 text notes using nostr: URIs from NIP-21.

## Core Concepts
- **nostr: URIs**: References to Nostr entities in text content
- **Inline mentions**: Embedded references within text
- **Automatic tagging**: Generate corresponding tags for mentions
- **Client rendering**: Display referenced entities as rich elements

## Supported References
- **Profiles**: `nostr:npub1...` or `nostr:nprofile1...`
- **Events**: `nostr:note1...` or `nostr:nevent1...`
- **Addressable events**: `nostr:naddr1...`

## Tag Generation
For each nostr: URI in content, clients SHOULD generate corresponding tags:

**Profile references → p-tags:**
- `nostr:npub1...` → `["p", "<pubkey>"]`
- `nostr:nprofile1...` → `["p", "<pubkey>", "<relay>"]`

**Event references → e-tags:**
- `nostr:note1...` → `["e", "<event-id>"]`
- `nostr:nevent1...` → `["e", "<event-id>", "<relay>"]`

**Addressable event references → a-tags:**
- `nostr:naddr1...` → `["a", "<kind>:<pubkey>:<d-tag>", "<relay>"]`

## Example Implementation
Text content:
```
Check out this post by nostr:npub1abc... about nostr:note1def...
```

Generated tags:
```json
[
  ["p", "abc123..."],
  ["e", "def456..."]
]
```

## Client Rendering
- **Profile mentions**: Display as `@username` or rich profile card
- **Event mentions**: Display as embedded quote or link
- **Addressable events**: Display as embedded article preview or link
- **Clickable**: Make references clickable for navigation

## Backwards Compatibility
- **Legacy #[n] format**: Deprecated but may still be supported
- **Tag-only**: Events may have p/e/a tags without content references
- **Content-only**: Events may have content references without tags

## Implementation Guidelines
- **Tag synchronization**: Keep tags and content references aligned
- **URI validation**: Validate nostr: URI format before processing
- **Graceful degradation**: Handle invalid/unresolvable references
- **Performance**: Avoid excessive tag generation for large texts

## Use Cases
- **User mentions**: `@username` style mentions in social posts
- **Event quotes**: Embed quotes from other posts
- **Article references**: Link to long-form content
- **Cross-content linking**: Rich interlinking between content types

## Rendering Considerations
- **Context awareness**: Different rendering for mentions vs quotes
- **Privacy**: Respect referenced users' privacy settings
- **Availability**: Handle missing/deleted referenced content gracefully
- **Performance**: Lazy-load referenced content when needed

## Security Considerations
- **Spam prevention**: Limit number of references per note
- **Verification**: Verify referenced content exists before rendering
- **Privacy**: Don't expose private information through references

## Related NIPs
- NIP-01 (basic event structure with p/e/a tags)
- NIP-19 (bech32 encoding for nostr: URIs)
- NIP-21 (nostr: URI scheme)
- NIP-10 (threading with e-tags) 