# NIP-13: Proof of Work

## Meta
- **Status**: draft optional
- **Category**: Spam Prevention
- **Required**: optional
- **Purpose**: Defines proof-of-work system for Nostr events to deter spam

## Summary
Implements computational proof-of-work for events using leading zero bits in event IDs as spam deterrent.

## Core Concepts
- **Difficulty**: Number of leading zero bits in event ID (SHA256 hash)
- **Mining**: Incrementing nonce until desired difficulty achieved
- **Nonce tag**: `["nonce", "<value>", "<target-difficulty>"]`
- **Spam deterrence**: Computational cost makes bulk spam expensive

## Mining Process
1. Create base event with nonce tag: `["nonce", "0", "<target>"]`
2. Increment nonce value
3. Recalculate event ID (SHA256 of serialized event)
4. Check leading zero bits in ID
5. Repeat until target difficulty reached
6. Optionally update created_at during mining

## Difficulty Calculation
- **Binary representation**: Count leading zero bits in hex ID
- **Example**: `000000...` = 24 leading zeros, `0002f...` = 10 leading zeros
- **Hex digits**: Remember 0-7 have leading zeros in binary representation

## Nonce Tag Format
- **Second element**: Nonce value (incremented during mining)
- **Third element**: Target difficulty commitment
- **Target commitment**: Prevents lucky low-difficulty miners from claiming higher difficulty

## Validation
**C code example:**
```c
int count_leading_zero_bits(unsigned char *hash) {
    int bits, total, i;
    for (i = 0, total = 0; i < 32; i++) {
        bits = zero_bits(hash[i]);
        total += bits;
        if (bits != 8) break;
    }
    return total;
}
```

**JavaScript:**
```javascript
function countLeadingZeroes(hex) {
    let count = 0;
    for (let i = 0; i < hex.length; i++) {
        const nibble = parseInt(hex[i], 16);
        if (nibble === 0) {
            count += 4;
        } else {
            count += Math.clz32(nibble) - 28;
            break;
        }
    }
    return count;
}
```

## Delegated Mining
- **Outsourcing**: Can use third-party mining services
- **No signature commitment**: Event ID doesn't include signature
- **Mobile-friendly**: Addresses energy constraints of mobile devices
- **Fee-based**: Mining services may charge for difficulty levels

## Use Cases
- **Spam prevention**: Makes bulk posting computationally expensive
- **Quality filtering**: Higher difficulty signals higher commitment
- **Relay requirements**: Relays can require minimum difficulty
- **Economic incentives**: Creates cost for event publication

## Implementation Notes
- **Target commitment**: Recommended to prevent difficulty spoofing
- **Client rejection**: Can reject events without proper difficulty commitment
- **Update created_at**: Recommended during mining for fresher timestamps

## Related NIPs
- NIP-01 (basic event structure)
- NIP-11 (relay requirements via min_pow_difficulty) 