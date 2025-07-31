<!--
  Developer-First Nostr Explorer
  
  Clean, powerful explorer built for developers.
  Direct nostr-unchained API exposure with excellent DX.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { createContextLogger } from '../../utils/Logger.js';
	import EventCard from './EventCard.svelte';
	
	let { nostr }: { nostr: any } = $props();
	
	// =============================================================================
	// STATE: Clean and Simple
	// =============================================================================
	
	let events = $state<any[]>([]);
	let isLoading = $state(false);
	let eventCount = $state(0);
	let queryTime = $state<number | null>(null);
	let showRawJson = $state(false);
	
	// Filter state - completely agnostic
	let kindsInput = $state('1'); // Free text input for any kinds
	let selectedKinds = $state<number[]>([1]);
	let authorInput = $state('');
	let selectedAuthors = $state<string[]>([]);
	let tagType = $state('t'); // Any tag type
	let tagInput = $state('');
	let selectedTags = $state<string[]>([]);
	let customTagType = $state(''); // For completely custom tag types
	let limit = $state(20);
	let since = $state('');
	let until = $state('');
	
	// Explicit subscription/query state
	let liveSubscription = $state<any>(null);
	let isSubscribing = $state(false);
	let cacheQuery = $state<any>(null);
	let isQueryingCache = $state(false);
	
	const logger = createContextLogger('DevExplorer');
	
	// =============================================================================
	// QUICK FILTER PRESETS: Developer-Friendly
	// =============================================================================
	
	const quickKinds = [
		{ kind: 0, label: 'Profiles', icon: '👤', color: 'rgb(16, 185, 129)' },
		{ kind: 1, label: 'Notes', icon: '💬', color: 'rgb(99, 102, 241)' },
		{ kind: 3, label: 'Contacts', icon: '👥', color: 'rgb(245, 158, 11)' },
		{ kind: 4, label: 'DMs', icon: '🔒', color: 'rgb(239, 68, 68)' },
		{ kind: 6, label: 'Reposts', icon: '🔄', color: 'rgb(139, 92, 246)' },
		{ kind: 7, label: 'Reactions', icon: '❤️', color: 'rgb(236, 72, 153)' },
	];
	
	const popularTags = [
		'nostr', 'bitcoin', 'lightning', 'freedom', 'decentralized', 'privacy'
	];
	
	// =============================================================================
	// CORE FUNCTIONALITY: Direct nostr-unchained API
	// =============================================================================
	
	// =============================================================================
	// EXPLICIT SUBSCRIPTION: Start filling cache from relays
	// =============================================================================
	
	async function startSubscription() {
		if (!nostr || isSubscribing) return;
		
		isSubscribing = true;
		
		try {
			// Parse kinds from input
			parseKindsInput();
			
			// 🚀 EXPLICIT SUB: Start filling cache
			let subBuilder = nostr.sub();
			
			// Apply current filters
			if (selectedKinds.length > 0) {
				subBuilder = subBuilder.kinds(selectedKinds);
			}
			
			if (selectedAuthors.length > 0) {
				subBuilder = subBuilder.authors(selectedAuthors);
			}
			
			if (selectedTags.length > 0) {
				const actualTagType = customTagType || tagType;
				subBuilder = subBuilder.tags(actualTagType, selectedTags);
			}
			
			// Execute subscription
			liveSubscription = await subBuilder.execute();
			
			logger.info('🔴 Live subscription started - filling cache', { 
				filters: { kinds: selectedKinds, authors: selectedAuthors, tags: selectedTags }
			});
			
		} catch (error) {
			logger.error('Subscription failed', { error });
		} finally {
			isSubscribing = false;
		}
	}
	
	// =============================================================================
	// EXPLICIT CACHE QUERY: Read only from cache
	// =============================================================================
	
	async function queryCache() {
		if (!nostr || isQueryingCache) return;
		
		isQueryingCache = true;
		queryTime = null;
		const startTime = performance.now();
		
		try {
			// Parse kinds from input
			parseKindsInput();
			
			// 🚀 EXPLICIT QUERY: Only from cache
			let queryBuilder = nostr.query();
			
			// Apply current filters
			if (selectedKinds.length > 0) {
				queryBuilder = queryBuilder.kinds(selectedKinds);
			}
			
			if (selectedAuthors.length > 0) {
				queryBuilder = queryBuilder.authors(selectedAuthors);
			}
			
			if (selectedTags.length > 0) {
				const actualTagType = customTagType || tagType;
				queryBuilder = queryBuilder.tags(actualTagType, selectedTags);
			}
			
			// Execute cache query
			cacheQuery = await queryBuilder.execute();
			
			// Get immediate results from cache
			events = cacheQuery.current || [];
			eventCount = events.length;
			queryTime = performance.now() - startTime;
			
			// Subscribe to cache updates (when sub() fills cache)
			cacheQuery.subscribe(newEvents => {
				events = newEvents.sort((a, b) => b.created_at - a.created_at);
				eventCount = events.length;
			});
			
			logger.info('💾 Cache query executed', { 
				filters: { kinds: selectedKinds, authors: selectedAuthors, tags: selectedTags },
				resultCount: events.length,
				queryTime: queryTime 
			});
			
		} catch (error) {
			logger.error('Cache query failed', { error });
		} finally {
			isQueryingCache = false;
		}
	}
	
	function stopLiveSubscription() {
		if (liveSubscription) {
			// Stop the subscription if nostr-unchained supports it
			if (typeof liveSubscription.stop === 'function') {
				liveSubscription.stop();
			}
			liveSubscription = null;
			logger.info('Live subscription stopped');
		}
	}
	
	// =============================================================================
	// FILTER MANAGEMENT: Completely Agnostic
	// =============================================================================
	
	function parseKindsInput() {
		try {
			// Parse comma-separated numbers: "1,7,42" or JSON array: "[1,7,42]"
			let kindsText = kindsInput.trim();
			if (kindsText.startsWith('[') && kindsText.endsWith(']')) {
				// JSON array format
				selectedKinds = JSON.parse(kindsText);
			} else {
				// Comma-separated format
				selectedKinds = kindsText
					.split(',')
					.map(k => parseInt(k.trim()))
					.filter(k => !isNaN(k));
			}
		} catch {
			// Fallback to single number
			const single = parseInt(kindsInput);
			selectedKinds = !isNaN(single) ? [single] : [];
		}
	}
	
	function toggleKind(kind: number) {
		if (selectedKinds.includes(kind)) {
			selectedKinds = selectedKinds.filter(k => k !== kind);
		} else {
			selectedKinds = [...selectedKinds, kind];
		}
		// Update input to reflect changes
		kindsInput = selectedKinds.join(',');
	}
	
	function addAuthor() {
		if (authorInput.trim() && !selectedAuthors.includes(authorInput.trim())) {
			selectedAuthors = [...selectedAuthors, authorInput.trim()];
			authorInput = '';
		}
	}
	
	function removeAuthor(author: string) {
		selectedAuthors = selectedAuthors.filter(a => a !== author);
	}
	
	function addTag(tag?: string) {
		const tagToAdd = tag || tagInput.trim();
		if (tagToAdd && !selectedTags.includes(tagToAdd)) {
			selectedTags = [...selectedTags, tagToAdd];
			if (!tag) tagInput = '';
		}
	}
	
	function removeTag(tag: string) {
		selectedTags = selectedTags.filter(t => t !== tag);
	}
	
	function clearFilters() {
		selectedKinds = [1];
		kindsInput = '1';
		selectedAuthors = [];
		selectedTags = [];
		authorInput = '';
		tagInput = '';
		customTagType = '';
	}
	
	// =============================================================================
	// LIFECYCLE
	// =============================================================================
	
	onMount(() => {
		// Parse initial kinds input
		parseKindsInput();
		logger.info('DevExplorer initialized', { 
			initialKinds: selectedKinds,
			cacheState: 'empty - ready for subscription'
		});
	});
</script>

<!-- =============================================================================
     UI: DEVELOPER-FIRST DESIGN
     ============================================================================= -->

<div class="dev-explorer">
	<!-- HEADER: Status & Controls -->
	<div class="explorer-header">
		<div class="status-section">
			<h2 class="explorer-title">🔍 Nostr Explorer</h2>
			<div class="status-info">
				<span class="event-count">
					{eventCount} events
				</span>
				{#if queryTime}
					<span class="query-time">
						({queryTime.toFixed(1)}ms)
					</span>
				{/if}
				{#if liveSubscription}
					<span class="live-indicator">🔴 LIVE SUB</span>
				{/if}
				{#if isSubscribing}
					<span class="loading-indicator">⏳ Starting subscription...</span>
				{/if}
				{#if isQueryingCache}
					<span class="loading-indicator">⏳ Querying cache...</span>
				{/if}
			</div>
		</div>
		
		<div class="header-controls">
			<button 
				class="control-btn" 
				onclick={() => showRawJson = !showRawJson}
				class:active={showRawJson}
			>
				{showRawJson ? '📋' : '🔧'} {showRawJson ? 'Cards' : 'JSON'}
			</button>
			
			<!-- Explicit Cache Control -->
			<button 
				class="control-btn subscription-btn" 
				onclick={startSubscription}
				disabled={isSubscribing || liveSubscription}
				title="Start filling cache from relays"
			>
				{#if isSubscribing}
					⏳ Starting...
				{:else if liveSubscription}
					🔴 Live Sub Active
				{:else}
					🚀 Start Subscription
				{/if}
			</button>
			
			<button 
				class="control-btn cache-btn" 
				onclick={queryCache}
				disabled={isQueryingCache}
				title="Query events from cache"
			>
				{#if isQueryingCache}
					⏳ Querying...
				{:else}
					💾 Query Cache
				{/if}
			</button>
			
			{#if liveSubscription}
				<button 
					class="control-btn stop-btn" 
					onclick={stopLiveSubscription}
					title="Stop live subscription"
				>
					⏹️ Stop
				</button>
			{/if}
		</div>
	</div>

	<!-- FILTER PANEL: Completely Agnostic -->
	<div class="filter-panel">
		<!-- Free Kinds Input -->
		<div class="filter-section">
			<label class="filter-label">Event Kinds (comma-separated or JSON array)</label>
			<div class="input-group">
				<input
					type="text"
					bind:value={kindsInput}
					placeholder="1,7,42 or [1,7,42] or 30023"
					class="filter-input kinds-input"
					onkeydown={(e) => e.key === 'Enter' && parseKindsInput()}
				/>
				<button class="parse-btn" onclick={parseKindsInput}>Parse</button>
			</div>
			
			<!-- Quick Kind Buttons (optional helpers) -->
			<div class="quick-filters">
				{#each quickKinds as { kind, label, icon, color }}
					<button
						class="quick-filter-btn"
						class:active={selectedKinds.includes(kind)}
						style="--filter-color: {color}"
						onclick={() => toggleKind(kind)}
					>
						{icon} {label}
					</button>
				{/each}
			</div>
			
			<div class="current-selection">
				<strong>Current kinds:</strong> 
				<code>[{selectedKinds.join(', ')}]</code>
			</div>
		</div>

		<!-- Author Filters -->
		<div class="filter-section">
			<label class="filter-label">Authors</label>
			<div class="input-group">
				<input
					type="text"
					bind:value={authorInput}
					placeholder="Enter pubkey..."
					class="filter-input"
					onkeydown={(e) => e.key === 'Enter' && addAuthor()}
				/>
				<button class="add-btn" onclick={addAuthor}>Add</button>
			</div>
			{#if selectedAuthors.length > 0}
				<div class="selected-filters">
					{#each selectedAuthors as author}
						<span class="filter-tag">
							👤 {author.slice(0, 8)}...
							<button class="remove-tag" onclick={() => removeAuthor(author)}>×</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Tag Filters: Completely Free -->
		<div class="filter-section">
			<label class="filter-label">Tags (any tag type + values)</label>
			<div class="input-group">
				<input
					type="text"
					bind:value={customTagType}
					placeholder="Tag type (t, p, e, or custom)"
					class="tag-type-input"
					style="max-width: 150px;"
				/>
				<input
					type="text"
					bind:value={tagInput}
					placeholder="Tag value..."
					class="filter-input"
					onkeydown={(e) => e.key === 'Enter' && addTag()}
				/>
				<button class="add-btn" onclick={() => addTag()}>Add</button>
			</div>
			
			<!-- Quick selectors for common tag types -->
			<div class="tag-type-quick">
				<button class="tag-type-btn" onclick={() => customTagType = 't'}>
					#hashtags (t)
				</button>
				<button class="tag-type-btn" onclick={() => customTagType = 'p'}>
					@mentions (p)
				</button>
				<button class="tag-type-btn" onclick={() => customTagType = 'e'}>
					event refs (e)
				</button>
				<button class="tag-type-btn" onclick={() => customTagType = 'a'}>
					address (a)
				</button>
			</div>
			
			<!-- Popular Tags (optional helpers) -->
			{#if customTagType === 't' || !customTagType}
				<div class="quick-tags">
					{#each popularTags as tag}
						<button class="quick-tag" onclick={() => addTag(tag)}>
							#{tag}
						</button>
					{/each}
				</div>
			{/if}
			
			{#if selectedTags.length > 0}
				<div class="selected-filters">
					<strong>Active tags [{customTagType || tagType}]:</strong>
					{#each selectedTags as tag}
						<span class="filter-tag">
							{customTagType || tagType}:{tag}
							<button class="remove-tag" onclick={() => removeTag(tag)}>×</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="filter-actions">
			<button class="clear-btn" onclick={clearFilters}>Clear All</button>
			<div class="filter-info">
				<p class="filter-help">
					💡 Set your filters, then use <strong>Start Subscription</strong> to fill the cache from relays, 
					followed by <strong>Query Cache</strong> to read the cached events.
				</p>
			</div>
		</div>
	</div>

	<!-- RESULTS: Events or JSON -->
	<div class="results-section">
		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<span>Querying events...</span>
			</div>
		{:else if events.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🔍</div>
				<h3>No events found</h3>
				<p>Try adjusting your filters or check your relay connection</p>
			</div>
		{:else if showRawJson}
			<!-- Raw JSON View -->
			<div class="json-view">
				<pre class="json-content">{JSON.stringify(events, null, 2)}</pre>
			</div>
		{:else}
			<!-- Event Cards -->
			<div class="events-grid">
				{#each events as event (event.id)}
					<EventCard {event} />
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.dev-explorer {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-background);
		color: var(--color-text);
	}

	/* ===== HEADER ===== */
	.explorer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.status-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.explorer-title {
		font-size: var(--text-lg);
		font-weight: 700;
		margin: 0;
	}

	.status-info {
		display: flex;
		gap: var(--spacing-md);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.event-count {
		font-weight: 600;
		color: var(--color-primary);
	}

	.query-time {
		font-family: var(--font-mono);
	}

	.live-indicator {
		color: rgb(239, 68, 68);
		font-weight: 600;
		animation: pulse 2s infinite;
	}

	.loading-indicator {
		color: rgb(245, 158, 11);
		font-weight: 600;
		font-size: var(--text-xs);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.header-controls {
		display: flex;
		gap: var(--spacing-sm);
	}

	.control-btn {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.control-btn:hover {
		background: var(--color-surface);
		border-color: var(--color-primary);
	}

	.control-btn.active {
		background: var(--color-primary);
		color: var(--color-primary-text);
		border-color: var(--color-primary);
	}

	.subscription-btn:not(:disabled) {
		border-color: rgb(34, 197, 94);
		color: rgb(34, 197, 94);
	}

	.subscription-btn:not(:disabled):hover {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgb(34, 197, 94);
	}

	.subscription-btn:disabled {
		background: rgba(34, 197, 94, 0.2);
		color: white;
		border-color: rgb(34, 197, 94);
	}

	.cache-btn:not(:disabled) {
		border-color: rgb(99, 102, 241);
		color: rgb(99, 102, 241);
	}

	.cache-btn:not(:disabled):hover {
		background: rgba(99, 102, 241, 0.1);
		border-color: rgb(99, 102, 241);
	}

	.live-btn {
		background: rgb(239, 68, 68);
		color: white;
		border-color: rgb(239, 68, 68);
	}

	.live-btn:hover {
		background: rgb(220, 38, 38);
	}

	.stop-btn {
		background: rgb(239, 68, 68);
		color: white;
		border-color: rgb(239, 68, 68);
	}

	.stop-btn:hover {
		background: rgb(220, 38, 38);
		border-color: rgb(220, 38, 38);
	}

	/* ===== FILTER PANEL ===== */
	.filter-panel {
		padding: var(--spacing-lg);
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.filter-section {
		margin-bottom: var(--spacing-lg);
	}

	.filter-section:last-child {
		margin-bottom: 0;
	}

	.filter-label {
		display: block;
		font-weight: 600;
		font-size: var(--text-sm);
		margin-bottom: var(--spacing-sm);
		color: var(--color-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.quick-filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.quick-filter-btn {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.quick-filter-btn:hover {
		border-color: var(--filter-color);
		background: var(--color-surface);
	}

	.quick-filter-btn.active {
		background: var(--filter-color);
		border-color: var(--filter-color);
		color: white;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.input-group {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.filter-input {
		flex: 1;
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}

	.filter-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.kinds-input {
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.parse-btn {
		padding: var(--spacing-md) var(--spacing-lg);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-md);
		background: var(--color-accent);
		color: white;
		cursor: pointer;
		font-weight: 600;
		transition: all var(--transition-fast);
	}

	.parse-btn:hover {
		background: var(--color-accent-hover);
		transform: translateY(-1px);
	}

	.current-selection {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
	}

	.current-selection code {
		font-family: var(--font-mono);
		color: var(--color-primary);
		font-weight: 600;
	}

	.tag-type-input {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--text-sm);
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.tag-type-quick {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		margin: var(--spacing-sm) 0;
	}

	.tag-type-btn {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--text-xs);
		transition: all var(--transition-fast);
	}

	.tag-type-btn:hover {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.mode-toggle.active {
		background: rgb(239, 68, 68);
		color: white;
		border-color: rgb(239, 68, 68);
	}

	.add-btn {
		padding: var(--spacing-md) var(--spacing-lg);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-primary-text);
		cursor: pointer;
		font-weight: 600;
		transition: all var(--transition-fast);
	}

	.add-btn:hover {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
	}

	.quick-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-sm);
	}

	.quick-tag {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--text-xs);
		transition: all var(--transition-fast);
	}

	.quick-tag:hover {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}

	.selected-filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.filter-tag {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-primary);
		color: var(--color-primary-text);
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		font-weight: 500;
	}

	.remove-tag {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: var(--text-sm);
		padding: 0;
		margin-left: var(--spacing-xs);
	}

	.filter-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.filter-info {
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.filter-help {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.5;
	}

	.clear-btn {
		padding: var(--spacing-md) var(--spacing-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
		align-self: flex-start;
	}

	.clear-btn:hover {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.execute-btn {
		padding: var(--spacing-md) var(--spacing-xl);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-primary-text);
		cursor: pointer;
		font-weight: 600;
		transition: all var(--transition-fast);
	}

	.execute-btn:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.execute-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* ===== RESULTS ===== */
	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl);
		color: var(--color-text-muted);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top: 3px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: var(--spacing-md);
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
		padding: var(--spacing-2xl);
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: var(--spacing-lg);
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text);
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.json-view {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.json-content {
		padding: var(--spacing-lg);
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--color-text-muted);
		overflow-x: auto;
		max-height: 600px;
		overflow-y: auto;
	}

	.events-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 768px) {
		.explorer-header {
			flex-direction: column;
			gap: var(--spacing-md);
			align-items: stretch;
		}

		.quick-filters {
			gap: var(--spacing-xs);
		}

		.quick-filter-btn {
			font-size: var(--text-xs);
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.input-group {
			flex-direction: column;
		}

		.filter-actions {
			flex-direction: column;
		}
	}
</style>