# NIP-38: User Statuses

## Meta
- **Status**: draft optional
- **Category**: Social/Status
- **Required**: optional
- **Purpose**: Defines user status messages using kind:30315 addressable events

## Summary
Enables users to set current status messages (like "away", "busy", "online") using addressable status events.

## Core Concepts
- **Kind 30315**: User status events (addressable/replaceable)
- **Status types**: General, music, or custom status categories
- **Temporary status**: Status can have expiration times
- **Multiple statuses**: Users can have different status types simultaneously

## Status Event Structure
```json
{
  "kind": 30315,
  "content": "Working on Nostr stuff! 🚀",
  "tags": [
    ["d", "general"],
    ["r", "https://example.com/my-project"]
  ]
}
```

## Status Types (d-tag values)
- **general**: Default/main status message
- **music**: Currently playing music
- **custom**: User-defined status categories
- **Any string**: Custom status type identifiers

## Standard Status Content
**Status message format**:
- **Emoji support**: Unicode emoji in status text
- **Brief messages**: Keep status concise
- **Current activity**: What user is currently doing
- **Mood/availability**: Current availability or mood

## Optional Tags
- **r**: URL reference related to status `["r", "https://..."]`
- **expiration**: Unix timestamp when status expires `["expiration", "1234567890"]`
- **emoji**: Custom emoji for status `["emoji", "working", "https://example.com/emoji.png"]`

## Music Status Example
```json
{
  "kind": 30315,
  "content": "🎵 Listening to 'Imagine' by John Lennon",
  "tags": [
    ["d", "music"],
    ["r", "https://open.spotify.com/track/..."],
    ["expiration", "1677426236"]
  ]
}
```

## Status Expiration
- **Automatic cleanup**: Status expires at specified timestamp
- **Client handling**: Clients should respect expiration times
- **Default behavior**: Status persists until replaced or expired
- **Manual clearing**: Users can delete status by setting empty content

## Client Implementation
- **Status display**: Show user status in profile or chat
- **Status setting UI**: Interface for users to set status
- **Expiration handling**: Automatically clear expired statuses
- **Multiple status types**: Support different status categories

## Status Discovery
- **Profile queries**: Query user's status events by pubkey
- **Recent activity**: Show recently updated statuses
- **Status feed**: Timeline of friend status updates
- **Search**: Find users by status content

## Use Cases
- **Availability indication**: Show if user is available/busy
- **Activity sharing**: Share current activity or mood
- **Music sharing**: Share currently playing music
- **Work status**: Indicate work/focus state
- **Location status**: Share general location or activity

## Privacy Considerations
- **Public status**: All statuses are publicly visible
- **Information disclosure**: Be cautious about sharing sensitive information
- **Tracking concerns**: Frequent status updates may enable tracking
- **Status history**: Old statuses remain in event history

## Replacement Behavior
- **Same d-tag**: New status replaces old one with same d-tag
- **Different d-tags**: Multiple status types can coexist
- **Empty content**: Empty status content effectively clears status
- **Deletion**: Use NIP-09 deletion events to remove status

## Integration Examples
- **Chat clients**: Show user status in contact lists
- **Social feeds**: Display status updates in timeline
- **Profile pages**: Show current status on user profiles
- **Music apps**: Integration with music streaming services

## Related NIPs
- NIP-01 (addressable events)
- NIP-30 (custom emoji in status messages)
- NIP-09 (status deletion)
- NIP-24 (extra metadata fields for profiles) 