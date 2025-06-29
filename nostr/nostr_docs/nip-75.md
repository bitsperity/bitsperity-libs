# NIP-75: Zap Goals

## Meta
- **Status**: Draft, Optional
- **Category**: Payments/Fundraising
- **Required**: No
- **Purpose**: Create Lightning-based fundraising goals

## Summary
Defines kind 9041 events for creating fundraising goals that users can contribute to via Lightning zaps. Tracks progress toward target amounts with transparent relay-based tallying.

## Core Concepts
- **Fundraising Goals**: Set target amounts for specific purposes
- **Zap Contributions**: Users contribute via Lightning zaps
- **Transparent Tracking**: Public progress tracking on specified relays
- **Multiple Beneficiaries**: Support for split payments
- **Event Integration**: Link goals to other events (posts, badges, streams)

## Implementation Details
### Goal Event (9041)
- Required `amount` tag with target in millisats
- Required `relays` list for zap receipt tallying
- Content contains human-readable goal description
- Optional closure timestamp and imagery

### Contribution Process
- Users zap the goal event to contribute
- Clients must include goal's relays in zap request
- Zap receipts published to specified relays count toward goal
- Progress calculated from valid zap receipts

### Goal Linking
- Events can reference goals with `goal` tag
- When zapping linked events, reference goal in zap request
- Enables funding for specific content or achievements

## Use Cases
- **Travel Expenses**: Conference and meetup funding
- **Content Creation**: Fund specific projects or content
- **Community Goals**: Collective fundraising for shared objectives
- **Event Funding**: Support for live streams, conferences
- **Charity**: Transparent donation campaigns

## Related NIPs
- NIP-57: Lightning zaps for contribution mechanism
- NIP-65: Relay lists for zap receipt collection
- Event linking for integrated fundraising 