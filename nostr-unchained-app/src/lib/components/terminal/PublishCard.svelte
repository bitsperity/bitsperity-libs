<!--
  Mobile Publish Interface
  
  Touch-optimized publishing interface for mobile-first Nostr experience
  Revolutionary UX with gesture support and real-time character tracking
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	let { onPublish }: { onPublish: (content: string) => Promise<any> } = $props();
	
	const dispatch = createEventDispatcher();
	
	// =============================================================================
	// Publish State Management
	// =============================================================================
	
	let content = $state('');
	let isPublishing = $state(false);
	let publishResult = $state<any>(null);
	let showResult = $state(false);
	let isDrafting = $state(false);
	
	// Character limits and tracking
	const maxLength = 2000; // Reasonable limit for mobile
	const warningThreshold = 1800;
	
	let characterCount = $derived(content.length);
	let isNearLimit = $derived(characterCount > warningThreshold);
	let isOverLimit = $derived(characterCount > maxLength);
	
	// =============================================================================
	// Touch Interaction Handlers
	// =============================================================================
	
	let textareaElement: HTMLTextAreaElement;
	let startY = 0;
	let currentHeight = 120; // Initial height in pixels
	
	function handleTextareaTouch(event: TouchEvent) {
		if (event.type === 'touchstart') {
			startY = event.touches[0].clientY;
		}
	}
	
	function autoResizeTextarea() {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = Math.min(textareaElement.scrollHeight, 300) + 'px';
		}
	}
	
	// =============================================================================
	// Publishing Logic
	// =============================================================================
	
	async function handlePublish() {
		if (!content.trim() || isOverLimit || isPublishing) return;
		
		isPublishing = true;
		publishResult = null;
		showResult = false;
		
		// Add haptic feedback
		if (navigator.vibrate) {
			navigator.vibrate([10, 50, 10]);
		}
		
		try {
			const result = await onPublish(content.trim());
			publishResult = result;
			showResult = true;
			
			if (result.success) {
				// Success haptic
				if (navigator.vibrate) {
					navigator.vibrate([50, 25, 50]);
				}
				
				// Clear content after successful publish
				setTimeout(() => {
					content = '';
					showResult = false;
					publishResult = null;
				}, 3000);
			}
			
		} catch (error) {
			publishResult = { success: false, error: error.message };
			showResult = true;
			
			// Error haptic
			if (navigator.vibrate) {
				navigator.vibrate([100, 50, 100, 50, 100]);
			}
		} finally {
			isPublishing = false;
		}
	}
	
	function handleCancel() {
		content = '';
		showResult = false;
		publishResult = null;
		isDrafting = false;
	}
	
	function handleDraft() {
		isDrafting = true;
		// Here you could save to localStorage or a draft system
		localStorage.setItem('nostr-draft', content);
		
		// Show brief confirmation
		if (navigator.vibrate) {
			navigator.vibrate(25);
		}
	}
	
	function loadDraft() {
		const draft = localStorage.getItem('nostr-draft');
		if (draft) {
			content = draft;
			isDrafting = false;
			localStorage.removeItem('nostr-draft');
		}
	}
	
	// =============================================================================
	// Text Formatting Helpers
	// =============================================================================
	
	function insertAtCursor(text: string) {
		if (!textareaElement) return;
		
		const start = textareaElement.selectionStart;
		const end = textareaElement.selectionEnd;
		
		content = content.substring(0, start) + text + content.substring(end);
		
		// Set cursor position after inserted text
		setTimeout(() => {
			textareaElement.selectionStart = textareaElement.selectionEnd = start + text.length;
			textareaElement.focus();
		}, 0);
	}
	
	function addHashtag() {
		insertAtCursor('#');
	}
	
	function addMention() {
		insertAtCursor('@');
	}
	
	// =============================================================================
	// Quick Actions
	// =============================================================================
	
	const quickTexts = [
		{ emoji: '👋', text: 'Hello Nostr! ' },
		{ emoji: '🔥', text: 'This is fire! ' },
		{ emoji: '🤔', text: 'Thinking about ' },
		{ emoji: '✨', text: 'Just discovered ' },
		{ emoji: '🚀', text: 'Building something amazing: ' }
	];
	
	function addQuickText(text: string) {
		content += text;
		autoResizeTextarea();
		textareaElement?.focus();
	}
</script>

<!-- Mobile Publish Interface -->
<div class="publish-card">
	<!-- Publish Header -->
	<div class="publish-header">
		<div class="header-left">
			<h3>✍️ Publish Note</h3>
			<span class="publish-hint">Share your thoughts with Nostr</span>
		</div>
		<div class="header-right">
			{#if localStorage.getItem('nostr-draft')}
				<button class="draft-btn" onclick={loadDraft}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14,2 14,8 20,8"/>
					</svg>
					Draft
				</button>
			{/if}
		</div>
	</div>

	<!-- Quick Text Actions -->
	<div class="quick-texts">
		{#each quickTexts as quick}
			<button 
				class="quick-text-btn"
				onclick={() => addQuickText(quick.text)}
			>
				<span class="quick-emoji">{quick.emoji}</span>
			</button>
		{/each}
	</div>

	<!-- Text Input Area -->
	<div class="input-section">
		<textarea
			bind:this={textareaElement}
			bind:value={content}
			oninput={autoResizeTextarea}
			ontouchstart={handleTextareaTouch}
			placeholder="What's happening on Nostr?"
			class="content-input {isNearLimit ? 'near-limit' : ''} {isOverLimit ? 'over-limit' : ''}"
			maxlength={maxLength + 100}
		></textarea>
		
		<!-- Character Counter -->
		<div class="character-counter">
			<div class="counter-bar">
				<div 
					class="counter-fill {isNearLimit ? 'warning' : ''} {isOverLimit ? 'error' : ''}"
					style="width: {Math.min((characterCount / maxLength) * 100, 100)}%"
				></div>
			</div>
			<span class="counter-text {isOverLimit ? 'error' : isNearLimit ? 'warning' : ''}">
				{characterCount}/{maxLength}
			</span>
		</div>
	</div>

	<!-- Formatting Tools -->
	<div class="formatting-tools">
		<button class="format-btn" onclick={addHashtag} title="Add hashtag">
			<span class="format-icon">#</span>
			<span class="format-label">Tag</span>
		</button>
		<button class="format-btn" onclick={addMention} title="Add mention">
			<span class="format-icon">@</span>
			<span class="format-label">Mention</span>
		</button>
		<button class="format-btn" onclick={handleDraft} title="Save as draft">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
				<polyline points="17,21 17,13 7,13 7,21"/>
				<polyline points="7,3 7,8 15,8"/>
			</svg>
			<span class="format-label">Draft</span>
		</button>
	</div>

	<!-- Action Buttons -->
	<div class="action-buttons">
		<button 
			class="cancel-btn"
			onclick={handleCancel}
			disabled={isPublishing}
		>
			Cancel
		</button>
		<button 
			class="publish-btn {isOverLimit ? 'disabled' : ''}"
			onclick={handlePublish}
			disabled={!content.trim() || isOverLimit || isPublishing}
		>
			{#if isPublishing}
				<div class="spinner"></div>
				Publishing...
			{:else}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<line x1="22" y1="2" x2="11" y2="13"/>
					<polygon points="22,2 15,22 11,13 2,9 22,2"/>
				</svg>
				Publish
			{/if}
		</button>
	</div>

	<!-- Result Display -->
	{#if showResult && publishResult}
		<div class="result-card {publishResult.success ? 'success' : 'error'}">
			{#if publishResult.success}
				<div class="result-icon success">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<polyline points="20,6 9,17 4,12"/>
					</svg>
				</div>
				<div class="result-content">
					<h4>Published Successfully!</h4>
					<p>Your note has been published to the Nostr network</p>
					{#if publishResult.eventId}
						<div class="event-id">
							Event ID: {publishResult.eventId.substring(0, 16)}...
						</div>
					{/if}
				</div>
			{:else}
				<div class="result-icon error">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</div>
				<div class="result-content">
					<h4>Publishing Failed</h4>
					<p>{publishResult.error || 'Unknown error occurred'}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.publish-card {
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(20px);
		border-radius: 1rem;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.05);
		margin-bottom: 1rem;
	}

	/* Header */
	.publish-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.header-left h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #ffffff;
	}

	.publish-hint {
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.draft-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.2);
		color: #f59e0b;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.draft-btn:hover {
		background: rgba(245, 158, 11, 0.2);
	}

	/* Quick Text Actions */
	.quick-texts {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.quick-text-btn {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quick-text-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.05);
	}

	.quick-emoji {
		font-size: 1.25rem;
	}

	/* Input Section */
	.input-section {
		margin-bottom: 1rem;
	}

	.content-input {
		width: 100%;
		min-height: 120px;
		max-height: 300px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1rem;
		color: #ffffff;
		font-size: 1rem;
		line-height: 1.6;
		resize: none;
		transition: all 0.3s ease;
		font-family: inherit;
	}

	.content-input:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
	}

	.content-input.near-limit {
		border-color: #f59e0b;
	}

	.content-input.over-limit {
		border-color: #ef4444;
	}

	.content-input::placeholder {
		color: #64748b;
	}

	/* Character Counter */
	.character-counter {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		gap: 1rem;
	}

	.counter-bar {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.counter-fill {
		height: 100%;
		background: #10b981;
		transition: all 0.3s ease;
		border-radius: 2px;
	}

	.counter-fill.warning {
		background: #f59e0b;
	}

	.counter-fill.error {
		background: #ef4444;
	}

	.counter-text {
		font-size: 0.875rem;
		font-family: 'SF Mono', monospace;
		color: #94a3b8;
		font-weight: 500;
	}

	.counter-text.warning {
		color: #f59e0b;
	}

	.counter-text.error {
		color: #ef4444;
	}

	/* Formatting Tools */
	.formatting-tools {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.format-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
	}

	.format-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.format-icon {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.format-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.cancel-btn {
		flex: 1;
		padding: 0.875rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		color: #94a3b8;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.publish-btn {
		flex: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
		border: none;
		border-radius: 0.75rem;
		color: #ffffff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.publish-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
	}

	.publish-btn:disabled,
	.publish-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Result Card */
	.result-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		border-radius: 0.75rem;
		margin-top: 1rem;
		animation: slideIn 0.3s ease;
	}

	.result-card.success {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.result-card.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.result-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.result-icon.success {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
	}

	.result-icon.error {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.result-content h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
	}

	.result-content p {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: #94a3b8;
		line-height: 1.5;
	}

	.event-id {
		font-size: 0.75rem;
		font-family: 'SF Mono', monospace;
		color: #64748b;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		display: inline-block;
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

	/* Touch Optimizations */
	@media (hover: none) and (pointer: coarse) {
		.format-btn {
			padding: 1rem;
		}
		
		.action-buttons {
			gap: 1rem;
		}
		
		.cancel-btn,
		.publish-btn {
			padding: 1rem;
			min-height: 52px;
		}
		
		.quick-text-btn {
			width: 52px;
			height: 52px;
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.publish-card {
			padding: 1rem;
		}
		
		.publish-header {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.formatting-tools {
			flex-wrap: wrap;
		}
		
		.action-buttons {
			flex-direction: column;
		}
		
		.cancel-btn,
		.publish-btn {
			flex: none;
		}
	}
</style>