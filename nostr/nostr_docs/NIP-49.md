# NIP-49: Private Key Encryption

## Meta
- **Status**: draft optional
- **Category**: Cryptography/Key Management
- **Required**: optional
- **Purpose**: Defines standard format for encrypting private keys with passwords

## Summary
Standardizes password-based encryption of Nostr private keys for secure storage and portability across clients.

## Core Concepts
- **Password encryption**: Encrypt private keys with user passwords
- **Standard format**: Consistent encrypted key format across clients
- **Key derivation**: Secure password-to-key derivation
- **Portability**: Encrypted keys work across different Nostr clients
- **ncryptsec format**: Special bech32 encoding for encrypted keys

## Encrypted Key Format
**ncryptsec encoding**:
```
ncryptsec1<bech32-encoded-encrypted-data>
```
- **ncryptsec prefix**: Identifies encrypted private key
- **bech32 encoding**: Standard bech32 encoding of encrypted payload
- **Version byte**: Indicates encryption scheme version

## Encryption Algorithm (Version 0x02)
**Encryption process**:
1. **Salt generation**: Random 16-byte salt
2. **Key derivation**: scrypt(password, salt, N=2^20, r=8, p=1, dkLen=32)
3. **Encryption**: AES-256-CBC with PKCS#7 padding
4. **Authentication**: HMAC-SHA256 for integrity
5. **Encoding**: bech32 encode result as ncryptsec

## Encrypted Payload Structure
```
[version_byte][salt][encrypted_private_key][hmac]
```
- **version_byte**: `0x02` for current version
- **salt**: 16 bytes random salt for key derivation
- **encrypted_private_key**: 32 bytes AES-256-CBC encrypted
- **hmac**: 32 bytes HMAC-SHA256 authentication tag

## Encryption Process
```javascript
// Derive key from password
const salt = randomBytes(16);
const derivedKey = scrypt(password, salt, {N: 2^20, r: 8, p: 1, dkLen: 64});
const encryptionKey = derivedKey.slice(0, 32);
const hmacKey = derivedKey.slice(32, 64);

// Encrypt private key
const iv = randomBytes(16);
const cipher = createCipher('aes-256-cbc', encryptionKey, iv);
const encrypted = cipher.update(privateKey) + cipher.final();

// Create authentication tag
const hmac = hmac_sha256(hmacKey, version + salt + encrypted);

// Encode as ncryptsec
const payload = concat([version, salt, encrypted, hmac]);
const ncryptsec = bech32Encode('ncryptsec', payload);
```

## Decryption Process
```javascript
// Decode ncryptsec
const decoded = bech32Decode(ncryptsec);
const [version, salt, encrypted, hmac] = parsePayload(decoded);

// Derive key from password
const derivedKey = scrypt(password, salt, {N: 2^20, r: 8, p: 1, dkLen: 64});
const encryptionKey = derivedKey.slice(0, 32);
const hmacKey = derivedKey.slice(32, 64);

// Verify authentication
const expectedHmac = hmac_sha256(hmacKey, version + salt + encrypted);
if (!constantTimeCompare(hmac, expectedHmac)) throw new Error('Invalid password');

// Decrypt private key
const decipher = createDecipher('aes-256-cbc', encryptionKey);
const privateKey = decipher.update(encrypted) + decipher.final();
```

## Key Derivation Parameters
**scrypt parameters**:
- **N**: 2^20 (1,048,576) - CPU/memory cost
- **r**: 8 - block size
- **p**: 1 - parallelization
- **dkLen**: 64 - derived key length (32 encryption + 32 HMAC)

## Use Cases
- **Client backup**: Backup encrypted keys for recovery
- **Key portability**: Transfer encrypted keys between clients
- **Secure storage**: Store keys encrypted on disk
- **Cloud backup**: Backup encrypted keys to cloud services
- **Multi-device sync**: Sync encrypted keys across devices

## Client Implementation
**Key import/export**:
- **Export**: Allow users to export encrypted private keys
- **Import**: Support importing ncryptsec keys with password
- **Password prompts**: Secure password input interfaces
- **Error handling**: Handle wrong password gracefully

## Security Considerations
- **Password strength**: Encourage strong passwords
- **Brute force resistance**: High scrypt cost parameters
- **Side-channel attacks**: Protect against timing attacks
- **Memory security**: Clear sensitive data from memory
- **Key derivation**: Use proper scrypt implementation

## Password Guidelines
**Recommended password practices**:
- **Minimum length**: At least 12 characters
- **Complexity**: Mix of letters, numbers, symbols
- **Uniqueness**: Don't reuse passwords from other services
- **Password managers**: Recommend password manager usage
- **Recovery planning**: Plan for password recovery/loss

## Compatibility
- **Version support**: Clients should support current version
- **Future versions**: New versions may use different algorithms
- **Backward compatibility**: Maintain support for older versions
- **Error handling**: Graceful handling of unsupported versions

## Implementation Notes
- **Constant-time comparison**: Use for HMAC verification
- **Secure random**: Use cryptographically secure random for salt/IV
- **Memory clearing**: Clear passwords and keys from memory
- **Progress indication**: Show progress for slow key derivation

## Related NIPs
- NIP-01 (private key format and usage)
- NIP-06 (mnemonic seed phrases - alternative approach)
- NIP-19 (nsec encoding for unencrypted keys) 