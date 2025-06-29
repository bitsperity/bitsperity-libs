# NIP-11: Relay Information Document

## Meta
- **Status**: draft optional
- **Category**: Relay Management
- **Required**: optional
- **Purpose**: Defines HTTP endpoint for relay metadata and capabilities

## Summary
Standardizes relay metadata exposure via HTTP JSON endpoint for client discovery and configuration.

## Core Concepts
- **HTTP Endpoint**: Same URI as WebSocket with `Accept: application/nostr+json`
- **JSON Response**: Structured relay information
- **Client Discovery**: Helps clients understand relay capabilities
- **CORS Required**: Must support cross-origin requests

## Basic Metadata Fields
- **name**: Relay display name (<30 chars recommended)
- **description**: Detailed relay information (plain text)
- **pubkey**: Admin contact pubkey for encrypted DMs
- **contact**: Alternative contact (URI format)
- **supported_nips**: Array of implemented NIP numbers
- **software**: URL to relay software homepage
- **version**: Software version string

## Visual Branding
- **banner**: Wide image URL (~1024x768) for relay branding
- **icon**: Square logo URL for compact display
- **description**: Plain text with double newlines for paragraphs

## Server Limitations
Key limits for client behavior:
- **max_message_length**: WebSocket message size limit
- **max_subscriptions**: Concurrent subscriptions per connection
- **max_limit**: Maximum filter limit value
- **max_event_tags**: Maximum tags per event
- **max_content_length**: Maximum content field length
- **min_pow_difficulty**: Required proof-of-work difficulty
- **auth_required**: NIP-42 authentication required
- **payment_required**: Payment needed for access
- **restricted_writes**: Special conditions for writing

## Content Retention
- **retention**: Array of retention policies by kind/time/count
- **kinds**: Kind numbers or ranges `[start, end]`
- **time**: Retention time in seconds (null = infinity)
- **count**: Maximum event count to retain
- **Zero time**: Blacklist kinds (no storage)

## Geographic/Legal
- **relay_countries**: ISO country codes affecting relay (legal jurisdiction)
- **language_tags**: IETF language tags for primary languages
- **posting_policy**: URL to human-readable posting rules

## Community Features
- **tags**: Content limitations (e.g. "sfw-only", "bitcoin-only")
- **posting_policy**: Link to detailed community guidelines

## Payment Integration
- **payments_url**: Payment endpoint URL
- **fees**: Fee structure for admission, subscription, publication

## Implementation Notes
- **Optional fields**: All fields are optional, unknown fields ignored
- **CORS headers**: Must include proper CORS headers
- **Static/dynamic**: Supports both static files and dynamic generation
- **Client filtering**: Helps clients choose appropriate relays

## Related NIPs
- NIP-01 (basic protocol)
- NIP-42 (authentication)
- NIP-13 (proof of work) 