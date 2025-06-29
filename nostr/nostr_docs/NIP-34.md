# NIP-34: Git Stuff

## Meta
- **Status**: draft optional
- **Category**: Development/Version Control
- **Required**: optional
- **Purpose**: Defines Git repository metadata and patch submission via Nostr

## Summary
Enables Git repository management and patch submission workflows using Nostr events for decentralized code collaboration.

## Core Event Types

### Repository Announcement (Kind 30617)
**Purpose**: Announce and describe Git repositories
- **Addressable**: Uses d-tag with repository identifier
- **Content**: Repository description
- **Metadata**: Repository name, clone URLs, web interface

```json
{
  "kind": 30617,
  "content": "A decentralized social media protocol",
  "tags": [
    ["d", "nostr-protocol"],
    ["name", "nostr"],
    ["description", "A decentralized social media protocol"],
    ["clone", "https://github.com/nostr-protocol/nostr.git"],
    ["clone", "git@github.com:nostr-protocol/nostr.git"],
    ["web", "https://github.com/nostr-protocol/nostr"],
    ["r", "https://github.com/nostr-protocol/nostr"]
  ]
}
```

### Repository State (Kind 30618)
**Purpose**: Announce repository state updates (commits, branches, tags)
- **Addressable**: Uses d-tag with repository identifier
- **Content**: Commit message or state description
- **References**: Links to commits, branches, or tags

### Patch Events (Kind 1617)
**Purpose**: Submit patches/pull requests to repositories
- **Content**: Patch diff or description
- **Repository reference**: Links to target repository
- **Commit references**: Base commit for patch application

## Repository Metadata Tags
- **name**: Repository name `["name", "nostr"]`
- **description**: Brief repository description
- **clone**: Clone URLs (multiple allowed)
- **web**: Web interface URL
- **r**: Related web URLs
- **maintainers**: Repository maintainer pubkeys

## Patch Submission
- **Base commit**: Reference commit patch applies to
- **Diff content**: Actual patch content in unified diff format
- **Author info**: Patch author information
- **Commit message**: Proposed commit message

## Use Cases
- **Repository discovery**: Find open source projects on Nostr
- **Patch submission**: Submit code changes without GitHub/GitLab
- **Project announcements**: Announce new releases or updates
- **Distributed development**: Coordinate development across Nostr
- **Fork announcements**: Announce repository forks

## Workflow Integration
- **Git hooks**: Integrate with Git hooks for automatic announcements
- **CI/CD**: Trigger builds from Nostr events
- **Code review**: Discuss patches using Nostr comments
- **Issue tracking**: Use other event types for bug reports

## Client Implementation
- **Repository browser**: Display repository information
- **Patch viewer**: Show patch diffs with syntax highlighting
- **Clone integration**: Enable one-click repository cloning
- **Notification system**: Notify maintainers of new patches

## Decentralization Benefits
- **Censorship resistance**: Cannot be taken down by centralized platforms
- **Identity continuity**: Developers keep identity across platforms
- **Direct communication**: Direct developer-to-developer communication
- **Platform independence**: Not tied to specific Git hosting services

## Security Considerations
- **Patch verification**: Verify patch signatures and author identity
- **Repository authenticity**: Verify repository announcements
- **Spam prevention**: Filter out spam patches and announcements
- **Malicious code**: Review patches for malicious content

## Integration Examples
- **GitHub mirror**: Mirror GitHub repositories to Nostr
- **GitLab integration**: Sync GitLab projects with Nostr
- **Self-hosted**: Announce self-hosted repositories
- **Multiple remotes**: Coordinate across multiple Git remotes

## Related NIPs
- NIP-01 (basic event structure)
- NIP-22 (comments for code review)
- NIP-23 (long-form content for detailed documentation)
- NIP-51 (lists for repository collections) 