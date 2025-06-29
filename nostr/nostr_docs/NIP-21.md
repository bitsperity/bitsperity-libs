# NIP-21: Nostr URI Scheme

## Meta
- **Status**: draft optional
- **Category**: Linking/References
- **Required**: optional
- **Purpose**: Defines `nostr:` URI scheme for referencing Nostr entities

## Summary
Standardizes `nostr:` URI scheme for maximum interoperability when linking to Nostr profiles, events, and other entities.

## Core Concepts
- **URI scheme**: `nostr:` prefix for Nostr entity references
- **NIP-19 integration**: Uses NIP-19 bech32 identifiers after `nostr:`
- **Universal linking**: Cross-platform entity references
- **Web integration**: HTML link support for web pages

## Supported Identifiers
- **npub**: Public keys `nostr:npub1...`
- **nprofile**: Profiles with metadata `nostr:nprofile1...`
- **note**: Event IDs `nostr:note1...`
- **nevent**: Events with metadata `nostr:nevent1...`
- **naddr**: Addressable events `nostr:naddr1...`

**Excluded**: `nsec` (private keys should never be shared)

## URI Examples
- Profile: `nostr:npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9`
- Profile with relays: `nostr:nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p`
- Event: `nostr:note1fntxtkcy9pjwucqwa9mddn7v03wwwsu9j330jj350nvhpky2tuaspk6nqc`
- Event with metadata: `nostr:nevent1qqstna2yrezu5wghjvswqqculvvwxsrcvu7uc0f78gan4xqhvz49d9spr3mhxue69uhkummnw3ez6un9d3shjtn4de6x2argwghx6egpr4mhxue69uhkummnw3ez6ur4vgh8wetvd3hhyer9wghxuet5nxnepm`

## Web Integration
**Content association** - Link web pages to Nostr events:
```html
<link rel="alternate" href="nostr:naddr1qqyrzwrxvc6ngvfkqyghwumn8ghj7enfv96x5ctx9e3k7mgzyqalp33lewf5vdq847t6te0wvnags0gs0mu72kz8938tn24wlfze6qcyqqq823cph95ag" />
```

**Authorship attribution** - Assign authorship to Nostr profiles:
```html
<link rel="me" href="nostr:nprofile1qyxhwumn8ghj7mn0wvhxcmmvqyd8wumn8ghj7un9d3shjtnhv4ehgetjde38gcewvdhk6qpq80cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwswpnfsn" />
<link rel="author" href="nostr:nprofile1..." />
```

## Client Behavior
- **URI handling**: Register as handler for `nostr:` scheme
- **Entity resolution**: Parse and resolve referenced entities
- **Cross-platform**: Enable app-to-app navigation
- **Web fallback**: Graceful handling in web browsers

## Use Cases
- **Deep linking**: Link directly to profiles/events from anywhere
- **Content references**: Embed Nostr references in external content
- **Cross-platform sharing**: Universal identifiers across apps/platforms
- **SEO integration**: Connect web content to Nostr identities
- **Protocol integration**: Standard way to reference Nostr entities

## Implementation Notes
- **NIP-19 dependency**: Requires NIP-19 bech32 encoding
- **Metadata inclusion**: Include relay hints when available
- **Client registration**: Apps should register for URI scheme handling
- **Fallback handling**: Graceful degradation when no handler available

## Related NIPs
- NIP-19 (bech32 encoding used after nostr: prefix)
- NIP-27 (text note references using nostr: URIs)
- NIP-01 (basic entity types being referenced) 