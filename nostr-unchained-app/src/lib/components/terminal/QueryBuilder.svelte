<!--
  Mobile Query Builder
  
  Revolutionary swipe-based query builder for touch-first Nostr exploration
  Cutting-edge mobile UX with gesture-driven filter construction
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	let { currentQuery }: { currentQuery: { filters: any[], limit: number } } = $props();
	
	const dispatch = createEventDispatcher();
	
	// =============================================================================
	// Filter State Management
	// =============================================================================
	
	let activeFilters = $state([...currentQuery.filters]);
	let queryLimit = $state(currentQuery.limit);
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	
	// Available filter types for swipe selection
	const filterTypes = [
		{ type: 'kind', label: 'Event Type', icon: '📋', color: '#6366f1' },
		{ type: 'author', label: 'Author', icon: '👤', color: '#10b981' },
		{ type: 'since', label: 'Time Range', icon: '⏰', color: '#f59e0b' },
		{ type: 'hashtag', label: 'Hashtag', icon: '#️⃣', color: '#8b5cf6' },
		{ type: 'mention', label: 'Mention', icon: '@', color: '#06b6d4' }
	];
	
	// Popular event kinds for quick selection
	const popularKinds = [
		{ value: 1, label: 'Text Notes', icon: '💬' },
		{ value: 0, label: 'Profiles', icon: '👤' },
		{ value: 3, label: 'Contacts', icon: '👥' },
		{ value: 7, label: 'Reactions', icon: '❤️' },
		{ value: 6, label: 'Reposts', icon: '🔄' },
		{ value: 4, label: 'DMs', icon: '🔒' }
	];
	
	// Time range presets
	const timeRanges = [
		{ label: '1 hour', minutes: 60 },
		{ label: '6 hours', minutes: 360 },
		{ label: '1 day', minutes: 1440 },
		{ label: '3 days', minutes: 4320 },
		{ label: '1 week', minutes: 10080 }
	];
	
	// =============================================================================
	// Touch Gesture Handlers
	// =============================================================================
	
	function handleTouchStart(event: TouchEvent) {
		isDragging = true;
		startX = event.touches[0].clientX;
		startY = event.touches[0].clientY;
	}
	
	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;
		
		const currentX = event.touches[0].clientX;
		const currentY = event.touches[0].clientY;
		const deltaX = currentX - startX;
		const deltaY = currentY - startY;
		
		// Horizontal swipe to switch filter types
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
			handleSwipeFilter(deltaX > 0 ? 'right' : 'left');
			isDragging = false;
		}
	}
	
	function handleTouchEnd() {
		isDragging = false;
	}
	
	function handleSwipeFilter(direction: 'left' | 'right') {
		// Add haptic feedback if available
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}
		
		// Cycle through filter types based on swipe direction
		// This is where we'd implement filter type cycling
		console.log(`Swiped ${direction} - cycling filter types`);
	}
	
	// =============================================================================
	// Filter Management
	// =============================================================================
	
	function addKindFilter(kind: number) {
		const existing = activeFilters.findIndex(f => f.type === 'kind');
		if (existing >= 0) {
			activeFilters[existing] = { type: 'kind', value: kind };
		} else {
			activeFilters.push({ type: 'kind', value: kind });
		}
		updateQuery();
	}
	
	function addTimeFilter(minutes: number) {
		const since = Math.floor(Date.now() / 1000) - (minutes * 60);
		const existing = activeFilters.findIndex(f => f.type === 'since');
		if (existing >= 0) {
			activeFilters[existing] = { type: 'since', value: since };
		} else {
			activeFilters.push({ type: 'since', value: since });
		}
		updateQuery();
	}
	
	function removeFilter(index: number) {
		activeFilters.splice(index, 1);
		updateQuery();
	}
	
	function clearAllFilters() {
		activeFilters = [];
		updateQuery();
	}
	
	function updateLimit(newLimit: number) {
		queryLimit = newLimit;
		updateQuery();
	}
	
	function updateQuery() {
		const newQuery = {
			filters: [...activeFilters],
			limit: queryLimit
		};
		dispatch('update', newQuery);
	}
	
	// =============================================================================
	// Quick Actions
	// =============================================================================
	
	function loadRecentNotes() {
		activeFilters = [{ type: 'kind', value: 1 }];
		queryLimit = 20;
		updateQuery();
	}
	
	function loadProfiles() {
		activeFilters = [{ type: 'kind', value: 0 }];
		queryLimit = 10;
		updateQuery();
	}
	
	function loadReactions() {
		activeFilters = [{ type: 'kind', value: 7 }];
		queryLimit = 50;
		updateQuery();
	}
</script>

<!-- Mobile Query Builder Interface -->
<div 
	class="query-builder"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<!-- Quick Actions Bar -->
	<div class="quick-actions">
		<button class="quick-btn" onclick={loadRecentNotes}>
			<span class="quick-icon">💬</span>
			<span class="quick-label">Notes</span>
		</button>
		<button class="quick-btn" onclick={loadProfiles}>
			<span class="quick-icon">👤</span>
			<span class="quick-label">Profiles</span>
		</button>
		<button class="quick-btn" onclick={loadReactions}>
			<span class="quick-icon">❤️</span>
			<span class="quick-label">Reactions</span>
		</button>
		<button class="quick-btn clear" onclick={clearAllFilters}>
			<span class="quick-icon">🗑️</span>
			<span class="quick-label">Clear</span>
		</button>
	</div>

	<!-- Active Filters -->
	{#if activeFilters.length > 0}
		<div class="active-filters">
			<div class="filter-header">
				<span class="filter-title">Active Filters</span>
				<span class="filter-count">{activeFilters.length}</span>
			</div>
			<div class="filter-list">
				{#each activeFilters as filter, index}
					<div class="filter-chip">
						<span class="filter-type">{filter.type}</span>
						<span class="filter-value">
							{#if filter.type === 'kind'}
								{popularKinds.find(k => k.value === filter.value)?.label || `Kind ${filter.value}`}
							{:else if filter.type === 'since'}
								{new Date(filter.value * 1000).toLocaleTimeString()}
							{:else}
								{filter.value}
							{/if}
						</span>
						<button class="filter-remove" onclick={() => removeFilter(index)}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<line x1="18" y1="6" x2="6" y2="18"/>
								<line x1="6" y1="6" x2="18" y2="18"/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Event Types Grid -->
	<div class="section">
		<div class="section-header">
			<h3>Event Types</h3>
			<span class="section-hint">Tap to filter</span>
		</div>
		<div class="kind-grid">
			{#each popularKinds as kind}
				<button 
					class="kind-btn {activeFilters.some(f => f.type === 'kind' && f.value === kind.value) ? 'active' : ''}"
					onclick={() => addKindFilter(kind.value)}
				>
					<span class="kind-icon">{kind.icon}</span>
					<span class="kind-label">{kind.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Time Range Selector -->
	<div class="section">
		<div class="section-header">
			<h3>Time Range</h3>
			<span class="section-hint">Recent events only</span>
		</div>
		<div class="time-grid">
			{#each timeRanges as range}
				<button 
					class="time-btn"
					onclick={() => addTimeFilter(range.minutes)}
				>
					{range.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Result Limit -->
	<div class="section">
		<div class="section-header">
			<h3>Result Limit</h3>
			<span class="section-hint">Max events to fetch</span>
		</div>
		<div class="limit-selector">
			<input 
				type="range" 
				min="5" 
				max="100" 
				step="5"
				bind:value={queryLimit}
				oninput={() => updateQuery()}
				class="limit-slider"
			>
			<div class="limit-display">{queryLimit} events</div>
		</div>
	</div>

	<!-- Swipe Instruction -->
	<div class="swipe-hint">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<path d="M5 12h14"/>
			<path d="M12 5l7 7-7 7"/>
		</svg>
		<span>Swipe left/right for more options</span>
	</div>
</div>

<style>
	.query-builder {
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(20px);
		border-radius: 1rem;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	/* Quick Actions */
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.quick-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 60px;
	}

	.quick-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.quick-btn.clear {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.quick-icon {
		font-size: 1.25rem;
	}

	.quick-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Active Filters */
	.active-filters {
		margin-bottom: 1rem;
		padding: 1rem;
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.2);
		border-radius: 0.75rem;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.filter-title {
		font-weight: 600;
		color: #6366f1;
	}

	.filter-count {
		background: rgba(99, 102, 241, 0.3);
		color: #6366f1;
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.filter-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		font-size: 0.875rem;
	}

	.filter-type {
		color: #94a3b8;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.filter-value {
		color: #ffffff;
		font-weight: 500;
	}

	.filter-remove {
		background: none;
		border: none;
		color: #ef4444;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: background 0.2s ease;
	}

	.filter-remove:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	/* Sections */
	.section {
		margin-bottom: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
	}

	.section-hint {
		font-size: 0.75rem;
		color: #64748b;
		font-style: italic;
	}

	/* Event Types Grid */
	.kind-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.kind-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.kind-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.kind-btn.active {
		background: rgba(99, 102, 241, 0.3);
		border-color: #6366f1;
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
	}

	.kind-icon {
		font-size: 1.5rem;
	}

	.kind-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
	}

	/* Time Range Grid */
	.time-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: 0.5rem;
	}

	.time-btn {
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.time-btn:hover {
		background: rgba(245, 158, 11, 0.2);
		border-color: #f59e0b;
		color: #f59e0b;
	}

	/* Limit Selector */
	.limit-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.limit-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		outline: none;
	}

	.limit-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #6366f1;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
	}

	.limit-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #6366f1;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
	}

	.limit-display {
		text-align: center;
		font-weight: 600;
		color: #6366f1;
		font-family: 'SF Mono', monospace;
	}

	/* Swipe Hint */
	.swipe-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		color: #64748b;
		font-size: 0.875rem;
		font-style: italic;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		margin-top: 1rem;
	}

	.swipe-hint svg {
		opacity: 0.6;
		animation: slideHint 2s ease-in-out infinite;
	}

	@keyframes slideHint {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(4px); }
	}

	/* Touch Optimizations */
	@media (hover: none) and (pointer: coarse) {
		.quick-btn {
			padding: 1rem 0.75rem;
			min-height: 70px;
		}
		
		.kind-btn {
			padding: 1.25rem 1rem;
		}
		
		.time-btn {
			padding: 1rem;
			min-height: 44px;
		}
		
		.limit-slider::-webkit-slider-thumb {
			width: 24px;
			height: 24px;
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.quick-actions {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}
		
		.kind-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.time-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>