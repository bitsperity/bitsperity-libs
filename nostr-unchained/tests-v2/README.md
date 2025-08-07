# Nostr-Unchained Test Suite v2
## State-of-the-Art Protocol Testing

### Design Principles

**🎯 Protocol-First Testing**
- Every test validates real Nostr protocol behavior
- Zero mocks - only real relay interactions
- NIP compliance testing with official test vectors
- Protocol edge cases and error scenarios

**⚡ Architecture-Aligned Testing (3-Schicht)**
- Tests the **3-Schicht Clean Architecture** correctly
- **Schicht 0**: Universal Cache (subscription-based caching)
- **Schicht 1**: Core Protocol (pub/sub/query/delete)  
- **Schicht 2**: High-Level APIs (DM, Social, Profile)
- **Rule**: Schicht 2 NEVER touches Cache/Signer directly!

**👨‍💻 Developer Experience Testing**
- Tests exactly how developers use the API
- Zero-config scenarios (lazy loading, auto-initialization)
- Error handling and helpful error messages
- Complete workflows from developer perspective

**🏗️ Clean Architecture**
- Organized by architecture layer, not test type
- Each test file validates specific layer boundaries
- Shared utilities and test helpers
- Consistent naming and structure

### Test Organization (3-Schicht-Aligned)

```
tests-v2/
├── 00-infrastructure/          # Test environment validation
├── 01-cache/                   # Schicht 0: Universal Cache
│   ├── cache-indexing.test.ts
│   ├── gift-wrap-decryption.test.ts
│   └── memory-management.test.ts
├── 02-core/                    # Schicht 1: Core Protocol Layer
│   ├── pub-subscribe.test.ts   # pub/sub functionality
│   ├── query-builder.test.ts   # query functionality  
│   ├── event-deletion.test.ts  # delete functionality
│   ├── relay-management.test.ts
│   └── signing-provider.test.ts
├── 03-high-level/              # Schicht 2: High-Level APIs
│   ├── dm-module.test.ts       # DM using only Schicht 1
│   ├── social-module.test.ts   # Social using only Schicht 1
│   └── profile-module.test.ts  # Profile using only Schicht 1
├── 04-protocol-compliance/     # NIP compliance testing
│   ├── nip01-core.test.ts
│   ├── nip44-encryption.test.ts
│   ├── nip59-gift-wrap.test.ts
│   └── nip17-private-dm.test.ts
├── 05-integration/             # End-to-end workflows
├── 06-performance/             # Performance benchmarks
└── shared/                     # Test utilities and helpers
```

### Architecture Boundary Testing

#### **Schicht 0 Tests (Cache Layer)**
- Cache performance (<10ms access)
- Event ingestion and indexing
- Gift wrap decryption pipeline
- Memory management and LRU eviction
- **Rule**: Only test cache behavior, NOT API usage

#### **Schicht 1 Tests (Core Protocol)**
- pub: Event publishing to relays
- sub: Live relay subscriptions  
- query: Cache lookups with filtering
- delete: Event deletion requests
- Relay connection management
- Signing provider integration
- **Rule**: Test base layer operations

#### **Schicht 2 Tests (High-Level APIs)**
- DM: Conversations using pub/sub/query ONLY
- Social: Content/reactions using pub/sub/query ONLY  
- Profile: Profile management using pub/sub/query ONLY
- **CRITICAL RULE**: Schicht 2 modules NEVER touch cache/signer directly!

#### **Protocol Compliance Tests**
- NIP-01: Basic event structure and relay protocol
- NIP-44: Encryption with official test vectors
- NIP-59: Gift wrap protocol end-to-end
- NIP-17: Private DM complete flow
- **Rule**: Validate against official specifications

### Architecture Validation Rules

**✅ VALID Patterns:**
```typescript
// Schicht 2 using Schicht 1 (GOOD)
const result = await nostr.publish(event);  // pub
const store = nostr.query().kinds([1]);     // query  
const handle = await nostr.sub().execute(); // sub

// Schicht 1 using Schicht 0 (GOOD)
const events = cache.query(filter);         // cache access
```

**❌ FORBIDDEN Patterns:**
```typescript
// Schicht 2 bypassing Schicht 1 (BAD!)
const cache = nostr.getCache();             // NEVER!
const signer = nostr.getSigningProvider();  // NEVER!

// Direct cache manipulation from Schicht 2 (BAD!)
dmModule.cache.addEvent(event);             // VIOLATION!
```

### Test Quality Standards

**✅ Every test must:**
- Use real relay interactions (container relay)
- Test actual developer API usage patterns
- Respect architecture layer boundaries
- Have descriptive names explaining the scenario
- Include performance assertions where relevant
- Clean up resources properly
- Be deterministic and reliable

**❌ Forbidden:**
- Mock objects or fake implementations
- Layer boundary violations (Schicht 2 → Cache direct)
- Hardcoded external relay dependencies
- Flaky tests or random timeouts
- Tests that don't reflect real usage

### Running Tests

```bash
# Start container relay
npm run test:relay:start

# Test by architecture layer
npm test tests-v2/01-cache/           # Schicht 0: Universal Cache
npm test tests-v2/02-core/            # Schicht 1: Core Protocol  
npm test tests-v2/03-high-level/      # Schicht 2: High-Level APIs

# Test by functionality
npm test tests-v2/04-protocol-compliance/  # NIP compliance
npm test tests-v2/05-integration/          # End-to-end workflows
npm test tests-v2/06-performance/          # Performance benchmarks

# Run all tests with coverage
npm run test:full

# Stop container relay
npm run test:relay:stop
```

### Coverage Goals (Per Layer)

- **Schicht 0 (Cache)**: 95%+ coverage of cache operations
- **Schicht 1 (Core)**: 95%+ coverage of pub/sub/query/delete
- **Schicht 2 (High-Level)**: 90%+ coverage of developer APIs
- **Protocol Compliance**: 100% of implemented NIPs tested
- **Integration**: 85%+ coverage of complete workflows

### Architecture Validation

Each test suite validates:
1. **Correct layer usage**: Schicht 2 only uses Schicht 1
2. **No layer bypassing**: No direct cache access from high-level APIs  
3. **Clean interfaces**: Clear separation of concerns
4. **Performance contracts**: Each layer meets performance goals
5. **Error propagation**: Errors flow correctly through layers

This ensures the **3-Schicht Clean Architecture** remains intact and provides the excellent DX that nostr-unchained promises! ✨