# NIP-03: OpenTimestamps Attestations

## Meta
- **Status**: draft optional
- **Category**: Attestation/Proof
- **Required**: optional  
- **Purpose**: Provides timestamping proof for Nostr events using OpenTimestamps

## Summary
Defines kind:1040 events that contain OpenTimestamps proofs for other events, enabling cryptographic timestamping.

## Core Concepts
- **Kind 1040**: OpenTimestamps attestation event
- **OTS File**: Base64-encoded OpenTimestamps proof data
- **Bitcoin Attestation**: Proof anchored to Bitcoin blockchain
- **Event Reference**: Must reference the proven event via e-tag

## Structure
- **Content**: Base64-encoded .ots file data with Bitcoin attestation
- **Tags**:
  - e-tag: References the event being timestamped
  - alt-tag: "opentimestamps attestation" description

## Requirements
- OTS proof must prove the referenced event ID as digest
- Content must be complete .ots file with ≥1 Bitcoin attestation
- Should contain single Bitcoin attestation (efficiency)
- No "pending" attestations (useless in this context)

## Verification Process
1. Fetch kind:1040 event
2. Decode base64 content to get .ots file
3. Verify OTS proof against referenced event ID
4. Confirm Bitcoin blockchain attestation

## Use Cases
- **Event Timestamping**: Prove when an event existed
- **Historical Verification**: Cryptographic proof of event age
- **Legal Evidence**: Blockchain-anchored timestamps for court use
- **Content Dating**: Verify publication dates

## Related NIPs
- NIP-01 (basic event structure and e-tags) 