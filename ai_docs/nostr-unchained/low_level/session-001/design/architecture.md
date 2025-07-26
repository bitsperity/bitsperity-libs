# Architecture Design: Milestone 1 - Basic Publishing

## Test-Driven Architecture Philosophy

**Design Principle**: Architecture emerges from test requirements, not abstract patterns.

**Tests Drive Design**: Every architectural decision must be justified by failing tests that need to pass.

## Core Class Structure

### Primary Interface: NostrUnchained

```typescript
export interface NostrUnchainedConfig {
  relays?: string[];
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface PublishResult {
  success: boolean;
  eventId?: string;
  event?: NostrEvent;
  relayResults: RelayResult[];
  timestamp: number;
  error?: NostrError;
  debug?: DebugInfo;
}

export interface RelayResult {
  relay: string;
  success: boolean;
  error?: string;
  latency?: number;
}

export interface NostrError {
  message: string;
  suggestion?: string;
  retryable: boolean;
  userAction?: string;
}

export class NostrUnchained {
  // Configuration
  public readonly relays: string[];
  public readonly connectedRelays: string[] = [];
  
  // Core functionality (Milestone 1)
  constructor(config?: NostrUnchainedConfig);
  async publish(content: string): Promise<PublishResult>;
  
  // Infrastructure methods
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  
  // Utility methods (needed by tests)
  async createEvent(eventData: Partial<NostrEvent>): Promise<NostrEvent>;
  calculateEventId(event: Omit<NostrEvent, 'id' | 'sig'>): string;
  async verifyEvent(event: NostrEvent): Promise<boolean>;
  
  // Extension integration
  async hasExtension(): Promise<boolean>;
  async getExtensionPubkey(): Promise<string>;
  
  // Relay management
  async getRelayInfo(relayUrl: string): Promise<RelayInfo>;
  async testRelay(relayUrl: string): Promise<{ success: boolean; error?: string }>;
}
```

## NIP-01 Compliance Architecture

### Event Structure (NIP-01 Compliant)

```typescript
export interface NostrEvent {
  id: string;           // 32-byte hex string (SHA256 hash)
  pubkey: string;       // 32-byte hex string (author's public key)
  created_at: number;   // Unix timestamp
  kind: number;         // Event type (0-65535)
  tags: string[][];     // Array of tag arrays
  content: string;      // Event content
  sig: string;          // 64-byte hex string (Schnorr signature)
}

export interface UnsignedEvent {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}
```

### Event Creation Pipeline

```typescript
class EventBuilder {
  // Test-driven event creation pipeline
  static async createTextNote(content: string, pubkey: string): Promise<UnsignedEvent> {
    return {
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [],
      content
    };
  }
  
  static calculateEventId(event: UnsignedEvent): string {
    // NIP-01 compliant ID calculation
    const serialized = JSON.stringify([
      0,                    // Reserved
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);
    
    return sha256(serialized);
  }
  
  static async signEvent(event: UnsignedEvent, privateKey: string): Promise<NostrEvent> {
    const id = EventBuilder.calculateEventId(event);
    const sig = await schnorrSign(id, privateKey);
    
    return {
      ...event,
      id,
      sig
    };
  }
}
```

## Relay Management Architecture

### Connection Management

```typescript
class RelayManager {
  private connections: Map<string, WebSocket> = new Map();
  private connectionStates: Map<string, 'connecting' | 'connected' | 'disconnected'> = new Map();
  
  async connect(relayUrl: string): Promise<boolean> {
    // Test-driven connection logic
    // Must handle: successful connection, timeouts, failures
  }
  
  async publishToRelay(relayUrl: string, event: NostrEvent): Promise<RelayResult> {
    // Test-driven publishing logic
    // Must handle: success responses, failures, timeouts
  }
  
  async getRelayInfo(relayUrl: string): Promise<RelayInfo> {
    // NIP-11 relay information document
  }
}
```

### Default Relay Configuration

```typescript
const DEFAULT_RELAYS = [
  'ws://umbrel.local:4848',      // Local testing relay (priority)
  'wss://relay.damus.io',        // Public relay fallback
  'wss://nos.lol',               // Additional fallback
  'wss://relay.snort.social'     // Additional fallback
];
```

## Cryptographic Architecture

### Key Management

```typescript
interface SigningProvider {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedEvent): Promise<string>;
}

class ExtensionSigner implements SigningProvider {
  // NIP-07 browser extension integration
  async getPublicKey(): Promise<string> {
    if (!window.nostr) throw new Error('No extension available');
    return await window.nostr.getPublicKey();
  }
  
  async signEvent(event: UnsignedEvent): Promise<string> {
    if (!window.nostr) throw new Error('No extension available');
    const signed = await window.nostr.signEvent(event);
    return signed.sig;
  }
}

class TemporarySigner implements SigningProvider {
  // Fallback for development/testing
  private privateKey: string;
  
  constructor() {
    this.privateKey = generatePrivateKey();
  }
  
  async getPublicKey(): Promise<string> {
    return getPublicKey(this.privateKey);
  }
  
  async signEvent(event: UnsignedEvent): Promise<string> {
    const id = EventBuilder.calculateEventId(event);
    return schnorrSign(id, this.privateKey);
  }
}
```

## Error Handling Architecture

### Graceful Degradation Strategy

```typescript
class ErrorHandler {
  static createPublishError(
    type: 'validation' | 'network' | 'signing' | 'relay',
    message: string,
    options: {
      retryable?: boolean;
      suggestion?: string;
      userAction?: string;
    } = {}
  ): NostrError {
    return {
      message,
      retryable: options.retryable ?? false,
      suggestion: options.suggestion,
      userAction: options.userAction
    };
  }
  
  static handleRelayFailures(relayResults: RelayResult[]): {
    success: boolean;
    error?: NostrError;
  } {
    const successCount = relayResults.filter(r => r.success).length;
    
    if (successCount === 0) {
      return {
        success: false,
        error: ErrorHandler.createPublishError(
          'network',
          'Failed to publish to any relay',
          {
            retryable: true,
            suggestion: 'Check your internet connection and try again'
          }
        )
      };
    }
    
    return { success: true };
  }
}
```

## Module Organization

### File Structure

```
src/
├── index.ts                 // Main export
├── core/
│   ├── NostrUnchained.ts   // Main class
│   ├── EventBuilder.ts     // Event creation
│   └── types.ts            // TypeScript interfaces
├── relay/
│   ├── RelayManager.ts     // Connection management
│   ├── RelayConnection.ts  // Individual connections
│   └── protocols.ts        // NIP-01 message types
├── crypto/
│   ├── SigningProvider.ts  // Signing abstraction
│   ├── ExtensionSigner.ts  // NIP-07 integration
│   └── TemporarySigner.ts  // Fallback signing
├── utils/
│   ├── validation.ts       // Event validation
│   ├── errors.ts          // Error handling
│   └── constants.ts       // Default configuration
└── test-setup.ts          // Test utilities
```

## Test Validation Points

### Architecture Decision Records (ADRs) with Tests

```typescript
describe('Architecture Validation', () => {
  test('NostrUnchained class should exist and be instantiable', () => {
    expect(() => new NostrUnchained()).not.toThrow();
  });
  
  test('should have default relay configuration including local relay', () => {
    const nostr = new NostrUnchained();
    expect(nostr.relays).toContain('ws://umbrel.local:4848');
  });
  
  test('should support configuration override', () => {
    const customRelays = ['ws://custom.relay'];
    const nostr = new NostrUnchained({ relays: customRelays });
    expect(nostr.relays).toEqual(customRelays);
  });
  
  test('publish method should exist and return Promise<PublishResult>', async () => {
    const nostr = new NostrUnchained();
    const result = nostr.publish("test");
    expect(result).toBeInstanceOf(Promise);
  });
});
```

## Progressive Enhancement Strategy

### Milestone 1 Scope (Minimal Viable Architecture)

**Included in Architecture:**
- Basic publish functionality
- NIP-01 event structure
- Relay connection management
- Extension signing (NIP-07)
- Error handling with graceful degradation

**Excluded from Architecture (Future Milestones):**
- Subscribe/query functionality
- Event caching
- Advanced relay discovery
- DM encryption
- Subgraph queries

### Extension Points for Future Milestones

```typescript
// Extension points designed into the architecture
export interface NostrUnchained {
  // Milestone 2: Subscribe & Query
  subscribe?(filters: Filter[]): EventStore;
  query?(): QueryBuilder;
  
  // Milestone 3: Direct Messages
  dm?: {
    with(pubkey: string): ConversationStore;
  };
  
  // Future: Subgraph queries
  subgraph?(): SubgraphBuilder;
}
```

## Success Criteria for Architecture

**Phase Gate 2 Complete When:**
1. ✅ All interfaces defined to satisfy test requirements
2. ✅ NIP-01 compliance architecture documented
3. ✅ Relay management strategy defined
4. ✅ Error handling patterns established
5. ✅ Module organization planned
6. ✅ Extension points identified for future milestones
7. ✅ Test validation points defined

**Next Phase**: Implementation to make tests pass!