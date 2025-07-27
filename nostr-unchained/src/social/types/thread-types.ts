/**
 * Thread Types - NIP-10 Threading Conventions
 * Session 4 Phase 2: Threading System
 */

import type { NostrEvent } from '../../core/types.js';

/**
 * A threaded conversation with replies and references
 * Based on NIP-10 e-tag and p-tag conventions
 */
export interface Thread {
  /** Root event ID that starts the thread */
  rootEventId: string;
  /** All messages in this thread */
  messages: ThreadMessage[];
  /** Total number of messages in thread */
  messageCount: number;
  /** Timestamp of most recent message */
  lastActivity: number;
  /** Whether this thread is actively being watched */
  isWatched: boolean;
}

/**
 * A single message within a thread
 * Represents a NIP-01 Kind 1 text note with threading metadata
 */
export interface ThreadMessage {
  /** Event ID of this message */
  eventId: string;
  /** Author's public key */
  authorPubkey: string;
  /** Message content */
  content: string;
  /** Timestamp when message was created */
  createdAt: number;
  /** Event ID this message is replying to (null for root) */
  replyToEventId: string | null;
  /** Root event ID of the thread */
  rootEventId: string;
  /** All public keys mentioned in this message */
  mentionedPubkeys: string[];
  /** Depth in the conversation (0 for root, 1 for direct reply, etc.) */
  depth: number;
  /** Whether this message is from the current user */
  isOwn: boolean;
}

/**
 * NIP-01 Kind 1 text note event with threading tags
 */
export interface TextNoteEvent extends NostrEvent {
  kind: 1;
  /** The message content */
  content: string;
  /** Tags containing e-tags (event references) and p-tags (pubkey mentions) */
  tags: string[][];
}

/**
 * Request to create a new thread (root message)
 */
export interface ThreadCreateRequest {
  /** Content of the root message */
  content: string;
  /** Optional pubkeys to mention in the root message */
  mentions?: string[];
}

/**
 * Request to reply to a message in a thread
 */
export interface ReplyRequest {
  /** Content of the reply */
  content: string;
  /** Event ID being replied to */
  replyToEventId: string;
  /** Root event ID of the thread */
  rootEventId: string;
  /** Optional additional pubkeys to mention */
  mentions?: string[];
}

/**
 * Result of creating a thread or reply
 */
export interface ThreadPublishResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Event ID of the published message */
  eventId?: string;
  /** The thread message object if successful */
  message?: ThreadMessage;
}

/**
 * Options for fetching threads
 */
export interface ThreadFetchOptions {
  /** Whether to use cached data if available */
  useCache?: boolean;
  /** Timeout for the request in milliseconds */
  timeout?: number;
  /** Maximum number of messages to fetch */
  limit?: number;
  /** Whether to include all replies or just direct replies */
  includeAllReplies?: boolean;
}

/**
 * Configuration for ThreadManager
 */
export interface ThreadManagerConfig {
  subscriptionManager: any;
  relayManager: any;
  signingProvider: any;
  eventBuilder: any;
  debug?: boolean;
}

/**
 * Cache entry for threads
 */
export interface ThreadCacheEntry {
  thread: Thread;
  timestamp: number;
  ttl: number;
}

/**
 * Context for building reply chains according to NIP-10
 */
export interface ReplyContext {
  /** The event being replied to */
  parentEventId: string;
  /** The root of the conversation */
  rootEventId: string;
  /** All pubkeys that should be notified */
  mentionedPubkeys: string[];
}

/**
 * NIP-10 tag types for threading
 */
export type ThreadTagType = 'reply' | 'root' | 'mention';

/**
 * A parsed NIP-10 tag with its meaning
 */
export interface ParsedThreadTag {
  /** Type of tag (e for events, p for pubkeys) */
  tagType: 'e' | 'p';
  /** The value (event ID or pubkey) */
  value: string;
  /** Recommended relay URL for this reference */
  relayUrl?: string;
  /** Marker indicating the role (reply, root, mention) */
  marker?: string;
  /** Semantic meaning derived from NIP-10 rules */
  meaning: ThreadTagType;
}