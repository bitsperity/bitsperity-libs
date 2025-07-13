import type { EventBus } from '@/types';

/**
 * Simple and efficient event bus implementation
 * Verwendet für interne Kommunikation zwischen Modulen
 */
export class SimpleEventBus implements EventBus {
  private readonly listeners = new Map<string, Set<(data: unknown) => void>>();
  private isDisposed = false;

  public on<T = unknown>(event: string, listener: (data: T) => void): void {
    if (this.isDisposed) {
      throw new Error('EventBus is disposed');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener as (data: unknown) => void);
  }

  public off<T = unknown>(event: string, listener: (data: T) => void): void {
    if (this.isDisposed) {
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as (data: unknown) => void);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = unknown>(event: string, data: T): void {
    if (this.isDisposed) {
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy to avoid issues if listeners modify the set
      const listeners = [...eventListeners];
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      }
    }
  }

  public async dispose(): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    this.listeners.clear();
    this.isDisposed = true;
  }

  public get listenerCount(): number {
    return Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0);
  }

  public hasListeners(event: string): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.size > 0;
  }
} 