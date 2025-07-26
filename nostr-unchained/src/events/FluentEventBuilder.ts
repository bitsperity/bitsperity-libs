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
  private signedEvent?: NostrEvent;

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
   * Explicitly sign the event (optional - auto-signs on publish)
   */
  async sign(): Promise<FluentEventBuilder> {
    if (!this.eventData.content) {
      throw new Error('Content is required before signing');
    }

    // Use the NostrUnchained instance to create and sign the event
    const signedEvent = await this.nostrInstance.createEvent({
      kind: this.eventData.kind,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at
    });

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
    if (!this.eventData.content) {
      throw new Error('Content is required before publishing');
    }

    // If we have a pre-signed event, publish it directly
    if (this.signed && this.signedEvent) {
      return await this.nostrInstance.publishEvent(this.signedEvent);
    }

    // For simple text notes with no custom settings, use the existing publish method
    if (this.eventData.kind === 1 && this.eventData.tags.length === 0 && !this.eventData.created_at) {
      return await this.nostrInstance.publish(this.eventData.content);
    }

    // For complex events, create and publish
    const signedEvent = await this.nostrInstance.createEvent({
      kind: this.eventData.kind,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at
    });

    return await this.nostrInstance.publishEvent(signedEvent);
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
}