# NIP-48: Proxy Tags

## Meta
- **Status**: draft optional
- **Category**: Proxy/Relay
- **Required**: optional
- **Purpose**: Defines proxy tags for indicating events were relayed through proxy services

## Summary
Enables events to include proxy tags that identify proxy services used for event transmission, providing transparency and routing information.

## Core Concepts
- **Proxy tag**: `["proxy", "<proxy-id>", "<proxy-protocol>"]`
- **Relay transparency**: Shows which proxies handled the event
- **Protocol identification**: Indicates the proxy protocol used
- **Chain tracking**: Multiple proxy tags for multi-hop routing

## Proxy Tag Format
```json
["proxy", "<proxy-identifier>", "<protocol>"]
```
- **proxy-identifier**: Unique identifier for the proxy service
- **protocol**: Protocol used by the proxy (e.g., "activitypub", "atproto")
- **Multiple tags**: Events can have multiple proxy tags for routing chains

## Common Proxy Protocols
- **activitypub**: ActivityPub protocol proxy
- **atproto**: AT Protocol (Bluesky) proxy
- **rss**: RSS feed proxy
- **email**: Email gateway proxy
- **telegram**: Telegram bot proxy
- **discord**: Discord bot proxy
- **matrix**: Matrix protocol proxy
- **xmpp**: XMPP protocol proxy

## Example Event with Proxy Tags
```json
{
  "kind": 1,
  "content": "This message was bridged from ActivityPub",
  "tags": [
    ["proxy", "activitypub-bridge.example.com", "activitypub"],
    ["proxy", "nostr-relay.example.com", "nostr"]
  ]
}
```

## Multi-Hop Routing
**Routing chain example**:
```json
{
  "tags": [
    ["proxy", "telegram-bot-123", "telegram"],
    ["proxy", "bridge.example.com", "activitypub"],
    ["proxy", "relay.nostr.com", "nostr"]
  ]
}
```
- Events can traverse multiple proxy services
- Tags ordered by routing sequence
- Each proxy adds its own tag

## Use Cases
- **Protocol bridging**: Bridge between different social protocols
- **Cross-platform posting**: Post to multiple platforms simultaneously
- **Content syndication**: Syndicate content across networks
- **Bot integration**: Integrate with messaging bots and services
- **Legacy system integration**: Bridge legacy systems to Nostr

## Proxy Service Implementation
**Adding proxy tags**:
- **Unique identification**: Use unique, stable proxy identifiers
- **Protocol accuracy**: Correctly identify the proxy protocol
- **Chain preservation**: Preserve existing proxy tags when forwarding
- **Metadata addition**: Add proxy tag when processing events

## Client Behavior
- **Proxy display**: Show proxy information in event metadata
- **Filtering**: Allow filtering by proxy services
- **Trust indicators**: Show trust/verification status of proxies
- **Source attribution**: Clearly attribute original source

## Privacy Considerations
- **Proxy exposure**: Proxy tags reveal routing information
- **Tracking prevention**: Avoid enabling cross-platform tracking
- **User consent**: Respect user privacy preferences
- **Selective disclosure**: Allow users to control proxy tag visibility

## Security Considerations
- **Proxy verification**: Verify proxy service authenticity
- **Content integrity**: Ensure content wasn't modified by proxies
- **Malicious proxies**: Be aware of potentially malicious proxy services
- **Identity spoofing**: Prevent proxy identity spoofing

## Relay Handling
- **Pass-through**: Relays should preserve proxy tags
- **Validation**: May validate proxy tag format
- **Filtering**: May filter events based on proxy sources
- **Metadata**: Store proxy information for analytics

## Standardization
**Proxy identifier format**:
- **Domain-based**: Use domain names when possible
- **Service-specific**: Include service identifiers
- **Stable identifiers**: Use consistent, long-term identifiers
- **Human-readable**: Make identifiers understandable

## Analytics and Metrics
- **Route analysis**: Analyze popular routing paths
- **Proxy performance**: Monitor proxy service performance
- **Cross-platform engagement**: Track cross-platform interactions
- **Network topology**: Understand network connection patterns

## Related NIPs
- NIP-01 (basic event structure)
- NIP-65 (relay list metadata)
- Any NIPs related to cross-protocol bridging 