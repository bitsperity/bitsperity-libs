<script lang="ts">
/**
 * ProfileStats - Real Profile Statistics Component
 * 
 * Displays Following/Followers counts with real data from NostrUnchained.
 * Supports both own profiles and foreign profiles consistently.
 * Max 200 lines - Zero Monolith Policy
 */

import type { NostrUnchained } from 'nostr-unchained';
import { FollowManager, type FollowState } from '../../utils/followManager.js';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	nostr: NostrUnchained;
	pubkey: string;
	myPubkey: string;
	compact?: boolean;
	showLabels?: boolean;
	className?: string;
}

const {
	nostr,
	pubkey,
	myPubkey,
	compact = false,
	showLabels = true,
	className = ''
}: Props = $props();

// =============================================================================
// State Management
// =============================================================================

let followState = $state<FollowState>({
	followingCount: 0,
	followersCount: 0,
	isFollowing: false,
	isOwnProfile: pubkey === myPubkey,
	loading: true,
	error: null
});

// =============================================================================
// Follow Manager Integration
// =============================================================================

$effect(() => {
	if (pubkey && nostr) {
		const followManager = new FollowManager(nostr, myPubkey, true);
		const followStore = followManager.createFollowStore(pubkey);
		
		const unsubscribe = followStore.subscribe((state) => {
			followState = state;
		});
		
		return unsubscribe;
	}
});

// =============================================================================
// Computed Properties
// =============================================================================

const isOwnProfile = $derived(pubkey === myPubkey);
const hasData = $derived(!followState.loading && !followState.error);
const stats = $derived([
	{
		value: followState.followingCount,
		label: 'Following',
		key: 'following'
	},
	{
		value: followState.followersCount,
		label: 'Followers', 
		key: 'followers'
	},
	{
		value: 0, // Notes count - placeholder for future
		label: 'Notes',
		key: 'notes'
	}
]);
</script>

<div class="profile-stats {className}" class:compact class:loading={followState.loading}>
	{#if followState.loading}
		<!-- Loading State -->
		<div class="stats-grid">
			{#each Array(3) as _, i}
				<div class="stat-item loading-skeleton">
					<div class="stat-value skeleton"></div>
					{#if showLabels}
						<div class="stat-label skeleton"></div>
					{/if}
				</div>
			{/each}
		</div>
	{:else if followState.error}
		<!-- Error State -->
		<div class="error-state">
			<span class="error-icon">⚠️</span>
			<span class="error-text">Failed to load stats</span>
		</div>
	{:else}
		<!-- Stats Display -->
		<div class="stats-grid">
			{#each stats as stat}
				<div class="stat-item">
					<span class="stat-value">{stat.value.toLocaleString()}</span>
					{#if showLabels}
						<span class="stat-label">{stat.label}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
.profile-stats {
	width: 100%;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--spacing-md);
}

.compact .stats-grid {
	gap: var(--spacing-sm);
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding: var(--spacing-md);
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	transition: all var(--transition-fast);
}

.stat-item:hover {
	background: var(--color-background);
	border-color: var(--color-primary);
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.compact .stat-item {
	padding: var(--spacing-sm);
}

.stat-value {
	font-size: var(--text-xl);
	font-weight: bold;
	color: var(--color-text);
	line-height: var(--leading-tight);
	margin-bottom: var(--spacing-xs);
}

.compact .stat-value {
	font-size: var(--text-lg);
}

.stat-label {
	font-size: var(--text-xs);
	color: var(--color-text-muted);
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.compact .stat-label {
	font-size: 10px;
}

/* Loading Skeleton */
.loading-skeleton {
	animation: pulse 2s ease-in-out infinite;
}

.skeleton {
	background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
	background-size: 200% 100%;
	animation: shimmer 1.5s infinite;
}

.stat-value.skeleton {
	height: 24px;
	width: 40px;
	border-radius: var(--radius-sm);
	margin-bottom: var(--spacing-xs);
}

.stat-label.skeleton {
	height: 12px;
	width: 60px;
	border-radius: var(--radius-sm);
}

.compact .stat-value.skeleton {
	height: 20px;
	width: 32px;
}

.compact .stat-label.skeleton {
	height: 10px;
	width: 48px;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.7; }
}

@keyframes shimmer {
	0% { background-position: -200% 0; }
	100% { background-position: 200% 0; }
}

/* Error State */
.error-state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-sm);
	padding: var(--spacing-lg);
	background: rgba(229, 62, 62, 0.1);
	border: 1px solid var(--color-danger);
	border-radius: var(--radius-md);
	color: var(--color-danger);
}

.error-icon {
	font-size: var(--text-base);
	flex-shrink: 0;
}

.error-text {
	font-size: var(--text-sm);
	font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.stats-grid {
		gap: var(--spacing-sm);
	}
	
	.stat-item {
		padding: var(--spacing-sm);
	}
	
	.stat-value {
		font-size: var(--text-lg);
	}
	
	.stat-label {
		font-size: 10px;
	}
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
	.stat-item {
		border-width: 2px;
	}
	
	.stat-value {
		font-weight: 700;
	}
	
	.error-state {
		border-width: 2px;
		font-weight: 600;
	}
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
	.stat-item {
		transition: none;
	}
	
	.stat-item:hover {
		transform: none;
	}
	
	.loading-skeleton,
	.skeleton {
		animation: none;
	}
}

/* Dark Mode Adjustments */
@media (prefers-color-scheme: dark) {
	.skeleton {
		background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
	}
}
</style>