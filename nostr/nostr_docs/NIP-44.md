# NIP-44: Versioned Encryption

## Meta
- **Status**: final mandatory
- **Category**: Cryptography/Encryption
- **Required**: mandatory
- **Purpose**: Defines versioned encryption standard for secure communication in Nostr

## Summary
Standardizes encrypted communication using versioned encryption schemes, replacing NIP-04 with improved security and forward compatibility.

## Core Concepts
- **Version byte**: First byte indicates encryption scheme version
- **Base64 encoding**: Encrypted payloads encoded in base64
- **Key derivation**: Secure key derivation from shared secrets
- **AEAD encryption**: Authenticated encryption with associated data
- **Forward compatibility**: Version system allows encryption upgrades

## Version 2 Encryption (Current Standard)
**Algorithm**: ChaCha20-Poly1305 AEAD
- **Key derivation**: HKDF-SHA256 with conversation key
- **Nonce**: 12-byte random nonce
- **Padding**: PKCS#7 padding to hide message length
- **MAC**: Poly1305 authentication tag

## Payload Format
```
[version_byte][nonce][ciphertext][auth_tag]
```
- **Version byte**: `0x02` for version 2
- **Nonce**: 12 bytes random
- **Ciphertext**: ChaCha20 encrypted plaintext
- **Auth tag**: 16 bytes Poly1305 MAC

## Key Derivation
```
conversation_key = secp256k1_ecdh(private_key, public_key)
encryption_key = hkdf_expand(hkdf_extract(conversation_key, "nip44-v2"), 76)
chacha_key = encryption_key[0:32]
chacha_nonce = encryption_key[32:44]
hmac_key = encryption_key[44:76]
```

## Encryption Process
1. **Derive keys**: Generate encryption keys from ECDH shared secret
2. **Pad plaintext**: Apply PKCS#7 padding
3. **Generate nonce**: Random 12-byte nonce
4. **Encrypt**: ChaCha20 encryption with derived key
5. **Authenticate**: Poly1305 MAC over ciphertext
6. **Encode**: Base64 encode final payload

## Decryption Process
1. **Decode**: Base64 decode payload
2. **Extract components**: Version, nonce, ciphertext, auth tag
3. **Derive keys**: Same key derivation as encryption
4. **Verify MAC**: Authenticate ciphertext integrity
5. **Decrypt**: ChaCha20 decryption
6. **Unpad**: Remove PKCS#7 padding

## Padding Scheme
**PKCS#7 padding**:
- Pad to 16-byte boundaries
- Each padding byte contains padding length
- Minimum 1 byte padding, maximum 16 bytes
- Hides actual message length

## Security Improvements over NIP-04
- **AEAD**: Authenticated encryption prevents tampering
- **Better key derivation**: HKDF instead of simple SHA256
- **Length hiding**: Padding conceals message sizes
- **Forward compatibility**: Version system allows upgrades
- **Nonce handling**: Proper random nonce generation

## Implementation Example
```javascript
// Encrypt
const sharedSecret = secp256k1.getSharedSecret(privKey, pubKey);
const keys = hkdf(sharedSecret, "nip44-v2");
const nonce = randomBytes(12);
const padded = pkcs7Pad(plaintext, 16);
const ciphertext = chacha20(padded, keys.chacha, nonce);
const authTag = poly1305(ciphertext, keys.hmac);
const payload = concat([0x02, nonce, ciphertext, authTag]);
return base64Encode(payload);
```

## Use Cases
- **Direct messages**: Secure private messaging (NIP-17)
- **Private groups**: Encrypted group communications
- **Confidential data**: Any encrypted content in events
- **Key exchange**: Secure key material exchange

## Version Compatibility
- **Version 2**: Current standard (mandatory)
- **Version 1**: Deprecated, not recommended
- **Future versions**: New versions can be added as needed
- **Backward compatibility**: Clients should support multiple versions

## Error Handling
- **Invalid version**: Reject unsupported version bytes
- **MAC verification**: Reject messages with invalid authentication
- **Padding errors**: Reject messages with invalid padding
- **Decode errors**: Handle base64 decode failures gracefully

## Security Considerations
- **Nonce reuse**: Never reuse nonces with the same key
- **Side-channel attacks**: Implement constant-time comparisons
- **Key management**: Secure storage and handling of private keys
- **Metadata leakage**: Padding reduces but doesn't eliminate metadata

## Performance Considerations
- **Key caching**: Cache derived keys for repeated communications
- **Bulk operations**: Optimize for multiple message encryption
- **Memory usage**: Clear sensitive data from memory after use
- **Hardware acceleration**: Use hardware crypto when available

## Related NIPs
- NIP-04 (deprecated encryption - replaced by this)
- NIP-17 (private direct messages using NIP-44)
- NIP-01 (basic event structure)
- NIP-59 (gift wrapping using NIP-44) 