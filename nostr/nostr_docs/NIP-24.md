# NIP-24: Extra Metadata Fields and Tags

## Meta
- **Status**: draft optional
- **Category**: Metadata/Standards
- **Required**: optional
- **Purpose**: Defines extra optional fields for events not covered in other NIPs

## Summary
Collection of de facto standard metadata fields and tags that have emerged in practice but don't warrant their own NIP.

## Kind 0 Extra Fields
Beyond basic NIP-01 fields (name, about, picture), these optional fields may be present:

- **display_name**: Rich alternative to `name` (can contain Unicode, emojis)
- **website**: Web URL related to the user
- **banner**: Wide background image URL (~1024x768) for profile display
- **bot**: Boolean indicating automated/bot account
- **birthday**: Birth date object `{"year": number, "month": number, "day": number}`

## Kind 0 Deprecated Fields
These should be ignored or migrated:
- **displayName**: Use `display_name` instead
- **username**: Use `name` instead

## Kind 3 Extra Fields
For follow list events:

### Deprecated Fields
- **Relay object**: `{<relay-url>: {"read": boolean, "write": boolean}}` - Use NIP-65 instead

## Universal Tags
These tags may appear in multiple event kinds with consistent meanings:

- **r**: Web URL reference `["r", "https://example.com"]`
- **i**: External identifier reference `["i", "<identifier>"]` (see NIP-73)
- **title**: Name/title for sets, events, listings `["title", "My Event"]`
- **t**: Hashtag (lowercase) `["t", "bitcoin"]`

## Implementation Guidelines
- **Optional nature**: All extra fields are optional
- **Backward compatibility**: Clients should handle missing fields gracefully
- **Display names**: Use `display_name` if present, fallback to `name`
- **Banner images**: Display as background/header image
- **Bot indication**: May affect UI presentation or filtering

## Use Cases
- **Rich profiles**: Enhanced user profile display
- **Account types**: Distinguish between human and bot accounts
- **Profile customization**: Additional visual and descriptive elements
- **Cross-event metadata**: Consistent tag meanings across kinds

## Client Behavior
- **Fallback handling**: Use basic fields if extra fields missing
- **Birthday display**: May show age, zodiac, or birthday reminders
- **Banner display**: Large header images for profile pages
- **Website links**: Clickable links to user's web presence

## Field Validation
- **URL fields**: Should validate URL format for website, banner
- **Bot field**: Boolean true/false or omitted
- **Birthday**: Partial dates allowed (missing year/month/day)
- **Display name**: May contain any Unicode characters

## Privacy Considerations
- **Optional disclosure**: All fields are voluntary
- **PII awareness**: Birthday and website may reveal personal information
- **Bot transparency**: Bot field helps users understand account type

## Related NIPs
- NIP-01 (basic kind:0 metadata)
- NIP-02 (kind:3 follow lists)
- NIP-51 (set metadata using title tag)
- NIP-65 (relay lists replacing deprecated relay object)
- NIP-73 (external identifier types for i-tag) 