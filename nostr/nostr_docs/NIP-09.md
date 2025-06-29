# NIP-09: Event Deletion Request

## Meta
- **Status**: draft optional
- **Category**: Moderation
- **Required**: optional
- **Purpose**: Defines kind:5 events for requesting deletion of previously published events

## Summary
Enables authors to request deletion of their own events using kind:5 deletion request events with e-tags or a-tags.

## Core Concepts
- **Kind 5**: Deletion request event
- **Author-only**: Can only delete own events (matching pubkey)
- **Request-based**: Relays/clients decide whether to honor deletion
- **Permanent broadcast**: Deletion requests should be kept indefinitely

## Structure
- **Content**: Optional reason for deletion (plaintext)
- **Tags**:
  - e-tag: Event ID to delete `["e", "<event-id>"]`
  - a-tag: Addressable event to delete `["a", "<kind>:<pubkey>:<d-tag>"]`
  - k-tag: Kind of deleted event `["k", "<kind-number>"]` (recommended)

## Deletion Behavior
- **Relays**: Should stop publishing/serving referenced events with matching pubkey
- **Clients**: Should hide or mark deleted events appropriately  
- **Addressable events**: Delete all versions up to deletion request timestamp
- **Broadcast**: Deletion requests should be shared to other relays

## Validation Requirements
- **Pubkey matching**: Deletion request pubkey must match deleted event pubkey
- **Client responsibility**: Clients must validate pubkey match (relays may not have all events)
- **No recursive deletion**: Cannot delete deletion requests themselves

## Implementation Notes
- **Indefinite storage**: Keep deletion requests permanently for late-arriving clients
- **UI options**: Clients may hide completely or show "deleted" indicator
- **Reason display**: May show deletion reason instead of original content
- **No guarantees**: Cannot delete from all relays/clients (inform users)

## Use Cases
- **Mistake correction**: Remove accidentally published content
- **Privacy protection**: Remove sensitive information
- **Content moderation**: Self-moderation by authors
- **Legal compliance**: Remove legally problematic content

## Limitations
- **Best effort**: No guarantee of complete deletion across network
- **Author-only**: Cannot delete others' events
- **Relay cooperation**: Depends on relay implementation
- **Client support**: Requires client implementation for effectiveness

## Related NIPs
- NIP-01 (basic event structure, addressable events)
- NIP-40 (expiration tags for automatic deletion) 