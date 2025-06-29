# NIP-40: Expiration Timestamp

## Meta
- **Status**: draft optional
- **Category**: Event Lifecycle/Metadata
- **Required**: optional
- **Purpose**: Defines expiration tag for events that should be considered invalid after a specified time

## Summary
Enables events to include expiration timestamps, after which they should be considered invalid or no longer relevant.

## Core Concepts
- **Expiration tag**: `["expiration", "<unix-timestamp>"]`
- **Automatic invalidation**: Events become invalid after expiration time
- **Client behavior**: Clients should respect expiration times
- **Relay behavior**: Relays may optionally delete expired events

## Tag Format
```json
["expiration", "1677426236"]
```
- **Unix timestamp**: Expiration time as Unix timestamp (seconds since epoch)
- **Single tag**: Events should have at most one expiration tag
- **Future time**: Expiration should be set to future time

## Event Examples

### Temporary Status
```json
{
  "kind": 30315,
  "content": "In a meeting for the next hour",
  "tags": [
    ["d", "general"],
    ["expiration", "1677426236"]
  ]
}
```

### Event Announcement
```json
{
  "kind": 1,
  "content": "Join our meetup tonight at 7 PM!",
  "tags": [
    ["expiration", "1677462000"]
  ]
}
```

## Client Behavior
- **Expiration checking**: Check expiration before displaying events
- **Automatic hiding**: Hide expired events from normal feeds
- **Expired event UI**: May show expired events with special styling
- **Cleanup**: Periodically clean up expired events from local storage

## Use Cases
- **Temporary statuses**: User status messages with expiration
- **Event announcements**: Time-sensitive announcements
- **Promotional content**: Limited-time offers or promotions
- **Ephemeral messages**: Messages that should disappear after time
- **Beta/test events**: Events for testing with automatic cleanup

## Relay Behavior
**Optional expiration handling**:
- **Automatic deletion**: May delete expired events to save space
- **Query filtering**: May filter expired events from query results
- **Storage optimization**: Use expiration for storage management
- **Configurable**: Relay operators can choose expiration handling

## Time Considerations
- **Timezone independence**: Unix timestamps are timezone-independent
- **Clock synchronization**: Relies on reasonable clock synchronization
- **Grace periods**: Clients may implement grace periods for clock skew
- **Precision**: Second-level precision (not milliseconds)

## Privacy and Cleanup
- **Data retention**: Helps limit data retention periods
- **Privacy protection**: Automatically remove old sensitive content
- **Storage management**: Prevents indefinite data accumulation
- **Compliance**: May help with data retention regulations

## Implementation Notes
- **Backward compatibility**: Non-supporting clients ignore expiration
- **Soft expiration**: Expiration is advisory, not enforced
- **User override**: Users may choose to view expired content
- **Event types**: Can be applied to any event kind

## Validation
- **Future time**: Expiration should be in the future when event is created
- **Reasonable limits**: Very far future expirations may be ignored
- **Format validation**: Timestamp should be valid Unix timestamp
- **Single tag**: Multiple expiration tags should be treated as error

## Security Considerations
- **Clock attacks**: Malicious clock manipulation could affect expiration
- **Premature expiration**: Incorrect timestamps could cause premature expiration
- **Relay trust**: Users must trust relays to handle expiration correctly
- **Data availability**: Important data should not rely solely on expiration

## Related NIPs
- NIP-01 (basic event structure)
- NIP-38 (user statuses - common use case for expiration)
- NIP-09 (event deletion - complementary approach)
- NIP-22 (comments that may benefit from expiration) 