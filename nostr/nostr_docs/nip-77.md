# NIP-77: Negentropy Syncing

## Meta
- **Status**: Draft, Optional
- **Category**: Protocol/Synchronization
- **Required**: No
- **Purpose**: Efficient event synchronization protocol

## Summary
Defines a protocol extension for syncing events using Negentropy Range-Based Set Reconciliation. Significantly reduces bandwidth when both sides have events in common compared to transferring full event sets or IDs.

## Core Concepts
- **Range-Based Set Reconciliation**: Mathematical technique for efficient sync
- **Binary Protocol**: Hex-encoded Negentropy messages over Nostr
- **Client-Relay Sync**: Works for both client-relay and relay-relay scenarios
- **Bandwidth Optimization**: Uses less bandwidth when sets overlap
- **Stateful Queries**: Maintains sync state during process

## Implementation Details
### Message Types
- `NEG-OPEN`: Initial sync request with filter and first message
- `NEG-MSG`: Bidirectional sync messages containing ID ranges
- `NEG-ERR`: Error responses with reason codes
- `NEG-CLOSE`: Client terminates sync session

### Protocol Flow
1. Client chooses filter and creates initial Negentropy message
2. Client sends NEG-OPEN with filter and initial message
3. Relay responds with NEG-MSG containing reconciliation data
4. Alternating NEG-MSG exchange until sync complete
5. Client can upload/download events based on learned IDs

### Negentropy Protocol V1
- Records sorted by timestamp, then lexically by ID
- Varint encoding for efficient space usage
- Range-based fingerprinting with SHA-256
- Binary format with version negotiation

## Use Cases
- **Efficient Sync**: Minimize bandwidth for partial synchronization
- **Relay Mirroring**: Efficient relay-to-relay data replication
- **Offline Clients**: Catch up efficiently after disconnection
- **Large Datasets**: Sync large event sets without full transfer
- **Network Optimization**: Reduce data usage on limited connections

## Related NIPs
- NIP-01: Basic filter and event structure
- Range-Based Set Reconciliation mathematics 