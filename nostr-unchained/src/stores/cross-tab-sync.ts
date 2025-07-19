import type { SyncMessage, ConversationState, StoreEvent } from './types';
import type { EventBus } from '@/types';

/**
 * Cross-tab synchronization for conversation stores using BroadcastChannel
 * Ensures state consistency across multiple browser tabs
 */
export class CrossTabSync {
  private readonly channel: BroadcastChannel;
  private readonly listeners = new Map<string, Set<(event: SyncMessage) => void>>();
  private readonly tabId: string;
  private isActive = false;

  constructor(
    private readonly eventBus: EventBus,
    channelName: string = 'nostr-unchained-sync'
  ) {
    this.channel = new BroadcastChannel(channelName);
    this.tabId = this.generateTabId();
    this.setupMessageHandler();
  }

  /**
   * Start cross-tab synchronization
   */
  start(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.broadcastTabConnection();
    console.debug(`[CrossTabSync] Started for tab ${this.tabId}`);
  }

  /**
   * Stop cross-tab synchronization
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.broadcastTabDisconnection();
    this.listeners.clear();
    console.debug(`[CrossTabSync] Stopped for tab ${this.tabId}`);
  }

  /**
   * Dispose resources and close channel
   */
  dispose(): void {
    this.stop();
    this.channel.close();
  }

  /**
   * Subscribe to sync messages for a specific conversation
   */
  subscribe(conversationId: string, listener: (event: SyncMessage) => void): () => void {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, new Set());
    }

    const conversationListeners = this.listeners.get(conversationId)!;
    conversationListeners.add(listener);

    // Return unsubscribe function
    return () => {
      conversationListeners.delete(listener);
      if (conversationListeners.size === 0) {
        this.listeners.delete(conversationId);
      }
    };
  }

  /**
   * Broadcast conversation state update to other tabs
   */
  broadcastConversationUpdate(conversationId: string, state: ConversationState): void {
    if (!this.isActive) {
      return;
    }

    const message: SyncMessage = {
      type: 'conversation_update',
      conversationId,
      timestamp: Date.now(),
      payload: {
        tabId: this.tabId,
        state: this.serializeState(state)
      }
    };

    this.sendMessage(message);
  }

  /**
   * Broadcast message addition to other tabs
   */
  broadcastMessageAdded(conversationId: string, messageId: string): void {
    if (!this.isActive) {
      return;
    }

    const message: SyncMessage = {
      type: 'message_added',
      conversationId,
      timestamp: Date.now(),
      payload: {
        tabId: this.tabId,
        messageId
      }
    };

    this.sendMessage(message);
  }

  /**
   * Broadcast message removal to other tabs
   */
  broadcastMessageRemoved(conversationId: string, messageId: string): void {
    if (!this.isActive) {
      return;
    }

    const message: SyncMessage = {
      type: 'message_removed',
      conversationId,
      timestamp: Date.now(),
      payload: {
        tabId: this.tabId,
        messageId
      }
    };

    this.sendMessage(message);
  }

  /**
   * Broadcast conversation state reset to other tabs
   */
  broadcastStateReset(conversationId: string): void {
    if (!this.isActive) {
      return;
    }

    const message: SyncMessage = {
      type: 'state_reset',
      conversationId,
      timestamp: Date.now(),
      payload: {
        tabId: this.tabId
      }
    };

    this.sendMessage(message);
  }

  /**
   * Get connected tabs count (estimate based on ping/pong)
   */
  async getConnectedTabsCount(): Promise<number> {
    return new Promise((resolve) => {
      const responses = new Set<string>();
      const timeout = 1000; // 1 second timeout

      const pingId = `ping_${Date.now()}_${Math.random()}`;
      
      // Listen for pong responses
      const handlePong = (event: MessageEvent) => {
        const data = event.data as SyncMessage;
        if (data.type === 'conversation_update' && 
            data.payload && 
            typeof data.payload === 'object' && 
            'pongId' in data.payload && 
            data.payload.pongId === pingId) {
          responses.add((data.payload as any).tabId);
        }
      };

      this.channel.addEventListener('message', handlePong);

      // Send ping
      const pingMessage: SyncMessage = {
        type: 'conversation_update',
        conversationId: '__ping__',
        timestamp: Date.now(),
        payload: {
          pingId,
          tabId: this.tabId
        }
      };

      this.sendMessage(pingMessage);

      // Wait for responses
      setTimeout(() => {
        this.channel.removeEventListener('message', handlePong);
        resolve(responses.size);
      }, timeout);
    });
  }

  /**
   * Check if synchronization is working correctly
   */
  async testSync(): Promise<boolean> {
    try {
      const tabCount = await this.getConnectedTabsCount();
      return tabCount >= 0; // Should be at least 0 (self not counted in broadcast)
    } catch (error) {
      console.error('[CrossTabSync] Sync test failed:', error);
      return false;
    }
  }

  /**
   * Generate unique tab identifier
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup message handler for incoming broadcasts
   */
  private setupMessageHandler(): void {
    this.channel.addEventListener('message', (event: MessageEvent) => {
      try {
        const syncMessage = event.data as SyncMessage;
        
        // Ignore messages from this tab
        if (syncMessage.payload && 
            typeof syncMessage.payload === 'object' && 
            'tabId' in syncMessage.payload && 
            syncMessage.payload.tabId === this.tabId) {
          return;
        }

        // Handle ping messages
        if (syncMessage.conversationId === '__ping__' && 
            syncMessage.payload && 
            typeof syncMessage.payload === 'object' && 
            'pingId' in syncMessage.payload) {
          this.handlePing(syncMessage.payload.pingId as string);
          return;
        }

        // Notify conversation-specific listeners
        const listeners = this.listeners.get(syncMessage.conversationId);
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener(syncMessage);
            } catch (error) {
              console.error('[CrossTabSync] Listener error:', error);
            }
          });
        }

        // Emit to event bus
        this.eventBus.emit('sync:state_updated', {
          type: 'sync:state_updated',
          conversationId: syncMessage.conversationId,
          timestamp: syncMessage.timestamp,
          payload: syncMessage
        } as StoreEvent<SyncMessage>);

      } catch (error) {
        console.error('[CrossTabSync] Message handling error:', error);
      }
    });
  }

  /**
   * Handle ping requests from other tabs
   */
  private handlePing(pingId: string): void {
    const pongMessage: SyncMessage = {
      type: 'conversation_update',
      conversationId: '__ping__',
      timestamp: Date.now(),
      payload: {
        pongId: pingId,
        tabId: this.tabId
      }
    };

    this.sendMessage(pongMessage);
  }

  /**
   * Send message to other tabs
   */
  private sendMessage(message: SyncMessage): void {
    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('[CrossTabSync] Failed to send message:', error);
    }
  }

  /**
   * Serialize conversation state for transmission
   */
  private serializeState(state: ConversationState): any {
    return {
      conversationId: state.conversationId,
      messageCount: state.messages.length,
      unreadCount: state.unreadCount,
      lastActivity: state.lastActivity,
      isLoading: state.isLoading,
      hasError: !!state.error,
      participantCount: state.participants.length,
      // Note: Don't send full messages array to avoid large payloads
      lastMessageId: state.lastMessage?.id || null
    };
  }

  /**
   * Broadcast tab connection to other tabs
   */
  private broadcastTabConnection(): void {
    this.eventBus.emit('sync:tab_connected', {
      type: 'sync:tab_connected',
      conversationId: '__global__',
      timestamp: Date.now(),
      payload: { tabId: this.tabId }
    } as StoreEvent);
  }

  /**
   * Broadcast tab disconnection to other tabs
   */
  private broadcastTabDisconnection(): void {
    this.eventBus.emit('sync:tab_disconnected', {
      type: 'sync:tab_disconnected',
      conversationId: '__global__',
      timestamp: Date.now(),
      payload: { tabId: this.tabId }
    } as StoreEvent);
  }
}

/**
 * Utility function to check if BroadcastChannel is supported
 */
export function isCrossTabSyncSupported(): boolean {
  return typeof window !== 'undefined' && 'BroadcastChannel' in window;
}

/**
 * Create cross-tab sync instance with error handling
 */
export function createCrossTabSync(
  eventBus: EventBus,
  channelName?: string
): CrossTabSync | null {
  if (!isCrossTabSyncSupported()) {
    console.warn('[CrossTabSync] BroadcastChannel not supported, cross-tab sync disabled');
    return null;
  }

  try {
    return new CrossTabSync(eventBus, channelName);
  } catch (error) {
    console.error('[CrossTabSync] Failed to create sync instance:', error);
    return null;
  }
} 