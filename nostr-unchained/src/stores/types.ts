import type { Readable } from 'svelte/store';
import type { NostrEvent } from '@/types';

/**
 * Core conversation state interface for reactive stores
 */
export interface ConversationState {
  readonly conversationId: string;
  readonly messages: readonly NostrEvent[];
  readonly unreadCount: number;
  readonly lastMessage: NostrEvent | null;
  readonly lastActivity: number;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly participants: readonly string[]; // pubkeys
}

/**
 * Configuration for conversation store behavior
 */
export interface ConversationStoreConfig {
  readonly maxMessages: number;
  readonly autoCleanup: boolean;
  readonly persistState: boolean;
  readonly syncAcrossTabs: boolean;
  readonly debounceMs: number;
}

/**
 * Default configuration for conversation stores
 */
export const DEFAULT_CONVERSATION_CONFIG: ConversationStoreConfig = {
  maxMessages: 1000,
  autoCleanup: true,
  persistState: true,
  syncAcrossTabs: true,
  debounceMs: 16 // 60fps for smooth UI
};

/**
 * Message ordering and indexing for efficient access
 */
export interface MessageIndex {
  readonly byId: Map<string, NostrEvent>;
  readonly byTimestamp: NostrEvent[];
  readonly byAuthor: Map<string, NostrEvent[]>;
}

/**
 * Cross-tab synchronization message types
 */
export interface SyncMessage {
  readonly type: 'conversation_update' | 'message_added' | 'message_removed' | 'state_reset';
  readonly conversationId: string;
  readonly timestamp: number;
  readonly payload?: unknown;
}

/**
 * Memory management interface for LRU message history
 */
export interface MessageHistory {
  readonly size: number;
  readonly maxSize: number;
  addMessage(message: NostrEvent): void;
  removeMessage(messageId: string): boolean;
  getMessages(limit?: number): readonly NostrEvent[];
  clear(): void;
  has(messageId: string): boolean;
}

/**
 * Store subscription tracking for cleanup
 */
export interface StoreSubscription {
  readonly id: string;
  readonly conversationId: string;
  readonly unsubscribe: () => void;
  readonly createdAt: number;
}

/**
 * Performance metrics for store operations
 */
export interface StoreMetrics {
  updateLatency: number;
  messageCount: number;
  memoryUsage: number;
  syncLatency: number;
  subscriptionCount: number;
}

/**
 * Core DMConversation store interface extending Svelte Readable
 */
export interface DMConversation extends Readable<ConversationState> {
  readonly conversationId: string;
  readonly config: ConversationStoreConfig;
  readonly metrics: StoreMetrics;
  
  // Message management
  addMessage(message: NostrEvent): Promise<void>;
  removeMessage(messageId: string): Promise<boolean>;
  updateMessage(messageId: string, updates: Partial<NostrEvent>): Promise<boolean>;
  
  // State management
  markAsRead(): Promise<void>;
  setLoading(loading: boolean): void;
  setError(error: Error | null): void;
  
  // History and pagination
  getMessageHistory(limit?: number): readonly NostrEvent[];
  loadEarlierMessages(before?: number, limit?: number): Promise<NostrEvent[]>;
  
  // Lifecycle
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  reset(): Promise<void>;
}

/**
 * Store manager for multiple conversations
 */
export interface ConversationStoreManager {
  readonly conversations: Map<string, DMConversation>;
  
  // Store lifecycle
  getConversation(conversationId: string): DMConversation;
  createConversation(conversationId: string, config?: Partial<ConversationStoreConfig>): DMConversation;
  removeConversation(conversationId: string): Promise<boolean>;
  
  // Bulk operations
  getAllConversations(): readonly DMConversation[];
  clearAllConversations(): Promise<void>;
  
  // Cross-tab sync
  enableCrossTabSync(): void;
  disableCrossTabSync(): void;
  
  // Cleanup
  dispose(): Promise<void>;
}

/**
 * Store event types for event bus integration
 */
export type StoreEventType = 
  | 'conversation:created'
  | 'conversation:updated' 
  | 'conversation:disposed'
  | 'message:added'
  | 'message:removed'
  | 'message:updated'
  | 'sync:state_updated'
  | 'sync:tab_connected'
  | 'sync:tab_disconnected';

/**
 * Store event payload interface
 */
export interface StoreEvent<T = unknown> {
  readonly type: StoreEventType;
  readonly conversationId: string;
  readonly timestamp: number;
  readonly payload: T;
}

/**
 * Error types specific to store operations
 */
export class StoreError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly conversationId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'StoreError';
  }
}

export class MessageNotFoundError extends StoreError {
  constructor(messageId: string, conversationId: string) {
    super(
      `Message ${messageId} not found in conversation ${conversationId}`,
      'MESSAGE_NOT_FOUND',
      conversationId
    );
  }
}

export class ConversationNotFoundError extends StoreError {
  constructor(conversationId: string) {
    super(
      `Conversation ${conversationId} not found`,
      'CONVERSATION_NOT_FOUND',
      conversationId
    );
  }
}

export class StoreSyncError extends StoreError {
  constructor(conversationId: string, cause: Error) {
    super(
      `Cross-tab sync failed for conversation ${conversationId}`,
      'SYNC_ERROR',
      conversationId,
      cause
    );
  }
} 