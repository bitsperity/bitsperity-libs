# NIP-88: Polls

## Meta
- **Status**: Draft, Optional
- **Category**: Social/Voting
- **Required**: No
- **Purpose**: Create and participate in polls/surveys

## Summary
Defines poll events (kind 1068) and response events (kind 1018) for creating surveys and collecting votes. Supports single-choice and multiple-choice polls with structured metadata and vote aggregation.

## Core Concepts
- **Poll Creation**: Structured events with options and metadata
- **Vote Responses**: Separate events referencing poll choices
- **Poll Types**: Single-choice vs multiple-choice voting
- **Relay Targeting**: Specific relays for vote collection
- **Result Aggregation**: One vote per pubkey counting

## Implementation Details
### Poll Event (1068)
- Content contains poll question/label
- Option tags with IDs and labels
- Required relay tags for vote destination
- Optional polltype (singlechoice/multiplechoice)
- Optional endsAt timestamp for expiration

### Response Event (1018)
- References poll with `e` tag
- Response tags contain selected option IDs
- Published to relays specified in poll
- Latest response per pubkey counts

### Vote Counting Rules
- One vote per pubkey maximum
- Latest timestamp within poll limits wins
- Different rules for single vs multiple choice
- Query specified relays for responses

## Use Cases
- **Community Decisions**: Democratic decision making
- **Market Research**: Opinion gathering and surveys
- **Content Voting**: Rate and rank user-generated content
- **Event Planning**: Collect preferences for activities
- **Governance**: Decentralized voting on proposals

## Related NIPs
- NIP-40: Event expiration timestamps
- Follow sets (kind 30000) for result curation 