# NIP-C7: Chats

## Meta
- **Status**: Draft, Optional
- **Category**: Communication/Chat
- **Required**: No
- **Purpose**: Simple chat message format

## Summary
Defines kind 9 events for chat messages with simple reply mechanism using `q` tags. Provides basic chat functionality with quoted replies and direct message threading.

## Core Concepts
- **Chat Messages**: Kind 9 events for basic messaging
- **Quote Replies**: Use `q` tags to reference parent messages
- **Simple Threading**: Direct parent-child relationships
- **Inline Quotes**: Content includes quoted message reference
- **Minimal Structure**: Basic chat without complex threading

## Implementation Details
### Chat Message (9)
- Kind 9 event with message content
- No required tags for basic messages
- Simple text-based communication

### Reply Mechanism
- Additional kind 9 event for replies
- `q` tag references parent message
- Content includes nevent reference to quoted message
- Direct threading without nested hierarchies

### Quote Format
- Quoted message referenced via nostr:nevent1...
- Reply content follows the quoted reference
- Clear parent-child relationship

## Use Cases
- **Instant Messaging**: Real-time chat communication
- **Group Chats**: Multi-participant conversations
- **Quick Responses**: Simple reply mechanisms
- **Threaded Discussions**: Basic conversation threading
- **Public Chats**: Open chat rooms and channels

## Related NIPs
- NIP-19: nevent format for message references
- Basic messaging and communication protocols 