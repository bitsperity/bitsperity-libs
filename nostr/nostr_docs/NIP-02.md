# NIP-02: Follow List

## Meta  
- **Status**: final optional
- **Category**: Social
- **Required**: optional
- **Purpose**: Defines kind:3 events for storing user follow/contact lists

## Summary
Standard for storing and sharing lists of followed/known profiles using kind:3 events with p-tags.

## Core Concepts
- **Kind 3**: Follow list event with p-tags for each followed profile
- **P-tag format**: `["p", <pubkey>, <relay-url>, <petname>]`
- **Overwrite behavior**: New follow lists replace previous ones completely
- **Chronological order**: New follows should be appended to end

## Structure
- **Content**: Not used (empty string)
- **Tags**: Array of p-tags, one per followed profile
- **Parameters**:
  - pubkey: 32-byte hex key of followed profile
  - relay-url: Where to find their events (optional)
  - petname: Local nickname (optional)

## Use Cases
- **Backup/Recovery**: Store follow list on relays for device recovery
- **Profile Discovery**: Show who someone follows for recommendations
- **Relay Sharing**: Distribute good relay URLs for followed users
- **Petname System**: Create local nickname hierarchies (erin → david.erin → frank.david.erin)

## Implementation Notes
- Clients should delete old follow lists when receiving new ones
- Relays should only store latest follow list per pubkey
- New follows should be appended chronologically
- Relay URLs can be empty strings if not needed

## Related NIPs
- NIP-01 (basic event structure)
- NIP-65 (relay list events - supersedes relay info in NIP-02) 