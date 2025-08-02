<script lang="ts">
/**
 * ProfileInfo - Profile Information Component
 * 
 * Displays user bio, metadata, stats, and links in a structured format.
 * Reusable component for profile views with configurable sections.
 * Max 200 lines - Zero Monolith Policy
 */

import type { UserProfile } from '../../types/profile.js';
import type { NostrUnchained } from 'nostr-unchained';
import { copyToClipboard } from '../../utils/clipboard.js';
import ProfileStats from './ProfileStats.svelte';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	profile: UserProfile | null;
	nostr: NostrUnchained;
	myPubkey: string;
	showAbout?: boolean;
	showLinks?: boolean;
	showStats?: boolean;
	compact?: boolean;
	className?: string;
}

const {
	profile,
	nostr,
	myPubkey,
	showAbout = true,
	showLinks = true,
	showStats = true,
	compact = false,
	className = ''
}: Props = $props();

// =============================================================================
// Computed Properties
// =============================================================================

const hasAbout = $derived(!!profile?.metadata?.about);
const hasWebsite = $derived(!!profile?.metadata?.website);
const hasLud16 = $derived(!!profile?.metadata?.lud16);
const hasLinks = $derived(hasWebsite || hasLud16);

// =============================================================================
// Event Handlers
// =============================================================================

async function handleCopyLud16() {
	if (!profile?.metadata?.lud16) return;
	
	try {
		await copyToClipboard(profile.metadata.lud16);
		// TODO: Show toast notification
	} catch (error) {
		console.error('Failed to copy Lightning address:', error);
	}
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

function normalizeWebsiteUrl(url: string): string {
	if (!url) return '';
	
	// Add https:// if no protocol specified
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		return `https://${url}`;
	}
	
	return url;
}
</script>

<div class="profile-info {className}" class:compact>
	<!-- About Section -->
	{#if showAbout && hasAbout}
		<section class="info-section about-section">
			<h3 class="section-title">About</h3>
			<div class="about-content">
				<p class="about-text">{profile.metadata.about}</p>
			</div>
		</section>
	{/if}
	
	<!-- Links Section -->
	{#if showLinks && hasLinks}
		<section class="info-section links-section">
			<h3 class="section-title">Links</h3>
			<div class="links-list">
				{#if hasWebsite}
					{@const websiteUrl = normalizeWebsiteUrl(profile.metadata.website)}
					{#if isValidUrl(websiteUrl)}
						<a 
							href={websiteUrl} 
							target="_blank" 
							rel="noopener noreferrer" 
							class="link-item website-link"
						>
							<span class="link-icon">🌐</span>
							<span class="link-text">{profile.metadata.website}</span>
						</a>
					{:else}
						<div class="link-item invalid-link">
							<span class="link-icon">🌐</span>
							<span class="link-text">{profile.metadata.website}</span>
							<span class="link-warning" title="Invalid URL">⚠️</span>
						</div>
					{/if}
				{/if}
				
				{#if hasLud16}
					<div class="link-item lightning-link">
						<span class="link-icon">⚡</span>
						<span class="link-text">{profile.metadata.lud16}</span>
						<button 
							class="copy-btn" 
							onclick={handleCopyLud16}
							title="Copy Lightning address"
							aria-label="Copy Lightning address to clipboard"
						>
							📋
						</button>
					</div>
				{/if}
			</div>
		</section>
	{/if}
	
	<!-- Stats Section -->
	{#if showStats && profile?.pubkey}
		<section class="info-section stats-section">
			<h3 class="section-title">Stats</h3>
			<ProfileStats 
				{nostr}
				pubkey={profile.pubkey}
				{myPubkey}
				{compact}
				className="profile-info-stats"
			/>
		</section>
	{/if}
	
	<!-- Empty State -->
	{#if !hasAbout && !hasLinks && !showStats}
		<div class="empty-state">
			<div class="empty-icon">📄</div>
			<p class="empty-text">No additional information available</p>
		</div>
	{/if}
</div>

<style>
.profile-info {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xl);
	width: 100%;
}

.profile-info.compact {
	gap: var(--spacing-lg);
}

.info-section {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--spacing-lg);
	transition: all var(--transition-fast);
}

.info-section:hover {
	border-color: var(--color-primary);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.compact .info-section {
	padding: var(--spacing-md);
}

.section-title {
	font-size: var(--text-lg);
	font-weight: 600;
	color: var(--color-text);
	margin: 0 0 var(--spacing-md) 0;
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.compact .section-title {
	font-size: var(--text-base);
	margin-bottom: var(--spacing-sm);
}

.about-content {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.about-text {
	font-size: var(--text-base);
	line-height: var(--leading-relaxed);
	color: var(--color-text-muted);
	margin: 0;
	white-space: pre-wrap;
	word-break: break-word;
}

.compact .about-text {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
}

.links-list {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.link-item {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	padding: var(--spacing-sm);
	background: var(--color-background);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	transition: all var(--transition-fast);
	min-width: 0;
}

.link-item:hover {
	background: var(--color-surface);
	border-color: var(--color-primary);
}

.website-link {
	color: var(--color-primary);
	text-decoration: none;
	cursor: pointer;
}

.website-link:hover {
	color: var(--color-primary-hover);
	transform: translateX(2px);
}

.lightning-link {
	color: var(--color-accent);
}

.invalid-link {
	color: var(--color-text-muted);
	opacity: 0.7;
}

.link-icon {
	font-size: var(--text-base);
	flex-shrink: 0;
}

.link-text {
	font-size: var(--text-sm);
	font-family: var(--font-mono);
	word-break: break-all;
	flex: 1;
	min-width: 0;
}

.compact .link-text {
	font-size: var(--text-xs);
}

.link-warning {
	font-size: var(--text-sm);
	color: var(--color-warning);
	flex-shrink: 0;
}

.copy-btn {
	background: transparent;
	border: none;
	color: var(--color-text-muted);
	cursor: pointer;
	padding: var(--spacing-xs);
	border-radius: var(--radius-sm);
	transition: all var(--transition-fast);
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: var(--text-sm);
}

.copy-btn:hover {
	background: var(--color-surface);
	color: var(--color-text);
	transform: scale(1.1);
}

.copy-btn:active {
	transform: scale(0.95);
}

/* ProfileStats component styling integration */
.profile-info-stats {
	width: 100%;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-2xl);
	text-align: center;
	border: 2px dashed var(--color-border);
	border-radius: var(--radius-lg);
	background: var(--color-surface);
}

.empty-icon {
	font-size: 3rem;
	margin-bottom: var(--spacing-md);
	opacity: 0.5;
}

.empty-text {
	font-size: var(--text-sm);
	color: var(--color-text-muted);
	margin: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.link-text {
		font-size: var(--text-xs);
	}
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
	.info-section {
		border-width: 2px;
	}
	
	.link-item {
		border-width: 2px;
	}
	
}
</style>