/**
 * Profile Module Exports - Clean Architecture
 * 
 * Clean architecture exports - no legacy stores
 */

export { ProfileModule } from './ProfileModule.js';
export { ProfileBuilder } from './ProfileBuilder.js';
export { ProfileBatchBuilder } from './ProfileBatchBuilder.js';
export { ProfileDiscoveryBuilder } from './ProfileDiscoveryBuilder.js';
export { FollowsModule } from './FollowsModule.js';
// FollowListStore removed - using clean architecture with base layer
export { FollowBuilder } from './FollowBuilder.js';
export { FollowBatchBuilder } from './FollowBatchBuilder.js';
// ProfileCacheInterface removed - architecture violation (single cache principle)
export type { 
  ProfileMetadata, 
  UserProfile, 
  PublishResult,
  Follow,
  FollowListState,
  FollowListEvent,
  BatchProfileResult,
  BatchProfileState,
  ProfileDiscoveryResult,
  ProfileSearchCriteria
} from './types.js';