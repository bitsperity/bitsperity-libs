<!--
  NostrApp - Main Application Container
  
  Showcases perfect NostrUnchained integration with Svelte
-->

<script lang="ts">
    // Simplify types for app demo – avoid external type import errors
	import NostrTerminal from './terminal/NostrTerminal.svelte';
	import DMChat from './terminal/DMChat.svelte';
	import PublishCard from './terminal/PublishCard.svelte';
	import ProfileView from './profile/ProfileView.svelte';
	import KeyDisplay from './ui/KeyDisplay.svelte';
	import { initializeProfileManager } from '../utils/ProfileSubscriptionManager.js';

	// =============================================================================
	// Props - Clean Dependency Injection
	// =============================================================================
	
    import FeedView from './feed/FeedView.svelte';
    import EventThread from './thread/EventThread.svelte';
    import EncodingsPanel from './ui/EncodingsPanel.svelte';

    interface Props {
        nostr: any;
        signer: 'extension' | 'temporary' | null;
    }
	
	let { nostr, signer }: Props = $props();

	// =============================================================================
	// App State - Reactive and Clean
	// =============================================================================
	
    let currentView = $state<'terminal' | 'messages' | 'publish' | 'profile' | 'feed' | 'thread'>('terminal');
	let currentProfilePubkey = $state<string | null>(null); // For viewing other profiles
    let currentThreadId = $state<string | null>(null);
	let userInfo = $state<{ publicKey: string; signerType: string }>({
		publicKey: '',
		signerType: signer || 'extension'
	});
  let showRelay = $state(false);
  let showEnc = $state(false);

	// Initialize ProfileSubscriptionManager when NostrUnchained is ready
	$effect(() => {
		if (nostr) {
			// Initialize the ProfileSubscriptionManager with NostrUnchained instance
			initializeProfileManager(nostr);
			
			// Get user info
            nostr.getPublicKey().then((pubkey: string) => {
				userInfo.publicKey = pubkey;
			}).catch(() => {
				userInfo.publicKey = 'Unable to get public key';
			});
		}
	});

	// Create authState for old components
    const authState = $derived<any>({
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

    function navigateToProfile(pubkey: string | null = null): void {
		console.log('🎯 Navigate to profile in NostrApp', { pubkey, currentView });
        currentProfilePubkey = pubkey as any; // keep union type stable
		currentView = 'profile';
	}

	function navigateToOwnProfile() {
		currentProfilePubkey = null; // Reset to own profile
		currentView = 'profile';
	}
	
    function navigateToDM(pubkey: string | null = null): void {
		console.log('🎯 Navigate to DM in NostrApp', { pubkey, currentView });
		currentView = 'messages';
		// If pubkey provided, start conversation with that user
		if (pubkey) {
			// We'll pass this to DMChat component to auto-open conversation
			setTimeout(() => {
				// Trigger conversation opening in DMChat
				const dmChatComponent = document.querySelector('.dm-chat');
				if (dmChatComponent) {
					// Dispatch custom event to DMChat to open conversation
					dmChatComponent.dispatchEvent(new CustomEvent('openConversation', { detail: { pubkey } }));
				}
			}, 100);
		}
	}
</script>

<div class="nostr-app">
	<!-- Header - Shows NostrUnchained integration -->
    <header class="app-header">
        <div class="header-left">
            <div class="user-chip">
                {#if userInfo.publicKey}
                    <KeyDisplay 
                        hexKey={userInfo.publicKey} 
                        variant="compact" 
                        copyable={true}
                        className="header-key"
                    />
                {:else}
                    <span class="loading-key">Loading…</span>
                {/if}
                <span class="signer-chip" title={`signer: ${userInfo.signerType}`}>
                    {#if signer === 'extension'}EXTENSION{:else}TEMP{/if}
                </span>
            </div>
        </div>

        <nav class="segmented-nav">
            <button 
                class="seg-btn"
                class:active={currentView === 'terminal'}
                onclick={() => currentView = 'terminal'}
                title="Explore"
            >🌐 Explore</button>
            <button 
                class="seg-btn"
                class:active={currentView === 'messages'}
                onclick={() => currentView = 'messages'}
                title="Messages"
            >💬 Messages</button>
            <button 
                class="seg-btn"
                class:active={currentView === 'feed'}
                onclick={() => currentView = 'feed'}
                title="Feed"
            >📰 Feed</button>
            <button 
                class="seg-btn"
                class:active={currentView === 'publish'}
                onclick={() => currentView = 'publish'}
                title="Publish"
            >📝 Publish</button>
            <button 
                class="seg-btn"
                class:active={currentView === 'profile'}
                onclick={navigateToOwnProfile}
                title="Profile"
            >👤 Profile</button>
        </nav>

        <div class="header-right">
            <div class="connection-chip" title={nostr?.connectedRelays?.length ? `${nostr.connectedRelays.length} relay(s)` : 'No relay'}>
                {#if nostr?.connectedRelays?.length}
                    🟢 Connected to {nostr.connectedRelays.length} relays
                {:else}
                    🔴 Connecting…
                {/if}
            </div>
            <button class="ghost-btn" onclick={() => showRelay = !showRelay} title="Relay Inspector">{showRelay ? '📡 Hide Relay' : '📡 Show Relay'}</button>
            <button class="ghost-btn" onclick={() => showEnc = !showEnc} title="Encodings">🔤 Encodings</button>
            <button class="ghost-btn danger" onclick={logout} title="Logout">🚪 Logout</button>
        </div>
    </header>

	<!-- Main Content - NostrUnchained powered -->
	<main class="app-main">
        {#if currentView === 'terminal'}
            <NostrTerminal 
                {nostr}
                showRelayInspector={showRelay}
                on:profileNavigate={(e) => navigateToProfile(e.detail.pubkey)}
            />
            {#if showEnc}
                <div style="padding: 0.75rem 1rem;">
                    <EncodingsPanel />
                </div>
            {/if}
        {:else if currentView === 'messages'}
			<DMChat {authState} {nostr} />
        {:else if currentView === 'feed'}
            <FeedView {nostr} />
		{:else if currentView === 'publish'}
			<div class="publish-view">
				<PublishCard {nostr} />
			</div>
		{:else if currentView === 'profile'}
            <ProfileView 
                {nostr} 
                {authState} 
                pubkey={currentProfilePubkey || ''}
                onDMClick={navigateToDM}
            />
        {:else if currentView === 'thread'}
            {#if currentThreadId}
                <EventThread {nostr} rootId={currentThreadId} />
            {/if}
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
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-xl);
        background: var(--color-surface);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--color-border);
        position: sticky;
        top: 0;
        z-index: 1000;
        gap: var(--spacing-md);
    }

    .header-left { display:flex; align-items:center; }
    .header-right { display:flex; justify-content:flex-end; }
    .user-chip { display:flex; align-items:center; gap:.5rem; }
    .user-chip :global(.header-key) {
        font-size: 0.85rem;
        padding: 4px 8px;
        background: rgba(255,255,255,0.06) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
    }
    .signer-chip { font-size:.7rem; letter-spacing:.06em; color:#a3b2c5; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:2px 6px; border-radius:9999px; }
    .loading-key { color: var(--color-text-muted); font-style: italic; }

    .segmented-nav { display:inline-flex; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); }
    .seg-btn { padding:8px 14px; background:transparent; color:#cbd5e1; border:none; cursor:pointer; font-size:.9rem; transition:background .15s ease,color .15s ease; }
    .seg-btn.active { background: var(--color-primary); color: var(--color-primary-text); }

    .ghost-btn { padding:8px 12px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; transition: all .15s ease; }
    .ghost-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.14); }
    .ghost-btn.danger { border-color: rgba(239,68,68,0.5); color:#fecaca; }
    .ghost-btn.danger:hover { background: rgba(239,68,68,0.15); }
    .connection-chip { font-size:.85rem; color:#86efac; border:1px solid rgba(34,197,94,0.35); background: rgba(34,197,94,0.1); padding:4px 8px; border-radius:10px; }

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
        .app-header { grid-template-columns: 1fr; padding: 0.75rem; }
        .header-left { justify-content: space-between; }
        .segmented-nav { width: 100%; justify-content: center; }
    }
</style>