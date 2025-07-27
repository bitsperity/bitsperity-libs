/**
 * Reaction Types - NIP-25 Reactions System
 * Session 4 Phase 3: Reactions & Feed Management
 */

import type { NostrEvent } from '../../core/types.js';

/**
 * A reaction to a Nostr event (NIP-25 Kind 7)
 */
export interface Reaction {
  /** Event ID of this reaction */
  eventId: string;
  /** Author's public key */
  authorPubkey: string;
  /** The event being reacted to */
  targetEventId: string;
  /** Author of the target event */
  targetAuthorPubkey: string;
  /** Type of reaction (like, dislike, custom emoji) */
  reactionType: string;
  /** Timestamp when reaction was created */
  createdAt: number;
  /** Whether this reaction is from the current user */
  isOwn: boolean;
}

/**
 * NIP-25 Kind 7 reaction event
 */
export interface ReactionEvent extends NostrEvent {
  kind: 7;
  /** The reaction content (emoji or text) */
  content: string;
  /** Tags containing e-tag (target event) and p-tag (target author) */
  tags: string[][];
}

/**
 * Request to create a reaction
 */
export interface ReactionRequest {
  /** Event ID to react to */
  targetEventId: string;
  /** Author of the target event */
  targetAuthorPubkey: string;
  /** Type of reaction ('+', '-', emoji, custom) */
  reactionType: string;
}

/**
 * Result of creating a reaction
 */
export interface ReactionResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Event ID of the published reaction */
  eventId?: string;
  /** The reaction object if successful */
  reaction?: Reaction;
}

/**
 * Aggregated reactions for an event
 */
export interface ReactionSummary {
  /** Event ID these reactions are for */
  targetEventId: string;
  /** Total number of reactions */
  totalCount: number;
  /** Breakdown by reaction type */
  reactions: Record<string, ReactionCount>;
  /** Whether current user has reacted */
  userReacted: boolean;
  /** Current user's reaction type if any */
  userReactionType?: string;
}

/**
 * Count of reactions by type
 */
export interface ReactionCount {
  /** Type of reaction */
  type: string;
  /** Number of this type of reaction */
  count: number;
  /** List of pubkeys who made this reaction */
  authors: string[];
}

/**
 * Options for fetching reactions
 */
export interface ReactionFetchOptions {
  /** Whether to use cached data if available */
  useCache?: boolean;
  /** Timeout for the request in milliseconds */
  timeout?: number;
  /** Maximum number of reactions to fetch */
  limit?: number;
  /** Only fetch reactions of specific types */
  reactionTypes?: string[];
}

/**
 * Configuration for ReactionManager
 */
export interface ReactionManagerConfig {
  subscriptionManager: any;
  relayManager: any;
  signingProvider: any;
  eventBuilder: any;
  debug?: boolean;
}

/**
 * Cache entry for reactions
 */
export interface ReactionCacheEntry {
  summary: ReactionSummary;
  reactions: Reaction[];
  timestamp: number;
  ttl: number;
}

/**
 * Predefined reaction types
 */
export const REACTION_TYPES = {
  LIKE: '+',
  DISLIKE: '-',
  LOVE: '❤️',
  LAUGH: '😂',
  ANGRY: '😡',
  SAD: '😢',
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  FIRE: '🔥',
  ROCKET: '🚀'
} as const;

export type StandardReactionType = typeof REACTION_TYPES[keyof typeof REACTION_TYPES];