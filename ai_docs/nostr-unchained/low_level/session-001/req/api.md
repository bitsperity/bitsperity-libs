# Meilenstein 1: Magische Erste Erfahrung - API-Anforderungen

## API-Design-Prinzipien
Aus der hochrangigen api.md angewendet auf diesen Meilenstein:
- **Zero-Config Magic**: Funktioniert ohne Konfiguration sofort
- **Reactive by Design**: Native Svelte Store Integration
- **Progressive Enhancement**: Temporäre Keys → Extension upgrade
- **Fluent Interface**: Chainable configuration für Power Users

## Kern-APIs für diesen Meilenstein

### Primäres Interface: NostrUnchained-Klasse
**Zweck**: Zero-Config-Initialisierung mit sofortiger DM-Funktionalität
**Priorität**: Must Have (P0)

#### Method Signatures
```typescript
// Zero-Config Constructor
constructor(config?: NostrConfig);

// Fluent Configuration (Static)
static withRelays(relays: string[]): NostrBuilder;
static timeout(ms: number): NostrBuilder;
static debug(enabled: boolean): NostrBuilder;

// Main DM Interface
readonly dm: DMModule;
```

#### Input-Anforderungen
- **Constructor config (optional)**: `{ relays?, timeout?, debug?, signer? }`
- **Relay URLs**: WSS URLs mit Validation
- **Timeout values**: 1000-30000ms Range
- **Debug flag**: Boolean für detailed logging

#### Output-Anforderungen
- **Success Response**: NostrUnchained instance mit funktionierendem dm module
- **Error Response**: TypeScript-sichere Error objects mit actionable messages
- **Initialization Status**: Ready state observable für async initialization

#### Behavior-Anforderungen
- Initialisiert sich in <200ms mit smart defaults
- Automatische Relay-Discovery wenn keine Konfiguration
- Silent fallback zu temporären Keys bei fehlender Extension
- Memory-safe resource management mit cleanup hooks

### DM-Module Interface
**Zweck**: Reactive conversation stores für realtime DM functionality
**Priorität**: Must Have (P0)

#### Method Signatures
```typescript
interface DMModule {
  with(pubkey: string): DMConversation;
}

interface DMConversation extends Readable<ConversationState> {
  send(content: string): Promise<SendResult>;
  readonly messages: Event[];
  readonly status: ConnectionStatus;
  readonly latest: Event | null;
  close(): void;
}
```

#### Input-Anforderungen
- **pubkey Parameter**: npub/hex format mit automatic detection
- **Message content**: String mit reasonable length limits (<10KB)
- **Validation**: npub format validation mit clear error messages

#### Output-Anforderungen
- **Svelte Store**: Native readable store mit $-syntax support
- **SendResult**: `{ success: boolean, eventId?: string, error?: string }`
- **ConversationState**: `{ messages: Event[], status: string, latest: Event | null }`

#### Behavior-Anforderungen
- Reactive updates bei incoming messages in <100ms
- NIP-17 gift wrap implementation für metadata privacy
- Automatic retry bei send failures (3x exponential backoff)
- Connection recovery bei temporary network issues

### Signer-Management Interface
**Zweck**: Automatic NIP-07 detection mit transparent fallback
**Priorität**: Must Have (P0)

#### Method Signatures
```typescript
interface SignerStatus {
  type: 'temporary' | 'extension' | 'custom';
  pubkey: string;
  canUpgrade: boolean;
}

readonly signer: {
  status(): SignerStatus;
  upgrade(): Promise<UpgradeResult>;
}
```

#### Input-Anforderungen
- **Extension Detection**: Automatic window.nostr detection
- **Fallback Generation**: Secure temporary key creation
- **Upgrade Flow**: User-friendly extension installation guidance

#### Output-Anforderungen
- **Transparent Operations**: Same API regardless of signer type
- **Status Information**: Clear indication of current signer
- **Security Warnings**: Appropriate warnings für temporary keys

### Error-Handling Specification
Basierend auf interview requirements für silent retry mit smart recovery:

#### Error-Kategorien
```typescript
interface NostrError {
  code: 'NETWORK' | 'AUTH' | 'VALIDATION' | 'RELAY' | 'TIMEOUT';
  message: string;
  recoverable: boolean;
  suggestions: string[];
}
```

#### Recovery-Strategien
- **Network Errors**: Automatic retry mit exponential backoff
- **Auth Errors**: Clear guidance für extension installation
- **Validation Errors**: Immediate feedback mit format examples
- **Relay Errors**: Automatic fallback zu backup relays

## Configuration-Anforderungen
Was Entwickler konfigurieren können und wie:

### Smart Defaults
- **Relays**: `['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net']`
- **Timeout**: 5000ms für normal connections
- **Debug**: false (production mode)
- **Signer**: automatic detection → temporary fallback

### Fluent Configuration
```typescript
const nostr = NostrUnchained
  .withRelays(['wss://custom.relay'])
  .timeout(10000)
  .debug(true)
  .create();
```

### Runtime Configuration
```typescript
// Nach Initialisierung
nostr.configure({
  relays: ['additional-relay'],
  timeout: 8000
});
```

## Beispiele und Usage Patterns

### Sofortiger Erfolg (5-Minuten-Ziel)
```typescript
import { NostrUnchained } from 'nostr-unchained';

// 1. Zero-Config Init
const nostr = new NostrUnchained();

// 2. Create Conversation
const conversation = nostr.dm.with('npub1234...');

// 3. Send Message
await conversation.send("Hello!");

// 4. Reactive UI Updates
$: console.log('Messages:', $conversation.messages);
```

### Erweiterte Konfiguration
```typescript
// Power User Setup
const nostr = NostrUnchained
  .withRelays([
    'wss://relay.damus.io',
    'wss://nos.lol'
  ])
  .timeout(8000)
  .debug(true)
  .create();

// Multiple Conversations
const aliceConvo = nostr.dm.with('npub_alice...');
const bobConvo = nostr.dm.with('npub_bob...');

// Monitor Status
$: {
  if ($aliceConvo.status === 'error') {
    console.error('Alice conversation error');
  }
}
```

### Error Handling
```typescript
try {
  await conversation.send("Important message");
} catch (error) {
  if (error.recoverable) {
    // Library will retry automatically
    console.log('Retrying...', error.suggestions);
  } else {
    // Manual intervention needed
    console.error('Manual action required:', error.message);
  }
}
```

## Integration-Anforderungen
Wie APIs mit bestehenden Entwickler-Tools funktionieren:

### SvelteKit Integration
- **SSR Compatibility**: No window dependencies bei server-side
- **Store Integration**: Native Svelte store patterns
- **Form Actions**: Funktioniert mit/ohne JavaScript
- **Hydration**: Seamless client-side activation

### TypeScript Integration
- **Complete Type Safety**: No any-types in public APIs
- **Generic Support**: Type-safe event handling
- **Builder Pattern Types**: Fluent interface type inference
- **Error Type Safety**: Typed error objects

### Testing Integration
- **Mock Support**: Testable mit mock signers
- **Deterministic**: Predictable behavior für unit tests
- **Isolated**: No global state pollution
- **Async Testing**: Proper Promise/Store testing patterns 