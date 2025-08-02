/**
 * Profile Module Exports - Phase 1, 2, 3, 4, 5, 6 & 8
 * 
 * Re-exports all profile functionality including Phase 8 cache optimization
 */

export { ProfileModule } from './ProfileModule.js';
export { ProfileStore, type ProfileState } from './ProfileStore.js';
export { ProfileBuilder } from './ProfileBuilder.js';
export { ProfileBatchBuilder } from './ProfileBatchBuilder.js';
export { ProfileDiscoveryBuilder } from './ProfileDiscoveryBuilder.js';
export { FollowsModule } from './FollowsModule.js';
export { FollowListStore } from './FollowListStore.js';
export { FollowBuilder } from './FollowBuilder.js';
export { FollowBatchBuilder } from './FollowBatchBuilder.js';
// Phase 8: Cache optimization exports
export { ProfileCacheInterface, type ProfileCacheStats } from './ProfileCacheInterface.js';
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