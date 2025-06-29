# NIP-52: Calendar Events

## Meta
- **Status**: draft optional
- **Category**: Events/Calendar
- **Required**: optional
- **Purpose**: Defines calendar events, RSVPs, and event management using Nostr

## Summary
Enables creation and management of calendar events with RSVP functionality, using multiple event types for comprehensive event coordination.

## Core Event Types

### Calendar Event (Kind 31922)
**Purpose**: Create calendar events
```json
{
  "kind": 31922,
  "content": "Join us for the monthly Bitcoin meetup!",
  "tags": [
    ["d", "bitcoin-meetup-2024-03"],
    ["title", "Bitcoin Meetup"],
    ["start", "1709668800"],
    ["end", "1709679600"],
    ["location", "Tech Hub, 123 Main St"],
    ["g", "geohash"],
    ["p", "organizer-pubkey", "wss://relay.com", "organizer"]
  ]
}
```

### Calendar Event RSVP (Kind 31925)
**Purpose**: RSVP to calendar events
```json
{
  "kind": 31925,
  "content": "Looking forward to the meetup!",
  "tags": [
    ["d", "bitcoin-meetup-2024-03"],
    ["a", "31922:organizer-pubkey:bitcoin-meetup-2024-03"],
    ["status", "accepted"]
  ]
}
```

### Calendar (Kind 31923)
**Purpose**: Organize events into calendars
```json
{
  "kind": 31923,
  "content": "Bitcoin community events",
  "tags": [
    ["d", "bitcoin-calendar"],
    ["title", "Bitcoin Events"],
    ["color", "#f7931a"]
  ]
}
```

## Event Tags

### Required Tags
- **d**: Event identifier (for addressable events)
- **title**: Event title/name
- **start**: Start time (Unix timestamp)

### Optional Tags
- **end**: End time (Unix timestamp)
- **start_tzid**: Start timezone identifier
- **end_tzid**: End timezone identifier
- **summary**: Brief event summary
- **location**: Event location (human-readable)
- **g**: Geohash for location
- **p**: Participant/organizer pubkeys
- **t**: Topic/category tags
- **r**: Reference URLs
- **image**: Event image URL

## Time Handling
**Timestamp format**:
- Unix timestamps (seconds since epoch)
- UTC by default
- Timezone support via tzid tags

**All-day events**:
- Start time at 00:00:00 in local timezone
- No end time, or end time 24 hours later

**Recurring events**:
- Create separate events for each occurrence
- Reference original event via tags

## RSVP Status Values
- **accepted**: Will attend
- **declined**: Will not attend
- **tentative**: Might attend
- **interested**: Interested but not committed

## Event Discovery
**Query events**:
- By date range: `{"kinds": [31922], "since": start_time, "until": end_time}`
- By location: Search by location tags or geohash
- By organizer: `{"kinds": [31922], "authors": ["organizer-pubkey"]}`
- By topic: Filter by t-tags

## Calendar Management
**Calendar collections**:
- Use kind:31923 for calendar metadata
- Reference events via a-tags or queries
- Support multiple calendars per user

## Event Interactions

### Comments (Kind 1111)
**Event comments**:
```json
{
  "kind": 1111,
  "content": "Great event idea!",
  "tags": [
    ["a", "31922:organizer:event-id"],
    ["k", "31922"]
  ]
}
```

### Reactions (Kind 7)
**Event reactions**:
- React to events using standard reactions
- Reference event via a-tag

## Client Implementation

### Event Creation
- **Form interface**: User-friendly event creation forms
- **Time zone handling**: Proper timezone selection and display
- **Location picker**: Map integration for location selection
- **Recurring events**: Interface for creating recurring events

### Event Display
- **Calendar view**: Month/week/day calendar displays
- **Event details**: Comprehensive event information display
- **RSVP interface**: Easy RSVP with status selection
- **Attendee list**: Show confirmed attendees

### Notifications
- **Event reminders**: Remind users of upcoming events
- **RSVP notifications**: Notify organizers of RSVPs
- **Event updates**: Notify attendees of event changes

## Use Cases
- **Community meetups**: Local Bitcoin/Nostr meetups
- **Conferences**: Large-scale conferences and workshops
- **Personal events**: Birthday parties, family gatherings
- **Recurring events**: Weekly meetings, monthly events
- **Virtual events**: Online conferences and webinars

## Integration Features
- **External calendars**: Import/export to other calendar systems
- **Map integration**: Show event locations on maps
- **Payment integration**: Integration with Lightning payments for tickets
- **Live streaming**: Links to live streams for virtual events

## Privacy Considerations
- **Public events**: Open for anyone to discover and attend
- **Private events**: Invite-only events with limited visibility
- **Location privacy**: Balance location sharing with privacy
- **RSVP privacy**: Consider whether RSVPs are public or private

## Advanced Features

### Event Updates
- **Amendment events**: Update existing events with corrections
- **Cancellation events**: Cancel events with notification
- **Version tracking**: Track event changes over time

### Event Series
- **Recurring patterns**: Define recurring event patterns
- **Exception handling**: Handle exceptions to recurring patterns
- **Series management**: Manage entire event series

## Related NIPs
- NIP-01 (addressable events)
- NIP-22 (comments on events)
- NIP-25 (reactions to events)
- NIP-57 (Lightning payments for event tickets) 