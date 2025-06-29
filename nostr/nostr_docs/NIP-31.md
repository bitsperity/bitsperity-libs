# NIP-31: Dealing with Unknown Events

## Meta
- **Status**: draft optional
- **Category**: Content/Alternative
- **Required**: optional
- **Purpose**: Defines alt tags for providing human-readable descriptions of unknown events

## Summary
Provides fallback descriptions for events using unknown kinds through standardized alt tags.

## Core Concepts
- **Alt tag**: `["alt", "<description>"]` providing human-readable description
- **Unknown events**: Events with kinds not understood by client
- **Graceful degradation**: Show meaningful text instead of raw data
- **Single description**: One alt tag per event

## Alt Tag Format
```json
["alt", "This is a description of what this event represents"]
```
- **Single tag**: Events should have at most one alt tag
- **Human-readable**: Plain text description understandable by users
- **Brief**: Concise explanation of event purpose/content

## Usage Scenarios
- **New event kinds**: Events using newer kinds not yet supported
- **Custom events**: Application-specific events
- **Complex data**: Events with complex structures
- **Forward compatibility**: Maintaining readability across client versions

## Example Event
```json
{
  "kind": 9999,
  "content": "{\"complex_data\": \"...\"}",
  "tags": [
    ["alt", "Alice updated her chess game position"],
    ["e", "game-event-id"]
  ]
}
```

## Client Implementation
- **Unknown event handling**: Check for alt tag when encountering unknown kinds
- **Display priority**: Show alt text instead of raw event data
- **Fallback chain**: alt tag → content field → generic "unknown event" message
- **Styling**: May style unknown events differently

## Content vs Alt Tag
- **Content field**: May contain structured data for applications
- **Alt tag**: Always human-readable description
- **Purpose**: Alt tag explains what the event does, not raw data
- **Audience**: Alt tag targets end users, content targets applications

## Implementation Guidelines
- **Event creators**: Should include alt tag for non-standard kinds
- **Client developers**: Should respect and display alt tags
- **Description quality**: Alt descriptions should be meaningful and specific
- **Localization**: Alt tags should be in user's preferred language when possible

## Use Cases
- **Gaming events**: Chess moves, game state changes
- **App-specific data**: Custom application events
- **Experimental features**: New event types being tested
- **Business logic**: Commerce, workflow, or automation events

## Best Practices
- **Descriptive text**: "Alice moved her queen to E4" vs "Game event"
- **Present tense**: Describe what happened or is happening
- **User context**: Include relevant user/object names
- **Action clarity**: Make the action/purpose clear

## Limitations
- **Single language**: Alt tag typically in one language
- **Length constraints**: Should be reasonably brief
- **Static description**: Cannot be dynamically generated per viewer
- **No formatting**: Plain text only, no markup

## Related NIPs
- NIP-01 (basic event structure)
- All NIPs defining custom event kinds should consider alt tags 