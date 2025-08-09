/**
 * Fluent Event Builder API
 * 
 * Provides a chainable, discoverable API for building and publishing Nostr events.
 * Implements the high-level vision API specification with full type safety.
 */

import { EventBuilder } from '../core/EventBuilder.js';
import type { NostrEvent, UnsignedEvent, PublishResult } from '../core/types.js';

/**
 * Fluent Event Builder - Chainable API for event creation
 */
export class FluentEventBuilder {
  private eventData: {
    kind?: number;
    content?: string;
    tags: string[][];
    created_at?: number;
  };
  
  private nostrInstance: any; // NostrUnchained instance for publishing
  private signed: boolean = false;
  private signedEvent: NostrEvent | undefined;
  private targetRelays?: string[]; // Optional relay selection

  constructor(nostrInstance: any) {
    this.nostrInstance = nostrInstance;
    this.eventData = {
      tags: []
    };
  }

  /**
   * Set the event kind
   */
  kind(kindNumber: number): FluentEventBuilder {
    this.eventData.kind = kindNumber;
    return this;
  }

  /**
   * Set the event content
   */
  content(text: string): FluentEventBuilder {
    this.eventData.content = text;
    return this;
  }

  /**
   * Add a tag to the event
   */
  tag(key: string, value: string, ...additionalValues: string[]): FluentEventBuilder {
    const tagArray = [key, value, ...additionalValues];
    this.eventData.tags.push(tagArray);
    return this;
  }

  /**
   * Add multiple tags at once
   */
  tags(tagArray: string[][]): FluentEventBuilder {
    this.eventData.tags.push(...tagArray);
    return this;
  }

  /**
   * Add a hashtag
   */
  hashtag(tag: string): FluentEventBuilder {
    this.eventData.tags.push(['t', tag]);
    return this;
  }

  /**
   * Add a reply-to tag (NIP-10 style)
   */
  replyTo(eventId: string, relayUrl?: string): FluentEventBuilder {
    if (relayUrl) {
      this.eventData.tags.push(['e', eventId, relayUrl, 'reply']);
    } else {
      this.eventData.tags.push(['e', eventId, '', 'reply']);
    }
    return this;
  }

  /**
   * Add a mention tag
   */
  mention(pubkey: string, relayUrl?: string): FluentEventBuilder {
    if (relayUrl) {
      this.eventData.tags.push(['p', pubkey, relayUrl]);
    } else {
      this.eventData.tags.push(['p', pubkey]);
    }
    return this;
  }

  /**
   * Add a subject tag
   */
  subject(subjectText: string): FluentEventBuilder {
    this.eventData.tags.push(['subject', subjectText]);
    return this;
  }

  /**
   * Set custom timestamp
   */
  timestamp(unixTimestamp: number): FluentEventBuilder {
    this.eventData.created_at = unixTimestamp;
    return this;
  }

  /**
   * Specify which relays to publish to (overrides default relays)
   */
  toRelays(...relayUrls: string[]): FluentEventBuilder {
    this.targetRelays = relayUrls;
    return this;
  }

  /**
   * Specify which relays to publish to via array
   */
  toRelayList(relayUrls: string[]): FluentEventBuilder {
    this.targetRelays = relayUrls;
    return this;
  }

  /**
   * Explicitly sign the event (optional - auto-signs on publish)
   */
  async sign(): Promise<FluentEventBuilder> {
    // Content validation - some event types allow empty content
    const kind = this.eventData.kind || 1;
    const emptyAllowedKinds = new Set<number>([3, 5, 6, 7, 10002, 1984, 30000, 30001, 30002, 30003]);
    const contentRequired = !emptyAllowedKinds.has(kind);
    if (contentRequired && (!this.eventData.content || this.eventData.content.length === 0)) {
      throw new Error('Content is required before signing');
    }

    // Use EventBuilder directly to create and sign the event
    const signingProvider = this.nostrInstance.signingProvider;
    if (!signingProvider) {
      throw new Error('No signing provider available. Call initializeSigning() first.');
    }

    const unsignedEvent = {
      pubkey: await signingProvider.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1000)
    };

    // Validate the event
    const validation = EventBuilder.validateEvent(unsignedEvent);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }

    // Calculate event ID
    const id = EventBuilder.calculateEventId(unsignedEvent);
    
    // Sign the event
    const signedEvent: NostrEvent = {
      ...unsignedEvent,
      id,
      sig: await signingProvider.signEvent({ ...unsignedEvent, id })
    };

    this.signedEvent = signedEvent;
    this.signed = true;
    return this;
  }

  /**
   * Get the built event without publishing (useful for preview)
   */
  async build(): Promise<NostrEvent> {
    if (this.signed && this.signedEvent) {
      return this.signedEvent;
    }

    // Auto-sign if not already signed
    await this.sign();
    return this.signedEvent!;
  }

  /**
   * Publish the event to relays
   */
  async publish(): Promise<PublishResult> {
    // Content validation - some event types allow empty content
    const kind = this.eventData.kind || 1;
    const emptyAllowedKinds = new Set<number>([3, 5, 6, 7, 10002, 1984, 30000, 30001, 30002, 30003]);
    const contentRequired = !emptyAllowedKinds.has(kind);
    if (contentRequired && (!this.eventData.content || this.eventData.content.length === 0)) {
      throw new Error('Content is required before publishing');
    }

    // If we have a pre-signed event, publish it directly
    if (this.signed && this.signedEvent) {
      const relayResults = this.targetRelays
        ? await this.nostrInstance.relayManager.publishToRelays(this.signedEvent, this.targetRelays)
        : await this.nostrInstance.relayManager.publishToAll(this.signedEvent);
      const success = relayResults.some(r => r.success);
      return {
        success,
        eventId: success ? this.signedEvent.id : undefined,
        event: success ? this.signedEvent : undefined,
        relayResults,
        timestamp: Date.now(),
        error: success ? undefined : {
          message: 'Failed to publish to any relay',
          code: 'PUBLISH_FAILED',
          retryable: true
        }
      };
    }

    // Get the signing provider and pubkey
    const signingProvider = this.nostrInstance.signingProvider;
    if (!signingProvider) {
      throw new Error('No signing provider available. Call initializeSigning() first.');
    }

    const pubkey = await signingProvider.getPublicKey();

    // Use the NostrUnchained publish method (with optional relay selection)
    const eventData = {
      pubkey,
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1000)
    };

    return this.targetRelays
      ? await this.nostrInstance.publishToRelays(eventData, this.targetRelays)
      : await this.nostrInstance.publish(eventData);
  }

  /**
   * Get the current event data (for debugging/inspection)
   */
  getEventData() {
    return { ...this.eventData };
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): FluentEventBuilder {
    this.eventData = { tags: [] };
    this.signed = false;
    this.signedEvent = undefined;
    return this;
  }
}

/**
 * Events Module for NostrUnchained
 * 
 * Provides access to the fluent event builder API
 */
export class EventsModule {
  private nostrInstance: any;

  constructor(nostrInstance: any) {
    this.nostrInstance = nostrInstance;
  }

  /**
   * Create a new fluent event builder
   */
  create(): FluentEventBuilder {
    return new FluentEventBuilder(this.nostrInstance);
  }

  /**
   * Direct fluent API - start with kind
   */
  kind(kindNumber: number): FluentEventBuilder {
    return new FluentEventBuilder(this.nostrInstance).kind(kindNumber);
  }

  /**
   * Direct fluent API - start with content  
   */
  content(text: string): FluentEventBuilder {
    return new FluentEventBuilder(this.nostrInstance).content(text);
  }

  /**
   * Quick create text note
   */
  note(content: string): FluentEventBuilder {
    return this.create().kind(1).content(content);
  }

  /**
   * Quick create DM
   */
  dm(content: string, recipientPubkey: string): FluentEventBuilder {
    return this.create()
      .kind(4)
      .content(content)
      .tag('p', recipientPubkey);
  }

  /**
   * Quick create job posting
   */
  job(content: string): FluentEventBuilder {
    return this.create()
      .kind(30023)
      .content(content)
      .tag('t', 'jobs');
  }

  /**
   * Quick create reaction
   */
  reaction(eventId: string, reaction: string = '+'): FluentEventBuilder {
    return this.create()
      .kind(7)
      .content(reaction)
      .tag('e', eventId);
  }

  /**
   * Quick create deletion event (NIP-09)
   */
  deletion(eventId: string, reason?: string): FluentEventBuilder {
    return this.create()
      .kind(5) // NIP-09 deletion event
      .content(reason || '') // Optional deletion reason
      // Use marked tag format preferred by NIP-10-style conventions: add marker 'deletion'
      .tag('e', eventId, '', 'deletion'); // Reference to event being deleted
  }

  /**
   * Direct publish from JSON data (bypasses fluent building)
   */
  async publish(eventData: any): Promise<any> {
    return await this.nostrInstance.publish(eventData);
  }
}