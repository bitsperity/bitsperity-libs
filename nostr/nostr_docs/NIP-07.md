# NIP-07: Browser Extension API

## Meta
- **Status**: draft optional
- **Category**: Browser Integration  
- **Required**: optional
- **Purpose**: Defines window.nostr JavaScript API for browser extensions and web apps

## Summary
Standardizes browser-based Nostr API through window.nostr object for signing events and encryption without exposing private keys.

## Core API Methods
**Required:**
- `getPublicKey()`: Returns public key as hex string
- `signEvent(event)`: Takes unsigned event, returns signed event with id, pubkey, sig

**Optional:**
- `nip04.encrypt(pubkey, plaintext)`: NIP-04 encryption (deprecated)
- `nip04.decrypt(pubkey, ciphertext)`: NIP-04 decryption (deprecated)  
- `nip44.encrypt(pubkey, plaintext)`: NIP-44 encryption
- `nip44.decrypt(pubkey, ciphertext)`: NIP-44 decryption

## Security Model
- **Private key isolation**: Extensions manage keys, web apps never see them
- **User consent**: Extensions should prompt for signing/encryption operations
- **Event validation**: Extensions verify event structure before signing
- **No automatic signing**: All operations require explicit user approval

## Implementation Requirements
- All methods are async (return Promises)
- Input event must have: created_at, kind, tags, content
- Output event adds: id, pubkey, sig
- Extensions must never sign malformed events

## Browser Extension Guidelines
- **Manifest timing**: Use `"run_at": "document_end"` for availability on page load
- **Security prompts**: Show users what they're signing
- **Key management**: Secure storage of private keys
- **Domain isolation**: Consider domain-specific permissions

## Web App Integration
```javascript
if (window.nostr) {
  const pubkey = await window.nostr.getPublicKey();
  const event = await window.nostr.signEvent({
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: "Hello Nostr!"
  });
}
```

## Use Cases
- **Web clients**: Browser-based Nostr clients without key management
- **dApps**: Nostr-enabled web applications  
- **Cross-platform**: Consistent API across different extensions
- **Security**: Better than web apps handling private keys directly

## Extension Examples
Multiple implementations available - see awesome-nostr repository for current list.

## Related NIPs
- NIP-01 (event structure)
- NIP-04 (deprecated encryption)
- NIP-44 (modern encryption) 