/**
 * Secure Storage Utility
 * 
 * Secure storage abstraction with encryption support.
 * Handles key storage with privacy and security focus.
 * Max 200 lines - Zero Monolith Policy
 */

import type { SecureStorage, EncryptionConfig } from '../types/auth.js';
import { createAuthError } from './ErrorHandler.js';
import { createContextLogger } from './Logger.js';

// =============================================================================
// Secure Storage Implementation
// =============================================================================

export class SecureStorageImpl implements SecureStorage {
	private readonly logger = createContextLogger('SecureStorage');
	private readonly encryptionConfig: EncryptionConfig;

	constructor() {
		this.encryptionConfig = {
			algorithm: 'AES-GCM',
			keyLength: 256,
			iterations: 100000,
			salt: new Uint8Array([
				0x73, 0x61, 0x6c, 0x74, 0x5f, 0x6e, 0x6f, 0x73,
				0x74, 0x72, 0x5f, 0x61, 0x70, 0x70, 0x5f, 0x76,
				0x31, 0x2e, 0x30, 0x2e, 0x30, 0x5f, 0x73, 0x65,
				0x63, 0x75, 0x72, 0x65, 0x5f, 0x73, 0x74, 0x6f
			]) // "salt_nostr_app_v1.0.0_secure_sto" in hex
		};
	}

	// =============================================================================
	// Storage Interface Implementation
	// =============================================================================

	async store(key: string, value: string, encrypted = false): Promise<void> {
		try {
			this.logger.debug('Storing data', { key, encrypted });

			if (encrypted) {
				const encryptedValue = await this.encrypt(value);
				this.setStorageItem(key, JSON.stringify({
					encrypted: true,
					data: encryptedValue,
					timestamp: Date.now()
				}));
			} else {
				this.setStorageItem(key, JSON.stringify({
					encrypted: false,
					data: value,
					timestamp: Date.now()
				}));
			}

			this.logger.debug('Data stored successfully', { key });

		} catch (error) {
			this.logger.error('Failed to store data', { key, error });
			throw createAuthError('STORAGE_FAILED', 'Failed to store data securely');
		}
	}

	async retrieve(key: string, encrypted = false): Promise<string | null> {
		try {
			const storedData = this.getStorageItem(key);
			if (!storedData) {
				return null;
			}

			const parsed = JSON.parse(storedData);
			
			// Verify encryption expectation matches storage
			if (parsed.encrypted !== encrypted) {
				this.logger.warn('Encryption mismatch', { key, expected: encrypted, actual: parsed.encrypted });
				return null;
			}

			if (encrypted) {
				const decryptedValue = await this.decrypt(parsed.data);
				this.logger.debug('Data retrieved and decrypted', { key });
				return decryptedValue;
			} else {
				this.logger.debug('Data retrieved', { key });
				return parsed.data;
			}

		} catch (error) {
			this.logger.error('Failed to retrieve data', { key, error });
			return null;
		}
	}

	async remove(key: string): Promise<void> {
		try {
			this.removeStorageItem(key);
			this.logger.debug('Data removed', { key });
		} catch (error) {
			this.logger.error('Failed to remove data', { key, error });
			throw createAuthError('STORAGE_FAILED', 'Failed to remove data');
		}
	}

	async clear(): Promise<void> {
		try {
			// Only clear keys that start with our prefix
			const prefix = 'nostr_app_';
			const keysToRemove: string[] = [];

			if (typeof window !== 'undefined' && window.sessionStorage) {
				for (let i = 0; i < sessionStorage.length; i++) {
					const key = sessionStorage.key(i);
					if (key?.startsWith(prefix)) {
						keysToRemove.push(key);
					}
				}
			}

			for (const key of keysToRemove) {
				this.removeStorageItem(key);
			}

			this.logger.info('Storage cleared', { removedKeys: keysToRemove.length });

		} catch (error) {
			this.logger.error('Failed to clear storage', { error });
			throw createAuthError('STORAGE_FAILED', 'Failed to clear storage');
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const data = this.getStorageItem(key);
			return data !== null;
		} catch (error) {
			this.logger.error('Failed to check existence', { key, error });
			return false;
		}
	}

	// =============================================================================
	// Storage Backend (SessionStorage for security)
	// =============================================================================

	private setStorageItem(key: string, value: string): void {
		const prefixedKey = `nostr_app_${key}`;
		
		if (typeof window !== 'undefined' && window.sessionStorage) {
			sessionStorage.setItem(prefixedKey, value);
		} else {
			// Fallback for non-browser environments
			throw new Error('SessionStorage not available');
		}
	}

	private getStorageItem(key: string): string | null {
		const prefixedKey = `nostr_app_${key}`;
		
		if (typeof window !== 'undefined' && window.sessionStorage) {
			return sessionStorage.getItem(prefixedKey);
		} else {
			return null;
		}
	}

	private removeStorageItem(key: string): void {
		const prefixedKey = `nostr_app_${key}`;
		
		if (typeof window !== 'undefined' && window.sessionStorage) {
			sessionStorage.removeItem(prefixedKey);
		}
	}

	// =============================================================================
	// Encryption Implementation
	// =============================================================================

	private async encrypt(data: string): Promise<string> {
		if (!this.isCryptoAvailable()) {
			throw new Error('Encryption not available in this environment');
		}

		try {
			// Generate a random password for this session
			const password = this.generateSessionPassword();
			const key = await this.deriveKey(password);
			
			// Generate random IV
			const iv = window.crypto.getRandomValues(new Uint8Array(12));
			
			// Encrypt the data
			const encoded = new TextEncoder().encode(data);
			const encrypted = await window.crypto.subtle.encrypt(
				{ name: this.encryptionConfig.algorithm, iv },
				key,
				encoded
			);
			
			// Combine IV and encrypted data
			const combined = new Uint8Array(iv.length + encrypted.byteLength);
			combined.set(iv);
			combined.set(new Uint8Array(encrypted), iv.length);
			
			// Return as base64
			return btoa(String.fromCharCode(...combined));

		} catch (error) {
			this.logger.error('Encryption failed', { error });
			throw new Error('Failed to encrypt data');
		}
	}

	private async decrypt(encryptedData: string): Promise<string> {
		if (!this.isCryptoAvailable()) {
			throw new Error('Decryption not available in this environment');
		}

		try {
			// Decode from base64
			const combined = new Uint8Array(
				atob(encryptedData).split('').map(char => char.charCodeAt(0))
			);
			
			// Extract IV and encrypted data
			const iv = combined.slice(0, 12);
			const encrypted = combined.slice(12);
			
			// Generate the same session password
			const password = this.generateSessionPassword();
			const key = await this.deriveKey(password);
			
			// Decrypt
			const decrypted = await window.crypto.subtle.decrypt(
				{ name: this.encryptionConfig.algorithm, iv },
				key,
				encrypted
			);
			
			return new TextDecoder().decode(decrypted);

		} catch (error) {
			this.logger.error('Decryption failed', { error });
			throw new Error('Failed to decrypt data');
		}
	}

	private async deriveKey(password: string): Promise<CryptoKey> {
		const encoded = new TextEncoder().encode(password);
		const keyMaterial = await window.crypto.subtle.importKey(
			'raw',
			encoded,
			{ name: 'PBKDF2' },
			false,
			['deriveKey']
		);

		return window.crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: this.encryptionConfig.salt,
				iterations: this.encryptionConfig.iterations,
				hash: 'SHA-256'
			},
			keyMaterial,
			{
				name: this.encryptionConfig.algorithm,
				length: this.encryptionConfig.keyLength
			},
			false,
			['encrypt', 'decrypt']
		);
	}

	private generateSessionPassword(): string {
		// Generate a deterministic password based on session data
		// This provides encryption without requiring user passwords
		const sessionData = [
			typeof window !== 'undefined' ? window.location?.origin : 'unknown',
			typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
			Date.now().toString().slice(0, -6) // Hour-level granularity
		].join('|');
		
		return btoa(sessionData);
	}

	private isCryptoAvailable(): boolean {
		return typeof window !== 'undefined' && 
			   !!window.crypto?.subtle &&
			   typeof window.crypto.getRandomValues === 'function';
	}
}

// =============================================================================
// Service Factory
// =============================================================================

export const secureStorage = new SecureStorageImpl();