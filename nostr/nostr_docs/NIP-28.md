# NIP-28: Public Chat

## Meta
- **Status**: draft optional
- **Category**: Communication/Chat
- **Required**: optional
- **Purpose**: Defines public chat channels using kind:40 and kind:42 events

## Summary
Public chat system using kind:40 for channel creation/metadata and kind:42 for chat messages.

## Core Concepts
- **Kind 40**: Channel creation and metadata (replaceable)
- **Kind 42**: Chat messages within channels
- **Channel ID**: 32-byte hex string identifying the channel
- **Public visibility**: All messages visible to anyone
- **E-tag references**: Messages reference channel and optionally parent messages

## Channel Creation (Kind 40)
**Purpose**: Create and manage channel metadata
- **Replaceable**: New events replace old ones for same channel
- **Required tags**: No specific tags required
- **Optional metadata**: Name, about, picture in content JSON

```json
{
  "kind": 40,
  "content": "{\"name\": \"My Channel\", \"about\": \"Discussion about...\", \"picture\": \"https://...\"}",
  "tags": []
}
```

## Chat Messages (Kind 42)
**Purpose**: Send messages within a channel
- **E-tag required**: `["e", "<channel-id>", "<relay-url>", "root"]`
- **Threading**: Optional e-tag to parent message for replies
- **Content**: Plain text message content

```json
{
  "kind": 42,
  "content": "Hello everyone!",
  "tags": [
    ["e", "<channel-id>", "<relay-url>", "root"],
    ["e", "<parent-msg-id>", "<relay-url>", "reply"]
  ]
}
```

## Channel Discovery
- **Kind 40 queries**: Find channels by content/metadata
- **Relay-specific**: Channels are typically relay-specific
- **No global registry**: No centralized channel directory

## Threading
- **Root reference**: All messages must reference channel ID
- **Reply threading**: Optional parent message reference
- **Marker usage**: Use "root" and "reply" markers for clarity
- **NIP-10 compatibility**: Follows NIP-10 threading conventions

## Moderation
**Channel-level moderation is out of scope for this NIP:**
- **Relay-level**: Relays may implement their own moderation
- **Client-level**: Clients may implement local filtering
- **No built-in moderation**: No standardized moderation mechanisms

## Message Ordering
- **Timestamp ordering**: Messages ordered by created_at timestamp
- **Relay delivery**: No guaranteed message delivery order
- **Client sorting**: Clients handle message ordering and display

## Channel Metadata
**Optional fields in kind:40 content:**
- **name**: Channel display name
- **about**: Channel description
- **picture**: Channel icon/image URL
- **Default**: Channels may exist without metadata

## Implementation Notes
- **Ephemeral nature**: Messages are not guaranteed to persist
- **Relay selection**: Choose relays that support chat functionality
- **Rate limiting**: Be aware of relay rate limits for chat messages
- **Real-time updates**: Subscribe to relevant channels for live chat

## Use Cases
- **Public discussions**: Open topic-based discussions
- **Community chat**: Community-focused chat rooms
- **Event coordination**: Coordination for events or activities
- **Support channels**: Public help and support channels

## Client Considerations
- **Message display**: Show messages in chronological order
- **User identification**: Display sender information clearly
- **Threading UI**: Handle reply threading appropriately
- **Channel management**: Allow users to join/leave channels

## Related NIPs
- NIP-01 (basic event structure)
- NIP-10 (threading and reply handling)
- NIP-15 (marketplace - different chat use case)
- NIP-17 (private messaging - different privacy model) 