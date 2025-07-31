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
			
			// Clear any existing sessions to force fresh login
			await this.clearSession();
			console.log('🧹 Cleared existing sessions for fresh login');
			
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
			// Debug window.nostr availability
			console.log('🔍 Extension Detection Debug:', {
				hasWindow: typeof window !== 'undefined',
				hasNostr: typeof window !== 'undefined' && !!window.nostr,
				nostrMethods: typeof window !== 'undefined' && window.nostr ? 
					Object.keys(window.nostr) : [],
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
				nostrProvider: typeof window !== 'undefined' && window.nostr ? 
					window.nostr._provider || window.nostr.provider || 'unknown' : 'none'
			});

			// Check for window.nostr (standard)
			if (typeof window !== 'undefined' && window.nostr) {
				extensions.getNostr = {
					name: 'window.nostr',
					isAvailable: true,
					version: await this.getExtensionVersion()
				};
				
				console.log('✅ window.nostr detected');
			} else {
				console.log('❌ window.nostr not found');
			}

			// Check for Alby specifically (don't enable yet, just detect)
			if (typeof window !== 'undefined' && window.nostr?.enable) {
				// Just check if enable method exists - don't call it yet!
				extensions.alby.isAvailable = true;
				console.log('✅ Alby extension detected (enable method available)');
			} else {
				console.log('❌ Alby extension not detected');
			}

			// Check for nos2x
			if (typeof window !== 'undefined' && window.nostr?.getPublicKey) {
				extensions.nos2x.isAvailable = true;
				console.log('✅ nos2x detected');
			} else {
				console.log('❌ nos2x not detected');
			}

		} catch (error) {
			console.log('❌ Extension detection error:', error);
			this.logger.warn('Extension detection error', { error });
		}

		console.log('🔧 Final extension state:', extensions);
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
			console.log('🔐 Starting extension login process...');
			this.logger.info('Attempting extension login...');
			
			// Use the new NostrService extension signer method
			const nostrService = await getService<NostrService>('nostr');
			const result = await nostrService.useExtensionSigner();

			if (!result.success) {
				console.log('❌ Extension signer failed:', result.error);
				return {
					success: false,
					error: createAuthError('NO_EXTENSION', result.error?.message || 'Failed to use extension signer')
				};
			}

			const publicKey = result.data;
			console.log('✅ Extension signer successful:', publicKey.substring(0, 16) + '...');

			// Create user profile
			const profile: UserProfile = {
				pubkey: publicKey,
				verified: false
			};

			// Update auth state
			await this.setAuthenticatedState('extension', publicKey, profile);

			this.logger.info('Extension login successful', { 
				pubkey: publicKey.substring(0, 16) + '...' 
			});

			return {
				success: true,
				user: profile,
				publicKey: publicKey,
				method: 'extension'
			};

		} catch (error) {
			console.log('❌ Extension login error:', error);
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