# Implementation Plan: Milestone 1 - Basic Publishing

## Current Status: RED Phase (Tests Failing as Expected)

**Test Results**: 19 failed, 22 passed
- ✅ **Architecture & Types**: All structural tests pass
- ❌ **Publishing Logic**: WebSocket/crypto implementation needed
- ❌ **Local Relay**: `ws://umbrel.local:4848` connectivity needed

## Phase-by-Phase Implementation Plan

### Phase 3.1: Real Cryptography (nostr-tools Integration)
**Target**: Fix signing and event ID calculation

#### Critical Failing Tests:
```bash
# These tests currently timeout due to mock crypto
- should publish simple text in under 2 minutes
- should work with minimal developer effort  
- should fallback gracefully without extension
```

#### Implementation Tasks:
1. **Replace mock crypto with nostr-tools**:
   - `schnorr.sign()` for real signatures
   - `getPublicKey()` for key derivation
   - `sha256()` for event ID calculation

2. **Update SigningProvider implementations**:
   - ExtensionSigner: Use real NIP-07 interface
   - TemporarySigner: Use nostr-tools key generation

#### Success Criteria:
- Event IDs are properly calculated (64-char hex)
- Signatures are valid Schnorr signatures (128-char hex)
- Browser extension integration works

### Phase 3.2: WebSocket Implementation (Real Relay Connections)
**Target**: Make relay connections actually work

#### Critical Failing Tests:
```bash
# These tests fail because WebSocket is not available in Node.js
- should connect to and publish to umbrel.local:4848
- should handle multiple relay scenarios
- should establish relay connections quickly
```

#### Implementation Tasks:
1. **Add WebSocket polyfill for Node.js**:
   - Install `ws` package for Node.js WebSocket support
   - Add browser/Node.js compatibility layer

2. **Fix RelayManager WebSocket handling**:
   - Proper connection lifecycle management
   - Message parsing and protocol compliance
   - Timeout and retry logic

#### Success Criteria:
- Can connect to `ws://umbrel.local:4848`
- WebSocket message protocol works (EVENT, OK, NOTICE)
- Connection timeouts work properly

### Phase 3.3: Local Relay Integration
**Target**: Ensure umbrel.local:4848 connectivity

#### Critical Failing Tests:
```bash
- should work with umbrel.local:4848
- should include local relay in default configuration  
```

#### Implementation Tasks:
1. **Test local relay connectivity**:
   - Verify `ws://umbrel.local:4848` is accessible
   - Test relay capabilities (NIP-11 info document)
   - Handle connection failures gracefully

2. **Optimize for local development**:
   - Faster connection timeouts for local relays
   - Better error messages for local relay issues
   - Fallback to public relays if local fails

#### Success Criteria:
- Local relay in default configuration
- Fast connection to local relay (< 2 seconds)
- Graceful fallback when local relay unavailable

### Phase 3.4: Performance Optimization
**Target**: Meet < 2 minutes to first post requirement

#### Critical Failing Tests:
```bash
- should publish simple text in under 2 minutes
- should publish events efficiently
- should meet performance requirements under load
```

#### Implementation Tasks:
1. **Connection pooling optimization**:
   - Parallel relay connections
   - Connection caching and reuse
   - Intelligent timeout management

2. **Publishing pipeline optimization**:
   - Batch signing operations
   - Parallel relay publishing
   - Early success detection

#### Success Criteria:
- First publish completes in < 30 seconds
- Subsequent publishes complete in < 5 seconds
- Handles 10+ concurrent publishes efficiently

## Implementation Priority Order

### Sprint 1: Core Functionality (1-2 hours)
1. ✅ **nostr-tools Integration** (highest priority)
   - Real cryptography fixes most test failures
   - Unblocks all other functionality

2. ✅ **WebSocket Polyfill** (blocking)
   - Required for any relay communication
   - Enables local relay testing

### Sprint 2: Connectivity (30 minutes)
3. ✅ **Local Relay Testing** (validation)
   - Test against real `ws://umbrel.local:4848`
   - Validate end-to-end flow

### Sprint 3: Polish (30 minutes)
4. ✅ **Performance Tuning** (optimization)
   - Meet timing requirements
   - Improve user experience

## Risk Mitigation

### Technical Risks:
1. **Local relay unavailable**: Graceful fallback to public relays
2. **WebSocket compatibility**: Test in both browser and Node.js
3. **Crypto performance**: Use optimized nostr-tools functions

### Testing Strategy:
1. **Unit tests first**: Fix crypto and basic functionality
2. **Integration tests**: Test with real relay
3. **E2E tests**: Full workflow validation

## Success Definition

**Phase Gate 3 Complete When:**
- ✅ All 41 acceptance tests pass
- ✅ Can publish to `ws://umbrel.local:4848` 
- ✅ Publishing completes in < 2 minutes (target: < 30 seconds)
- ✅ Works with and without browser extension
- ✅ Graceful error handling and recovery

**Ready for Milestone 1 Demo:**
```typescript
// This code MUST work:
const nostr = new NostrUnchained();
const result = await nostr.publish("Hello Nostr!");
console.log('Success:', result.success);
console.log('Event ID:', result.eventId);
```

## Next Steps

1. **Install crypto dependencies**
2. **Replace mock implementations with real crypto**
3. **Add WebSocket support for Node.js**
4. **Test against local relay**
5. **Run full test suite → GREEN**