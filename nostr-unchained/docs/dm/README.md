# 💬 Direct Messages Module

The DM module provides end-to-end encrypted private messaging using NIP-17 (Private Direct Messages) and NIP-44 (Versioned Encryption) with the Gift Wrap Protocol (NIP-59).

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Sending Messages](#sending-messages)
- [Conversations](#conversations)
- [Message Rooms](#message-rooms)
- [Security Features](#security-features)
- [API Reference](#api-reference)

## Quick Start

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();

// Send an encrypted DM
await nostr.dm.send({
  recipient: 'npub1alice...',
  content: 'Hello Alice! This message is end-to-end encrypted. 🔐'
});

// Start a conversation
const conversation = await nostr.dm.conversation('npub1alice...');
await conversation.send('How are you doing?');

// Listen for new messages
conversation.messages.subscribe(messages => {
  console.log(`Conversation has ${messages.length} messages`);
  messages.forEach(msg => {
    console.log(`${msg.direction}: ${msg.content}`);
  });
});
```

## How It Works

Nostr Unchained implements the **3-layer encryption system** from NIP-59:

### 1. **Rumor** (Unsigned Event)
The actual message content - never published directly to relays.

```typescript
const rumor = {
  kind: 14,
  content: "Hello Alice!",
  tags: [['p', 'alice-pubkey']],
  created_at: timestamp,
  pubkey: 'sender-pubkey'
  // No id or signature - it's unsigned
};
```

### 2. **Seal** (Kind 13)
The rumor encrypted with NIP-44 and signed by the real author.

```typescript
const seal = {
  kind: 13,
  content: "encrypted_rumor_base64...", // NIP-44 encrypted rumor
  tags: [], // Always empty
  pubkey: 'sender-pubkey',
  created_at: timestamp,
  id: '...',
  sig: '...' // Signed by real author
};
```

### 3. **Gift Wrap** (Kind 1059)
The seal encrypted again and signed with an ephemeral key.

```typescript
const giftWrap = {
  kind: 1059,
  content: "encrypted_seal_base64...", // NIP-44 encrypted seal
  tags: [['p', 'recipient-pubkey', 'relay-hint']],
  pubkey: 'ephemeral-pubkey', // Random key, used once
  created_at: randomized_timestamp, // Up to 2 days in past
  id: '...',
  sig: '...' // Signed by ephemeral key
};
```

This provides **perfect forward secrecy** and **metadata protection**.

## Sending Messages

### Simple Messages

```typescript
// Basic encrypted message
await nostr.dm.send({
  recipient: 'npub1alice...',
  content: 'Hey Alice! 👋'
});

// Message with custom timestamp
await nostr.dm.send({
  recipient: 'npub1bob...',
  content: 'This is important!',
  timestamp: Date.now() // Custom timestamp
});
```

### Advanced Messages

```typescript
// Message with reply context
await nostr.dm.send({
  recipient: 'npub1alice...',
  content: 'Re: your earlier message about Nostr...',
  replyTo: 'previous-message-event-id'
});

// Message with expiration
await nostr.dm.send({
  recipient: 'npub1bob...',
  content: 'This message self-destructs in 1 hour',
  expiration: Date.now() + (60 * 60 * 1000) // 1 hour from now
});

// Message with custom relay hints
await nostr.dm.send({
  recipient: 'npub1charlie...',
  content: 'Meeting at 3pm',
  relayHint: 'wss://relay.example.com'
});
```

### Batch Sending

```typescript
// Send to multiple recipients
const recipients = ['npub1alice...', 'npub1bob...', 'npub1charlie...'];

const results = await Promise.all(
  recipients.map(recipient => 
    nostr.dm.send({
      recipient,
      content: 'Group message: Meeting tomorrow at 2pm!'
    })
  )
);

console.log(`Sent to ${results.filter(r => r.success).length}/${recipients.length} recipients`);
```

## Conversations

Conversations provide a structured way to manage ongoing message exchanges:

### Creating Conversations

```typescript
// Start conversation with Alice
const conversation = await nostr.dm.conversation('npub1alice...');

// Send messages through the conversation
await conversation.send('Hello Alice!');
await conversation.send('How has your day been?');

// Get conversation metadata
console.log(`Conversation with: ${conversation.recipientPubkey}`);
console.log(`Message count: ${conversation.messageCount}`);
console.log(`Last activity: ${conversation.lastMessageAt}`);
```

### Message History

```typescript
// Get conversation history
const messages = await conversation.getMessages({
  limit: 50,
  since: '1 week ago'
});

messages.forEach(message => {
  console.log(`[${message.timestamp}] ${message.direction}: ${message.content}`);
});

// Paginate through older messages
const olderMessages = await conversation.getMessages({
  limit: 20,
  until: messages[messages.length - 1].timestamp
});
```

### Reactive Message Updates

```typescript
// Subscribe to new messages in conversation
const unsubscribe = conversation.messages.subscribe(messages => {
  const newMessages = messages.filter(m => m.isNew);
  
  if (newMessages.length > 0) {
    console.log(`${newMessages.length} new messages received`);
    
    newMessages.forEach(msg => {
      if (msg.direction === 'incoming') {
        console.log(`New message from ${msg.senderPubkey}: ${msg.content}`);
        
        // Mark as read
        conversation.markAsRead(msg.eventId);
      }
    });
  }
});

// Stop listening when done
unsubscribe();
```

### Conversation Management

```typescript
// Mark conversation as read
await conversation.markAsRead();

// Mark specific message as read
await conversation.markAsRead('message-event-id');

// Archive conversation
await conversation.archive();

// Delete conversation (local only)
await conversation.delete();

// Block user (stops receiving messages)
await conversation.block();
```

## Message Rooms

Rooms provide multi-participant encrypted group messaging:

### Creating Rooms

```typescript
// Create a private room
const room = await nostr.dm.room({
  name: 'Project Planning',
  participants: ['npub1alice...', 'npub1bob...', 'npub1charlie...'],
  isPrivate: true
});

// Send message to room
await room.send('Welcome to our project planning room!');

// Add new participant
await room.addParticipant('npub1dave...');
```

### Room Administration

```typescript
// Set room metadata
await room.updateMetadata({
  name: 'Updated Room Name',
  description: 'Planning our next project phase',
  picture: 'https://example.com/room-avatar.jpg'
});

// Manage participants
await room.addParticipant('npub1eve...');
await room.removeParticipant('npub1olduser...');

// Set admin privileges
await room.setAdmin('npub1alice...', true);

// Room settings
await room.updateSettings({
  allowInvites: false,        // Only admins can invite
  messageRetention: 30,       // Delete messages after 30 days
  maxParticipants: 50
});
```

### Room Messages

```typescript
// Listen for room messages
room.messages.subscribe(messages => {
  messages.forEach(msg => {
    console.log(`[${msg.senderName}]: ${msg.content}`);
  });
});

// Send different message types
await room.send('Regular message');
await room.send('🎉 Celebration message with emoji!');
await room.sendFile(fileBlob, 'document.pdf');
await room.sendImage(imageBlob, 'screenshot.png');
```

## Security Features

### Perfect Forward Secrecy

Every message uses unique ephemeral keys that are discarded after use:

```typescript
// Each message gets a new ephemeral key pair
const message1 = await nostr.dm.send({
  recipient: 'npub1alice...',
  content: 'Message 1'
}); // Uses ephemeral key A

const message2 = await nostr.dm.send({
  recipient: 'npub1alice...',
  content: 'Message 2'  
}); // Uses ephemeral key B (different from A)

// Even if key A is compromised, message 2 remains secure
```

### Metadata Protection

Gift wrap protocol hides message metadata:

```typescript
// Observer on relay sees:
const observedEvent = {
  kind: 1059,                    // Standard gift wrap
  pubkey: 'random-ephemeral-key', // Not linked to real author
  created_at: randomTimestamp,    // Randomized, not real time
  tags: [['p', 'recipient']],     // Only recipient is visible
  content: 'encrypted-data'       // No metadata leakage
};

// Real message metadata is hidden inside encryption
```

### Timestamp Randomization

Prevents timing correlation attacks:

```typescript
// Messages are backdated randomly
const actualTime = Date.now();
const giftWrapTime = actualTime - Math.random() * (2 * 24 * 60 * 60 * 1000); // Up to 2 days ago

console.log(`Real time: ${new Date(actualTime)}`);
console.log(`Gift wrap time: ${new Date(giftWrapTime)}`); // Earlier, randomized
```

### Key Rotation

Automatic key management for enhanced security:

```typescript
// Keys are automatically rotated
const conversation = await nostr.dm.conversation('npub1alice...');

// Send 10 messages - each uses different ephemeral keys
for (let i = 0; i < 10; i++) {
  await conversation.send(`Message ${i + 1}`);
}

// All 10 messages use different encryption keys
console.log('All messages encrypted with unique keys');
```

## API Reference

### DM Module

```typescript
// Main DM interface
nostr.dm.send(options: DMSendOptions): Promise<DMResult>
nostr.dm.conversation(pubkey: string): Promise<DMConversation>
nostr.dm.room(options: RoomOptions): Promise<DMRoom>
nostr.dm.getConversations(): Promise<DMConversation[]>
```

### DMSendOptions

```typescript
interface DMSendOptions {
  recipient: string;           // Recipient's npub or hex pubkey
  content: string;            // Message content
  timestamp?: number;         // Custom timestamp
  replyTo?: string;          // Event ID being replied to
  expiration?: number;       // Message expiration timestamp
  relayHint?: string;        // Preferred relay for recipient
}
```

### DMConversation

```typescript
class DMConversation {
  // Properties
  recipientPubkey: string;
  messageCount: number;
  lastMessageAt: Date;
  unreadCount: number;
  
  // Reactive stores
  messages: Readable<DMMessage[]>;
  
  // Methods
  send(content: string): Promise<DMResult>;
  getMessages(options?: MessageOptions): Promise<DMMessage[]>;
  markAsRead(eventId?: string): Promise<void>;
  archive(): Promise<void>;
  delete(): Promise<void>;
  block(): Promise<void>;
}
```

### DMRoom

```typescript
class DMRoom {
  // Properties
  roomId: string;
  name: string;
  participants: string[];
  isPrivate: boolean;
  
  // Reactive stores
  messages: Readable<RoomMessage[]>;
  
  // Methods
  send(content: string): Promise<DMResult>;
  addParticipant(pubkey: string): Promise<void>;
  removeParticipant(pubkey: string): Promise<void>;
  setAdmin(pubkey: string, isAdmin: boolean): Promise<void>;
  updateMetadata(metadata: RoomMetadata): Promise<void>;
  leave(): Promise<void>;
}
```

### Security Guarantees

- ✅ **End-to-End Encryption** - Only sender and recipient can read messages
- ✅ **Perfect Forward Secrecy** - Past messages safe even if keys compromised
- ✅ **Metadata Protection** - Message timing and patterns hidden
- ✅ **Deniable Authentication** - Can't prove who sent a message
- ✅ **Replay Protection** - Each message has unique encryption
- ✅ **Quantum Resistance** - Uses secure curve25519 + ChaCha20-Poly1305

---

**Next Steps:**
- [Social Media](../social/README.md) - Profiles, contacts, threads, reactions  
- [Query Engine](../query/README.md) - Find and subscribe to messages
- [Event Publishing](../events/README.md) - Create custom encrypted events