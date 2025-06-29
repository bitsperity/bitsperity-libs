# NIP-66: Relay Discovery and Liveness Monitoring

## Meta
- **Status**: Draft, Optional
- **Category**: Relay Management/Monitoring
- **Required**: No
- **Purpose**: Automated relay discovery and health monitoring

## Summary
Defines two event types for relay monitoring: Relay Discovery (30166) and Relay Monitor Announcement (10166). Enables systematic relay discovery based on real-time health data and monitoring criteria.

## Core Concepts
- **Automated Discovery**: Find relays based on current status
- **Liveness Monitoring**: Real-time relay health tracking
- **Monitor Services**: Organized relay checking infrastructure
- **Filtering Capabilities**: Search relays by features/requirements
- **Trust System**: Monitor reputation and reliability

## Implementation Details
### Relay Discovery (30166)
- Addressable event with relay URL as `d` tag
- Contains NIP-11 relay info in content
- Created_at reflects when relay was checked
- Extensive tagging for filtering capabilities

### Monitor Announcement (10166)
- Replaceable event declaring monitoring intent
- Specifies check frequency and timeout values
- Lists types of checks performed
- Optional for ad-hoc monitors

### Tagging System
- **Network**: clearnet, Tor, etc.
- **Requirements**: payment, auth, etc.
- **Features**: supported NIPs, kinds
- **Geography**: geohash location tags
- **Performance**: RTT measurements

## Use Cases
- **Relay Selection**: Find relays meeting specific criteria
- **Load Balancing**: Distribute connections across healthy relays
- **Feature Discovery**: Find relays supporting specific NIPs
- **Geographic Optimization**: Select nearby relays
- **Reliability Tracking**: Monitor relay uptime and performance

## Related NIPs
- NIP-11: Relay information documents
- NIP-33: Addressable/replaceable events
- NIP-65: User's preferred relay lists 