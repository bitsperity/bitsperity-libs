<!--
  AuthProvider Component
  
  App-wide authentication context provider.
  Manages auth state, service initialization, and session handling.
  Max 200 lines - Zero Monolith Policy
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authStore, authActions, onAuthEvent } from '../../stores/AuthStore.js';
	import { registerService, getService } from '../../services/ServiceContainer.js';
	import { createAuthService } from '../../services/AuthService.js';
	import { createNostrService } from '../../services/NostrService.js';
	import { createContextLogger } from '../../utils/Logger.js';
	import { DEFAULT_APP_CONFIG } from '../../types/app.js';
	import type { AuthService } from '../../services/AuthService.js';
	import type { NostrService } from '../../services/NostrService.js';
	import type { AuthEvent } from '../../types/auth.js';

	// =============================================================================
	// Props
	// =============================================================================

	interface Props {
		children?: any;
		autoRestore?: boolean;
		sessionTimeout?: number;
		debugMode?: boolean;
	}

	let { 
		children, 
		autoRestore = true, 
		sessionTimeout = 480, // 8 hours 
		debugMode = false 
	}: Props = $props();

	// =============================================================================
	// Component State (Svelte 5 Runes)
	// =============================================================================

	let isInitialized = $state(false);
	let initializationError = $state<string | null>(null);
	let sessionCheckInterval: ReturnType<typeof setInterval> | null = null;
	let authEventCleanup: (() => void) | null = null;

	const logger = createContextLogger('AuthProvider');

	// =============================================================================
	// Lifecycle Management
	// =============================================================================

	onMount(async () => {
		try {
			logger.info('Initializing AuthProvider...', { 
				autoRestore, 
				sessionTimeout, 
				debugMode 
			});

			await initializeServices();
			await initializeAuthService();
			
			if (autoRestore) {
				await restoreSession();
			}

			setupSessionManagement();
			setupAuthEventHandling();

			isInitialized = true;
			logger.info('AuthProvider initialized successfully');

		} catch (error) {
			logger.error('AuthProvider initialization failed', { error });
			initializationError = 'Authentifizierung konnte nicht initialisiert werden';
			authActions.setError(initializationError);
		}
	});

	onDestroy(() => {
		cleanup();
	});

	// =============================================================================
	// Service Initialization
	// =============================================================================

	async function initializeServices(): Promise<void> {
		// Services are already registered in ServiceContainer.ts
		// Just verify they are available
		const nostrService = await getService('nostr');
		const authService = await getService('auth');
		
		if (!nostrService || !authService) {
			throw new Error('Required services not available');
		}

		logger.debug('Services verified successfully');
	}

	async function initializeAuthService(): Promise<void> {
		const authService = await getService<AuthService>('auth');
		if (!authService) {
			throw new Error('AuthService not available');
		}

		const result = await authService.initialize();
		if (!result.success) {
			throw new Error(result.error?.message || 'AuthService initialization failed');
		}

		logger.debug('AuthService initialized');
	}

	// =============================================================================
	// Session Management
	// =============================================================================

	async function restoreSession(): Promise<void> {
		try {
			const authService = await getService<AuthService>('auth');
			if (!authService) return;

			// Check if we have an existing valid session
			const authState = authService.getAuthState();
			if (authState.isAuthenticated && authState.publicKey && authState.profile) {
				authActions.setAuthenticated(
					authState.method!,
					authState.publicKey,
					authState.profile
				);
				logger.info('Session restored successfully');
			}

		} catch (error) {
			logger.warn('Session restoration failed', { error });
		}
	}

	function setupSessionManagement(): void {
		// Check session validity every minute
		sessionCheckInterval = setInterval(async () => {
			await checkSessionValidity();
		}, 60000); // 1 minute

		logger.debug('Session management setup complete');
	}

	async function checkSessionValidity(): Promise<void> {
		const currentState = await new Promise(resolve => {
			const unsubscribe = authStore.subscribe(state => {
				unsubscribe();
				resolve(state);
			});
		});

		if (!currentState.isAuthenticated || !currentState.sessionStarted) {
			return;
		}

		const sessionAge = Date.now() - currentState.sessionStarted;
		const maxSessionAge = sessionTimeout * 60 * 1000; // Convert to milliseconds

		if (sessionAge > maxSessionAge) {
			logger.info('Session expired, logging out user');
			await handleSessionExpired();
		} else {
			// Update last activity
			authActions.updateActivity();
		}
	}

	async function handleSessionExpired(): Promise<void> {
		try {
			const authService = await getService<AuthService>('auth');
			if (authService) {
				await authService.logout();
			}
			authActions.clearAuth();
			
			// Emit session expired event
			const event: AuthEvent = {
				type: 'session_expired',
				timestamp: Date.now(),
				data: null
			};
			
			logger.warn('Session expired and user logged out');

		} catch (error) {
			logger.error('Error handling session expiry', { error });
		}
	}

	// =============================================================================
	// Auth Event Handling
	// =============================================================================

	function setupAuthEventHandling(): void {
		authEventCleanup = onAuthEvent((event: AuthEvent) => {
			logger.debug('Auth event received', { type: event.type });
			
			switch (event.type) {
				case 'login':
					handleLoginEvent(event);
					break;
				case 'logout':
					handleLogoutEvent(event);
					break;
				case 'session_expired':
					handleSessionExpiredEvent(event);
					break;
				case 'profile_updated':
					handleProfileUpdatedEvent(event);
					break;
			}
		});
	}

	function handleLoginEvent(event: AuthEvent): void {
		logger.info('User logged in successfully', { timestamp: event.timestamp });
		
		// Connect to Nostr relays after successful login
		connectToRelays();
	}

	function handleLogoutEvent(event: AuthEvent): void {
		logger.info('User logged out', { timestamp: event.timestamp });
		
		// Disconnect from relays
		disconnectFromRelays();
	}

	function handleSessionExpiredEvent(event: AuthEvent): void {
		logger.warn('Session expired', { timestamp: event.timestamp });
		
		// Show user-friendly notification
		// This could trigger a toast or modal
	}

	function handleProfileUpdatedEvent(event: AuthEvent): void {
		logger.debug('Profile updated', { timestamp: event.timestamp });
	}

	// =============================================================================
	// Nostr Connection Management
	// =============================================================================

	async function connectToRelays(): Promise<void> {
		try {
			const nostrService = await getService<NostrService>('nostr');
			if (!nostrService) return;

			const result = await nostrService.connect();
			if (result.success) {
				logger.info('Connected to Nostr relays', { 
					connectedRelays: result.data?.connectedRelays?.length 
				});
			} else {
				logger.warn('Failed to connect to some relays', { 
					error: result.error?.message 
				});
			}

		} catch (error) {
			logger.error('Error connecting to relays', { error });
		}
	}

	async function disconnectFromRelays(): Promise<void> {
		try {
			const nostrService = await getService<NostrService>('nostr');
			if (!nostrService) return;

			await nostrService.disconnect();
			logger.info('Disconnected from Nostr relays');

		} catch (error) {
			logger.error('Error disconnecting from relays', { error });
		}
	}

	// =============================================================================
	// Cleanup
	// =============================================================================

	function cleanup(): void {
		if (sessionCheckInterval) {
			clearInterval(sessionCheckInterval);
			sessionCheckInterval = null;
		}

		if (authEventCleanup) {
			authEventCleanup();
			authEventCleanup = null;
		}

		logger.info('AuthProvider cleanup complete');
	}

	// =============================================================================
	// Reactive State (Svelte 5 Runes)
	// =============================================================================

	let authState = $derived($authStore);
	let isLoading = $derived(authState.isLoading);
	let hasError = $derived(!!authState.error || !!initializationError);
	let isReady = $derived(isInitialized && !isLoading && !hasError);

	// =============================================================================
	// Debug Information
	// =============================================================================

	$effect(() => {
		if (debugMode && typeof window !== 'undefined') {
			(window as any).__authDebug = {
				isInitialized,
				isReady,
				authState,
				sessionTimeout,
				initializationError
			};
		}
	});
</script>

<!--
  Template
  
  Provides authentication context to child components.
  Shows loading/error states during initialization.
-->

{#if !isInitialized}
	<!-- Initialization Loading -->
	<div class="auth-loading" role="status" aria-label="Lade Authentifizierung...">
		<div class="loading-spinner"></div>
		<p>Initialisiere Authentifizierung...</p>
	</div>
{:else if initializationError}
	<!-- Initialization Error -->
	<div class="auth-error" role="alert">
		<div class="error-icon">⚠️</div>
		<h2>Authentifizierung fehlgeschlagen</h2>
		<p>{initializationError}</p>
		<button 
			onclick={() => window.location.reload()} 
			class="retry-button"
		>
			Erneut versuchen
		</button>
	</div>
{:else}
	<!-- Authentication Context Ready -->
	<div class="auth-provider" data-ready={isReady}>
		{@render children?.()}
	</div>
{/if}

<!--
  Styles
  
  Loading and error state styling.
-->
<style>
	.auth-loading,
	.auth-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.auth-loading p {
		color: #4a5568;
		font-size: 0.875rem;
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.auth-error h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #c53030;
	}

	.auth-error p {
		color: #4a5568;
		margin-bottom: 1.5rem;
		max-width: 400px;
	}

	.retry-button {
		background: #667eea;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.retry-button:hover {
		background: #5a67d8;
	}

	.auth-provider {
		min-height: 100vh;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.auth-loading,
		.auth-error {
			background: #1a202c;
			color: white;
		}

		.loading-spinner {
			border-color: #2d3748;
			border-top-color: #667eea;
		}

		.auth-loading p,
		.auth-error p {
			color: #a0aec0;
		}
	}
</style>