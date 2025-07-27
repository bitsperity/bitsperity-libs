/**
 * Feed Types - Placeholder for Phase 3
 */

export interface SocialFeed {
  posts: FeedPost[];
}

export interface FeedPost {
  eventId: string;
}

export interface FeedOptions {
  limit?: number;
}