/**
 * FollowManager - Clean Architecture Follow System
 * 
 * Uses NostrUnchained's reactive stores directly for perfect performance
 * and instant updates. No more subscription management or cache duplication.
 */

import type { NostrUnchained } from 'nostr-unchained';

export interface FollowState {
	followingCount: number;
	followersCount: number;
	isFollowing: boolean;
	isOwnProfile: boolean;
	loading: boolean;
	error: string | null;
}

export interface FollowStats {
	followingCount: number;
	followersCount: number;
}

export class FollowManager {
	private nostr: NostrUnchained;
	private myPubkey: string;
	private debug: boolean;

	constructor(nostr: NostrUnchained, myPubkey: string, debug = false) {
		this.nostr = nostr;
		this.myPubkey = myPubkey;
		this.debug = debug;
	}

	/**
	 * Get follow state for any profile using clean reactive stores
	 * CLEAN ARCHITECTURE: Uses NostrUnchained base layer directly
	 */
	async getFollowState(targetPubkey: string): Promise<FollowState> {
		const isOwnProfile = targetPubkey === this.myPubkey;
		
		try {
			// Use clean architecture - get follow list store directly
			const followStore = isOwnProfile 
				? await this.nostr.profile.follows.mine()
				: this.nostr.profile.follows.of(targetPubkey);

			// Get current stats from store
			const followingCount = followStore.count.current;
			
			// Get followers count using new API
			const followersCountStore = this.nostr.profile.followerCount(targetPubkey);
			const followersCount = followersCountStore.current;
			
			// Check if following (only for non-own profiles)
			let isFollowing = false;
			if (!isOwnProfile) {
				const myFollowStore = await this.nostr.profile.follows.mine();
				const myFollows = myFollowStore.follows.current;
				isFollowing = myFollows.some(follow => follow.pubkey === targetPubkey);
			}

			return {
				followingCount,
				followersCount,
				isFollowing,
				isOwnProfile,
				loading: false,
				error: null
			};
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to get follow state:', error);
			}
			
			return {
				followingCount: 0,
				followersCount: 0,
				isFollowing: false,
				isOwnProfile,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load follow state'
			};
		}
	}

	/**
	 * Get follow statistics using clean architecture
	 * CLEAN ARCHITECTURE: Uses NostrUnchained stores directly
	 */
	async getFollowStats(targetPubkey: string): Promise<FollowStats> {
		const isOwnProfile = targetPubkey === this.myPubkey;
		
		try {
			// Use clean architecture - get follow list store directly
			const followStore = isOwnProfile 
				? await this.nostr.profile.follows.mine()
				: this.nostr.profile.follows.of(targetPubkey);

			// Get followers count using new API
			const followersCountStore = this.nostr.profile.followerCount(targetPubkey);

			return {
				followingCount: followStore.count.current,
				followersCount: followersCountStore.current
			};
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to get follow stats:', error);
			}
			
			return {
				followingCount: 0,
				followersCount: 0
			};
		}
	}

	/**
	 * Check if I'm following a specific user using clean architecture
	 * CLEAN ARCHITECTURE: Uses current state from store directly
	 */
	async checkIfFollowing(targetPubkey: string): Promise<boolean> {
		if (targetPubkey === this.myPubkey) {
			return false; // Can't follow yourself
		}

		try {
			const followStore = await this.nostr.profile.follows.mine();
			const follows = followStore.follows.current;
			return follows.some(follow => follow.pubkey === targetPubkey);
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to check follow status:', error);
			}
			return false;
		}
	}

	/**
	 * Follow a user using clean architecture
	 * CLEAN ARCHITECTURE: Uses NostrUnchained batch API with instant cache updates
	 */
  async followUser(targetPubkey: string): Promise<any> {
		if (targetPubkey === this.myPubkey) {
			throw new Error("Cannot follow yourself");
		}

		try {
			// Use the clean batch API - this automatically adds to cache
      const result = await this.nostr.profile.follows.batch()
        .add([targetPubkey])
        .publish();
			
			if (this.debug) {
				console.log('FollowManager: Successfully followed user:', targetPubkey);
			}
      return result;
    } catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to follow user:', error);
			}
			throw new Error(`Failed to follow user: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Unfollow a user using clean architecture
	 * CLEAN ARCHITECTURE: Uses NostrUnchained batch API with instant cache updates
	 */
  async unfollowUser(targetPubkey: string): Promise<any> {
		if (targetPubkey === this.myPubkey) {
			throw new Error("Cannot unfollow yourself");
		}

		try {
			// Use the clean batch API - this automatically adds to cache
      const result = await this.nostr.profile.follows.batch()
        .remove([targetPubkey])
        .publish();
			
			if (this.debug) {
				console.log('FollowManager: Successfully unfollowed user:', targetPubkey);
			}
      return result;
    } catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to unfollow user:', error);
			}
			throw new Error(`Failed to unfollow user: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Create a reactive store for follow state using clean architecture
	 * CLEAN ARCHITECTURE: Directly subscribes to NostrUnchained stores for instant updates
	 */
	createFollowStore(targetPubkey: string) {
		const isOwnProfile = targetPubkey === this.myPubkey;
		
		let currentState: FollowState = {
			followingCount: 0,
			followersCount: 0,
			isFollowing: false,
			isOwnProfile,
			loading: true,
			error: null
		};

		const subscribers = new Set<(state: FollowState) => void>();
		let followStoreUnsubscribe: (() => void) | undefined;
		let myFollowStoreUnsubscribe: (() => void) | undefined;

		const subscribe = (callback: (state: FollowState) => void) => {
			subscribers.add(callback);
			callback(currentState); // Immediate callback with current state
			
			return () => {
				subscribers.delete(callback);
				// Clean up subscriptions when no more subscribers
				if (subscribers.size === 0) {
					followStoreUnsubscribe?.();
					myFollowStoreUnsubscribe?.();
				}
			};
		};

		const updateState = (newState: Partial<FollowState>) => {
			const oldState = currentState;
			currentState = { ...currentState, ...newState };
			if (this.debug) {
				console.log('FollowManager: State updated for', targetPubkey, {
					old: { followingCount: oldState.followingCount, followersCount: oldState.followersCount, isFollowing: oldState.isFollowing },
					new: { followingCount: currentState.followingCount, followersCount: currentState.followersCount, isFollowing: currentState.isFollowing }
				});
			}
			subscribers.forEach(callback => callback(currentState));
		};

		// Set up reactive subscriptions to NostrUnchained stores
		const setupReactiveSubscriptions = async () => {
			try {
				// Subscribe to target's follow list for count
				const followStore = isOwnProfile 
					? await this.nostr.profile.follows.mine()
					: this.nostr.profile.follows.of(targetPubkey);

				followStoreUnsubscribe = followStore.count.subscribe((count: number) => {
					if (this.debug) {
						console.log(`FollowManager: Following count updated for ${targetPubkey}:`, count);
					}
					updateState({ followingCount: count });
				});

				// Subscribe to followers count using new API
				const followersCountStore = this.nostr.profile.followerCount(targetPubkey);
				const followersUnsubscribe = followersCountStore.subscribe((count: number) => {
					if (this.debug) {
						console.log(`FollowManager: Followers count updated for ${targetPubkey}:`, count);
					}
					updateState({ followersCount: count });
				});

				// If not own profile, also subscribe to my follow list to check if following
				if (!isOwnProfile) {
					const myFollowStore = await this.nostr.profile.follows.mine();
					myFollowStoreUnsubscribe = myFollowStore.follows.subscribe((follows: any[]) => {
						const isFollowing = follows.some((follow: any) => follow.pubkey === targetPubkey);
						if (this.debug) {
							console.log(`FollowManager: My follows updated, ${targetPubkey} isFollowing:`, isFollowing, 'total follows:', follows.length);
						}
						updateState({ isFollowing });
					});
				}

				// Clean up followers subscription when main subscription is cleaned up
				const originalFollowStoreUnsubscribe = followStoreUnsubscribe;
				followStoreUnsubscribe = () => {
					originalFollowStoreUnsubscribe?.();
					followersUnsubscribe?.();
				};

				updateState({ loading: false, error: null });

			} catch (error) {
				updateState({
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to setup reactive subscriptions'
				});
			}
		};

		// Initialize reactive subscriptions
		setupReactiveSubscriptions();

		return {
			subscribe,
			refresh: () => {
				updateState({ loading: true, error: null });
				return setupReactiveSubscriptions();
			},
      follow: async () => {
				if (isOwnProfile) return;
				
				updateState({ loading: true, error: null });
				try {
          const res = await this.followUser(targetPubkey);
					// No need for optimistic update - reactive subscriptions handle it
					updateState({ loading: false });
          return res;
				} catch (error) {
					updateState({
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to follow'
					});
					throw error;
				}
      },
      unfollow: async () => {
				if (isOwnProfile) return;
				
				updateState({ loading: true, error: null });
				try {
          const res = await this.unfollowUser(targetPubkey);
					// No need for optimistic update - reactive subscriptions handle it
					updateState({ loading: false });
          return res;
				} catch (error) {
					updateState({
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to unfollow'
					});
					throw error;
				}
			}
		};
	}
}