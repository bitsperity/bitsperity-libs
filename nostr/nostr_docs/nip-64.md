# NIP-64: Chess (Portable Game Notation)

## Meta
- **Status**: Draft, Optional
- **Category**: Games/Content
- **Required**: No
- **Purpose**: Chess games in standardized PGN format

## Summary
Defines kind 64 events for chess games using Portable Game Notation (PGN) format. Content is human-readable and compatible with chess software, enabling chess game sharing and analysis on Nostr.

## Core Concepts
- **PGN Format**: Standard chess notation readable by humans and software
- **Game Representation**: Complete game records with metadata
- **Cross-Platform**: Compatible with existing chess tools
- **Validation**: Clients can verify legal moves and formatting
- **Accessibility**: Alt tags for non-supporting clients

## Implementation Details
### Event Structure
- Kind 64 with PGN database in content field
- Strict export format for machine-generated content
- Lax import format accepted for human-created content
- Optional alt tags for broader client support

### PGN Components
- Game headers (Event, Site, Date, Players, Result)
- Move notation with comments and annotations
- Game termination indicators (* for ongoing)
- Standard chess notation (algebraic)

### Client Requirements
- SHOULD display as interactive chessboard
- SHOULD validate PGN format and legal moves
- SHOULD publish in export format
- MAY include additional descriptive tags

## Use Cases
- **Game Sharing**: Post completed chess games
- **Analysis**: Share games with commentary
- **Tournaments**: Tournament game records
- **Education**: Chess instruction and examples
- **Streaming**: Live game progression updates

## Related NIPs
- NIP-31: Alt tags for accessibility
- Standard PGN specification compliance 