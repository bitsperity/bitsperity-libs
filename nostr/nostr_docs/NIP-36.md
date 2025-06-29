# NIP-36: Sensitive Content / Content Warning

## Meta
- **Status**: draft optional
- **Category**: Content Moderation/Safety
- **Required**: optional
- **Purpose**: Defines content-warning tag for sensitive or potentially harmful content

## Summary
Provides standardized content warnings using `content-warning` tags to help users avoid sensitive material.

## Core Concepts
- **Content-warning tag**: `["content-warning", "<reason>"]` 
- **Sensitive content**: Content that may disturb, offend, or harm viewers
- **User choice**: Allows users to choose whether to view flagged content
- **Multiple warnings**: Events can have multiple content warning tags

## Tag Format
```json
["content-warning", "<warning-reason>"]
```
- **Single parameter**: Brief description of content warning
- **Multiple tags**: Use separate tags for different warning types
- **Standard reasons**: Common warning categories

## Common Warning Reasons
- **nsfw**: Not safe for work (sexual/adult content)
- **violence**: Violent or graphic content
- **gore**: Graphic violence or blood
- **death**: Content involving death or mortality
- **suicide**: Suicide-related content
- **drugs**: Drug use or substance abuse
- **alcohol**: Alcohol consumption
- **gambling**: Gambling-related content
- **mental-health**: Mental health sensitive topics
- **eating-disorder**: Eating disorder related content
- **self-harm**: Self-harm related content
- **abuse**: Physical, emotional, or sexual abuse
- **hate-speech**: Hateful or discriminatory content
- **politics**: Politically sensitive content
- **religion**: Religious content that may be sensitive
- **medical**: Medical procedures or conditions
- **phobias**: Content that may trigger common phobias
- **flashing**: Flashing lights (epilepsy warning)

## Example Usage
```json
{
  "kind": 1,
  "content": "This post discusses my struggle with depression...",
  "tags": [
    ["content-warning", "mental-health"],
    ["content-warning", "depression"]
  ]
}
```

## Multiple Warnings
```json
{
  "kind": 1,
  "content": "War documentary footage...",
  "tags": [
    ["content-warning", "violence"],
    ["content-warning", "gore"],
    ["content-warning", "death"]
  ]
}
```

## Client Implementation
- **Warning display**: Show content warnings before revealing content
- **Click-through**: Require user action to view warned content
- **User preferences**: Allow users to set warning preferences
- **Auto-hide**: Automatically hide content with certain warnings
- **Batch warnings**: Handle multiple warnings gracefully

## User Interface Patterns
- **Blur/hide content**: Initially hide sensitive content
- **Warning overlay**: Show warning message with "show content" button
- **Icon indicators**: Use icons to indicate warned content
- **Settings panel**: Let users configure warning sensitivity

## Warning Granularity
- **Event-level**: Warning applies to entire event content
- **No partial warnings**: Cannot warn about specific parts of content
- **Media content**: Warnings apply to linked images/videos
- **Thread warnings**: Consider warnings for entire thread contexts

## Use Cases
- **NSFW content**: Adult or sexual content warnings
- **Trauma-sensitive**: Content that may trigger trauma responses
- **Workplace safety**: Content inappropriate for professional settings
- **Parental controls**: Help parents filter content for children
- **Cultural sensitivity**: Respect cultural or religious sensitivities

## Best Practices
- **Specific warnings**: Use specific rather than generic warnings
- **User empowerment**: Give users control over their content experience
- **Consistent labeling**: Use standardized warning categories
- **Err on caution**: Better to over-warn than under-warn

## Privacy Considerations
- **Public warnings**: Content warnings are visible to all users
- **No censorship**: Warnings inform but don't censor content
- **User choice**: Preserve user autonomy in content consumption
- **False positives**: Accept that some warned content may be benign

## Relay Behavior
- **Pass-through**: Relays should preserve content-warning tags
- **Optional filtering**: Relays may optionally filter warned content
- **Policy enforcement**: Relays may require warnings for certain content
- **No modification**: Relays should not add or remove warning tags

## Related NIPs
- NIP-01 (basic event structure)
- NIP-32 (labeling system - complementary approach)
- NIP-56 (reporting - for truly harmful content)
- NIP-25 (reactions - users can react to appropriateness of warnings) 