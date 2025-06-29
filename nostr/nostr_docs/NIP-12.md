# NIP-12: Generic Tag Queries

## Meta
- **Status**: final mandatory
- **Category**: Core Protocol
- **Required**: mandatory
- **Purpose**: MOVED to NIP-01 - Generic tag filtering in subscriptions

## Summary
**MOVED TO NIP-01** - This NIP originally defined generic tag queries but content has been moved to NIP-01.

## Original Purpose
Defined how clients can filter events by arbitrary tag values using the `#<tag-name>` filter syntax.

## Current Status
- **Content moved**: All functionality now described in NIP-01
- **Filter syntax**: `{"#e": ["event-id1", "event-id2"]}` for e-tag filtering
- **Implementation**: Part of basic relay subscription filtering

## Filter Examples
```json
{
  "#e": ["event-id-1", "event-id-2"],
  "#p": ["pubkey-1", "pubkey-2"], 
  "#t": ["bitcoin", "nostr"]
}
```

## Tag Indexing
- **Single-letter tags**: Automatically indexed by relays (a-z, A-Z)
- **First value only**: Only first element of tag array is indexed
- **Case sensitive**: Tag names are case-sensitive
- **Performance**: Enables efficient querying of tagged events

## Related NIPs
- NIP-01 (contains the actual implementation details)
- All NIPs that define specific tag usage 