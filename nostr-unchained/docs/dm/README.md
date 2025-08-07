# 💬 Direct Messages Module

Das DM-Modul bietet 100% protokoll-konforme Ende-zu-Ende-verschlüsselte Nachrichten mit **NIP-17** (Private Direct Messages), **NIP-44 v2** (ChaCha20-Poly1305 Encryption) und **NIP-59** (Gift Wrap Protocol).

Basiert auf der **Subscription-First Universal Cache Architecture** mit SOLID-Prinzipien.

## 🔐 Kryptographische Excellence (100% NIP-Compliant)

- **3-Layer-Verschlüsselung**: Rumor → Seal → Gift Wrap (NIP-59)
- **NIP-44 v2 Compliance**: ChaCha20-Poly1305 mit HKDF Key Derivation
- **Perfect Forward Secrecy**: Ephemeral Keys mit publishSigned() Support
- **Gift Wrap Handling**: Automatische Kind 1059 Verarbeitung
- **Tag Filtering**: Vollständige #p Tag-Filterung für targeted Messages

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

## Subscription-First Cache Architecture

Das DM-System basiert auf der SOLID-implementierten 3-Schichten-Architektur:

### Schicht 0: Universal Event Cache
- **Subscription-First**: "Im Cache landen nur Sachen die subscribed werden"
- **Gift Wrap Storage**: Events werden unabhängig von Decryption Success gespeichert
- **Tag-basierte Filterung**: Vollständige #p, #e, #t Filter-Implementation

### Schicht 1: Core Layer (pub/sub/query/delete)
- **publish()**: Standard Event Publishing mit automatischem Signing
- **publishSigned()**: Spezielle Methode für pre-signed Gift Wrap Events
- **sub()**: Live Subscriptions die den Cache füllen
- **query()**: Sofortige Cache-Abfragen

### Schicht 2: High-Level DM Module
- **UniversalDMConversation**: Auto-Subscribe für Message Conversion
- **GiftWrapProtocol**: 3-Layer Encryption mit Ephemeral Keys
- **DMMessage Interface**: Einheitliche Message-Struktur mit sender Alias

```typescript
// Schicht 2: High-Level DM API
const chat = nostr.getDM()?.with(pubkey); // SOLID DM Module

// Automatische Features:
// 1. Gift Wrap Subscription wird gestartet
// 2. Auto-Subscribe für Message Conversion
// 3. publishSigned() für Gift Wrap Events

// Schicht 1: Core Layer (wenn benötigt)
const giftWraps = nostr.query().kinds([1059]).execute();

// Schicht 0: Cache Access (Advanced)
const cache = nostr.getCache(); // Direkte Cache-Manipulation
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
// Get conversation (auto-subscribes for message conversion)
const chat = nostr.getDM()?.with('pubkey-here');

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

// Test decryption manually
import { GiftWrapProtocol } from 'nostr-unchained';
const privateKey = await nostr.getPrivateKeyForEncryption();
const decrypted = await GiftWrapProtocol.decryptGiftWrappedDM(giftWrap, privateKey);
console.log('Decryption valid:', decrypted.isValid);
```

---

**Next Steps:**
- [Query Engine](../query/README.md) - Universal Cache query system
- [Stores](../stores/README.md) - Reactive data management  
- [Social Media](../social/README.md) - Profiles, contacts, reactions