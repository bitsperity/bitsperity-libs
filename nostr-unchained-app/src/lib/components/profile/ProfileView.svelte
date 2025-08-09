<script lang="ts">
/**
 * ProfileView - Main Profile Container
 * 
 * Displays user profiles with own vs foreign profile distinction.
 * Integrates with NostrUnchained API for reactive profile management.
 * Max 200 lines - Zero Monolith Policy
 */

import { onDestroy, createEventDispatcher } from 'svelte';
// keep props untyped locally to avoid external type resolution issues
type ProfileViewProps = any;
import ProfileHeader from './ProfileHeader.svelte';
import ProfileInfo from './ProfileInfo.svelte';
import ProfileActions from './ProfileActions.svelte';
import { getProfileStore, unsubscribeFromProfile } from '../../utils/ProfileSubscriptionManager.js';
import EventCard from '../terminal/EventCard.svelte';

// =============================================================================
// Props
// =============================================================================

const {
	nostr,
	pubkey,
	authState,
    // initialData,
	showActions = true,
	compact = false,
	className = '',
	onDMClick
}: ProfileViewProps = $props();

// =============================================================================
// State Management
// =============================================================================

// =============================================================================
// PERFECT DX: State-of-the-art Svelte + NostrUnchained Integration
// =============================================================================

// PERFECT DX: Clean pubkey access via NostrUnchained
let profilePubkey = $derived(pubkey || nostr.me || '');
// const isOwnProfile = $derived(profilePubkey === nostr.me);
let viewMode = $state<'display' | 'edit' | 'create'>('display');

// Use ProfileSubscriptionManager for optimized profile loading
let profile = $state(null);
let profileUnsubscribe: (() => void) | null = null;
const subscriberId = `profile-view-${Math.random().toString(36).substring(7)}`;

// Reactive profile loading using aggregated subscription manager
$effect(() => {
  if (!(profilePubkey && nostr)) { profile = null; return undefined; }
  try {
    const profileStore = getProfileStore(profilePubkey, subscriberId);
    profileUnsubscribe = profileStore.subscribe((profileData: any) => { profile = profileData as any; });
    return () => {
      try { profileUnsubscribe?.(); } catch {}
      unsubscribeFromProfile(profilePubkey, subscriberId);
    };
  } catch (err) {
    console.error('Failed to load profile:', err);
    profile = null;
    return undefined;
  }
});

// Cleanup on component destroy
onDestroy(() => {
  if (profileUnsubscribe) {
    profileUnsubscribe();
  }
  if (profilePubkey) {
    unsubscribeFromProfile(profilePubkey, subscriberId);
  }
});


// Loading state - true until we have profile data or confirmed null
let isLoading = $derived(profile === undefined);

// CLEAN ARCHITECTURE: No error state needed (base layer handles errors gracefully)
let error = $derived<string | null>(null);

// TODO: Implement NIP-05 verification in clean architecture
let verified = $derived(false);

let hasProfileData = $derived(!!(profile && (profile as any)?.metadata && (((profile as any).metadata.name) || ((profile as any).metadata.about) || ((profile as any).metadata.picture))));

// CLEAN ARCHITECTURE: No auto-create logic needed
// Cache-first approach shows profiles immediately when available
// Users can manually click "Create Profile" if needed

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
// Profile Tabs: Notes / Replies / Reposts / Likes
// =============================================================================

type Tab = 'notes' | 'replies' | 'reposts' | 'likes';
let currentTab: Tab = $state('notes');
let listEvents: any[] = $state([]);
let listLoading = $state(false);
let liveHandle: any = null;
const dispatch = createEventDispatcher<{ openThread: { id: string } }>();

function stopLive() {
  try { liveHandle?.stop?.(); } catch {}
  liveHandle = null;
}

async function startLive() {
  if (!nostr || !profilePubkey) return;
  stopLive();
  listLoading = true;
  try {
    let b = nostr.sub();
    if (currentTab === 'reposts') {
      b = b.kinds([6]).authors([profilePubkey]); // NIP-18
    } else if (currentTab === 'likes') {
      b = b.kinds([7]).authors([profilePubkey]); // NIP-25
    } else {
      // notes / replies are both kind 1; split in UI
      b = b.kinds([1]).authors([profilePubkey]); // NIP-01
    }
    b = b.limit(200);
    const handle = await b.execute();
    liveHandle = handle;
    handle.store.subscribe((arr: any[]) => {
      let items = (arr || []).slice();
      if (currentTab === 'notes') {
        // exclude replies: those having at least one 'e' tag
        items = items.filter((ev: any) => !(Array.isArray(ev.tags) && ev.tags.some((t: any[]) => t?.[0] === 'e')));
      } else if (currentTab === 'replies') {
        items = items.filter((ev: any) => Array.isArray(ev.tags) && ev.tags.some((t: any[]) => t?.[0] === 'e'));
      }
      listEvents = items.sort((a: any, b: any) => b.created_at - a.created_at);
      listLoading = false;
    });
  } catch (e) {
    listLoading = false;
    console.error('Profile list load failed', e);
  }
}

$effect(() => {
  // Start/refresh when tab or target profile changes
  if (nostr && profilePubkey) startLive();
});

onDestroy(() => stopLive());

// =============================================================================
// Computed Properties
// =============================================================================

// const displayName = $derived(
//     !profilePubkey ? 'No Profile' :
//     (profile as any)?.metadata?.name ? (profile as any).metadata.name :
//     (profile as any)?.metadata?.display_name ? (profile as any).metadata.display_name :
//     profilePubkey.substring(0, 8) + '...'
// );

// const shortPubkey = $derived(
//     !profilePubkey ? '' :
//     profilePubkey.substring(0, 8) + '...' + profilePubkey.substring(profilePubkey.length - 8)
// );
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
		<!-- Profile Display Mode - Using Modular Components -->
		<div class="profile-container">
			<!-- Profile Banner -->
			<div class="profile-banner">
                {#if (profile as any)?.metadata?.banner}
                    <img src={(profile as any).metadata.banner} alt="" class="banner-image" />
				{:else}
					<div class="banner-placeholder"></div>
				{/if}
			</div>
			
			<!-- Modular Profile Header -->
			<ProfileHeader 
				{profile}
				{verified}
				{compact}
				className="main-profile-header"
			/>
			
			<!-- Modular Profile Actions -->
			{#if showActions}
                <ProfileActions 
                    {profile}
                    {nostr}
                    {authState}
                    pubkey={profilePubkey}
                    onEditClick={handleEditClick}
                    onCreateClick={handleCreateClick}
                    onDMClick={onDMClick || (()=>{})}
                    className="main-profile-actions"
                />
			{/if}
			
			<!-- Modular Profile Info -->
			<ProfileInfo 
				{profile}
				{nostr}
				myPubkey={nostr.me}
				{compact}
				className="main-profile-info"
			/>

			<!-- Profile Tabs -->
			<div class="profile-tabs">
				<div class="segmented">
					<button class="seg-btn" class:active={currentTab==='notes'} onclick={() => currentTab='notes'}>Notes</button>
					<button class="seg-btn" class:active={currentTab==='replies'} onclick={() => currentTab='replies'}>Replies</button>
					<button class="seg-btn" class:active={currentTab==='reposts'} onclick={() => currentTab='reposts'}>Reposts</button>
					<button class="seg-btn" class:active={currentTab==='likes'} onclick={() => currentTab='likes'}>Likes</button>
				</div>

				{#if listLoading}
					<div class="loading-list"><div class="spinner"></div> Lädt…</div>
				{:else if listEvents.length === 0}
					<div class="empty-list">Keine Einträge</div>
				{:else}
					<div class="event-list">
						{#each listEvents as ev (ev.id)}
							<EventCard event={ev} {nostr} on:openThread={(e)=>dispatch('openThread', e.detail)} />
						{/each}
					</div>
				{/if}
			</div>
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
                        value={(profile as any)?.metadata?.name || ''}
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
                        value={(profile as any)?.metadata?.about || ''}
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
                        value={(profile as any)?.metadata?.picture || ''}
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
                        value={(profile as any)?.metadata?.banner || ''}
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
                        value={(profile as any)?.metadata?.website || ''}
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
                        value={(profile as any)?.metadata?.nip05 || ''}
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
                        value={(profile as any)?.metadata?.lud16 || ''}
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
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
}

.profile-banner {
	height: 200px;
	background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
	border-radius: var(--radius-lg);
	overflow: hidden;
	position: relative;
	margin-bottom: -60px; /* Moderate overlap */
	z-index: 0;
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

/* Modular Component Styling */
.main-profile-header {
	z-index: 1;
	position: relative;
	background: var(--color-background);
	border-radius: var(--radius-lg);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	margin: 0 var(--spacing-lg);
	padding-top: var(--spacing-md); /* Moderate padding for avatar overlap */
}

.main-profile-actions {
	margin: 0 var(--spacing-lg);
	justify-content: center;
}

.main-profile-info {
	margin: 0 var(--spacing-lg);
}

/* Tabs */
.profile-tabs { margin: var(--spacing-lg); display:flex; flex-direction: column; gap: var(--spacing-md); }
.segmented { display:inline-flex; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); }
.seg-btn { padding:8px 12px; background:transparent; color:#cbd5e1; border:none; cursor:pointer; font-size:.9rem; }
.seg-btn.active { background: var(--color-primary); color: var(--color-primary-text); }
.event-list { display:flex; flex-direction: column; gap: 1rem; }
.loading-list, .empty-list { color:#94a3b8; padding: .5rem 0; }
.spinner { width:16px; height:16px; border:2px solid var(--color-border); border-top:2px solid var(--color-primary); border-radius:50%; display:inline-block; animation: spin 1s linear infinite; margin-right:.5rem; }
@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }

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
	.profile-container {
		gap: var(--spacing-md);
	}
	
	.profile-banner {
		height: 150px;
		margin-bottom: -40px;
	}
	
	.main-profile-header {
		margin: 0 var(--spacing-md);
		padding-top: var(--spacing-sm);
	}
	
	.main-profile-actions {
		margin: 0 var(--spacing-md);
	}
	
	.main-profile-info {
		margin: 0 var(--spacing-md);
	}
	
	.profile-form-container {
		padding: var(--spacing-lg) var(--spacing-md);
	}
	
	.form-actions {
		flex-direction: column;
		align-items: stretch;
	}
	
	.form-actions .cancel-btn,
	.form-actions .save-btn {
		width: 100%;
		justify-content: center;
	}
}

@media (max-width: 480px) {
	.profile-banner {
		height: 120px;
		margin-bottom: -30px;
	}
	
	.main-profile-header {
		margin: 0 var(--spacing-sm);
	}
	
	.main-profile-actions {
		margin: 0 var(--spacing-sm);
	}
	
	.main-profile-info {
		margin: 0 var(--spacing-sm);
	}
	
	.profile-form-container {
		padding: var(--spacing-md) var(--spacing-sm);
	}
	
	.form-header h2 {
		font-size: var(--text-xl);
	}
	
	.form-input,
	.form-textarea {
		font-size: 16px; /* Prevent zoom on iOS */
	}
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
	.profile-banner {
		border: 2px solid var(--color-border);
	}
	
	.main-profile-header {
		border: 2px solid var(--color-border);
	}
	
	.form-input,
	.form-textarea {
		border-width: 2px;
	}
	
	.form-input:focus,
	.form-textarea:focus {
		border-width: 3px;
	}
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
	.loading-spinner {
		animation: none;
	}
	
	.profile-banner,
	.main-profile-header,
	.form-input,
	.form-textarea,
	.cancel-btn,
	.save-btn {
		transition: none;
	}
}

/* Dark Mode Adjustments */
@media (prefers-color-scheme: dark) {
	.main-profile-header {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}
	
	.form-input:focus,
	.form-textarea:focus {
		box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
	}
}
</style>