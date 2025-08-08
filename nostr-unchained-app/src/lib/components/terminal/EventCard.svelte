<!--
  Event Card Component
  
  Native Nostr event representation with touch-optimized interactions
  Supports all major event types with beautiful mobile-first design
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    // moved into subcomponents
    import { onMount } from 'svelte';
    import EventCardHeader from '../event-card/EventCardHeader.svelte';
    import EventCardActions from '../event-card/EventCardActions.svelte';
    import EventCardTags from '../event-card/EventCardTags.svelte';
    
    let { event, nostr }: { event: any; nostr?: any } = $props();
    
    const dispatch = createEventDispatcher();

	// =============================================================================
	// Event Type Detection & Formatting
	// =============================================================================

  /* moved to header subcomponent
  function getEventType(kind: number): string {
    const eventTypes: Record<number, string> = {
      0: 'Profile',
      1: 'Text Note',
      3: 'Contacts',
      4: 'Direct Message',
      5: 'Delete',
      6: 'Repost',
      7: 'Reaction',
      1984: 'Report',
      9734: 'Zap Request',
      9735: 'Zap',
      10002: 'Relay List',
      30023: 'Long Form'
    };
    return eventTypes[kind] ?? `Kind ${kind}`;
  }

  function getEventIcon(kind: number): string {
    const icons: Record<number, string> = {
      0: '👤',
      1: '💬',
      3: '👥',
      4: '🔒',
      5: '🗑️',
      6: '🔄',
      7: '❤️',
      1984: '🚨',
      9734: '⚡',
      9735: '⚡',
      10002: '🔗',
      30023: '📄'
    };
    return icons[kind] ?? '📦';
  }

  function formatTimestamp(timestamp: number): string {
		const now = Date.now() / 1000;
		const diff = now - timestamp;
		
		if (diff < 60) return 'now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
		
		return new Date(timestamp * 1000).toLocaleDateString();
  }
  */

	function formatContent(content: string, maxLength: number = 280): string {
		if (!content) return '';
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

  // function formatPubkey(pubkey: string): string {
  //   return pubkey.substring(0, 8) + '...' + pubkey.substring(-4);
  // }

	// =============================================================================
	// Reactive Counters (Reactions/Reposts/Replies) & Actions
	// =============================================================================

	let reactionSummary: any = $state({ totalCount: 0, userReacted: false, userReactionType: undefined });
	let repostCount: number = $state(0);
	let replyCount: number = $state(0);

	let likePending = $state(false);
	let repostPending = $state(false);
	let replyPending = $state(false);
	let deletePending = $state(false);
	let lastPublishResult: any = $state(null);

	let unsubscribers: Array<() => void> = [];

	onMount(() => {
		try {
			// Reactions summary store (live)
			if ((nostr as any)?.social?.reactions?.to) {
				const store = (nostr as any).social.reactions.to(event.id);
				const unsub = store.subscribe((summary: any) => {
					if (!summary) return;
					const changed =
						summary.totalCount !== reactionSummary.totalCount ||
						summary.userReactionType !== reactionSummary.userReactionType;
					if (changed) {
						reactionSummary = summary;
					}
				});
				unsubscribers.push(unsub);
			}
		} catch {}

		try {
			// Reposts count store
			const repostStore = (nostr as any)?.query?.()
				?.kinds?.([6])
				?.tags?.('e', [event.id])
				?.execute?.();
			if (repostStore && typeof repostStore.subscribe === 'function') {
				const unsub = repostStore.subscribe((events: any[]) => {
					if (Array.isArray(events)) {
						const cnt = events.length;
						if (cnt !== repostCount) repostCount = cnt;
					}
				});
				unsubscribers.push(unsub);
			}
		} catch {}

		try {
			// Replies count store (heuristic: kind 1 with e-tag to this id)
			const replyStore = (nostr as any)?.query?.()
				?.kinds?.([1])
				?.tags?.('e', [event.id])
				?.execute?.();
			if (replyStore && typeof replyStore.subscribe === 'function') {
				const unsub = replyStore.subscribe((events: any[]) => {
					if (Array.isArray(events)) {
						const cnt = events.length;
						if (cnt !== replyCount) replyCount = cnt;
					}
				});
				unsubscribers.push(unsub);
			}
		} catch {}

		return () => {
			unsubscribers.forEach((u) => {
				try { u(); } catch {}
			});
			unsubscribers = [];
		};
	});

	async function toggleLike() {
		if (!(nostr as any)?.social?.reactions) return;
		likePending = true;
		try {
			if (reactionSummary.userReactionType) {
				await (nostr as any).social.reactions.unreact(event.id);
			} else {
				await (nostr as any).social.reactions.react(event.id, '+');
			}
		} catch (e) {
			console.error('Reaction failed', e);
		} finally {
			likePending = false;
		}
	}

	async function doRepost() {
		if (!(nostr as any)?.social?.content) return;
		repostPending = true;
		try {
			const result = await (nostr as any).social.content.repost(event.id);
			lastPublishResult = result;
		} catch (e) {
			console.error('Repost failed', e);
		} finally {
			repostPending = false;
		}
	}

	async function doReply() {
		if (!(nostr as any)?.events) return;
		const reply = window.prompt('Reply to note:', '');
		if (!reply) return;
		replyPending = true;
		try {
			const result = await (nostr as any).events
				.create()
				.replyTo(event.id)
				.content(reply)
				.publish();
			lastPublishResult = result;
		} catch (e) {
			console.error('Reply failed', e);
		} finally {
			replyPending = false;
		}
	}

	async function doDelete() {
		if (!(nostr as any)?.events) return;
		if ((nostr as any)?.me !== event.pubkey) return;
		if (!confirm('Delete this event?')) return;
		deletePending = true;
		try {
			const result = await (nostr as any).events
				.deletion(event.id, 'User deleted event')
				.publish();
			lastPublishResult = result;
		} catch (e) {
			console.error('Delete failed', e);
		} finally {
			deletePending = false;
		}
	}

	// =============================================================================
	// Tags rendering and interactions
	// =============================================================================
    function handleTagClick(tag: string[]) {
		if (!tag || tag.length === 0) return;
		const [type, value] = tag;
		if (type === 'p' && value) {
			// treat as profile click
			dispatch('profileClick', { pubkey: value });
			return;
    }

    // Removed inline copy UI; keep state resets to avoid unused warnings
    $effect.pre(() => {
        copySuccess = false; copyMessage = '';
    });
		dispatch('tagClick', { type, value });
	}

	// =============================================================================
	// Touch Interaction Handlers
	// =============================================================================

	let isPressed = $state(false);
	let startTime = 0;
	let copySuccess = $state(false);
	let copyMessage = $state('');

	function handleTouchStart() {
		isPressed = true;
		startTime = Date.now();
	}

	function handleTouchEnd() {
		const duration = Date.now() - startTime;
		isPressed = false;
		
		if (duration > 500) {
			// Long press - show details
			handleLongPress();
		} else {
			// Short tap - expand/collapse
			handleTap();
		}
	}

	function handleTap() {
		dispatch('tap', { event });
	}

	function handleLongPress() {
		dispatch('longpress', { event });
	}

	// =============================================================================
	// Event Type Specific Rendering
	// =============================================================================

	function isTextNote(): boolean {
		return event.kind === 1;
	}

	function isProfile(): boolean {
		return event.kind === 0;
	}

	function isReaction(): boolean {
		return event.kind === 7;
	}

	function isDM(): boolean {
		return event.kind === 4;
	}

	function parseProfileContent() {
		try {
			return JSON.parse(event.content);
		} catch {
			return {};
		}
	}

	function getReactionEmoji(): string {
		if (!isReaction()) return '';
		return event.content || '❤️';
	}

	function extractMentions(content: string): string[] {
		const mentions = content.match(/@npub[a-z0-9]+/g) || [];
		return mentions.map(mention => mention.substring(1)); // Remove @
	}

	function extractHashtags(content: string): string[] {
		const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
		return hashtags.map(tag => tag.substring(1)); // Remove #
	}

    // Clipboard-Funktionalität entfernt (wird später in eigenem UI-Element ergänzt)
</script>

<!-- Event Card -->
<div 
    class="event-card {isPressed ? 'pressed' : ''} event-type-{event.kind}"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    role="article"
>
    <!-- Card Header -->
    <div class="card-header">
        <EventCardHeader {event} {nostr} on:profileClick={(e)=>dispatch('profileClick', e.detail)} />
    </div>

	<!-- Card Content -->
	<div class="card-content">
		{#if isTextNote()}
			<!-- Text Note -->
			<div class="text-note">
				<p class="note-content">{formatContent(event.content)}</p>
				
				{#if extractHashtags(event.content).length > 0}
					<div class="hashtags">
						{#each extractHashtags(event.content) as hashtag}
							<span class="hashtag">#{hashtag}</span>
						{/each}
					</div>
				{/if}
				
				{#if extractMentions(event.content).length > 0}
					<div class="mentions">
						{#each extractMentions(event.content) as mention}
							<span class="mention">@{mention.substring(0, 8)}...</span>
						{/each}
					</div>
				{/if}
			</div>
		{:else if isProfile()}
			<!-- Profile Update -->
			{@const profile = parseProfileContent()}
			<div class="profile-update">
				{#if profile.name}
					<div class="profile-name">{profile.name}</div>
				{/if}
				{#if profile.about}
					<div class="profile-about">{formatContent(profile.about, 140)}</div>
				{/if}
				{#if profile.picture}
					<div class="profile-picture">
						<img src={profile.picture} alt="Profile" loading="lazy" />
					</div>
				{/if}
			</div>
		{:else if isReaction()}
			<!-- Reaction -->
			<div class="reaction">
				<span class="reaction-emoji">{getReactionEmoji()}</span>
				<span class="reaction-text">reacted to an event</span>
			</div>
		{:else if isDM()}
			<!-- Direct Message -->
			<div class="dm">
				<div class="dm-indicator">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M21 8.5l-9 5.5-9-5.5"/>
						<path d="M3 7l9 6 9-6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3z"/>
					</svg>
					Encrypted Message
				</div>
				<p class="dm-content">🔒 Content encrypted</p>
			</div>
		{:else}
			<!-- Generic Event -->
			<div class="generic-event">
				<p class="event-content">{formatContent(event.content, 200)}</p>
				{#if event.tags && event.tags.length > 0}
					<div class="event-tags">
						<span class="tags-count">{event.tags.length} tags</span>
					</div>
				{/if}
			</div>
		{/if}

        <EventCardTags tags={event.tags} on:tagClick={(e)=>handleTagClick([e.detail.type, e.detail.value])} />
	</div>

    <!-- Card Actions -->
    <EventCardActions 
        {event} {nostr}
        reactionSummary={reactionSummary}
        likePending={likePending}
        repostPending={repostPending}
        replyPending={replyPending}
        deletePending={deletePending}
        onLike={toggleLike}
        onRepost={doRepost}
        onReply={doReply}
        onDelete={doDelete}
    />

	{#if lastPublishResult}
		<div class="publish-result">
			<div class="result-title">Publish Result</div>
			<div class="result-row {lastPublishResult.success ? 'ok' : 'fail'}">
				{lastPublishResult.success ? '✅' : '❌'} {lastPublishResult.eventId || lastPublishResult.error}
			</div>
			{#if lastPublishResult.relayResults}
				<div class="relay-results">
					{#each lastPublishResult.relayResults as r}
						<div class="relay-row {r.success ? 'ok' : 'fail'}">
							<span class="relay-url">{r.relay}</span>
							<span class="relay-status">{r.success ? 'OK' : 'FAIL'}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Toast Notification -->
	{#if copyMessage}
		<div class="copy-toast {copySuccess ? 'success' : 'error'}">
			<div class="toast-icon">
				{#if copySuccess}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<polyline points="20,6 9,17 4,12"/>
					</svg>
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				{/if}
			</div>
			<span class="toast-message">{copyMessage}</span>
		</div>
	{/if}
</div>

<style>
	.event-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1rem;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		user-select: none;
		position: relative;
		overflow: hidden;
	}

	.event-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.event-card:hover::before {
		opacity: 1;
	}

	.event-card.pressed {
		transform: scale(0.98);
		background: rgba(255, 255, 255, 0.08);
	}

	/* Event Type Specific Styles */
	.event-type-0::before { background: linear-gradient(90deg, #10b981, #059669); }
	.event-type-1::before { background: linear-gradient(90deg, #6366f1, #4f46e5); }
	.event-type-4::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
	.event-type-7::before { background: linear-gradient(90deg, #ef4444, #dc2626); }

	/* Card Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.event-icon {
		font-size: 1.125rem;
	}

	.event-type {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.event-time {
		font-size: 0.75rem;
		color: #64748b;
		font-family: var(--font-mono);
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		justify-content: flex-end;
	}

	.author-key {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: #94a3b8;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.author-key:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		transform: translateY(-1px);
	}

	/* Card Content */
	.card-content {
		margin-bottom: 0.75rem;
	}

	.note-content {
		margin: 0 0 0.5rem 0;
		line-height: 1.6;
		color: #ffffff;
		word-wrap: break-word;
	}

	.hashtags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.hashtag {
		font-size: 0.75rem;
		color: #06b6d4;
		background: rgba(6, 182, 212, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(6, 182, 212, 0.2);
	}

	.mentions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.mention {
		font-size: 0.75rem;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(139, 92, 246, 0.2);
	}

	/* Profile Content */
	.profile-name {
		font-weight: 600;
		font-size: 1.125rem;
		color: #ffffff;
		margin-bottom: 0.25rem;
	}

	.profile-about {
		color: #94a3b8;
		line-height: 1.5;
		margin-bottom: 0.5rem;
	}

	.profile-picture img {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}

	/* Reaction Content */
	.reaction {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.reaction-emoji {
		font-size: 1.5rem;
	}

	.reaction-text {
		color: #94a3b8;
		font-style: italic;
	}

	/* DM Content */
	.dm-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #f59e0b;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.dm-content {
		margin: 0;
		color: #94a3b8;
		font-style: italic;
	}

	/* Generic Event */
	.event-content {
		margin: 0;
		color: #ffffff;
		line-height: 1.6;
	}

	.tags-count {
		font-size: 0.75rem;
		color: #64748b;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
	}

	/* Card Actions */
	.card-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.left-actions {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.action-btn {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-btn:hover {
		color: #94a3b8;
		background: rgba(255, 255, 255, 0.05);
	}

    /* Heart (Like) button */
    .heart-btn { color: #64748b; }

	.event-id {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: #64748b;
		background: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0.25rem;
		border-radius: 0.375rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.event-id:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #94a3b8;
	}

	/* Publish result */
	.publish-result {
		margin-top: 0.5rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.1);
		padding-top: 0.5rem;
	}

	.result-title {
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 0.25rem;
	}

	.relay-results {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.relay-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		background: rgba(255,255,255,0.03);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
	}

	.relay-row.ok { color: #10b981; }
	.relay-row.fail { color: #ef4444; }

	/* Copy Indicators */
	.copy-indicator {
		color: #10b981;
		font-weight: 600;
		animation: copySuccess 0.3s ease;
	}

	.copy-indicator-small {
		color: #10b981;
		font-size: 0.625rem;
		font-weight: 600;
		animation: copySuccess 0.3s ease;
	}

	@keyframes copySuccess {
		0% { 
			opacity: 0; 
			transform: scale(0.8); 
		}
		100% { 
			opacity: 1; 
			transform: scale(1); 
		}
	}

	/* Toast Notification */
	.copy-toast {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		backdrop-filter: blur(20px);
		z-index: 1000;
		animation: toastSlideIn 0.3s ease-out;
		pointer-events: none;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	}

	.copy-toast.success {
		background: rgba(16, 185, 129, 0.9);
		color: #ffffff;
		border: 1px solid rgba(16, 185, 129, 0.5);
	}

	.copy-toast.error {
		background: rgba(239, 68, 68, 0.9);
		color: #ffffff;
		border: 1px solid rgba(239, 68, 68, 0.5);
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toast-message {
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	@keyframes toastSlideIn {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.9);
		}
		100% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	/* Clickable Elements */
	.clickable {
		user-select: none;
		-webkit-tap-highlight-color: rgba(99, 102, 241, 0.2);
	}

	.clickable:active {
		transform: scale(0.98);
	}

	/* Touch Optimizations */
	@media (hover: none) and (pointer: coarse) {
		.event-card {
			padding: 1.25rem;
		}
		
		.action-btn {
			padding: 0.75rem;
			min-width: 44px;
			min-height: 44px;
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.card-header {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.author-info {
			text-align: left;
		}

		.hashtags, .mentions {
			gap: 0.25rem;
		}
	}
</style>