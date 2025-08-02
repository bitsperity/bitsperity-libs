<script lang="ts">
/**
 * ProfileManager - Advanced Profile Management Component
 * 
 * High-level orchestrator for complex profile operations.
 * Combines header, info, and actions into a cohesive profile experience.
 * Max 200 lines - Zero Monolith Policy
 */

import type { NostrUnchained } from 'nostr-unchained';
import type { ProfileViewProps } from '../../types/profile.js';
import ProfileHeader from './ProfileHeader.svelte';
import ProfileInfo from './ProfileInfo.svelte';
import ProfileActions from './ProfileActions.svelte';

// =============================================================================
// Props & Types
// =============================================================================

interface Props extends ProfileViewProps {
	layout?: 'default' | 'compact' | 'card' | 'minimal';
	sections?: {
		header?: boolean;
		info?: boolean;
		actions?: boolean;
	};
	headerProps?: Record<string, any>;
	infoProps?: Record<string, any>;
	actionsProps?: Record<string, any>;
}

const {
	nostr,
	pubkey,
	authState,
	initialData,
	showActions = true,
	compact = false,
	className = '',
	layout = 'default',
	sections = { header: true, info: true, actions: true },
	headerProps = {},
	infoProps = {},
	actionsProps = {}
}: Props = $props();

// =============================================================================
// State Management
// =============================================================================

let profilePubkey = $derived(pubkey || authState.publicKey || '');
let isOwnProfile = $derived(profilePubkey === authState.publicKey);
let viewMode = $state<'display' | 'edit' | 'create'>('display');

// Real NostrUnchained Profile Integration
let profile = $state(null);
let isLoading = $state(true);
let error = $state<string | null>(null);
let verified = $state(false);

// =============================================================================
// Profile Data Loading
// =============================================================================

$effect(() => {
	if (profilePubkey && nostr) {
		const profileModule = nostr.profile;
		
		if (profileModule) {
			isLoading = true;
			error = null;
			
			try {
				const profileStore = profileModule.get(profilePubkey);
				
				const unsubscribe = profileStore.subscribe((state) => {
					profile = state.profile;
					isLoading = state.loading;
					error = state.error ? state.error.message : null;
					verified = state.verified;
					
					// Auto-switch to create mode if own profile and no data found
					if (!state.loading && isOwnProfile && !state.profile && viewMode === 'display') {
						viewMode = 'create';
					}
				});
				
				return unsubscribe;
			} catch (err) {
				console.error('Failed to get profile store:', err);
				error = 'Failed to load profile';
				isLoading = false;
			}
		}
	}
});

// =============================================================================
// Event Handlers
// =============================================================================

function handleEditClick() {
	viewMode = 'edit';
}

function handleCreateClick() {
	viewMode = 'create';
}

async function handleSaveProfile(profileData: Record<string, string>) {
	try {
		isLoading = true;
		error = null;
		
		if (!nostr.profile) {
			throw new Error('Profile module not available');
		}
		
		const builder = nostr.profile.edit();
		
		if (profileData.name) builder.name(profileData.name);
		if (profileData.about) builder.about(profileData.about);
		if (profileData.picture) builder.picture(profileData.picture);
		if (profileData.banner) builder.banner(profileData.banner);
		if (profileData.website) builder.website(profileData.website);
		if (profileData.nip05) builder.nip05(profileData.nip05);
		if (profileData.lud16) builder.lud16(profileData.lud16);
		
		await builder.preserveExisting(true).publish();
		
		viewMode = 'display';
		
	} catch (err) {
		console.error('Failed to save profile:', err);
		error = err instanceof Error ? err.message : 'Failed to save profile';
	} finally {
		isLoading = false;
	}
}

// =============================================================================
// Computed Properties
// =============================================================================

const hasProfileData = $derived(
	profile && (profile.metadata?.name || profile.metadata?.about || profile.metadata?.picture)
);

const isEditMode = $derived(viewMode === 'edit' || viewMode === 'create');

const layoutClasses = $derived(() => {
	const classes = ['profile-manager', className];
	
	if (compact) classes.push('compact');
	if (layout !== 'default') classes.push(`layout-${layout}`);
	if (isEditMode) classes.push('edit-mode');
	
	return classes.join(' ');
});

// Merge props with defaults for child components
const mergedHeaderProps = $derived({
	profile,
	verified,
	compact,
	showCopy: layout !== 'minimal',
	showVerification: layout !== 'minimal',
	...headerProps
});

const mergedInfoProps = $derived({
	profile,
	compact,
	showAbout: layout !== 'minimal',
	showLinks: layout !== 'minimal',
	showStats: layout === 'default',
	// Future: Pass real stats
	followingCount: 0,
	followersCount: 0,
	notesCount: 0,
	...infoProps
});

const mergedActionsProps = $derived({
	profile,
	nostr,
	authState,
	pubkey: profilePubkey,
	onEditClick: handleEditClick,
	onCreateClick: handleCreateClick,
	showSecondaryActions: layout === 'default',
	orientation: layout === 'card' ? 'vertical' : 'horizontal',
	size: compact ? 'small' : 'medium',
	...actionsProps
});
</script>

<div class={layoutClasses}>
	{#if !profilePubkey}
		<!-- No Profile State -->
		<div class="no-profile-state">
			<div class="no-profile-icon">👤</div>
			<h2>No Profile Found</h2>
			<p>Unable to load profile information.</p>
		</div>
	{:else if isLoading}
		<!-- Loading State -->
		<div class="loading-state">
			<div class="loading-spinner">⏳</div>
			<h2>Loading Profile...</h2>
			<p>Fetching profile data from relays...</p>
		</div>
	{:else if isEditMode}
		<!-- Edit/Create Mode -->
		<div class="edit-container">
			<header class="edit-header">
				<h2>{viewMode === 'create' ? 'Create Your Profile' : 'Edit Profile'}</h2>
				<p>{viewMode === 'create' ? 'Set up your Nostr identity' : 'Update your profile information'}</p>
			</header>
			
			<form class="profile-form" onsubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.target as HTMLFormElement);
				const profileData = {
					name: formData.get('name') as string || '',
					about: formData.get('about') as string || '',
					picture: formData.get('picture') as string || '',
					banner: formData.get('banner') as string || '',
					website: formData.get('website') as string || '',
					nip05: formData.get('nip05') as string || '',
					lud16: formData.get('lud16') as string || ''
				};
				handleSaveProfile(profileData);
			}}>
				{#if error}
					<div class="form-error" role="alert">
						{error}
					</div>
				{/if}
				
				<!-- Form fields would go here -->
				<!-- This is a simplified version - in practice, you'd want dedicated form components -->
				<div class="form-actions">
					<button 
						type="button" 
						class="cancel-btn" 
						onclick={() => viewMode = hasProfileData ? 'display' : 'create'}
					>
						{hasProfileData ? 'Cancel' : 'Skip for now'}
					</button>
					<button type="submit" class="save-btn" disabled={isLoading}>
						{#if isLoading}
							⏳ {viewMode === 'create' ? 'Creating...' : 'Saving...'}
						{:else}
							{viewMode === 'create' ? 'Create Profile' : 'Save Changes'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	{:else}
		<!-- Display Mode -->
		<div class="profile-container">
			<!-- Profile Header -->
			{#if sections.header}
				<ProfileHeader {...mergedHeaderProps} />
			{/if}
			
			<!-- Profile Info -->
			{#if sections.info}
				<ProfileInfo {...mergedInfoProps} />
			{/if}
			
			<!-- Profile Actions -->
			{#if sections.actions && showActions}
				<ProfileActions {...mergedActionsProps} />
			{/if}
		</div>
	{/if}
	
	<!-- Global Error Display -->
	{#if error && !isEditMode}
		<div class="error-banner" role="alert">
			<span class="error-icon">⚠️</span>
			<span class="error-text">{error}</span>
		</div>
	{/if}
</div>

<style>
.profile-manager {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
	width: 100%;
	max-width: 100%;
}

.profile-manager.compact {
	gap: var(--spacing-md);
}

/* Layout Variants */
.layout-card {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--spacing-lg);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.layout-compact {
	gap: var(--spacing-sm);
}

.layout-minimal {
	gap: var(--spacing-sm);
}

.layout-minimal .profile-container {
	align-items: center;
	text-align: center;
}

/* Profile Container */
.profile-container {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
	width: 100%;
}

.compact .profile-container {
	gap: var(--spacing-md);
}

/* State Containers */
.no-profile-state,
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-2xl);
	text-align: center;
	min-height: 200px;
	border: 2px dashed var(--color-border);
	border-radius: var(--radius-lg);
	background: var(--color-surface);
}

.no-profile-icon,
.loading-spinner {
	font-size: 3rem;
	margin-bottom: var(--spacing-lg);
	opacity: 0.5;
}

.loading-spinner {
	animation: spin 2s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.no-profile-state h2,
.loading-state h2 {
	margin: 0 0 var(--spacing-sm) 0;
	font-size: var(--text-lg);
	color: var(--color-text);
}

.no-profile-state p,
.loading-state p {
	margin: 0;
	color: var(--color-text-muted);
	font-size: var(--text-sm);
}

/* Edit Container */
.edit-container {
	max-width: 600px;
	margin: 0 auto;
	padding: var(--spacing-lg);
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
}

.edit-header {
	text-align: center;
	margin-bottom: var(--spacing-xl);
}

.edit-header h2 {
	margin: 0 0 var(--spacing-sm) 0;
	font-size: var(--text-xl);
	font-weight: bold;
	color: var(--color-text);
}

.edit-header p {
	margin: 0;
	color: var(--color-text-muted);
	font-size: var(--text-base);
}

/* Form Styles */
.profile-form {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
}

.form-actions {
	display: flex;
	gap: var(--spacing-md);
	justify-content: flex-end;
	margin-top: var(--spacing-xl);
	padding-top: var(--spacing-lg);
	border-top: 1px solid var(--color-border);
}

.cancel-btn,
.save-btn {
	padding: var(--spacing-sm) var(--spacing-lg);
	border-radius: var(--radius-md);
	font-weight: 500;
	cursor: pointer;
	transition: all var(--transition-fast);
	min-width: 100px;
}

.cancel-btn {
	background: transparent;
	color: var(--color-text-muted);
	border: 1px solid var(--color-border);
}

.cancel-btn:hover {
	background: var(--color-surface);
	color: var(--color-text);
}

.save-btn {
	background: var(--color-primary);
	color: var(--color-primary-text);
	border: none;
}

.save-btn:hover:not(:disabled) {
	background: var(--color-primary-hover);
}

.save-btn:disabled {
	background: var(--color-surface);
	color: var(--color-text-muted);
	cursor: not-allowed;
	opacity: 0.6;
}

/* Error Handling */
.form-error,
.error-banner {
	background: rgba(229, 62, 62, 0.1);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
	padding: var(--spacing-md);
	border-radius: var(--radius-md);
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}

.form-error {
	margin-bottom: var(--spacing-lg);
}

.error-banner {
	margin-top: var(--spacing-md);
}

.error-icon {
	font-size: var(--text-lg);
	flex-shrink: 0;
}

.error-text {
	flex: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.profile-manager {
		gap: var(--spacing-md);
	}
	
	.edit-container {
		padding: var(--spacing-md);
	}
	
	.form-actions {
		flex-direction: column;
	}
	
	.cancel-btn,
	.save-btn {
		width: 100%;
	}
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
	.layout-card {
		border-width: 2px;
	}
	
	.no-profile-state,
	.loading-state {
		border-width: 3px;
	}
	
	.form-error,
	.error-banner {
		border-width: 2px;
		font-weight: 600;
	}
}
</style>