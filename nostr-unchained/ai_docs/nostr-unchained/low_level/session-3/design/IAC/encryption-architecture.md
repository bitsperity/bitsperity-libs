# Multi-Layer Encryption System Architecture

## Overview
Design for implementing NIP-17 Private Direct Messages with 100% specification compliance, supporting multi-recipient messages and subject-based conversation threading.

## System Architecture

### Component Hierarchy
```
NostrUnchained.dm
├── DMManager (main interface)
│   ├── ConversationManager (subject + participant tracking)
│   ├── MessagePipeline (3-layer encryption)
│   └── InboxManager (relay discovery + delivery)
│
├── Crypto Layer
│   ├── NIP44Crypto (v2 encryption/decryption)
│   ├── KeyManager (conversation keys + ephemeral keys)
│   └── NonceGenerator (cryptographically secure)
│
├── Protocol Layer  
│   ├── RumorBuilder (kind 14/15 unsigned events)
│   ├── SealManager (kind 13 encrypted + signed)
│   └── GiftWrapManager (kind 1059 with ephemeral keys)
│
└── Transport Layer
    ├── RelayDiscovery (kind 10050 inbox lists)
    ├── MessageDelivery (multi-relay publishing)
    └── MessageRetrieval (subscription + decryption)
```

### Data Flow Architecture

#### Outbound Message Flow
```
User Input: message + recipients + subject
↓
1. ConversationManager.send()
   - Resolve conversation identity (subject + participants)
   - Create conversation thread if new
↓
2. MessagePipeline.process()
   - Build unsigned rumor (kind 14/15)
   - Create seal (kind 13) - NIP-44 encrypt + sign
   - Create gift wraps (kind 1059) - one per recipient
↓
3. InboxManager.deliver()
   - Discover inbox relays for each recipient
   - Send individual gift wraps to respective inboxes
   - Handle partial delivery failures
```

#### Inbound Message Flow  
```
Relay Subscription → Gift Wrap (kind 1059)
↓
1. MessageRetrieval.process()
   - Decrypt gift wrap with user's private key
   - Extract and verify seal
↓
2. MessagePipeline.decrypt()
   - Verify seal signature
   - Decrypt rumor from seal
   - Validate rumor structure
↓
3. ConversationManager.receive()
   - Extract subject and participants
   - Match to existing conversation or create new
   - Add message to conversation history
   - Trigger real-time updates
```

## Core Components Design

### 1. NIP44Crypto Class
```typescript
interface NIP44Crypto {
  // Key derivation
  deriveConversationKey(senderPrivKey: string, recipientPubKey: string): Uint8Array
  
  // Message encryption/decryption  
  encrypt(plaintext: string, conversationKey: Uint8Array): string
  decrypt(ciphertext: string, conversationKey: Uint8Array): string
  
  // Low-level operations
  generateNonce(): Uint8Array
  deriveMessageKeys(conversationKey: Uint8Array, nonce: Uint8Array): MessageKeys
  
  // Validation
  validatePayload(encrypted: string): boolean
}

interface MessageKeys {
  chachaKey: Uint8Array
  chachaNonce: Uint8Array  
  hmacKey: Uint8Array
}
```

### 2. GiftWrapManager Class
```typescript
interface GiftWrapManager {
  // Create gift wrap for single recipient
  createGiftWrap(
    seal: NostrEvent,
    recipientPubKey: string,
    ephemeralKey?: string
  ): NostrEvent
  
  // Create multiple gift wraps for multi-recipient
  createMultiRecipientGiftWraps(
    seal: NostrEvent,
    recipients: string[]
  ): NostrEvent[]
  
  // Decrypt incoming gift wrap
  unwrapGiftWrap(giftWrap: NostrEvent, userPrivKey: string): NostrEvent
  
  // Timestamp randomization
  randomizeTimestamp(baseTime: number): number
  
  // Ephemeral key management
  generateEphemeralKey(): string
}
```

### 3. ConversationManager Class
```typescript
interface ConversationManager {
  // Conversation creation
  with(recipient: string): DMConversation
  withSubject(subject: string, recipients: string[]): GroupConversation
  
  // Conversation discovery
  findConversation(subject?: string, participants?: string[]): Conversation | null
  listConversations(): Conversation[]
  
  // Message handling
  processIncomingMessage(decryptedRumor: NostrEvent): void
  
  // Real-time updates
  subscribe(conversationId: string): Subscription
}

interface Conversation {
  id: string
  subject?: string
  participants: string[]
  messages: DecryptedMessage[]
  
  send(content: string): Promise<void>
  markAsRead(): void
  getHistory(limit?: number): DecryptedMessage[]
}
```

### 4. InboxManager Class
```typescript
interface InboxManager {
  // Relay discovery
  discoverInboxRelays(pubkey: string): Promise<string[]>
  updateInboxRelays(relays: string[]): Promise<void>
  
  // Message delivery
  deliverToInbox(giftWrap: NostrEvent, recipientPubKey: string): Promise<boolean>
  deliverMultiRecipient(giftWraps: NostrEvent[], recipients: string[]): Promise<DeliveryResult[]>
  
  // Subscription management
  subscribeToInbox(): Subscription
  handleIncomingGiftWrap(giftWrap: NostrEvent): void
}

interface DeliveryResult {
  recipient: string
  success: boolean
  relays: string[]
  errors?: string[]
}
```

## Message Pipeline Design

### Encryption Pipeline (3 Layers)
```typescript
class MessagePipeline {
  async send(
    content: string,
    recipients: string[],
    subject?: string,
    senderPrivKey: string
  ): Promise<DeliveryResult[]> {
    
    // Layer 1: Create Rumor (unsigned kind 14)
    const rumor = this.rumorBuilder.create({
      kind: 14,
      content,
      tags: [
        ...recipients.map(r => ['p', r]),
        ...(subject ? [['subject', subject]] : [])
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: getPublicKey(senderPrivKey)
      // NO id, NO sig - this is unsigned!
    })
    
    // Layer 2: Create Seal (kind 13)
    const seal = await this.sealManager.create(rumor, senderPrivKey)
    
    // Layer 3: Create Gift Wraps (kind 1059) - one per recipient
    const giftWraps = await this.giftWrapManager.createMultiRecipientGiftWraps(
      seal, 
      recipients
    )
    
    // Deliver to inbox relays
    return await this.inboxManager.deliverMultiRecipient(giftWraps, recipients)
  }
}
```

### Decryption Pipeline
```typescript
class MessagePipeline {
  async decrypt(
    giftWrap: NostrEvent,
    userPrivKey: string
  ): Promise<DecryptedMessage | null> {
    
    try {
      // Layer 3: Unwrap Gift Wrap → Seal
      const seal = await this.giftWrapManager.unwrapGiftWrap(giftWrap, userPrivKey)
      
      // Layer 2: Decrypt Seal → Rumor  
      const rumor = await this.sealManager.decrypt(seal, userPrivKey)
      
      // Layer 1: Extract message content
      return {
        content: rumor.content,
        subject: rumor.tags.find(t => t[0] === 'subject')?.[1],
        participants: rumor.tags.filter(t => t[0] === 'p').map(t => t[1]),
        sender: seal.pubkey,
        timestamp: rumor.created_at,
        messageId: this.generateMessageId(rumor)
      }
      
    } catch (error) {
      console.error('Message decryption failed:', error)
      return null
    }
  }
}
```

## Conversation Threading Design

### Subject-Based Identity
```typescript
interface ConversationIdentity {
  // Primary identity
  subject?: string
  participants: Set<string> // Normalized pubkey set
  
  // Derived properties
  id: string // Hash of subject + sorted participants
  type: 'direct' | 'group'
  
  // Methods
  matches(subject?: string, participants?: string[]): boolean
  addParticipant(pubkey: string): ConversationIdentity
  removeParticipant(pubkey: string): ConversationIdentity
}

class ConversationIdentity {
  static create(subject?: string, participants?: string[]): ConversationIdentity {
    const sortedParticipants = new Set(participants?.sort())
    const id = this.generateId(subject, sortedParticipants)
    
    return {
      subject,
      participants: sortedParticipants,
      id,
      type: sortedParticipants.size > 1 ? 'group' : 'direct'
    }
  }
  
  private static generateId(subject?: string, participants?: Set<string>): string {
    const data = [
      subject || '',
      ...(participants ? Array.from(participants).sort() : [])
    ].join('|')
    
    return sha256(data).slice(0, 16) // 64-bit conversation ID
  }
}
```

### Message Threading
```typescript
interface ConversationStore {
  // Conversation management
  getConversation(id: string): Conversation | null
  createConversation(identity: ConversationIdentity): Conversation
  findConversationByMessage(rumor: NostrEvent): Conversation | null
  
  // Message storage
  addMessage(conversationId: string, message: DecryptedMessage): void
  getMessages(conversationId: string, limit?: number): DecryptedMessage[]
  
  // Real-time subscriptions
  subscribeToConversation(id: string): Observable<DecryptedMessage>
  subscribeToConversationList(): Observable<Conversation[]>
}
```

## Error Handling & Recovery

### Encryption Errors
```typescript
enum EncryptionErrorType {
  INVALID_KEY = 'invalid_key',
  ENCRYPTION_FAILED = 'encryption_failed', 
  DECRYPTION_FAILED = 'decryption_failed',
  INVALID_NONCE = 'invalid_nonce',
  MAC_VERIFICATION_FAILED = 'mac_verification_failed'
}

class EncryptionError extends Error {
  constructor(
    public type: EncryptionErrorType,
    message: string,
    public details?: any
  ) {
    super(message)
  }
}
```

### Delivery Errors
```typescript
interface DeliveryError {
  recipient: string
  relay: string
  error: string
  retryable: boolean
}

class DeliveryManager {
  async deliverWithRetry(
    giftWrap: NostrEvent,
    recipient: string,
    maxRetries = 3
  ): Promise<DeliveryResult> {
    
    const relays = await this.discoverInboxRelays(recipient)
    const errors: DeliveryError[] = []
    
    for (const relay of relays) {
      try {
        await this.publishToRelay(giftWrap, relay)
        return { recipient, success: true, relays: [relay] }
        
      } catch (error) {
        errors.push({
          recipient,
          relay,
          error: error.message,
          retryable: this.isRetryableError(error)
        })
      }
    }
    
    return {
      recipient,
      success: false,
      relays,
      errors: errors.map(e => e.error)
    }
  }
}
```

## Performance Optimizations

### Key Caching
```typescript
class KeyCache {
  private conversationKeys = new Map<string, Uint8Array>()
  private ephemeralKeys = new Map<string, string>()
  
  getConversationKey(sender: string, recipient: string): Uint8Array | null {
    const key = this.makeConversationKeyId(sender, recipient)
    return this.conversationKeys.get(key) ?? null
  }
  
  cacheConversationKey(sender: string, recipient: string, key: Uint8Array): void {
    const keyId = this.makeConversationKeyId(sender, recipient)
    this.conversationKeys.set(keyId, key)
    
    // Also cache the reverse direction (bidirectional)
    const reverseKeyId = this.makeConversationKeyId(recipient, sender)
    this.conversationKeys.set(reverseKeyId, key)
  }
  
  private makeConversationKeyId(a: string, b: string): string {
    return [a, b].sort().join('|')
  }
}
```

### Batch Processing
```typescript
class BatchMessageProcessor {
  async sendToMultipleRecipients(
    messages: BatchMessage[],
    maxConcurrency = 5
  ): Promise<BatchResult[]> {
    
    // Group by conversation to reuse seals
    const grouped = this.groupByConversation(messages)
    
    const results = await Promise.all(
      grouped.map(group => this.processBatch(group, maxConcurrency))
    )
    
    return results.flat()
  }
  
  private async processBatch(
    batch: BatchMessage[],
    maxConcurrency: number
  ): Promise<BatchResult[]> {
    
    // Create single seal for all messages in conversation
    const seal = await this.createSealForBatch(batch)
    
    // Create gift wraps concurrently
    const chunks = this.chunkArray(batch, maxConcurrency)
    const results: BatchResult[] = []
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(msg => this.processMessage(msg, seal))
      )
      results.push(...chunkResults)
    }
    
    return results
  }
}
```

## Testing Strategy

### Test Vector Validation
```typescript
// NIP-44 test vectors
const NIP44_TEST_VECTORS = [
  {
    conversation_key: "...",
    nonce: "...", 
    plaintext: "...",
    ciphertext: "..."
  }
  // ... more vectors
]

describe('NIP-44 Compliance', () => {
  test.each(NIP44_TEST_VECTORS)('encrypts correctly', (vector) => {
    const result = nip44Crypto.encryptWithNonce(
      vector.plaintext,
      vector.conversation_key,
      vector.nonce
    )
    expect(result).toBe(vector.ciphertext)
  })
})
```

### Cross-Client Compatibility Tests
```typescript
describe('Cross-Client Compatibility', () => {
  test('messages encrypted by our client can be decrypted by reference implementation', async () => {
    const message = "Hello from NostrUnchained!"
    const encrypted = await ourImplementation.encrypt(message, testKeys)
    const decrypted = await referenceImplementation.decrypt(encrypted, testKeys)
    expect(decrypted).toBe(message)
  })
  
  test('messages encrypted by reference implementation can be decrypted by our client', async () => {
    const message = "Hello from reference client!"
    const encrypted = await referenceImplementation.encrypt(message, testKeys)
    const decrypted = await ourImplementation.decrypt(encrypted, testKeys)
    expect(decrypted).toBe(message)
  })
})
```

This architecture provides a robust foundation for implementing NIP-17 private direct messages with full specification compliance and support for multi-recipient messages and subject-based conversation threading.