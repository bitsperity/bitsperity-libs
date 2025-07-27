/**
 * Authentication Service
 * 
 * Core authentication service with extension detection,
 * key management, and secure session handling.
 * Max 200 lines - Zero Monolith Policy
 */

import type { 
	AuthMethod, 
	LoginRequest, 
	LoginResult, 
	LogoutResult,
	AuthenticationState,
	ExtensionAuthResult,
	SupportedExtensions,
	UserProfile,
	KeyPair,
	SessionConfig
} from '../types/auth.js';
import type { ServiceResult } from '../types/app.js';
import { createAuthError, errorProcessor } from '../utils/ErrorHandler.js';
import { createContextLogger } from '../utils/Logger.js';
import { getService } from './ServiceContainer.js';

// =============================================================================
// Authentication Service Implementation
// =============================================================================

export class AuthService {
	private readonly logger = createContextLogger('AuthService');
	private authState: AuthenticationState = {
		isAuthenticated: false,
		isInitialized: false,
		method: null,
		publicKey: null,
		profile: null,
		sessionStarted: null,
		lastActivity: null
	};
	private sessionConfig: SessionConfig = {
		timeoutMinutes: 480, // 8 hours
		extendOnActivity: true,
		rememberSession: false,
		autoLogout: true
	};

	// =============================================================================
	// Initialization
	// =============================================================================

	async initialize(): Promise<ServiceResult<void>> {
		try {
			this.logger.info('Initializing AuthService...');
			
			// Check for existing session
			await this.restoreSession();
			
			// Detect available extensions
			const extensions = await this.detectExtensions();
			this.logger.info('Extension detection complete', extensions);
			
			this.authState = {
				...this.authState,
				isInitialized: true
			};
			
			this.logger.info('AuthService initialized successfully');
			return { success: true };

		} catch (error) {
			const authError = createAuthError('Failed to initialize auth service');
			this.logger.logError(authError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	// =============================================================================
	// Extension Detection
	// =============================================================================

	async detectExtensions(): Promise<SupportedExtensions> {
		const extensions: SupportedExtensions = {
			alby: { name: 'Alby', isAvailable: false },
			nos2x: { name: 'nos2x', isAvailable: false },
			getNostr: { name: 'window.nostr', isAvailable: false }
		};

		try {
			// Check for window.nostr (standard)
			if (typeof window !== 'undefined' && window.nostr) {
				extensions.getNostr = {
					name: 'window.nostr',
					isAvailable: true,
					version: await this.getExtensionVersion()
				};
			}

			// Check for Alby specifically
			if (typeof window !== 'undefined' && window.nostr?.enable) {
				try {
					const enabled = await window.nostr.enable();
					if (enabled) {
						extensions.alby.isAvailable = true;
					}
				} catch (error) {
					this.logger.debug('Alby detection failed', { error });
				}
			}

			// Check for nos2x
			if (typeof window !== 'undefined' && window.nostr?.getPublicKey) {
				extensions.nos2x.isAvailable = true;
			}

		} catch (error) {
			this.logger.warn('Extension detection error', { error });
		}

		return extensions;
	}

	private async getExtensionVersion(): Promise<string | undefined> {
		try {
			if (window.nostr?.getRelays) {
				return 'NIP-07';
			}
			return 'basic';
		} catch {
			return undefined;
		}
	}

	// =============================================================================
	// Authentication Methods
	// =============================================================================

	async loginWithExtension(): Promise<LoginResult> {
		try {
			this.logger.info('Attempting extension login...');
			
			const nostrService = await getService('nostr');
			if (!nostrService) {
				throw new Error('NostrService not available');
			}

			// Check extension availability
			const hasExtension = await nostrService.hasExtension();
			if (!hasExtension) {
				return {
					success: false,
					error: createAuthError('NO_EXTENSION', 'No Nostr extension found')
				};
			}

			// Get public key from extension
			const pubkeyResult = await nostrService.getPublicKey();
			if (!pubkeyResult.success || !pubkeyResult.data) {
				return {
					success: false,
					error: pubkeyResult.error || createAuthError('EXTENSION_DENIED', 'Extension access denied')
				};
			}

			// Create user profile
			const profile: UserProfile = {
				pubkey: pubkeyResult.data,
				verified: false
			};

			// Update auth state
			await this.setAuthenticatedState('extension', pubkeyResult.data, profile);

			this.logger.info('Extension login successful', { 
				pubkey: pubkeyResult.data.substring(0, 16) + '...' 
			});

			return {
				success: true,
				user: profile,
				publicKey: pubkeyResult.data,
				method: 'extension'
			};

		} catch (error) {
			const authError = createAuthError('EXTENSION_DENIED', 'Extension login failed');
			this.logger.logError(authError, { error });
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	async logout(): Promise<LogoutResult> {
		try {
			this.logger.info('Logging out user...');
			
			// Clear session storage
			await this.clearSession();
			
			// Reset auth state
			this.authState = {
				isAuthenticated: false,
				isInitialized: true,
				method: null,
				publicKey: null,
				profile: null,
				sessionStarted: null,
				lastActivity: null
			};

			this.logger.info('Logout successful');
			
			return { success: true };

		} catch (error) {
			const authError = createAuthError('SESSION_FAILED', 'Logout failed');
			this.logger.logError(authError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	// =============================================================================
	// Session Management
	// =============================================================================

	private async setAuthenticatedState(
		method: AuthMethod, 
		publicKey: string, 
		profile: UserProfile
	): Promise<void> {
		const now = Date.now();
		
		this.authState = {
			isAuthenticated: true,
			isInitialized: true,
			method,
			publicKey,
			profile,
			sessionStarted: now,
			lastActivity: now
		};

		// Store session if remember is enabled
		if (this.sessionConfig.rememberSession) {
			await this.saveSession();
		}
	}

	private async saveSession(): Promise<void> {
		// Session persistence would go here
		// For now, we use sessionStorage for security
		if (typeof window !== 'undefined' && this.authState.isAuthenticated) {
			sessionStorage.setItem('nostr_session', JSON.stringify({
				method: this.authState.method,
				publicKey: this.authState.publicKey,
				timestamp: this.authState.sessionStarted
			}));
		}
	}

	private async restoreSession(): Promise<void> {
		if (typeof window !== 'undefined') {
			const sessionData = sessionStorage.getItem('nostr_session');
			if (sessionData) {
				try {
					const session = JSON.parse(sessionData);
					const now = Date.now();
					const sessionAge = now - session.timestamp;
					const maxAge = this.sessionConfig.timeoutMinutes * 60 * 1000;
					
					if (sessionAge < maxAge) {
						// Session is still valid, restore it
						this.authState = {
							...this.authState,
							isAuthenticated: true,
							method: session.method,
							publicKey: session.publicKey,
							sessionStarted: session.timestamp,
							lastActivity: now
						};
						
						this.logger.info('Session restored', { method: session.method });
					} else {
						// Session expired
						await this.clearSession();
					}
				} catch (error) {
					this.logger.warn('Failed to restore session', { error });
					await this.clearSession();
				}
			}
		}
	}

	private async clearSession(): Promise<void> {
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('nostr_session');
		}
	}

	// =============================================================================
	// State Access
	// =============================================================================

	getAuthState(): AuthenticationState {
		return { ...this.authState };
	}

	isAuthenticated(): boolean {
		return this.authState.isAuthenticated;
	}

	getCurrentUser(): UserProfile | null {
		return this.authState.profile;
	}

	getPublicKey(): string | null {
		return this.authState.publicKey;
	}

	getAuthMethod(): AuthMethod | null {
		return this.authState.method;
	}
}

// =============================================================================
// Service Factory
// =============================================================================

export function createAuthService(): AuthService {
	return new AuthService();
}