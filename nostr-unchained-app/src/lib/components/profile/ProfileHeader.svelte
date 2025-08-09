<script lang="ts">
/**
 * ProfileHeader - Profile Header Component
 * 
 * Displays user avatar, name, verification status, and pubkey with copy functionality.
 * Reusable component for different profile views and contexts.
 * Max 200 lines - Zero Monolith Policy
 */

type UserProfile = any;
import { verifyNip05 } from '../../utils/nip05.js';
// import { copyToClipboard } from '../../utils/clipboard.js';
import { formatPubkey } from '../../utils/nostr.js';
import KeyDisplay from '../ui/KeyDisplay.svelte';
// import ProfileAvatar from '../ui/ProfileAvatar.svelte';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	profile: UserProfile | null;
	verified?: boolean;
	compact?: boolean;
	showCopy?: boolean;
	showVerification?: boolean;
	className?: string;
}

const {
	profile,
	verified = false,
	compact = false,
	showCopy = true,
	showVerification = true,
	className = ''
}: Props = $props();

// =============================================================================
// Computed Properties
// =============================================================================

const displayName = $derived(
	profile?.metadata?.name || 
	profile?.metadata?.display_name || 
	formatPubkey(profile?.pubkey || '')
);

const avatarLetter = $derived(
	displayName && typeof displayName === 'string' 
		? displayName.charAt(0).toUpperCase() 
		: '?'
);

// const shortPubkey = $derived(
//   profile?.pubkey ? formatPubkey(profile.pubkey) : ''
// );

const hasNip05 = $derived(!!profile?.metadata?.nip05);
let verifying = $state(false);
let verifyError: string | null = $state(null);
async function doVerify() {
  if (!profile?.metadata?.nip05 || !profile?.pubkey) return;
  verifying = true; verifyError = null;
  const res = await verifyNip05(profile.metadata.nip05, profile.pubkey, 6000);
  verifying = false;
  if (!res.ok) { verifyError = res.reason || 'failed'; }
}

// =============================================================================
// Event Handlers
// =============================================================================

// copy handler not used in current header variant
</script>

<div class="profile-header {className}" class:compact>
	<!-- Avatar Section -->
	<div class="avatar-section">
		{#if profile?.metadata?.picture}
			<img 
				src={profile.metadata.picture} 
				alt="" 
				class="avatar-image"
			/>
		{:else}
			<div class="avatar-placeholder">
				{avatarLetter}
			</div>
		{/if}
	</div>
	
	<!-- Info Section -->
	<div class="info-section">
		<!-- Display Name -->
		<h1 class="display-name">{displayName}</h1>
		
		<!-- NIP-05 Verification Badge -->
    {#if hasNip05 && showVerification}
      <div class="nip05-badge" class:verified title={verified ? 'Verified' : 'Not verified'}>
        {#if verified}
          ✅ {profile.metadata.nip05}
        {:else}
          <button class="verify-btn" onclick={doVerify} disabled={verifying}>
            {verifying ? '⏳ verifying…' : 'Verify '}{profile.metadata.nip05}
          </button>
        {/if}
      </div>
      {#if verifyError}
        <div class="verify-hint">Verify failed: {verifyError}</div>
      {/if}
    {/if}
		
		<!-- Pubkey with Copy -->
		{#if profile?.pubkey}
			<div class="pubkey-section">
				<KeyDisplay 
					hexKey={profile.pubkey} 
					variant={compact ? "compact" : "short"} 
					copyable={showCopy}
					className="profile-key-display"
				/>
			</div>
		{/if}
	</div>
</div>

<style>
.profile-header {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-lg);
	padding: var(--spacing-md);
	width: 100%;
	position: relative;
}

.profile-header.compact {
	gap: var(--spacing-md);
	padding: var(--spacing-sm);
}

.avatar-section {
	flex-shrink: 0;
	margin-top: -20px; /* Subtle overlap with banner */
}


.avatar-image {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	border: 3px solid var(--color-border);
	object-fit: cover;
	transition: all var(--transition-fast);
}

.avatar-image:hover {
	border-color: var(--color-primary);
	transform: scale(1.02);
}

.avatar-placeholder {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	border: 3px solid var(--color-border);
	background: var(--color-surface);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	font-weight: bold;
	color: var(--color-text);
	transition: all var(--transition-fast);
}

.avatar-placeholder:hover {
	border-color: var(--color-primary);
	transform: scale(1.02);
}

.compact .avatar-image,
.compact .avatar-placeholder {
	width: 50px;
	height: 50px;
	font-size: 1rem;
}

.info-section {
	flex: 1;
	min-width: 0; /* Prevent flex item from overflowing */
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	padding-top: var(--spacing-sm); /* Align with avatar positioning */
}

.display-name {
	font-size: var(--text-xl);
	font-weight: bold;
	margin: 0;
	color: var(--color-text);
	line-height: var(--leading-tight);
	word-break: break-word;
}

.compact .display-name {
	font-size: var(--text-lg);
}

.nip05-badge {
	background: var(--color-danger);
	color: var(--color-danger-text);
	padding: var(--spacing-xs) var(--spacing-sm);
	border-radius: var(--radius-sm);
	font-size: var(--text-xs);
	font-weight: 500;
	display: inline-block;
	border: 1px solid var(--color-danger);
	width: fit-content;
}

.nip05-badge.verified {
	background: var(--color-success);
	color: var(--color-success-text);
	border-color: var(--color-success);
}

.verify-btn { background: transparent; border: none; color: inherit; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
.verify-hint { font-size: .75rem; color: #ef4444; }

.pubkey-section {
	display: flex;
	align-items: center;
	min-width: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.profile-header {
		gap: var(--spacing-md);
		padding: var(--spacing-sm);
	}
	
	.avatar-image,
	.avatar-placeholder {
		width: 60px;
		height: 60px;
		font-size: 1.2rem;
	}
	
	.display-name {
		font-size: var(--text-lg);
	}
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
	.avatar-image,
	.avatar-placeholder {
		border-width: 2px;
	}
	
	.nip05-badge {
		border-width: 2px;
		font-weight: 600;
	}
}
</style>