# NIP-26: Delegated Event Signing

## Meta
- **Status**: draft optional unrecommended
- **Category**: Authentication/Delegation
- **Required**: optional
- **Purpose**: UNRECOMMENDED - Allows delegation of signing authority to other keys

## Summary
**UNRECOMMENDED** - Enables event signing delegation through authorization tokens, but adds unnecessary complexity for little gain.

## Core Concepts
- **Delegation tag**: `["delegation", <delegator-pubkey>, <conditions>, <delegation-token>]`
- **Delegator**: Original key owner granting permission
- **Delegatee**: Key receiving permission to sign on behalf of delegator
- **Conditions**: Query string limiting delegation scope
- **Token**: Schnorr signature authorizing delegation

## Delegation Token
SHA256 hash of delegation string signed by delegator:
```
nostr:delegation:<delegatee-pubkey>:<conditions>
```

## Condition Fields
- **kind**: `kind=1` (delegatee may only sign events of this kind)
- **created_at**: Time bounds `created_at>1674834236&created_at<1677426236`
- **Operators**: `=` (equals), `>` (after), `<` (before)
- **Combination**: Multiple conditions joined with `&`

## Example Conditions
- `kind=1&created_at<1675721813` - Only kind:1 before timestamp
- `kind=0&kind=1&created_at>1675721813` - Kind 0 or 1 after timestamp
- `kind=1&created_at>1674777689&created_at<1675721813` - Time window

## Security Recommendations
- **Time limits**: Include `created_at>now` to prevent historic signing
- **Expiration**: Include future expiration timestamp
- **Scope limitation**: Restrict to specific kinds when possible

## Event Structure
Delegated events include delegation tag:
```json
{
  "pubkey": "<delegatee-pubkey>",
  "tags": [
    ["delegation", "<delegator-pubkey>", "conditions", "token"]
  ],
  "content": "Event content",
  "sig": "<signed-by-delegatee>"
}
```

## Validation
- **Condition check**: Verify event meets all delegation conditions
- **Token verification**: Validate delegation token signature
- **Pubkey match**: Ensure delegation references correct delegator
- **Client display**: Show event as from delegator, not delegatee

## Use Cases
- **Cold storage**: Keep root keys offline, use delegated keys for daily use
- **Client keys**: Generate fresh keys per client/device
- **Temporary access**: Grant limited-time signing permissions
- **Service automation**: Allow services to post on user's behalf

## Relay Behavior
- **Author queries**: `["REQ", "", {"authors": ["delegator"]}]` should include delegated events
- **Deletion rights**: Delegator should be able to delete delegated events
- **Validation**: May validate delegation conditions (optional)

## Problems (Why Unrecommended)
- **Complexity**: Adds significant implementation burden
- **Limited benefit**: Marginal improvement over existing key management
- **Validation overhead**: Requires additional signature verification
- **Edge cases**: Complex condition handling and edge case scenarios

## Related NIPs
- NIP-01 (basic event structure and signatures)
- NIP-42 (authentication - alternative approach) 