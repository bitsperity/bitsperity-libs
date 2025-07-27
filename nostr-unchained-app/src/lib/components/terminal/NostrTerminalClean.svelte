<!--
  NostrTerminal - Explore Nostr Events
  
  Showcases NostrUnchained's query capabilities with beautiful Svelte integration
-->

<script lang="ts">
	import type { NostrUnchained } from 'nostr-unchained';
	import { onMount } from 'svelte';

	// =============================================================================
	// Props - Clean Dependency Injection
	// =============================================================================
	
	interface Props {
		nostr: NostrUnchained;
	}
	
	let { nostr }: Props = $props();

	// =============================================================================
	// State - Reactive and Type-Safe
	// =============================================================================

	interface NostrEvent {
		id: string;
		pubkey: string;
		created_at: number;
		kind: number;
		content: string;
		tags: string[][];
		sig: string;
	}

	let events: NostrEvent[] = $state([]);
	let isLoading = $state(true);
	let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	let selectedKinds = $state([1]); // Default to text notes
	let limit = $state(20);

	// =============================================================================
	// NostrUnchained Integration - Elegant Query API
	// =============================================================================

	// Load events using NostrUnchained's fluent query builder
	async function loadEvents() {
		isLoading = true;
		try {
			// This showcases NostrUnchained's elegant query API
			const results = await nostr.query()
				.kinds(selectedKinds)
				.limit(limit)
				.execute();
			
			events = results || [];
		} catch (error) {
			console.error('Failed to load events:', error);
			events = [];
		} finally {
			isLoading = false;
		}
	}

	// Check connection status
	async function checkConnection() {
		try {
			const isConnected = await nostr.isConnected();
			connectionStatus = isConnected ? 'connected' : 'disconnected';
		} catch (error) {
			connectionStatus = 'disconnected';
		}
	}

	// Connect to relays
	async function connect() {
		connectionStatus = 'connecting';
		try {
			await nostr.connect();
			connectionStatus = 'connected';
			await loadEvents();
		} catch (error) {
			console.error('Failed to connect:', error);
			connectionStatus = 'disconnected';
		}
	}

	// Initialize on mount
	onMount(async () => {
		await checkConnection();
		if (connectionStatus === 'connected') {
			await loadEvents();
		}
	});

	// Format timestamp
	function formatTime(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleString();
	}

	// Get event kind name
	function getKindName(kind: number): string {
		const kindNames: Record<number, string> = {
			0: 'Profile',
			1: 'Text Note',
			2: 'Relay Rec',
			3: 'Contacts',
			4: 'DM (Legacy)',
			5: 'Deletion',
			6: 'Repost',
			7: 'Reaction',
			1059: 'Gift Wrap',
			10002: 'Relay List'
		};
		return kindNames[kind] || `Kind ${kind}`;
	}

	// Filter events by kind
	function filterByKind(kind: number) {
		selectedKinds = [kind];
		loadEvents();
	}

	// Refresh events
	function refresh() {
		loadEvents();
	}
</script>

<div class="nostr-terminal">
	<!-- Header with connection status and controls -->
	<div class="terminal-header">
		<div class="connection-status">
			<div class="status-indicator" class:connected={connectionStatus === 'connected'} 
				 class:connecting={connectionStatus === 'connecting'}>
			</div>
			<span class="status-text">
				{#if connectionStatus === 'connected'}
					Connected
				{:else if connectionStatus === 'connecting'}
					Connecting...
				{:else}
					Disconnected
				{/if}
			</span>
			{#if connectionStatus !== 'connected'}
				<button class="connect-btn" onclick={connect}>Connect</button>
			{/if}
		</div>
		
		<div class="terminal-title">
			🌐 Explore Nostr
		</div>
		
		<button class="refresh-btn" onclick={refresh} disabled={isLoading}>
			{isLoading ? '⏳' : '🔄'}
		</button>
	</div>

	<!-- Event kind filters -->
	<div class="kind-filters">
		<button 
			class="kind-btn"
			class:active={selectedKinds.includes(1)}
			onclick={() => filterByKind(1)}
		>
			📝 Notes
		</button>
		<button 
			class="kind-btn"
			class:active={selectedKinds.includes(0)}
			onclick={() => filterByKind(0)}
		>
			👤 Profiles
		</button>
		<button 
			class="kind-btn"
			class:active={selectedKinds.includes(7)}
			onclick={() => filterByKind(7)}
		>
			❤️ Reactions
		</button>
		<button 
			class="kind-btn"
			class:active={selectedKinds.includes(1059)}
			onclick={() => filterByKind(1059)}
		>
			🎁 Gift Wraps
		</button>
	</div>

	<!-- Events list -->
	<div class="events-container">
		{#if connectionStatus !== 'connected'}
			<div class="disconnected-state">
				<h3>🔌 Not Connected</h3>
				<p>Connect to Nostr relays to explore events</p>
				<button class="connect-btn-large" onclick={connect}>
					Connect to Nostr
				</button>
			</div>
		{:else if isLoading}
			<div class="loading-state">
				<div class="loading-spinner">⏳</div>
				<p>Loading events from Nostr...</p>
			</div>
		{:else if events.length === 0}
			<div class="empty-state">
				<h3>📭 No Events Found</h3>
				<p>No events of this type found. Try a different filter.</p>
			</div>
		{:else}
			<div class="events-list">
				<div class="events-header">
					<h3>{events.length} events</h3>
					<span class="events-info">Kind: {getKindName(selectedKinds[0])}</span>
				</div>
				
				{#each events as event}
					<div class="event-card">
						<div class="event-header">
							<div class="event-kind">
								{getKindName(event.kind)}
							</div>
							<div class="event-time">
								{formatTime(event.created_at)}
							</div>
						</div>
						
						<div class="event-author">
							👤 {event.pubkey.substring(0, 8)}...
						</div>
						
						{#if event.content}
							<div class="event-content">
								{event.content.length > 200 
									? event.content.substring(0, 200) + '...' 
									: event.content}
							</div>
						{/if}
						
						{#if event.tags.length > 0}
							<div class="event-tags">
								{#each event.tags.slice(0, 3) as tag}
									<span class="tag">
										{tag[0]}: {tag[1]?.substring(0, 10) || ''}...
									</span>
								{/each}
								{#if event.tags.length > 3}
									<span class="tag-more">+{event.tags.length - 3} more</span>
								{/if}
							</div>
						{/if}
						
						<div class="event-id">
							🆔 {event.id.substring(0, 16)}...
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.nostr-terminal {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #1a1a1a;
		color: white;
	}

	/* Header Styles */
	.terminal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
	}

	.connection-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #ff4444;
		transition: all 0.3s ease;
	}

	.status-indicator.connected {
		background: #44ff44;
		box-shadow: 0 0 10px rgba(68, 255, 68, 0.5);
	}

	.status-indicator.connecting {
		background: #ffaa44;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.status-text {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.connect-btn {
		background: rgba(103, 126, 234, 0.2);
		border: 1px solid rgba(103, 126, 234, 0.5);
		color: #677eea;
		padding: 0.25rem 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s ease;
	}

	.connect-btn:hover {
		background: rgba(103, 126, 234, 0.3);
	}

	.terminal-title {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.refresh-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.2s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		transform: rotate(180deg);
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Kind Filters */
	.kind-filters {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	.kind-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		font-size: 0.9rem;
	}

	.kind-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.kind-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: transparent;
	}

	/* Events Container */
	.events-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 2rem;
	}

	.disconnected-state, .loading-state, .empty-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		text-align: center;
		opacity: 0.8;
	}

	.loading-spinner {
		font-size: 2rem;
		margin-bottom: 1rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.connect-btn-large {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		color: white;
		padding: 1rem 2rem;
		border-radius: 1rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		margin-top: 1rem;
		transition: transform 0.2s ease;
	}

	.connect-btn-large:hover {
		transform: translateY(-1px);
	}

	/* Events List */
	.events-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.events-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.events-header h3 {
		margin: 0;
		color: #677eea;
	}

	.events-info {
		opacity: 0.7;
		font-size: 0.9rem;
	}

	.event-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.event-card:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.event-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.event-kind {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.event-time {
		opacity: 0.7;
		font-size: 0.8rem;
	}

	.event-author {
		font-family: 'Courier New', monospace;
		opacity: 0.8;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.event-content {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin: 0.5rem 0;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.event-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0.5rem 0;
	}

	.tag {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.7rem;
		opacity: 0.8;
	}

	.tag-more {
		opacity: 0.6;
		font-style: italic;
		font-size: 0.7rem;
	}

	.event-id {
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		opacity: 0.6;
		margin-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.terminal-header {
			padding: 1rem;
			flex-direction: column;
			gap: 1rem;
		}

		.kind-filters {
			padding: 1rem;
		}

		.events-container {
			padding: 1rem;
		}

		.events-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.event-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>