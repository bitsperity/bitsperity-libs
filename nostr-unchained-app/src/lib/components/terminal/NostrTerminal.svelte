<!--
  Nostr Mobile Terminal
  
  Revolutionary touch-first developer experience for Nostr
  Mobile-first, gesture-driven, cutting-edge design
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createContextLogger } from '../../utils/Logger.js';
	import EventCard from './EventCard.svelte';
	import QueryBuilder from './QueryBuilder.svelte';
	import PublishCard from './PublishCard.svelte';
	import DMChat from './DMChat.svelte';
	import type { AuthState } from '../../types/app.js';

	let { authState, onLogout, onShowKeys, nostr }: {
		authState: AuthState;
		onLogout: () => void;
		onShowKeys: () => void;
		nostr: any; // NostrUnchained instance
	} = $props();

	// =============================================================================
	// State Management
	// =============================================================================

	let currentMode = $state<'explore' | 'publish' | 'messages'>('explore');
	let events = $state<any[]>([]);
	let isLoading = $state(false);
	let connectionStatus = $state({ isConnected: false, stats: null });
	let currentQuery = $state({ filters: [], limit: 10 });

	const logger = createContextLogger('NostrTerminal');

	// =============================================================================
	// Lifecycle & Event Handling
	// =============================================================================

	onMount(async () => {
		await initializeTerminal();
		await loadInitialEvents();
	});

	async function initializeTerminal() {
		try {
			// Wait for connection to be established
			let attempts = 0;
			while (nostr.connectedRelays.length === 0 && attempts < 10) {
				console.log('⏳ Waiting for relay connection... attempt', attempts + 1);
				await new Promise(resolve => setTimeout(resolve, 500));
				attempts++;
			}
			
			// Update connection status
			connectionStatus = {
				isConnected: nostr.connectedRelays.length > 0,
				connectedRelays: nostr.connectedRelays,
				failedRelays: []
			};
			
			logger.info('Terminal initialized with nostr-unchained', { 
				connectedRelays: nostr.connectedRelays,
				isConnected: connectionStatus.isConnected
			});
		} catch (error) {
			logger.error('Failed to initialize terminal', { error });
		}
	}

	async function loadInitialEvents() {
		isLoading = true;
		
		// Wait for connection first
		if (nostr.connectedRelays.length === 0) {
			console.log('⏳ Waiting for relay connection...');
			// Wait a bit for connection
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		
		try {
			// 🚀 SHOWCASE: Universal Cache Architecture - Identical APIs!
			// Use nostr.query() for instant cache access
			const cachedEvents = nostr.query().kinds([1]).limit(20).execute();
			console.log('📊 Cache query result:', cachedEvents);
			
			// Check cache first
			if (cachedEvents && cachedEvents.current && cachedEvents.current.length > 0) {
				events = cachedEvents.current.sort((a: any, b: any) => b.created_at - a.created_at);
				console.log('⚡ Loaded from cache:', events.length);
			}
			
			// Use nostr.sub() for live relay updates
			console.log('📡 Starting live subscription...');
			const liveStorePromise = nostr.sub().kinds([1]).limit(20).execute();
			
			// Handle the promise properly
			const liveStore = await liveStorePromise;
			console.log('📡 Live subscription store:', liveStore);
			
			// Subscribe to the reactive store (Svelte magic!)
			if (liveStore && liveStore.subscribe) {
				liveStore.subscribe((liveEvents: any[]) => {
					console.log('🔥 Live events received:', liveEvents?.length || 0);
					if (liveEvents && liveEvents.length > 0) {
						events = liveEvents.sort((a: any, b: any) => b.created_at - a.created_at);
					}
					isLoading = false;
				});
			} else {
				isLoading = false;
			}
			
			logger.info('🎯 Using nostr-unchained Universal Cache Architecture!');
		} catch (error) {
			logger.error('Failed to load events with nostr-unchained', { error });
			events = [];
			isLoading = false;
		}
	}

	async function handleQueryUpdate(newQuery: any) {
		currentQuery = newQuery;
		await executeQuery();
	}

	async function executeQuery() {
		isLoading = true;
		// Clear events immediately when starting new query
		events = [];
		
		try {
			// 🎯 BUILD ELEGANT FLUENT QUERY
			let queryBuilder = nostr.sub().limit(currentQuery.limit);
			
			// Apply filters with fluent API
			for (const filterItem of currentQuery.filters) {
				switch (filterItem.type) {
					case 'kind':
						queryBuilder = queryBuilder.kinds([filterItem.value]);
						break;
					case 'author':
						queryBuilder = queryBuilder.authors([filterItem.value]);
						break;
					case 'since':
						queryBuilder = queryBuilder.since(filterItem.value);
						break;
				}
			}
			
			// Execute and get reactive store
			const queryStore = queryBuilder.execute();
			console.log('🔍 Fluent query executed:', queryBuilder);
			
			// Subscribe to reactive store
			queryStore.subscribe((queryEvents: any[]) => {
				console.log('🎯 Query results:', queryEvents.length);
				events = queryEvents.sort((a: any, b: any) => b.created_at - a.created_at);
				isLoading = false;
			});
			
			logger.info('✨ Fluent query with reactive stores!', { query: currentQuery });
		} catch (error) {
			logger.error('Query execution failed', { error });
			events = [];
			isLoading = false;
		}
	}

	async function handlePublish(content: string) {
		try {
			// 🚀 SHOWCASE: Zero-config publishing!
			const result = await nostr.publish(content);
			console.log('📝 Published with nostr-unchained:', result);
			
			if (result.success) {
				logger.info('✨ Published successfully!', { 
					eventId: result.eventId,
					relayCount: result.relayResults.length 
				});
				// Events will automatically update via reactive stores!
			}
			
			return result;
		} catch (error) {
			logger.error('Publish failed', { error });
			throw error;
		}
	}

	// =============================================================================
	// Touch Gesture Handlers
	// =============================================================================

	let startY = 0;
	let isDragging = false;

	function handleTouchStart(event: TouchEvent) {
		startY = event.touches[0].clientY;
		isDragging = true;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;
		
		const currentY = event.touches[0].clientY;
		const deltaY = currentY - startY;
		
		// Pull to refresh threshold
		if (deltaY > 100) {
			handlePullRefresh();
			isDragging = false;
		}
	}

	function handleTouchEnd() {
		isDragging = false;
	}

	async function handlePullRefresh() {
		await loadInitialEvents();
	}

	function switchMode(mode: 'explore' | 'publish' | 'messages') {
		currentMode = mode;
	}
</script>

<!-- Mobile Terminal Interface -->
<div 
	class="nostr-terminal"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<!-- Status Bar -->
	<div class="status-bar">
		<div class="status-left">
			<div class="connection-indicator {connectionStatus.isConnected ? 'connected' : 'disconnected'}">
				<span class="dot"></span>
				{connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
			</div>
			<div class="events-count">
				{events.length} events
			</div>
		</div>
		<div class="status-right">
			<button class="user-menu" onclick={onShowKeys} aria-label="User settings">
				<span class="user-avatar">
					{authState.publicKey?.substring(0, 2).toUpperCase()}
				</span>
			</button>
			<button class="logout-btn" onclick={onLogout} aria-label="Logout">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path d="m9 21 7-7-7-7"/>
					<path d="M4 3h7v18H4z"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Mode Switcher -->
	<div class="mode-switcher">
		<button 
			class="mode-btn {currentMode === 'explore' ? 'active' : ''}"
			onclick={() => switchMode('explore')}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<circle cx="11" cy="11" r="8"/>
				<path d="m21 21-4.35-4.35"/>
			</svg>
			Explore
		</button>
		<button 
			class="mode-btn {currentMode === 'messages' ? 'active' : ''}"
			onclick={() => switchMode('messages')}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
			</svg>
			Messages
		</button>
		<button 
			class="mode-btn {currentMode === 'publish' ? 'active' : ''}"
			onclick={() => switchMode('publish')}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M12 20h9"/>
				<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
			</svg>
			Publish
		</button>
	</div>

	<!-- Main Content Area -->
	<div class="main-content">
		{#if currentMode === 'explore'}
			<!-- Query Builder -->
			<QueryBuilder 
				{currentQuery}
				onUpdate={handleQueryUpdate}
			/>

			<!-- Event Stream -->
			<div class="event-stream">
				{#if isLoading}
					<div class="loading-indicator">
						<div class="spinner"></div>
						<span>Loading events...</span>
					</div>
				{:else if events.length === 0}
					<div class="empty-state">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<circle cx="11" cy="11" r="8"/>
							<path d="m21 21-4.35-4.35"/>
						</svg>
						<h3>No events found</h3>
						<p>Try adjusting your query filters</p>
					</div>
				{:else}
					{#each events as event (event.id)}
						<EventCard {event} />
					{/each}
				{/if}
			</div>
		{:else if currentMode === 'messages'}
			<!-- DM Chat Interface -->
			<DMChat {authState} />
		{:else}
			<!-- Publish Interface -->
			<PublishCard {nostr} />
		{/if}
	</div>
</div>

<style>
	.nostr-terminal {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
		color: #ffffff;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	/* Status Bar */
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.status-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.connection-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.connection-indicator.connected {
		color: #10b981;
	}

	.connection-indicator.disconnected {
		color: #ef4444;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.events-count {
		font-size: 0.875rem;
		color: #94a3b8;
		font-family: 'SF Mono', monospace;
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
	}

	.user-menu, .logout-btn {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.user-menu:hover, .logout-btn:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.1);
	}

	/* Mode Switcher */
	.mode-switcher {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		padding: 1rem 1.5rem;
		gap: 0.5rem;
	}

	.mode-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		color: #94a3b8;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.mode-btn.active {
		background: rgba(99, 102, 241, 0.2);
		border-color: #6366f1;
		color: #ffffff;
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
	}

	.mode-btn:not(.active):hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	/* Main Content */
	.main-content {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem 2rem;
	}

	.event-stream {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	/* Loading & Empty States */
	.loading-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		gap: 1rem;
		color: #94a3b8;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top: 3px solid #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #94a3b8;
	}

	.empty-state svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		color: #ffffff;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.status-bar {
			padding: 0.75rem 1rem;
		}

		.mode-switcher {
			padding: 0.75rem 1rem;
		}

		.main-content {
			padding: 0 1rem 1.5rem;
		}
	}

	/* Touch Optimizations */
	@media (hover: none) and (pointer: coarse) {
		.mode-btn {
			padding: 1rem 1.5rem;
		}
		
		.user-menu, .logout-btn {
			padding: 0.75rem;
		}
	}
</style>