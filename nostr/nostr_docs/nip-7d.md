# NIP-7D: Threads

## Meta
- **Status**: Draft, Optional
- **Category**: Social/Threading
- **Required**: No
- **Purpose**: Threaded discussion format

## Summary
Defines kind 11 events for thread posts with optional titles. Uses NIP-22 kind 1111 comments for replies, maintaining flat structure by requiring all replies to reference the root thread event.

## Core Concepts
- **Thread Posts**: Kind 11 events with optional titles
- **Flat Reply Structure**: All replies reference root thread only
- **No Nested Hierarchies**: Avoids complex nested reply chains
- **Title Support**: Optional thread titles for better organization
- **Comment Integration**: Uses NIP-22 comment system

## Implementation Details
### Thread Event (11)
- Content contains the thread post content
- Optional `title` tag for thread subject
- Acts as root for all replies in the thread

### Reply Structure (1111)
- Uses NIP-22 comment format (kind 1111)
- `K` tag references thread kind (11)
- `E` tag references root thread event
- All replies are direct children of root

### Flat Threading Benefits
- Simplified client implementation
- Avoids complex nested rendering
- Maintains conversation flow
- Reduces threading complexity

## Use Cases
- **Discussion Forums**: Structured topic discussions
- **Q&A Threads**: Question with multiple answers
- **Topic Conversations**: Focused topic discussions
- **Community Discussions**: Group conversations with clear subjects
- **Support Threads**: Help requests with multiple responses

## Related NIPs
- NIP-22: Comments (1111) for reply mechanism
- Basic threading and conversation structure 