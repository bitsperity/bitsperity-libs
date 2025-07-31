<!--
  Professional Nostr Event Publisher
  Matches app design and actually works
-->

<script lang="ts">
	import { createContextLogger } from '../../utils/Logger.js';
	import Button from '../ui/Button.svelte';
	import type { PublishResult } from 'nostr-unchained';

	// Props
	interface Props {
		nostr?: any; // NostrUnchained instance
	}
	
	let { nostr }: Props = $props();

	// Event state
	let kind = $state(1);
	let content = $state('');
	let tagsJson = $state('[]');
	let timestamp = $state<number | null>(null);
	
	// UI state
	let mode: 'builder' | 'json' = $state('builder');
	let jsonInput = $state('');
	let isPublishing = $state(false);
	let result = $state<PublishResult | null>(null);
	let error = $state<string | null>(null);

	const logger = createContextLogger('PublishCard');

	// Parse tags
	let tags = $derived(() => {
		try {
			const parsed = JSON.parse(tagsJson);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	});

	// Generate event object
	let eventObject = $derived({
		kind,
		content,
		tags: tags(),
		...(timestamp && { created_at: timestamp })
	});

	// Sync JSON mode
	$effect(() => {
		if (mode === 'json') {
			jsonInput = JSON.stringify(eventObject, null, 2);
		}
	});

	async function publish() {
		if (!nostr) {
			error = 'NostrUnchained instance not available';
			return;
		}

		isPublishing = true;
		error = null;
		result = null;

		try {
			let data;

			if (mode === 'json') {
				try {
					data = JSON.parse(jsonInput);
				} catch {
					throw new Error('Invalid JSON');
				}
			} else {
				data = eventObject;
			}

			// Validate
			if (typeof data.kind !== 'number') throw new Error('Kind must be number');
			if (typeof data.content !== 'string') throw new Error('Content must be string');
			if (!Array.isArray(data.tags)) throw new Error('Tags must be array');

			// Publish using FluentEventBuilder from the passed NostrUnchained instance
			const builder = nostr.events.create()
				.kind(data.kind)
				.content(data.content);

			if (data.created_at) {
				builder.timestamp(data.created_at);
			}

			for (const tag of data.tags) {
				if (Array.isArray(tag) && tag.length > 0) {
					builder.tag(tag[0], ...tag.slice(1));
				}
			}

			result = await builder.publish();

			if (result?.success) {
				logger.info('Published', { kind: data.kind, eventId: result.eventId });
				if (mode === 'builder') {
					content = '';
					tagsJson = '[]';
					timestamp = null;
				}
			} else {
				error = result?.error?.message || 'Failed to publish';
			}

		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			isPublishing = false;
		}
	}

	function loadFromJson() {
		try {
			const parsed = JSON.parse(jsonInput);
			kind = parsed.kind || 1;
			content = parsed.content || '';
			tagsJson = JSON.stringify(parsed.tags || [], null, 2);
			timestamp = parsed.created_at || null;
			mode = 'builder';
		} catch {
			error = 'Invalid JSON';
		}
	}

	function setNow() {
		timestamp = Math.floor(Date.now() / 1000);
	}
</script>

<div class="publish-card">
	<!-- Mode Toggle -->
	<div class="mode-tabs">
		<button 
			type="button"
			class="tab"
			class:active={mode === 'builder'}
			onclick={() => mode = 'builder'}
		>
			📝 Builder
		</button>
		<button 
			type="button"
			class="tab"
			class:active={mode === 'json'}
			onclick={() => mode = 'json'}
		>
			📄 JSON
		</button>
	</div>

	{#if mode === 'builder'}
		<!-- Builder Mode -->
		<div class="form">
			<div class="field">
				<label>Kind</label>
				<input type="number" bind:value={kind} min="0" max="65535" />
				<small>0-65535 (1=note, 0=profile, 7=reaction)</small>
			</div>

			<div class="field">
				<label>Content</label>
				<textarea bind:value={content} rows="4" placeholder="Event content..."></textarea>
			</div>

			<div class="field">
				<label>Tags (JSON)</label>
				<textarea 
					bind:value={tagsJson} 
					rows="3" 
					class="mono"
					placeholder='[["e", "event-id"], ["p", "pubkey"]]'
				></textarea>
				<small>Array of arrays: [["key", "value1", "value2"]]</small>
			</div>

			<div class="field">
				<label>Timestamp (optional)</label>
				<div class="timestamp-row">
					<input type="number" bind:value={timestamp} placeholder="Unix timestamp" />
					<button type="button" class="now-btn" onclick={setNow}>Now</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- JSON Mode -->
		<div class="form">
			<div class="field">
				<label>Event JSON</label>
				<textarea 
					bind:value={jsonInput} 
					rows="10"
					class="mono"
					placeholder="Paste event JSON..."
				></textarea>
			</div>
			<button type="button" class="load-btn" onclick={loadFromJson}>
				Load to Builder
			</button>
		</div>
	{/if}

	<!-- Preview -->
	<div class="preview">
		<h3>Preview</h3>
		<pre class="preview-json">{JSON.stringify(eventObject, null, 2)}</pre>
	</div>

	<!-- Publish Button -->
	<div class="actions">
		<Button
			type="button"
			variant="primary"
			onclick={publish}
			disabled={isPublishing}
			fullWidth
		>
			{isPublishing ? 'Publishing...' : `Publish Event (kind ${kind})`}
		</Button>
	</div>

	<!-- Result -->
	{#if result?.success}
		<div class="result success">
			✅ Published! Event ID: <code>{result.eventId?.slice(0, 16)}...</code>
		</div>
	{/if}

	{#if error}
		<div class="result error">
			❌ {error}
		</div>
	{/if}
</div>

<style>
	.publish-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
		margin: 0 auto;
		max-width: 700px;
	}


	.mode-tabs {
		display: flex;
		background: var(--color-background);
		border-radius: var(--radius-md);
		padding: 4px;
		margin-bottom: var(--spacing-lg);
		gap: 4px;
	}

	.tab {
		flex: 1;
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: var(--shadow-sm);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.field label {
		font-weight: 600;
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.field input,
	.field textarea {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-family: inherit;
		font-size: var(--text-base);
		transition: border-color var(--transition-fast);
	}

	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}

	.field small {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.mono {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}

	.timestamp-row {
		display: flex;
		gap: var(--spacing-sm);
	}

	.now-btn {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
		font-size: var(--text-sm);
		white-space: nowrap;
	}

	.now-btn:hover {
		background: var(--color-surface);
	}

	.load-btn {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
		align-self: flex-start;
	}

	.load-btn:hover {
		background: var(--color-surface);
	}

	.preview {
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.preview h3 {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.preview-json {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0;
		overflow-x: auto;
		line-height: 1.5;
	}

	.actions {
		margin-bottom: var(--spacing-lg);
	}

	.result {
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		margin-top: var(--spacing-md);
	}

	.result.success {
		background: rgba(34, 197, 94, 0.1);
		color: rgb(34, 197, 94);
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.result.error {
		background: rgba(239, 68, 68, 0.1);
		color: rgb(239, 68, 68);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.result code {
		font-family: var(--font-mono);
		background: rgba(0, 0, 0, 0.1);
		padding: 2px 4px;
		border-radius: 3px;
	}

	@media (max-width: 768px) {
		.publish-card {
			margin: var(--spacing-md);
			padding: var(--spacing-lg);
		}

		.timestamp-row {
			flex-direction: column;
		}
	}
</style>