import { readable, type Subscriber, type Unsubscriber } from 'svelte/store';
import type { NostrEvent, EventBus } from '@/types';
import type { 
  DMConversation, 
  ConversationState, 
  ConversationStoreConfig,
  StoreMetrics,
  StoreEvent
} from './types';
import { DEFAULT_CONVERSATION_CONFIG } from './types';
import { StoreError, MessageNotFoundError, StoreSyncError } from './types';
import { LRUMessageHistory } from './message-history';
import { CrossTabSync, createCrossTabSync } from './cross-tab-sync';

/**
 * DMConversation Store implementing Svelte Readable for native reactivity
 * Provides $conversation.messages syntax with automatic cleanup and cross-tab sync
 */
export class DMConversationStore implements DMConversation {
  private readonly _config: ConversationStoreConfig;
  private readonly _history: LRUMessageHistory;
  private readonly _eventBus: EventBus;
  private readonly _crossTabSync: CrossTabSync | null;
  
  private _state: ConversationState;
  private _subscribers = new Set<Subscriber<ConversationState>>();
  private _updateCounter = 0;
  private _lastUpdateTime = 0;
  private _isDisposed = false;
  private _debounceTimer: NodeJS.Timeout | null = null;

  // Performance metrics tracking
  private _metrics: StoreMetrics = {
    updateLatency: 0,
    messageCount: 0,
    memoryUsage: 0,
    syncLatency: 0,
    subscriptionCount: 0
  };

  constructor(
    public readonly conversationId: string,
    eventBus: EventBus,
    config: Partial<ConversationStoreConfig> = {}
  ) {
    if (!conversationId) {
      throw new StoreError('Conversation ID cannot be empty', 'INVALID_ID', '');
    }

    this._config = { ...DEFAULT_CONVERSATION_CONFIG, ...config };
    this._eventBus = eventBus;
    this._history = new LRUMessageHistory(this._config.maxMessages);
    
    // Initialize state
    this._state = {
      conversationId,
      messages: [],
      unreadCount: 0,
      lastMessage: null,
      lastActivity: Date.now(),
      isLoading: false,
      error: null,
      participants: []
    };

    // Setup cross-tab sync if enabled
    this._crossTabSync = this._config.syncAcrossTabs 
      ? createCrossTabSync(eventBus, `nostr-conversation-${conversationId}`)
      : null;

    if (this._crossTabSync) {
      this.setupCrossTabSync();
    }

    // Setup event bus listeners
    this.setupEventBusListeners();
  }

  // Svelte Readable interface implementation
  subscribe(run: Subscriber<ConversationState>): Unsubscriber {
    if (this._isDisposed) {
      throw new StoreError('Cannot subscribe to disposed store', 'STORE_DISPOSED', this.conversationId);
    }

    this._subscribers.add(run);
    this._metrics.subscriptionCount = this._subscribers.size;

    // Immediately call subscriber with current state
    run(this._state);

    // Return unsubscriber function
    return () => {
      this._subscribers.delete(run);
      this._metrics.subscriptionCount = this._subscribers.size;
    };
  }

  // Getters
  get config(): ConversationStoreConfig {
    return this._config;
  }

  get metrics(): StoreMetrics {
    return { ...this._metrics };
  }

  get state(): ConversationState {
    return this._state;
  }

  // Message management
  async addMessage(message: NostrEvent): Promise<void> {
    if (this._isDisposed) {
      throw new StoreError('Cannot add message to disposed store', 'STORE_DISPOSED', this.conversationId);
    }

    if (!message?.id) {
      throw new StoreError('Message must have valid ID', 'INVALID_MESSAGE', this.conversationId);
    }

    const startTime = performance.now();

    try {
      // Add to history (handles deduplication)
      this._history.addMessage(message);

      // Update participants if not already included
      const participants = new Set(this._state.participants);
      if (!participants.has(message.pubkey)) {
        participants.add(message.pubkey);
      }

      // Update state
      const newState: ConversationState = {
        ...this._state,
        messages: this._history.getMessages(),
        lastMessage: message,
        lastActivity: Math.max(message.created_at * 1000, this._state.lastActivity),
        participants: Array.from(participants),
        unreadCount: this._state.unreadCount + 1
      };

      this.updateState(newState);

      // Emit event
      this._eventBus.emit('message:added', {
        type: 'message:added',
        conversationId: this.conversationId,
        timestamp: Date.now(),
        payload: { messageId: message.id, message }
      } as StoreEvent);

      // Broadcast to other tabs
      if (this._crossTabSync) {
        this._crossTabSync.broadcastMessageAdded(this.conversationId, message.id);
      }

      // Update metrics
      this._metrics.updateLatency = performance.now() - startTime;
      this._metrics.messageCount = this._history.size;
      this._metrics.memoryUsage = this._history.getMemoryStats().approximateMemoryBytes;

    } catch (error) {
      this.setError(error instanceof Error ? error : new Error('Unknown error adding message'));
      throw error;
    }
  }

  async removeMessage(messageId: string): Promise<boolean> {
    if (this._isDisposed) {
      throw new StoreError('Cannot remove message from disposed store', 'STORE_DISPOSED', this.conversationId);
    }

    if (!messageId) {
      return false;
    }

    const removed = this._history.removeMessage(messageId);
    
    if (removed) {
      // Update state with new message list
      const messages = this._history.getMessages();
      const newState: ConversationState = {
        ...this._state,
        messages,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
        lastActivity: Date.now()
      };

      this.updateState(newState);

      // Emit event
      this._eventBus.emit('message:removed', {
        type: 'message:removed',
        conversationId: this.conversationId,
        timestamp: Date.now(),
        payload: { messageId }
      } as StoreEvent);

      // Broadcast to other tabs
      if (this._crossTabSync) {
        this._crossTabSync.broadcastMessageRemoved(this.conversationId, messageId);
      }

      this._metrics.messageCount = this._history.size;
    }

    return removed;
  }

  async updateMessage(messageId: string, updates: Partial<NostrEvent>): Promise<boolean> {
    if (this._isDisposed) {
      throw new StoreError('Cannot update message in disposed store', 'STORE_DISPOSED', this.conversationId);
    }

    const existingMessage = this._history.getMessage(messageId);
    if (!existingMessage) {
      throw new MessageNotFoundError(messageId, this.conversationId);
    }

    const updatedMessage: NostrEvent = {
      ...existingMessage,
      ...updates,
      id: existingMessage.id // Preserve original ID
    };

    // Re-add the updated message (LRU will handle replacement)
    this._history.addMessage(updatedMessage);

    // Update state
    const messages = this._history.getMessages();
    const newState: ConversationState = {
      ...this._state,
      messages,
      lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
      lastActivity: Date.now()
    };

    this.updateState(newState);

    // Emit event
    this._eventBus.emit('message:updated', {
      type: 'message:updated',
      conversationId: this.conversationId,
      timestamp: Date.now(),
      payload: { messageId, updates }
    } as StoreEvent);

    return true;
  }

  // State management
  async markAsRead(): Promise<void> {
    if (this._isDisposed) {
      return;
    }

    if (this._state.unreadCount > 0) {
      const newState: ConversationState = {
        ...this._state,
        unreadCount: 0,
        lastActivity: Date.now()
      };

      this.updateState(newState);
    }
  }

  setLoading(loading: boolean): void {
    if (this._isDisposed) {
      return;
    }

    if (this._state.isLoading !== loading) {
      const newState: ConversationState = {
        ...this._state,
        isLoading: loading
      };

      this.updateState(newState);
    }
  }

  setError(error: Error | null): void {
    if (this._isDisposed) {
      return;
    }

    const newState: ConversationState = {
      ...this._state,
      error,
      isLoading: false // Stop loading on error
    };

    this.updateState(newState);
  }

  // History and pagination
  getMessageHistory(limit?: number): readonly NostrEvent[] {
    return this._history.getMessages(limit);
  }

  async loadEarlierMessages(before?: number, limit?: number): Promise<NostrEvent[]> {
    // This would typically load from relay - placeholder for Phase 5 integration
    // For now, return empty array
    this.setLoading(true);
    
    try {
      // TODO: Implement relay loading in Phase 5
      const messages: NostrEvent[] = [];
      
      this.setLoading(false);
      return messages;
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error('Failed to load earlier messages'));
      return [];
    }
  }

  // Lifecycle
  async initialize(): Promise<void> {
    if (this._isDisposed) {
      throw new StoreError('Cannot initialize disposed store', 'STORE_DISPOSED', this.conversationId);
    }

    // Start cross-tab sync
    if (this._crossTabSync) {
      this._crossTabSync.start();
    }

    // Emit initialized event
    this._eventBus.emit('conversation:created', {
      type: 'conversation:created',
      conversationId: this.conversationId,
      timestamp: Date.now(),
      payload: { config: this._config }
    } as StoreEvent);
  }

  async dispose(): Promise<void> {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    // Clear debounce timer
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    // Stop cross-tab sync
    if (this._crossTabSync) {
      this._crossTabSync.dispose();
    }

    // Clear subscribers
    this._subscribers.clear();

    // Clear history
    this._history.clear();

    // Emit disposed event
    this._eventBus.emit('conversation:disposed', {
      type: 'conversation:disposed',
      conversationId: this.conversationId,
      timestamp: Date.now(),
      payload: {}
    } as StoreEvent);
  }

  async reset(): Promise<void> {
    if (this._isDisposed) {
      throw new StoreError('Cannot reset disposed store', 'STORE_DISPOSED', this.conversationId);
    }

    // Clear history
    this._history.clear();

    // Reset state
    const newState: ConversationState = {
      conversationId: this.conversationId,
      messages: [],
      unreadCount: 0,
      lastMessage: null,
      lastActivity: Date.now(),
      isLoading: false,
      error: null,
      participants: []
    };

    this.updateState(newState);

    // Broadcast reset to other tabs
    if (this._crossTabSync) {
      this._crossTabSync.broadcastStateReset(this.conversationId);
    }

    // Reset metrics
    this._metrics.messageCount = 0;
    this._metrics.memoryUsage = 0;
  }

  // Private methods
  private updateState(newState: ConversationState): void {
    this._state = newState;
    this._lastUpdateTime = Date.now();
    this._updateCounter++;

    // Debounced notification to subscribers for performance
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this.notifySubscribers();
      this._debounceTimer = null;
    }, this._config.debounceMs);
  }

  private notifySubscribers(): void {
    if (this._isDisposed) {
      return;
    }

    const startTime = performance.now();

    this._subscribers.forEach(subscriber => {
      try {
        subscriber(this._state);
      } catch (error) {
        console.error('[DMConversation] Subscriber error:', error);
      }
    });

    // Update notification latency metric
    this._metrics.updateLatency = performance.now() - startTime;
  }

  private setupCrossTabSync(): void {
    if (!this._crossTabSync) {
      return;
    }

    // Subscribe to sync messages for this conversation
    this._crossTabSync.subscribe(this.conversationId, (syncMessage) => {
      try {
        switch (syncMessage.type) {
          case 'conversation_update':
            // Handle state update from other tab
            if (this._config.syncAcrossTabs) {
              this.handleCrossTabStateUpdate(syncMessage);
            }
            break;
          
          case 'message_added':
            // Could trigger reload from relay in Phase 5
            break;
          
          case 'message_removed':
            // Handle message removal from other tab
            break;
          
          case 'state_reset':
            // Handle reset from other tab
            if (this._config.syncAcrossTabs) {
              this.reset();
            }
            break;
        }
      } catch (error) {
        console.error('[DMConversation] Cross-tab sync error:', error);
        this.setError(new StoreSyncError(this.conversationId, error instanceof Error ? error : new Error('Sync error')));
      }
    });
  }

  private handleCrossTabStateUpdate(syncMessage: any): void {
    // Basic state synchronization - could be enhanced in Phase 5
    const payload = syncMessage.payload;
    if (payload?.state) {
      // Only sync non-message data to avoid conflicts
      const newState: ConversationState = {
        ...this._state,
        unreadCount: payload.state.unreadCount || this._state.unreadCount,
        lastActivity: Math.max(payload.state.lastActivity || 0, this._state.lastActivity)
      };

      this.updateState(newState);
    }
  }

  private setupEventBusListeners(): void {
    // Listen for global store events that might affect this conversation
    // This will be expanded in Phase 5 for relay integration
  }

  /**
   * Sync external state changes (for Store Manager coordination)
   */
  syncExternalState(externalState: Partial<ConversationState>): void {
    if (this._isDisposed) {
      console.warn('[DMConversation] Cannot sync external state - store is disposed');
      return;
    }

    const newState: ConversationState = {
      ...this._state,
      ...externalState,
      // Preserve critical local state
      conversationId: this._state.conversationId,
      lastActivity: Math.max(externalState.lastActivity || 0, this._state.lastActivity)
    };

    this.updateState(newState);
    
    console.log(`🔄 Synced external state for conversation: ${this.conversationId}`);
  }
} 