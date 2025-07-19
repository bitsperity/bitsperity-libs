// NostrUnchained Core Types
export interface NostrUnchainedConfig {
  /** Default relays to connect to */
  readonly relays?: readonly string[];
  /** Connection timeout in milliseconds */
  readonly timeout?: number;
  /** Enable debug logging */
  readonly debug?: boolean;
  /** Retry configuration */
  readonly retry?: {
    readonly maxAttempts: number;
    readonly initialDelay: number;
    readonly maxDelay: number;
  };
  /** Resource limits */
  readonly limits?: {
    readonly maxConnections: number;
    readonly maxMessageHistory: number;
    readonly maxMemoryUsage: number;
  };
}

export interface NostrUnchainedConfigDefaults {
  readonly relays: readonly string[];
  readonly timeout: number;
  readonly debug: boolean;
  readonly retry: {
    readonly maxAttempts: number;
    readonly initialDelay: number;
    readonly maxDelay: number;
  };
  readonly limits: {
    readonly maxConnections: number;
    readonly maxMessageHistory: number;
    readonly maxMemoryUsage: number;
  };
}

// Signer Management Types
export interface SignerCapabilities {
  readonly canSign: boolean;
  readonly canEncrypt: boolean;
  readonly canDecrypt: boolean;
  readonly supportsNip07: boolean;
  readonly supportsNip44: boolean;
}

export interface SignerInfo {
  readonly type: 'nip07' | 'temporary' | 'external';
  readonly pubkey: string;
  readonly capabilities: SignerCapabilities;
  readonly metadata?: Record<string, unknown>;
}

export interface Signer {
  readonly info: SignerInfo;
  initialize(): Promise<void>;
  getPublicKey(): Promise<string>;
  signEvent(event: Partial<NostrEvent>): Promise<NostrEvent>;
  encrypt?(plaintext: string, recipientPubkey: string): Promise<string>;
  decrypt?(ciphertext: string, senderPubkey: string): Promise<string>;
  cleanup?(): Promise<void>;
}

// Nostr Event Types
export interface NostrEvent {
  readonly id: string;
  readonly pubkey: string;
  readonly created_at: number;
  readonly kind: number;
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
  readonly sig: string;
}

export interface NostrEventPartial {
  readonly kind: number;
  readonly tags?: readonly (readonly string[])[];
  readonly content: string;
  readonly created_at?: number;
}

// Error Types
export abstract class NostrUnchainedError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'config' | 'signer' | 'network' | 'crypto';
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ConfigurationError extends NostrUnchainedError {
  readonly code = 'CONFIG_ERROR';
  readonly category = 'config' as const;
}

export class SignerError extends NostrUnchainedError {
  readonly code = 'SIGNER_ERROR';
  readonly category = 'signer' as const;
}

export class NetworkError extends NostrUnchainedError {
  readonly code = 'NETWORK_ERROR';
  readonly category = 'network' as const;
}

export class CryptoError extends NostrUnchainedError {
  readonly code = 'CRYPTO_ERROR';
  readonly category = 'crypto' as const;
}

// Lifecycle Management
export interface Disposable {
  dispose(): Promise<void>;
}

export interface ResourceManager extends Disposable {
  readonly isDisposed: boolean;
  addResource(resource: Disposable): void;
  removeResource(resource: Disposable): void;
}

// Event Bus Types
export interface EventBus {
  on<T = unknown>(event: string, listener: (data: T) => void): void;
  off<T = unknown>(event: string, listener: (data: T) => void): void;
  emit<T = unknown>(event: string, data: T): void;
  dispose(): Promise<void>;
}

// Builder Pattern Types
export interface NostrUnchainedBuilder {
  withRelays(relays: readonly string[]): NostrUnchainedBuilder;
  withTimeout(timeout: number): NostrUnchainedBuilder;
  withDebug(debug: boolean): NostrUnchainedBuilder;
  withRetry(retry: NostrUnchainedConfig['retry']): NostrUnchainedBuilder;
  withLimits(limits: NostrUnchainedConfig['limits']): NostrUnchainedBuilder;
  create(): Promise<NostrUnchained>;
}

// Forward declarations for Phase 3 types
export interface StoreManager {
  getConversationStore(conversationId: string): DMConversationStore;
  dispose(): Promise<void>;
}

export interface DMConversationStore {
  readonly conversationId: string;
  subscribe(callback: (state: any) => void): () => void;
}

// Main NostrUnchained Interface
export interface NostrUnchained extends Disposable {
  readonly config: NostrUnchainedConfigDefaults;
  readonly signer: Signer | null;
  readonly isInitialized: boolean;
  readonly eventBus: EventBus;
  readonly storeManager: StoreManager | null;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  
  // Phase 3 Store System
  getConversation(conversationId: string): DMConversationStore | null;
  sendMessage(conversationId: string, content: string): Promise<NostrEvent | null>;
}

// NostrUnchained constructor function type
export interface NostrUnchainedConstructor {
  new (config?: NostrUnchainedConfig): NostrUnchained;
  builder(): NostrUnchainedBuilder;
}

// Phase 3 Store Types - Re-export from stores module
export type { 
  ConversationState, 
  ConversationStoreConfig,
  DMConversation,
  MessageHistory,
  StoreMetrics 
} from '../stores/types';