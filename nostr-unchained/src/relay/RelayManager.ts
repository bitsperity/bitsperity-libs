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
}

export class RelayManager {
  private connections = new Map<string, RelayConnection>();
  private debug: boolean;
  private messageHandler?: (relayUrl: string, message: RelayMessage) => void;

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

        ws.onclose = () => {
          connection.state = 'disconnected';
          connection.ws = undefined;
          
          if (this.debug) {
            console.log(`Disconnected from relay: ${url}`);
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
        } else if (this.debug) {
          console.warn(`No pending publish found for event ID: ${eventId}`);
        }
      } else if (message[0] === 'NOTICE') {
        const [, notice] = message;
        if (this.debug) {
          console.log(`Notice from ${relayUrl}:`, notice);
        }
      } else if (message[0] === 'EVENT' || message[0] === 'EOSE') {
        // Forward subscription-related messages to message handler
        if (this.messageHandler) {
          this.messageHandler(relayUrl, message);
        } else if (this.debug) {
          console.log(`No message handler registered for ${message[0]} message`);
        }
      }
    } catch (error) {
      if (this.debug) {
        console.error(`Failed to parse message from ${relayUrl}:`, error);
      }
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
}