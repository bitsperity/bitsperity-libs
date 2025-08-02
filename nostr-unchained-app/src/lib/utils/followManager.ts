/**
 * FollowManager - Consistent Follow System for Own vs Foreign Profiles
 * 
 * Provides unified API for follow operations that handles the distinction
 * between own profiles and foreign profiles correctly.
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
	 * Get follow state for any profile (own or foreign)
	 * Uses NostrUnchained's built-in caching and stores
	 */
	async getFollowState(targetPubkey: string): Promise<FollowState> {
		const isOwnProfile = targetPubkey === this.myPubkey;
		
		try {
			const [stats, isFollowing] = await Promise.all([
				this.getFollowStats(targetPubkey),
				isOwnProfile ? Promise.resolve(false) : this.checkIfFollowing(targetPubkey)
			]);

			return {
				...stats,
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
	 * Get follow statistics for any profile
	 */
	async getFollowStats(targetPubkey: string): Promise<FollowStats> {
		const isOwnProfile = targetPubkey === this.myPubkey;
		
		try {
			// Get following count
			const followingCount = isOwnProfile
				? await this.getMyFollowingCount()
				: await this.getFollowingCountOf(targetPubkey);

			// Followers count - placeholder for now (complex to implement)
			// Would require scanning all known follow lists for this pubkey
			const followersCount = 0;

			return {
				followingCount,
				followersCount
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
	 * Check if I'm following a specific user
	 */
	async checkIfFollowing(targetPubkey: string): Promise<boolean> {
		if (targetPubkey === this.myPubkey) {
			return false; // Can't follow yourself
		}

		try {
			const followStore = await this.nostr.profile.follows.mine();
			return new Promise((resolve) => {
				let unsubscribe: (() => void) | undefined;
				unsubscribe = followStore.follows.subscribe((follows) => {
					if (unsubscribe) unsubscribe();
					const isFollowing = follows.some(follow => follow.pubkey === targetPubkey);
					resolve(isFollowing);
				});
			});
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to check follow status:', error);
			}
			return false;
		}
	}

	/**
	 * Follow a user
	 */
	async followUser(targetPubkey: string): Promise<void> {
		if (targetPubkey === this.myPubkey) {
			throw new Error("Cannot follow yourself");
		}

		try {
			// Use the batch API to add a follow
			await this.nostr.profile.follows.batch()
				.add([targetPubkey])
				.publish();
			
			if (this.debug) {
				console.log('FollowManager: Successfully followed user:', targetPubkey);
			}
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to follow user:', error);
			}
			throw new Error(`Failed to follow user: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Unfollow a user
	 */
	async unfollowUser(targetPubkey: string): Promise<void> {
		if (targetPubkey === this.myPubkey) {
			throw new Error("Cannot unfollow yourself");
		}

		try {
			// Use the batch API to remove a follow
			await this.nostr.profile.follows.batch()
				.remove([targetPubkey])
				.publish();
			
			if (this.debug) {
				console.log('FollowManager: Successfully unfollowed user:', targetPubkey);
			}
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to unfollow user:', error);
			}
			throw new Error(`Failed to unfollow user: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get my following count
	 */
	private async getMyFollowingCount(): Promise<number> {
		try {
			const followStore = await this.nostr.profile.follows.mine();
			return new Promise((resolve) => {
				let unsubscribe: (() => void) | undefined;
				unsubscribe = followStore.count.subscribe((count) => {
					if (unsubscribe) unsubscribe();
					resolve(count);
				});
			});
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to get my following count:', error);
			}
			return 0;
		}
	}

	/**
	 * Get following count of another user
	 */
	private async getFollowingCountOf(pubkey: string): Promise<number> {
		try {
			const followStore = this.nostr.profile.follows.of(pubkey);
			return new Promise((resolve) => {
				let unsubscribe: (() => void) | undefined;
				unsubscribe = followStore.count.subscribe((count) => {
					if (unsubscribe) unsubscribe();
					resolve(count);
				});
			});
		} catch (error) {
			if (this.debug) {
				console.error('FollowManager: Failed to get following count of user:', error);
			}
			return 0;
		}
	}

	/**
	 * Create a reactive store for follow state
	 * Uses NostrUnchained's reactive stores directly
	 */
	createFollowStore(targetPubkey: string) {
		let currentState: FollowState = {
			followingCount: 0,
			followersCount: 0,
			isFollowing: false,
			isOwnProfile: targetPubkey === this.myPubkey,
			loading: true,
			error: null
		};

		const subscribers = new Set<(state: FollowState) => void>();

		const subscribe = (callback: (state: FollowState) => void) => {
			subscribers.add(callback);
			callback(currentState); // Immediate callback with current state
			
			return () => subscribers.delete(callback);
		};

		const updateState = (newState: Partial<FollowState>) => {
			currentState = { ...currentState, ...newState };
			subscribers.forEach(callback => callback(currentState));
		};

		// Initial load
		this.getFollowState(targetPubkey)
			.then(state => updateState(state))
			.catch(error => updateState({
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load'
			}));

		return {
			subscribe,
			refresh: () => {
				updateState({ loading: true, error: null });
				return this.getFollowState(targetPubkey)
					.then(state => updateState(state))
					.catch(error => updateState({
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to refresh'
					}));
			},
			follow: async () => {
				if (currentState.isOwnProfile) return;
				
				updateState({ loading: true, error: null });
				try {
					await this.followUser(targetPubkey);
					// Optimistic update
					updateState({ 
						isFollowing: true, 
						loading: false 
					});
				} catch (error) {
					updateState({
						loading: false,
						error: error instanceof Error ? error.message : 'Failed to follow'
					});
					throw error;
				}
			},
			unfollow: async () => {
				if (currentState.isOwnProfile) return;
				
				updateState({ loading: true, error: null });
				try {
					await this.unfollowUser(targetPubkey);
					// Optimistic update
					updateState({ 
						isFollowing: false, 
						loading: false 
					});
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