# NIP-58: Badges

## Meta
- **Status**: Draft, Optional
- **Category**: Social/Recognition
- **Required**: No  
- **Purpose**: Digital badge system for recognition and achievements

## Summary
Defines three event types for a badge system: Badge Definition (kind 30009), Badge Award (kind 8), and Profile Badges (kind 30008). Allows issuers to create badges, award them to users, and users to display chosen badges on their profiles.

## Core Concepts
- **Badge Definition**: Addressable event defining badge properties
- **Badge Award**: Immutable award of badge to specific users
- **Profile Badges**: User's curated selection of displayed badges
- **Issuer Control**: Only badge issuer can award badges
- **User Choice**: Recipients choose which badges to display

## Implementation Details
### Badge Definition (30009)
- Required: `d` tag with unique badge name
- Optional: `name`, `image`, `description`, `thumb` tags
- Recommended image size: 1024x1024 pixels
- Updatable by issuer

### Badge Award (8)  
- Required: `a` tag referencing badge definition
- Required: One or more `p` tags for recipients
- Immutable and non-transferrable
- Signed by badge issuer

### Profile Badges (30008)
- Required: `d` tag with value "profile_badges"
- Consecutive pairs of `a` and `e` tags
- User controls display order and selection
- Can accept/reject awarded badges

## Use Cases
- **Achievement Recognition**: Gaming, educational milestones
- **Community Status**: Forum moderator, contributor badges
- **Participation Proof**: Event attendance, challenge completion
- **Skill Verification**: Technical expertise, certifications
- **Social Recognition**: Helpfulness, content quality awards

## Related NIPs
- NIP-01: Addressable and regular events
- NIP-33: Parameterized replaceable events 