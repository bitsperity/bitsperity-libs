# Nostr Improvement Proposals (NIPs) - Complete Index

This index provides a comprehensive overview of all Nostr Improvement Proposals (NIPs) with links to original specifications and condensed documentation.

## Legend
- **Status**: Current implementation status
- **Category**: Functional area or protocol layer
- **Required**: Whether implementation is mandatory for Nostr compliance
- **Links**: [NIP] = Original specification, [Doc] = Condensed documentation

---

## Core Protocol NIPs (Foundation)

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [01](nips/01.md) | Basic Protocol Flow Description | Standard | Core Protocol | Yes | Foundation event structure, relay protocol, and basic functionality | [Doc](nostr_docs/NIP-01.md) |
| [02](nips/02.md) | Follow List | Standard | Social | No | Contact list and follow relationships | [Doc](nostr_docs/NIP-02.md) |
| [03](nips/03.md) | OpenTimestamps Attestations | Standard | Proof/Attestation | No | Timestamp verification for events | [Doc](nostr_docs/NIP-03.md) |
| [04](nips/04.md) | Encrypted Direct Message | Deprecated | Communication | No | Legacy encrypted messaging (superseded by NIP-17) | [Doc](nostr_docs/NIP-04.md) |
| [05](nips/05.md) | Mapping Nostr keys to DNS-based internet identifiers | Standard | Identity | No | Human-readable identity verification | [Doc](nostr_docs/NIP-05.md) |
| [06](nips/06.md) | Basic key derivation from mnemonic seed phrase | Standard | Cryptography | No | HD wallet-style key generation | [Doc](nostr_docs/NIP-06.md) |
| [07](nips/07.md) | Browser Extension API | Standard | Browser Integration | No | Standard browser extension interface | [Doc](nostr_docs/NIP-07.md) |
| [08](nips/08.md) | Handling Mentions | Deprecated | Text Processing | No | Legacy mention handling (moved to NIP-01) | [Doc](nostr_docs/NIP-08.md) |
| [09](nips/09.md) | Event Deletion Request | Standard | Moderation | No | Request deletion of specific events | [Doc](nostr_docs/NIP-09.md) |
| [10](nips/10.md) | Conventions for clients' use of `e` and `p` tags | Standard | Social/Threading | No | Text note threading and conversations | [Doc](nostr_docs/NIP-10.md) |

## Relay & Infrastructure NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [11](nips/11.md) | Relay Information Document | Standard | Relay Management | No | Relay metadata and capability advertisement | [Doc](nostr_docs/NIP-11.md) |
| [12](nips/12.md) | Generic Tag Queries | Moved | Query | No | Tag-based filtering (moved to NIP-01) | [Doc](nostr_docs/NIP-12.md) |
| [13](nips/13.md) | Proof of Work | Standard | Spam Prevention | No | Computational proof to prevent spam | [Doc](nostr_docs/NIP-13.md) |
| [42](nips/42.md) | Authentication of clients to relays | Standard | Relay/Authentication | No | Cryptographic client authentication | [Doc](nostr_docs/NIP-42.md) |
| [65](nips/65.md) | Relay List Metadata | Draft | Relay Management | No | User's preferred read/write relays | [Doc](nostr_docs/nip-65.md) |
| [66](nips/66.md) | Relay Discovery and Liveness Monitoring | Draft | Relay Management/Monitoring | No | Automated relay health monitoring | [Doc](nostr_docs/nip-66.md) |
| [70](nips/70.md) | Protected Events | Draft | Access Control/Privacy | No | Events publishable only by their author | [Doc](nostr_docs/nip-70.md) |
| [77](nips/77.md) | Negentropy Syncing | Draft | Protocol/Synchronization | No | Efficient event synchronization protocol | [Doc](nostr_docs/nip-77.md) |
| [86](nips/86.md) | Relay Management API | Draft | Relay Management/Administration | No | HTTP REST API for relay administration | [Doc](nostr_docs/nip-86.md) |

## Social & Communication NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [14](nips/14.md) | Subject Tag in Text Events | Standard | Social/Text Processing | No | Subject metadata for text notes | [Doc](nostr_docs/NIP-14.md) |
| [17](nips/17.md) | Private Direct Messages | Standard | Communication/Privacy | No | Modern secure direct messaging | [Doc](nostr_docs/NIP-17.md) |
| [18](nips/18.md) | Reposts | Standard | Social/Content Sharing | No | Share existing content with attribution | [Doc](nostr_docs/NIP-18.md) |
| [22](nips/22.md) | Comments | Standard | Social/Threading | No | Comments on arbitrary events | [Doc](nostr_docs/NIP-22.md) |
| [25](nips/25.md) | Reactions | Standard | Social/Engagement | No | Like/dislike and emoji reactions | [Doc](nostr_docs/NIP-25.md) |
| [28](nips/28.md) | Public Chat | Standard | Communication/Chat | No | Public chatroom functionality | [Doc](nostr_docs/NIP-28.md) |
| [29](nips/29.md) | Relay-based Groups | Standard | Groups/Communities | No | Private relay-based group communication | [Doc](nostr_docs/NIP-29.md) |
| [38](nips/38.md) | User Statuses | Standard | Social/Status | No | Temporary status messages | [Doc](nostr_docs/NIP-38.md) |
| [72](nips/72.md) | Moderated Communities (Reddit Style) | Draft | Social/Communities | No | Reddit-style public communities | [Doc](nostr_docs/nip-72.md) |
| [88](nips/88.md) | Polls | Draft | Social/Voting | No | Create and participate in polls/surveys | [Doc](nostr_docs/nip-88.md) |
| [7D](nips/7D.md) | Threads | Draft | Social/Threading | No | Threaded discussion format | [Doc](nostr_docs/nip-7d.md) |
| [C7](nips/C7.md) | Chats | Draft | Communication/Chat | No | Simple chat message format | [Doc](nostr_docs/nip-c7.md) |

## Content & Media NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [23](nips/23.md) | Long-form Content | Standard | Content/Publishing | No | Articles and long-form text content | [Doc](nostr_docs/NIP-23.md) |
| [30](nips/30.md) | Custom Emoji | Standard | Content/Customization | No | Custom emoji for enhanced expression | [Doc](nostr_docs/NIP-30.md) |
| [36](nips/36.md) | Sensitive Content / Content Warning | Standard | Content Moderation/Safety | No | Content warnings and NSFW tagging | [Doc](nostr_docs/NIP-36.md) |
| [37](nips/37.md) | Draft Events | Standard | Content/Publishing | No | Draft content before publishing | [Doc](nostr_docs/NIP-37.md) |
| [64](nips/64.md) | Chess (Portable Game Notation) | Draft | Games/Content | No | Chess games in standardized PGN format | [Doc](nostr_docs/nip-64.md) |
| [68](nips/68.md) | Picture-first feeds | Draft | Media/Social | No | Instagram-style picture-centric posts | [Doc](nostr_docs/nip-68.md) |
| [71](nips/71.md) | Video Events | Draft | Media/Video | No | Dedicated video content posts | [Doc](nostr_docs/nip-71.md) |
| [84](nips/84.md) | Highlights | Draft | Content/Bookmarking | No | Mark valuable content portions | [Doc](nostr_docs/nip-84.md) |
| [92](nips/92.md) | Media Attachments | Standard | Media/Metadata | No | Inline metadata for media URLs | [Doc](nostr_docs/nip-92.md) |
| [94](nips/94.md) | File Metadata | Draft | File Management/Metadata | No | Organization and classification of files | [Doc](nostr_docs/nip-94.md) |
| [B0](nips/B0.md) | Web Bookmarking | Draft | Content/Bookmarking | No | HTTP/HTTPS web bookmark storage | [Doc](nostr_docs/nip-b0.md) |
| [C0](nips/C0.md) | Code Snippets | Draft | Development/Code Sharing | No | Specialized events for sharing code | [Doc](nostr_docs/nip-c0.md) |

## Identity & Verification NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [19](nips/19.md) | bech32-encoded entities | Standard | Encoding/Identity | No | Standard encoding for Nostr entities | [Doc](nostr_docs/NIP-19.md) |
| [39](nips/39.md) | External Identities in Profiles | Standard | Identity/Verification | No | Link external social media accounts | [Doc](nostr_docs/NIP-39.md) |
| [58](nips/58.md) | Badges | Draft | Social/Recognition | No | Digital badge system for achievements | [Doc](nostr_docs/nip-58.md) |

## Payments & Commerce NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [15](nips/15.md) | Nostr Marketplace | Standard | Commerce/Marketplace | No | Decentralized marketplace protocol | [Doc](nostr_docs/NIP-15.md) |
| [57](nips/57.md) | Lightning Zaps | Draft | Payments/Lightning | No | Lightning payment integration | [Doc](nostr_docs/nip-57.md) |
| [60](nips/60.md) | Cashu Wallets | Draft | Payments/Cashu | No | Relay-stored Cashu wallet state | [Doc](nostr_docs/nip-60.md) |
| [61](nips/61.md) | Nutzaps | Draft | Payments/Cashu | No | Cashu-based payments with token receipts | [Doc](nostr_docs/nip-61.md) |
| [69](nips/69.md) | Peer-to-peer Order events | Draft | Commerce/Trading | No | Standardized P2P trading orders | [Doc](nostr_docs/nip-69.md) |
| [75](nips/75.md) | Zap Goals | Draft | Payments/Fundraising | No | Lightning-based fundraising goals | [Doc](nostr_docs/nip-75.md) |
| [99](nips/99.md) | Classified Listings | Draft | Commerce/Classifieds | No | Classified ads for products/services | [Doc](nostr_docs/nip-99.md) |

## Privacy & Security NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [44](nips/44.md) | Versioned Encryption | Standard | Cryptography/Encryption | No | Modern encryption for sensitive content | [Doc](nostr_docs/NIP-44.md) |
| [59](nips/59.md) | Gift Wrap | Optional | Privacy/Encryption | No | Obscure metadata for any event | [Doc](nostr_docs/nip-59.md) |
| [62](nips/62.md) | Request to Vanish | Draft | Privacy/Legal | No | Complete key fingerprint reset request | [Doc](nostr_docs/nip-62.md) |

## Technical Integration NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [21](nips/21.md) | Nostr URI scheme | Standard | Linking/References | No | Standard URI scheme for Nostr entities | [Doc](nostr_docs/NIP-21.md) |
| [26](nips/26.md) | Delegated Event Signing | Unrecommended | Authentication/Delegation | No | Delegate signing authority (deprecated) | [Doc](nostr_docs/NIP-26.md) |
| [27](nips/27.md) | Text Note References | Standard | Text Processing/References | No | Reference other notes in text content | [Doc](nostr_docs/NIP-27.md) |
| [46](nips/46.md) | Nostr Connect | Standard | Key Management/Remote Signing | No | Remote signing and key management | [Doc](nostr_docs/NIP-46.md) |
| [47](nips/47.md) | Wallet Connect | Standard | Lightning/Payments | No | Lightning wallet integration protocol | [Doc](nostr_docs/NIP-47.md) |
| [55](nips/55.md) | Android Signer Application | Standard | Mobile/Android/Signing | No | Android app for key management | [Doc](nostr_docs/NIP-55.md) |
| [78](nips/78.md) | Arbitrary custom app data | Draft | Application Data/Storage | No | RemoteStorage-like app data storage | [Doc](nostr_docs/nip-78.md) |
| [89](nips/89.md) | Recommended Application Handlers | Draft | Application Discovery/Interoperability | No | Discover apps for unknown event kinds | [Doc](nostr_docs/nip-89.md) |
| [96](nips/96.md) | HTTP File Storage Integration | Draft | File Storage/HTTP Integration | No | REST API for HTTP file storage | [Doc](nostr_docs/nip-96.md) |
| [98](nips/98.md) | HTTP Auth | Draft | Authentication/HTTP | No | Ephemeral event-based HTTP authorization | [Doc](nostr_docs/nip-98.md) |
| [B7](nips/B7.md) | Blossom media | Draft | Media/File Storage | No | Blossom protocol integration | [Doc](nostr_docs/nip-b7.md) |

## Data & Processing NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [31](nips/31.md) | Dealing with Unknown Events | Standard | Content/Alternative | No | Handle unknown event kinds gracefully | [Doc](nostr_docs/NIP-31.md) |
| [32](nips/32.md) | Labeling | Standard | Moderation/Metadata | No | Label content for moderation/organization | [Doc](nostr_docs/NIP-32.md) |
| [34](nips/34.md) | Git Stuff | Standard | Development/Version Control | No | Git repository integration | [Doc](nostr_docs/NIP-34.md) |
| [40](nips/40.md) | Expiration Timestamp | Standard | Event Lifecycle/Metadata | No | Event expiration and cleanup | [Doc](nostr_docs/NIP-40.md) |
| [43](nips/43.md) | Fast Authentication | Standard | Authentication/Performance | No | Optimized relay authentication | [Doc](nostr_docs/NIP-43.md) |
| [45](nips/45.md) | Counting Results | Standard | Relay/Query | No | Efficient counting without full results | [Doc](nostr_docs/NIP-45.md) |
| [48](nips/48.md) | Proxy Tags | Standard | Proxy/Relay | No | Proxy server integration | [Doc](nostr_docs/NIP-48.md) |
| [50](nips/50.md) | Search Capability | Standard | Relay/Search | No | Text search functionality | [Doc](nostr_docs/NIP-50.md) |
| [51](nips/51.md) | Lists | Standard | Lists/Collections | No | Generic list management system | [Doc](nostr_docs/NIP-51.md) |
| [73](nips/73.md) | External Content IDs | Draft | Content/References | No | Reference global content identifiers | [Doc](nostr_docs/nip-73.md) |
| [90](nips/90.md) | Data Vending Machine | Draft | Marketplace/Computation | No | On-demand data processing marketplace | [Doc](nostr_docs/nip-90.md) |

## Event & Calendar NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [52](nips/52.md) | Calendar Events | Standard | Events/Calendar | No | Calendar event management | [Doc](nostr_docs/NIP-52.md) |
| [53](nips/53.md) | Live Activities | Standard | Live Events/Streaming | No | Live streaming and real-time events | [Doc](nostr_docs/NIP-53.md) |
| [54](nips/54.md) | Wiki | Standard | Content/Knowledge | No | Collaborative wiki system | [Doc](nostr_docs/NIP-54.md) |

## Moderation & Safety NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [56](nips/56.md) | Reporting | Standard | Moderation/Safety | No | Report inappropriate content/users | [Doc](nostr_docs/NIP-56.md) |

## Legacy & Moved NIPs

| NIP | Title | Status | Category | Required | Description | Links |
|-----|-------|--------|----------|----------|-------------|-------|
| [16](nips/16.md) | Event Treatment | Moved | Processing | No | Event processing guidelines (moved to NIP-01) | [Doc](nostr_docs/NIP-16.md) |
| [20](nips/20.md) | Command Results | Moved | Protocol | No | Command result format (moved to NIP-01) | [Doc](nostr_docs/NIP-20.md) |
| [24](nips/24.md) | Extra Metadata Fields and Tags | Standard | Metadata/Standards | No | Additional metadata standardization | [Doc](nostr_docs/NIP-24.md) |
| [33](nips/33.md) | Parameterized Replaceable Events | Moved | Events | No | Advanced replaceable events (moved to NIP-01) | [Doc](nostr_docs/NIP-33.md) |
| [35](nips/35.md) | Torrents | Standard | File Sharing/BitTorrent | No | BitTorrent integration for file sharing | [Doc](nostr_docs/NIP-35.md) |

---

## Statistics

- **Total NIPs**: 88+
- **Standard**: 45+ NIPs
- **Draft**: 35+ NIPs  
- **Deprecated**: 2 NIPs
- **Moved**: 4 NIPs
- **Categories**: 25+ different functional areas

## Quick Reference

### Most Important NIPs for New Implementations
1. **NIP-01**: Core protocol (required)
2. **NIP-02**: Follow lists (social functionality)
3. **NIP-05**: Identity verification
4. **NIP-07**: Browser extension support
5. **NIP-09**: Event deletion
6. **NIP-10**: Threading and conversations
7. **NIP-11**: Relay information
8. **NIP-25**: Reactions

### Security & Privacy Essential
- **NIP-44**: Modern encryption
- **NIP-59**: Metadata privacy
- **NIP-98**: HTTP authentication
- **NIP-42**: Client authentication

### Payments & Commerce
- **NIP-57**: Lightning payments
- **NIP-60/61**: Cashu integration
- **NIP-15**: Marketplace protocol

---

*Last updated: 2024 - This index covers all known NIPs in the official repository*
