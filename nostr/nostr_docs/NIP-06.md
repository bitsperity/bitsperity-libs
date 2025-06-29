# NIP-06: Key Derivation from Mnemonic

## Meta
- **Status**: draft optional  
- **Category**: Cryptography
- **Required**: optional
- **Purpose**: Standardizes hierarchical key derivation from BIP39 mnemonic phrases

## Summary
Defines how to generate Nostr keypairs from BIP39 mnemonic seed phrases using BIP32 hierarchical deterministic derivation.

## Core Concepts
- **BIP39**: Mnemonic seed phrase generation and binary seed derivation
- **BIP32**: Hierarchical deterministic key derivation
- **Derivation Path**: `m/44'/1237'/<account>'/0/0` (Nostr-specific path)
- **SLIP44**: Nostr registered as coin type 1237

## Derivation Process
1. Generate BIP39 mnemonic (12-24 words)
2. Create binary seed from mnemonic
3. Use BIP32 HD derivation with path: `m/44'/1237'/<account>'/0/0`
4. Extract private key from derived node
5. Generate corresponding public key

## Path Components
- **44'**: BIP44 purpose (hardened)
- **1237'**: Nostr coin type from SLIP44 (hardened)  
- **account'**: Account index (hardened, typically 0)
- **0**: Change (external addresses)
- **0**: Address index

## Implementation Notes
- **Basic clients**: Use account=0 for single key
- **Advanced clients**: Increment account for multiple keys
- **Infinite keys**: Practically unlimited key generation
- **Custom paths**: Other derivation paths allowed for special purposes

## Test Vectors
**Mnemonic 1**: "leader monkey parrot ring guide accident before fence cannon height naive bean"
- Private key: `7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a`
- Public key: `17162c921dc4d2518f9a101db33695df1afb56ab82f5ff3e5da6eec3ca5cd917`

**Mnemonic 2**: "what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade"
- Private key: `c15d739894c81a2fcfd3a2df85a0d2c0dbc47a280d092799f144d73d7ae78add`
- Public key: `d41b22899549e1f3d335a31002cfd382174006e166d3e658e3a5eecdb6463573`

## Use Cases  
- **Wallet Recovery**: Restore keys from mnemonic backup
- **Multi-device**: Same keys across multiple devices
- **Key Management**: Hierarchical organization of multiple identities
- **Cold Storage**: Offline key generation and backup

## Related NIPs
- NIP-01 (basic keypair usage)
- NIP-19 (key encoding formats) 