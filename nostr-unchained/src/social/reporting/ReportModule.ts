/**
 * ReportModule - NIP-56 Reporting
 * 
 * Clean implementation for content and user reporting:
 * - Kind 1984 report events
 * - Standard report types (nudity, malware, profanity, illegal, spam, impersonation, other)
 * - Support for NIP-32 labels (L/l tags)
 * - Reactive queries for reports
 */

import type { NostrUnchained } from '../../core/NostrUnchained.js';

export type ReportType = 
  | 'nudity' 
  | 'malware' 
  | 'profanity' 
  | 'illegal' 
  | 'spam' 
  | 'impersonation' 
  | 'other';

export interface ReportOptions {
  /** The pubkey being reported (REQUIRED) */
  pubkey: string;
  /** Optional event ID if reporting specific content */
  eventId?: string;
  /** Report type (REQUIRED) */
  type: ReportType;
  /** Optional additional information */
  reason?: string;
  /** Optional NIP-32 label namespace */
  labelNamespace?: string;
  /** Optional NIP-32 label value */
  labelValue?: string;
}

export class ReportBuilder {
  private pubkey?: string;
  private eventId?: string;
  private reportType?: ReportType;
  private content: string = '';
  private labelNamespace?: string;
  private labelValue?: string;

  constructor(private nostr: NostrUnchained) {}

  /**
   * Set the pubkey being reported (REQUIRED)
   */
  user(pubkey: string): this {
    this.pubkey = pubkey;
    return this;
  }

  /**
   * Set the event ID being reported (OPTIONAL)
   */
  event(eventId: string): this {
    this.eventId = eventId;
    return this;
  }

  /**
   * Set the report type (REQUIRED)
   */
  type(type: ReportType): this {
    this.reportType = type;
    return this;
  }

  /**
   * Set the reason for the report (OPTIONAL)
   */
  reason(text: string): this {
    this.content = text;
    return this;
  }

  /**
   * Add NIP-32 labels (OPTIONAL)
   */
  label(namespace: string, value: string): this {
    this.labelNamespace = namespace;
    this.labelValue = value;
    return this;
  }

  /**
   * Publish the report
   */
  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this.pubkey) {
      return { success: false, error: 'Pubkey is required' };
    }
    if (!this.reportType) {
      return { success: false, error: 'Report type is required' };
    }

    try {
      const builder = this.nostr.events
        .create()
        .kind(1984)
        .content(this.content);

      // Add p-tag with report type as 3rd entry
      builder.tag('p', this.pubkey, this.reportType);

      // Add e-tag if reporting specific content
      if (this.eventId) {
        builder.tag('e', this.eventId, this.reportType);
      }

      // Add NIP-32 labels if specified
      if (this.labelNamespace && this.labelValue) {
        builder.tag('L', this.labelNamespace);
        builder.tag('l', this.labelValue, this.labelNamespace);
      }

      const result = await builder.publish();

      return {
        success: result.success,
        eventId: result.eventId,
        error: result.error?.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish report'
      };
    }
  }
}

export class ReportModule {
  constructor(private nostr: NostrUnchained) {}

  /**
   * Create a new report using fluent builder API
   */
  create(): ReportBuilder {
    return new ReportBuilder(this.nostr);
  }

  /**
   * Simplified API: Report a user
   */
  async reportUser(pubkey: string, type: ReportType, reason?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    return this.create()
      .user(pubkey)
      .type(type)
      .reason(reason || '')
      .publish();
  }

  /**
   * Simplified API: Report an event/note
   */
  async reportEvent(eventId: string, authorPubkey: string, type: ReportType, reason?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    return this.create()
      .user(authorPubkey)
      .event(eventId)
      .type(type)
      .reason(reason || '')
      .publish();
  }

  /**
   * Get reports for a specific user
   */
  forUser(pubkey: string) {
    // Subscription-first
    this.nostr.sub().kinds([1984]).tags('p', [pubkey]).execute().catch(() => {});
    return this.nostr.query().kinds([1984]).tags('p', [pubkey]).execute();
  }

  /**
   * Get reports for a specific event
   */
  forEvent(eventId: string) {
    // Subscription-first
    this.nostr.sub().kinds([1984]).tags('e', [eventId]).execute().catch(() => {});
    return this.nostr.query().kinds([1984]).tags('e', [eventId]).execute();
  }

  /**
   * Get all reports by a specific reporter
   */
  byReporter(reporterPubkey: string) {
    // Subscription-first
    this.nostr.sub().kinds([1984]).authors([reporterPubkey]).execute().catch(() => {});
    return this.nostr.query().kinds([1984]).authors([reporterPubkey]).execute();
  }
}

