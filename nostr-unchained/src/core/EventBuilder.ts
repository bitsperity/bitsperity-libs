/**
 * NIP-01 Compliant Event Builder
 * 
 * Handles creation, validation, and signing of Nostr events
 * according to NIP-01 specification. Pure vanilla implementation.
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import type { NostrEvent, UnsignedEvent, ValidationResult } from './types.js';
import { EVENT_KINDS, ERROR_MESSAGES, DEFAULT_CONFIG, VALIDATION_PATTERNS } from '../utils/constants.js';

export class EventBuilder {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(content: string, pubkey: string): UnsignedEvent {
    return {
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: EVENT_KINDS.TEXT_NOTE,
      tags: [],
      content
    };
  }

  /**
   * Calculate event ID according to NIP-01 specification
   * 
   * The event ID is the SHA256 hash of the serialized event data:
   * [0, pubkey, created_at, kind, tags, content]
   */
  static calculateEventId(event: UnsignedEvent): string {
    // NIP-01 compliant serialization - exact format matters!
    const serializedEvent = JSON.stringify([
      0,                     // Reserved future use
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);

    // Convert to UTF-8 bytes and hash with SHA256
    const eventBytes = new TextEncoder().encode(serializedEvent);
    const hashBytes = sha256(eventBytes);
    
    // Return as lowercase hex string
    return bytesToHex(hashBytes);
  }

  /**
   * Add event ID to unsigned event
   */
  static addEventId(event: UnsignedEvent): UnsignedEvent & { id: string } {
    const id = EventBuilder.calculateEventId(event);
    return { ...event, id };
  }

  /**
   * Validate event structure and content
   */
  static validateEvent(event: Partial<NostrEvent>): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!event.pubkey) errors.push('Missing pubkey');
    if (!event.created_at) errors.push('Missing created_at');
    if (typeof event.kind !== 'number') errors.push('Missing or invalid kind');
    if (!Array.isArray(event.tags)) errors.push('Missing or invalid tags');
    if (typeof event.content !== 'string') errors.push('Missing or invalid content');

    // Format validation
    if (event.pubkey && !VALIDATION_PATTERNS.HEX_64.test(event.pubkey)) {
      errors.push('Invalid pubkey format (must be 64-character hex string)');
    }

    if (event.id && !VALIDATION_PATTERNS.HEX_64.test(event.id)) {
      errors.push('Invalid event ID format (must be 64-character hex string)');
    }

    if (event.sig && !VALIDATION_PATTERNS.HEX_128.test(event.sig)) {
      errors.push('Invalid signature format (must be 128-character hex string)');
    }

    // Content validation - allow empty content for specific kinds
    if (event.content === '' && !this.isEmptyContentAllowed(event.kind)) {
      errors.push(ERROR_MESSAGES.EMPTY_CONTENT);
    }

    if (event.content && event.content.length > DEFAULT_CONFIG.MAX_CONTENT_LENGTH) {
      errors.push(ERROR_MESSAGES.CONTENT_TOO_LONG);
    }

    // Timestamp validation (reasonable bounds)
    if (event.created_at) {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 3600;
      const oneHourFuture = now + 3600;

      if (event.created_at < oneHourAgo || event.created_at > oneHourFuture) {
        errors.push('Timestamp is too far in the past or future');
      }
    }

    // Tags validation
    if (event.tags) {
      if (!Array.isArray(event.tags)) {
        errors.push('Tags must be an array');
      } else {
        event.tags.forEach((tag, index) => {
          if (!Array.isArray(tag)) {
            errors.push(`Tag ${index} must be an array`);
          } else {
            tag.forEach((tagValue, tagIndex) => {
              if (typeof tagValue !== 'string') {
                errors.push(`Tag ${index}[${tagIndex}] must be a string`);
              }
            });
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate content before event creation
   */
  static validateContent(content: string, kind?: number): ValidationResult {
    const errors: string[] = [];

    if (content === '' && !this.isEmptyContentAllowed(kind)) {
      errors.push(ERROR_MESSAGES.EMPTY_CONTENT);
    }

    if (content.length > DEFAULT_CONFIG.MAX_CONTENT_LENGTH) {
      errors.push(ERROR_MESSAGES.CONTENT_TOO_LONG);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if empty content is allowed for specific event kinds
   */
  private static isEmptyContentAllowed(kind?: number): boolean {
    if (!kind) return false;
    
    // Event kinds that explicitly allow or require empty content
    const emptyContentKinds = [
      3,    // NIP-02: Contact list / Follow list (typically has empty content)
      5,    // NIP-09: Event deletion (may have empty content)
      6,    // NIP-18: Repost (requires empty content)
      7,    // NIP-25: Reaction (may have empty content for simple reactions)
      1059, // NIP-59: Gift wraps (content is encrypted, may appear empty)
      1984  // NIP-56: Reporting (may have empty content with just tags)
    ];
    
    return emptyContentKinds.includes(kind);
  }

  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(event: NostrEvent): boolean {
    const calculatedId = EventBuilder.calculateEventId({
      pubkey: event.pubkey,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags,
      content: event.content
    });

    return calculatedId === event.id;
  }

  /**
   * Create a complete event with validation
   */
  static async createEvent(
    content: string,
    pubkey: string,
    options: {
      kind?: number;
      tags?: string[][];
      created_at?: number;
    } = {}
  ): Promise<UnsignedEvent> {
    // Validate content first (pass kind for empty content validation)
    const contentValidation = EventBuilder.validateContent(content, options.kind);
    if (!contentValidation.valid) {
      throw new Error(`Invalid content: ${contentValidation.errors.join(', ')}`);
    }

    // Create unsigned event
    const unsignedEvent: UnsignedEvent = {
      pubkey,
      created_at: options.created_at ?? Math.floor(Date.now() / 1000),
      kind: options.kind ?? EVENT_KINDS.TEXT_NOTE,
      tags: options.tags ?? [],
      content
    };

    // Validate complete event structure
    const validation = EventBuilder.validateEvent(unsignedEvent);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }

    return unsignedEvent;
  }
}