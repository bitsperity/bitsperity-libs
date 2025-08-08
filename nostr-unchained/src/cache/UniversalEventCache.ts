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
import { EventBuilder } from '../core/EventBuilder.js';
import type { SigningProvider } from '../core/types.js';

export interface CacheConfig {
  maxEvents?: number; // Default: 10,000
  maxMemoryMB?: number; // Default: 50MB
  evictionPolicy?: 'lru' | 'fifo'; // Default: 'lru'
  debug?: boolean; // Emit console logs when true
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
  // P1: Remove private key state – decryptor-only
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
  
  constructor(_unused: unknown, config: CacheConfig = {}) {
    this.config = {
      maxEvents: config.maxEvents || 10000,
      maxMemoryMB: config.maxMemoryMB || 50,
      evictionPolicy: config.evictionPolicy || 'lru',
      debug: !!config.debug
    };
  }

  // Optional decryptor to use extension-based NIP-44 when available
  private decryptor: Pick<SigningProvider, 'nip44Decrypt'> | null = null;
  setDecryptor(provider?: Pick<SigningProvider, 'nip44Decrypt'> | null) {
    this.decryptor = provider ?? null;
  }
  
  // setPrivateKey removed in P1
  
  /**
   * Re-process all stored gift wrap (kind 1059) events using the current private key.
   * Useful after the private key becomes available to decrypt previously seen wraps.
   */
  async reprocessGiftWraps(): Promise<void> {
    const wraps: NostrEvent[] = [];
    for (const event of this.events.values()) {
      if (event.kind === 1059) {
        wraps.push(event);
      }
    }
    for (const wrap of wraps) {
      try {
        const decrypted = await this.unwrapGiftWrap(wrap);
        if (decrypted && decrypted.kind !== 1059) {
          // Directly index decrypted rumor without recursion to avoid re-adding wrap
          if (!this.events.has(decrypted.id)) {
            this.events.set(decrypted.id, decrypted);
            this.updateIndexes(decrypted);
            this.updateAccessTracking(decrypted.id);
            this.notifySubscribers(decrypted);
          }
        }
      } catch {
        // Ignore failures; we will try again if needed later
      }
    }
  }
  
  async addEvent(event: NostrEvent): Promise<void> {
    // Handle deletion events (NIP-09) generically: remove referenced events from cache
    if (event.kind === 5) {
      try {
        const candidateIds: string[] = [];
        for (const tag of event.tags) {
          if (Array.isArray(tag) && tag[0] === 'e' && typeof tag[1] === 'string' && tag[1]) {
            candidateIds.push(tag[1]);
          }
        }
        // NIP-09: Nur eigene Events dürfen gelöscht werden → filtere nach Autor
        const idsToDelete = candidateIds.filter((id) => {
          const existing = this.events.get(id);
          return !!existing && existing.pubkey === event.pubkey;
        });
        if (idsToDelete.length > 0) {
          if (this.config.debug) console.log('[UEC] Deletion event received – removing referenced events from cache', {
            deletionId: (event.id || '').substring(0, 8) + '...',
            count: idsToDelete.length,
            ids: idsToDelete.map((id) => id.substring(0, 8) + '...')
          });
          this.deleteEventsByIds(idsToDelete);
          if (this.config.debug) console.log('[UEC] Deletion processing complete');
        }
      } catch {}
      // Optionally store deletion event itself; for now, we skip storing to keep cache lean
      return;
    }
    
    // CRITICAL FIX: Store Gift Wrap events in cache regardless of decryption
    // Let the DM conversation handle decryption - cache should store all events
    if (event.kind === 1059) {
      // Store the Gift Wrap event itself in cache
      this.events.set(event.id, event);
      this.updateIndexes(event);
      this.updateAccessTracking(event.id);
      this.notifySubscribers(event);
      
      // Additionally, try to decrypt and store decrypted content if possible
      try {
        const decrypted = await this.unwrapGiftWrap(event);
        if (decrypted) {
          await this.addEvent(decrypted); // Recursive: add unwrapped content
        }
      } catch (error) {
        // Failed to decrypt - that's fine, we still stored the Gift Wrap
        console.debug('Failed to unwrap gift wrap (stored anyway):', error);
      }
      return;
    }
    
    // Check capacity before adding
    this.enforceCapacityLimits();
    
    // All other events go directly into cache
    this.events.set(event.id, event);
    this.updateIndexes(event);
    this.updateAccessTracking(event.id);
    this.notifySubscribers(event);
  }

  /**
   * Public API: Remove a list of events by ID and notify subscribers so stores update reactively
   */
  deleteEventsByIds(eventIds: string[]): void {
    for (const id of eventIds) {
      const existing = this.events.get(id);
      if (!existing) continue;
      // IMPORTANT: Remove first, then notify so reactive queries see the updated state (without the event)
      this.removeEvent(id);
      console.log('[UEC] Removed event from cache', { id: id.substring(0, 8) + '...', kind: existing.kind });
      this.notifySubscribers(existing);
    }
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
    // Prefer decryptor (extension) if available; fallback to local hex key
    if (this.decryptor && typeof this.decryptor.nip44Decrypt === 'function') {
      try {
        // Use giftwrap pubkey for conversation key (sender of wrap)
        const sealResult = await this.decryptor.nip44Decrypt(giftWrap.pubkey, giftWrap.content);
        if (!sealResult) return null;
        const sealEvent = JSON.parse(sealResult);
        const rumorContent = await this.decryptor.nip44Decrypt(sealEvent.pubkey, sealEvent.content);
        if (!rumorContent) return null;
        const rumorEvent = JSON.parse(rumorContent);
        return this.normalizeRumorFromWrap(giftWrap, rumorEvent);
      } catch {
        // fall back to local key below
      }
    }

    // No decryptor and no local key fallback in P1
    return null;
  }

  private normalizeRumorFromWrap(giftWrap: NostrEvent, rumorEvent: any): NostrEvent | null {
    try {
      // Preserve recipient context from the gift wrap's p-tag
      const pTag = giftWrap.tags.find((t): t is [string, string, ...string[]] => Array.isArray(t) && typeof t[0] === 'string');
      const recipientPubkey: string = pTag && typeof pTag[1] === 'string' ? (pTag[1] as string) : '';

      const originalTags: string[][] = Array.isArray(rumorEvent?.tags) ? rumorEvent.tags : [];
      const hasRecipientTag = originalTags.some((t) => Array.isArray(t) && t[0] === 'p');
      const mergedTags = hasRecipientTag || !recipientPubkey
        ? originalTags
        : [...originalTags, ['p', recipientPubkey]];

      const normalized: NostrEvent = {
        id: '',
        pubkey: rumorEvent.pubkey,
        created_at: rumorEvent.created_at,
        kind: rumorEvent.kind,
        tags: mergedTags,
        content: rumorEvent.content,
        sig: ''
      } as unknown as NostrEvent;
      (normalized as any).id = EventBuilder.calculateEventId(normalized as any);
      return normalized;
    } catch {
      return null;
    }
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
    event.tags.forEach((tag: string[]) => {
      const tagName = (tag[0] || '') as string;
      const tagVal = (tag[1] || '') as string;
      if (!tagName || !tagVal) return;

      if (!this.eventsByTag.has(tagName)) {
        this.eventsByTag.set(tagName, new Map<string, Set<string>>());
      }
      const tagMap = this.eventsByTag.get(tagName)!;

      if (!tagMap.has(tagVal)) {
        tagMap.set(tagVal, new Set<string>());
      }
      tagMap.get(tagVal)!.add(event.id);
    });
  }
  
  private getMatchingEvents(filter: Filter): NostrEvent[] {
    let candidateIds: Set<string> | undefined;
    
    // Use indexes for efficient filtering
    if (filter.kinds && (filter.kinds as number[]).length > 0) {
      const kindSets: Set<string>[] = (filter.kinds as number[]).map((k: number) => this.eventsByKind.get(k) || new Set<string>());
      candidateIds = this.unionSets(kindSets);
    }
    
    if (filter.authors && (filter.authors as string[]).length > 0) {
      const authorSets: Set<string>[] = (filter.authors as string[]).map((a: string) => this.eventsByAuthor.get(a) || new Set<string>());
      const authorIds = this.unionSets(authorSets);
      candidateIds = candidateIds ? this.intersectSets([candidateIds, authorIds]) : authorIds;
    }
    
    // Tag filtering
    Object.entries(filter).forEach(([key, values]) => {
      if (key.startsWith('#') && Array.isArray(values) && (values as string[]).length > 0) {
        const tagName = key.slice(1);
        const tagMap = this.eventsByTag.get(tagName);
        if (tagMap) {
          const tagSets: Set<string>[] = (values as string[]).map((v: string) => tagMap.get(v) || new Set<string>());
          const tagIds = this.unionSets(tagSets);
          candidateIds = candidateIds ? this.intersectSets([candidateIds, tagIds]) : tagIds;
        } else {
          // No events with this tag
          candidateIds = new Set();
        }
      }
    });
    
    // Convert to events and apply remaining filters
    const events = Array.from(candidateIds ?? new Set<string>(Array.from(this.events.keys())))
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
    if (sets.length === 1) return (sets[0] as Set<string>) || new Set<string>();
    
    const result = new Set<string>();
    const firstSet = sets[0] as Set<string>;
    
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
    
    event.tags.forEach((tag: string[]) => {
      const tagName = (tag[0] || '') as string;
      const tagVal = (tag[1] || '') as string;
      if (!tagName || !tagVal) return;
      this.eventsByTag.get(tagName)?.get(tagVal)?.delete(eventId);
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