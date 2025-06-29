# NIP-53: Live Activities

## Meta
- **Status**: draft optional
- **Category**: Live Events/Streaming
- **Required**: optional
- **Purpose**: Defines live activities for real-time events like streaming, live chats, and ongoing activities

## Summary
Enables creation and management of live activities with real-time updates, chat functionality, and activity participation.

## Core Event Types

### Live Event (Kind 30311)
**Purpose**: Create live activities/streams
```json
{
  "kind": 30311,
  "content": "Live Bitcoin discussion and Q&A",
  "tags": [
    ["d", "btc-live-2024-03-15"],
    ["title", "Bitcoin Live Stream"],
    ["summary", "Weekly Bitcoin discussion"],
    ["image", "https://example.com/stream-cover.jpg"],
    ["streaming", "https://stream.example.com/live"],
    ["recording", "https://example.com/recording.mp4"],
    ["starts", "1709668800"],
    ["ends", "1709679600"],
    ["status", "live"],
    ["current_participants", "42"],
    ["total_participants", "156"],
    ["t", "bitcoin"],
    ["t", "livestream"]
  ]
}
```

### Live Chat Message (Kind 1311)
**Purpose**: Chat messages during live activities
```json
{
  "kind": 1311,
  "content": "Great point about Lightning!",
  "tags": [
    ["a", "30311:host-pubkey:btc-live-2024-03-15", "wss://relay.com"]
  ]
}
```

## Live Event Tags

### Required Tags
- **d**: Activity identifier
- **title**: Activity title
- **starts**: Start time (Unix timestamp)

### Optional Tags
- **summary**: Brief description
- **image**: Cover image URL
- **streaming**: Live stream URL
- **recording**: Recording URL (if available)
- **ends**: End time (Unix timestamp)
- **status**: Current status (live, ended, scheduled)
- **current_participants**: Current participant count
- **total_participants**: Total participant count ever
- **participants**: Participant pubkeys
- **relays**: Recommended relays for activity
- **service**: Service provider info

## Activity Status Values
- **planned**: Activity scheduled for future
- **live**: Activity currently happening
- **ended**: Activity has concluded

## Live Chat Integration
**Chat participation**:
- Use kind:1311 for live chat messages
- Reference live activity via a-tag
- Real-time chat during live events

**Chat moderation**:
- Host can moderate chat messages
- Relay-level moderation for live chats
- Community moderation features

## Use Cases
- **Live streaming**: Video/audio live streams
- **Live podcasts**: Real-time podcast recording
- **Live events**: Conferences, meetups, workshops
- **Live discussions**: Community discussions and Q&A
- **Sports events**: Live sports commentary
- **News broadcasting**: Real-time news updates

## Client Implementation

### Activity Discovery
- **Live feed**: Show currently live activities
- **Upcoming events**: Display scheduled activities
- **Activity search**: Search by topic or host
- **Recommendations**: Suggest relevant activities

### Activity Hosting
- **Stream setup**: Easy setup for streaming
- **Chat management**: Moderate live chat
- **Participant management**: Manage participants and roles
- **Recording options**: Record and publish activities

### Activity Participation
- **Join interface**: Easy joining of live activities
- **Chat participation**: Real-time chat during activities
- **Reactions**: React to live content
- **Screen sharing**: Share screens in supported activities

## Technical Integration

### Streaming Services
- **External streams**: Integration with streaming platforms
- **P2P streaming**: Direct peer-to-peer streaming
- **WebRTC support**: Browser-based real-time communication
- **Recording**: Automatic recording and archival

### Real-time Features
- **Live updates**: Real-time activity status updates
- **Participant counts**: Live participant count updates
- **Chat streaming**: Real-time chat message delivery
- **Presence indicators**: Show who's currently active

## Activity Types

### Streaming Activities
- **Video streams**: Live video broadcasting
- **Audio only**: Audio-only streams and podcasts
- **Screen sharing**: Desktop/application sharing
- **Multi-host**: Multiple hosts in single activity

### Interactive Activities
- **Q&A sessions**: Question and answer formats
- **Workshops**: Interactive learning sessions
- **Discussions**: Community discussion formats
- **Gaming**: Live gaming sessions

## Privacy and Moderation
- **Public activities**: Open for anyone to join
- **Private activities**: Invite-only activities
- **Chat moderation**: Real-time chat moderation
- **Participant management**: Block or mute participants

## Activity Analytics
- **Engagement metrics**: Track participation and engagement
- **Recording analytics**: View counts for recordings
- **Chat analysis**: Analyze chat activity and sentiment
- **Growth tracking**: Track audience growth over time

## Related NIPs
- NIP-01 (addressable events)
- NIP-52 (calendar events for scheduling)
- NIP-57 (Lightning payments for paid activities)
- NIP-25 (reactions to live content) 