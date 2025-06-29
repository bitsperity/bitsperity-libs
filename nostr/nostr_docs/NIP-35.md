# NIP-35: Torrents

## Meta
- **Status**: draft optional
- **Category**: File Sharing/BitTorrent
- **Required**: optional
- **Purpose**: Defines torrent sharing and discovery using Nostr events

## Summary
Enables torrent sharing and discovery through Nostr by embedding torrent metadata in kind:2003 events.

## Core Concepts
- **Kind 2003**: Torrent metadata events
- **Magnet links**: Standard BitTorrent magnet URIs
- **Torrent files**: Optional full .torrent file data
- **Content discovery**: Find torrents through Nostr network
- **Seeder coordination**: Connect seeders and leechers

## Event Structure
```json
{
  "kind": 2003,
  "content": "Optional description of the content",
  "tags": [
    ["title", "Content Title"],
    ["magnet", "magnet:?xt=urn:btih:..."],
    ["file", "content.torrent", "base64-encoded-torrent-file"],
    ["tracker", "https://tracker.example.com/announce"],
    ["size", "1234567890"],
    ["t", "movies"],
    ["t", "action"]
  ]
}
```

## Required Tags
- **magnet**: Magnet link URI for the torrent
- **title**: Human-readable content title

## Optional Tags
- **file**: Base64-encoded .torrent file data
- **tracker**: Tracker URLs (multiple allowed)
- **size**: Total size in bytes
- **t**: Topic/category tags
- **description**: Detailed content description

## Content Discovery
- **Topic filtering**: Find torrents by category/genre tags
- **Text search**: Search titles and descriptions
- **Size filtering**: Filter by file size ranges
- **Tracker filtering**: Find torrents by specific trackers

## Use Cases
- **Content distribution**: Share large files via BitTorrent
- **Torrent discovery**: Find content without centralized trackers
- **Backup coordination**: Coordinate backup seeding efforts
- **Public domain content**: Distribute legal, public domain media
- **Software distribution**: Distribute open source software

## Privacy Considerations
- **IP exposure**: BitTorrent inherently exposes IP addresses
- **Content association**: Sharing torrents creates public record
- **Legal implications**: Users must comply with copyright laws
- **Plausible deniability**: Sharing magnet links vs actual content

## Content Guidelines
- **Legal content only**: Only share content you have rights to distribute
- **Copyright respect**: Respect intellectual property rights
- **Community standards**: Follow relay and community guidelines
- **Content warnings**: Warn about adult or sensitive content

## Client Implementation
- **Magnet handling**: Integrate with BitTorrent clients
- **Torrent preview**: Show torrent metadata before downloading
- **Seeder stats**: Display seeder/leecher information when available
- **Content filtering**: Allow users to filter by content type

## Tracker Integration
- **Public trackers**: Include popular public tracker URLs
- **Private trackers**: Support private tracker workflows
- **DHT support**: Enable DHT for trackerless operation
- **Peer exchange**: Support peer exchange protocols

## Quality Assurance
- **Content verification**: Verify torrents match descriptions
- **Virus scanning**: Recommend virus scanning downloaded content
- **Community ratings**: Allow community rating of torrents
- **Report system**: Enable reporting of problematic content

## Technical Considerations
- **File encoding**: Use base64 for binary .torrent data
- **Size limits**: Be mindful of event size limits for .torrent files
- **Magnet validation**: Validate magnet link format
- **Metadata extraction**: Extract useful metadata from .torrent files

## Related NIPs
- NIP-01 (basic event structure)
- NIP-32 (labeling for content categorization)
- NIP-56 (reporting for problematic content)
- NIP-94 (file metadata - related file sharing approach) 