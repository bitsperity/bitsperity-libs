/**
 * Nostr Service Wrapper
 * 
 * Service layer wrapper for nostr-unchained library.
 * Provides app-specific abstractions and error handling.
 * Max 200 lines - Zero Monolith Policy
 */

import { NostrUnchained, createFeed, query } from 'nostr-unchained';
import type { ServiceResult } from '../types/app.js';
import { createNostrError, errorProcessor } from '../utils/ErrorHandler.js';
import { createContextLogger } from '../utils/Logger.js';

// =============================================================================
// Nostr Service Types
// =============================================================================

export interface NostrConfig {
	readonly relays: string[];
	readonly debug: boolean;
	readonly timeout: number;
}

export interface ConnectionStatus {
	readonly isConnected: boolean;
	readonly connectedRelays: string[];
	readonly failedRelays: string[];
}

export interface PublishStatus {
	readonly eventId: string;
	readonly success: boolean;
	readonly relayResults: Array<{
		relay: string;
		success: boolean;
		error?: string;
	}>;
}

// =============================================================================
// Nostr Service Implementation
// =============================================================================

export class NostrService {
	private readonly logger = createContextLogger('NostrService');
	private readonly nostr: NostrUnchained;
	private readonly config: NostrConfig;

	constructor(config: NostrConfig) {
		this.config = config;
		this.nostr = new NostrUnchained({
			relays: config.relays,
			debug: config.debug,
			timeout: config.timeout
		});

		this.logger.info('NostrService initialized', {
			relayCount: config.relays.length,
			debug: config.debug
		});
	}

	// =============================================================================
	// Connection Management
	// =============================================================================

	async connect(): Promise<ServiceResult<ConnectionStatus>> {
		try {
			this.logger.info('Connecting to relays...');
			
			await this.nostr.connect();
			
			const status: ConnectionStatus = {
				isConnected: this.nostr.connectedRelays.length > 0,
				connectedRelays: this.nostr.connectedRelays,
				failedRelays: this.config.relays.filter(
					relay => !this.nostr.connectedRelays.includes(relay)
				)
			};

			this.logger.info('Connection attempt completed', status);

			return {
				success: status.isConnected,
				data: status
			};

		} catch (error) {
			const appError = createNostrError('Failed to connect to relays');
			this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	async disconnect(): Promise<ServiceResult<void>> {
		try {
			this.logger.info('Disconnecting from relays...');
			
			await this.nostr.disconnect();
			
			this.logger.info('Disconnected successfully');
			
			return { success: true };

		} catch (error) {
			const appError = createNostrError('Failed to disconnect from relays');
			this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	getConnectionStatus(): ConnectionStatus {
		return {
			isConnected: this.nostr.connectedRelays.length > 0,
			connectedRelays: this.nostr.connectedRelays,
			failedRelays: this.config.relays.filter(
				relay => !this.nostr.connectedRelays.includes(relay)
			)
		};
	}

	// =============================================================================
	// Authentication
	// =============================================================================

	async hasExtension(): Promise<boolean> {
		try {
			return await this.nostr.hasExtension();
		} catch (error) {
			this.logger.error('Error checking extension availability', { error });
			return false;
		}
	}

	async getPublicKey(): Promise<ServiceResult<string>> {
		try {
			const publicKey = await this.nostr.getExtensionPubkey();
			
			this.logger.info('Retrieved public key', { 
				publicKey: publicKey.substring(0, 16) + '...' 
			});
			
			return {
				success: true,
				data: publicKey
			};

		} catch (error) {
			const appError = createNostrError('Failed to get public key from extension');
			this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	// =============================================================================
	// Publishing
	// =============================================================================

	async publish(content: string): Promise<any> {
		try {
			const result = await this.nostr.publish(content);
			return result;
		} catch (error) {
			throw error;
		}
	}

	async publishNote(content: string): Promise<ServiceResult<PublishStatus>> {
		try {
			this.logger.info('Publishing note', { 
				contentLength: content.length,
				preview: content.substring(0, 50) + '...'
			});
			
			const result = await this.nostr.publish(content);
			
			const status: PublishStatus = {
				eventId: result.eventId || '',
				success: result.success,
				relayResults: result.relayResults.map(relay => ({
					relay: relay.relay,
					success: relay.success,
					error: relay.error
				}))
			};

			this.logger.info('Note published', status);
			
			return {
				success: result.success,
				data: status
			};

		} catch (error) {
			const appError = createNostrError('Failed to publish note');
			this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	// =============================================================================
	// Query Methods
	// =============================================================================

	query() {
		// Get subscription manager through clean public API
		return query(this.nostr.getSubscriptionManager());
	}


	// =============================================================================
	// Utility Methods
	// =============================================================================

	getStats() {
		return this.nostr.getStats();
	}

	getConfiguredRelays(): string[] {
		return [...this.config.relays];
	}

	getConnectedRelays(): string[] {
		return this.nostr.connectedRelays;
	}
}

// =============================================================================
// Service Factory
// =============================================================================

export function createNostrService(config: NostrConfig): NostrService {
	return new NostrService(config);
}