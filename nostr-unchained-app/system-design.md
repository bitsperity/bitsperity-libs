# Profile View System Design - Low-Level Implementation Specification

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [TypeScript Type System](#2-typescript-type-system)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [NostrUnchained API Integration](#5-nostrunschained-api-integration)
6. [Routing & Navigation](#6-routing--navigation)
7. [CSS Architecture](#7-css-architecture)
8. [File Structure](#8-file-structure)
9. [Code Implementation Details](#9-code-implementation-details)
10. [Testing Architecture](#10-testing-architecture)

---

## 1. Architecture Overview

### 1.1 System Context
```
┌─────────────────────────────────────────────────────────────────┐
│                        NostrApp.svelte                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Terminal      │  │   Messages      │  │   Profile       │  │
│  │                 │  │                 │  │   [NEW]         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ProfileView.svelte                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ ProfileHeader  │  │ ProfileInfo    │  │ ProfileActions │   │
│  │                │  │                │  │                │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐                       │
│  │ ProfileEditor  │  │ ProfileStats   │                       │
│  │ (conditional)  │  │ (optional)     │                       │
│  └────────────────┘  └────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NostrUnchained Profile API                   │
├─────────────────────────────────────────────────────────────────┤
│  • nostr.profile.get(pubkey)                                   │
│  • nostr.profile.edit().name().about().publish()               │
│  • nostr.profile.follows.mine()                                │
│  • nostr.profile.follows.add(pubkey).publish()                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Architecture
```
ProfileView (Container)
    │
    ├── ProfileStore (reactive)
    │   ├── nostr.profile.get(pubkey) → ProfileState
    │   └── Auto-updates on cache changes
    │
    ├── FollowStore (reactive)
    │   ├── nostr.profile.follows.mine() → FollowListState
    │   └── isFollowing(pubkey) → boolean
    │
    └── AuthStore (global)
        ├── currentUser.publicKey
        └── isAuthenticated
```

---

## 2. TypeScript Type System

### 2.1 Core Profile Types
```typescript
// src/lib/types/profile.ts

import type { NostrUnchained } from 'nostr-unchained';
import type { UserProfile, ProfileState, FollowListState } from 'nostr-unchained';

export interface ProfileViewProps {
  readonly nostr: NostrUnchained;
  readonly pubkey?: string; // undefined = own profile
  readonly authState: AuthState;
}

export interface ProfileViewState {
  readonly isOwnProfile: boolean;
  readonly isEditing: boolean;
  readonly profilePubkey: string;
  readonly currentUserPubkey: string | null;
  readonly viewMode: 'display' | 'edit' | 'create';
}

export interface ProfileDisplayData {
  readonly profile: UserProfile | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly verified: boolean;
  readonly lastUpdated: Date | null;
}

export interface FollowData {
  readonly isFollowing: boolean;
  readonly followLoading: boolean;
  readonly followError: Error | null;
  readonly followCount: number;
  readonly followerCount?: number; // Optional, may implement later
}

export interface ProfileFormData {
  name: string;
  about: string;
  picture: string;
  banner: string;
  nip05: string;
  website: string;
  lud16: string;
}

export interface ProfileFormErrors {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  website?: string;
  lud16?: string;
}

export interface ProfileValidationResult {
  readonly isValid: boolean;
  readonly errors: ProfileFormErrors;
  readonly hasWarnings: boolean;
  readonly warnings: string[];
}
```

### 2.2 Component-Specific Types
```typescript
// src/lib/components/profile/types.ts

export interface ProfileHeaderProps {
  readonly profile: UserProfile | null;
  readonly loading: boolean;
  readonly verified: boolean;
  readonly isOwnProfile: boolean;
  readonly onEditClick?: () => void;
}

export interface ProfileInfoProps {
  readonly profile: UserProfile | null;
  readonly loading: boolean;
  readonly isOwnProfile: boolean;
}

export interface ProfileActionsProps {
  readonly pubkey: string;
  readonly isOwnProfile: boolean;
  readonly isFollowing: boolean;
  readonly followLoading: boolean;
  readonly onFollowToggle: () => Promise<void>;
  readonly onEditProfile?: () => void;
}

export interface ProfileEditorProps {
  readonly currentProfile: UserProfile | null;
  readonly isVisible: boolean;
  readonly onSave: (data: ProfileFormData) => Promise<void>;
  readonly onCancel: () => void;
  readonly loading: boolean;
  readonly errors: ProfileFormErrors;
}

export interface ProfileStatsProps {
  readonly followingCount: number;
  readonly followersCount?: number;
  readonly loading: boolean;
}
```

---

## 3. Component Architecture

### 3.1 ProfileView.svelte (Main Container)
```svelte
<!--
  ProfileView.svelte - Main Profile Container
  
  Orchestrates all profile functionality with clean separation of concerns.
  Max 200 lines - Zero Monolith Policy
-->

<script lang="ts">
  import type { NostrUnchained } from 'nostr-unchained';
  import type { AuthState } from '../types/auth.js';
  import type { ProfileViewProps, ProfileViewState, ProfileFormData } from '../types/profile.js';
  
  import ProfileHeader from './ProfileHeader.svelte';
  import ProfileInfo from './ProfileInfo.svelte';
  import ProfileActions from './ProfileActions.svelte';
  import ProfileEditor from './ProfileEditor.svelte';
  import ProfileStats from './ProfileStats.svelte';
  
  import { createContextLogger } from '../../utils/Logger.js';
  import { validateProfileForm } from './utils/profileValidation.js';
  import { createProfileManager } from './utils/profileManager.js';

  // =============================================================================
  // Props Interface
  // =============================================================================
  
  interface Props extends ProfileViewProps {}
  
  let { nostr, pubkey, authState }: Props = $props();

  // =============================================================================
  // Derived State (Svelte 5 Runes)
  // =============================================================================
  
  // Determine which profile to show
  let profilePubkey = $derived(pubkey || authState.publicKey || '');
  let isOwnProfile = $derived(profilePubkey === authState.publicKey);
  let currentUserPubkey = $derived(authState.publicKey);
  
  // View mode logic
  let isEditing = $state(false);
  let viewMode = $derived<'display' | 'edit' | 'create'>(
    isOwnProfile && !profilePubkey ? 'create' :
    isOwnProfile && isEditing ? 'edit' : 'display'
  );

  // =============================================================================
  // Profile Manager Integration
  // =============================================================================
  
  let profileManager = $derived(
    profilePubkey ? createProfileManager(nostr, profilePubkey) : null
  );
  
  // Reactive profile data
  let profileState = $derived(profileManager?.profileState || null);
  let followState = $derived(profileManager?.followState || null);
  
  // Computed states
  let profile = $derived(profileState?.profile || null);
  let profileLoading = $derived(profileState?.loading || false);
  let profileError = $derived(profileState?.error || null);
  let verified = $derived(profileState?.verified || false);
  
  let isFollowing = $derived(followState?.isFollowing || false);
  let followLoading = $derived(followState?.loading || false);
  let followError = $derived(followState?.error || null);

  // =============================================================================
  // Event Handlers
  // =============================================================================
  
  async function handleFollowToggle(): Promise<void> {
    if (!profileManager) return;
    
    try {
      if (isFollowing) {
        await profileManager.unfollowUser();
      } else {
        await profileManager.followUser();
      }
    } catch (error) {
      logger.error('Follow toggle failed', { error });
    }
  }
  
  function handleEditClick(): void {
    if (isOwnProfile) {
      isEditing = true;
    }
  }
  
  async function handleProfileSave(formData: ProfileFormData): Promise<void> {
    if (!profileManager) return;
    
    try {
      await profileManager.updateProfile(formData);
      isEditing = false;
    } catch (error) {
      logger.error('Profile save failed', { error });
      throw error; // Re-throw for form error handling
    }
  }
  
  function handleEditCancel(): void {
    isEditing = false;
  }

  const logger = createContextLogger('ProfileView');
</script>

<!-- Template -->
{#if !profilePubkey && isOwnProfile}
  <!-- Profile Creation Flow -->
  <div class="profile-create">
    <ProfileEditor
      currentProfile={null}
      isVisible={true}
      onSave={handleProfileSave}
      onCancel={() => {}}
      loading={false}
      errors={{}}
    />
  </div>
{:else if profileManager}
  <!-- Profile Display/Edit -->
  <div class="profile-view" data-own={isOwnProfile} data-mode={viewMode}>
    <ProfileHeader
      {profile}
      loading={profileLoading}
      {verified}
      {isOwnProfile}
      onEditClick={handleEditClick}
    />
    
    <div class="profile-content">
      <div class="profile-main">
        <ProfileInfo
          {profile}
          loading={profileLoading}
          {isOwnProfile}
        />
        
        <ProfileActions
          pubkey={profilePubkey}
          {isOwnProfile}
          {isFollowing}
          {followLoading}
          onFollowToggle={handleFollowToggle}
          onEditProfile={handleEditClick}
        />
      </div>
      
      <div class="profile-sidebar">
        <ProfileStats
          followingCount={0}
          loading={profileLoading}
        />
      </div>
    </div>
    
    {#if isEditing}
      <ProfileEditor
        currentProfile={profile}
        isVisible={isEditing}
        onSave={handleProfileSave}
        onCancel={handleEditCancel}
        loading={false}
        errors={{}}
      />
    {/if}
  </div>
{:else}
  <!-- Loading State -->
  <div class="profile-loading">
    <div class="loading-spinner"></div>
    <p>Loading profile...</p>
  </div>
{/if}

<style>
  .profile-view {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .profile-content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: var(--spacing-xl);
  }
  
  @media (max-width: 768px) {
    .profile-content {
      grid-template-columns: 1fr;
    }
    
    .profile-view {
      padding: var(--spacing-md);
    }
  }
  
  .profile-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    min-height: 400px;
    color: var(--color-text-muted);
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

### 3.2 ProfileHeader.svelte
```svelte
<!--
  ProfileHeader.svelte - Profile Avatar, Name, and NIP-05 Badge
  
  Displays the main profile header with avatar, name, and verification status.
-->

<script lang="ts">
  import type { UserProfile } from 'nostr-unchained';
  import type { ProfileHeaderProps } from './types.js';
  
  import { createContextLogger } from '../../utils/Logger.js';
  import { copyToClipboard } from '../../utils/clipboard.js';
  import { formatPubkey } from '../../utils/nostr.js';

  interface Props extends ProfileHeaderProps {}
  
  let { profile, loading, verified, isOwnProfile, onEditClick }: Props = $props();

  // =============================================================================
  // Computed Values
  // =============================================================================
  
  let displayName = $derived(profile?.metadata?.name || 'Anonymous');
  let avatarUrl = $derived(profile?.metadata?.picture || '');
  let bannerUrl = $derived(profile?.metadata?.banner || '');
  let nip05 = $derived(profile?.metadata?.nip05 || '');
  let pubkeyShort = $derived(profile ? formatPubkey(profile.pubkey) : '');

  // =============================================================================
  // Event Handlers
  // =============================================================================
  
  async function handleCopyPubkey(): Promise<void> {
    if (profile?.pubkey) {
      await copyToClipboard(profile.pubkey);
      // Could show toast notification here
    }
  }
  
  function handleEditClick(): void {
    onEditClick?.();
  }

  const logger = createContextLogger('ProfileHeader');
</script>

<header class="profile-header" class:loading>
  {#if bannerUrl}
    <div class="profile-banner">
      <img 
        src={bannerUrl} 
        alt="Profile banner"
        loading="lazy"
        onerror="this.style.display='none'"
      />
    </div>
  {/if}
  
  <div class="profile-header-content">
    <div class="profile-avatar-section">
      <div class="profile-avatar" class:loading>
        {#if loading}
          <div class="avatar-skeleton"></div>
        {:else if avatarUrl}
          <img 
            src={avatarUrl} 
            alt={displayName}
            loading="lazy"
            onerror="this.src='/default-avatar.svg'"
          />
        {:else}
          <div class="avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        {/if}
      </div>
      
      {#if isOwnProfile}
        <button 
          class="edit-profile-btn"
          onclick={handleEditClick}
          title="Edit Profile"
        >
          ✏️
        </button>
      {/if}
    </div>
    
    <div class="profile-info">
      <div class="profile-name-section">
        <h1 class="profile-name" class:loading>
          {#if loading}
            <div class="name-skeleton"></div>
          {:else}
            {displayName}
            {#if verified}
              <span class="verified-badge" title="NIP-05 Verified">✅</span>
            {/if}
          {/if}
        </h1>
        
        {#if nip05 && !loading}
          <div class="profile-nip05">
            <span class="nip05-label">@</span>
            <span class="nip05-value">{nip05}</span>
          </div>
        {/if}
      </div>
      
      <div class="profile-pubkey">
        <button 
          class="pubkey-btn"
          onclick={handleCopyPubkey}
          title="Copy Public Key"
        >
          <span class="pubkey-icon">🔑</span>
          <span class="pubkey-text">{pubkeyShort}</span>
        </button>
      </div>
    </div>
  </div>
</header>

<style>
  .profile-header {
    position: relative;
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    overflow: hidden;
    border: 1px solid var(--color-border);
  }
  
  .profile-banner {
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  }
  
  .profile-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .profile-header-content {
    padding: var(--spacing-xl);
    position: relative;
  }
  
  .profile-avatar-section {
    position: relative;
    margin-top: -60px;
    margin-bottom: var(--spacing-lg);
  }
  
  .profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid var(--color-surface);
    overflow: hidden;
    background: var(--color-background);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--color-text-muted);
  }
  
  .avatar-skeleton,
  .name-skeleton {
    background: var(--color-border);
    border-radius: var(--radius-md);
    animation: pulse 2s ease-in-out infinite;
  }
  
  .avatar-skeleton {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  
  .name-skeleton {
    height: 2rem;
    width: 200px;
  }
  
  .edit-profile-btn {
    position: absolute;
    bottom: -10px;
    right: -10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid var(--color-surface);
    color: var(--color-primary-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all var(--transition-fast);
  }
  
  .edit-profile-btn:hover {
    background: var(--color-primary-hover);
    transform: scale(1.1);
  }
  
  .profile-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .profile-name {
    font-size: var(--text-2xl);
    font-weight: bold;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .verified-badge {
    font-size: var(--text-base);
  }
  
  .profile-nip05 {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: 2px;
  }
  
  .nip05-label {
    opacity: 0.7;
  }
  
  .pubkey-btn {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    transition: all var(--transition-fast);
  }
  
  .pubkey-btn:hover {
    background: var(--color-surface);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @media (max-width: 768px) {
    .profile-banner {
      height: 120px;
    }
    
    .profile-avatar {
      width: 80px;
      height: 80px;
      margin-top: -40px;
    }
    
    .profile-name {
      font-size: var(--text-xl);
    }
  }
</style>
```

### 3.3 ProfileEditor.svelte
```svelte
<!--
  ProfileEditor.svelte - Profile Creation/Edit Form
  
  Modal form for creating or editing profile information with validation.
-->

<script lang="ts">
  import type { UserProfile } from 'nostr-unchained';
  import type { ProfileEditorProps, ProfileFormData, ProfileFormErrors } from './types.js';
  
  import { createContextLogger } from '../../utils/Logger.js';
  import { validateProfileForm } from './utils/profileValidation.js';
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import Input from '../ui/Input.svelte';
  import Textarea from '../ui/Textarea.svelte';

  interface Props extends ProfileEditorProps {}
  
  let { 
    currentProfile, 
    isVisible, 
    onSave, 
    onCancel, 
    loading, 
    errors 
  }: Props = $props();

  // =============================================================================
  // Form State
  // =============================================================================
  
  let formData = $state<ProfileFormData>({
    name: currentProfile?.metadata?.name || '',
    about: currentProfile?.metadata?.about || '',
    picture: currentProfile?.metadata?.picture || '',
    banner: currentProfile?.metadata?.banner || '',
    nip05: currentProfile?.metadata?.nip05 || '',
    website: currentProfile?.metadata?.website || '',
    lud16: currentProfile?.metadata?.lud16 || ''
  });
  
  let formErrors = $state<ProfileFormErrors>({});
  let isValidating = $state(false);
  let isDirty = $state(false);

  // =============================================================================
  // Computed Values
  // =============================================================================
  
  let isValid = $derived(Object.keys(formErrors).length === 0);
  let canSave = $derived(isValid && isDirty && !loading);
  let modalTitle = $derived(currentProfile ? 'Edit Profile' : 'Create Profile');

  // =============================================================================
  // Form Validation
  // =============================================================================
  
  async function validateForm(): Promise<void> {
    isValidating = true;
    
    try {
      const validation = await validateProfileForm(formData);
      formErrors = validation.errors;
    } catch (error) {
      logger.error('Form validation failed', { error });
    } finally {
      isValidating = false;
    }
  }
  
  // Validate on form changes
  $effect(() => {
    if (isDirty) {
      validateForm();
    }
  });

  // =============================================================================
  // Event Handlers
  // =============================================================================
  
  function handleInputChange(field: keyof ProfileFormData, value: string): void {
    formData[field] = value;
    isDirty = true;
    
    // Clear field error on change
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      formErrors = newErrors;
    }
  }
  
  async function handleSave(): Promise<void> {
    if (!canSave) return;
    
    try {
      await validateForm();
      if (!isValid) return;
      
      await onSave(formData);
      
      // Reset form state on success
      isDirty = false;
      formErrors = {};
      
    } catch (error) {
      logger.error('Profile save failed', { error });
      // Error handling would show in UI
    }
  }
  
  function handleCancel(): void {
    onCancel();
    
    // Reset form state
    isDirty = false;
    formErrors = {};
  }

  const logger = createContextLogger('ProfileEditor');
</script>

<Modal {isVisible} onClose={handleCancel} size="lg">
  <div class="profile-editor">
    <div class="editor-header">
      <h2>{modalTitle}</h2>
      <p class="editor-subtitle">
        {currentProfile ? 'Update your profile information' : 'Set up your Nostr profile'}
      </p>
    </div>
    
    <form class="editor-form" onsubmit|preventDefault={handleSave}>
      <div class="form-row">
        <Input
          label="Display Name"
          placeholder="Enter your name"
          value={formData.name}
          onInput={(value) => handleInputChange('name', value)}
          error={formErrors.name}
          maxLength={50}
        />
      </div>
      
      <div class="form-row">
        <Textarea
          label="About"
          placeholder="Tell people about yourself..."
          value={formData.about}
          onInput={(value) => handleInputChange('about', value)}
          error={formErrors.about}
          maxLength={500}
          rows={4}
        />
      </div>
      
      <div class="form-row">
        <Input
          label="Avatar URL"
          placeholder="https://example.com/avatar.jpg"
          value={formData.picture}
          onInput={(value) => handleInputChange('picture', value)}
          error={formErrors.picture}
          type="url"
        />
      </div>
      
      <div class="form-row">
        <Input
          label="Banner URL"
          placeholder="https://example.com/banner.jpg"
          value={formData.banner}
          onInput={(value) => handleInputChange('banner', value)}
          error={formErrors.banner}
          type="url"
        />
      </div>
      
      <div class="form-row">
        <Input
          label="NIP-05 Identifier"
          placeholder="username@domain.com"
          value={formData.nip05}
          onInput={(value) => handleInputChange('nip05', value)}
          error={formErrors.nip05}
          helperText="Your verified Nostr identifier"
        />
      </div>
      
      <div class="form-row">
        <Input
          label="Website"
          placeholder="https://your-website.com"
          value={formData.website}
          onInput={(value) => handleInputChange('website', value)}
          error={formErrors.website}
          type="url"
        />
      </div>
      
      <div class="form-row">
        <Input
          label="Lightning Address"
          placeholder="username@getalby.com"
          value={formData.lud16}
          onInput={(value) => handleInputChange('lud16', value)}
          error={formErrors.lud16}
          helperText="Your Lightning payment address"
        />
      </div>
      
      <div class="editor-actions">
        <Button
          variant="outline"
          onclick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          variant="primary"
          onclick={handleSave}
          disabled={!canSave}
          loading={loading}
        >
          {currentProfile ? 'Update Profile' : 'Create Profile'}
        </Button>
      </div>
    </form>
  </div>
</Modal>

<style>
  .profile-editor {
    width: 100%;
    max-width: 600px;
  }
  
  .editor-header {
    margin-bottom: var(--spacing-xl);
    text-align: center;
  }
  
  .editor-header h2 {
    font-size: var(--text-xl);
    font-weight: bold;
    margin-bottom: var(--spacing-sm);
  }
  
  .editor-subtitle {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  
  .editor-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .form-row {
    display: flex;
    flex-direction: column;
  }
  
  .editor-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }
  
  @media (max-width: 768px) {
    .editor-actions {
      flex-direction: column-reverse;
    }
  }
</style>
```

---

## 4. State Management

### 4.1 Profile Manager Utility
```typescript
// src/lib/components/profile/utils/profileManager.ts

import type { NostrUnchained, UserProfile, ProfileStore, FollowListStore } from 'nostr-unchained';
import type { ProfileFormData } from '../types.js';
import { createContextLogger } from '../../../utils/Logger.js';

export interface ProfileManager {
  readonly profileState: ProfileState | null;
  readonly followState: FollowState | null;
  followUser(): Promise<void>;
  unfollowUser(): Promise<void>;
  updateProfile(data: ProfileFormData): Promise<void>;
  refreshProfile(): Promise<void>;
}

interface ProfileState {
  readonly profile: UserProfile | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly verified: boolean;
  readonly lastUpdated: Date | null;
}

interface FollowState {
  readonly isFollowing: boolean;
  readonly loading: boolean;
  readonly error: Error | null;
}

export function createProfileManager(
  nostr: NostrUnchained, 
  pubkey: string
): ProfileManager {
  const logger = createContextLogger('ProfileManager');
  
  // Initialize reactive stores
  const profileStore = nostr.profile.get(pubkey);
  const followListStore = nostr.profile.follows.mine();
  const isFollowingStore = followListStore.isFollowing(pubkey);
  
  // Reactive state containers
  let profileState = $state<ProfileState | null>(null);
  let followState = $state<FollowState | null>(null);
  
  // Subscribe to profile store
  profileStore.subscribe(state => {
    profileState = {
      profile: state.profile,
      loading: state.loading,
      error: state.error,
      verified: state.verified,
      lastUpdated: state.lastUpdated
    };
  });
  
  // Subscribe to follow state
  isFollowingStore.subscribe(isFollowing => {
    followState = {
      isFollowing,
      loading: false, // TODO: Get from follow store
      error: null
    };
  });
  
  // Follow/unfollow actions
  async function followUser(): Promise<void> {
    try {
      logger.info('Following user', { pubkey });
      
      await nostr.profile.follows.add(pubkey).publish();
      
      logger.info('Successfully followed user', { pubkey });
    } catch (error) {
      logger.error('Failed to follow user', { pubkey, error });
      throw error;
    }
  }
  
  async function unfollowUser(): Promise<void> {
    try {
      logger.info('Unfollowing user', { pubkey });
      
      await nostr.profile.follows.remove(pubkey);
      
      logger.info('Successfully unfollowed user', { pubkey });
    } catch (error) {
      logger.error('Failed to unfollow user', { pubkey, error });
      throw error;
    }
  }
  
  // Profile update action
  async function updateProfile(data: ProfileFormData): Promise<void> {
    try {
      logger.info('Updating profile', { fields: Object.keys(data) });
      
      const builder = nostr.profile.edit();
      
      // Apply form data to builder
      if (data.name) builder.name(data.name);
      if (data.about) builder.about(data.about);
      if (data.picture) builder.picture(data.picture);
      if (data.banner) builder.banner(data.banner);
      if (data.nip05) builder.nip05(data.nip05);
      if (data.website) builder.website(data.website);
      if (data.lud16) builder.lud16(data.lud16);
      
      // Preserve existing fields
      builder.preserveExisting(true);
      
      const result = await builder.publish();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Profile update failed');
      }
      
      logger.info('Profile updated successfully');
    } catch (error) {
      logger.error('Profile update failed', { error });
      throw error;
    }
  }
  
  // Manual refresh
  async function refreshProfile(): Promise<void> {
    try {
      await profileStore.refresh();
    } catch (error) {
      logger.error('Profile refresh failed', { error });
      throw error;
    }
  }
  
  return {
    get profileState() { return profileState; },
    get followState() { return followState; },
    followUser,
    unfollowUser,
    updateProfile,
    refreshProfile
  };
}
```

### 4.2 Profile Validation Utility
```typescript
// src/lib/components/profile/utils/profileValidation.ts

import type { ProfileFormData, ProfileFormErrors, ProfileValidationResult } from '../types.js';

export async function validateProfileForm(data: ProfileFormData): Promise<ProfileValidationResult> {
  const errors: ProfileFormErrors = {};
  const warnings: string[] = [];
  
  // Name validation
  if (data.name.length > 50) {
    errors.name = 'Name must be 50 characters or less';
  }
  
  // About validation
  if (data.about.length > 500) {
    errors.about = 'About section must be 500 characters or less';
  }
  
  // URL validations
  if (data.picture && !isValidUrl(data.picture)) {
    errors.picture = 'Please enter a valid image URL';
  }
  
  if (data.banner && !isValidUrl(data.banner)) {
    errors.banner = 'Please enter a valid image URL';
  }
  
  if (data.website && !isValidUrl(data.website)) {
    errors.website = 'Please enter a valid website URL';
  }
  
  // NIP-05 validation
  if (data.nip05 && !isValidNip05(data.nip05)) {
    errors.nip05 = 'Please enter a valid NIP-05 identifier (username@domain.com)';
  }
  
  // Lightning address validation
  if (data.lud16 && !isValidLightningAddress(data.lud16)) {
    errors.lud16 = 'Please enter a valid Lightning address (username@domain.com)';
  }
  
  // Warnings for empty fields
  if (!data.name) {
    warnings.push('Consider adding a display name for better discoverability');
  }
  
  if (!data.about) {
    warnings.push('Adding an about section helps others understand who you are');
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    hasWarnings: warnings.length > 0,
    warnings
  };
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidNip05(nip05: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(nip05);
}

function isValidLightningAddress(lud16: string): boolean {
  // Lightning addresses follow email format
  return isValidNip05(lud16);
}
```

---

## 5. NostrUnchained API Integration

### 5.1 Profile API Usage Patterns
```typescript
// Exact API integration patterns used throughout the profile system

// 1. Get Profile Store (Reactive)
const profileStore = nostr.profile.get(pubkey);
profileStore.subscribe(state => {
  // state: { profile, loading, error, verified, lastUpdated }
});

// 2. Profile Creation/Update
await nostr.profile.edit()
  .name('Alice')
  .about('Bitcoin enthusiast')
  .picture('https://example.com/avatar.jpg')
  .nip05('alice@domain.com')
  .preserveExisting(true) // Keep other fields
  .publish();

// 3. Follow Management
const followStore = nostr.profile.follows.mine();
const isFollowingStore = followStore.isFollowing(pubkey);

await nostr.profile.follows.add(pubkey).publish();
await nostr.profile.follows.remove(pubkey);

// 4. Batch Profile Loading (Future Enhancement)
const batchResult = await nostr.profile.batch()
  .get(['pubkey1', 'pubkey2', 'pubkey3'])
  .execute();
```

### 5.2 Error Handling Patterns
```typescript
// Standardized error handling across all profile operations

try {
  const result = await nostr.profile.edit().name('Test').publish();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Operation failed');
  }
} catch (error) {
  if (error instanceof NostrError) {
    // Handle Nostr-specific errors
    logger.error('Nostr error', { type: error.type, message: error.message });
  } else if (error instanceof NetworkError) {
    // Handle network errors
    logger.error('Network error', { message: error.message });
  } else {
    // Handle generic errors
    logger.error('Unknown error', { error });
  }
  
  // Re-throw for component error handling
  throw error;
}
```

---

## 6. Routing & Navigation

### 6.1 Route Type Extension
```typescript
// src/lib/types/app.ts - Update RouteId

export type RouteId = 'terminal' | 'messages' | 'publish' | 'profile';

export interface NavigationState {
  readonly currentRoute: RouteId;
  readonly previousRoute: RouteId | null;
  readonly params: Record<string, string>;
}

// Profile-specific route parameters
export interface ProfileRouteParams {
  readonly pubkey?: string; // undefined = own profile
  readonly mode?: 'view' | 'edit';
}
```

### 6.2 NostrApp.svelte Integration
```svelte
<!-- Add to NostrApp.svelte navigation -->
<nav class="app-nav">
  <button 
    class="nav-btn"
    class:active={currentView === 'terminal'}
    onclick={() => currentView = 'terminal'}
  >
    🌐 Explore
  </button>
  <button 
    class="nav-btn"
    class:active={currentView === 'messages'}
    onclick={() => currentView = 'messages'}
  >
    💬 Messages
  </button>
  <button 
    class="nav-btn"
    class:active={currentView === 'publish'}
    onclick={() => currentView = 'publish'}
  >
    📝 Publish
  </button>
  <!-- NEW: Profile Navigation -->
  <button 
    class="nav-btn"
    class:active={currentView === 'profile'}
    onclick={() => currentView = 'profile'}
  >
    👤 Profile
  </button>
</nav>

<!-- Add to main content area -->
<main class="app-main">
  {#if currentView === 'terminal'}
    <NostrTerminal {authState} {nostr} onLogout={logout} onShowKeys={() => {}} />
  {:else if currentView === 'messages'}
    <DMChat {authState} {nostr} />
  {:else if currentView === 'publish'}
    <div class="publish-view">
      <PublishCard {nostr} />
    </div>
  {:else if currentView === 'profile'}
    <!-- NEW: Profile View -->
    <ProfileView {nostr} {authState} />
  {/if}
</main>
```

---

## 7. CSS Architecture

### 7.1 Profile-Specific CSS Variables
```css
/* Add to app.css */

:root {
  /* Profile-specific colors */
  --color-profile-bg: var(--color-surface);
  --color-profile-border: var(--color-border);
  --color-verified: #10b981;
  --color-unverified: var(--color-text-muted);
  
  /* Profile dimensions */
  --profile-avatar-size: 120px;
  --profile-avatar-mobile: 80px;
  --profile-banner-height: 200px;
  --profile-banner-mobile: 120px;
  --profile-max-width: 1200px;
  
  /* Profile animations */
  --profile-transition: var(--transition-normal);
  --avatar-hover-scale: 1.05;
}

/* Profile-specific utility classes */
.profile-skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, transparent 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.verified-badge {
  color: var(--color-verified);
  font-size: 0.9em;
}

.unverified-badge {
  color: var(--color-unverified);
  font-size: 0.9em;
}
```

---

## 8. File Structure

### 8.1 Complete File Organization
```
src/lib/components/profile/
├── ProfileView.svelte              # Main container component
├── ProfileHeader.svelte            # Avatar, name, NIP-05 badge
├── ProfileInfo.svelte              # About, links, metadata
├── ProfileActions.svelte           # Follow/edit buttons
├── ProfileEditor.svelte            # Profile creation/edit form
├── ProfileStats.svelte             # Following/followers counts
├── types.ts                        # All profile-related types
└── utils/
    ├── profileManager.ts           # Profile state management
    ├── profileValidation.ts        # Form validation logic
    ├── profileFormatters.ts        # Display formatting utils
    └── profileHelpers.ts           # Misc helper functions

src/lib/components/ui/
├── Modal.svelte                    # Reusable modal component
├── Input.svelte                    # Form input component
├── Textarea.svelte                 # Form textarea component
└── Button.svelte                   # Already exists

src/lib/types/
├── app.ts                          # Update RouteId type
├── auth.ts                         # Existing auth types
└── profile.ts                      # New profile types

src/lib/utils/
├── clipboard.ts                    # Copy to clipboard utility
├── nostr.ts                        # Nostr formatting helpers
└── Logger.js                       # Existing logger
```

### 8.2 Import/Export Structure
```typescript
// src/lib/components/profile/index.ts
export { default as ProfileView } from './ProfileView.svelte';
export { default as ProfileHeader } from './ProfileHeader.svelte';
export { default as ProfileInfo } from './ProfileInfo.svelte';
export { default as ProfileActions } from './ProfileActions.svelte';
export { default as ProfileEditor } from './ProfileEditor.svelte';
export { default as ProfileStats } from './ProfileStats.svelte';

export type * from './types.js';
export * from './utils/profileManager.js';
export * from './utils/profileValidation.js';
```

---

## 9. Code Implementation Details

### 9.1 Clipboard Utility
```typescript
// src/lib/utils/clipboard.ts

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
```

### 9.2 Nostr Formatting Helpers
```typescript
// src/lib/utils/nostr.ts

export function formatPubkey(pubkey: string): string {
  if (pubkey.length < 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}

export function formatNpub(pubkey: string): string {
  // Convert hex pubkey to npub format
  // Implementation would use bech32 encoding
  return `npub1${pubkey.slice(0, 8)}...`;
}

export function isValidPubkey(pubkey: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(pubkey);
}

export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
```

### 9.3 Modal Component
```svelte
<!--
  Modal.svelte - Reusable Modal Component
  
  Used by ProfileEditor and other modal dialogs.
-->

<script lang="ts">
  interface Props {
    isVisible: boolean;
    onClose: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnBackdrop?: boolean;
  }
  
  let { 
    isVisible, 
    onClose, 
    size = 'md',
    closeOnBackdrop = true
  }: Props = $props();

  function handleBackdropClick(event: MouseEvent): void {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  }
  
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

{#if isVisible}
  <div 
    class="modal-backdrop" 
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-container size-{size}">
      <button class="modal-close" onclick={onClose} aria-label="Close">
        ✕
      </button>
      
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-lg);
  }
  
  .modal-container {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalEnter 0.2s ease-out;
  }
  
  .size-sm { max-width: 400px; }
  .size-md { max-width: 600px; }
  .size-lg { max-width: 800px; }
  .size-xl { max-width: 1000px; }
  
  .modal-close {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: var(--text-lg);
    z-index: 1;
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }
  
  .modal-close:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
  
  .modal-content {
    padding: var(--spacing-xl);
  }
  
  @keyframes modalEnter {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
```

---

## 10. Testing Architecture

### 10.1 Unit Test Structure
```typescript
// src/lib/components/profile/__tests__/ProfileView.test.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProfileView from '../ProfileView.svelte';
import type { NostrUnchained } from 'nostr-unchained';

// Mock NostrUnchained
const mockNostr = {
  profile: {
    get: vi.fn(),
    edit: vi.fn(),
    follows: {
      mine: vi.fn(),
      add: vi.fn(),
      remove: vi.fn()
    }
  }
} as unknown as NostrUnchained;

const mockAuthState = {
  isAuthenticated: true,
  publicKey: 'test-pubkey-123',
  user: null,
  signingMethod: 'temporary' as const
};

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders own profile correctly', async () => {
    // Mock profile store
    const mockProfileStore = {
      subscribe: vi.fn((callback) => {
        callback({
          profile: {
            pubkey: 'test-pubkey-123',
            metadata: {
              name: 'Test User',
              about: 'Test bio'
            }
          },
          loading: false,
          error: null,
          verified: true
        });
        return vi.fn(); // unsubscribe function
      })
    };
    
    mockNostr.profile.get.mockReturnValue(mockProfileStore);
    
    render(ProfileView, {
      props: {
        nostr: mockNostr,
        authState: mockAuthState
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
    });
  });

  it('shows edit button for own profile', async () => {
    // Test implementation...
  });

  it('shows follow button for foreign profile', async () => {
    // Test implementation...
  });

  it('handles follow toggle correctly', async () => {
    // Test implementation...
  });
});
```

### 10.2 Integration Test Structure
```typescript
// src/lib/components/profile/__tests__/integration.test.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect } from 'vitest';
import ProfileView from '../ProfileView.svelte';
import { createTestNostrInstance } from '../../../__tests__/helpers/nostr.js';

describe('Profile Integration Tests', () => {
  it('creates profile successfully', async () => {
    const testNostr = createTestNostrInstance();
    
    render(ProfileView, {
      props: {
        nostr: testNostr,
        authState: {
          isAuthenticated: true,
          publicKey: null, // No profile yet
          user: null,
          signingMethod: 'temporary'
        }
      }
    });
    
    // Should show profile creation form
    expect(screen.getByText('Create Profile')).toBeInTheDocument();
    
    // Fill form and submit
    await fireEvent.input(screen.getByLabelText('Display Name'), {
      target: { value: 'Test User' }
    });
    
    await fireEvent.click(screen.getByText('Create Profile'));
    
    // Verify API call
    await waitFor(() => {
      expect(testNostr.profile.edit).toHaveBeenCalled();
    });
  });
});
```

---

## 11. Implementation Checklist

### Phase 1: Foundation
- [ ] Create profile types in `src/lib/types/profile.ts`
- [ ] Create profile utility functions
- [ ] Create Modal component
- [ ] Create Input/Textarea components
- [ ] Update RouteId type in app.ts

### Phase 2: Core Components
- [ ] Implement ProfileView.svelte (main container)
- [ ] Implement ProfileHeader.svelte
- [ ] Implement ProfileInfo.svelte
- [ ] Implement ProfileActions.svelte
- [ ] Create profileManager utility

### Phase 3: Edit Functionality
- [ ] Implement ProfileEditor.svelte
- [ ] Create profile validation utility
- [ ] Implement form state management
- [ ] Add optimistic updates

### Phase 4: Integration
- [ ] Integrate ProfileView into NostrApp.svelte
- [ ] Add navigation button
- [ ] Test with real NostrUnchained API
- [ ] Add error handling

### Phase 5: Polish
- [ ] Add ProfileStats component
- [ ] Implement loading skeletons
- [ ] Add mobile responsiveness
- [ ] Write comprehensive tests
- [ ] Performance optimization

This system design provides the complete low-level implementation specification for the Profile View feature, covering every aspect from TypeScript types to component architecture, state management, and testing strategies.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "create-system-design", "content": "Create detailed system-design.md with low-level code specifications", "status": "completed", "priority": "high"}, {"id": "analyze-existing-patterns", "content": "Analyze existing code patterns and conventions in the app", "status": "completed", "priority": "medium"}, {"id": "define-component-interfaces", "content": "Define exact TypeScript interfaces for all profile components", "status": "completed", "priority": "high"}, {"id": "specify-api-integrations", "content": "Specify exact NostrUnchained API integration patterns", "status": "completed", "priority": "high"}, {"id": "design-state-management", "content": "Design reactive state management with Svelte 5 runes", "status": "completed", "priority": "high"}]