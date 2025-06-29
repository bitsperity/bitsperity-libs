# NIP-69: Peer-to-peer Order events

## Meta
- **Status**: Draft, Optional
- **Category**: Commerce/Trading
- **Required**: No
- **Purpose**: Standardized P2P trading order format

## Summary
Defines addressable events (kind 38383) for peer-to-peer trading orders. Creates unified liquidity pool across P2P platforms by standardizing order format for Bitcoin/fiat trading.

## Core Concepts
- **Unified Liquidity**: Combine orders from multiple P2P platforms
- **Standard Format**: Common order structure across platforms
- **Addressable Events**: Updatable order status
- **Multi-Platform**: Support for various P2P trading platforms
- **Geographic Trading**: Location-based trading support

## Implementation Details
### Order Event (38383)
- Unique identifier in `d` tag
- Order type: `sell` or `buy`
- Fiat currency (ISO 4217 standard)
- Amount in satoshis or range
- Payment methods supported

### Order Status Tracking
- `pending`: Available for matching
- `canceled`: No longer available
- `in-progress`: Currently being executed
- `success`: Successfully completed

### Required Tags
- `k`: Order type (buy/sell)
- `f`: Fiat currency code
- `s`: Current status
- `amt`: Bitcoin amount in satoshis
- `fa`: Fiat amount or range
- `pm`: Payment methods
- `y`: Platform identifier

## Use Cases
- **Bitcoin Trading**: Buy/sell Bitcoin for fiat
- **Cross-Platform**: Unified order books
- **Local Trading**: Geographic proximity matching
- **Payment Flexibility**: Multiple payment method support
- **Platform Integration**: Existing P2P platform integration

## Related NIPs
- NIP-01: Addressable events foundation
- NIP-40: Order expiration timestamps
- Implementation platforms: Mostro, lnp2pBot, RoboSats 