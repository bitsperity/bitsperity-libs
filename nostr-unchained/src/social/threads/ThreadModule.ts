/**
 * ThreadModule - Clean Architecture NIP-10 Threading Operations
 * 
 * 100% Clean Architecture implementation:
 * - Uses nostr.query() for cache-first reactive data
 * - Uses nostr.sub() for live updates
 * - Returns UniversalNostrStore for all reactive data
 * - No direct cache or SubscriptionManager access
 */

import type { NostrUnchained } from '../../core/NostrUnchained.js';
import type { UniversalNostrStore } from '../../store/UniversalNostrStore.js';
import type { NostrEvent } from '../../core/types.js';

export interface ThreadEvent extends NostrEvent {
  // Additional thread-specific properties
  depth: number;
  rootEventId: string | null;
  replyToEventId: string | null;
  threadPath: string[];
}

export interface ThreadSummary {
  rootEventId: string;
  totalReplies: number;
  maxDepth: number;
  participants: string[];
  latestReply?: ThreadEvent;
  rootEvent?: ThreadEvent;
}

export interface ThreadFilters {
  authors?: string[];
  since?: number;
  until?: number;
  limit?: number;
  maxDepth?: number;
}

export class ThreadModule {
  constructor(private nostr: NostrUnchained, private debug?: boolean) {
    if (this.debug) {
      console.log('🧵 ThreadModule initialized with Clean Architecture');
    }
  }

  /**
   * Get complete thread by root event ID (reactive)
   * Returns all replies in chronological order with proper threading
   */
  thread(rootEventId: string, filters: ThreadFilters = {}): UniversalNostrStore<ThreadEvent[]> {
    // Start subscription for live updates
    this.startThreadSubscription(rootEventId, filters);
    
    // Return reactive store with thread events
    let queryBuilder = this.nostr.query().kinds([1]);
    
    // Query for root event and all replies referencing it
    queryBuilder = queryBuilder.tags('e', [rootEventId]);
    
    if (filters.since) {
      queryBuilder = queryBuilder.since(filters.since);
    }
    if (filters.until) {
      queryBuilder = queryBuilder.until(filters.until);
    }
    if (filters.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }

    return queryBuilder.execute()
      .map(events => this.buildThreadStructure(events, rootEventId));
  }

  /**
   * Get thread summary with statistics (reactive)
   */
  summary(rootEventId: string): UniversalNostrStore<ThreadSummary> {
    // Start subscription for live updates
    this.startThreadSubscription(rootEventId);
    
    return this.nostr.query()
      .kinds([1])
      .tags('e', [rootEventId])
      .execute()
      .map(events => this.aggregateThreadSummary(events, rootEventId));
  }

  /**
   * Get threads where user participated (reactive)
   * Returns threads where the user has posted or replied
   */
  myThreads(filters: ThreadFilters = {}): UniversalNostrStore<ThreadSummary[]> {
    const myPubkey = this.nostr.me;
    if (!myPubkey) {
      return this.createEmptyStore();
    }

    // Start subscription for user's events
    this.startUserThreadsSubscription(myPubkey, filters);
    
    return this.nostr.query()
      .kinds([1])
      .authors([myPubkey])
      .execute()
      .map(events => this.extractThreadSummaries(events));
  }

  /**
   * Get recent threads from followed users (reactive)
   * Requires user to be signed in and have a follow list
   */
  followingThreads(filters: ThreadFilters = {}): UniversalNostrStore<ThreadSummary[]> {
    const myPubkey = this.nostr.me;
    if (!myPubkey) {
      return this.createEmptyStore();
    }

    // Get follow list first, then fetch their threads
    const followsStore = this.nostr.query()
      .kinds([3])
      .authors([myPubkey])
      .limit(1)
      .execute();

    return followsStore.map(followEvents => {
      if (!followEvents || followEvents.length === 0) {
        return [];
      }

      const followEvent = followEvents[0];
      const followedPubkeys = followEvent.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1]);

      if (followedPubkeys.length === 0) {
        return [];
      }

      // Start subscription for followed users' threads
      this.startFollowingThreadsSubscription(followedPubkeys, filters);

      // This is a simplified approach - in a real implementation,
      // we'd need a more sophisticated way to get thread summaries
      return [];
    });
  }

  /**
   * Reply to an event (creates a threaded reply)
   */
  async reply(
    eventId: string, 
    content: string, 
    mentionedPubkeys: string[] = []
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Get the target event to understand thread structure
      const targetEvent = await this.getEvent(eventId);
      if (!targetEvent) {
        return { success: false, error: 'Target event not found' };
      }

      // Determine thread structure based on NIP-10
      const { rootEventId, replyEventId } = this.determineThreadStructure(targetEvent);

      // Create reply event with proper NIP-10 structure
      let eventBuilder = this.nostr.events
        .create()
        .kind(1)
        .content(content);

      // Add e-tags according to NIP-10
      if (rootEventId && rootEventId !== eventId) {
        // Add root marker if this is not a direct reply to root
        eventBuilder = eventBuilder.tag('e', rootEventId, '', 'root');
      }
      
      // Add reply marker
      eventBuilder = eventBuilder.tag('e', eventId, '', 'reply');

      // Add p-tag for mentioned users (NIP-10)
      eventBuilder = eventBuilder.tag('p', targetEvent.pubkey);
      
      // Add additional mentioned users
      for (const mentionedPubkey of mentionedPubkeys) {
        if (mentionedPubkey !== targetEvent.pubkey) {
          eventBuilder = eventBuilder.tag('p', mentionedPubkey);
        }
      }

      const result = await eventBuilder.publish();

      if (this.debug) {
        console.log(`ThreadModule: Published reply to event ${eventId.substring(0, 8)}...`);
      }

      return { 
        success: result.success, 
        eventId: result.eventId,
        error: result.error?.message 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to publish reply' 
      };
    }
  }

  /**
   * Get thread by ID (alias for thread method for API compatibility)
   */
  get(rootEventId: string, options?: { useCache?: boolean; timeout?: number }): Promise<ThreadEvent[]> {
    return new Promise((resolve) => {
      const store = this.thread(rootEventId);
      let unsubscribe: (() => void) | null = null;
      unsubscribe = store.subscribe(events => {
        if (unsubscribe) {
          const fn = unsubscribe;
          unsubscribe = null;
          fn();
        }
        resolve(events);
      });
    });
  }

  /**
   * Watch thread for real-time updates (returns subscription status)
   */
  async watch(rootEventId: string): Promise<boolean> {
    try {
      await this.startThreadSubscription(rootEventId);
      return true;
    } catch (error) {
      if (this.debug) {
        console.warn(`Failed to watch thread ${rootEventId}:`, error);
      }
      return false;
    }
  }

  /**
   * Create a new thread (root post)
   */
  async createThread(
    params: { content: string; mentions?: string[] } | string,
    mentionedPubkeys: string[] = []
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    // Handle both old and new API
    let content: string;
    let mentions: string[];
    
    if (typeof params === 'string') {
      // Old API: createThread(content, mentionedPubkeys)
      content = params;
      mentions = mentionedPubkeys;
    } else {
      // New API: createThread({content, mentions})
      content = params.content;
      mentions = params.mentions || [];
    }
    // Check if signing is available through the events builder
    try {
      // The events builder will throw if no signing provider is available
      this.nostr.events;
    } catch (error) {
      return { success: false, error: 'No signing provider available. Please initialize signing first.' };
    }

    try {
      // Create root thread event
      let eventBuilder = this.nostr.events
        .note(content);

      // Add p-tags for mentioned users
      for (const mentionedPubkey of mentions) {
        eventBuilder = eventBuilder.tag('p', mentionedPubkey);
      }

      const result = await eventBuilder.publish();

      if (this.debug) {
        console.log(`ThreadModule: Created new thread with content "${content.substring(0, 50)}..."`);
      }

      // Get the current user's pubkey for the message
      let authorPubkey = '';
      try {
        // Try multiple ways to get the pubkey
        authorPubkey = this.nostr.me || result.pubkey || '';
        if (!authorPubkey && this.nostr.getMyPubkey) {
          const myPubkey = await this.nostr.getMyPubkey();
          authorPubkey = myPubkey || '';
        }
      } catch (error) {
        // Fall back to result.pubkey if available
        authorPubkey = result.pubkey || '';
      }

      return { 
        success: result.success, 
        eventId: result.eventId,
        error: result.error?.message,
        message: result.success ? {
          id: result.eventId || '',
          content,
          authorPubkey,
          timestamp: Math.floor(Date.now() / 1000),
          isOwn: true
        } : undefined
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create thread' 
      };
    }
  }

  // Private helper methods

  private async startThreadSubscription(rootEventId: string, filters: ThreadFilters = {}): Promise<void> {
    try {
      let subBuilder = this.nostr.sub()
        .kinds([1])
        .tags('e', [rootEventId]);
      
      if (filters.since) {
        subBuilder = subBuilder.since(filters.since);
      }
      if (filters.until) {
        subBuilder = subBuilder.until(filters.until);
      }
      if (filters.limit) {
        subBuilder = subBuilder.limit(filters.limit);
      }

      await subBuilder.execute();
    } catch (error) {
      if (this.debug) {
        console.warn(`Failed to start thread subscription for ${rootEventId}:`, error);
      }
    }
  }

  private async startUserThreadsSubscription(pubkey: string, filters: ThreadFilters): Promise<void> {
    try {
      let subBuilder = this.nostr.sub()
        .kinds([1])
        .authors([pubkey]);
      
      if (filters.since) {
        subBuilder = subBuilder.since(filters.since);
      }
      if (filters.limit) {
        subBuilder = subBuilder.limit(filters.limit);
      }

      await subBuilder.execute();
    } catch (error) {
      if (this.debug) {
        console.warn(`Failed to start user threads subscription for ${pubkey}:`, error);
      }
    }
  }

  private async startFollowingThreadsSubscription(pubkeys: string[], filters: ThreadFilters): Promise<void> {
    try {
      let subBuilder = this.nostr.sub()
        .kinds([1])
        .authors(pubkeys);
      
      if (filters.since) {
        subBuilder = subBuilder.since(filters.since);
      }
      if (filters.limit) {
        subBuilder = subBuilder.limit(filters.limit);
      }

      await subBuilder.execute();
    } catch (error) {
      if (this.debug) {
        console.warn('Failed to start following threads subscription:', error);
      }
    }
  }

  private async getEvent(eventId: string): Promise<NostrEvent | null> {
    // Start subscription to fetch the event if not in cache
    await this.nostr.sub()
      .ids([eventId])
      .limit(1)
      .execute();

    // Wait for the event to arrive
    await new Promise(resolve => setTimeout(resolve, 500));

    const eventStore = this.nostr.query()
      .ids([eventId])
      .limit(1)
      .execute();

    const events = eventStore.current;
    return events && events.length > 0 ? events[0] : null;
  }

  private buildThreadStructure(events: NostrEvent[], rootEventId: string): ThreadEvent[] {
    const threadEvents: ThreadEvent[] = [];
    
    // Convert events to ThreadEvents with threading information
    for (const event of events) {
      const threadEvent = this.analyzeThreadEvent(event, rootEventId);
      threadEvents.push(threadEvent);
    }

    // Sort by created_at (chronological order)
    threadEvents.sort((a, b) => a.created_at - b.created_at);

    return threadEvents;
  }

  private analyzeThreadEvent(event: NostrEvent, rootEventId: string): ThreadEvent {
    const eTags = event.tags.filter(tag => tag[0] === 'e');
    
    let depth = 0;
    let replyToEventId: string | null = null;
    let threadPath: string[] = [];
    let actualRootEventId: string | null = rootEventId;

    // Analyze e-tags according to NIP-10
    if (eTags.length > 0) {
      // Look for marked tags first (NIP-10 preferred format)
      const rootTag = eTags.find(tag => tag[3] === 'root');
      const replyTag = eTags.find(tag => tag[3] === 'reply');

      if (rootTag) {
        actualRootEventId = rootTag[1];
      }
      
      if (replyTag) {
        replyToEventId = replyTag[1];
        depth = 1; // At least depth 1 if replying to something
      }

      // If no marked tags, use positional method (NIP-10 deprecated format)
      if (!replyTag && eTags.length > 0) {
        if (eTags.length === 1) {
          // Single e-tag is the event being replied to
          replyToEventId = eTags[0][1];
          depth = 1;
        } else {
          // Multiple e-tags: first is root, last is reply
          actualRootEventId = eTags[0][1];
          replyToEventId = eTags[eTags.length - 1][1];
          depth = eTags.length - 1;
        }
      }

      // Build thread path
      threadPath = eTags.map(tag => tag[1]);
    }

    return {
      ...event,
      depth,
      rootEventId: actualRootEventId,
      replyToEventId,
      threadPath
    };
  }

  private determineThreadStructure(targetEvent: NostrEvent): { rootEventId: string; replyEventId: string } {
    const eTags = targetEvent.tags.filter(tag => tag[0] === 'e');
    
    if (eTags.length === 0) {
      // Target is a root event
      return {
        rootEventId: targetEvent.id,
        replyEventId: targetEvent.id
      };
    }

    // Look for marked tags (NIP-10 preferred)
    const rootTag = eTags.find(tag => tag[3] === 'root');
    
    if (rootTag) {
      return {
        rootEventId: rootTag[1],
        replyEventId: targetEvent.id
      };
    }

    // Use positional method (NIP-10 deprecated)
    if (eTags.length === 1) {
      // Single e-tag, target is replying to root
      return {
        rootEventId: eTags[0][1],
        replyEventId: targetEvent.id
      };
    } else {
      // Multiple e-tags, first is root
      return {
        rootEventId: eTags[0][1],
        replyEventId: targetEvent.id
      };
    }
  }

  private aggregateThreadSummary(events: NostrEvent[], rootEventId: string): ThreadSummary {
    let totalReplies = 0;
    let maxDepth = 0;
    const participants = new Set<string>();
    let latestReply: ThreadEvent | undefined;
    let rootEvent: ThreadEvent | undefined;

    for (const event of events) {
      const threadEvent = this.analyzeThreadEvent(event, rootEventId);
      
      if (threadEvent.id === rootEventId) {
        rootEvent = threadEvent;
      } else {
        totalReplies++;
        
        if (!latestReply || threadEvent.created_at > latestReply.created_at) {
          latestReply = threadEvent;
        }
      }
      
      maxDepth = Math.max(maxDepth, threadEvent.depth);
      participants.add(threadEvent.pubkey);
    }

    return {
      rootEventId,
      totalReplies,
      maxDepth,
      participants: Array.from(participants),
      latestReply,
      rootEvent
    };
  }

  private extractThreadSummaries(events: NostrEvent[]): ThreadSummary[] {
    const threadMap = new Map<string, NostrEvent[]>();
    
    // Group events by thread
    for (const event of events) {
      const eTags = event.tags.filter(tag => tag[0] === 'e');
      
      if (eTags.length === 0) {
        // Root event
        const rootId = event.id;
        if (!threadMap.has(rootId)) {
          threadMap.set(rootId, []);
        }
        threadMap.get(rootId)!.push(event);
      } else {
        // Reply event - determine root
        const rootTag = eTags.find(tag => tag[3] === 'root');
        const rootId = rootTag ? rootTag[1] : eTags[0][1];
        
        if (!threadMap.has(rootId)) {
          threadMap.set(rootId, []);
        }
        threadMap.get(rootId)!.push(event);
      }
    }

    // Convert to summaries
    const summaries: ThreadSummary[] = [];
    for (const [rootId, threadEvents] of threadMap) {
      const summary = this.aggregateThreadSummary(threadEvents, rootId);
      summaries.push(summary);
    }

    // Sort by latest activity
    summaries.sort((a, b) => {
      const aLatest = a.latestReply?.created_at || a.rootEvent?.created_at || 0;
      const bLatest = b.latestReply?.created_at || b.rootEvent?.created_at || 0;
      return bLatest - aLatest;
    });

    return summaries;
  }

  private createEmptyStore<T>(): UniversalNostrStore<T[]> {
    return this.nostr.query()
      .kinds([1])
      .authors(['']) // Empty author will never match
      .limit(1)
      .execute()
      .map(() => [] as T[]);
  }
}