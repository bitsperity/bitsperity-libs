# NIP-32: Labeling

## Meta
- **Status**: draft optional
- **Category**: Moderation/Metadata
- **Required**: optional
- **Purpose**: Defines generic labeling/tagging system for content moderation and organization

## Summary
Universal labeling system using kind:1985 events to attach labels/ratings to any Nostr content or users.

## Core Concepts
- **Kind 1985**: Label events containing labeling information
- **Subject references**: Target of labeling (events, pubkeys, URLs, etc.)
- **Label namespaces**: Categorize different types of labels
- **Multiple labels**: Single event can contain multiple labels
- **Reviewers**: Anyone can create labels

## Label Structure
**L-tag (namespace)**: `["L", "<namespace>"]`
- Defines the type/category of labeling

**l-tag (label)**: `["l", "<label-value>", "<namespace>"]`
- The actual label within the namespace
- Multiple l-tags can exist per namespace

## Standard Label Namespaces

### Content Rating (`#nsfw`)
- **Namespace**: `["L", "#nsfw"]`
- **Labels**: Various content classifications
- **Values**: `nudity`, `violence`, `adult-content`, etc.

### Quality Assessment (`#quality`)
- **Namespace**: `["L", "#quality"]`
- **Labels**: Quality indicators
- **Values**: `spam`, `fake-news`, `high-quality`, `misleading`

### Topical Classification (`#topic`)
- **Namespace**: `["L", "#topic"]`
- **Labels**: Subject matter tags
- **Values**: `bitcoin`, `politics`, `music`, `technology`

## Subject References (What's Being Labeled)
**Event labeling**:
- `["e", "<event-id>", "<relay>"]` - Label specific event

**Profile labeling**:
- `["p", "<pubkey>", "<relay>"]` - Label user profile

**URL labeling**:
- `["r", "<url>"]` - Label external web content

**Addressable event labeling**:
- `["a", "<kind>:<pubkey>:<d-tag>", "<relay>"]` - Label addressable event

## Example Label Event
```json
{
  "kind": 1985,
  "content": "This content contains nudity",
  "tags": [
    ["L", "#nsfw"],
    ["l", "nudity", "#nsfw"],
    ["e", "event-id-being-labeled", "wss://relay.com"],
    ["p", "author-pubkey", "wss://relay.com"]
  ]
}
```

## Multi-Label Events
Single event can apply multiple labels:
```json
{
  "kind": 1985,
  "content": "Spam content about cryptocurrency",
  "tags": [
    ["L", "#quality"],
    ["L", "#topic"],
    ["l", "spam", "#quality"],
    ["l", "bitcoin", "#topic"],
    ["e", "spam-event-id"]
  ]
}
```

## Use Cases
- **Content moderation**: Flag inappropriate or harmful content
- **Content discovery**: Categorize content by topic or theme
- **Quality filtering**: Rate content quality or authenticity
- **Recommendation systems**: Build recommendation algorithms
- **Community curation**: Crowdsourced content classification

## Client Implementation
- **Label aggregation**: Collect labels from multiple reviewers
- **Filtering**: Allow users to filter content based on labels
- **Display**: Show label information to users
- **Weight by reputation**: Consider labeler reputation in decisions

## Moderation Applications
- **Automated filtering**: Hide content with certain labels
- **Warning systems**: Show warnings for labeled content  
- **User preferences**: Let users set their own filtering preferences
- **Relay policies**: Relays can use labels for content decisions

## Reputation Considerations
- **Labeler identity**: Consider who is applying labels
- **Label consensus**: Multiple labelers agreeing increases confidence
- **User trust**: Users can choose which labelers to trust
- **Gaming resistance**: Design systems resistant to label manipulation

## Privacy Considerations
- **Public labels**: All labels are publicly visible
- **Labeler exposure**: Labeling creates public record of reviewer opinions
- **Retaliation risk**: Labelers may face backlash for negative labels

## Related NIPs
- NIP-01 (basic event structure)
- NIP-25 (reactions - related evaluation mechanism)
- NIP-56 (reporting - related to content moderation)
- NIP-72 (community moderation) 