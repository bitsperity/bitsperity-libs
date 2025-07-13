# System Architecture

## Architecture Overview
**Architecture Personality**: Adaptive Intelligence - Contextual loading system that intelligently anticipates developer needs while maintaining maximum simplicity
**Core Philosophy**: Smart system handles complexity in background while providing intuitive, reactive developer interface that feels like native Svelte
**System Boundaries**: Complete DM functionality with NIP-17 gift wrap, automatic relay management, progressive signer enhancement, and native Svelte integration

## Architectural Decisions

### Architecture Decision 1: Adaptive Intelligence Loading Strategy
**Decision**: Dynamic Import mit Tree-Shaking Optimization für kontextuelle Modul-Ladung
**Rationale**: Benutzer wählte "Adaptive Intelligence" für smart loading + Forschung bestätigte Dynamic Imports als optimal für Bundle-Größe
**Implementation**: 
- Lazy loading für Crypto-Module wenn `dm.with()` aufgerufen wird
- Eager loading für Core-Funktionalität für sofortige Verfügbarkeit
- Explicit module exports statt barrel files für optimale tree-shaking
- Module discovery basiert auf usage patterns mit intelligent preloading
**Testing Strategy**: Bundle-Größe-Monitoring in CI/CD, performance testing für module loading latency

### Architecture Decision 2: Lightweight Champion Cryptography
**Decision**: Custom minimal NIP-44 ChaCha20-Poly1305 Implementation (~4KB) mit @noble fallback
**Rationale**: Benutzer wählte "Lightweight Champion" für minimale Crypto-Overhead + Forschung bestätigte <10KB Implementationen verfügbar
**Implementation**:
- Primary: Custom ChaCha20-Poly1305 inspiriert von `cc2p.js` (pure ES3, ~4KB)
- Fallback: `@noble/ciphers` für maximum compatibility (~20KB)
- Pure JavaScript implementation für universal compatibility
- Lazy loading der Crypto-Module für optimale Bundle-Größe
**Testing Strategy**: NIP-44 compliance testing, security audit, performance benchmarks gegen @noble

### Architecture Decision 3: Native Svelte Soul Integration
**Decision**: DMConversation extends Readable<ConversationState> mit custom methods für native $-syntax
**Rationale**: Benutzer wählte "Native Svelte Soul" für perfekte Integration + Forschung bestätigte erfolgreiche Store extension patterns
**Implementation**:
- DMConversation implementiert Svelte Store Contract mit `subscribe` method
- Native `$conversation.messages` syntax durch proper store interface
- Automatic subscription cleanup bei component unmount
- Custom store derivations für computed properties
**Testing Strategy**: Svelte store contract compliance testing, memory leak detection, SSR compatibility validation

### Architecture Decision 4: Pragmatic Reliability WebSocket Management
**Decision**: `reconnecting-websocket` library als primary mit native WebSocket fallback
**Rationale**: Benutzer wählte "Pragmatic Reliability" für bewährte Tools + Forschung identifizierte `reconnecting-websocket` als best practice
**Implementation**:
- Primary: `reconnecting-websocket` library für proven reliability (~5KB)
- Fallback: Custom implementation basierend auf `graceful-ws` patterns
- Exponential backoff mit jitter für intelligent reconnection
- Connection pooling für efficiency und rate-limiting compliance
**Testing Strategy**: Network resilience testing, reconnection logic validation, performance testing mit multiple connections

### Architecture Decision 5: Smooth Operator Error Recovery
**Decision**: Automatic retry mit exponential backoff für network errors + exceptions nur für programming errors
**Rationale**: Benutzer wählte "Smooth Operator" für transparent error handling + Forschung bestätigte industry-standard patterns
**Implementation**:
- Exponential backoff mit `exponential-backoff` library patterns
- Intelligent retry conditions basierend auf error types
- Automatic relay switching bei connection issues
- Graceful degradation für offline scenarios
**Testing Strategy**: Error injection testing, recovery time measurement, user experience validation

## Component Architecture

### Core Components
**NostrUnchained Core Class**: 
- Initialization, Configuration, Resource Management
- Singleton pattern für identical configurations
- Builder pattern für fluent configuration
- Automatic cleanup hooks für memory management

**DM Module**: 
- NIP-17 Gift Wrap Implementation
- Conversation key derivation mit perfect forward secrecy
- Real-time message ordering und deduplication
- Svelte Store interface für reactive updates

**Relay Manager**: 
- NIP-65 Outbox Model implementation
- Intelligent relay selection und health monitoring
- Connection pooling für efficiency
- Automatic failover chains für >90% delivery

**Crypto Module**: 
- Custom NIP-44 ChaCha20-Poly1305 implementation
- Secure key derivation und conversation keys
- Lazy loading für optimal bundle size
- Fallback zu @noble/ciphers für compatibility

**Store Manager**: 
- Svelte Store integration patterns
- Reactive state management
- Cross-tab synchronization via BroadcastChannel
- Memory-bounded message history mit LRU eviction

**Signer Manager**: 
- NIP-07 Extension detection und integration
- Automatic fallback zu temporary keys
- Progressive enhancement flows
- Secure key generation für temporary keys

### Component Interactions
**Initialization Flow**: NostrUnchained → Signer Detection → Relay Discovery → Store Setup
**Message Sending**: User Input → Crypto Module → Relay Manager → Status Updates
**Message Reception**: WebSocket Events → Gift Wrap Validation → Store Updates → UI Reactivity
**Error Recovery**: Error Detection → Retry Logic → Relay Switching → User Notification

### Data Flow Patterns
**Reactive Updates**: WebSocket → Store → Svelte Components via $-syntax
**Configuration Flow**: User Config → Runtime Updates → Module Configuration
**Error Propagation**: Module Errors → Recovery Logic → User-facing Messages
**State Synchronization**: Store Updates → Cross-tab Sync → UI Consistency

### State Management
**Conversation State**: Messages, Status, Connection Health in reactive stores
**Configuration State**: Hierarchical config (Global → Module → Operation)
**Signer State**: Current signer type, upgrade availability, key status
**Relay State**: Connection status, health metrics, outbox relays

## Integration Architecture

### Framework Integration
**SvelteKit SSR Compatibility**: 
- No window dependencies für server-side rendering
- Conditional imports basierend auf `browser` environment
- Graceful degradation ohne client-side JavaScript
- Progressive enhancement patterns

**Svelte Store Integration**: 
- Native store contract implementation
- Automatic subscription cleanup
- Custom derivations für computed properties
- Memory-safe reactive patterns

### Build Tool Integration
**Vite Optimization**: 
- Tree-shaking friendly exports
- Dynamic import support für code splitting
- Modern ES2020+ target für optimal performance
- Compatible mit Rollup und Webpack

**TypeScript Integration**: 
- Complete type safety ohne any-types
- Generic type parameters für extensible APIs
- Compile-time validation für API misuse
- Strong inference für fluent interfaces

### IDE Integration
**Developer Tooling**: 
- Intellisense support für all major IDEs
- Auto-completion für available methods
- Type-aware error detection
- Debug-friendly store state inspection

### Package Ecosystem
**NPM Distribution**: 
- Modular exports für optimal tree-shaking
- Peer dependencies für Svelte integration
- Semantic versioning für breaking changes
- TypeScript declarations included

## Performance Architecture

### Performance Strategy
**Bundle Size Optimization**: 
- Lazy loading für non-essential modules
- Tree-shaking optimization durch explicit exports
- Custom crypto implementation für minimal overhead
- Dynamic imports für conditional functionality

**Runtime Performance**: 
- Connection pooling für efficient resource usage
- Message batching für high-volume scenarios
- Intelligent caching mit memory bounds
- Reactive updates optimization

### Optimization Points
**Initialization Speed**: <200ms für zero-config setup
**Message Latency**: <500ms für send operations
**Store Updates**: <100ms für UI reactivity
**Memory Usage**: <10MB für active conversation

### Performance Monitoring
**Metrics Collection**: 
- Bundle size monitoring in CI/CD
- Connection time measurement
- Memory usage tracking
- Message delivery success rates

### Scalability Considerations
**Multi-Conversation Support**: 
- Efficient resource sharing between conversations
- Connection pooling für multiple endpoints
- Memory management für conversation history
- Performance degradation prevention

## Security Architecture

### Security Boundaries
**Cryptographic Security**: 
- NIP-44 compliant encryption für message privacy
- Secure key derivation für conversation keys
- Perfect forward secrecy für message history
- Metadata protection durch gift wrap architecture

**Key Management Security**: 
- Temporary keys mit cryptographically secure randomness
- Browser secure storage für key persistence
- Extension integration ohne private key exposure
- Clear warnings für security implications

### Input Validation
**Message Validation**: 
- Content length limits (<10KB per message)
- npub format validation mit clear error messages
- Relay URL validation für security
- Event signature validation

### Error Information
**Information Disclosure**: 
- No sensitive information in error messages
- Debug mode für development-only detailed logging
- User-facing errors focus on recovery actions
- Security warnings für temporary key usage

### Dependency Security
**Supply Chain Security**: 
- Minimal runtime dependencies
- Regular security audits für crypto implementation
- Dependency vulnerability scanning
- Trusted source validation

## Evolution Strategy

### Extension Points
**Plugin Architecture**: 
- Additional NIPs durch lazy-loaded modules
- Custom relay strategies durch plugin system
- Alternative crypto libraries durch fallback pattern
- Enhanced debugging durch development-only modules

**API Extensions**: 
- Builder pattern allows für future configuration options
- Store contract enables custom derivations
- Event system allows für custom handlers
- Module boundaries enable feature addition

### Backward Compatibility
**Versioning Strategy**: 
- Semantic versioning für API changes
- Deprecation warnings für outdated patterns
- Migration guides für breaking changes
- Support timeline für deprecated features

### Migration Strategies
**Library Migration**: 
- Compatibility layer für common patterns
- Migration utilities für existing applications
- Progressive migration paths
- Documentation für migration scenarios

### Deprecation Approach
**Feature Lifecycle**: 
- Clear deprecation timeline (6 months minimum)
- Alternative recommendations für deprecated features
- Automated migration tools where possible
- Community feedback integration für deprecation decisions 