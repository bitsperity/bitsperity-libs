# NIP-56: Reporting

## Meta
- **Status**: draft optional
- **Category**: Moderation/Safety
- **Required**: optional
- **Purpose**: Defines reporting mechanism for flagging harmful, inappropriate, or problematic content

## Summary
Enables users to report content and users that violate community standards or platform policies using standardized report events.

## Core Concepts
- **Kind 1984**: Report events (reference to Orwell's 1984)
- **Report categories**: Standardized categories for different violation types
- **Target identification**: Reference specific events, users, or content
- **Public reporting**: Reports are publicly visible for transparency
- **Report aggregation**: Multiple reports on same content increase confidence

## Report Event Structure (Kind 1984)
```json
{
  "kind": 1984,
  "content": "This content contains hate speech targeting minorities",
  "tags": [
    ["e", "reported-event-id", "wss://relay.com"],
    ["p", "reported-user-pubkey"],
    ["report", "nudity", "NSFW content without warning"],
    ["L", "MOD"],
    ["l", "sexual", "MOD"]
  ]
}
```

## Report Categories (report tag)
**Format**: `["report", "<category>", "<reason>"]`

### Standard Categories
- **nudity**: Nude or sexual content
- **profanity**: Offensive language or profanity
- **illegal**: Illegal content or activities
- **spam**: Spam or repetitive content
- **impersonation**: Impersonating another person
- **copyright**: Copyright infringement
- **harassment**: Harassment or bullying
- **violence**: Violent content or threats
- **self-harm**: Self-harm or suicide content
- **hate**: Hate speech or discriminatory content
- **malware**: Malicious software or links
- **scam**: Fraudulent or scam content
- **misinformation**: False or misleading information
- **doxxing**: Sharing private personal information
- **other**: Other violations (specify in reason)

## Report Targets

### Event Reports
**Report specific events**:
```json
{
  "kind": 1984,
  "content": "This post contains spam links",
  "tags": [
    ["e", "spam-event-id"],
    ["report", "spam", "Promotional spam with affiliate links"]
  ]
}
```

### User Reports
**Report users**:
```json
{
  "kind": 1984,
  "content": "This user is impersonating a celebrity",
  "tags": [
    ["p", "impersonator-pubkey"],
    ["report", "impersonation", "Pretending to be Elon Musk"]
  ]
}
```

### Multiple Targets
**Report multiple items**:
```json
{
  "kind": 1984,
  "content": "Coordinated spam campaign",
  "tags": [
    ["e", "spam-event-1"],
    ["e", "spam-event-2"],
    ["p", "spam-account"],
    ["report", "spam", "Multiple spam posts from same account"]
  ]
}
```

## Labeling Integration (NIP-32)
**Combine with labeling**:
```json
{
  "kind": 1984,
  "tags": [
    ["e", "reported-event"],
    ["report", "nudity", "Explicit content"],
    ["L", "MOD"],
    ["l", "nsfw", "MOD"],
    ["L", "quality"],
    ["l", "inappropriate", "quality"]
  ]
}
```

## Report Processing

### Client Implementation
- **Report interface**: Easy reporting interface in clients
- **Category selection**: User-friendly category selection
- **Report aggregation**: Show multiple reports on same content
- **Report confidence**: Indicate confidence based on report volume

### Moderator Tools
- **Report dashboard**: Interface for reviewing reports
- **Report filtering**: Filter reports by category or severity
- **Action taking**: Take action based on reports
- **Reporter reputation**: Consider reporter reliability

## Use Cases
- **Content moderation**: Flag inappropriate content for review
- **Spam detection**: Identify and report spam content
- **Community safety**: Maintain safe community environments
- **Policy enforcement**: Enforce platform or community policies
- **Crowdsourced moderation**: Community-driven content moderation

## Report Quality

### Effective Reports
- **Specific categories**: Use appropriate, specific categories
- **Clear reasons**: Provide clear explanation in reason field
- **Relevant content**: Only report actually problematic content
- **Accurate targeting**: Correctly identify the problematic content

### Report Validation
- **Reporter reputation**: Track reporter accuracy over time
- **Report consensus**: Multiple reports increase reliability
- **False reports**: Identify and handle false or malicious reports
- **Context consideration**: Consider cultural and contextual factors

## Privacy and Ethics

### Transparency
- **Public reports**: Reports are publicly visible
- **Reporter identity**: Reporter identity is not hidden
- **Report content**: Report reasons are publicly visible
- **Accountability**: Both reporters and reported users accountable

### Abuse Prevention
- **False reporting**: Prevent malicious false reporting
- **Report spam**: Prevent spam reporting attacks
- **Harassment**: Prevent report-based harassment
- **Proportional response**: Ensure responses match violation severity

## Relay and Client Behavior

### Relay Handling
- **Report storage**: Store and relay report events
- **Report queries**: Enable querying reports by target
- **Optional filtering**: May filter based on reports
- **Report aggregation**: May provide report aggregation

### Client Display
- **Warning indicators**: Show warnings for reported content
- **Report counts**: Display number of reports
- **User choice**: Let users decide whether to view reported content
- **Report interface**: Provide easy reporting mechanisms

## Automated Processing
- **Report aggregation**: Automatically aggregate reports
- **Threshold-based action**: Take action based on report volume
- **Pattern detection**: Detect reporting patterns
- **Integration with other systems**: Integrate with existing moderation tools

## Related NIPs
- NIP-01 (basic event structure)
- NIP-32 (labeling - complementary moderation approach)
- NIP-36 (content warnings)
- NIP-72 (community moderation) 