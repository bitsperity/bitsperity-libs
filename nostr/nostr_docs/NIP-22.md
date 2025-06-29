# NIP-22: Comments

## Meta
- **Status**: draft optional
- **Category**: Social/Threading
- **Required**: optional
- **Purpose**: Defines kind:1111 comment system for threading on any event type

## Summary
Universal comment system using kind:1111 events that can thread under any event kind or external identifier.

## Core Concepts
- **Kind 1111**: Comment event (plain text content)
- **Universal scope**: Comment on any event type or external content
- **Hierarchical tagging**: Uppercase for root, lowercase for parent
- **I-tag support**: Comment on external identifiers (hashtags, URLs, etc.)

## Tag Structure
**Root scope tags (uppercase):**
- **E**: Root event ID `["E", "<event-id>", "<relay>", "<pubkey>"]`
- **A**: Root addressable event `["A", "<kind>:<pubkey>:<d-tag>", "<relay>"]` 
- **I**: Root external identifier `["I", "<identifier>", "<context>"]`
- **K**: Root event kind `["K", "<kind-number>"]`
- **P**: Root author pubkey `["P", "<pubkey>", "<relay>"]`

**Parent item tags (lowercase):**
- **e**: Parent event ID `["e", "<event-id>", "<relay>", "<pubkey>"]`
- **a**: Parent addressable event `["a", "<kind>:<pubkey>:<d-tag>", "<relay>"]`
- **i**: Parent external identifier `["i", "<identifier>", "<context>"]`
- **k**: Parent event kind `["k", "<kind-number>"]`
- **p**: Parent author pubkey `["p", "<pubkey>", "<relay>"]`

## External Identifier Support
Uses NIP-73 I-tag values for external content:
- **URLs**: `["I", "https://example.com/article"]`
- **Hashtags**: `["I", "hashtag:bitcoin"]`
- **Geohashes**: `["I", "geohash:9q8yyk8yuktb"]`
- **Other**: Various external identifier types

## Threading Rules
- **Root comments**: Reference original content with uppercase tags
- **Reply comments**: Reference both root (uppercase) and parent (lowercase)
- **Required K/k tags**: Must specify event kinds for context
- **Author tagging**: Include P/p tags when commenting on Nostr events

## Comment Examples
**Blog post comment:**
```json
{
  "kind": 1111,
  "content": "Great article!",
  "tags": [
    ["A", "30023:author-pubkey:article-id", "wss://relay.com"],
    ["K", "30023"],
    ["P", "author-pubkey", "wss://relay.com"],
    ["a", "30023:author-pubkey:article-id", "wss://relay.com"], 
    ["k", "30023"],
    ["p", "author-pubkey", "wss://relay.com"]
  ]
}
```

**Website comment:**
```json
{
  "kind": 1111,
  "content": "Interesting perspective!",
  "tags": [
    ["I", "https://example.com/article"],
    ["K", "https://example.com"],
    ["i", "https://example.com/article"],
    ["k", "https://example.com"]
  ]
}
```

## Content Features
- **Plain text only**: No HTML or Markdown formatting
- **Q-tags**: Can cite events with `["q", "<event-id>", "<relay>", "<pubkey>"]`
- **P-tags**: Mention pubkeys with NIP-21 nostr: URIs
- **NIP-21 integration**: Use nostr: URIs in content for rich references

## Restrictions
- **No kind:1 replies**: Must use NIP-10 for kind:1 threading
- **Author validation**: Only comment as authenticated user
- **Scoping**: Comments are scoped to their root reference

## Use Cases
- **Blog comments**: Comment on long-form articles
- **Media comments**: Comment on images, videos, files
- **Website comments**: Comment on external web content
- **Event discussions**: Discuss any type of Nostr event
- **Hierarchical threads**: Multi-level comment discussions

## Related NIPs
- NIP-01 (basic event structure)
- NIP-10 (kind:1 threading - separate system)
- NIP-21 (nostr: URI references)
- NIP-73 (external identifier types) 