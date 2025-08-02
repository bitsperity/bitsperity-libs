/**
 * Core App Types
 * 
 * Central type definitions for the nostr-unchained-app.
 * Enforces type safety across all components and services.
 * Max 200 lines - Zero Monolith Policy
 */

// Import types from nostr-unchained when needed
// import type { NostrEvent, UserProfile } from 'nostr-unchained';

// =============================================================================
// Core App Types
// =============================================================================

export interface AppConfig {
	readonly relays: string[];
	readonly debug: boolean;
	readonly theme: 'light' | 'dark' | 'system';
	readonly offlineMode: boolean;
}

export interface AppState {
	readonly isInitialized: boolean;
	readonly isOnline: boolean;
	readonly currentUser: Record<string, unknown> | null; // UserProfile placeholder
	readonly config: AppConfig;
}

// =============================================================================
// Authentication Types
// =============================================================================

export interface AuthState {
	readonly isAuthenticated: boolean;
	readonly user: Record<string, unknown> | null; // UserProfile placeholder
	readonly publicKey: string | null;
	readonly signingMethod: 'extension' | 'temporary' | null;
}

export interface AuthResult {
	readonly success: boolean;
	readonly user?: Record<string, unknown>; // UserProfile placeholder
	readonly publicKey?: string;
	readonly error?: AppError;
}

// =============================================================================
// Error Handling Types
// =============================================================================

export type ErrorType = 'network' | 'validation' | 'auth' | 'nostr' | 'unknown';

export interface AppError {
	readonly type: ErrorType;
	readonly message: string;
	readonly code?: string;
	readonly retryable: boolean;
	readonly timestamp: number;
}

export interface UserFriendlyError {
	readonly title: string;
	readonly message: string;
	readonly action?: {
		readonly label: string;
		readonly handler: () => void;
	};
	readonly retryable: boolean;
}

// =============================================================================
// UI Component Types
// =============================================================================

export interface ComponentProps {
	readonly class?: string;
	readonly style?: string;
}

export interface LoadingState {
	readonly isLoading: boolean;
	readonly message?: string;
	readonly progress?: number;
}

export interface ValidationState {
	readonly isValid: boolean;
	readonly errors: string[];
}

// =============================================================================
// Navigation Types
// =============================================================================

export type RouteId = 'feed' | 'dm' | 'profile' | 'discover' | 'create' | 'auth';

export interface NavigationState {
	readonly currentRoute: RouteId;
	readonly previousRoute: RouteId | null;
	readonly params: Record<string, string>;
}

export interface ProfileRouteParams {
	readonly pubkey?: string;
	readonly mode?: 'view' | 'edit' | 'create';
}

// =============================================================================
// Performance Types
// =============================================================================

export interface PerformanceMetrics {
	readonly loadTime: number;
	readonly renderTime: number;
	readonly memoryUsage: number;
	readonly bundleSize: number;
}

// =============================================================================
// Service Layer Types
// =============================================================================

export interface ServiceResult<T> {
	readonly success: boolean;
	readonly data?: T;
	readonly error?: AppError;
}

export interface ServiceConfig {
	readonly timeout: number;
	readonly retryAttempts: number;
	readonly debug: boolean;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isAppError(error: unknown): error is AppError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'type' in error &&
		'message' in error &&
		'retryable' in error &&
		'timestamp' in error
	);
}

export function isAuthState(state: unknown): state is AuthState {
	return (
		typeof state === 'object' &&
		state !== null &&
		'isAuthenticated' in state &&
		'user' in state &&
		'publicKey' in state &&
		'signingMethod' in state
	);
}

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_APP_CONFIG: AppConfig = {
	relays: [
		'ws://umbrel.local:4848'
	],
	debug: true,
	theme: 'system',
	offlineMode: false
} as const;

export const INITIAL_AUTH_STATE: AuthState = {
	isAuthenticated: false,
	user: null,
	publicKey: null,
	signingMethod: null
} as const;