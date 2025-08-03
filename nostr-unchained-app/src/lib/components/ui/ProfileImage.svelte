<script lang="ts">
/**
 * ProfileImage - Clickable Profile Avatar Component
 * 
 * Displays a user's profile picture or fallback avatar.
 * Clicking navigates to the user's profile view.
 * Reusable across the app for consistent profile navigation.
 */

import { createEventDispatcher } from 'svelte';
import { formatPubkey } from '../../utils/nostr.js';

// Props
export let pubkey: string;
export let profile: any = null; // Profile data with metadata
export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
export let clickable: boolean = true;
export let showOnlineStatus: boolean = false;
export let className: string = '';

// Event dispatcher
const dispatch = createEventDispatcher<{
  profileClick: { pubkey: string };
}>();

// Reactive values
$: displayName = profile?.metadata?.name || profile?.metadata?.display_name || formatPubkey(pubkey, { length: 8 });
$: avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
$: hasProfileImage = !!profile?.metadata?.picture;

// Size mappings
const sizeMap = {
  xs: '24px',
  sm: '32px', 
  md: '40px',
  lg: '48px',
  xl: '64px'
};

const fontSizeMap = {
  xs: '0.6rem',
  sm: '0.75rem',
  md: '0.875rem', 
  lg: '1rem',
  xl: '1.25rem'
};

function handleClick() {
  if (!clickable || !pubkey) return;
  dispatch('profileClick', { pubkey });
}

function handleKeydown(event: KeyboardEvent) {
  if (!clickable) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
}
</script>

<div 
  class="profile-image {className}"
  class:clickable
  class:has-image={hasProfileImage}
  style="--size: {sizeMap[size]}; --font-size: {fontSizeMap[size]}"
  onclick={handleClick}
  onkeydown={handleKeydown}
  role={clickable ? 'button' : 'img'}
  tabindex={clickable ? 0 : -1}
  title={clickable ? `View ${displayName}'s profile` : displayName}
  aria-label={clickable ? `View ${displayName}'s profile` : `${displayName}'s avatar`}
>
  {#if hasProfileImage}
    <img 
      src={profile.metadata.picture} 
      alt="{displayName}'s avatar"
      class="avatar-image"
      loading="lazy"
    />
  {:else}
    <div class="avatar-fallback">
      {avatarLetter}
    </div>
  {/if}
  
  {#if showOnlineStatus}
    <div class="online-indicator" title="Online"></div>
  {/if}
</div>

<style>
.profile-image {
  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.profile-image.clickable {
  cursor: pointer;
  user-select: none;
}

.profile-image.clickable:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-image.clickable:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.profile-image.clickable:active {
  transform: scale(0.98);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: white;
  font-size: var(--font-size);
  font-weight: 600;
  text-transform: uppercase;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25%;
  height: 25%;
  min-width: 8px;
  min-height: 8px;
  background: #22c55e;
  border: 2px solid var(--color-background);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Size-specific adjustments */
.profile-image[style*="--size: 24px"] .online-indicator {
  width: 6px;
  height: 6px;
  border-width: 1px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .profile-image {
    border-width: 3px;
  }
  
  .profile-image.clickable:focus {
    border-width: 4px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .profile-image {
    transition: none;
  }
  
  .profile-image.clickable:hover {
    transform: none;
  }
  
  .profile-image.clickable:active {
    transform: none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .profile-image.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>