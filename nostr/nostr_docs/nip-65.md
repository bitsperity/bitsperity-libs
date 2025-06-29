# NIP-65: Relay List Metadata

## Meta
- **Status**: Draft, Optional
- **Category**: Relay Management
- **Required**: No
- **Purpose**: Advertise user's preferred read/write relays

## Summary
Defines replaceable event kind 10002 to advertise relays where users generally write events and read mentions. Enables efficient relay selection for downloading and publishing events.

## Core Concepts
- **Read/Write Separation**: Different relays for reading vs writing
- **Relay Optimization**: Clients use appropriate relays per use case
- **Small Lists**: Recommended 2-4 relays per category
- **Discoverability**: Events spread to maximize visibility
- **Marker System**: Optional read/write markers

## Implementation Details
### Event Structure (10002)
- Replaceable event with `r` tags containing relay URLs
- Optional `read` or `write` markers
- Default behavior: relay is both read and write
- Empty content field

### Client Behavior Rules
- **Author's Events**: Use author's write relays
- **Mentions**: Use mentioned user's read relays  
- **Publishing**: Send to author's write relays + all tagged users' read relays
- **Propagation**: Send kind 10002 to all target relays

### Relay Categories
- **Write Relays**: Where user publishes content
- **Read Relays**: Where user checks for mentions
- **Dual Purpose**: Unmarked relays serve both functions

## Use Cases
- **Efficient Discovery**: Find user's content on right relays
- **Mention Delivery**: Ensure notifications reach users
- **Bandwidth Optimization**: Avoid unnecessary relay connections
- **User Control**: Let users choose their relay preferences
- **Network Efficiency**: Reduce redundant relay queries

## Related NIPs
- NIP-01: Event structure and relay interaction
- NIP-42: Relay authentication for access control 