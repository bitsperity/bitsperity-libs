/**
 * Social Module - Clean Architecture Social Media API
 * 
 * Comprehensive social media functionality following clean 3-layer architecture:
 * - Content Creation & Management (NIP-01, NIP-18, NIP-23)
 * - Social Interactions (NIP-25 reactions, NIP-10 threading)
 * - Communities & Communication (NIP-28, NIP-72)
 * - Moderation & Safety (NIP-32, NIP-56)
 * - Lists & Organization (NIP-51)
 * 
 * Implementation Status:
 * - Phase 1 (MVP): Content, Reactions, Threads, Feeds - TODO
 * - Phase 2 (Extended): Communities, Lists, Moderation - TODO  
 * - Phase 3 (Advanced): Advanced communities, Polls - TODO
 */

// Main API
export { SocialModule } from './api/SocialModule.js';
export type { SocialModuleConfig } from './api/SocialModule.js';

// Types - Preserved from previous implementation
export * from './types/contact-types.js';
export * from './types/reaction-types.js';
export * from './types/thread-types.js';
export * from './types/feed-types.js';

// Module exports (TODO: Implement in phases)
// export { ContentModule } from './content/ContentModule.js';
// export { ReactionModule } from './reactions/ReactionModule.js';
// export { ThreadModule } from './threads/ThreadModule.js';
// export { FeedModule } from './feeds/FeedModule.js';
// export { CommunityModule } from './communities/CommunityModule.js';
// export { ListModule } from './lists/ListModule.js';