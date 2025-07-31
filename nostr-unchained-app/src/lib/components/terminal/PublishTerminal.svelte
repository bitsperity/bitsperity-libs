<!--
  Publish Terminal Component
  
  Showcases the elegant nostr-unchained publish API
  Now with the powerful PublishCard component
-->

<script lang="ts">
	import PublishCard from './PublishCard.svelte';
	
	// Props
	interface Props {
		nostr?: any; // NostrUnchained instance
	}
	
	let { nostr }: Props = $props();
</script>

<div class="publish-terminal">
	<div class="terminal-header">
		<h3>📝 Publishing Terminal</h3>
		<p>Publish any Nostr event with the fluent <code>nostr-unchained</code> API</p>
	</div>

	<PublishCard {nostr} />
</div>

<style>
	.publish-terminal {
		width: 100%;
		max-width: none;
		padding: 0;
	}

	.terminal-header {
		margin-bottom: var(--spacing-lg);
		text-align: center;
	}

	.terminal-header h3 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: var(--text-xl);
		font-weight: 600;
	}

	.terminal-header p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-base);
	}

	.terminal-header code {
		background: var(--color-background);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 0.9em;
		color: var(--color-primary);
	}
</style>

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