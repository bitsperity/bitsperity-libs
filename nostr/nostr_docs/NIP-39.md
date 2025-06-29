# NIP-39: External Identities

## Meta
- **Status**: draft optional
- **Category**: Identity/Verification
- **Required**: optional
- **Purpose**: Defines verification of external platform identities using kind:0 metadata

## Summary
Enables users to verify ownership of external platform accounts (Twitter, GitHub, etc.) by including claims in profile metadata.

## Core Concepts
- **Identity claims**: Assertions about external account ownership
- **Verification proof**: Evidence linking Nostr identity to external platform
- **Multiple platforms**: Support for various external identity providers
- **Optional verification**: External identity linking is voluntary

## Identity Claim Format
**Profile metadata field**:
```json
{
  "kind": 0,
  "content": "{\"name\": \"Alice\", \"nip05\": \"alice@example.com\", \"twitter\": \"alice_twitter\", \"github\": \"alice-dev\"}"
}
```

## Supported Platform Fields
- **twitter**: Twitter/X username (without @)
- **github**: GitHub username
- **telegram**: Telegram username
- **mastodon**: Mastodon handle (user@instance.com)
- **reddit**: Reddit username (without u/)
- **youtube**: YouTube channel ID or handle
- **instagram**: Instagram username
- **linkedin**: LinkedIn profile identifier
- **facebook**: Facebook profile identifier
- **website**: Personal website URL

## Verification Methods
**Nostr pubkey posting**: Post Nostr pubkey on external platform
- Twitter: Tweet containing pubkey
- GitHub: Gist or repo with pubkey
- Website: HTML meta tag or text file

**Signature verification**: Sign challenge with external platform keys
- GitHub: Sign with SSH or GPG key
- Website: DNS TXT record or .well-known file

## Example Verification Tweet
```
Verifying my Nostr identity: npub1abc123... #nostr
```

## Client Implementation
- **Claim display**: Show external identity claims in profiles
- **Verification status**: Indicate verification status with badges/icons
- **Verification process**: Guide users through verification steps
- **Multiple identities**: Support multiple external identity types

## Verification Checking
**Automated verification**:
- **API queries**: Check external platforms for verification posts
- **Caching**: Cache verification results to reduce API calls
- **Periodic refresh**: Re-verify claims periodically
- **User-triggered**: Allow manual verification refresh

## Platform-Specific Verification

### Twitter/X Verification
- **Method**: Post tweet with Nostr pubkey
- **Format**: "Verifying my Nostr identity: npub1... #nostr"
- **Checking**: Search Twitter API for verification tweets

### GitHub Verification
- **Method**: Create gist or add to profile README
- **Format**: Plain text file containing Nostr pubkey
- **Checking**: Query GitHub API for user content

### Website Verification
- **Method 1**: HTML meta tag `<meta name="nostr" content="npub1...">`
- **Method 2**: /.well-known/nostr.txt file with pubkey
- **Method 3**: DNS TXT record
- **Checking**: HTTP requests or DNS queries

## Use Cases
- **Identity verification**: Prove ownership of established accounts
- **Cross-platform discovery**: Find users across platforms
- **Reputation transfer**: Leverage existing platform reputation
- **Account recovery**: Additional identity verification for account recovery
- **Trust building**: Increase trust through verified external identities

## Privacy Considerations
- **Public linking**: External identity claims are publicly visible
- **Platform exposure**: Links your Nostr identity to other platforms
- **Data correlation**: Enables cross-platform data correlation
- **Optional disclosure**: All external identity claims are voluntary

## Security Considerations
- **Account takeover**: Compromised external accounts affect verification
- **Platform changes**: External platforms may change verification methods
- **False claims**: Clients should verify claims rather than trust blindly
- **Phishing**: Be cautious of fake verification requests

## Client UI/UX
- **Verification badges**: Visual indicators for verified identities
- **Platform icons**: Recognizable icons for each platform
- **Verification guide**: Step-by-step verification instructions
- **Status indicators**: Clear indication of verification status

## Limitations
- **Platform dependency**: Depends on external platform availability
- **API limits**: Rate limiting on platform APIs for verification
- **Account suspension**: Suspended external accounts affect verification
- **Platform policies**: Subject to external platform terms of service

## Related NIPs
- NIP-01 (basic profile metadata)
- NIP-05 (DNS-based verification - complementary approach)
- NIP-24 (extra metadata fields)
- NIP-57 (lightning addresses in profiles) 