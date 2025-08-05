/**
 * UniversalEventCache - The One Cache to Rule Them All
 * 
 * A generic, lightweight cache that handles ALL events with automatic gift wrap unwrapping.
 * Implements efficient indexed queries with O(log n) lookup performance.
 * 
 * Key features:
 * - Single cache for all events (decrypted)
 * - Auto-unwrap gift wraps (kind 1059)
 * - Efficient indexed queries
 * - Simple, generic, fast
 */

import type { NostrEvent, Filter } from '../core/types.js';
import { GiftWrapProtocol } from '../dm/protocol/GiftWrapProtocol.js';

export interface CacheConfig {
  maxEvents?: number; // Default: 10,000
  maxMemoryMB?: number; // Default: 50MB
  evictionPolicy?: 'lru' | 'fifo'; // Default: 'lru'
}

export interface CacheStatistics {
  // Basic metrics
  totalEvents: number;
  memoryUsageMB: number;
  subscribersCount: number;
  
  // Index metrics
  kindIndexSize: number;
  authorIndexSize: number;
  tagIndexSize: number;
  
  // Performance metrics
  queryCount: number;
  hitRate: number;
  avgQueryTime: number;
  
  // Eviction metrics
  evictedCount: number;
  evictionPolicy: 'lru' | 'fifo';
  
  // Configuration
  maxEvents: number;
  maxMemoryMB: number;
  
  // Real-time metrics
  lastUpdated: number;
  cacheAge: number; // Time since cache was created
}

// LRU Node for doubly-linked list
interface LRUNode {
  eventId: string;
  prev: LRUNode | null;
  next: LRUNode | null;
  timestamp: number;
}

export class UniversalEventCache {
  private events = new Map<string, NostrEvent>(); // ALL events (decrypted)
  private eventsByKind = new Map<number, Set<string>>(); // Fast lookup by kind
  private eventsByAuthor = new Map<string, Set<string>>(); // Fast lookup by author
  private eventsByTag = new Map<string, Map<string, Set<string>>>(); // tag name → value → event IDs
  private subscribers = new Set<(event: NostrEvent) => void>();
  private privateKey: string;
  private config: Required<CacheConfig>;
  
  // Efficient LRU tracking with doubly-linked list - O(1) operations
  private lruNodes = new Map<string, LRUNode>();
  private lruHead: LRUNode | null = null;
  private lruTail: LRUNode | null = null;
  
  // Statistics tracking
  private stats = {
    queryCount: 0,
    totalQueryTime: 0,
    evictedCount: 0,
    createdAt: Date.now()
  };
  
  constructor(privateKey: string, config: CacheConfig = {}) {
    this.privateKey = privateKey;
    this.config = {
      maxEvents: config.maxEvents || 10000,
      maxMemoryMB: config.maxMemoryMB || 50,
      evictionPolicy: config.evictionPolicy || 'lru'
    };
  }
  
  async addEvent(event: NostrEvent): Promise<void> {
    // Special handling ONLY for gift wraps
    if (event.kind === 1059) {
      try {
        const decrypted = await this.unwrapGiftWrap(event);
        if (decrypted) {
          await this.addEvent(decrypted); // Recursive: add unwrapped content
        }
      } catch (error) {
        // Failed to decrypt - not for us, ignore
        console.debug('Failed to unwrap gift wrap:', error);
      }
      return; // Gift wrap itself NOT stored
    }
    
    // Check capacity before adding
    this.enforceCapacityLimits();
    
    // All other events go directly into cache
    this.events.set(event.id, event);
    this.updateIndexes(event);
    this.updateAccessTracking(event.id);
    this.notifySubscribers(event);
  }
  
  query(filter: Filter): NostrEvent[] {
    const startTime = performance.now();
    
    // Update access tracking for LRU
    const results = this.getMatchingEvents(filter);
    results.forEach(event => this.updateAccessTracking(event.id));
    
    // Update statistics
    const queryTime = performance.now() - startTime;
    this.stats.queryCount++;
    this.stats.totalQueryTime += queryTime;
    
    return results;
  }
  
  subscribe(callback: (event: NostrEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  clear(): void {
    this.events.clear();
    this.eventsByKind.clear();
    this.eventsByAuthor.clear();
    this.eventsByTag.clear();
    this.lruNodes.clear();
    this.lruHead = null;
    this.lruTail = null;
  }
  
  get size(): number {
    return this.events.size;
  }
  
  /**
   * Get comprehensive cache statistics
   */
  getStatistics(): CacheStatistics {
    const now = Date.now();
    const totalQueries = this.stats.queryCount;
    
    return {
      // Basic metrics
      totalEvents: this.events.size,
      memoryUsageMB: this.estimateMemoryUsage(),
      subscribersCount: this.subscribers.size,
      
      // Index metrics
      kindIndexSize: this.eventsByKind.size,
      authorIndexSize: this.eventsByAuthor.size,
      tagIndexSize: this.eventsByTag.size,
      
      // Performance metrics
      queryCount: totalQueries,
      hitRate: totalQueries > 0 ? (this.events.size / totalQueries) * 100 : 0,
      avgQueryTime: totalQueries > 0 ? this.stats.totalQueryTime / totalQueries : 0,
      
      // Eviction metrics
      evictedCount: this.stats.evictedCount,
      evictionPolicy: this.config.evictionPolicy,
      
      // Configuration
      maxEvents: this.config.maxEvents,
      maxMemoryMB: this.config.maxMemoryMB,
      
      // Real-time metrics
      lastUpdated: now,
      cacheAge: now - this.stats.createdAt
    };
  }
  
  private async unwrapGiftWrap(giftWrap: NostrEvent): Promise<NostrEvent | null> {
    const decryptionResult = await GiftWrapProtocol.unwrapGiftWrap(giftWrap, this.privateKey);
    return decryptionResult;
  }
  
  private updateIndexes(event: NostrEvent): void {
    // Kind index
    if (!this.eventsByKind.has(event.kind)) {
      this.eventsByKind.set(event.kind, new Set());
    }
    this.eventsByKind.get(event.kind)!.add(event.id);
    
    // Author index
    if (!this.eventsByAuthor.has(event.pubkey)) {
      this.eventsByAuthor.set(event.pubkey, new Set());
    }
    this.eventsByAuthor.get(event.pubkey)!.add(event.id);
    
    // Tag indexes
    event.tags.forEach(tag => {
      const [tagName, tagValue] = tag;
      if (!tagValue) return;
      
      if (!this.eventsByTag.has(tagName)) {
        this.eventsByTag.set(tagName, new Map());
      }
      const tagMap = this.eventsByTag.get(tagName)!;
      
      if (!tagMap.has(tagValue)) {
        tagMap.set(tagValue, new Set());
      }
      tagMap.get(tagValue)!.add(event.id);
    });
  }
  
  private getMatchingEvents(filter: Filter): NostrEvent[] {
    let candidateIds: Set<string> | undefined;
    
    // Use indexes for efficient filtering
    if (filter.kinds && filter.kinds.length > 0) {
      const kindSets = filter.kinds.map(k => this.eventsByKind.get(k) || new Set());
      candidateIds = this.unionSets(kindSets);
    }
    
    if (filter.authors && filter.authors.length > 0) {
      const authorSets = filter.authors.map(a => this.eventsByAuthor.get(a) || new Set());
      const authorIds = this.unionSets(authorSets);
      candidateIds = candidateIds ? this.intersectSets([candidateIds, authorIds]) : authorIds;
    }
    
    // Tag filtering
    Object.entries(filter).forEach(([key, values]) => {
      if (key.startsWith('#') && Array.isArray(values) && values.length > 0) {
        const tagName = key.slice(1);
        const tagMap = this.eventsByTag.get(tagName);
        if (tagMap) {
          const tagSets = values.map(v => tagMap.get(v) || new Set());
          const tagIds = this.unionSets(tagSets);
          candidateIds = candidateIds ? this.intersectSets([candidateIds, tagIds]) : tagIds;
        } else {
          // No events with this tag
          candidateIds = new Set();
        }
      }
    });
    
    // Convert to events and apply remaining filters
    const events = Array.from(candidateIds || this.events.keys())
      .map(id => this.events.get(id)!)
      .filter(event => event && this.matchesFilter(event, filter))
      .sort((a, b) => b.created_at - a.created_at); // Most recent first
    
    // Apply limit
    if (filter.limit && filter.limit > 0) {
      return events.slice(0, filter.limit);
    }
    
    return events;
  }
  
  private matchesFilter(event: NostrEvent, filter: Filter): boolean {
    // Check time constraints
    if (filter.since && event.created_at < filter.since) return false;
    if (filter.until && event.created_at > filter.until) return false;
    
    // Check IDs filter
    if (filter.ids && filter.ids.length > 0 && !filter.ids.includes(event.id)) return false;
    
    // All other checks passed via indexes
    return true;
  }
  
  private unionSets(sets: Set<string>[]): Set<string> {
    const result = new Set<string>();
    sets.forEach(set => {
      set.forEach(item => result.add(item));
    });
    return result;
  }
  
  private intersectSets(sets: Set<string>[]): Set<string> {
    if (sets.length === 0) return new Set();
    if (sets.length === 1) return sets[0];
    
    const result = new Set<string>();
    const firstSet = sets[0];
    
    firstSet.forEach(item => {
      if (sets.every(set => set.has(item))) {
        result.add(item);
      }
    });
    
    return result;
  }
  
  private notifySubscribers(event: NostrEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }
  
  private updateAccessTracking(eventId: string): void {
    if (this.config.evictionPolicy !== 'lru') return;
    
    const now = Date.now();
    let node = this.lruNodes.get(eventId);
    
    if (node) {
      // Move existing node to head (most recently used)
      this.moveToHead(node);
      node.timestamp = now;
    } else {
      // Create new node at head
      node = {
        eventId,
        prev: null,
        next: null,
        timestamp: now
      };
      this.lruNodes.set(eventId, node);
      this.addToHead(node);
    }
  }
  
  // O(1) LRU operations using doubly-linked list
  private addToHead(node: LRUNode): void {
    node.prev = null;
    node.next = this.lruHead;
    
    if (this.lruHead) {
      this.lruHead.prev = node;
    }
    this.lruHead = node;
    
    if (!this.lruTail) {
      this.lruTail = node;
    }
  }
  
  private removeNode(node: LRUNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.lruHead = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.lruTail = node.prev;
    }
  }
  
  private moveToHead(node: LRUNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }
  
  private enforceCapacityLimits(): void {
    // Check event count limit
    if (this.events.size >= this.config.maxEvents) {
      this.evictOldest();
    }
    
    // Check memory limit (rough estimation)
    const estimatedMemoryMB = this.estimateMemoryUsage();
    if (estimatedMemoryMB > this.config.maxMemoryMB) {
      // Evict until under limit
      while (this.estimateMemoryUsage() > this.config.maxMemoryMB && this.events.size > 0) {
        this.evictOldest();
      }
    }
  }
  
  private evictOldest(): void {
    let eventIdToEvict: string | undefined;
    
    if (this.config.evictionPolicy === 'lru') {
      // Evict least recently used - O(1) with doubly-linked list
      if (this.lruTail) {
        eventIdToEvict = this.lruTail.eventId;
      }
    } else {
      // FIFO: evict oldest by insertion order
      const firstKey = this.events.keys().next().value;
      eventIdToEvict = firstKey;
    }
    
    if (eventIdToEvict) {
      this.removeEvent(eventIdToEvict);
    }
  }
  
  private removeEvent(eventId: string): void {
    const event = this.events.get(eventId);
    if (!event) return;
    
    // Update statistics
    this.stats.evictedCount++;
    
    // Remove from main store
    this.events.delete(eventId);
    
    // Remove from indexes
    this.eventsByKind.get(event.kind)?.delete(eventId);
    this.eventsByAuthor.get(event.pubkey)?.delete(eventId);
    
    event.tags.forEach(tag => {
      const [tagName, tagValue] = tag;
      if (tagValue) {
        this.eventsByTag.get(tagName)?.get(tagValue)?.delete(eventId);
      }
    });
    
    // Remove from LRU tracking - O(1) with doubly-linked list
    const node = this.lruNodes.get(eventId);
    if (node) {
      this.removeNode(node);
      this.lruNodes.delete(eventId);
    }
  }
  
  private estimateMemoryUsage(): number {
    // Rough estimation: average 1KB per event
    return (this.events.size * 1024) / (1024 * 1024); // Convert to MB
  }
}