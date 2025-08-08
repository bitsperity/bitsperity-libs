<script lang="ts">
/**
 * ProfileAvatar - Smart Profile Avatar Component
 * 
 * Automatically loads profile data and displays avatar.
 * Clicking navigates to the user's profile.
 * Reuses NostrUnchained profile loading logic.
 */

import { createEventDispatcher, onDestroy } from 'svelte';
import { formatPubkey } from '../../utils/nostr.js';
import { getProfileStore, unsubscribeFromProfile } from '../../utils/ProfileSubscriptionManager.js';

// Props
let { 
  pubkey, 
  nostr = null, 
  size = 'md', 
  clickable = true, 
  showOnlineStatus = false, 
  className = '' 
}: {
  pubkey: string;
  nostr?: any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  clickable?: boolean;
  showOnlineStatus?: boolean;
  className?: string;
} = $props();

// Event dispatcher
const dispatch = createEventDispatcher<{
  profileClick: { pubkey: string };
}>();

// Profile state
let profile = $state(null);
let isLoading = $state(true);
let error = $state(null);
let profileStore: any = null;
let unsubscribe: (() => void) | null = null;

// Generate unique subscriber ID for this component
const subscriberId = `avatar-${pubkey}-${Math.random().toString(36).substring(7)}`;

// Load profile data using aggregated subscription manager
$effect(() => {
  if (pubkey && nostr) {
    try {
      isLoading = true;
      error = null;
      
      // Use ProfileSubscriptionManager for optimized subscriptions
      profileStore = getProfileStore(pubkey, subscriberId);
      
      // Subscribe to profile changes
      unsubscribe = profileStore.subscribe((profileData: any) => {
        // Equality guard to avoid write loops and depth errors
        const prevId = (profile as any)?.eventId;
        const nextId = (profileData as any)?.eventId;
        const prevUpdated = (profile as any)?.lastUpdated;
        const nextUpdated = (profileData as any)?.lastUpdated;
        const changed = prevId !== nextId || prevUpdated !== nextUpdated;
        if (changed) {
          profile = profileData;
        }
        isLoading = false;
        error = null;
      });
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        // Notify manager that this component is no longer interested
        unsubscribeFromProfile(pubkey, subscriberId);
      };
    } catch (err) {
      console.error('Failed to get profile store:', err);
      error = 'Failed to load profile';
      isLoading = false;
    }
  } else {
    // No pubkey or nostr, use fallback
    isLoading = false;
    profile = null;
  }
});

// Cleanup on component destroy
onDestroy(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  if (pubkey) {
    unsubscribeFromProfile(pubkey, subscriberId);
  }
});

// Computed values
const displayName = $derived(
  profile?.metadata?.name || 
  profile?.metadata?.display_name || 
  formatPubkey(pubkey || '', { length: 8 }) || 'Unknown'
);

const avatarLetter = $derived(displayName && typeof displayName === 'string' 
                             ? displayName.charAt(0).toUpperCase() 
                             : '?');

const hasProfileImage = $derived(!!profile?.metadata?.picture);

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
  class="profile-avatar {className}"
  class:clickable
  class:loading={isLoading}
  class:has-image={hasProfileImage}
  style="--size: {sizeMap[size]}; --font-size: {fontSizeMap[size]}"
  onclick={handleClick}
  onkeydown={handleKeydown}
  role={clickable ? 'button' : 'img'}
  tabindex={clickable ? 0 : -1}
  title={clickable ? `View ${displayName}'s profile` : displayName}
  aria-label={clickable ? `View ${displayName}'s profile` : `${displayName}'s avatar`}
>
  {#if isLoading}
    <div class="avatar-loading">
      <div class="loading-spinner"></div>
    </div>
  {:else if hasProfileImage}
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
.profile-avatar {
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

.profile-avatar.clickable {
  cursor: pointer;
  user-select: none;
}

.profile-avatar.clickable:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-avatar.clickable:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.profile-avatar.clickable:active {
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

.avatar-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
}

.loading-spinner {
  width: 50%;
  height: 50%;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
.profile-avatar[style*="--size: 24px"] .online-indicator {
  width: 6px;
  height: 6px;
  border-width: 1px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .profile-avatar {
    border-width: 3px;
  }
  
  .profile-avatar.clickable:focus {
    border-width: 4px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .profile-avatar {
    transition: none;
  }
  
  .profile-avatar.clickable:hover {
    transform: none;
  }
  
  .profile-avatar.clickable:active {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .profile-avatar.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>