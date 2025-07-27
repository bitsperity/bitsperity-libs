<!--
  Publish Terminal Component
  
  Interactive demo for nostr-unchained publish functionality
  Real publishing to ws://umbrel.local:4848 with live feedback
-->

<script lang="ts">
	import { getService } from '../../services/ServiceContainer.js';
	import { createContextLogger } from '../../utils/Logger.js';
	import Button from '../ui/Button.svelte';
	import type { NostrService } from '../../services/NostrService.js';
	import type { PublishResult } from 'nostr-unchained';

	// =============================================================================
	// Component State
	// =============================================================================

	let content = $state('Hello from Nostr Unchained! 🚀');
	let isPublishing = $state(false);
	let publishResult = $state<PublishResult | null>(null);
	let error = $state<string | null>(null);
	let publishHistory = $state<Array<{
		content: string;
		result: PublishResult;
		timestamp: number;
	}>>([]);

	const logger = createContextLogger('PublishTerminal');

	// =============================================================================
	// Publishing Logic
	// =============================================================================

	async function publishNote(): Promise<void> {
		if (!content.trim()) {
			error = 'Content cannot be empty';
			return;
		}

		isPublishing = true;
		error = null;
		publishResult = null;

		try {
			const nostrService = await getService<NostrService>('nostr');
			logger.info('Publishing note...', { content: content.substring(0, 50) });

			const result = await nostrService.publish(content);
			
			publishResult = result;
			
			if (result.success) {
				// Add to history
				publishHistory.unshift({
					content,
					result,
					timestamp: Date.now()
				});

				// Keep only last 10 items
				if (publishHistory.length > 10) {
					publishHistory = publishHistory.slice(0, 10);
				}

				logger.info('Note published successfully', { 
					eventId: result.eventId,
					relays: result.relays?.length 
				});
				
				// Clear content after successful publish
				content = '';
			} else {
				error = result.error?.message || 'Failed to publish note';
				logger.error('Publish failed', { error });
			}

		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';
			error = errorMsg;
			logger.error('Publish error', { error: err });
		} finally {
			isPublishing = false;
		}
	}

	function clearHistory(): void {
		publishHistory = [];
		publishResult = null;
		error = null;
	}

	// =============================================================================
	// Helper Functions
	// =============================================================================

	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString();
	}

	function formatEventId(eventId?: string): string {
		if (!eventId) return 'N/A';
		return `${eventId.substring(0, 8)}...${eventId.substring(-8)}`;
	}
</script>

<!--
  Template
  
  Interactive publishing interface with real-time feedback
-->
<div class="publish-terminal">
	<div class="terminal-header">
		<h3>📝 Publishing Terminal</h3>
		<p>Test <code>nostr.publish()</code> with real relay connection</p>
	</div>

	<div class="publish-form">
		<div class="content-input">
			<label for="note-content">Note Content:</label>
			<textarea 
				id="note-content"
				bind:value={content}
				placeholder="What's on your mind? Test nostr-unchained publishing..."
				rows="4"
				disabled={isPublishing}
			></textarea>
		</div>

		<div class="publish-actions">
			<Button 
				variant="primary" 
				onclick={publishNote} 
				disabled={isPublishing || !content.trim()}
			>
				{#if isPublishing}
					🔄 Publishing...
				{:else}
					📤 Publish to Relay
				{/if}
			</Button>

			{#if publishHistory.length > 0}
				<Button variant="ghost" onclick={clearHistory}>
					🗑️ Clear History
				</Button>
			{/if}
		</div>
	</div>

	<!-- Live Result Display -->
	{#if error}
		<div class="result-panel error">
			<h4>❌ Publish Failed</h4>
			<pre>{error}</pre>
		</div>
	{/if}

	{#if publishResult && publishResult.success}
		<div class="result-panel success">
			<h4>✅ Published Successfully</h4>
			<div class="result-details">
				<div class="detail-item">
					<span class="label">Event ID:</span>
					<code>{formatEventId(publishResult.eventId)}</code>
				</div>
				<div class="detail-item">
					<span class="label">Relays:</span>
					<span>{publishResult.relays?.length || 0} connected</span>
				</div>
				{#if publishResult.relays}
					<div class="relay-status">
						{#each publishResult.relays as relay}
							<div class="relay-item">
								<span class="relay-url">{relay.url}</span>
								<span class="relay-result {relay.success ? 'success' : 'error'}">
									{relay.success ? '✅' : '❌'}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Publish History -->
	{#if publishHistory.length > 0}
		<div class="history-panel">
			<h4>📚 Recent Publications</h4>
			<div class="history-list">
				{#each publishHistory as item}
					<div class="history-item">
						<div class="history-header">
							<span class="timestamp">{formatTimestamp(item.timestamp)}</span>
							<code class="event-id">{formatEventId(item.result.eventId)}</code>
						</div>
						<div class="history-content">
							{item.content.substring(0, 100)}{item.content.length > 100 ? '...' : ''}
						</div>
						<div class="history-relays">
							{item.result.relays?.length || 0} relays
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Developer Info -->
	<div class="dev-info">
		<h4>🔧 Developer Info</h4>
		<div class="code-example">
			<pre><code>// nostr-unchained usage:
const nostr = new NostrUnchained();
const result = await nostr.publish("{content}");
console.log(result.eventId, result.relays);</code></pre>
		</div>
	</div>
</div>

<style>
	.publish-terminal {
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

	.publish-form {
		margin-bottom: var(--spacing-lg);
	}

	.content-input {
		margin-bottom: var(--spacing-md);
	}

	.content-input label {
		display: block;
		margin-bottom: var(--spacing-sm);
		font-weight: 500;
		color: var(--color-text);
	}

	.content-input textarea {
		width: 100%;
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		line-height: var(--leading-normal);
		resize: vertical;
		transition: border-color var(--transition-fast);
	}

	.content-input textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.content-input textarea:disabled {
		background: var(--color-surface);
		color: var(--color-text-light);
		cursor: not-allowed;
	}

	.publish-actions {
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
		color: var(--color-text);
	}

	.result-panel.error {
		background: rgba(229, 62, 62, 0.1);
		border-color: rgba(229, 62, 62, 0.3);
		color: var(--color-text);
	}

	.result-panel h4 {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: var(--text-base);
	}

	.result-panel pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		overflow-x: auto;
	}

	.result-details {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-item .label {
		font-weight: 500;
		color: var(--color-text);
	}

	.detail-item code {
		font-family: var(--font-mono);
		background: var(--color-background);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-size: 0.85em;
	}

	.relay-status {
		margin-top: var(--spacing-sm);
	}

	.relay-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xs) 0;
		font-size: var(--text-sm);
	}

	.relay-url {
		font-family: var(--font-mono);
		color: var(--color-text-muted);
	}

	.relay-result.success {
		color: rgb(72, 187, 120);
	}

	.relay-result.error {
		color: rgb(229, 62, 62);
	}

	.history-panel {
		margin-bottom: var(--spacing-lg);
	}

	.history-panel h4 {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		max-height: 300px;
		overflow-y: auto;
	}

	.history-item {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		font-size: var(--text-sm);
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.timestamp {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.event-id {
		font-family: var(--font-mono);
		background: var(--color-surface);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		font-size: 0.75em;
	}

	.history-content {
		color: var(--color-text);
		line-height: var(--leading-tight);
		margin-bottom: var(--spacing-xs);
	}

	.history-relays {
		color: var(--color-text-light);
		font-size: var(--text-xs);
	}

	.dev-info {
		border-top: 1px solid var(--color-border-light);
		padding-top: var(--spacing-md);
	}

	.dev-info h4 {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.code-example {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.code-example pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		overflow-x: auto;
	}

	@media (max-width: 768px) {
		.publish-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.detail-item {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.history-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}
	}
</style>