# 💬 Direct Messages Module

The DM module provides end-to-end encrypted private messaging using NIP-17 (Private Direct Messages) and NIP-44 (Versioned Encryption) with the Gift Wrap Protocol (NIP-59).

Built on the **Universal Cache Architecture** for maximum performance and reliability.

## Table of Contents

- [Quick Start](#quick-start)
- [Universal Cache Architecture](#universal-cache-architecture)
- [Lazy Loading & User Control](#lazy-loading--user-control)
- [Sending Messages](#sending-messages)
- [Conversations](#conversations)
- [Message Rooms](#message-rooms)
- [Security Features](#security-features)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();

// Connect to relays (no DM subscriptions started yet)
await nostr.connect();

// Start DM conversation (triggers lazy gift wrap subscription)
const chat = nostr.dm.with('663ee62c0feacd53a6dc6b326c24de7062141c9d095c1a0ff8529d23471f1b8b');

// Send encrypted message
await chat.send('Hello! This message is end-to-end encrypted. 🔐');

// Listen for new messages (reactive store)
chat.subscribe(messages => {
  console.log(`Conversation has ${messages.length} messages`);
  messages.forEach(msg => {
    console.log(`${msg.isFromMe ? 'Me' : 'Them'}: ${msg.content}`);
  });
});
```

## Universal Cache Architecture

The DM system is built on a sophisticated 4-layer architecture:

### Layer 1: Universal Event Cache
- **Auto-unwraps gift wraps**: Kind 1059 → Kind 14 automatically
- **Encrypted storage**: All events encrypted at rest
- **Smart deduplication**: No duplicate messages

### Layer 2: Query/Sub Engine
- **Identical APIs**: `nostr.query()` and `nostr.sub()` have same interface
- **Cache integration**: Queries hit cache first, subscriptions fill cache
- **Reactive updates**: Cache changes trigger store updates

### Layer 3: Specialized APIs
- **DM as query wrapper**: `dm.with()` creates reactive cache queries
- **Room support**: Multi-participant encrypted groups
- **Zero configuration**: Everything works automatically

### Layer 4: Zero-Config Developer API
- **No technical details**: Users never see kind 1059, gift wraps, etc.
- **Educative design**: APIs are self-explanatory
- **Advanced access**: Power users can access lower layers

```typescript
// Layer 4: Zero-Config DX
const chat = nostr.dm.with(pubkey); // Simple & intuitive

// Layer 3: Specialized DM API  
const messages = chat.messages; // Reactive store

// Layer 2: Query Engine (if needed)
const dmEvents = nostr.query().kinds([14]).execute();

// Layer 1: Universal Cache (if needed)
const cache = nostr.getCache(); // Advanced usage
```

## Lazy Loading & User Control

### Perfect User Control
DM subscriptions start **only when you need them**:

```typescript
// Step 1: Connect (NO automatic DM subscriptions)
await nostr.connect(); 
// ✅ Only relay connections, no gift wrap subscriptions

// Step 2: Use other features without DM overhead
await nostr.publish('Hello Nostr!'); // ✅ Works without DMs
const posts = nostr.query().kinds([1]).execute(); // ✅ Works without DMs

// Step 3: First DM usage triggers lazy loading
const chat = nostr.dm.with(pubkey); // 🎁 NOW gift wrap subscription starts
```

### Zero Technical Complexity
Users never need to know about:
- ❌ `kind: 1059` (gift wraps)
- ❌ `kind: 14` (DM events)  
- ❌ NIP-17, NIP-44, NIP-59 details
- ❌ Gift wrap subscriptions
- ❌ Cache transformations

Everything happens automatically in the background.

### Performance Benefits
- **No wasted subscriptions**: Only active when DMs are used
- **Automatic cleanup**: Subscriptions managed efficiently  
- **Privacy protection**: DM visibility only when requested

## Sending Messages

### Simple Messages

```typescript
// Get conversation (starts gift wrap subscription if needed)
const chat = nostr.dm.with('pubkey-here');

// Send encrypted message
await chat.send('Hello there! 👋');

// Send with custom options
await chat.send('Important message', {
  subject: 'Meeting Reminder'
});
```

### Advanced Messaging

```typescript
// Message with metadata
await chat.send('Meeting at 3pm', {
  subject: 'Daily Standup',
  expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
});

// Check sending status
const result = await chat.send('Are you there?');
if (result.success) {
  console.log('Message sent successfully');
} else {
  console.error('Send failed:', result.error);
}
```

## Conversations

Conversations are **reactive cache queries** that update automatically:

### Creating Conversations

```typescript
// Create conversation (lazy loads gift wrap subscription)
const chat = nostr.dm.with('recipient-pubkey');

// Conversation properties
console.log('Chat partner:', chat.otherPubkey);
console.log('My pubkey:', chat.myPubkey);
```

### Reactive Message Updates

```typescript
// Subscribe to conversation (Svelte store pattern)
const unsubscribe = chat.subscribe(messages => {
  console.log(`${messages.length} total messages`);
  
  messages.forEach(message => {
    console.log(`${message.isFromMe ? 'Me' : 'Them'}: ${message.content}`);
    console.log(`Timestamp: ${new Date(message.timestamp)}`);
    console.log(`Subject: ${message.subject || 'None'}`);
  });
});

// Current messages (synchronous access)
const currentMessages = chat.current;
console.log(`Currently ${currentMessages.length} messages loaded`);

// Stop listening
unsubscribe();
```

### Message Properties

```typescript
// Each message has these properties:
interface DMMessage {
  content: string;        // Decrypted message content
  timestamp: number;      // Message timestamp
  isFromMe: boolean;      // True if I sent it
  subject?: string;       // Optional subject line
  eventId: string;        // Unique event identifier
  pubkey: string;         // Sender's public key
}
```

## Message Rooms

Multi-participant encrypted groups:

```typescript
// Create room with multiple participants
const room = nostr.dm.room(
  ['alice-pubkey', 'bob-pubkey', 'charlie-pubkey'], 
  { subject: 'Project Planning' }
);

// Send to all participants
await room.send('Welcome to our planning room!');

// Listen for room messages
room.subscribe(messages => {
  console.log(`Room has ${messages.length} messages`);
});

// Room management
console.log('Participants:', room.participants);
await room.addParticipant('new-member-pubkey');
await room.removeParticipant('leaving-member-pubkey');
```

## Security Features

### Perfect Forward Secrecy
Every message uses unique ephemeral keys:

```typescript
// Each message gets a new ephemeral key pair
await chat.send('Message 1'); // Uses ephemeral key A
await chat.send('Message 2'); // Uses ephemeral key B

// Even if key A is compromised, message 2 remains secure
```

### Automatic Gift Wrap Protocol
Messages are automatically wrapped in NIP-59 gift wraps:

1. **Rumor** (unsigned event) - Your actual message
2. **Seal** (kind 13) - Rumor encrypted with NIP-44
3. **Gift Wrap** (kind 1059) - Seal encrypted again with ephemeral key

```typescript
// You write this:
await chat.send('Hello Alice!');

// Nostr Unchained automatically:
// 1. Creates rumor with your message
// 2. Encrypts rumor into seal (kind 13)
// 3. Encrypts seal into gift wrap (kind 1059)
// 4. Signs with ephemeral key
// 5. Publishes gift wrap to relays
// 6. Discards ephemeral key
```

### Metadata Protection
Gift wraps hide message metadata:

```typescript
// Relay observers see:
{
  kind: 1059,                    // Standard gift wrap
  pubkey: 'random-ephemeral-key', // Not your real key
  created_at: randomTimestamp,    // Randomized timestamp
  tags: [['p', 'recipient']],     // Only recipient visible
  content: 'encrypted-data'       // No content leakage
}

// Your real message metadata is encrypted inside
```

## API Reference

### Main DM Interface

```typescript
// Start conversation (lazy loads gift wrap subscription)
nostr.dm.with(pubkey: string): UniversalDMConversation

// Create multi-participant room
nostr.dm.room(participants: string[], options?: RoomOptions): UniversalDMRoom

// Get all active conversations
nostr.dm.conversations: UniversalDMConversation[]
```

### UniversalDMConversation

```typescript
class UniversalDMConversation {
  // Properties
  readonly myPubkey: string;
  readonly otherPubkey: string;
  
  // Reactive store (Svelte store interface)
  subscribe(callback: (messages: DMMessage[]) => void): () => void;
  
  // Current messages (synchronous)
  get current(): DMMessage[];
  
  // Send message
  send(content: string, options?: MessageOptions): Promise<SendResult>;
}
```

### UniversalDMRoom

```typescript
class UniversalDMRoom {
  // Properties
  readonly participants: string[];
  readonly myPubkey: string;
  
  // Reactive store
  subscribe(callback: (messages: RoomMessage[]) => void): () => void;
  get current(): RoomMessage[];
  
  // Methods
  send(content: string): Promise<SendResult>;
  addParticipant(pubkey: string): Promise<void>;
  removeParticipant(pubkey: string): Promise<void>;
}
```

### Message Interfaces

```typescript
interface DMMessage {
  content: string;
  timestamp: number;
  isFromMe: boolean;
  subject?: string;
  eventId: string;
  pubkey: string;
}

interface MessageOptions {
  subject?: string;
  expiry?: number;
}

interface SendResult {
  success: boolean;
  error?: string;
}
```

## Architecture Benefits

### For Users
- ✅ **Zero-Config**: Works automatically without setup
- ✅ **User Control**: Gift wrap subscriptions only when needed
- ✅ **Performance**: No unnecessary network traffic
- ✅ **Privacy**: DM activity only when explicitly requested

### For Developers  
- ✅ **Reactive**: Automatic UI updates via Svelte stores
- ✅ **Cached**: Instant access to message history
- ✅ **Layered**: Clean separation of concerns
- ✅ **Tested**: Built on proven Universal Cache infrastructure

### Security Guarantees
- ✅ **End-to-End Encryption** - Only sender and recipient can read
- ✅ **Perfect Forward Secrecy** - Unique keys for every message
- ✅ **Metadata Protection** - Message patterns hidden via gift wraps
- ✅ **Automatic Key Management** - No manual key handling required
- ✅ **Quantum Resistant** - Uses Curve25519 + ChaCha20-Poly1305

---

**Next Steps:**
- [Query Engine](../query/README.md) - Universal Cache query system
- [Stores](../stores/README.md) - Reactive data management  
- [Social Media](../social/README.md) - Profiles, contacts, reactions