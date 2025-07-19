import type { NostrEvent } from '@/types';
import type { MessageHistory } from './types';

/**
 * LRU-based message history implementation for memory-bounded storage
 * Maintains the most recently accessed messages up to maxSize limit
 */
export class LRUMessageHistory implements MessageHistory {
  private readonly messageMap = new Map<string, NostrEvent>();
  private readonly accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(
    public readonly maxSize: number = 1000
  ) {
    if (maxSize <= 0) {
      throw new Error('MessageHistory maxSize must be positive');
    }
  }

  /**
   * Current number of messages in history
   */
  get size(): number {
    return this.messageMap.size;
  }

  /**
   * Add a message to the history
   * If at capacity, removes least recently used message
   */
  addMessage(message: NostrEvent): void {
    if (!message?.id) {
      throw new Error('Message must have a valid id');
    }

    // If message already exists, update access time and return
    if (this.messageMap.has(message.id)) {
      this.messageMap.set(message.id, message);
      this.updateAccess(message.id);
      return;
    }

    // If at capacity, remove least recently used message
    if (this.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    // Add new message
    this.messageMap.set(message.id, message);
    this.updateAccess(message.id);
  }

  /**
   * Remove a specific message from history
   */
  removeMessage(messageId: string): boolean {
    if (!messageId) {
      return false;
    }

    const removed = this.messageMap.delete(messageId);
    if (removed) {
      this.accessOrder.delete(messageId);
    }
    return removed;
  }

  /**
   * Get messages, optionally limited by count
   * Returns messages in chronological order (oldest first)
   */
  getMessages(limit?: number): readonly NostrEvent[] {
    const messages = Array.from(this.messageMap.values());
    
    // Sort by timestamp (created_at)
    messages.sort((a, b) => a.created_at - b.created_at);
    
    // Update access time for returned messages
    messages.forEach(msg => this.updateAccess(msg.id));
    
    // Apply limit if specified
    if (limit && limit > 0) {
      return messages.slice(-limit); // Return most recent messages
    }
    
    return messages;
  }

  /**
   * Clear all messages from history
   */
  clear(): void {
    this.messageMap.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  /**
   * Check if a message exists in history
   */
  has(messageId: string): boolean {
    if (!messageId) {
      return false;
    }
    
    const exists = this.messageMap.has(messageId);
    
    // Update access time if message exists
    if (exists) {
      this.updateAccess(messageId);
    }
    
    return exists;
  }

  /**
   * Get a specific message by ID
   * Updates access time if message exists
   */
  getMessage(messageId: string): NostrEvent | undefined {
    if (!messageId) {
      return undefined;
    }

    const message = this.messageMap.get(messageId);
    
    if (message) {
      this.updateAccess(messageId);
    }
    
    return message;
  }

  /**
   * Get messages by author pubkey
   * Returns messages in chronological order
   */
  getMessagesByAuthor(authorPubkey: string, limit?: number): readonly NostrEvent[] {
    if (!authorPubkey) {
      return [];
    }

    const authorMessages = Array.from(this.messageMap.values())
      .filter(msg => msg.pubkey === authorPubkey)
      .sort((a, b) => a.created_at - b.created_at);

    // Update access time for returned messages
    authorMessages.forEach(msg => this.updateAccess(msg.id));

    if (limit && limit > 0) {
      return authorMessages.slice(-limit);
    }

    return authorMessages;
  }

  /**
   * Get messages within a time range
   * Returns messages in chronological order
   */
  getMessagesInRange(startTime: number, endTime: number): readonly NostrEvent[] {
    if (startTime >= endTime) {
      return [];
    }

    const rangeMessages = Array.from(this.messageMap.values())
      .filter(msg => msg.created_at >= startTime && msg.created_at <= endTime)
      .sort((a, b) => a.created_at - b.created_at);

    // Update access time for returned messages
    rangeMessages.forEach(msg => this.updateAccess(msg.id));

    return rangeMessages;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    messageCount: number;
    approximateMemoryBytes: number;
    utilizationPercent: number;
  } {
    const messageCount = this.size;
    
    // Rough estimation: each message ~1KB on average
    const approximateMemoryBytes = messageCount * 1024;
    
    const utilizationPercent = (messageCount / this.maxSize) * 100;

    return {
      messageCount,
      approximateMemoryBytes,
      utilizationPercent
    };
  }

  /**
   * Update access time for a message (internal method)
   */
  private updateAccess(messageId: string): void {
    this.accessOrder.set(messageId, ++this.accessCounter);
  }

  /**
   * Remove the least recently used message (internal method)
   */
  private evictLeastRecentlyUsed(): void {
    if (this.messageMap.size === 0) {
      return;
    }

    let lruMessageId: string | null = null;
    let lruAccessTime = Infinity;

    // Find message with lowest access time
    for (const [messageId, accessTime] of this.accessOrder) {
      if (accessTime < lruAccessTime) {
        lruAccessTime = accessTime;
        lruMessageId = messageId;
      }
    }

    // Remove the LRU message
    if (lruMessageId) {
      this.messageMap.delete(lruMessageId);
      this.accessOrder.delete(lruMessageId);
    }
  }

  /**
   * Validate internal state consistency (for testing)
   */
  validateInternalState(): boolean {
    // Check that both maps have same keys
    const messageIds = new Set(this.messageMap.keys());
    const accessIds = new Set(this.accessOrder.keys());

    if (messageIds.size !== accessIds.size) {
      return false;
    }

    for (const id of messageIds) {
      if (!accessIds.has(id)) {
        return false;
      }
    }

    return true;
  }
} 