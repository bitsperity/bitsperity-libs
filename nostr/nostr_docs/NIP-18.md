# NIP-18: Reposts

## Meta
- **Status**: draft optional
- **Category**: Social/Content Sharing
- **Required**: optional
- **Purpose**: Defines repost and quote repost mechanisms for sharing content

## Summary
Enables sharing of existing content through reposts (kind:6) and quote reposts (kind:1 with q-tags).

## Core Concepts
- **Kind 6**: Simple repost (kind:1 content only)
- **Kind 16**: Generic repost (any kind except kind:1)  
- **Quote reposts**: Kind:1 with embedded q-tag and NIP-21 reference
- **Content preservation**: Reposts contain original event JSON

## Simple Reposts (Kind 6)
- **Purpose**: Signal that kind:1 text note is worth reading
- **Content**: Stringified JSON of reposted note (may be empty for NIP-70 protected events)
- **Required tags**:
  - e-tag: ID of reposted note with relay URL
  - p-tag: Pubkey of original author (should include)

## Quote Reposts (Kind 1 + q-tag)
- **Mechanism**: Regular kind:1 note with q-tag and NIP-21 reference
- **Content**: Must include nevent/note/naddr reference in content
- **Q-tag format**: `["q", "<event-id>", "<relay-url>", "<pubkey>"]`
- **Thread separation**: q-tags prevent inclusion in reply threads

## Generic Reposts (Kind 16)
- **Purpose**: Repost any event kind except kind:1
- **K-tag**: Should include kind number of reposted event
- **Content**: Stringified JSON of original event
- **Use cases**: Repost articles, media, marketplace items, etc.

## Implementation Requirements
- **Content format**: Original event as stringified JSON when included
- **Relay hints**: e-tag must include relay URL (third parameter)
- **Author notification**: p-tag enables author notification
- **NIP-21 compliance**: Quote reposts must include nostr: URI in content

## Client Behavior
- **Display**: Show as shared content with repost attribution
- **Engagement**: Allow reactions/replies to both repost and original
- **Threading**: Quote reposts don't appear in original's reply thread
- **Protected content**: Empty content for encrypted/protected events

## Use Cases
- **Content amplification**: Share interesting posts with followers
- **Commentary**: Add context or opinion with quote reposts
- **Cross-kind sharing**: Repost articles, marketplace items, etc.
- **Social proof**: Signal content endorsement

## Security Considerations
- **Content verification**: Validate reposted JSON matches referenced event
- **Spam prevention**: Monitor for excessive reposting
- **Protected content**: Respect NIP-70 protection with empty content

## Related NIPs
- NIP-01 (basic event structure)
- NIP-10 (threading - q-tags prevent thread inclusion)
- NIP-21 (nostr: URI scheme for quote reposts)
- NIP-70 (protected events) 