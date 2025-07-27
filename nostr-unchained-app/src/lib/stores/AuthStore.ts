/**
 * Authentication Store
 * 
 * Reactive authentication state management using Svelte stores.
 * Provides real-time auth state updates across the app.
 * Max 200 lines - Zero Monolith Policy
 */

import { writable, derived, readonly } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { 
	AuthenticationState, 
	UserProfile, 
	AuthMethod,
	AuthEvent,
	AuthEventHandler
} from '../types/auth.js';
import { createContextLogger } from '../utils/Logger.js';

// =============================================================================
// Store Types
// =============================================================================

export interface AuthStoreState extends AuthenticationState {
	readonly isLoading: boolean;
	readonly error: string | null;
}

export interface AuthStoreActions {
	setLoading(loading: boolean): void;
	setError(error: string | null): void;
	setAuthenticated(method: AuthMethod, publicKey: string, profile: UserProfile): void;
	updateProfile(profile: Partial<UserProfile>): void;
	updateActivity(): void;
	clearAuth(): void;
	reset(): void;
}

export interface AuthStore extends Readable<AuthStoreState> {
	readonly actions: AuthStoreActions;
	readonly isAuthenticated: Readable<boolean>;
	readonly currentUser: Readable<UserProfile | null>;
	readonly authMethod: Readable<AuthMethod | null>;
	readonly sessionAge: Readable<number | null>;
}

// =============================================================================
// Initial State
// =============================================================================

const INITIAL_STATE: AuthStoreState = {
	isAuthenticated: false,
	isInitialized: false,
	method: null,
	publicKey: null,
	profile: null,
	sessionStarted: null,
	lastActivity: null,
	isLoading: false,
	error: null
};

// =============================================================================
// Auth Store Implementation
// =============================================================================

function createAuthStore(): AuthStore {
	const logger = createContextLogger('AuthStore');
	const { subscribe, set, update } = writable<AuthStoreState>(INITIAL_STATE);
	
	// Event handlers for auth events
	const eventHandlers = new Set<AuthEventHandler>();

	// =============================================================================
	// Store Actions
	// =============================================================================

	const actions: AuthStoreActions = {
		setLoading(loading: boolean): void {
			logger.debug('Setting loading state', { loading });
			update(state => ({ ...state, isLoading: loading, error: null }));
		},

		setError(error: string | null): void {
			logger.debug('Setting error state', { error });
			update(state => ({ ...state, error, isLoading: false }));
		},

		setAuthenticated(method: AuthMethod, publicKey: string, profile: UserProfile): void {
			const now = Date.now();
			
			logger.info('Setting authenticated state', { 
				method, 
				publicKey: publicKey.substring(0, 16) + '...'
			});

			update(state => ({
				...state,
				isAuthenticated: true,
				isInitialized: true,
				method,
				publicKey,
				profile,
				sessionStarted: now,
				lastActivity: now,
				isLoading: false,
				error: null
			}));

			// Emit login event
			emitAuthEvent({
				type: 'login',
				timestamp: now,
				data: { method, publicKey, profile }
			});
		},

		updateProfile(profileUpdate: Partial<UserProfile>): void {
			logger.debug('Updating profile', { profileUpdate });
			
			update(state => {
				if (!state.profile) return state;
				
				const updatedProfile = { ...state.profile, ...profileUpdate };
				
				// Emit profile update event
				emitAuthEvent({
					type: 'profile_updated',
					timestamp: Date.now(),
					data: updatedProfile
				});

				return {
					...state,
					profile: updatedProfile
				};
			});
		},

		updateActivity(): void {
			const now = Date.now();
			
			update(state => {
				if (!state.isAuthenticated) return state;
				
				return {
					...state,
					lastActivity: now
				};
			});
		},

		clearAuth(): void {
			logger.info('Clearing authentication state');
			
			// Emit logout event before clearing
			emitAuthEvent({
				type: 'logout',
				timestamp: Date.now(),
				data: null
			});

			update(state => ({
				...INITIAL_STATE,
				isInitialized: state.isInitialized
			}));
		},

		reset(): void {
			logger.info('Resetting auth store to initial state');
			set(INITIAL_STATE);
		}
	};

	// =============================================================================
	// Derived Stores
	// =============================================================================

	const isAuthenticated = derived(
		{ subscribe },
		($state) => $state.isAuthenticated
	);

	const currentUser = derived(
		{ subscribe },
		($state) => $state.profile
	);

	const authMethod = derived(
		{ subscribe },
		($state) => $state.method
	);

	const sessionAge = derived(
		{ subscribe },
		($state) => {
			if (!$state.sessionStarted) return null;
			return Date.now() - $state.sessionStarted;
		}
	);

	// =============================================================================
	// Event System
	// =============================================================================

	function emitAuthEvent(event: AuthEvent): void {
		logger.debug('Emitting auth event', { type: event.type });
		
		eventHandlers.forEach(handler => {
			try {
				handler(event);
			} catch (error) {
				logger.error('Auth event handler error', { error, eventType: event.type });
			}
		});
	}

	function addEventHandler(handler: AuthEventHandler): () => void {
		eventHandlers.add(handler);
		
		// Return cleanup function
		return () => {
			eventHandlers.delete(handler);
		};
	}

	// =============================================================================
	// Store Interface
	// =============================================================================

	return {
		subscribe: readonly({ subscribe }).subscribe,
		actions,
		isAuthenticated: readonly(isAuthenticated),
		currentUser: readonly(currentUser),
		authMethod: readonly(authMethod),
		sessionAge: readonly(sessionAge),
		// Extended interface for event handling
		addEventHandler
	} as AuthStore & { addEventHandler: typeof addEventHandler };
}

// =============================================================================
// Global Auth Store Instance
// =============================================================================

export const authStore = createAuthStore();

// =============================================================================
// Convenience Exports
// =============================================================================

export const {
	isAuthenticated,
	currentUser,
	authMethod,
	sessionAge
} = authStore;

export const authActions = authStore.actions;

// Add event handler helper
export function onAuthEvent(handler: AuthEventHandler): () => void {
	return (authStore as any).addEventHandler(handler);
}

// =============================================================================
// Store Utilities
// =============================================================================

export function getAuthState(): Promise<AuthStoreState> {
	return new Promise(resolve => {
		const unsubscribe = authStore.subscribe(state => {
			unsubscribe();
			resolve(state);
		});
	});
}

export function waitForAuth(): Promise<UserProfile> {
	return new Promise((resolve, reject) => {
		const unsubscribe = authStore.subscribe(state => {
			if (state.isAuthenticated && state.profile) {
				unsubscribe();
				resolve(state.profile);
			} else if (state.error) {
				unsubscribe();
				reject(new Error(state.error));
			}
		});
	});
}