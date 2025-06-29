# NIP-30: Custom Emoji

## Meta
- **Status**: draft optional
- **Category**: Content/Customization
- **Required**: optional
- **Purpose**: Defines custom emoji shortcodes for events and profiles

## Summary
Enables custom emoji through shortcodes (`:shortcode:`) with corresponding emoji tags defining the actual image URLs.

## Core Concepts
- **Shortcodes**: `:emoji_name:` format in text content
- **Emoji tags**: `["emoji", "<shortcode>", "<image-url>"]`
- **Custom images**: User-defined emoji images
- **Cross-event**: Custom emoji can be used in any text-containing event

## Tag Format
```json
["emoji", "<shortcode>", "<image-url>"]
```
- **shortcode**: Name without colons (e.g., "bitcoin" for `:bitcoin:`)
- **image-url**: Direct link to emoji image file
- **Multiple**: Events can have multiple emoji tags

## Usage in Content
**Text format**: Include shortcodes in content surrounded by colons
```
I love :bitcoin: and :nostr: protocols!
```

**Corresponding tags**:
```json
[
  ["emoji", "bitcoin", "https://example.com/bitcoin.png"],
  ["emoji", "nostr", "https://example.com/nostr.png"]
]
```

## Supported Events
Can be used in any event with text content:
- **Kind 0**: Profile metadata (name, about fields)
- **Kind 1**: Text notes
- **Kind 30023**: Long-form articles
- **Kind 42**: Chat messages
- **Others**: Any event type with text content

## Client Implementation
- **Rendering**: Replace `:shortcode:` with actual images
- **Fallback**: Show `:shortcode:` if image fails to load
- **Size consistency**: Standardize emoji display size
- **Cache**: Cache emoji images for performance

## Image Requirements
- **Format**: Common web formats (PNG, JPG, GIF, WebP)
- **Size**: Recommended square aspect ratio
- **Resolution**: Suitable for inline text display
- **Accessibility**: Consider alt text for screen readers

## Example Event
```json
{
  "kind": 1,
  "content": "Good morning! :coffee: Time to work on :nostr: stuff :rocket:",
  "tags": [
    ["emoji", "coffee", "https://cdn.example.com/coffee.png"],
    ["emoji", "nostr", "https://cdn.example.com/nostr.svg"],
    ["emoji", "rocket", "https://cdn.example.com/rocket.gif"]
  ]
}
```

## Profile Custom Emoji
Users can include custom emoji in their profile:
- **Display name**: `["display_name", "Alice :sparkles:"]`
- **About**: Custom emoji in bio/about text
- **Persistent**: Same emoji can be reused across events

## Moderation Considerations
- **Content policy**: Custom emoji subject to content policies
- **Image hosting**: Users responsible for hosting emoji images
- **Inappropriate content**: Relays/clients may filter offensive emoji
- **Size limits**: Clients may limit emoji file sizes

## Use Cases
- **Personal branding**: Custom emoji for personal identity
- **Community emoji**: Shared emoji within communities
- **Reactions**: Enhanced expression in social interactions
- **Brand identity**: Organizations using branded emoji

## Technical Considerations
- **URL validation**: Validate emoji URLs before rendering
- **Performance**: Limit number of custom emoji per event
- **Caching**: Cache emoji to reduce load times
- **Fallback handling**: Graceful degradation when images fail

## Security Considerations
- **Image verification**: Verify emoji URLs are actually images
- **Privacy**: Emoji loading may reveal IP addresses to image hosts
- **Malicious images**: Be cautious of potentially harmful image files
- **Cross-origin**: Handle CORS issues for emoji loading

## Related NIPs
- NIP-01 (basic event structure)
- NIP-25 (reactions - related emoji usage)
- Any NIP defining events that contain text content 