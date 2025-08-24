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

	// NIP-36 Content Warning
	let contentWarningEnabled = $state(false);
	let contentWarningReason = $state('');

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

			// Apply content warning if enabled (NIP-36)
			try {
				if (contentWarningEnabled) {
					if (typeof builder.contentWarning === 'function') {
						builder.contentWarning(contentWarningReason?.trim() ? contentWarningReason.trim() : undefined);
					} else {
						// Fallback: add tag directly
						if (contentWarningReason?.trim()) builder.tag('content-warning', contentWarningReason.trim());
						else builder.tag('content-warning');
					}
				}
			} catch {}

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
					contentWarningEnabled = false;
					contentWarningReason = '';
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
	<!-- Header -->
	<div class="card-header">
		<h2 class="card-title">Publish Event</h2>
		<div class="mode-toggle">
			<button 
				type="button"
				class="mode-btn"
				class:active={mode === 'builder'}
				onclick={() => mode = 'builder'}
			>
				Builder
			</button>
			<button 
				type="button"
				class="mode-btn"
				class:active={mode === 'json'}
				onclick={() => mode = 'json'}
			>
				JSON
			</button>
		</div>
	</div>

	<div class="card-content">
		{#if mode === 'builder'}
			<!-- Builder Mode -->
			<div class="form-grid">
				<div class="form-row">
					<div class="field">
						<label>Event Type</label>
						<div class="input-group">
							<input type="number" bind:value={kind} min="0" max="65535" class="kind-input" />
							<span class="input-help">1=note, 0=profile, 7=reaction</span>
						</div>
					</div>
				</div>

				<div class="field">
					<label>Content</label>
					<textarea 
						bind:value={content} 
						rows="4" 
						placeholder="What's happening?"
						class="content-input"
					></textarea>
				</div>

				<div class="field">
					<label>Tags</label>
					<textarea 
						bind:value={tagsJson} 
						rows="3" 
						class="tags-input"
						placeholder='[["e", "event-id"], ["p", "pubkey"]]'
					></textarea>
					<small class="field-help">JSON array format: [["key", "value1", "value2"]]</small>
				</div>

				<!-- NIP-36 Content Warning -->
				<div class="field">
					<label>Content Warning (NIP‑36)</label>
					<div class="cw-row">
						<label class="switch">
							<input type="checkbox" bind:checked={contentWarningEnabled} />
							<span>Enable</span>
						</label>
						<input 
							type="text" 
							placeholder="Reason (optional)"
							class="cw-reason"
							bind:value={contentWarningReason}
							disabled={!contentWarningEnabled}
						/>
					</div>
					<small class="field-help">Adds a content-warning tag and optional reason</small>
				</div>

				<div class="field">
					<label>Timestamp</label>
					<div class="timestamp-group">
						<input 
							type="number" 
							bind:value={timestamp} 
							placeholder="Unix timestamp (optional)"
							class="timestamp-input"
						/>
						<button type="button" class="timestamp-btn" onclick={setNow}>
							Use Now
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- JSON Mode -->
			<div class="json-editor">
				<div class="field">
					<label>Event JSON</label>
					<textarea 
						bind:value={jsonInput} 
						rows="12"
						class="json-input"
						placeholder="Paste or edit event JSON..."
					></textarea>
				</div>
				<button type="button" class="load-json-btn" onclick={loadFromJson}>
					↩️ Load to Builder
				</button>
			</div>
		{/if}

		<!-- Live Preview -->
		{#if mode === 'builder'}
			<div class="preview-section">
				<div class="preview-header">
					<h3>Live Preview</h3>
					<span class="preview-badge">JSON</span>
				</div>
				<pre class="preview-content">{JSON.stringify(eventObject, null, 2)}</pre>
			</div>
		{/if}
	</div>

	<!-- Actions -->
	<div class="card-actions">
		<Button
			type="button"
			variant="primary"
			onclick={publish}
			disabled={isPublishing}
			fullWidth
		>
			{isPublishing ? '⏳ Publishing...' : `🚀 Publish Event (kind ${kind})`}
		</Button>
	</div>

	<!-- Status Messages -->
	{#if result?.success}
		<div class="status-message success">
			<div class="status-icon">✅</div>
			<div class="status-text">
				<strong>Published successfully!</strong>
				<code class="event-id">{result.eventId?.slice(0, 16)}...</code>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="status-message error">
			<div class="status-icon">❌</div>
			<div class="status-text">
				<strong>Publishing failed</strong>
				<span>{error}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	/* ===== MAIN CARD ===== */
	.publish-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 0;
		margin: 0 auto;
		max-width: 720px;
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	/* ===== HEADER ===== */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border-light);
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
	}

	.card-title {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
		letter-spacing: -0.025em;
	}

	.mode-toggle {
		display: flex;
		background: var(--color-background);
		border-radius: var(--radius-lg);
		padding: 3px;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.mode-btn {
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		border-radius: calc(var(--radius-lg) - 3px);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-weight: 500;
		font-size: var(--text-sm);
		min-width: 70px;
	}

	.mode-btn:hover {
		color: var(--color-text);
		background: rgba(102, 126, 234, 0.05);
	}

	.mode-btn.active {
		background: var(--color-primary);
		color: white;
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}

	/* ===== CONTENT ===== */
	.card-content {
		padding: var(--spacing-xl);
	}

	/* ===== BUILDER FORM ===== */
	.form-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.form-row {
		display: flex;
		gap: var(--spacing-lg);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		flex: 1;
	}

	.field label {
		font-weight: 600;
		color: var(--color-text);
		font-size: var(--text-sm);
		letter-spacing: 0.025em;
		text-transform: uppercase;
		margin-bottom: var(--spacing-xs);
	}

	/* ===== INPUT STYLES ===== */
	.input-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.kind-input {
		width: 120px;
		padding: var(--spacing-md);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: var(--text-base);
		transition: all var(--transition-fast);
	}

	.content-input,
	.tags-input,
	.timestamp-input,
	.json-input {
		padding: var(--spacing-md);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-family: inherit;
		font-size: var(--text-base);
		transition: all var(--transition-fast);
		resize: vertical;
	}

	.content-input {
		min-height: 100px;
		line-height: 1.6;
	}

	.tags-input,
	.json-input {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.json-input {
		min-height: 300px;
	}

	.kind-input:focus,
	.content-input:focus,
	.tags-input:focus,
	.timestamp-input:focus,
	.json-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
		transform: translateY(-1px);
	}

	.input-help {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		background: var(--color-background);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-light);
	}

	.field-help {
		color: var(--color-text-light);
		font-size: var(--text-xs);
		margin-top: var(--spacing-xs);
	}

	/* ===== TIMESTAMP GROUP ===== */
	.timestamp-group {
		display: flex;
		gap: var(--spacing-sm);
	}

	.timestamp-input {
		flex: 1;
		font-family: var(--font-mono);
	}

	.timestamp-btn {
		padding: var(--spacing-md) var(--spacing-lg);
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-primary);
		cursor: pointer;
		font-weight: 600;
		font-size: var(--text-sm);
		white-space: nowrap;
		transition: all var(--transition-fast);
	}

	.timestamp-btn:hover {
		background: var(--color-primary);
		color: white;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	/* ===== JSON EDITOR ===== */
	.json-editor {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.load-json-btn {
		padding: var(--spacing-md) var(--spacing-lg);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-accent);
		cursor: pointer;
		font-weight: 600;
		font-size: var(--text-sm);
		align-self: flex-start;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.load-json-btn:hover {
		background: var(--color-accent);
		color: white;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	/* ===== PREVIEW SECTION ===== */
	.preview-section {
		margin-top: var(--spacing-xl);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
		border-bottom: 1px solid var(--color-border);
	}

	.preview-header h3 {
		margin: 0;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.preview-badge {
		font-size: var(--text-xs);
		font-weight: 600;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-content {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin: 0;
		padding: var(--spacing-lg);
		overflow-x: auto;
		line-height: 1.6;
		background: var(--color-background);
	}

	/* ===== ACTIONS ===== */
	.card-actions {
		padding: 0 var(--spacing-xl) var(--spacing-xl);
	}

	/* ===== STATUS MESSAGES ===== */
	.status-message {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		margin: var(--spacing-lg) var(--spacing-xl) 0;
		border-radius: var(--radius-lg);
		font-size: var(--text-sm);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.status-message.success {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: rgb(21, 128, 61);
	}

	.status-message.error {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: rgb(185, 28, 28);
	}

	.status-icon {
		flex-shrink: 0;
		font-size: var(--text-lg);
	}

	.status-text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.status-text strong {
		font-weight: 600;
	}

	.event-id {
		font-family: var(--font-mono);
		background: rgba(0, 0, 0, 0.1);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	/* ===== RESPONSIVE DESIGN ===== */
	@media (max-width: 768px) {
		.publish-card {
			margin: var(--spacing-md);
			border-radius: var(--radius-lg);
		}

		.card-header {
			flex-direction: column;
			gap: var(--spacing-md);
			align-items: stretch;
		}

		.card-title {
			text-align: center;
		}

		.mode-toggle {
			align-self: center;
		}

		.form-row {
			flex-direction: column;
		}

		.timestamp-group {
			flex-direction: column;
		}

		.card-content,
		.card-actions {
			padding: var(--spacing-lg);
		}

		.status-message {
			margin: var(--spacing-lg) var(--spacing-lg) 0;
		}
	}

	/* ===== ACCESSIBILITY ===== */
	@media (prefers-reduced-motion: reduce) {
		.mode-btn.active,
		.timestamp-btn:hover,
		.load-json-btn:hover,
		.kind-input:focus,
		.content-input:focus,
		.tags-input:focus,
		.timestamp-input:focus,
		.json-input:focus {
			transform: none;
		}

		.status-message {
			animation: none;
		}
	}

	@media (prefers-contrast: high) {
		.publish-card,
		.preview-section,
		.status-message {
			border-width: 2px;
		}
	}

	/* ===== NIP-36 styles ===== */
	.cw-row { display:flex; gap:.5rem; align-items:center; }
	.switch { display:flex; align-items:center; gap:.35rem; font-size: var(--text-sm); color:#cbd5e1; }
	.cw-reason { flex:1; padding: var(--spacing-md); border:2px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-background); color: var(--color-text); }
</style>