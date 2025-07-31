<!--
  NostrApp - Main Application Container
  
  Showcases perfect NostrUnchained integration with Svelte
-->

<script lang="ts">
	import type { NostrUnchained } from 'nostr-unchained';
	import NostrTerminal from './terminal/NostrTerminal.svelte';
	import DMChat from './terminal/DMChat.svelte';

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
	
	let currentView = $state<'terminal' | 'messages' | 'publish'>('terminal');
	let userInfo = $state<{ publicKey: string; signerType: string }>({
		publicKey: '',
		signerType: signer || 'unknown'
	});

	// Get user info from NostrUnchained
	$effect(() => {
		if (nostr) {
			// Initialize signing first, then get public key
			nostr.initializeSigning().then(() => {
				return nostr.getPublicKey();
			}).then(pubkey => {
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
					{userInfo.publicKey ? userInfo.publicKey.substring(0, 8) + '...' : 'Loading...'}
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
		</nav>

		<button class="logout-btn" onclick={logout}>
			🚪 Logout
		</button>
	</header>

	<!-- Main Content - NostrUnchained powered -->
	<main class="app-main">
		{#if currentView === 'terminal'}
			<NostrTerminal {authState} {nostr} onLogout={logout} onShowKeys={() => {}} />
		{:else if currentView === 'messages'}
			<DMChat {authState} {nostr} />
		{:else if currentView === 'publish'}
			<div class="publish-view">
				<h2>📝 Publish to Nostr</h2>
				<p>Publishing interface coming soon...</p>
				<p>This will showcase NostrUnchained's fluent event builder:</p>
				<code>await nostr.events.note("Hello Nostr!").publish();</code>
			</div>
		{/if}
	</main>
</div>

<style>
	.nostr-app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #1a1a1a;
		color: white;
	}

	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
		font-family: 'Courier New', monospace;
	}

	.user-signer {
		font-size: 0.8rem;
		opacity: 0.7;
		text-transform: capitalize;
	}

	.app-nav {
		display: flex;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem;
		border-radius: 1rem;
	}

	.nav-btn {
		background: transparent;
		border: none;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.nav-btn.active {
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
	}

	.logout-btn {
		background: rgba(255, 75, 75, 0.2);
		border: 1px solid rgba(255, 75, 75, 0.3);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.logout-btn:hover {
		background: rgba(255, 75, 75, 0.3);
	}

	.app-main {
		flex: 1;
		overflow: hidden;
	}

	.publish-view {
		padding: 2rem;
		text-align: center;
	}

	.publish-view h2 {
		margin-bottom: 1rem;
	}

	.publish-view p {
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.publish-view code {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-family: 'Courier New', monospace;
		display: inline-block;
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