/**
 * Relay Management System
 * 
 * Handles WebSocket connections to Nostr relays with:
 * - Connection pooling and management
 * - NIP-01 message protocol
 * - Error handling and retry logic
 * - Graceful degradation
 * - Cross-platform WebSocket support (browser + Node.js)
 */

// WebSocket compatibility layer
async function getWebSocketImpl(): Promise<typeof WebSocket> {
  if (typeof WebSocket !== 'undefined') {
    // Browser environment
    return WebSocket;
  } else {
    // Node.js environment - dynamic import for ws
    try {
      const WS = await import('ws');
      return WS.default;
    } catch (error) {
      throw new Error('WebSocket not available. In Node.js, install: npm install ws');
    }
  }
}

import type { 
  NostrEvent, 
  RelayResult, 
  RelayInfo, 
  ClientMessage, 
  RelayMessage 
} from '../core/types.js';
import { 
  DEFAULT_CONFIG, 
  ERROR_MESSAGES, 
  VALIDATION_PATTERNS 
} from '../utils/constants.js';

export interface RelayConnection {
  url: string;
  ws?: WebSocket;
  state: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastConnected?: number;
  error?: string;
  reconnectAttempts?: number;
  reconnectTimeout?: NodeJS.Timeout;
  lastReconnectAttempt?: number;
  // NIP-42: last auth challenge for this relay
  lastAuthChallenge?: string;
  // Whether we have performed AUTH successfully in this connection
  isAuthenticated?: boolean;
  // Last AUTH event id sent to this relay
  lastAuthEventId?: string;
}

export class RelayManager {
  private connections = new Map<string, RelayConnection>();
  private debug: boolean;
  private messageHandler?: (relayUrl: string, message: RelayMessage) => void;
  // NIP-42: optional provider and hook to create and sign auth events
  private authEventFactory?: (params: { relay: string; challenge: string }) => Promise<NostrEvent>;
  private onAuthStateChange?: (relay: string, state: { authenticated: boolean; challenge?: string; reason?: string }) => void;
  
  // Reconnection configuration
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  private reconnectEnabled = true;

  constructor(relayUrls: string[], options: { debug?: boolean } = {}) {
    this.debug = options.debug ?? false;
    
    // Initialize connections
    relayUrls.forEach(url => {
      this.connections.set(url, {
        url,
        state: 'disconnected'
      });
    });
  }

  /**
   * Configure NIP-42 authentication hooks
   */
  configureAuth(options: {
    authEventFactory: (params: { relay: string; challenge: string }) => Promise<NostrEvent>;
    onAuthStateChange?: (relay: string, state: { authenticated: boolean; challenge?: string; reason?: string }) => void;
  }): void {
    this.authEventFactory = options.authEventFactory;
    this.onAuthStateChange = options.onAuthStateChange;
  }

  /**
   * Get list of relay URLs
   */
  get relayUrls(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get list of connected relay URLs
   */
  get connectedRelays(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.state === 'connected')
      .map(([url, _]) => url);
  }

  /**
   * Connect to all configured relays
   */
  async connect(): Promise<void> {
    const connectionPromises = this.relayUrls.map(url => 
      this.connectToRelay(url).catch(error => {
        if (this.debug) {
          console.warn(`Failed to connect to ${url}:`, error);
        }
        return false; // Don't fail overall connection if one relay fails
      })
    );

    await Promise.allSettled(connectionPromises);
    
    // Ensure at least one connection succeeded
    if (this.connectedRelays.length === 0) {
      throw new Error('Failed to connect to any relay');
    }
  }

  /**
   * Connect to a specific relay
   */
  async connectToRelay(url: string): Promise<boolean> {
    const connection = this.connections.get(url);
    if (!connection) {
      throw new Error(`Relay ${url} not configured`);
    }

    if (connection.state === 'connected') {
      return true; // Already connected
    }

    connection.state = 'connecting';

    return new Promise(async (resolve, reject) => {
      try {
        const WebSocketImpl = await getWebSocketImpl();
        const ws = new WebSocketImpl(url);
        
        const timeout = setTimeout(() => {
          ws.close();
          connection.state = 'error';
          connection.error = 'Connection timeout';
          reject(new Error(`Connection to ${url} timed out`));
        }, DEFAULT_CONFIG.CONNECTION_TIMEOUT);

        ws.onopen = () => {
          clearTimeout(timeout);
          connection.ws = ws;
          connection.state = 'connected';
          connection.lastConnected = Date.now();
          connection.error = undefined;
          
          if (this.debug) {
            console.log(`Connected to relay: ${url}`);
          }
          
          resolve(true);
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          connection.state = 'error';
          connection.error = 'WebSocket error';
          
          if (this.debug) {
            console.error(`WebSocket error for ${url}:`, error);
          }
          
          reject(new Error(`Failed to connect to ${url}: WebSocket error`));
        };

        ws.onclose = (event) => {
          connection.state = 'disconnected';
          connection.ws = undefined;
          
          if (this.debug) {
            console.log(`Disconnected from relay: ${url}`, event.code, event.reason);
          }
          
          // Trigger reconnection if enabled and not manually closed
          if (this.reconnectEnabled && event.code !== 1000) { // 1000 = normal closure
            this.scheduleReconnection(url);
          }
        };

        ws.onmessage = (event) => {
          this.handleRelayMessage(url, event.data);
        };

      } catch (error) {
        connection.state = 'error';
        connection.error = error instanceof Error ? error.message : 'Unknown error';
        reject(error);
      }
    });
  }

  /**
   * Publish event to specific relays
   */
  async publishToRelays(event: NostrEvent, relayUrls: string[]): Promise<RelayResult[]> {
    const results: RelayResult[] = [];
    const publishPromises = relayUrls.map(async (url) => {
      const startTime = Date.now();
      
      try {
        const success = await this.publishToRelay(url, event);
        const latency = Date.now() - startTime;
        
        results.push({
          relay: url,
          success,
          latency
        });
      } catch (error) {
        const latency = Date.now() - startTime;
        results.push({
          relay: url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          latency
        });
      }
    });

    await Promise.allSettled(publishPromises);
    return results;
  }

  /**
   * Publish event to all connected relays
   */
  async publishToAll(event: NostrEvent): Promise<RelayResult[]> {
    const results: RelayResult[] = [];
    const publishPromises = this.connectedRelays.map(async (url) => {
      const startTime = Date.now();
      
      try {
        const success = await this.publishToRelay(url, event);
        const latency = Date.now() - startTime;
        
        results.push({
          relay: url,
          success,
          latency
        });
      } catch (error) {
        const latency = Date.now() - startTime;
        results.push({
          relay: url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          latency
        });
      }
    });

    await Promise.allSettled(publishPromises);
    return results;
  }

  /**
   * Publish event to specific relay
   */
  async publishToRelay(url: string, event: NostrEvent): Promise<boolean> {
    const connection = this.connections.get(url);
    
    if (!connection || connection.state !== 'connected' || !connection.ws) {
      throw new Error(`Not connected to relay: ${url}`);
    }

    return new Promise((resolve, reject) => {
      const ws = connection.ws!;
      const message: ClientMessage = ['EVENT', event];
      
      const timeout = setTimeout(() => {
        reject(new Error('Publish timeout'));
      }, DEFAULT_CONFIG.PUBLISH_TIMEOUT);

      // Store resolve/reject for OK message handling
      const messageId = event.id;
      this.pendingPublishes.set(messageId, { resolve, reject, timeout });

      try {
        const messageStr = JSON.stringify(message);
        ws.send(messageStr);
        
        if (this.debug) {
          console.log(`📤 Publishing event ${event.id} to ${url}`);
          console.log(`📤 Message:`, messageStr);
          console.log(`📤 Added to pending:`, messageId);
        }
      } catch (error) {
        clearTimeout(timeout);
        this.pendingPublishes.delete(messageId);
        reject(error);
      }
    });
  }

  private pendingPublishes = new Map<string, {
    resolve: (value: boolean) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  /**
   * Handle incoming relay messages
   */
  private handleRelayMessage(relayUrl: string, data: string): void {
    try {
      const message: RelayMessage = JSON.parse(data);
      
      if (this.debug) {
        console.log(`📥 Message from ${relayUrl}:`, message);
      }
      
      if (message[0] === 'OK') {
        const [, eventId, success, errorMessage] = message;
        const pending = this.pendingPublishes.get(eventId);
        
        if (this.debug) {
          console.log(`OK for event ${eventId}, success: ${success}, pending: ${!!pending}`);
          console.log('Pending publishes:', Array.from(this.pendingPublishes.keys()));
        }
        
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingPublishes.delete(eventId);
          
          if (success) {
            pending.resolve(true);
          } else {
            pending.reject(new Error(errorMessage || 'Relay rejected event'));
          }
        } else {
          // Might be an AUTH confirmation (NIP-42)
          const conn = this.connections.get(relayUrl);
          if (conn && conn.lastAuthEventId === eventId) {
            conn.isAuthenticated = !!success;
            if (this.debug) {
              console.log(`🔐 AUTH ${success ? 'succeeded' : 'failed'} for ${relayUrl}${errorMessage ? ' (' + errorMessage + ')' : ''}`);
            }
            this.onAuthStateChange?.(relayUrl, { authenticated: !!success, reason: success ? undefined : errorMessage });
          } else if (this.debug) {
            console.warn(`No pending publish found for event ID: ${eventId}`);
          }
        }
      } else if (message[0] === 'NOTICE') {
        const [, notice] = message;
        if (this.debug) {
          console.log(`Notice from ${relayUrl}:`, notice);
        }
        // NIP-42: Some relays use OK/NOTICE texts with "auth-required:" / "restricted:" hints
        if (typeof notice === 'string' && (notice.startsWith('auth-required:') || notice.startsWith('restricted:'))) {
          if (this.debug) console.log('NIP-42 hint via NOTICE:', notice);
          // Attempt authentication if challenge is stored and we have a factory
          void this.tryAuthenticate(relayUrl);
        }
      } else if (message[0] === 'EVENT' || message[0] === 'EOSE') {
        // Forward subscription-related messages to message handler
        if (this.messageHandler) {
          this.messageHandler(relayUrl, message);
        } else if (this.debug) {
          console.log(`No message handler registered for ${message[0]} message`);
        }
      } else if (message[0] === 'AUTH') {
        // NIP-42: Relay sends a challenge string
        const [, challenge] = message;
        const conn = this.connections.get(relayUrl);
        if (conn) {
          conn.lastAuthChallenge = challenge;
          conn.isAuthenticated = false;
        }
        if (this.debug) {
          console.log(`🔐 NIP-42 challenge from ${relayUrl}:`, challenge);
        }
        // Try to authenticate immediately if possible
        void this.tryAuthenticate(relayUrl);
      } else if (message[0] === 'CLOSED') {
        // NIP-42: Subscription closed with reason (may include auth-required / restricted)
        const [, , reason] = message as ['CLOSED', string, string];
        if (typeof reason === 'string' && (reason.startsWith('auth-required:') || reason.startsWith('restricted:'))) {
          if (this.debug) console.log(`🔐 NIP-42 CLOSED hint from ${relayUrl}:`, reason);
          void this.tryAuthenticate(relayUrl);
        }
      }
    } catch (error) {
      if (this.debug) {
        console.error(`Failed to parse message from ${relayUrl}:`, error);
      }
    }
  }

  /**
   * NIP-42: Attempt to authenticate to a relay using stored challenge
   */
  private async tryAuthenticate(relayUrl: string): Promise<void> {
    const connection = this.connections.get(relayUrl);
    if (!connection || connection.state !== 'connected' || !connection.ws) return;
    if (!this.authEventFactory) return;
    const challenge = connection.lastAuthChallenge;
    if (!challenge) {
      if (this.debug) console.log('NIP-42: No challenge stored for', relayUrl);
      return;
    }
    try {
      const authEvent = await this.authEventFactory({ relay: relayUrl, challenge });
      // Track AUTH event id to correlate OK acknowledgment
      connection.lastAuthEventId = authEvent.id;
      const authMsg: ClientMessage = ['AUTH', authEvent];
      connection.ws.send(JSON.stringify(authMsg));
      if (this.debug) console.log(`📤 Sent AUTH to ${relayUrl}`);
      // Mark as pending; success is acknowledged via OK for the AUTH event id
      this.onAuthStateChange?.(relayUrl, { authenticated: false, challenge });
    } catch (error) {
      if (this.debug) console.error('NIP-42 AUTH send failed:', error);
      this.onAuthStateChange?.(relayUrl, { authenticated: false, challenge, reason: (error as Error).message });
    }
  }

  /**
   * Get relay information (NIP-11)
   */
  async getRelayInfo(url: string): Promise<RelayInfo> {
    try {
      // Convert WebSocket URL to HTTP for NIP-11 info document
      const httpUrl = url.replace(/^ws/, 'http');
      
      const response = await fetch(httpUrl, {
        headers: {
          'Accept': 'application/nostr+json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const info: RelayInfo = await response.json();
      return info;
    } catch (error) {
      throw new Error(`Failed to get relay info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test relay connectivity
   */
  async testRelay(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate URL format
      if (!VALIDATION_PATTERNS.WEBSOCKET_URL.test(url)) {
        return {
          success: false,
          error: 'Invalid WebSocket URL format'
        };
      }

      // Try to connect
      await this.connectToRelay(url);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Disconnect from all relays
   */
  async disconnect(): Promise<void> {
    // Clear pending publishes
    this.pendingPublishes.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error('Disconnecting'));
    });
    this.pendingPublishes.clear();

    // Close all connections
    this.connections.forEach((connection) => {
      if (connection.ws) {
        connection.ws.close();
        connection.ws = undefined;
      }
      connection.state = 'disconnected';
    });
  }

  /**
   * Send message to all connected relays
   */
  async sendToAll(message: ClientMessage): Promise<void> {
    const sendPromises = this.connectedRelays.map(relay => 
      this.sendToRelay(relay, message).catch(error => {
        if (this.debug) {
          console.warn(`Failed to send to ${relay}:`, error);
        }
      })
    );

    await Promise.allSettled(sendPromises);
  }

  /**
   * Send message to specific relays
   */
  async sendToRelays(relayUrls: string[], message: ClientMessage): Promise<void> {
    const sendPromises = relayUrls.map(relay => 
      this.sendToRelay(relay, message).catch(error => {
        if (this.debug) {
          console.warn(`Failed to send to ${relay}:`, error);
        }
      })
    );

    await Promise.allSettled(sendPromises);
  }

  /**
   * Send message to a specific relay
   */
  async sendToRelay(url: string, message: ClientMessage): Promise<void> {
    const connection = this.connections.get(url);
    
    if (!connection || connection.state !== 'connected' || !connection.ws) {
      throw new Error(`Not connected to relay: ${url}`);
    }

    const messageStr = JSON.stringify(message);
    connection.ws.send(messageStr);
    
    if (this.debug) {
      console.log(`📤 Sent to ${url}:`, messageStr);
    }
  }

  /**
   * Register a message handler for subscription messages (EVENT, EOSE)
   */
  setMessageHandler(handler: (relayUrl: string, message: RelayMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    total: number;
    connected: number;
    connecting: number;
    disconnected: number;
    error: number;
  } {
    const stats = {
      total: this.connections.size,
      connected: 0,
      connecting: 0,
      disconnected: 0,
      error: 0
    };

    this.connections.forEach((connection) => {
      stats[connection.state]++;
    });

    return stats;
  }
  
  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(url: string): void {
    const connection = this.connections.get(url);
    if (!connection) return;
    
    // Clear any existing reconnection timeout
    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
      connection.reconnectTimeout = undefined;
    }
    
    // Initialize reconnect attempts if not set
    if (connection.reconnectAttempts === undefined) {
      connection.reconnectAttempts = 0;
    }
    
    // Check if we've exceeded max attempts
    if (connection.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.debug) {
        console.warn(`Max reconnection attempts reached for relay: ${url}`);
      }
      connection.state = 'error';
      connection.error = `Max reconnection attempts (${this.maxReconnectAttempts}) exceeded`;
      return;
    }
    
    // Calculate exponential backoff delay
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, connection.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitteredDelay = delay + Math.random() * 1000;
    
    if (this.debug) {
      console.log(`Scheduling reconnection to ${url} in ${Math.round(jitteredDelay)}ms (attempt ${connection.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    }
    
    connection.reconnectTimeout = setTimeout(() => {
      this.attemptReconnection(url);
    }, jitteredDelay);
  }
  
  /**
   * Attempt to reconnect to a relay
   */
  private async attemptReconnection(url: string): Promise<void> {
    const connection = this.connections.get(url);
    if (!connection) return;
    
    connection.reconnectAttempts = (connection.reconnectAttempts || 0) + 1;
    connection.lastReconnectAttempt = Date.now();
    
    if (this.debug) {
      console.log(`Attempting reconnection to ${url} (attempt ${connection.reconnectAttempts})`);
    }
    
    try {
      const success = await this.connectToRelay(url);
      if (success) {
        // Reset reconnection state on successful connection
        connection.reconnectAttempts = 0;
        connection.reconnectTimeout = undefined;
        
        if (this.debug) {
          console.log(`Successfully reconnected to relay: ${url}`);
        }
      }
    } catch (error) {
      if (this.debug) {
        console.warn(`Reconnection attempt failed for ${url}:`, error);
      }
      
      // Schedule next reconnection attempt if we haven't exceeded max attempts
      if (connection.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnection(url);
      } else {
        connection.state = 'error';
        connection.error = `Reconnection failed after ${this.maxReconnectAttempts} attempts`;
      }
    }
  }
  
  /**
   * Enable or disable automatic reconnection
   */
  setReconnectionEnabled(enabled: boolean): void {
    this.reconnectEnabled = enabled;
    
    if (!enabled) {
      // Clear all pending reconnection timeouts
      for (const connection of this.connections.values()) {
        if (connection.reconnectTimeout) {
          clearTimeout(connection.reconnectTimeout);
          connection.reconnectTimeout = undefined;
        }
      }
    }
  }
  
  /**
   * Configure reconnection parameters
   */
  configureReconnection(options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  }): void {
    if (options.maxAttempts !== undefined) {
      this.maxReconnectAttempts = Math.max(1, options.maxAttempts);
    }
    if (options.baseDelay !== undefined) {
      this.baseReconnectDelay = Math.max(100, options.baseDelay);
    }
    if (options.maxDelay !== undefined) {
      this.maxReconnectDelay = Math.max(this.baseReconnectDelay, options.maxDelay);
    }
  }
  
  /**
   * Manually trigger reconnection for a specific relay
   */
  async reconnectRelay(url: string): Promise<boolean> {
    const connection = this.connections.get(url);
    if (!connection) {
      throw new Error(`Relay ${url} not configured`);
    }
    
    // Clear any pending reconnection
    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
      connection.reconnectTimeout = undefined;
    }
    
    // Reset reconnection state
    connection.reconnectAttempts = 0;
    
    return this.connectToRelay(url);
  }
  
  /**
   * Get reconnection status for all relays
   */
  getReconnectionStatus(): Record<string, {
    attempts: number;
    nextAttemptIn?: number;
    lastAttempt?: number;
  }> {
    const status: Record<string, any> = {};
    
    for (const [url, connection] of this.connections.entries()) {
      status[url] = {
        attempts: connection.reconnectAttempts || 0,
        lastAttempt: connection.lastReconnectAttempt
      };
      
      if (connection.reconnectTimeout) {
        // Calculate approximate time until next attempt
        const now = Date.now();
        const lastAttempt = connection.lastReconnectAttempt || now;
        const expectedDelay = Math.min(
          this.baseReconnectDelay * Math.pow(2, (connection.reconnectAttempts || 0) - 1),
          this.maxReconnectDelay
        );
        const nextAttemptTime = lastAttempt + expectedDelay;
        status[url].nextAttemptIn = Math.max(0, nextAttemptTime - now);
      }
    }
    
    return status;
  }
}