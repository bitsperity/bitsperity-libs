<!--
  NostrApp - Main Application Container
  
  Showcases perfect NostrUnchained integration with Svelte
-->

<script lang="ts">
	import type { NostrUnchained } from 'nostr-unchained';
	import NostrTerminal from './terminal/NostrTerminal.svelte';
	import DMChat from './terminal/DMChat.svelte';
	import PublishCard from './terminal/PublishCard.svelte';
	import ProfileView from './profile/ProfileView.svelte';
	import KeyDisplay from './ui/KeyDisplay.svelte';

	// =============================================================================
	// Props - Clean Dependency Injection
	// =============================================================================
	
	interface Props {
		nostr: NostrUnchained;
		signer: 'extension' | 'temporary' | null;
	}
	
	let { nostr, signer }: Props = $props();

	// =============================================================================
	// App State - Reactive and Clean
	// =============================================================================
	
	let currentView = $state<'terminal' | 'messages' | 'publish' | 'profile'>('terminal');
	let currentProfilePubkey = $state<string | null>(null); // For viewing other profiles
	let userInfo = $state<{ publicKey: string; signerType: string }>({
		publicKey: '',
		signerType: signer || 'unknown'
	});

	// Get user info from NostrUnchained (signing already initialized in landing page)
	$effect(() => {
		if (nostr) {
			nostr.getPublicKey().then(pubkey => {
				userInfo.publicKey = pubkey;
			}).catch(() => {
				userInfo.publicKey = 'Unable to get public key';
			});
		}
	});

	// Create authState for old components
	const authState = $derived({
		publicKey: userInfo.publicKey,
		isAuthenticated: !!userInfo.publicKey,
		signerType: userInfo.signerType,
		user: null,
		signingMethod: userInfo.signerType
	});

	function logout() {
		// Clean logout - just reload the page
		window.location.reload();
	}

	function navigateToProfile(pubkey: string | null = null) {
		console.log('🎯 Navigate to profile in NostrApp', { pubkey, currentView });
		currentProfilePubkey = pubkey; // null = own profile, string = other profile
		currentView = 'profile';
	}

	function navigateToOwnProfile() {
		currentProfilePubkey = null; // Reset to own profile
		currentView = 'profile';
	}
</script>

<div class="nostr-app">
	<!-- Header - Shows NostrUnchained integration -->
	<header class="app-header">
		<div class="user-info">
			<div class="user-avatar">
				{#if signer === 'extension'}🔌{:else}⚡{/if}
			</div>
			<div class="user-details">
				<div class="user-key">
					{#if userInfo.publicKey}
						<KeyDisplay 
							hexKey={userInfo.publicKey} 
							variant="compact" 
							copyable={true}
							className="header-key"
						/>
					{:else}
						<span class="loading-key">Loading...</span>
					{/if}
				</div>
				<div class="user-signer">{userInfo.signerType} signer</div>
			</div>
		</div>

		<nav class="app-nav">
			<button 
				class="nav-btn"
				class:active={currentView === 'terminal'}
				onclick={() => currentView = 'terminal'}
			>
				🌐 Explore
			</button>
			<button 
				class="nav-btn"
				class:active={currentView === 'messages'}
				onclick={() => currentView = 'messages'}
			>
				💬 Messages
			</button>
			<button 
				class="nav-btn"
				class:active={currentView === 'publish'}
				onclick={() => currentView = 'publish'}
			>
				📝 Publish
			</button>
			<button 
				class="nav-btn"
				class:active={currentView === 'profile'}
				onclick={navigateToOwnProfile}
			>
				👤 Profile
			</button>
		</nav>

		<button class="logout-btn" onclick={logout}>
			🚪 Logout
		</button>
	</header>

	<!-- Main Content - NostrUnchained powered -->
	<main class="app-main">
		{#if currentView === 'terminal'}
			<NostrTerminal 
				{authState} 
				{nostr} 
				onLogout={logout} 
				onShowKeys={() => {}}
				on:profileNavigate={(e) => navigateToProfile(e.detail.pubkey)}
			/>
		{:else if currentView === 'messages'}
			<DMChat {authState} {nostr} />
		{:else if currentView === 'publish'}
			<div class="publish-view">
				<PublishCard {nostr} />
			</div>
		{:else if currentView === 'profile'}
			<ProfileView 
				{nostr} 
				{authState} 
				pubkey={currentProfilePubkey}
			/>
		{/if}
	</main>
</div>

<style>
	.nostr-app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
		color: var(--color-text);
	}

	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg) var(--spacing-xl);
		background: var(--color-surface);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--color-border);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
	}

	.user-details {
		display: flex;
		flex-direction: column;
	}

	.user-key {
		font-weight: 600;
		font-family: var(--font-mono);
	}

	/* Styling for KeyDisplay in header */
	.user-key :global(.header-key) {
		font-size: 0.85rem;
		padding: 4px 8px;
		background: rgba(255, 255, 255, 0.1) !important;
		border: 1px solid rgba(255, 255, 255, 0.2) !important;
	}

	.user-key :global(.header-key:hover) {
		background: rgba(255, 255, 255, 0.15) !important;
		transform: none; /* Remove the lift effect in header */
	}

	.loading-key {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.user-signer {
		font-size: 0.8rem;
		opacity: 0.7;
		text-transform: capitalize;
	}

	.app-nav {
		display: flex;
		gap: var(--spacing-sm);
		background: var(--color-background);
		padding: var(--spacing-sm);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
	}

	.nav-btn {
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.nav-btn:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.nav-btn.active {
		background: var(--color-primary);
		color: var(--color-primary-text);
	}

	.logout-btn {
		background: transparent;
		border: 1px solid var(--color-danger);
		color: var(--color-danger);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--text-sm);
	}

	.logout-btn:hover {
		background: var(--color-danger);
		color: var(--color-danger-text);
	}

	.app-main {
		flex: 1;
		overflow: hidden;
	}

	.publish-view {
		padding: var(--spacing-xl);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		min-height: 100%;
		background: transparent; /* Let the global background show through */
	}

	@media (max-width: 768px) {
		.app-header {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.app-nav {
			width: 100%;
			justify-content: center;
		}

		.nav-btn {
			flex: 1;
			text-align: center;
		}
	}
</style>