# API Contracts

## API Design Philosophy
**Design Approach**: Adaptive Intelligence - Contextual loading mit intelligent defaults die "just work"
**Error Handling Style**: Smooth Operator - Automatic recovery mit exceptions nur für programming errors
**TypeScript Integration**: Type-first approach mit complete type safety ohne any-types
**Svelte Integration**: Native Svelte Soul - Perfect integration mit store patterns und $-syntax

## Core API Structure

### Public Interface
**NostrUnchained Class**: Central access point für all functionality
**DMModule Interface**: Conversation management mit reactive stores
**Builder Pattern**: Fluent configuration für progressive enhancement
**Store Contract**: Native Svelte store integration für reactive UIs

### Type Definitions
```typescript
// Core Configuration Types
interface NostrConfig {
  relays?: string[];
  timeout?: number;
  debug?: boolean;
  signer?: SignerConfig;
}

// Conversation State Types
interface ConversationState {
  messages: Event[];
  status: 'connecting' | 'ready' | 'error' | 'reconnecting';
  latest: Event | null;
  unreadCount: number;
}

// Result Types
interface SendResult {
  success: boolean;
  eventId?: string;
  error?: string;
  timestamp: number;
}

// Error Types
interface NostrError {
  code: 'NETWORK' | 'AUTH' | 'VALIDATION' | 'RELAY' | 'TIMEOUT';
  message: string;
  recoverable: boolean;
  suggestions: string[];
}

// Signer Types
interface SignerStatus {
  type: 'temporary' | 'extension' | 'custom';
  pubkey: string;
  canUpgrade: boolean;
  securityLevel: 'low' | 'medium' | 'high';
}
```

### Configuration API
```typescript
// Zero-Config Constructor
constructor(config?: NostrConfig);

// Fluent Builder Pattern
static withRelays(relays: string[]): NostrBuilder;
static timeout(ms: number): NostrBuilder;
static debug(enabled: boolean): NostrBuilder;
static create(): NostrUnchained;

// Runtime Configuration
configure(updates: Partial<NostrConfig>): void;
getConfiguration(): NostrConfig;
```

### Event API
```typescript
// Event listeners für advanced users
on(event: 'connectionChange', handler: (status: ConnectionStatus) => void): void;
on(event: 'messageReceived', handler: (event: Event) => void): void;
on(event: 'error', handler: (error: NostrError) => void): void;
off(event: string, handler: Function): void;
```

## API Contracts

### NostrUnchained Core API
```typescript
class NostrUnchained {
  constructor(config?: NostrConfig);
  
  // Static Builder Methods
  static withRelays(relays: string[]): NostrBuilder;
  static timeout(ms: number): NostrBuilder;
  static debug(enabled: boolean): NostrBuilder;
  
  // Main Access Points
  readonly dm: DMModule;
  readonly signer: SignerManager;
  readonly relay: RelayManager;
  
  // Configuration
  configure(updates: Partial<NostrConfig>): void;
  getConfiguration(): NostrConfig;
  
  // Resource Management
  destroy(): Promise<void>;
}
```

**Contract**: 
- Initialisiert sich in <200ms mit smart defaults
- Funktioniert sofort ohne Konfiguration
- Automatische Ressourcenbereinigung bei destroy()
- Memory-safe mit automatic cleanup hooks

**Usage Pattern**: 
```typescript
// Zero-Config Usage
const nostr = new NostrUnchained();
const conversation = nostr.dm.with('npub1234...');

// Builder Pattern Usage
const nostr = NostrUnchained
  .withRelays(['wss://relay.damus.io'])
  .timeout(8000)
  .debug(true)
  .create();
```

**Error Conditions**: 
- Network timeouts during initialization (automatic retry)
- Invalid configuration parameters (immediate validation error)
- Resource exhaustion (graceful degradation)

**Performance Characteristics**: 
- Initialization: <200ms auf standard hardware
- Memory footprint: <2MB für core functionality
- Bundle size: <20KB für core, <10KB für crypto module

### DMModule API
```typescript
interface DMModule {
  with(pubkey: string): DMConversation;
  active(): DMConversation[];
  cleanup(): void;
}

interface DMConversation extends Readable<ConversationState> {
  // Svelte Store Contract
  subscribe(handler: (state: ConversationState) => void): () => void;
  
  // Message Operations
  send(content: string): Promise<SendResult>;
  markAsRead(): void;
  
  // State Access
  readonly messages: Event[];
  readonly status: ConnectionStatus;
  readonly latest: Event | null;
  readonly unreadCount: number;
  
  // Lifecycle
  close(): void;
  destroy(): Promise<void>;
}
```

**Contract**: 
- DMConversation extends Readable<ConversationState> für native Svelte integration
- Reactive updates bei incoming messages in <100ms
- NIP-17 gift wrap implementation für metadata privacy
- Automatic retry für send failures (3x exponential backoff)

**Usage Pattern**: 
```typescript
// Reactive Store Usage
const conversation = nostr.dm.with('npub1234...');
$: messages = $conversation.messages;
$: status = $conversation.status;

// Message Sending
await conversation.send("Hello, world!");

// Cleanup
conversation.close();
```

**Error Conditions**: 
- Invalid npub format (immediate validation error)
- Network failures during send (automatic retry mit backoff)
- Relay unavailability (automatic failover)
- Encryption errors (clear error message mit recovery suggestions)

**Performance Characteristics**: 
- First connection: <2s auf standard internet
- Send latency: <500ms unter normal conditions
- Store updates: <100ms für UI reactivity
- Memory usage: <10MB für active conversation

### SignerManager API
```typescript
interface SignerManager {
  status(): SignerStatus;
  upgrade(): Promise<UpgradeResult>;
  canSign(): boolean;
  getPublicKey(): string;
  
  // Event signing (internal use)
  signEvent(event: UnsignedEvent): Promise<Event>;
}

interface UpgradeResult {
  success: boolean;
  newSignerType: SignerType;
  message: string;
  nextSteps?: string[];
}
```

**Contract**: 
- Automatic NIP-07 extension detection (<100ms)
- Silent fallback zu temporary keys bei missing extension
- Progressive enhancement flows mit clear upgrade paths
- Secure key generation für temporary keys

**Usage Pattern**: 
```typescript
// Status Checking
const status = nostr.signer.status();
if (status.type === 'temporary') {
  console.warn('Using temporary keys - consider upgrading');
}

// Upgrade Flow
if (status.canUpgrade) {
  await nostr.signer.upgrade();
}
```

**Error Conditions**: 
- Extension permission denied (graceful fallback)
- Extension timeout (automatic retry)
- Key generation failure (clear error message)
- Upgrade failure (recovery suggestions)

**Performance Characteristics**: 
- Extension detection: <100ms startup time
- Key operations: <50ms für responsive UX
- Upgrade flow: <30s für typical user
- Memory usage: <1MB für key management

### RelayManager API
```typescript
interface RelayManager {
  connect(relays?: string[]): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  getConnectedRelays(): string[];
  getHealthStatus(): RelayHealth[];
  
  // Publishing
  publish(event: Event): Promise<PublishResult>;
  
  // Subscribing
  subscribe(filter: Filter, handler: (event: Event) => void): Subscription;
  
  // Management
  addRelay(url: string): Promise<void>;
  removeRelay(url: string): Promise<void>;
}

interface RelayHealth {
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  successRate: number;
  lastSeen: Date;
}
```

**Contract**: 
- Automatic relay discovery basierend auf NIP-65 outbox model
- >90% message delivery success rate
- Intelligent fallback chains für reliability
- Connection pooling für efficiency

**Usage Pattern**: 
```typescript
// Automatic Management (Zero-Config)
// Relay management happens automatically

// Manual Management (Power Users)
await nostr.relay.addRelay('wss://custom.relay');
const health = nostr.relay.getHealthStatus();
```

**Error Conditions**: 
- All relays unavailable (clear error mit recovery suggestions)
- Connection timeout (automatic retry mit backoff)
- Rate limiting detected (intelligent backoff)
- Invalid relay URL (immediate validation)

**Performance Characteristics**: 
- Connection establishment: <2s für primary relays
- Publish latency: <300ms für successful delivery
- Health monitoring: Real-time updates
- Resource usage: <5MB für connection pool

## Integration Contracts

### Framework Adapters
**SvelteKit Integration**: 
- SSR-compatible ohne window dependencies
- Hydration-safe state management
- Progressive enhancement patterns
- Form action compatibility

**Svelte Store Integration**: 
- Native store contract implementation
- Automatic subscription cleanup
- Custom derivations support
- Memory-safe reactive patterns

### Build Tool Integration
**Vite Configuration**: 
```typescript
// vite.config.js optimizations
export default {
  optimizeDeps: {
    include: ['nostr-unchained']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
}
```

**Tree-Shaking Support**: 
- Explicit exports für optimal dead code elimination
- Dynamic imports für conditional functionality
- Side-effect free modules
- Modern ES2020+ target

### Plugin Interface
```typescript
interface NostrPlugin {
  name: string;
  version: string;
  initialize(nostr: NostrUnchained): void;
  destroy(): void;
}

// Plugin Registration
nostr.use(plugin: NostrPlugin): void;
```

## Versioning Strategy

### Semantic Versioning
**Major Version (X.0.0)**: Breaking changes zu public APIs
**Minor Version (X.Y.0)**: New features mit backward compatibility
**Patch Version (X.Y.Z)**: Bug fixes und performance improvements

### Breaking Change Policy
**Deprecation Timeline**: 6 months minimum warning für breaking changes
**Migration Path**: Automated migration tools wo möglich
**Support Timeline**: Previous major version supported für 12 months

### Deprecation Timeline
**Phase 1 (0-3 months)**: Deprecation warnings in console
**Phase 2 (3-6 months)**: Documentation updates mit migration guides
**Phase 3 (6+ months)**: Feature removal in next major version

## Testing Contracts

### Unit Test Requirements
**API Coverage**: >95% coverage für all public APIs
**Type Safety**: All APIs must pass TypeScript strict mode
**Performance**: Initialization <200ms, operations <500ms
**Memory**: No memory leaks detected über 24h normal usage

### Integration Test Strategy
**Framework Integration**: Full SvelteKit SSR compatibility testing
**Extension Integration**: Testing mit Alby, nos2x, Amber extensions
**Relay Integration**: Testing mit major public relays
**Cross-browser**: Testing in Chrome, Firefox, Safari, Edge

### Performance Test Criteria
**Bundle Size**: <30KB gzipped für M1 functionality
**Network Performance**: >90% message delivery success rate
**Memory Usage**: <10MB für active conversation
**Startup Time**: <200ms für zero-config initialization

## Contract Validation

### Automated Validation
**TypeScript Compilation**: All contracts compile in strict mode
**API Compatibility**: No breaking changes ohne version bump
**Performance Regression**: CI/CD performance testing
**Security Audit**: Regular security scanning für dependencies

### Manual Validation
**Developer Experience**: 5-minute tutorial completion rate >95%
**API Usability**: Task completion without documentation >80%
**Error Recovery**: Error recovery success rate >90%
**Documentation Quality**: Documentation completeness >90%

## Contract Evolution

### Extension Strategy
**New Features**: Additive changes preserving existing contracts
**Performance Improvements**: Transparent optimizations
**Security Updates**: Immediate deployment für security fixes
**Community Features**: Plugin system für community contributions

### Backward Compatibility
**API Stability**: Public APIs remain stable within major versions
**Migration Tools**: Automated migration für breaking changes
**Legacy Support**: Previous version support während transition period
**Documentation**: Complete migration guides für all breaking changes 