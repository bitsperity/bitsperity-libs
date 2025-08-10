# 💬 Direct Messages Module

End‑to‑end encrypted messaging, 100% protocol compliant: **NIP‑17** (Private DMs), **NIP‑44 v2** (ChaCha20‑Poly1305), **NIP‑59** (Gift Wrap). Built on the **subscription‑first Universal Cache Architecture** with SOLID principles.

## 🔐 Cryptographic Excellence (100% NIP‑Compliant)

- 3‑layer encryption: Rumor → Seal → Gift Wrap (NIP‑59)
- NIP‑44 v2: ChaCha20‑Poly1305 with HKDF
- Perfect Forward Secrecy: Ephemeral keys with `publishSigned()` support
- Gift wrap handling: automatic kind 1059 processing (decryptor‑only via signer)
- Tag filtering: complete `#p` filtering for targeted messages

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

## Subscription‑First Cache Architecture

The DM system uses a SOLID 3‑layer architecture:

### Layer 0: Universal Event Cache
- Subscription‑first storage
- Gift wrap storage regardless of decryption success
- Tag filtering: full `#p`, `#e`, `#t` support

### Layer 1: Core (pub/sub/query/delete)
- `publish()`: standard publishing with signing
- `publishSigned()`: pre‑signed gift wraps
- `sub()`: live subscriptions fill the cache
- `query()`: instant cache lookups

### Layer 2: High‑Level DM Module
- UniversalDMConversation: auto‑subscribe for message conversion
- GiftWrapProtocol: 3‑layer encryption with ephemeral keys
- DMMessage: unified message shape

```typescript
// Schicht 2: High-Level DM API
const chat = nostr.getDM()?.with(pubkey); // SOLID DM Module

// Automatische Features:
// 1. Gift Wrap Subscription wird gestartet
// 2. Auto-subscribe for message conversion
// 3. publishSigned() for gift wrap events

// Layer 1: core layer (if needed)
const giftWraps = nostr.query().kinds([1059]).execute();

// Schicht 0: Cache Access (Advanced)
const cache = nostr.getCache(); // Direkte Cache-Manipulation
```

## Lazy Loading & User Control

### Perfect User Control
DM subscriptions start only when needed:

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

## DM‑Ready Flow (Recommended order)

Um Race‑Conditions zu vermeiden und sofort eine funktionierende DM‑Inbox zu haben:

```ts
// 1) Verbinden (optional vor Signer)
await nostr.connect();

// 2) Signer initialisieren (Extension oder Local)
await nostr.initializeSigning(provider);

// 3) Erste DM nutzen → startet Lazy Gift Wrap Subscription
const chat = nostr.getDM()?.with(recipientHexOrNpub);
```

Note: `getDM()` can be `undefined` before successful signer initialization. After `initializeSigning()` the DM API is available and first use starts the inbox (lazy loading).

### Zero Technical Complexity
Users never need to know about:
- ❌ `kind: 1059` (gift wraps)
- ❌ `kind: 14` (DM events)  
- ❌ NIP-17, NIP-44, NIP-59 details
- ❌ Gift wrap subscriptions
- ❌ Cache transformations

Everything happens automatically in the background.

### Performance Benefits
- No wasted subscriptions
- Automatic cleanup
- Privacy by design

## Sending Messages

### Simple Messages (signer‑based)

```typescript
// Get conversation (auto-subscribes for message conversion)
const chat = nostr.getDM()?.with('pubkey-here');

// Send encrypted message (signer executes NIP-44; no raw keys in code)
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

## Rumor‑ID vs. Wrap‑ID (for debugging)

- Gift‑wrap events (kind 1059) have their own event ID (wrap ID). After successful decryption, the contained rumor (kind 13) is normalized to a DM event (kind 14) with its own ID (rumor/DM ID).
- Consequence: in stores/cache, kind‑14 DM events appear with different IDs than the corresponding kind‑1059 wraps. This is expected and spec‑compliant.
- Recommendation: for UI/threading always use kind‑14 events. Gift wraps are transport only and are cached regardless of decryption.

## API Reference

### Main DM Interface

```typescript
// Get DM Module (SOLID pattern)
nostr.getDM(): UniversalDMModule | undefined

// Start conversation (auto-subscribes)
nostr.getDM()?.with(pubkey: string): UniversalDMConversation

// Create multi-participant room
nostr.getDM()?.room(participants: string[], options?: RoomOptions): UniversalDMRoom
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
  senderPubkey: string;      // Original sender pubkey
  recipientPubkey: string;   // Recipient pubkey
  sender: string;            // Alias for senderPubkey (compatibility)
  status: 'sent' | 'sending' | 'failed' | 'received';
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

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Gift Wrap Events Not Arriving
**Problem**: Bob receives 0 messages while Alice sends successfully
**Root Causes**:
1. **Missing Tag Filters**: Check if `matchesFilter()` implements #p tag filtering
2. **Cache Storage**: Verify Gift Wraps are stored regardless of decryption
3. **Auto-Subscribe**: Ensure DMConversation auto-subscribes for conversion

**Solution**:
```typescript
// Verify subscription is active
const chat = nostr.getDM()?.with(bobPubkey);
// Auto-subscribe happens in constructor now!
```

#### Invalid Signature on Gift Wraps
**Problem**: "Event invalid signature" errors
**Root Cause**: `publish()` re-signs already signed Gift Wrap events
**Solution**: Use `publishSigned()` for pre-signed events:
```typescript
// WRONG - will re-sign and invalidate
await nostr.publish(giftWrapEvent);

// CORRECT - preserves ephemeral key signature
await nostr.publishSigned(giftWrapEvent);
```

#### Messages Not Converting
**Problem**: Events in cache but `messages` array empty
**Root Cause**: `convertEventsToMessages()` not being called
**Solution**: Fixed with auto-subscribe in DMConversation constructor

#### Hex Conversion Errors
**Problem**: Invalid ephemeral keys or corrupted encryption
**Root Cause**: Manual hex conversion instead of `bytesToHex()`
**Solution**: Always use noble library functions for crypto operations

### Debug Tools

```typescript
// Check Gift Wrap reception
const giftWraps = nostr.query().kinds([1059]).tags('p', [myPubkey]).execute();
console.log('Gift Wraps in cache:', giftWraps.current.length);

// Verify subscription
const sub = await nostr.sub().kinds([1059]).tags('p', [myPubkey]).execute();
sub.store.subscribe(events => console.log('Live Gift Wraps:', events.length));

// Manuelle Decryption (DEV-Hinweis)
// From v0.2.0 onward there is no raw key access. Decryption is done via signer (NIP-44)
// and handled automatically by the cache. For manual debugging prefer the tests under
// tests-v2/debug/* oder Signer-spezifische Tools. Ein direkter Private-Key-Workflow ist deprecated.
```

---

**Next Steps:**
- [Query Engine](../query/README.md) - Universal Cache query system
- [Stores](../stores/README.md) - Reactive data management  
- [Social Media](../social/README.md) - Profiles, contacts, reactions