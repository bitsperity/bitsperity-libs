# Nostr Unchained - API Specification

## API Design Philosophy

### Core Principles
1. **Builder Pattern Everywhere**: Fluent, chainable APIs für maximale Entdeckbarkeit
2. **Natural Language Business Logic**: Code liest sich wie englische Geschäftsregeln
3. **Smart Defaults + Escape Hatches**: Zero-Config funktioniert, Profis können überschreiben
4. **Progressive Disclosure**: Einfache Cases bleiben einfach, komplexe werden möglich
5. **Reactive by Design**: Svelte Store Integration für Real-Time-Updates

### Method Naming Strategy: Hybrid Pattern
```typescript
nostr.dm.with(pubkey).send("test");           // Context-first für häufige Operationen
nostr.events.create().kind(1).content("test"); // Resource-first für Event-Building
nostr.query().kinds([1]).execute();           // Action-first für Queries
```

## Core APIs

### Primary Interface: NostrUnchained Class

#### Initialization
```typescript
// Zero-Config (Smart Defaults)
const nostr = new NostrUnchained();

// Mit Konfiguration für Profis
const nostr = new NostrUnchained({
  relays: ['wss://relay.damus.io', 'wss://nos.lol'],
  timeout: 5000,
  cache: true,
  signer: customSigner
});
```

#### Core Modules
```typescript
interface NostrUnchained {
  // Direct Messages
  dm: DMModule;
  
  // Event Publishing  
  events: EventModule;
  
  // Complex Queries
  query(): QueryBuilder;
  subgraph(): SubgraphBuilder;
  
  // Simple Publishing
  publish(content: string, options?: PublishOptions): Promise<PublishResult>;
  
  // Utilities
  profile: ProfileModule;
  relays: RelayModule;
}
```

### DM Module: Direct Messages Made Simple

#### Basic Usage
```typescript
// Conversation Store (Reactive)
const conversation = nostr.dm.with('npub1234...');

// Access reactive data
$: {
  console.log('Messages:', $conversation.messages);
  console.log('Status:', $conversation.status);
  console.log('Latest:', $conversation.latest);
}

// Send message
await conversation.send("Hello!");
```

### Event Module: Publishing Made Elegant

#### Fluent Event Builder
```typescript
// Step-by-step building
const event = await nostr.events.create()
  .kind(1)
  .content("Hello Nostr!")
  .tag('t', 'introduction')
  .replyTo(originalEventId)
  .sign()
  .publish();

// Job posting example
const jobEvent = await nostr.events.create()
  .kind(30023)
  .content("Looking for TypeScript developer")
  .tag('t', 'jobs')
  .tag('location', 'remote')
  .tag('d', 'unique-job-id')
  .publish();
```

### Query Builder: Simple Queries

#### Basic Event Queries
```typescript
// Simple kind query
const posts = await nostr.query()
  .kinds([1])
  .authors(['npub1234...'])
  .limit(50)
  .execute();

// Tag-based queries
const jobPosts = await nostr.query()
  .kinds([30023])
  .tags('#t', ['jobs'])
  .execute();
```

### Subgraph Builder: Complex Event Relationships

#### Business Logic Queries
```typescript
// Active jobs (exclude finished ones)
const activeJobs = await nostr.subgraph()
  .startFrom({kind: 30023, tags: {t: 'jobs'}})
  .excludeWhen()
    .hasChild()
    .kind(1)
    .content(['finished', 'aborted'])
    .authorMustBe('root.author')
  .execute();

// Popular posts (with many reactions)  
const popularPosts = await nostr.subgraph()
  .startFrom({kind: 1, authors: followingList})
  .includeWhen()
    .hasChild()
    .kind(7) // reactions
    .countGreaterThan(10)
  .include({
    replies: {kind: 1, referencesRoot: true},
    reactions: {kind: 7, referencesRoot: true}
  })
  .execute();
```

## Usage Patterns

### Getting Started (First 5 Minutes)

#### 1. Installation & Setup
```bash
npm install nostr-unchained
```

#### 2. Send First DM
```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
const conversation = nostr.dm.with('npub1234...');
await conversation.send("Hello from Nostr Unchained!");
```

#### 3. Reactive UI Updates
```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  const conversation = nostr.dm.with('npub1234...');
</script>

{#each $conversation.messages as message}
  <div class="message">{message.content}</div>
{/each}
```

### Common Use Cases

#### Job Board Application
```typescript
// Get active job listings
const activeJobs = await nostr.subgraph()
  .startFrom({kind: 30023, tags: {t: 'jobs'}})
  .excludeWhen()
    .hasChild()
    .content(['finished'])
    .authorMustBe('root.author')
  .include({
    applications: {kind: 1, referencesRoot: true},
    employer: {kind: 0, authors: 'root.author'}
  })
  .execute();
```

#### Social Feed with Relations
```typescript
// Complex social feed
const feedWithContext = await nostr.subgraph()
  .startFrom({kind: 1, authors: followingList})
  .include({
    replies: {kind: 1, referencesRoot: true, limit: 3},
    reactions: {kind: 7, referencesRoot: true},
    authorProfiles: {kind: 0, authors: 'root.author'}
  })
  .execute();

// Access structured data
$: posts = $feedWithContext.events;
$: replies = $feedWithContext.replies;
$: reactions = $feedWithContext.reactions;
```

## Error Handling Philosophy

### Result-based Error Handling
```typescript
// Explicit error handling
const result = await nostr.dm.send("Hello!");
if (result.error) {
  console.log('Failed relays:', result.error.failedRelays);
  console.log('Successful relays:', result.error.successfulRelays);
  
  // Retry logic
  if (result.error.retryable) {
    await retryWithExponentialBackoff(() => nostr.dm.send("Hello!"));
  }
}
```

### Error Types
```typescript
interface NostrError {
  type: 'network' | 'validation' | 'auth' | 'timeout' | 'relay';
  message: string;
  code: string;
  retryable: boolean;
  context?: {
    relay?: string;
    event?: NostrEvent;
    operation?: string;
  };
}
```

## Integration Patterns

### SvelteKit Integration
```typescript
// stores.ts
import { NostrUnchained } from 'nostr-unchained';
import { browser } from '$app/environment';

export const nostr = browser ? new NostrUnchained() : null;

// +page.svelte
<script>
  import { nostr } from '$lib/stores';
  
  const conversation = nostr?.dm.with('npub1234...');
</script>

{#if conversation}
  {#each $conversation.messages as message}
    <div>{message.content}</div>
  {/each}
{/if}
```

## Extensibility Model

### Plugin Architecture
```typescript
interface NostrPlugin {
  name: string;
  install(nostr: NostrUnchained): void;
  uninstall?(nostr: NostrUnchained): void;
}

// Plugin development
export const analyticsPlugin: NostrPlugin = {
  name: 'analytics',
  install(nostr) {
    nostr.analytics = {
      track: (event: string, data: any) => {
        // Analytics implementation
      }
    };
    
    // Hook into events
    nostr.on('publish', (event) => {
      nostr.analytics.track('event_published', { kind: event.kind });
    });
  }
};
```

## Usage Patterns

### Getting Started (First 5 Minutes)

#### 1. Installation & Setup
```bash
npm install nostr-unchained
```

```typescript
import { NostrUnchained } from 'nostr-unchained';

const nostr = new NostrUnchained();
```

#### 2. Send First DM
```typescript
const conversation = nostr.dm.with('npub1234...');
await conversation.send("Hello from Nostr Unchained!");
console.log('DM sent successfully!');
```

#### 3. Reactive UI Updates
```svelte
<script>
  import { NostrUnchained } from 'nostr-unchained';
  
  const nostr = new NostrUnchained();
  const conversation = nostr.dm.with('npub1234...');
</script>

{#each $conversation.messages as message}
  <div class="message">
    {message.content}
  </div>
{/each}
```

### Common Use Cases

#### 1. Chat Application
```typescript
// Multi-user chat setup
const conversations = new Map();

async function startChat(pubkey: string) {
  const conversation = nostr.dm.with(pubkey);
  conversations.set(pubkey, conversation);
  
  // Auto-scroll on new messages
  conversation.subscribe(state => {
    if (state.latest) {
      scrollToBottom();
    }
  });
  
  return conversation;
}

// Send message with typing indicator
async function sendMessage(pubkey: string, content: string) {
  const conversation = conversations.get(pubkey);
  return await conversation.send(content);
}
```

#### 2. Job Board Application
```typescript
// Get active job listings
const activeJobs = await nostr.subgraph()
  .startFrom({kind: 30023, tags: {t: 'jobs'}})
  .excludeWhen()
    .hasChild()
    .kind(1)
    .content(['finished', 'closed'])
    .authorMustBe('root.author')
  .include({
    applications: {kind: 1, referencesRoot: true},
    employer: {kind: 0, authors: 'root.author'}
  })
  .execute();

// Post new job
const jobPosting = await nostr.events.create()
  .kind(30023)
  .content("Looking for a TypeScript developer...")
  .tag('t', 'jobs')
  .tag('location', 'remote')
  .tag('salary', '100k-150k')
  .tag('d', generateUniqueId())
  .sign()
  .publish();
```

#### 3. Social Feed with Relations
```typescript
// Complex social feed
const feedWithContext = await nostr.subgraph()
  .startFrom({kind: 1, authors: followingList})
  .include({
    replies: {
      kind: 1, 
      referencesRoot: true,
      limit: 3 // Max 3 replies per post
    },
    reactions: {
      kind: 7,
      referencesRoot: true,
      groupBy: 'content' // Group by reaction type
    },
    authorProfiles: {
      kind: 0,
      authors: 'root.author'
    }
  })
  .execute();

// Access structured data
$: posts = $feedWithContext.events;
$: replies = $feedWithContext.replies;
$: reactions = $feedWithContext.reactions;
$: profiles = $feedWithContext.authorProfiles;
```

### Advanced Scenarios

#### 1. Custom Signer Integration
```typescript
// Hardware wallet signer
import { HardwareWalletSigner } from './signers';

const nostr = new NostrUnchained({
  signer: new HardwareWalletSigner({
    device: 'ledger',
    derivationPath: "m/44'/1237'/0'/0/0"
  })
});

// Extension signer (NIP-07)
const nostr = new NostrUnchained({
  signer: 'extension' // Auto-detect browser extension
});
```

#### 2. Performance Optimization
```typescript
// Batch publishing
const events = [
  nostr.events.create().kind(1).content("Post 1"),
  nostr.events.create().kind(1).content("Post 2"),
  nostr.events.create().kind(1).content("Post 3")
];

const results = await nostr.publishBatch(events);

// Streaming queries for large datasets
const jobStream = nostr.query()
  .kinds([30023])
  .tags('#t', ['jobs'])
  .stream(); // Returns AsyncIterable

for await (const batch of jobStream) {
  processJobBatch(batch);
}
```

#### 3. Plugin System
```typescript
// Custom NIP implementation
import { NostrUnchained, definePlugin } from 'nostr-unchained';

const customNIPPlugin = definePlugin({
  name: 'custom-nip',
  install(nostr) {
    nostr.customNIP = {
      async doSomething() {
        // Custom functionality
      }
    };
  }
});

const nostr = new NostrUnchained({
  plugins: [customNIPPlugin]
});
```

## Error Handling Philosophy

### Result-based Error Handling
```typescript
// Explicit error handling
const result = await nostr.dm.send("Hello!");
if (result.error) {
  console.log('Failed relays:', result.error.failedRelays);
  console.log('Successful relays:', result.error.successfulRelays);
  
  // Retry logic
  if (result.error.retryable) {
    await retryWithExponentialBackoff(() => nostr.dm.send("Hello!"));
  }
}
```

### Error Types
```typescript
interface NostrError {
  type: 'network' | 'validation' | 'auth' | 'timeout' | 'relay';
  message: string;
  code: string;
  retryable: boolean;
  context?: {
    relay?: string;
    event?: NostrEvent;
    operation?: string;
  };
}
```

### Graceful Degradation
```typescript
// Fallback strategies
const result = await nostr.query()
  .kinds([1])
  .authors(['npub1234...'])
  .fallbackTo(['wss://backup.relay']) // Backup relays
  .timeout(5000)
  .retries(3)
  .execute();

// Partial success handling
if (result.partial) {
  console.log('Got results from:', result.successfulRelays);
  console.log('Failed relays:', result.failedRelays);
  // Continue with partial results
}
```

## Integration Patterns

### SvelteKit Integration
```typescript
// stores.ts
import { NostrUnchained } from 'nostr-unchained';
import { browser } from '$app/environment';

export const nostr = browser ? new NostrUnchained() : null;

// +layout.svelte
<script>
  import { nostr } from '$lib/stores';
  import { onMount } from 'svelte';
  
  onMount(async () => {
    if (nostr) {
      await nostr.connect();
    }
  });
</script>

// +page.svelte
<script>
  import { nostr } from '$lib/stores';
  
  const conversation = nostr?.dm.with('npub1234...');
</script>

{#if conversation}
  {#each $conversation.messages as message}
    <div>{message.content}</div>
  {/each}
{/if}
```

### Vite/Rollup Integration
```javascript
// vite.config.js
export default {
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    include: ['nostr-unchained']
  }
};
```

## Extensibility Model

### Plugin Architecture
```typescript
interface NostrPlugin {
  name: string;
  install(nostr: NostrUnchained): void;
  uninstall?(nostr: NostrUnchained): void;
}

// Plugin development
export const analyticsPlugin: NostrPlugin = {
  name: 'analytics',
  install(nostr) {
    nostr.analytics = {
      track: (event: string, data: any) => {
        // Analytics implementation
      }
    };
    
    // Hook into events
    nostr.on('publish', (event) => {
      nostr.analytics.track('event_published', { kind: event.kind });
    });
  }
};
```

### Custom Event Types
```typescript
// Define custom event type
const jobEventType = nostr.defineEventType({
  kind: 30023,
  validate: (event) => {
    return event.tags.some(tag => tag[0] === 't' && tag[1] === 'jobs');
  },
  serialize: (jobData) => ({
    kind: 30023,
    content: jobData.description,
    tags: [
      ['t', 'jobs'],
      ['location', jobData.location],
      ['salary', jobData.salary]
    ]
  })
});

// Use custom type
const job = await nostr.events.create(jobEventType)
  .data({
    description: "TypeScript developer needed",
    location: "remote", 
    salary: "100k-150k"
  })
  .publish();
``` 