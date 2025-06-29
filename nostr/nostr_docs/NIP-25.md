# NIP-25: Reactions

## Meta
- **Status**: draft optional
- **Category**: Social/Engagement
- **Required**: optional
- **Purpose**: Defines kind:7 reaction events for likes, dislikes, and emoji responses

## Summary
Enables users to react to events with likes, dislikes, or custom emoji reactions using kind:7 events.

## Core Concepts
- **Kind 7**: Reaction event
- **Content-based meaning**: Reaction type determined by content field
- **Event targeting**: Use e-tags and p-tags to specify target
- **Universal reactions**: Works with any event kind

## Reaction Types
- **Like/Upvote**: Content "+" or empty string
- **Dislike/Downvote**: Content "-"
- **Emoji**: Custom emoji or NIP-30 shortcode
- **Custom**: Any other string (client interpretation)

## Required Tags
- **e-tag**: Target event ID (required)
  - Format: `["e", "<event-id>", "<relay-hint>", "<target-pubkey>"]`
  - Should be last e-tag if multiple present
- **p-tag**: Target event author (should be present)
  - Format: `["p", "<target-pubkey>", "<relay-hint>"]`
  - Should be last p-tag if multiple present

## Optional Tags
- **a-tag**: For addressable events (coordinates)
- **k-tag**: Kind of target event (recommended)

## Website Reactions (Kind 17)
For reacting to websites instead of Nostr events:
- **Kind 17**: Website reaction
- **r-tag**: Website URL `["r", "https://example.com/"]`
- **URL normalization**: Should normalize URLs for consistency
- **Fragment support**: Can react to page sections

## Custom Emoji Reactions
- **NIP-30 shortcodes**: `:shortcode:` in content
- **Emoji tag**: `["emoji", "shortcode", "image-url"]`
- **Single emoji**: Only one shortcode per reaction
- **Client rendering**: Replace shortcode with emoji image

## Implementation Guidelines
- **Target validation**: Verify e-tag points to valid event
- **Author notification**: p-tag enables author notification
- **Relay hints**: Include relay URLs when possible
- **Deduplication**: Clients may deduplicate reactions per user

## Client Behavior
- **Display options**: Show reaction counts, user lists, or inline
- **Emoji rendering**: Support custom emoji display
- **Filtering**: May filter out certain reaction types
- **Aggregation**: Count reactions by type and user

## Use Cases
- **Social engagement**: Like/dislike posts and comments
- **Emoji responses**: Express nuanced reactions
- **Website feedback**: React to external content
- **Content curation**: Signal content quality/preference

## Example Reaction Event
```json
{
  "kind": 7,
  "content": "+",
  "tags": [
    ["e", "target-event-id", "wss://relay.com", "target-author"],
    ["p", "target-author", "wss://relay.com"],
    ["k", "1"]
  ]
}
```

## Related NIPs
- NIP-01 (basic event structure)
- NIP-30 (custom emoji)
- NIP-10 (threading - for context) 