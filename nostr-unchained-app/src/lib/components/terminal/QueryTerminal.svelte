<!--
  Query Terminal Component
  
  Interactive SQL-like query builder for nostr-unchained
  Live testing of query() API with real relay data
-->

<script lang="ts">
	import { getService } from '../../services/ServiceContainer.js';
	import { createContextLogger } from '../../utils/Logger.js';
	import Button from '../ui/Button.svelte';
	import type { NostrService } from '../../services/NostrService.js';

	// =============================================================================
	// Component State
	// =============================================================================

	let queryType = $state<'kind' | 'author' | 'tag' | 'time'>('kind');
	let kindValue = $state('1');
	let authorValue = $state('');
	let tagName = $state('e');
	let tagValue = $state('');
	let timeDirection = $state<'since' | 'until'>('since');
	let timeValue = $state('1 hour ago');
	let limitValue = $state('10');
	
	let isExecuting = $state(false);
	let queryResults = $state<any[]>([]);
	let error = $state<string | null>(null);
	let executionTime = $state<number | null>(null);
	let generatedQuery = $state('');

	const logger = createContextLogger('QueryTerminal');

	// =============================================================================
	// Query Building Logic
	// =============================================================================

	function buildQuery(): string {
		let queryCode = 'const events = await nostr.query()';
		
		// Add filters based on form
		if (queryType === 'kind') {
			queryCode += `\n  .kinds([${kindValue}])`;
		} else if (queryType === 'author' && authorValue.trim()) {
			queryCode += `\n  .authors(['${authorValue.trim()}'])`;
		} else if (queryType === 'tag' && tagName.trim() && tagValue.trim()) {
			queryCode += `\n  .tags('${tagName.trim()}', ['${tagValue.trim()}'])`;
		} else if (queryType === 'time' && timeValue.trim()) {
			queryCode += `\n  .${timeDirection}(${convertTimeToTimestamp(timeValue.trim())})`;
		}
		
		queryCode += `\n  .limit(${limitValue})\n  .execute();`;
		return queryCode;
	}

	$effect(() => {
		generatedQuery = buildQuery();
	});

	async function executeQuery(): Promise<void> {
		if (isExecuting) return;

		isExecuting = true;
		error = null;
		queryResults = [];
		executionTime = null;

		try {
			const nostrService = await getService<NostrService>('nostr');
			logger.info('Executing query...', { queryType, generated: generatedQuery });

			const startTime = Date.now();
			
			// Build the actual query
			let queryBuilder = nostrService.query();
			
			if (queryType === 'kind') {
				queryBuilder = queryBuilder.kinds([parseInt(kindValue)]);
			} else if (queryType === 'author' && authorValue.trim()) {
				queryBuilder = queryBuilder.authors([authorValue.trim()]);
			} else if (queryType === 'tag' && tagName.trim() && tagValue.trim()) {
				queryBuilder = queryBuilder.tags(tagName.trim(), [tagValue.trim()]);
			} else if (queryType === 'time' && timeValue.trim()) {
				if (timeDirection === 'since') {
					const timestamp = convertTimeToTimestamp(timeValue.trim());
					queryBuilder = queryBuilder.since(timestamp);
				} else {
					const timestamp = convertTimeToTimestamp(timeValue.trim());
					queryBuilder = queryBuilder.until(timestamp);
				}
			}
			
			queryBuilder = queryBuilder.limit(parseInt(limitValue));
			
			const events = await queryBuilder.execute();
			const endTime = Date.now();
			
			executionTime = endTime - startTime;
			queryResults = events || [];
			
			logger.info('Query executed successfully', { 
				resultCount: queryResults.length,
				executionTime,
				queryType
			});

		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			error = errorMsg;
			logger.error('Query execution failed', { error: err });
		} finally {
			isExecuting = false;
		}
	}

	function clearResults(): void {
		queryResults = [];
		error = null;
		executionTime = null;
	}

	// =============================================================================
	// Helper Functions
	// =============================================================================

	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleString();
	}

	function formatEventContent(content: string): string {
		return content.length > 100 ? content.substring(0, 100) + '...' : content;
	}

	function getEventKindName(kind: number): string {
		const kindMap: Record<number, string> = {
			0: 'Profile',
			1: 'Text Note',
			3: 'Contacts',
			4: 'DM',
			5: 'Delete',
			6: 'Repost',
			7: 'Reaction'
		};
		return kindMap[kind] || `Kind ${kind}`;
	}

	function convertTimeToTimestamp(timeStr: string): number {
		const now = Math.floor(Date.now() / 1000);
		
		if (timeStr.includes('hour ago')) {
			const hours = parseInt(timeStr);
			return now - (hours * 60 * 60);
		} else if (timeStr.includes('day ago')) {
			const days = parseInt(timeStr);
			return now - (days * 24 * 60 * 60);
		} else if (timeStr.includes('week ago')) {
			const weeks = parseInt(timeStr);
			return now - (weeks * 7 * 24 * 60 * 60);
		} else if (timeStr.match(/\d{4}-\d{2}-\d{2}/)) {
			return Math.floor(new Date(timeStr).getTime() / 1000);
		}
		
		return now - (60 * 60); // Default to 1 hour ago
	}
</script>

<!--
  Template
  
  Interactive query builder with live execution
-->
<div class="query-terminal">
	<div class="terminal-header">
		<h3>📊 Query Builder Terminal</h3>
		<p>Interactive SQL-like queries with <code>nostr.query()</code></p>
	</div>

	<div class="query-builder">
		<div class="builder-form">
			<div class="form-row">
				<label for="query-type">Query Type:</label>
				<select id="query-type" bind:value={queryType}>
					<option value="kind">By Event Kind</option>
					<option value="author">By Author</option>
					<option value="tag">By Tag</option>
					<option value="time">By Time Range</option>
				</select>
			</div>

			{#if queryType === 'kind'}
				<div class="form-row">
					<label for="kind-value">Kind:</label>
					<select id="kind-value" bind:value={kindValue}>
						<option value="0">0 - Profile</option>
						<option value="1">1 - Text Note</option>
						<option value="3">3 - Contacts</option>
						<option value="4">4 - DM</option>
						<option value="7">7 - Reaction</option>
					</select>
				</div>
			{:else if queryType === 'author'}
				<div class="form-row">
					<label for="author-value">Author (npub/hex):</label>
					<input 
						id="author-value"
						type="text" 
						bind:value={authorValue}
						placeholder="npub1... or hex pubkey"
					/>
				</div>
			{:else if queryType === 'tag'}
				<div class="form-row">
					<label for="tag-name">Tag Name:</label>
					<select id="tag-name" bind:value={tagName}>
						<option value="e">e - Event Reference</option>
						<option value="p">p - Pubkey Reference</option>
						<option value="t">t - Hashtag</option>
						<option value="r">r - URL Reference</option>
					</select>
				</div>
				<div class="form-row">
					<label for="tag-value">Tag Value:</label>
					<input 
						id="tag-value"
						type="text" 
						bind:value={tagValue}
						placeholder="Tag value to search for"
					/>
				</div>
			{:else if queryType === 'time'}
				<div class="form-row">
					<label for="time-direction">Direction:</label>
					<select id="time-direction" bind:value={timeDirection}>
						<option value="since">Since (after)</option>
						<option value="until">Until (before)</option>
					</select>
				</div>
				<div class="form-row">
					<label for="time-value">Time:</label>
					<select id="time-value" bind:value={timeValue}>
						<option value="1 hour ago">1 hour ago</option>
						<option value="6 hours ago">6 hours ago</option>
						<option value="1 day ago">1 day ago</option>
						<option value="1 week ago">1 week ago</option>
						<option value="2024-01-01">2024-01-01</option>
					</select>
				</div>
			{/if}

			<div class="form-row">
				<label for="limit-value">Limit:</label>
				<select id="limit-value" bind:value={limitValue}>
					<option value="5">5 events</option>
					<option value="10">10 events</option>
					<option value="20">20 events</option>
					<option value="50">50 events</option>
				</select>
			</div>
		</div>

		<div class="query-preview">
			<h4>Generated Query:</h4>
			<pre><code>{generatedQuery}</code></pre>
		</div>

		<div class="query-actions">
			<Button 
				variant="primary" 
				onclick={executeQuery} 
				disabled={isExecuting}
			>
				{#if isExecuting}
					🔄 Executing...
				{:else}
					▶️ Execute Query
				{/if}
			</Button>

			{#if queryResults.length > 0 || error}
				<Button variant="ghost" onclick={clearResults}>
					🗑️ Clear Results
				</Button>
			{/if}
		</div>
	</div>

	<!-- Results Display -->
	{#if error}
		<div class="result-panel error">
			<h4>❌ Query Failed</h4>
			<pre>{error}</pre>
		</div>
	{/if}

	{#if queryResults.length > 0}
		<div class="result-panel success">
			<h4>✅ Query Results</h4>
			<div class="result-stats">
				<span class="stat">Found: {queryResults.length} events</span>
				{#if executionTime !== null}
					<span class="stat">Time: {executionTime}ms</span>
				{/if}
			</div>
			
			<div class="results-list">
				{#each queryResults as event}
					<div class="result-item">
						<div class="result-header">
							<span class="event-kind">{getEventKindName(event.kind)}</span>
							<span class="event-time">{formatTimestamp(event.created_at)}</span>
						</div>
						<div class="result-content">
							{formatEventContent(event.content)}
						</div>
						<div class="result-meta">
							<span class="event-id">ID: {event.id.substring(0, 8)}...</span>
							<span class="event-author">By: {event.pubkey.substring(0, 16)}...</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if !isExecuting && !error}
		<div class="no-results">
			<p>🔍 Build a query and click Execute to see results</p>
		</div>
	{/if}

	<!-- Usage Examples -->
	<div class="examples-section">
		<h4>🔧 Query Examples</h4>
		<div class="examples-grid">
			<div class="example-card">
				<h5>Recent Text Notes:</h5>
				<pre><code>await nostr.query()
  .kinds([1])
  .since(1703634000)
  .limit(20)
  .execute();</code></pre>
			</div>
			<div class="example-card">
				<h5>User's Profile:</h5>
				<pre><code>await nostr.query()
  .kinds([0])
  .authors(['npub1...'])
  .limit(1)
  .execute();</code></pre>
			</div>
			<div class="example-card">
				<h5>Hashtag Posts:</h5>
				<pre><code>await nostr.query()
  .kinds([1])
  .tags('t', ['nostr'])
  .limit(50)
  .execute();</code></pre>
			</div>
		</div>
	</div>
</div>

<style>
	.query-terminal {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--color-border);
	}

	.terminal-header {
		margin-bottom: var(--spacing-lg);
	}

	.terminal-header h3 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: var(--text-lg);
	}

	.terminal-header p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.terminal-header code {
		background: var(--color-background);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 0.85em;
	}

	.query-builder {
		margin-bottom: var(--spacing-lg);
	}

	.builder-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.form-row {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.form-row label {
		font-weight: 500;
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.form-row select,
	.form-row input {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		background: var(--color-background);
		color: var(--color-text);
	}

	.form-row select:focus,
	.form-row input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.query-preview {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.query-preview h4 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.query-preview pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		overflow-x: auto;
	}

	.query-actions {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.result-panel {
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid;
	}

	.result-panel.success {
		background: rgba(72, 187, 120, 0.1);
		border-color: rgba(72, 187, 120, 0.3);
	}

	.result-panel.error {
		background: rgba(229, 62, 62, 0.1);
		border-color: rgba(229, 62, 62, 0.3);
	}

	.result-panel h4 {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: var(--text-base);
	}

	.result-stats {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
		font-size: var(--text-sm);
	}

	.stat {
		background: var(--color-background);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.results-list {
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.result-item {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		font-size: var(--text-sm);
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.event-kind {
		background: var(--color-primary);
		color: white;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 500;
	}

	.event-time {
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.result-content {
		color: var(--color-text);
		line-height: var(--leading-tight);
		margin-bottom: var(--spacing-xs);
		word-break: break-word;
	}

	.result-meta {
		display: flex;
		justify-content: space-between;
		color: var(--color-text-light);
		font-size: var(--text-xs);
		font-family: var(--font-mono);
	}

	.no-results {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--color-text-muted);
		font-style: italic;
		margin-bottom: var(--spacing-lg);
	}

	.examples-section {
		border-top: 1px solid var(--color-border-light);
		padding-top: var(--spacing-lg);
	}

	.examples-section h4 {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.examples-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-md);
	}

	.example-card {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.example-card h5 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.example-card pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		overflow-x: auto;
	}

	@media (max-width: 768px) {
		.query-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.result-stats {
			flex-direction: column;
			gap: var(--spacing-sm);
		}

		.result-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.result-meta {
			flex-direction: column;
			gap: var(--spacing-xs);
		}

		.examples-grid {
			grid-template-columns: 1fr;
		}
	}
</style>