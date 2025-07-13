# Module Boundaries

## Module Design Philosophy
**Separation Strategy**: Funktionale Trennung mit klaren Verantwortlichkeiten und minimaler Kopplung
**Coupling Approach**: Loose coupling durch well-defined interfaces, tight cohesion innerhalb modules
**Cohesion Strategy**: Related functionality grouped by domain (DM, Relay, Crypto, Store, Signer)
**Lazy Loading**: Modules load contextually basierend auf usage patterns (Adaptive Intelligence)

## Core Module Structure

### NostrUnchained Core Module
**Responsibility**: 
- Library initialization und configuration management
- Builder pattern implementation für fluent API
- Resource lifecycle management (creation, cleanup)
- Module coordination und dependency injection
- Event bus für cross-module communication

**Public Interface**: 
```typescript
export class NostrUnchained {
  constructor(config?: NostrConfig);
  static withRelays(relays: string[]): NostrBuilder;
  static timeout(ms: number): NostrBuilder;
  static debug(enabled: boolean): NostrBuilder;
  readonly dm: DMModule;
  readonly signer: SignerManager;
  readonly relay: RelayManager;
  configure(updates: Partial<NostrConfig>): void;
  destroy(): Promise<void>;
}
```

**Internal Implementation**: 
- Configuration validation und smart defaults
- Module lazy loading coordination
- Resource cleanup scheduling
- Error aggregation und reporting
- Performance monitoring integration

**Dependencies**: 
- Config validation utilities
- Event emitter for cross-module communication
- Resource cleanup hooks
- Debug logging infrastructure

### DMModule - Direct Message Management
**Responsibility**: 
- NIP-17 Gift Wrap implementation för DM privacy
- Conversation state management mit reactive stores
- Message sending/receiving orchestration
- Conversation key derivation and management
- Real-time message ordering and deduplication

**Public Interface**: 
```typescript
export interface DMModule {
  with(pubkey: string): DMConversation;
  active(): DMConversation[];
  cleanup(): void;
}

export interface DMConversation extends Readable<ConversationState> {
  send(content: string): Promise<SendResult>;
  readonly messages: Event[];
  readonly status: ConnectionStatus;
  readonly latest: Event | null;
  close(): void;
}
```

**Internal Implementation**: 
- NIP-17 rumor → seal → gift wrap pipeline
- Conversation key derivation with perfect forward secrecy
- Message validation and sanitization
- Store state management and reactivity
- Background message polling and processing

**Dependencies**: 
- Crypto module (lazy loaded) für encryption/decryption
- Relay module för publishing/subscribing
- Store module för reactive state management
- Signer module för event signing

### Crypto Module - Cryptographic Operations
**Responsibility**: 
- NIP-44 ChaCha20-Poly1305 implementation
- Conversation key derivation and management
- Secure random number generation
- Message encryption/decryption operations
- Cryptographic validation and compliance

**Public Interface**: 
```typescript
export interface CryptoModule {
  encrypt(message: string, conversationKey: Uint8Array): Promise<string>;
  decrypt(payload: string, conversationKey: Uint8Array): Promise<string>;
  deriveConversationKey(senderPrivkey: string, recipientPubkey: string): Uint8Array;
  generateRandomKey(): Uint8Array;
  validateNIP44Compliance(payload: string): boolean;
}
```

**Internal Implementation**: 
- Custom ChaCha20-Poly1305 implementation (~4KB)
- Fallback to @noble/ciphers for maximum compatibility
- Secure key derivation using ECDH
- Message padding and formatting
- Performance-optimized JavaScript implementation

**Dependencies**: 
- @noble/secp256k1 für elliptic curve operations
- @noble/ciphers (fallback) für crypto operations
- Browser/Node.js crypto APIs für secure randomness
- NIP-44 compliance validation

### Relay Module - Network Communication
**Responsibility**: 
- WebSocket connection management mit automatic reconnection
- NIP-65 Outbox Model implementation
- Relay health monitoring and selection
- Message publishing mit delivery confirmation
- Subscription management för incoming messages

**Public Interface**: 
```typescript
export interface RelayManager {
  connect(relays?: string[]): Promise<ConnectionResult>;
  publish(event: Event): Promise<PublishResult>;
  subscribe(filter: Filter, handler: (event: Event) => void): Subscription;
  getConnectedRelays(): string[];
  getHealthStatus(): RelayHealth[];
}
```

**Internal Implementation**: 
- Connection pooling för efficient resource usage
- Exponential backoff reconnection logic
- Relay discovery through NIP-65 metadata
- Load balancing and failover strategies
- Rate limiting detection and handling

**Dependencies**: 
- reconnecting-websocket library för reliability
- exponential-backoff patterns för retry logic
- WebSocket APIs (browser/Node.js)
- JSON-RPC över WebSocket protocol

### Store Module - State Management
**Responsibility**: 
- Svelte store contract implementation
- Reactive state management för conversations
- Cross-tab synchronization
- Memory-bounded message history
- Automatic subscription cleanup

**Public Interface**: 
```typescript
export interface StoreManager {
  createConversationStore(pubkey: string): ConversationStore;
  syncAcrossTabs(enabled: boolean): void;
  cleanup(): void;
}

export interface ConversationStore extends Readable<ConversationState> {
  updateMessages(messages: Event[]): void;
  setStatus(status: ConnectionStatus): void;
  markAsRead(): void;
}
```

**Internal Implementation**: 
- Svelte store contract compliance
- BroadcastChannel för cross-tab sync
- LRU cache för message history management
- Debounced updates för performance
- Memory leak prevention

**Dependencies**: 
- Svelte store interface (Readable contract)
- BroadcastChannel API för cross-tab communication
- LRU cache implementation
- Debouncing utilities

### Signer Module - Key Management
**Responsibility**: 
- NIP-07 browser extension integration
- Temporary key generation and management
- Progressive enhancement flows
- Secure key storage and operations
- Signer abstraction layer

**Public Interface**: 
```typescript
export interface SignerManager {
  status(): SignerStatus;
  getPublicKey(): string;
  signEvent(event: UnsignedEvent): Promise<Event>;
  upgrade(): Promise<UpgradeResult>;
  canSign(): boolean;
}
```

**Internal Implementation**: 
- Extension detection (window.nostr)
- Temporary key generation with BIP-39
- Secure storage using browser APIs
- Extension permission handling
- Key operation abstractiona

**Dependencies**: 
- Browser extension APIs (window.nostr)
- BIP-39 key derivation
- Browser secure storage (IndexedDB)
- Crypto utilities für key generation

## Module Interactions

### Communication Patterns
**Event-Driven Architecture**: 
- Modules communicate through event emitters
- Loose coupling through well-defined events
- Async communication för non-blocking operations
- Error propagation through event channels

**Dependency Injection**: 
- Core module coordinates dependencies
- Lazy loading through dynamic imports
- Interface-based abstractions
- Testable mocking points

### Data Sharing
**Immutable State**: 
- Shared state through immutable objects
- Store updates through defined mutations
- No direct state modification between modules
- Reactive updates through store subscriptions

**Message Passing**: 
- Events pass through message queues
- Serializable data structures
- No shared mutable state
- Clean separation of concerns

### Event Flow
**Message Sending Flow**: 
```
DMModule → SignerModule → CryptoModule → RelayModule → StoreModule
```

**Message Receiving Flow**: 
```
RelayModule → CryptoModule → DMModule → StoreModule → UI Updates
```

**Error Propagation**: 
```
Any Module → Core Module → Error Handler → User Notification
```

### Error Propagation
**Error Boundaries**: 
- Each module handles internal errors
- Cross-module errors propagate through event system
- Recovery strategies implemented per module
- User-facing error messages generated at boundaries

**Recovery Mechanisms**: 
- Automatic retry with exponential backoff
- Fallback strategies (custom crypto → @noble)
- Graceful degradation (extension → temporary keys)
- User-guided recovery flows

## Extension Boundaries

### Plugin Points
**Module Extension**: 
- Additional NIPs through lazy-loaded modules
- Custom crypto implementations through interface
- Alternative relay strategies through plugin system
- Enhanced debugging through development modules

**Configuration Extension**: 
- Plugin registration through core module
- Configuration merging with validation
- Runtime plugin loading
- Plugin lifecycle management

### Configuration Boundaries
**Module Configuration**: 
```typescript
interface ModuleConfig {
  crypto: CryptoConfig;
  relay: RelayConfig;
  store: StoreConfig;
  signer: SignerConfig;
}
```

**Independent Configuration**: 
- Each module handles its own configuration
- Validation at module boundaries
- Default configuration merging
- Runtime configuration updates

### Testing Boundaries
**Module Isolation**: 
- Each module testable in isolation
- Mock implementations für dependencies
- Interface-based testing contracts
- Independent test suites

**Integration Testing**: 
- Cross-module interaction testing
- End-to-end workflow validation
- Performance testing at boundaries
- Error scenario testing

## Package Structure

### File Organization
```
src/
├── core/
│   ├── NostrUnchained.ts     # Main class
│   ├── Builder.ts            # Fluent builder
│   ├── Config.ts             # Configuration management
│   └── EventBus.ts           # Cross-module communication
├── dm/
│   ├── DMModule.ts           # DM interface
│   ├── Conversation.ts       # Conversation implementation
│   ├── GiftWrap.ts           # NIP-17 implementation
│   └── MessageProcessor.ts   # Message handling
├── crypto/
│   ├── CryptoModule.ts       # Crypto interface
│   ├── ChaCha20Poly1305.ts   # Custom implementation
│   ├── KeyDerivation.ts      # Key management
│   └── Fallback.ts           # @noble fallback
├── relay/
│   ├── RelayManager.ts       # Relay interface
│   ├── Connection.ts         # WebSocket management
│   ├── Health.ts             # Health monitoring
│   └── Outbox.ts             # NIP-65 implementation
├── store/
│   ├── StoreManager.ts       # Store interface
│   ├── ConversationStore.ts  # Conversation state
│   ├── CrossTab.ts           # Cross-tab sync
│   └── History.ts            # Message history
├── signer/
│   ├── SignerManager.ts      # Signer interface
│   ├── Extension.ts          # NIP-07 integration
│   ├── Temporary.ts          # Temporary keys
│   └── Upgrade.ts            # Progressive enhancement
└── types/
    ├── Events.ts             # Nostr event types
    ├── Config.ts             # Configuration types
    └── Errors.ts             # Error types
```

### Export Structure
```typescript
// Main entry point
export { NostrUnchained } from './core/NostrUnchained';
export type { NostrConfig } from './core/Config';

// Type exports
export type { 
  DMModule, 
  DMConversation, 
  ConversationState 
} from './dm/DMModule';

export type { 
  SendResult, 
  NostrError, 
  SignerStatus 
} from './types';

// Crypto module (lazy loaded)
export { CryptoModule } from './crypto/CryptoModule';
```

### Module Boundaries Enforcement
**Import Restrictions**: 
- Modules can only import from their dependencies
- No circular dependencies between modules
- Explicit interface definitions für cross-module communication
- Compile-time boundary checking

**Runtime Boundaries**: 
- Module instances managed by core module
- Resource cleanup enforced at boundaries
- Performance monitoring at module interfaces
- Error handling at boundary crossings

## Quality Assurance

### Boundary Testing
**Interface Contracts**: 
- All public interfaces have comprehensive tests
- Type safety verification für all boundaries
- Error handling validation at module edges
- Performance testing för module interactions

**Integration Testing**: 
- Cross-module workflow testing
- Boundary error condition testing
- Resource cleanup verification
- Memory leak detection

### Performance Monitoring
**Module Performance**: 
- Initialization time per module
- Memory usage per module
- API call latency measurement
- Resource usage tracking

**Boundary Performance**: 
- Cross-module communication overhead
- Data serialization costs
- Event propagation latency
- Module loading time

### Security Boundaries
**Data Isolation**: 
- Sensitive data contained within crypto module
- No plaintext key exposure across boundaries
- Secure data passing through interfaces
- Memory clearing at sensitive boundaries

**Permission Boundaries**: 
- Extension permissions handled only in signer module
- Network permissions isolated to relay module
- Storage permissions managed by store module
- Clear security responsibility separation

## Evolution Strategy

### Module Evolution
**Version Compatibility**: 
- Backward compatible interfaces
- Deprecation warnings för interface changes
- Migration paths för breaking changes
- Module-level versioning

**Feature Addition**: 
- New features through module extension
- Plugin system för community features
- Interface evolution through extension
- Backward compatibility preservation

### Boundary Evolution
**Interface Stability**: 
- Stable public interfaces within major versions
- Internal implementation flexibility
- Extension points för future features
- Migration tools för boundary changes

**Performance Evolution**: 
- Optimization opportunities at boundaries
- Caching strategies across modules
- Data structure evolution
- Protocol efficiency improvements 