<script lang="ts">
/**
 * ProfileActions - Profile Action Buttons Component
 * 
 * Provides action buttons for profile interactions: edit, follow, DM, etc.
 * Context-aware actions based on profile ownership and relationship.
 * Max 200 lines - Zero Monolith Policy
 */

import type { NostrUnchained } from 'nostr-unchained';
import type { UserProfile, AuthenticationState } from '../../types/profile.js';
import { FollowManager, type FollowState } from '../../utils/followManager.js';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	profile: UserProfile | null;
	nostr: NostrUnchained;
	authState: AuthenticationState;
	pubkey: string;
	onEditClick?: () => void;
	onCreateClick?: () => void;
	showSecondaryActions?: boolean;
	orientation?: 'horizontal' | 'vertical';
	size?: 'small' | 'medium' | 'large';
	className?: string;
}

const {
	profile,
	nostr,
	authState,
	pubkey,
	onEditClick,
	onCreateClick,
	showSecondaryActions = true,
	orientation = 'horizontal',
	size = 'medium',
	className = ''
}: Props = $props();

// =============================================================================
// State Management
// =============================================================================

let followState = $state<FollowState>({
	followingCount: 0,
	followersCount: 0,
	isFollowing: false,
	isOwnProfile: pubkey === authState.publicKey,
	loading: false,
	error: null
});

let followStore: any = null;

const isOwnProfile = $derived(pubkey === authState.publicKey);
const hasProfileData = $derived(profile && (profile.metadata?.name || profile.metadata?.about || profile.metadata?.picture));

// =============================================================================
// Follow State Management
// =============================================================================

$effect(() => {
	if (!isOwnProfile && authState.isAuthenticated && nostr && authState.publicKey) {
		const followManager = new FollowManager(nostr, authState.publicKey, true);
		followStore = followManager.createFollowStore(pubkey);
		
		const unsubscribe = followStore.subscribe((state: FollowState) => {
			followState = state;
		});
		
		return unsubscribe;
	}
});

// =============================================================================
// Event Handlers
// =============================================================================

function handleEditProfile() {
	if (onEditClick) {
		onEditClick();
	}
}

function handleCreateProfile() {
	if (onCreateClick) {
		onCreateClick();
	}
}

async function handleFollowToggle() {
	if (!authState.isAuthenticated || isOwnProfile || !followStore) return;
	
	try {
		if (followState.isFollowing) {
			await followStore.unfollow();
		} else {
			await followStore.follow();
		}
	} catch (error) {
		console.error('Follow toggle error:', error);
		// Error is already handled by the store
	}
}

async function handleSendDM() {
	if (!authState.isAuthenticated || isOwnProfile) return;
	
	try {
		// TODO: Implement DM functionality
		// Navigate to DM interface or open DM modal
		console.log('Send DM to:', pubkey);
		
		// Future: Navigate to DM view
		// await goto(`/dm/${pubkey}`);
		
	} catch (error) {
		console.error('DM error:', error);
	}
}

function handleCopyProfile() {
	const profileUrl = `nostr:${pubkey}`;
	navigator.clipboard?.writeText(profileUrl).then(() => {
		// TODO: Show toast notification
		console.log('Profile URL copied to clipboard');
	}).catch(err => {
		console.error('Failed to copy profile URL:', err);
	});
}
</script>

<div class="profile-actions {className}" class:vertical={orientation === 'vertical'} class:small={size === 'small'} class:large={size === 'large'}>
	<!-- Primary Actions -->
	<div class="primary-actions">
		{#if isOwnProfile}
			<!-- Own Profile Actions -->
			{#if hasProfileData}
				<button 
					class="action-btn primary edit-btn"
					onclick={handleEditProfile}
					title="Edit your profile"
				>
					<span class="btn-icon">✏️</span>
					<span class="btn-text">Edit Profile</span>
				</button>
			{:else}
				<button 
					class="action-btn primary create-btn"
					onclick={handleCreateProfile}
					title="Create your profile"
				>
					<span class="btn-icon">✨</span>
					<span class="btn-text">Create Profile</span>
				</button>
			{/if}
		{:else}
			<!-- Other Profile Actions -->
			{#if authState.isAuthenticated}
				<button 
					class="action-btn primary follow-btn"
					class:following={followState.isFollowing}
					onclick={handleFollowToggle}
					disabled={followState.loading}
					title={followState.isFollowing ? 'Unfollow user' : 'Follow user'}
				>
					{#if followState.loading}
						<span class="btn-icon loading">⏳</span>
						<span class="btn-text">Loading...</span>
					{:else if followState.isFollowing}
						<span class="btn-icon">✅</span>
						<span class="btn-text">Following</span>
					{:else}
						<span class="btn-icon">👥</span>
						<span class="btn-text">Follow</span>
					{/if}
				</button>
			{:else}
				<!-- Not authenticated -->
				<button 
					class="action-btn primary disabled-btn"
					disabled
					title="Sign in to follow users"
				>
					<span class="btn-icon">👥</span>
					<span class="btn-text">Follow</span>
				</button>
			{/if}
		{/if}
	</div>
	
	<!-- Secondary Actions -->
	{#if showSecondaryActions}
		<div class="secondary-actions">
			{#if !isOwnProfile && authState.isAuthenticated}
				<button 
					class="action-btn secondary dm-btn"
					onclick={handleSendDM}
					title="Send direct message"
				>
					<span class="btn-icon">💬</span>
					{#if orientation === 'horizontal'}
						<span class="btn-text">Message</span>
					{/if}
				</button>
			{/if}
			
			<button 
				class="action-btn secondary copy-btn"
				onclick={handleCopyProfile}
				title="Copy profile link"
			>
				<span class="btn-icon">🔗</span>
				{#if orientation === 'horizontal'}
					<span class="btn-text">Share</span>
				{/if}
			</button>
		</div>
	{/if}
	
	<!-- Error Display -->
	{#if followState.error}
		<div class="error-message" role="alert">
			{followState.error}
		</div>
	{/if}
</div>

<style>
.profile-actions {
	display: flex;
	gap: var(--spacing-md);
	align-items: center;
	flex-wrap: wrap;
}

.profile-actions.vertical {
	flex-direction: column;
	align-items: stretch;
}

.profile-actions.small {
	gap: var(--spacing-sm);
}

.profile-actions.large {
	gap: var(--spacing-lg);
}

.primary-actions {
	display: flex;
	gap: var(--spacing-sm);
	align-items: center;
}

.vertical .primary-actions {
	flex-direction: column;
	width: 100%;
}

.secondary-actions {
	display: flex;
	gap: var(--spacing-sm);
	align-items: center;
}

.vertical .secondary-actions {
	flex-direction: column;
	width: 100%;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-sm) var(--spacing-md);
	border: none;
	border-radius: var(--radius-md);
	font-size: var(--text-sm);
	font-weight: 500;
	cursor: pointer;
	transition: all var(--transition-fast);
	text-decoration: none;
	min-height: 44px;
	white-space: nowrap;
}

.small .action-btn {
	padding: var(--spacing-xs) var(--spacing-sm);
	font-size: var(--text-xs);
	min-height: 36px;
}

.large .action-btn {
	padding: var(--spacing-md) var(--spacing-lg);
	font-size: var(--text-base);
	min-height: 52px;
}

.vertical .action-btn {
	justify-content: center;
	width: 100%;
}

.action-btn:disabled {
	cursor: not-allowed;
	opacity: 0.6;
}

.btn-icon {
	font-size: var(--text-base);
	line-height: 1;
}

.small .btn-icon {
	font-size: var(--text-sm);
}

.large .btn-icon {
	font-size: var(--text-lg);
}

.btn-text {
	line-height: 1;
}

/* Primary Action Styles */
.action-btn.primary {
	background: var(--color-primary);
	color: var(--color-primary-text);
	border: 2px solid var(--color-primary);
}

.action-btn.primary:hover:not(:disabled) {
	background: var(--color-primary-hover);
	border-color: var(--color-primary-hover);
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.primary:active:not(:disabled) {
	transform: translateY(0);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Follow Button States */
.follow-btn.following {
	background: var(--color-success);
	border-color: var(--color-success);
	color: var(--color-success-text);
}

.follow-btn.following:hover:not(:disabled) {
	background: var(--color-danger);
	border-color: var(--color-danger);
	color: var(--color-danger-text);
}

.follow-btn.following:hover:not(:disabled) .btn-text::after {
	content: ' - Unfollow';
}

/* Create Profile Button */
.create-btn {
	background: var(--color-accent);
	border-color: var(--color-accent);
	color: var(--color-accent-text);
}

.create-btn:hover:not(:disabled) {
	background: var(--color-accent-hover);
	border-color: var(--color-accent-hover);
}

/* Secondary Action Styles */
.action-btn.secondary {
	background: var(--color-surface);
	color: var(--color-text);
	border: 1px solid var(--color-border);
}

.action-btn.secondary:hover:not(:disabled) {
	background: var(--color-border);
	border-color: var(--color-primary);
	color: var(--color-primary);
	transform: translateY(-1px);
}

/* Disabled State */
.disabled-btn {
	background: var(--color-surface) !important;
	color: var(--color-text-muted) !important;
	border-color: var(--color-border) !important;
}

/* Loading Animation */
.loading {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
	width: 100%;
	background: rgba(229, 62, 62, 0.1);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
	padding: var(--spacing-sm);
	border-radius: var(--radius-sm);
	font-size: var(--text-xs);
	text-align: center;
	margin-top: var(--spacing-sm);
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.profile-actions:not(.vertical) {
		flex-direction: column;
		align-items: stretch;
	}
	
	.primary-actions,
	.secondary-actions {
		width: 100%;
		justify-content: center;
	}
	
	.action-btn {
		justify-content: center;
		width: 100%;
		min-width: 0;
	}
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
	.action-btn {
		border-width: 2px;
		font-weight: 600;
	}
	
	.action-btn.primary {
		border-width: 3px;
	}
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
	.action-btn {
		transition: none;
	}
	
	.loading {
		animation: none;
	}
}
</style>