/**
 * SharedSubscription - Callback Multiplexing for Deduplication
 * 
 * Allows multiple listeners to share a single relay subscription.
 * Key features:
 * - Multiple listeners per subscription
 * - Automatic cleanup when last listener removed
 * - Event broadcasting to all listeners
 * - Performance metrics tracking
 */

import type { Filter, NostrEvent, SubscriptionOptions, SubscriptionResult } from '../core/types.js';

export interface SubscriptionListener {
  id: string;
  onEvent?: (event: NostrEvent) => void | Promise<void>;
  onEose?: (relay: string) => void | Promise<void>;
  onClose?: (reason?: string) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface SharedSubscriptionStats {
  listenerCount: number;
  eventCount: number;
  age: number;
  filters: Filter[];
  relays: string[];
}

export class SharedSubscription {
  private listeners = new Map<string, SubscriptionListener>();
  private subscriptionResult?: SubscriptionResult;
  private eventCount = 0;
  private createdAt = Date.now();
  private lastEventAt?: number;
  private debug: boolean;

  constructor(
    public readonly key: string,
    public readonly filters: Filter[],
    public readonly relays: string[],
    options: { debug?: boolean } = {}
  ) {
    this.debug = options.debug || false;
  }

  /**
   * Add a new listener to this shared subscription
   * Returns the listener ID for later removal
   */
  addListener(listener: Omit<SubscriptionListener, 'id'>): string {
    const listenerId = this.generateListenerId();
    const fullListener: SubscriptionListener = {
      id: listenerId,
      ...listener
    };
    
    this.listeners.set(listenerId, fullListener);
    
    if (this.debug) {
      console.log(`SharedSubscription: Added listener ${listenerId} to ${this.key} (${this.listeners.size} total)`);
    }
    
    return listenerId;
  }

  /**
   * Remove a listener from this shared subscription
   * Returns true if this was the last listener
   */
  removeListener(listenerId: string): boolean {
    const removed = this.listeners.delete(listenerId);
    
    if (removed && this.debug) {
      console.log(`SharedSubscription: Removed listener ${listenerId} from ${this.key} (${this.listeners.size} remaining)`);
    }
    
    return this.listeners.size === 0;
  }

  /**
   * Broadcast an event to all listeners
   */
  async broadcast(event: NostrEvent): Promise<void> {
    this.eventCount++;
    this.lastEventAt = Date.now();
    
    // Call all listener callbacks in parallel
    const promises: Promise<void>[] = [];
    
    for (const listener of this.listeners.values()) {
      if (listener.onEvent) {
        promises.push(
          Promise.resolve(listener.onEvent(event)).catch(error => {
            if (this.debug) {
              console.error(`SharedSubscription: Listener ${listener.id} onEvent error:`, error);
            }
            // Call error handler if available
            if (listener.onError) {
              listener.onError(error instanceof Error ? error : new Error(String(error)));
            }
          })
        );
      }
    }
    
    await Promise.all(promises);
  }

  /**
   * Notify all listeners of EOSE
   */
  async notifyEose(relay: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const listener of this.listeners.values()) {
      if (listener.onEose) {
        promises.push(
          Promise.resolve(listener.onEose(relay)).catch(error => {
            if (this.debug) {
              console.error(`SharedSubscription: Listener ${listener.id} onEose error:`, error);
            }
            if (listener.onError) {
              listener.onError(error instanceof Error ? error : new Error(String(error)));
            }
          })
        );
      }
    }
    
    await Promise.all(promises);
  }

  /**
   * Notify all listeners of subscription close
   */
  async notifyClose(reason?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const listener of this.listeners.values()) {
      if (listener.onClose) {
        promises.push(
          Promise.resolve(listener.onClose(reason)).catch(error => {
            if (this.debug) {
              console.error(`SharedSubscription: Listener ${listener.id} onClose error:`, error);
            }
          })
        );
      }
    }
    
    await Promise.all(promises);
  }

  /**
   * Notify all listeners of an error
   */
  async notifyError(error: Error): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const listener of this.listeners.values()) {
      if (listener.onError) {
        promises.push(
          Promise.resolve(listener.onError(error)).catch(err => {
            if (this.debug) {
              console.error(`SharedSubscription: Listener ${listener.id} onError handler error:`, err);
            }
          })
        );
      }
    }
    
    await Promise.all(promises);
  }

  /**
   * Set the subscription result from SubscriptionManager
   */
  setSubscriptionResult(result: SubscriptionResult): void {
    this.subscriptionResult = result;
  }

  /**
   * Get the subscription result
   */
  getSubscriptionResult(): SubscriptionResult | undefined {
    return this.subscriptionResult;
  }

  /**
   * Get statistics about this shared subscription
   */
  getStats(): SharedSubscriptionStats {
    return {
      listenerCount: this.listeners.size,
      eventCount: this.eventCount,
      age: Date.now() - this.createdAt,
      filters: this.filters,
      relays: this.relays
    };
  }

  /**
   * Check if this subscription has any listeners
   */
  hasListeners(): boolean {
    return this.listeners.size > 0;
  }

  /**
   * Get the subscription ID if available
   */
  getSubscriptionId(): string | undefined {
    return this.subscriptionResult?.subscription?.id;
  }

  // Private helper methods

  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}