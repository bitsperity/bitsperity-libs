# NIP-10: Text Notes and Threads

## Meta
- **Status**: draft optional
- **Category**: Social/Threading
- **Required**: optional  
- **Purpose**: Defines kind:1 text notes and threading system using e-tags and p-tags

## Summary
Standard for text notes (kind:1) and reply threading using marked e-tags. Defines how to create threaded conversations.

## Core Concepts
- **Kind 1**: Simple plaintext text note
- **Threading**: Use e-tags to reference parent/root events
- **Marked e-tags**: Preferred method with "reply"/"root" markers
- **P-tags**: Include all participants in reply thread
- **Plain text only**: No HTML/Markdown formatting

## Marked E-tags (Preferred)
Format: `["e", <event-id>, <relay-url>, <marker>, <pubkey>]`

**Markers:**
- **"root"**: References the root event of thread
- **"reply"**: References direct parent being replied to
- **No marker**: General reference (not recommended for replies)

**Threading Rules:**
- **Top-level reply**: Only "root" marker to thread root
- **Nested reply**: Both "root" (thread root) and "reply" (direct parent)
- **Root discovery**: Follow "root" tags to find thread beginning

## P-tag Usage
- **Include all participants**: All pubkeys from parent's p-tags plus parent author
- **Notification system**: Alerts all thread participants of new replies
- **Order irrelevant**: No specific ordering requirement for p-tags

## Q-tags for Citations
- **Format**: `["q", "<event-id>", "<relay-url>", "<pubkey>"]`
- **Purpose**: Quote/cite events in content using NIP-21 references
- **Notification**: May notify quoted author (implementation dependent)

## Content Guidelines
- **Plain text only**: No markup languages allowed
- **NIP-21 references**: Use nostr: URIs for mentions/quotes
- **Readability**: Human-readable text content

## Deprecated: Positional E-tags
**Legacy support only** - ambiguous and error-prone:
- 0 e-tags: Not a reply
- 1 e-tag: Reply to that event  
- 2 e-tags: [root, reply]
- 3+ e-tags: [root, mentions..., reply]

## Implementation Best Practices
- **Use marked e-tags**: Always prefer marked over positional
- **Include relay hints**: Add relay URLs to e/p tags when possible
- **Pubkey hints**: Include pubkeys in e-tags for better event discovery
- **Thread continuity**: Maintain consistent root references

## Threading Examples
**Root post**: No e-tags, just content
**First reply**: `["e", <root-id>, <relay>, "root", <root-pubkey>]`
**Nested reply**: 
- `["e", <root-id>, <relay>, "root", <root-pubkey>]`
- `["e", <parent-id>, <relay>, "reply", <parent-pubkey>]`

## Related NIPs
- NIP-01 (basic event structure)
- NIP-21 (nostr: URI scheme)
- NIP-27 (text note references) 