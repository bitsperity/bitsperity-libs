/**
 * ContentModule - Clean Architecture NIP-01, NIP-18 Content Operations
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
import { createNaddr } from '../../utils/encoding-utils.js';

export interface ContentSummary {
  totalNotes: number;
  totalReposts: number;
  latestNote?: NostrEvent;
  latestRepost?: NostrEvent;
}

export interface ContentFilters {
  authors?: string[];
  since?: number;
  until?: number;
  limit?: number;
  kinds?: number[];
}

export interface ArticleMeta {
  identifier: string; // d tag
  title?: string;
  summary?: string;
  image?: string;
}

export class ArticleBuilder {
  private _d?: string;
  private _title?: string;
  private _summary?: string;
  private _image?: string;
  private _content?: string;
  private _hashtags: string[] = [];

  constructor(private nostr: NostrUnchained) {}

  identifier(d: string): this { this._d = d; return this; }
  title(t: string): this { this._title = t; return this; }
  summary(s: string): this { this._summary = s; return this; }
  image(url: string): this { this._image = url; return this; }
  content(body: string): this { this._content = body ?? ''; return this; }
  hashtag(tag: string): this { if (tag) this._hashtags.push(tag); return this; }

  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this._d) throw new Error('Article identifier (d) is required');
    if (!this._content) throw new Error('Article content must not be empty');
    const b = this.nostr.events.create().kind(30023).content(this._content).tag('d', this._d);
    if (this._title) b.tag('title', this._title);
    if (this._summary) b.tag('summary', this._summary);
    if (this._image) b.tag('image', this._image);
    for (const t of this._hashtags) b.hashtag(t);
    return await b.publish();
  }
}

export class ContentModule {
  constructor(private nostr: NostrUnchained, private debug?: boolean) {
    if (this.debug) {
      console.log('📝 ContentModule initialized with Clean Architecture');
    }
  }

  /** NIP-23: create/edit long-form article (kind 30023) */
  article(): ArticleBuilder { return new ArticleBuilder(this.nostr); }

  /** NIP-23: get latest article by author and identifier */
  getArticle(authorPubkey: string, identifier: string): UniversalNostrStore<NostrEvent | null> {
    // subscription-first
    this.nostr.sub().kinds([30023]).authors([authorPubkey]).execute().catch(() => {});
    return this.nostr.query().kinds([30023]).authors([authorPubkey]).execute().map((events: NostrEvent[]) => {
      const filtered = events.filter(e => e.tags.some(t => t[0] === 'd' && t[1] === identifier));
      return filtered.sort((a, b) => b.created_at - a.created_at)[0] ?? null;
    });
  }

  /** NIP-23: list articles by author (reactive) */
  articles(authorPubkey: string, opts?: { limit?: number }): UniversalNostrStore<NostrEvent[]> {
    this.nostr.sub().kinds([30023]).authors([authorPubkey]).execute().catch(() => {});
    let qb = this.nostr.query().kinds([30023]).authors([authorPubkey]);
    if (opts?.limit) qb = qb.limit(opts.limit);
    return qb.execute().map((events: NostrEvent[]) => events.sort((a, b) => b.created_at - a.created_at));
  }

  /** Convenience: build naddr for an article */
  async naddrForArticle(authorPubkey: string, identifier: string, relays?: string[]): Promise<string> {
    return createNaddr(identifier, authorPubkey, 30023, relays);
  }

  /**
   * Get text notes (NIP-01) from specific authors (reactive)
   * Returns real-time stream of text notes
   */
  notes(filters: ContentFilters = {}): UniversalNostrStore<NostrEvent[]> {
    const finalFilters = {
      kinds: [1], // Text notes
      limit: filters.limit || 50,
      ...filters
    };

    // Start subscription for live updates
    this.startContentSubscription(finalFilters);
    
    // Return reactive store
    let queryBuilder = this.nostr.query().kinds([1]);
    
    if (finalFilters.authors) {
      queryBuilder = queryBuilder.authors(finalFilters.authors);
    }
    if (finalFilters.since) {
      queryBuilder = queryBuilder.since(finalFilters.since);
    }
    if (finalFilters.until) {
      queryBuilder = queryBuilder.until(finalFilters.until);
    }
    if (finalFilters.limit) {
      queryBuilder = queryBuilder.limit(finalFilters.limit);
    }

    return queryBuilder.execute();
  }

  /**
   * Get reposts (NIP-18) from specific authors (reactive)
   * Returns real-time stream of repost events
   */
  reposts(filters: ContentFilters = {}): UniversalNostrStore<NostrEvent[]> {
    const finalFilters = {
      kinds: [6], // Reposts
      limit: filters.limit || 50,
      ...filters
    };

    // Start subscription for live updates
    this.startContentSubscription(finalFilters);
    
    // Return reactive store
    let queryBuilder = this.nostr.query().kinds([6]);
    
    if (finalFilters.authors) {
      queryBuilder = queryBuilder.authors(finalFilters.authors);
    }
    if (finalFilters.since) {
      queryBuilder = queryBuilder.since(finalFilters.since);
    }
    if (finalFilters.until) {
      queryBuilder = queryBuilder.until(finalFilters.until);
    }
    if (finalFilters.limit) {
      queryBuilder = queryBuilder.limit(finalFilters.limit);
    }

    return queryBuilder.execute();
  }

  /**
   * Get combined content feed (notes + reposts) (reactive)
   * Returns chronologically sorted content from authors
   */
  feed(filters: ContentFilters = {}): UniversalNostrStore<NostrEvent[]> {
    const finalFilters = {
      kinds: [1, 6], // Notes and reposts
      limit: filters.limit || 50,
      ...filters
    };

    // Start subscription for live updates
    this.startContentSubscription(finalFilters);
    
    // Return reactive store
    let queryBuilder = this.nostr.query().kinds([1, 6]);
    
    if (finalFilters.authors) {
      queryBuilder = queryBuilder.authors(finalFilters.authors);
    }
    if (finalFilters.since) {
      queryBuilder = queryBuilder.since(finalFilters.since);
    }
    if (finalFilters.until) {
      queryBuilder = queryBuilder.until(finalFilters.until);
    }
    if (finalFilters.limit) {
      queryBuilder = queryBuilder.limit(finalFilters.limit);
    }

    return queryBuilder.execute()
      .map(events => this.sortByCreatedAt(events));
  }

  /**
   * Get content summary for authors (reactive)
   * Returns aggregated statistics about content
   */
  summary(authors: string[]): UniversalNostrStore<ContentSummary> {
    // Start subscription for live updates
    this.startContentSubscription({ authors, kinds: [1, 6] });
    
    return this.nostr.query()
      .kinds([1, 6])
      .authors(authors)
      .execute()
      .map(events => this.aggregateContentSummary(events));
  }

  /**
   * Publish a text note (NIP-01)
   */
  async publishNote(content: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const result = await this.nostr.events
        .note(content)
        .publish();

      if (this.debug) {
        console.log(`ContentModule: Published note "${content.substring(0, 50)}..."`);
      }

      return { 
        success: result.success, 
        eventId: result.eventId,
        error: result.error?.message 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to publish note' 
      };
    }
  }

  /**
   * Publish a repost (NIP-18)
   */
  async repost(eventId: string, relayHint?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Get the original event to include its author in p-tag
      const originalEvent = await this.getEvent(eventId);
      if (!originalEvent) {
        return { success: false, error: 'Original event not found' };
      }

      // Create repost event (kind 6) with proper NIP-18 structure
      const result = await this.nostr.events
        .create()
        .kind(6) // Repost kind
        .content('') // Empty content per NIP-18 specification
        .tag('e', eventId, relayHint || '') // Reference to original event with optional relay hint
        .tag('p', originalEvent.pubkey) // Reference to original author
        .publish();

      if (this.debug) {
        console.log(`ContentModule: Reposted event ${eventId.substring(0, 8)}...`);
      }

      return { 
        success: result.success, 
        eventId: result.eventId,
        error: result.error?.message 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to publish repost' 
      };
    }
  }

  // Private helper methods

  private async startContentSubscription(filters: ContentFilters): Promise<void> {
    try {
      let subBuilder = this.nostr.sub();
      
      if (filters.kinds) {
        subBuilder = subBuilder.kinds(filters.kinds);
      }
      if (filters.authors) {
        subBuilder = subBuilder.authors(filters.authors);
      }
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
        console.warn('Failed to start content subscription:', error);
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

  private sortByCreatedAt(events: NostrEvent[]): NostrEvent[] {
    return [...events].sort((a, b) => b.created_at - a.created_at);
  }

  private aggregateContentSummary(events: NostrEvent[]): ContentSummary {
    const notes = events.filter(e => e.kind === 1);
    const reposts = events.filter(e => e.kind === 6);
    
    // Sort by created_at descending to get latest
    const sortedNotes = this.sortByCreatedAt(notes);
    const sortedReposts = this.sortByCreatedAt(reposts);

    return {
      totalNotes: notes.length,
      totalReposts: reposts.length,
      latestNote: sortedNotes[0],
      latestRepost: sortedReposts[0]
    };
  }
}