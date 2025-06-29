# NIP-29: Relay-based Groups

## Meta
- **Status**: draft optional
- **Category**: Groups/Communities
- **Required**: optional
- **Purpose**: Defines relay-based groups with moderation and membership management

## Summary
Relay-managed groups providing moderation, membership control, and group-specific content with special h-tags.

## Core Concepts
- **Relay-managed**: Groups exist on specific relays, not globally
- **H-tag**: Group identifier `["h", "<group-id>"]` on all group events
- **Moderation**: Relay implements group rules and member permissions
- **Private/Public**: Configurable visibility and join policies
- **Threaded**: Inherits threading from NIP-10

## Group Management Events

### Group Metadata (Kind 39000)
**Purpose**: Define group information and settings
- **Replaceable**: Latest version defines current group state
- **Content**: JSON with group metadata
- **H-tag required**: `["h", "<group-id>"]`

```json
{
  "kind": 39000,
  "content": "{\"name\": \"My Group\", \"about\": \"A group for...\", \"picture\": \"https://...\", \"closed\": false}",
  "tags": [["h", "group-id"]]
}
```

### Group Admins (Kind 39001)
**Purpose**: List group administrators
- **Replaceable**: Latest version defines current admins
- **P-tags**: List of admin pubkeys `["p", "<admin-pubkey>", "<relay>", "<petname>"]`
- **Relay management**: Only relay can publish this event type

### Group Members (Kind 39002)
**Purpose**: List group members
- **Replaceable**: Latest version defines current membership
- **P-tags**: List of member pubkeys
- **Privacy**: May be omitted for private groups

## Member Management

### Join Request (Kind 9021)
**Purpose**: Request to join a group
- **H-tag**: References target group
- **Content**: Optional join message

### Leave Request (Kind 9022)
**Purpose**: Leave a group
- **H-tag**: References group to leave
- **Effect**: Relay removes member from group

## Group Content Events

### Group Note (Kind 11)
**Purpose**: Post messages within a group
- **H-tag required**: Associates message with group
- **Threading**: Can reply to other group messages using NIP-10
- **Visibility**: Only visible to group members

### Group Thread (Kind 12)
**Purpose**: Create discussion threads within groups
- **H-tag required**: Associates thread with group
- **Subject**: Optional subject tag `["subject", "Thread topic"]`

## Relay Behavior

### Access Control
- **Membership validation**: Verify user membership before accepting events
- **Admin privileges**: Admins can modify group settings and membership
- **Event filtering**: Only relay group events to authorized members

### Group Operations
- **Join processing**: Handle join requests according to group policy
- **Member removal**: Remove members and their content when requested
- **Moderation**: Delete or hide inappropriate content

### Event Delivery
- **Member queries**: Only deliver group events to current members
- **H-tag filtering**: Filter events by group membership
- **Privacy protection**: Don't leak member lists for private groups

## Group Types

### Open Groups
- **Public membership**: Anyone can see members and content
- **Free join**: Anyone can join without approval
- **Visibility**: Content may be visible to non-members

### Closed Groups
- **Private membership**: Member list not publicly visible
- **Approval required**: Join requests require admin approval
- **Content privacy**: Content only visible to members

## Client Implementation

### Group Discovery
- **Relay queries**: Query specific relays for group metadata
- **Local cache**: Cache group information for performance
- **Membership tracking**: Track user's group memberships

### User Interface
- **Group list**: Show user's groups and available groups
- **Member management**: Allow admins to manage membership
- **Content separation**: Separate group content from regular feeds

### Permission Handling
- **Admin actions**: Enable admin-only features for group admins
- **Member actions**: Standard member capabilities
- **Join workflow**: Handle join requests and approvals

## Use Cases
- **Private communities**: Invite-only discussion groups
- **Project coordination**: Team collaboration spaces
- **Interest groups**: Topic-focused communities
- **Moderated spaces**: Communities with active moderation

## Security Considerations
- **Member verification**: Verify membership before showing content
- **Admin validation**: Ensure only authorized users can perform admin actions
- **Content leakage**: Prevent unauthorized access to private group content
- **Relay trust**: Trust relay to enforce group policies correctly

## Related NIPs
- NIP-01 (basic event structure)
- NIP-10 (threading within groups)
- NIP-51 (group lists and categorization)
- NIP-78 (app-specific data for group settings) 