/**
 * Core TypeScript interfaces for Nostr Unchained
 * 
 * These types are driven by test requirements and NIP compliance.
 */

// Re-export cache statistics for developer convenience
export type { CacheStatistics } from '../cache/UniversalEventCache.js';

// NIP-01: Basic Event Structure
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

// Configuration
export interface NostrUnchainedConfig {
  relays?: string[];
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  signingProvider?: SigningProvider;
}

// Publishing Results
export interface PublishResult {
  success: boolean;
  eventId?: string | undefined;
  event?: NostrEvent | undefined;
  relayResults: RelayResult[];
  timestamp: number;
  error?: NostrError | undefined;
  debug?: DebugInfo | undefined;
}

export interface RelayResult {
  relay: string;
  success: boolean;
  error?: string;
  latency?: number;
}

// Error Handling
export interface NostrError {
  message: string;
  suggestion?: string;
  retryable: boolean;
  userAction?: string;
}

// Debug Information
export interface DebugInfo {
  connectionAttempts?: number;
  relayLatencies?: Record<string, number>;
  totalTime?: number;
  signingMethod?: 'extension' | 'temporary';
}

// NIP-11: Relay Information
export interface RelayInfo {
  name?: string;
  description?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
}

// Signing Provider Interface
export interface SigningProvider {
  getPublicKey(): Promise<string>;
  getPublicKeySync?(): string | null; // Optional synchronous access
  signEvent(event: UnsignedEvent): Promise<string>;
  // Optional NIP-44 capabilities
  nip44Encrypt?(peerPubkey: string, plaintext: string): Promise<string>;
  nip44Decrypt?(peerPubkey: string, ciphertext: string): Promise<string>;
  // Capability discovery
  capabilities?(): Promise<{ nip44Encrypt: boolean; nip44Decrypt: boolean }>;
}

// NIP-07: Browser Extension Interface
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: UnsignedEvent): Promise<NostrEvent>;
      nip44?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      }
    };
  }
}

// Event Validation
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// WebSocket Message Types (NIP-01)
export type ClientMessage = 
  | ['EVENT', NostrEvent]
  | ['REQ', string, ...Filter[]]
  | ['CLOSE', string];

export type RelayMessage =
  | ['EVENT', string, NostrEvent]
  | ['OK', string, boolean, string]
  | ['EOSE', string]
  | ['NOTICE', string];

// Filter interface (for subscriptions)
export interface Filter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: string]: any; // For tag filters like #e, #p
}

// Subscription Management Types (Milestone 2)
export interface Subscription {
  id: string;
  filters: Filter[];
  relays: string[];
  state: SubscriptionState;
  createdAt: number;
  lastEventAt?: number;
  eventCount: number;
  onEvent?: (event: NostrEvent) => void;
  onEose?: (relay: string) => void;
  onClose?: (reason?: string) => void;
}

export type SubscriptionState = 
  | 'pending'    // Created but not yet sent to relays
  | 'active'     // Sent to relays, receiving events
  | 'eose'       // End of stored events reached
  | 'closed'     // Explicitly closed
  | 'error';     // Failed due to error

export interface SubscriptionOptions {
  relays?: string[];           // Specific relays to subscribe to
  onEvent?: (event: NostrEvent) => void;
  onEose?: (relay: string) => void;
  onClose?: (reason?: string) => void;
  autoClose?: boolean;         // Auto-close after EOSE
  timeout?: number;            // Subscription timeout in ms
}

export interface SubscriptionResult {
  subscription: Subscription;
  success: boolean;
  relayResults: SubscriptionRelayResult[];
  error?: NostrError;
}

export interface SubscriptionRelayResult {
  relay: string;
  success: boolean;
  error?: string;
  subscriptionId?: string;
}

// Event Query Builder Types - Updated for Day 2 implementation
export interface QueryBuilder<T extends NostrEvent = NostrEvent> {
  // Basic filter methods
  kinds<K extends number>(kinds: K[]): QueryBuilder<NostrEvent & { kind: K }>;
  authors(authors: string[]): QueryBuilder<T>;
  ids(ids: string[]): QueryBuilder<T>;
  since(timestamp: number): QueryBuilder<T>;
  until(timestamp: number): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  
  // Advanced filter methods
  tags(name: string, values: string[]): QueryBuilder<T>;
  search(query: string): QueryBuilder<T>;
  
  // Query composition
  union<U extends NostrEvent>(other: QueryBuilder<U>): QueryBuilder<T | U>;
  intersect(other: QueryBuilder<T>): QueryBuilder<T>;
  
  // Compilation and execution
  toFilter(): Filter[];
  execute(options?: SubscriptionOptions): Promise<T[]>;
  subscribe(options?: SubscriptionOptions): Promise<SubscriptionResult>;
  
  // Validation
  validate(): { valid: boolean; errors: string[] };
}

// Store Types (Svelte integration)
export interface FeedStore {
  subscribe: (run: (events: NostrEvent[]) => void) => () => void;
  events: NostrEvent[];
  isLoading: boolean;
  hasError: boolean;
  error?: NostrError;
  refresh(): Promise<void>;
  close(): void;
}