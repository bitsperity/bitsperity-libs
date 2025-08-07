/**
 * Profile View Type Definitions
 * 
 * Complete TypeScript interfaces for the Profile View system.
 * Designed for NostrUnchained API integration with Svelte 5 runes.
 * Max 200 lines - Zero Monolith Policy
 */

import type { NostrUnchained } from '@nostr-unchained/core';
import type { AuthenticationState } from './auth.js';

// =============================================================================
// Core Profile Types
// =============================================================================

export interface ProfileData {
	readonly pubkey: string;
	readonly name?: string;
	readonly displayName?: string;
	readonly about?: string;
	readonly picture?: string;
	readonly banner?: string;
	readonly website?: string;
	readonly nip05?: string;
	readonly lud16?: string;
	readonly lud06?: string;
	readonly created_at?: number;
	readonly updated_at?: number;
}

export interface ProfileMetadata {
	readonly isVerified: boolean;
	readonly verificationStatus: 'verified' | 'pending' | 'failed' | 'none';
	readonly followersCount?: number;
	readonly followingCount?: number;
	readonly notesCount?: number;
	readonly lastSeen?: number;
}

// =============================================================================
// Component Props Interfaces
// =============================================================================

export interface ProfileViewProps {
	readonly nostr: NostrUnchained;
	readonly pubkey?: string;
	readonly authState: AuthenticationState;
	readonly initialData?: ProfileData;
	readonly showActions?: boolean;
	readonly compact?: boolean;
	readonly className?: string;
	readonly onDMClick?: (pubkey: string) => void;
}

export interface ProfileHeaderProps {
	readonly profile: ProfileData | null;
	readonly metadata: ProfileMetadata | null;
	readonly isOwnProfile: boolean;
	readonly isLoading: boolean;
	readonly onEditClick?: () => void;
	readonly onCopyPubkey?: (pubkey: string) => void;
	readonly className?: string;
}

export interface ProfileInfoProps {
	readonly profile: ProfileData | null;
	readonly metadata: ProfileMetadata | null;
	readonly isLoading: boolean;
	readonly showEmpty?: boolean;
	readonly className?: string;
}

export interface ProfileActionsProps {
	readonly profile: ProfileData | null;
	readonly isOwnProfile: boolean;
	readonly isFollowing: boolean;
	readonly isLoading: boolean;
	readonly onFollowToggle?: () => Promise<void>;
	readonly onEditClick?: () => void;
	readonly onShare?: () => void;
	readonly className?: string;
}

export interface ProfileEditorProps {
	readonly isOpen: boolean;
	readonly profile: ProfileData | null;
	readonly isLoading: boolean;
	readonly onSave: (data: ProfileFormData) => Promise<void>;
	readonly onCancel: () => void;
	readonly className?: string;
}

export interface ProfileStatsProps {
	readonly metadata: ProfileMetadata | null;
	readonly isLoading: boolean;
	readonly showFollowers?: boolean;
	readonly onClick?: (stat: 'following' | 'followers' | 'notes') => void;
	readonly className?: string;
}

// =============================================================================
// Form Data & Validation
// =============================================================================

export interface ProfileFormData {
	readonly name: string;
	readonly displayName: string;
	readonly about: string;
	readonly picture: string;
	readonly banner: string;
	readonly website: string;
	readonly nip05: string;
	readonly lud16: string;
}

export interface ProfileFormErrors {
	readonly name?: string;
	readonly displayName?: string;
	readonly about?: string;
	readonly picture?: string;
	readonly banner?: string;
	readonly website?: string;
	readonly nip05?: string;
	readonly lud16?: string;
}

export interface ProfileValidationResult {
	readonly isValid: boolean;
	readonly errors: ProfileFormErrors;
	readonly warnings: ProfileFormErrors;
	readonly hasWarnings: boolean;
}

// =============================================================================
// Profile Manager State
// =============================================================================

export interface ProfileManagerState {
	readonly profile: ProfileData | null;
	readonly metadata: ProfileMetadata | null;
	readonly isLoading: boolean;
	readonly isFollowing: boolean;
	readonly error: string | null;
	readonly lastUpdated: number | null;
}

export interface ProfileManagerActions {
	readonly followUser: () => Promise<void>;
	readonly unfollowUser: () => Promise<void>;
	readonly updateProfile: (data: ProfileFormData) => Promise<void>;
	readonly refreshProfile: () => Promise<void>;
	readonly clearError: () => void;
}

export interface ProfileManager {
	readonly state: ProfileManagerState;
	readonly actions: ProfileManagerActions;
	readonly subscribe: (callback: (state: ProfileManagerState) => void) => () => void;
	readonly destroy: () => void;
}

// =============================================================================
// View State Management
// =============================================================================

export type ProfileViewMode = 'display' | 'edit' | 'create';

export interface ProfileViewState {
	readonly viewMode: ProfileViewMode;
	readonly profilePubkey: string;
	readonly isOwnProfile: boolean;
	readonly showEditor: boolean;
	readonly isFormDirty: boolean;
	readonly lastAction: string | null;
}

// =============================================================================
// Event Types
// =============================================================================

export interface ProfileEvent {
	readonly type: 'profile_updated' | 'follow_changed' | 'profile_created' | 'profile_deleted';
	readonly pubkey: string;
	readonly timestamp: number;
	readonly data: any;
}

export type ProfileEventHandler = (event: ProfileEvent) => void;

// =============================================================================
// Utility Types
// =============================================================================

export interface ProfileDisplayName {
	readonly display: string;
	readonly source: 'displayName' | 'name' | 'pubkey';
	readonly truncated: boolean;
}

export interface ProfileLink {
	readonly url: string;
	readonly display: string;
	readonly type: 'website' | 'lightning' | 'nip05';
	readonly isValid: boolean;
}

export interface ProfileAvatar {
	readonly url: string | null;
	readonly fallback: string;
	readonly alt: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface ProfileViewConfig {
	readonly maxNameLength: number;
	readonly maxAboutLength: number;
	readonly maxUrlLength: number;
	readonly showFollowersCount: boolean;
	readonly enableOptimisticUpdates: boolean;
	readonly cacheTimeout: number;
	readonly retryAttempts: number;
}

export const DEFAULT_PROFILE_CONFIG: ProfileViewConfig = {
	maxNameLength: 50,
	maxAboutLength: 500,
	maxUrlLength: 200,
	showFollowersCount: false,
	enableOptimisticUpdates: true,
	cacheTimeout: 300000, // 5 minutes
	retryAttempts: 3
} as const;

// =============================================================================
// Type Guards
// =============================================================================

export function isValidProfile(data: any): data is ProfileData {
	return data && typeof data === 'object' && typeof data.pubkey === 'string';
}

export function isProfileFormData(data: any): data is ProfileFormData {
	return data && typeof data === 'object' && 
		typeof data.name === 'string' &&
		typeof data.about === 'string';
}

export function isProfileEvent(event: any): event is ProfileEvent {
	return event && 
		typeof event.type === 'string' &&
		typeof event.pubkey === 'string' &&
		typeof event.timestamp === 'number';
}