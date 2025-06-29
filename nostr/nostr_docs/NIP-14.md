# NIP-14: Subject Tag in Text Events

## Meta
- **Status**: draft optional
- **Category**: Social/Text Processing
- **Required**: optional
- **Purpose**: Defines subject tag for text events (like email subject lines)

## Summary
Adds optional subject tag to kind:1 text events for better organization and display in threaded message lists.

## Core Concepts
- **Subject tag**: `["subject", "<string>"]` in kind:1 events
- **Email-like**: Similar to email subject lines for message organization
- **Thread display**: Enables subject-based message list views
- **Reply handling**: Subject propagation in threaded conversations

## Usage
- **Tag format**: `["subject", "Meeting Tomorrow"]`
- **Content independent**: Subject separate from message content
- **Optional**: Not required for kind:1 events
- **Length limit**: Should be <80 characters (client truncation)

## Client Behavior
- **List display**: Show subject instead of content preview in message lists
- **Threading**: Clients should display threaded messages with subjects
- **Reply handling**: When replying, clients should replicate subject tag
- **Subject decoration**: May add "Re:" prefix for replies

## Implementation Notes
- **Fallback**: If no subject, use first few words of content
- **Truncation**: Long subjects will be truncated by clients
- **Thread continuity**: Maintain subject consistency in conversation threads
- **UI enhancement**: Improves threaded message organization

## Use Cases
- **Email-style threading**: Familiar subject-based conversation organization
- **Topic management**: Clear conversation topics in message lists
- **Client UX**: Better message list organization and scanning
- **Group chats**: Subject lines for group conversation topics

## Compatibility
- **Backward compatible**: Clients without NIP-14 support ignore subject tags
- **Progressive enhancement**: Adds value without breaking existing functionality
- **Optional adoption**: Clients can choose to implement or ignore

## Related NIPs
- NIP-01 (basic text events)
- NIP-10 (text note threading)
- NIP-28 (public chat channels) 