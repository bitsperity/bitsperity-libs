/**
 * Social Media Core Module
 * 
 * Session 4: Complete social media functionality for nostr-unchained
 * - User Profiles (NIP-01 Kind 0)
 * - Contact Management (NIP-02 Kind 3) 
 * - Threading & Replies (NIP-10)
 * - Reactions (NIP-25 Kind 7)
 * - Social Feeds
 */

export { SocialModule } from './api/SocialModule.js';
export { ProfileManager } from './profiles/ProfileManager.js';
export { ContactManager } from './contacts/ContactManager.js';
export { ThreadManager } from './threads/ThreadManager.js';
export { ReactionManager } from './reactions/ReactionManager.js';
export { FeedManager } from './feeds/FeedManager.js';

// Types
export type {
  UserProfile,
  ProfileMetadata,
  ProfileUpdate
} from './types/profile-types.js';

export type {
  Contact,
  ContactList,
  FollowEvent
} from './types/contact-types.js';

export type {
  Thread,
  ThreadMessage,
  ReplyContext
} from './types/thread-types.js';

export type {
  Reaction,
  ReactionSummary,
  ReactionType
} from './types/reaction-types.js';

export type {
  SocialFeed,
  FeedPost,
  FeedOptions
} from './types/feed-types.js';