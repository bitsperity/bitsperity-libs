/**
 * Authentication Types
 * 
 * Type definitions for authentication system.
 * Extends core app types with auth-specific interfaces.
 * Max 200 lines - Zero Monolith Policy
 */

import type { AppError } from './app.js';

// =============================================================================
// Authentication Method Types
// =============================================================================

export type AuthMethod = 'extension' | 'temporary' | 'imported';

export interface ExtensionInfo {
	readonly name: string;
	readonly isAvailable: boolean;
	readonly version?: string;
}

export interface SupportedExtensions {
	readonly alby: ExtensionInfo;
	readonly nos2x: ExtensionInfo;
	readonly getNostr: ExtensionInfo;
}

// =============================================================================
// Key Management Types
// =============================================================================

export interface KeyPair {
	readonly publicKey: string;
	readonly privateKey: string;
	readonly method: AuthMethod;
	readonly createdAt: number;
}

export interface TemporaryKeyConfig {
	readonly entropy: Uint8Array;
	readonly validateEntropy: boolean;
	readonly secureRandom: boolean;
}

export interface KeyValidation {
	readonly isValid: boolean;
	readonly errors: string[];
	readonly warnings: string[];
}

export interface KeyExport {
	readonly publicKey: string;
	readonly privateKey?: string; // Only for temporary keys
	readonly method: AuthMethod;
	readonly format: 'hex' | 'nsec' | 'npub';
	readonly encrypted: boolean;
}

export interface KeyImport {
	readonly data: string;
	readonly format: 'hex' | 'nsec' | 'npub';
	readonly password?: string;
}

// =============================================================================
// Authentication State Types
// =============================================================================

export interface AuthenticationState {
	readonly isAuthenticated: boolean;
	readonly isInitialized: boolean;
	readonly method: AuthMethod | null;
	readonly publicKey: string | null;
	readonly profile: UserProfile | null;
	readonly sessionStarted: number | null;
	readonly lastActivity: number | null;
}

export interface UserProfile {
	readonly pubkey: string;
	readonly name?: string;
	readonly about?: string;
	readonly picture?: string;
	readonly nip05?: string;
	readonly lud16?: string;
	readonly verified: boolean;
}

export interface SessionConfig {
	readonly timeoutMinutes: number;
	readonly extendOnActivity: boolean;
	readonly rememberSession: boolean;
	readonly autoLogout: boolean;
}

// =============================================================================
// Authentication Flow Types
// =============================================================================

export interface LoginRequest {
	readonly method: AuthMethod;
	readonly keyData?: KeyImport;
	readonly rememberMe?: boolean;
}

export interface LoginResult {
	readonly success: boolean;
	readonly user?: UserProfile;
	readonly publicKey?: string;
	readonly method?: AuthMethod;
	readonly sessionId?: string;
	readonly error?: AppError;
}

export interface LogoutResult {
	readonly success: boolean;
	readonly error?: AppError;
}

export interface ExtensionAuthResult {
	readonly available: boolean;
	readonly publicKey?: string;
	readonly error?: string;
}

// =============================================================================
// Security Types
// =============================================================================

export interface SecurityContext {
	readonly isSecureContext: boolean;
	readonly hasUserGesture: boolean;
	readonly isLocalhost: boolean;
	readonly protocol: string;
}

export interface EncryptionConfig {
	readonly algorithm: string;
	readonly keyLength: number;
	readonly iterations: number;
	readonly salt: Uint8Array;
}

export interface SecureStorage {
	store(key: string, value: string, encrypted?: boolean): Promise<void>;
	retrieve(key: string, encrypted?: boolean): Promise<string | null>;
	remove(key: string): Promise<void>;
	clear(): Promise<void>;
	exists(key: string): Promise<boolean>;
}

// =============================================================================
// Error Types
// =============================================================================

export type AuthErrorCode = 
	| 'NO_EXTENSION'
	| 'EXTENSION_DENIED'
	| 'INVALID_KEY'
	| 'WEAK_ENTROPY'
	| 'STORAGE_FAILED'
	| 'SESSION_EXPIRED'
	| 'SIGNATURE_FAILED'
	| 'NETWORK_ERROR';

export interface AuthError extends AppError {
	readonly code: AuthErrorCode;
	readonly method?: AuthMethod;
	readonly recoverable: boolean;
}

// =============================================================================
// Event Types
// =============================================================================

export interface AuthEvent {
	readonly type: 'login' | 'logout' | 'session_expired' | 'profile_updated';
	readonly timestamp: number;
	readonly data?: unknown;
}

export type AuthEventHandler = (event: AuthEvent) => void;

// =============================================================================
// Validation Functions
// =============================================================================

export function isValidPublicKey(pubkey: string): boolean {
	return /^[0-9a-fA-F]{64}$/.test(pubkey);
}

export function isValidPrivateKey(privkey: string): boolean {
	return /^[0-9a-fA-F]{64}$/.test(privkey);
}

export function isNsecFormat(key: string): boolean {
	return key.startsWith('nsec1') && key.length === 63;
}

export function isNpubFormat(key: string): boolean {
	return key.startsWith('npub1') && key.length === 63;
}

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
	timeoutMinutes: 480, // 8 hours
	extendOnActivity: true,
	rememberSession: false,
	autoLogout: true
} as const;

export const INITIAL_AUTH_STATE: AuthenticationState = {
	isAuthenticated: false,
	isInitialized: false,
	method: null,
	publicKey: null,
	profile: null,
	sessionStarted: null,
	lastActivity: null
} as const;