<script lang="ts">
/**
 * ProfileView - Main Profile Container
 * 
 * Displays user profiles with own vs foreign profile distinction.
 * Integrates with NostrUnchained API for reactive profile management.
 * Max 200 lines - Zero Monolith Policy
 */

import type { NostrUnchained } from 'nostr-unchained';
import type { ProfileViewProps } from '../../types/profile.js';

// =============================================================================
// Props
// =============================================================================

const {
	nostr,
	pubkey,
	authState,
	initialData,
	showActions = true,
	compact = false,
	className = ''
}: ProfileViewProps = $props();

// =============================================================================
// State Management
// =============================================================================

let profilePubkey = $derived(pubkey || authState.publicKey || '');
let isOwnProfile = $derived(profilePubkey === authState.publicKey);
let viewMode = $state<'display' | 'edit' | 'create'>('display');
let hasProfileData = $derived(profile && (profile.metadata?.name || profile.metadata?.about || profile.metadata?.picture));

// Debug
console.log('ProfileView setup:', { 
	pubkey, 
	authStatePubkey: authState?.publicKey,
	profilePubkey,
	isOwnProfile 
});

// Real NostrUnchained Profile Integration
let profile = $state(null);
let isLoading = $state(true);
let error = $state(null);
let verified = $state(false);

// Load profile from NostrUnchained
$effect(() => {
	console.log('ProfileView effect:', { 
		profilePubkey, 
		hasNostr: !!nostr, 
		hasProfile: !!nostr?.profile,
		profileModule: nostr?.profile
	});
	
	if (profilePubkey && nostr) {
		// Try to access profile module - this should trigger its creation
		const profileModule = nostr.profile;
		console.log('Profile module accessed:', profileModule);
		
		if (profileModule) {
			isLoading = true;
			error = null;
			
			try {
				// Get profile store from NostrUnchained
				const profileStore = profileModule.get(profilePubkey);
				console.log('Got profile store:', profileStore);
				
				// Subscribe to profile changes
				const unsubscribe = profileStore.subscribe((state) => {
					console.log('Profile state update:', state);
					profile = state.profile;
					isLoading = state.loading;
					error = state.error ? state.error.message : null;
					verified = state.verified;
					
					// Auto-switch to create mode if own profile and no data found
					if (!state.loading && isOwnProfile && !state.profile && viewMode === 'display') {
						console.log('Auto-switching to create mode');
						viewMode = 'create';
					}
				});
				
				return () => {
					unsubscribe();
				};
			} catch (err) {
				console.error('Failed to get profile store:', err);
				error = 'Failed to load profile';
				isLoading = false;
			}
		} else {
			// Profile module not available yet
			console.warn('Profile module not ready yet');
			isLoading = true;
			error = null;
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

function handleCancelEdit() {
	viewMode = hasProfileData ? 'display' : 'create';
}

function handleCancelCreate() {
	if (hasProfileData) {
		viewMode = 'display';
	} else {
		// Stay in create mode if no profile exists
		viewMode = 'create';
	}
}

async function handleSaveProfile(event: Event) {
	const form = event.target as HTMLFormElement;
	const formData = new FormData(form);
	
	const profileData = {
		name: formData.get('name') as string || '',
		about: formData.get('about') as string || '',
		picture: formData.get('picture') as string || '',
		banner: formData.get('banner') as string || '',
		website: formData.get('website') as string || '',
		nip05: formData.get('nip05') as string || '',
		lud16: formData.get('lud16') as string || ''
	};
	
	try {
		isLoading = true;
		error = null;
		
		// Check if nostr.profile exists
		if (!nostr.profile) {
			throw new Error('Profile module not available');
		}
		
		console.log('Using NostrUnchained profile API:', {
			hasProfile: !!nostr.profile,
			hasEdit: typeof nostr.profile.edit === 'function',
			profileData
		});
		
		// Use NostrUnchained profile.edit() API
		const builder = nostr.profile.edit();
		
		if (profileData.name) builder.name(profileData.name);
		if (profileData.about) builder.about(profileData.about);
		if (profileData.picture) builder.picture(profileData.picture);
		if (profileData.banner) builder.banner(profileData.banner);
		if (profileData.website) builder.website(profileData.website);
		if (profileData.nip05) builder.nip05(profileData.nip05);
		if (profileData.lud16) builder.lud16(profileData.lud16);
		
		await builder.preserveExisting(true).publish();
		
		console.log('Profile saved successfully:', profileData);
		viewMode = 'display';
		
	} catch (err) {
		console.error('Failed to save profile:', err);
		error = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
	} finally {
		isLoading = false;
	}
}

// =============================================================================
// Computed Properties
// =============================================================================

const displayName = $derived(
	!profilePubkey ? 'No Profile' :
	profile?.metadata?.name ? profile.metadata.name :
	profile?.metadata?.display_name ? profile.metadata.display_name :
	profilePubkey.substring(0, 8) + '...'
);

const shortPubkey = $derived(
	!profilePubkey ? '' :
	profilePubkey.substring(0, 8) + '...' + profilePubkey.substring(-8)
);
</script>

<div class="profile-view {className}" class:compact>
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
	{:else if viewMode === 'display'}
		<!-- Profile Display Mode -->
		<div class="profile-container">
			<!-- Profile Header -->
			<header class="profile-header">
				<div class="profile-banner">
					{#if profile?.metadata?.banner}
						<img src={profile.metadata.banner} alt="Profile banner" class="banner-image" />
					{:else}
						<div class="banner-placeholder"></div>
					{/if}
				</div>
				
				<div class="profile-header-content">
					<div class="profile-avatar">
						{#if profile?.metadata?.picture}
							<img src={profile.metadata.picture} alt="Profile avatar" class="avatar-image" />
						{:else}
							<div class="avatar-placeholder">
								{displayName && typeof displayName === 'string' ? displayName.charAt(0).toUpperCase() : '?'}
							</div>
						{/if}
					</div>
					
					<div class="profile-info">
						<h1 class="profile-name">{displayName}</h1>
						{#if profile?.metadata?.nip05}
							<div class="nip05-badge" class:verified={verified}>
								{verified ? '✅' : '❌'} {profile.metadata.nip05}
							</div>
						{/if}
						<div class="profile-pubkey" title={profilePubkey}>
							{shortPubkey}
							<button 
								class="copy-btn" 
								onclick={() => navigator.clipboard?.writeText(profilePubkey)}
								title="Copy pubkey"
							>
								📋
							</button>
						</div>
					</div>
					
					{#if showActions}
						<div class="profile-actions">
							{#if isOwnProfile}
								<button class="edit-btn" onclick={handleEditClick}>
									✏️ Edit Profile
								</button>
							{:else}
								<button class="follow-btn">
									👥 Follow
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</header>
			
			<!-- Profile Content -->
			<main class="profile-main">
				{#if profile?.metadata?.about}
					<section class="profile-about">
						<h3>About</h3>
						<p>{profile.metadata.about}</p>
					</section>
				{/if}
				
				{#if profile?.metadata?.website || profile?.metadata?.lud16}
					<section class="profile-links">
						<h3>Links</h3>
						<div class="links-list">
							{#if profile?.metadata?.website}
								<a href={profile.metadata.website} target="_blank" rel="noopener noreferrer" class="profile-link">
									🌐 {profile.metadata.website}
								</a>
							{/if}
							{#if profile?.metadata?.lud16}
								<div class="profile-link">
									⚡ {profile.metadata.lud16}
									<button 
										class="copy-btn" 
										onclick={() => navigator.clipboard?.writeText(profile.metadata.lud16)}
										title="Copy Lightning address"
									>
										📋
									</button>
								</div>
							{/if}
						</div>
					</section>
				{/if}
				
				<!-- Placeholder sections for future phases -->
				<section class="profile-stats">
					<h3>Stats</h3>
					<div class="stats-grid">
						<div class="stat-item">
							<span class="stat-value">0</span>
							<span class="stat-label">Following</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">0</span>
							<span class="stat-label">Followers</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">0</span>
							<span class="stat-label">Notes</span>
						</div>
					</div>
				</section>
			</main>
		</div>
	{:else if viewMode === 'edit' || viewMode === 'create'}
		<!-- Profile Creation/Edit Form -->
		<div class="profile-form-container">
			<header class="form-header">
				<h2>{viewMode === 'create' ? 'Create Your Profile' : 'Edit Profile'}</h2>
				<p>{viewMode === 'create' ? 'Set up your Nostr identity' : 'Update your profile information'}</p>
			</header>
			
			<form class="profile-form" onsubmit={(e) => { e.preventDefault(); handleSaveProfile(e); }}>
				{#if error}
					<div class="form-error" role="alert">
						{error}
					</div>
				{/if}
				
				<div class="form-group">
					<label for="name">Display Name</label>
					<input
						id="name"
						name="name"
						type="text"
						placeholder="Your display name"
						value={profile?.metadata?.name || ''}
						class="form-input"
					/>
					<small class="form-hint">This is how others will see you on Nostr</small>
				</div>
				
				<div class="form-group">
					<label for="about">About</label>
					<textarea
						id="about"
						name="about"
						placeholder="Tell people about yourself..."
						value={profile?.metadata?.about || ''}
						class="form-textarea"
						rows="4"
					></textarea>
					<small class="form-hint">A short bio or description</small>
				</div>
				
				<div class="form-group">
					<label for="picture">Profile Picture URL</label>
					<input
						id="picture"
						name="picture"
						type="url"
						placeholder="https://example.com/avatar.jpg"
						value={profile?.metadata?.picture || ''}
						class="form-input"
					/>
					<small class="form-hint">Link to your profile picture</small>
				</div>
				
				<div class="form-group">
					<label for="banner">Banner Image URL</label>
					<input
						id="banner"
						name="banner"
						type="url"
						placeholder="https://example.com/banner.jpg"
						value={profile?.metadata?.banner || ''}
						class="form-input"
					/>
					<small class="form-hint">Link to your profile banner</small>
				</div>
				
				<div class="form-group">
					<label for="website">Website</label>
					<input
						id="website"
						name="website"
						type="url"
						placeholder="https://yoursite.com"
						value={profile?.metadata?.website || ''}
						class="form-input"
					/>
					<small class="form-hint">Your personal website or blog</small>
				</div>
				
				<div class="form-group">
					<label for="nip05">NIP-05 Identifier</label>
					<input
						id="nip05"
						name="nip05"
						type="email"
						placeholder="username@domain.com"
						value={profile?.metadata?.nip05 || ''}
						class="form-input"
					/>
					<small class="form-hint">Your verified Nostr address (like email)</small>
				</div>
				
				<div class="form-group">
					<label for="lud16">Lightning Address</label>
					<input
						id="lud16"
						name="lud16"
						type="email"
						placeholder="username@lightningprovider.com"
						value={profile?.metadata?.lud16 || ''}
						class="form-input"
					/>
					<small class="form-hint">For receiving Bitcoin payments</small>
				</div>
				
				<div class="form-actions">
					<button 
						type="button" 
						class="cancel-btn" 
						onclick={viewMode === 'create' ? handleCancelCreate : handleCancelEdit}
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
	{/if}
</div>

<style>
.profile-view {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	background: var(--color-background);
}

.profile-view.compact {
	height: auto;
	overflow: visible;
}

.no-profile-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-2xl);
	text-align: center;
	min-height: 300px;
}

.no-profile-icon {
	font-size: 4rem;
	margin-bottom: var(--spacing-lg);
	opacity: 0.5;
}

.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-2xl);
	text-align: center;
	min-height: 300px;
}

.loading-spinner {
	font-size: 4rem;
	margin-bottom: var(--spacing-lg);
	animation: spin 2s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.profile-container {
	max-width: 800px;
	margin: 0 auto;
}

.profile-header {
	position: relative;
	margin-bottom: var(--spacing-xl);
}

.profile-banner {
	height: 200px;
	background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
	border-radius: var(--radius-lg);
	overflow: hidden;
	position: relative;
}

.banner-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.banner-placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
}

.profile-header-content {
	display: flex;
	align-items: flex-end;
	gap: var(--spacing-lg);
	padding: 0 var(--spacing-lg);
	margin-top: -50px;
	position: relative;
	z-index: 1;
}

.profile-avatar {
	flex-shrink: 0;
}

.avatar-image {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	border: 4px solid var(--color-background);
	object-fit: cover;
}

.avatar-placeholder {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	border: 4px solid var(--color-background);
	background: var(--color-surface);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2rem;
	font-weight: bold;
	color: var(--color-text);
}

.profile-info {
	flex: 1;
	padding-top: var(--spacing-lg);
}

.profile-name {
	font-size: var(--text-2xl);
	font-weight: bold;
	margin: 0 0 var(--spacing-xs) 0;
}

.nip05-badge {
	background: var(--color-danger);
	color: var(--color-danger-text);
	padding: var(--spacing-xs) var(--spacing-sm);
	border-radius: var(--radius-sm);
	font-size: var(--text-xs);
	font-weight: 500;
	display: inline-block;
	margin-bottom: var(--spacing-xs);
	border: 1px solid var(--color-danger);
}

.nip05-badge.verified {
	background: var(--color-success);
	color: var(--color-success-text);
	border-color: var(--color-success);
}

.profile-pubkey {
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	color: var(--color-text-muted);
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.copy-btn {
	background: transparent;
	border: none;
	color: var(--color-text-muted);
	cursor: pointer;
	padding: 2px;
	border-radius: var(--radius-sm);
	transition: all var(--transition-fast);
}

.copy-btn:hover {
	background: var(--color-surface);
	color: var(--color-text);
}

.profile-actions {
	padding-top: var(--spacing-lg);
}

.edit-btn,
.follow-btn {
	background: var(--color-primary);
	color: var(--color-primary-text);
	border: none;
	padding: var(--spacing-sm) var(--spacing-lg);
	border-radius: var(--radius-md);
	font-weight: 500;
	cursor: pointer;
	transition: all var(--transition-fast);
}

.edit-btn:hover,
.follow-btn:hover {
	background: var(--color-primary-hover);
}

.profile-main {
	padding: 0 var(--spacing-lg) var(--spacing-xl);
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xl);
}

.profile-about h3,
.profile-links h3,
.profile-stats h3 {
	margin: 0 0 var(--spacing-md) 0;
	font-size: var(--text-lg);
	font-weight: 600;
}

.profile-about p {
	margin: 0;
	line-height: var(--leading-relaxed);
	color: var(--color-text-muted);
}

.links-list {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.profile-link {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	color: var(--color-primary);
	text-decoration: none;
	transition: color var(--transition-fast);
}

.profile-link:hover {
	color: var(--color-primary-hover);
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	gap: var(--spacing-lg);
}

.stat-item {
	text-align: center;
	padding: var(--spacing-md);
	background: var(--color-surface);
	border-radius: var(--radius-md);
}

.stat-value {
	display: block;
	font-size: var(--text-xl);
	font-weight: bold;
	color: var(--color-text);
}

.stat-label {
	display: block;
	font-size: var(--text-sm);
	color: var(--color-text-muted);
	margin-top: var(--spacing-xs);
}

.profile-editor-placeholder {
	padding: var(--spacing-xl);
	text-align: center;
}

.editor-actions {
	display: flex;
	gap: var(--spacing-md);
	justify-content: center;
	margin-top: var(--spacing-lg);
}

.cancel-btn {
	background: var(--color-surface);
	color: var(--color-text);
	border: 1px solid var(--color-border);
	padding: var(--spacing-sm) var(--spacing-lg);
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all var(--transition-fast);
}

.cancel-btn:hover {
	background: var(--color-border);
}

.save-btn {
	background: var(--color-primary);
	color: var(--color-primary-text);
	border: none;
	padding: var(--spacing-sm) var(--spacing-lg);
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all var(--transition-fast);
}

.save-btn:hover {
	background: var(--color-primary-hover);
}

/* Profile Form Styles */
.profile-form-container {
	max-width: 600px;
	margin: 0 auto;
	padding: var(--spacing-xl);
}

.form-header {
	text-align: center;
	margin-bottom: var(--spacing-xl);
}

.form-header h2 {
	margin: 0 0 var(--spacing-sm) 0;
	font-size: var(--text-2xl);
	font-weight: bold;
}

.form-header p {
	margin: 0;
	color: var(--color-text-muted);
	font-size: var(--text-base);
}

.profile-form {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.form-group label {
	color: var(--color-text);
	font-size: var(--text-sm);
	font-weight: 500;
}

.form-input {
	padding: var(--spacing-sm) var(--spacing-md);
	background-color: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	color: var(--color-text);
	font-size: var(--text-base);
	transition: all var(--transition-fast);
	min-height: 44px;
}

.form-input:focus {
	outline: none;
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-textarea {
	padding: var(--spacing-sm) var(--spacing-md);
	background-color: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	color: var(--color-text);
	font-size: var(--text-base);
	font-family: var(--font-sans);
	transition: all var(--transition-fast);
	resize: vertical;
	min-height: 100px;
}

.form-textarea:focus {
	outline: none;
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-hint {
	color: var(--color-text-muted);
	font-size: var(--text-xs);
	margin: 0;
}

.form-actions {
	display: flex;
	gap: var(--spacing-md);
	justify-content: flex-end;
	margin-top: var(--spacing-xl);
	padding-top: var(--spacing-lg);
	border-top: 1px solid var(--color-border);
}

.form-actions .cancel-btn {
	background: transparent;
	color: var(--color-text-muted);
	border: 1px solid var(--color-border);
}

.form-actions .cancel-btn:hover {
	background: var(--color-surface);
	color: var(--color-text);
}

.form-actions .save-btn {
	background: var(--color-primary);
	color: var(--color-primary-text);
	border: none;
	min-width: 120px;
}

.form-actions .save-btn:disabled {
	background: var(--color-surface);
	color: var(--color-text-muted);
	cursor: not-allowed;
	opacity: 0.6;
}

.form-error {
	background: rgba(229, 62, 62, 0.1);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
	padding: var(--spacing-md);
	border-radius: var(--radius-md);
	margin-bottom: var(--spacing-lg);
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}

.form-error::before {
	content: '⚠';
	font-size: var(--text-lg);
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.profile-header-content {
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--spacing-md);
		margin-top: -40px;
	}
	
	.profile-info {
		padding-top: 0;
	}
	
	.profile-main {
		padding: 0 var(--spacing-md) var(--spacing-xl);
	}
	
	.stats-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}
</style>