/**
 * Nostr Service Wrapper
 * 
 * Service layer wrapper for nostr-unchained library.
 * Provides app-specific abstractions and error handling.
 * Max 200 lines - Zero Monolith Policy
 */

import { NostrUnchained, query, TemporarySigner } from 'nostr-unchained';
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
	private nostr: NostrUnchained;
	private readonly config: NostrConfig;
	private signingProvider: any = null;

	constructor(config: NostrConfig) {
		this.config = config;
		
		// Check if we're using a temporary account
		const isTempAccount = sessionStorage.getItem('temp_signer_active') === 'true';
		
		console.log(`🏗️ NostrService constructor called with isTempAccount=${isTempAccount}`);
		
		if (isTempAccount) {
			// Create a NEW temporary signer every time the service is created
			// This ensures fresh keys for each temporary account session
			const tempSigner = new TemporarySigner();
			this.nostr = new NostrUnchained({
				relays: config.relays,
				debug: true, // Enable debug for temporary accounts
				timeout: config.timeout,
				signingProvider: tempSigner
			});
			this.signingProvider = tempSigner;
		} else {
			// Let NostrUnchained auto-detect the best available signing provider
			this.nostr = new NostrUnchained({
				relays: config.relays,
				debug: config.debug,
				timeout: config.timeout
			});
		}

		this.logger.info('NostrService initialized', {
			relayCount: config.relays.length,
			debug: config.debug,
			isTempAccount
		});
	}

	async setSigningProvider(provider: any): Promise<void> {
		try {
			this.signingProvider = provider;
			
			// Recreate NostrUnchained with the new signing provider
			this.nostr = new NostrUnchained({
				relays: this.config.relays,
				debug: this.config.debug,
				timeout: this.config.timeout,
				signingProvider: provider
			});
			
			this.logger.info('NostrService recreated with new signing provider');
		} catch (error) {
			this.logger.error('Failed to set signing provider', { error });
			throw error;
		}
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

	async publishDM(recipientPubkey: string, content: string): Promise<any> {
		try {
			// Ensure we have initialized signing
			await this.nostr.initializeSigning();
			
			// Update DM module with signing provider if available
			if (this.signingProvider) {
				await this.nostr.dm.updateSigningProvider(this.signingProvider);
			}
			
			// Get or create conversation with recipient (asynchronous)
			const conversation = await this.nostr.dm.with(recipientPubkey);
			
			// Send encrypted message
			const result = await conversation.send(content);
			
			this.logger.info('DM sent', { 
				recipient: recipientPubkey.substring(0, 8) + '...',
				success: result.success 
			});
			
			return result;
		} catch (error) {
			this.logger.error('Failed to send DM', { error });
			throw error;
		}
	}

	async getDMConversation(pubkey: string) {
		try {
			// Ensure signing is initialized
			await this.nostr.initializeSigning();
			
			// Update DM module with signing provider
			if (this.signingProvider) {
				await this.nostr.dm.updateSigningProvider(this.signingProvider);
			}
			
			// This returns the DMConversation instance with reactive stores
			const conversation = await this.nostr.dm.with(pubkey);
			
			this.logger.info('Retrieved DM conversation instance', { 
				pubkey: pubkey.substring(0, 8) + '...',
				hasMessages: !!conversation.messages,
				hasStatus: !!conversation.status
			});
			
			return conversation;
		} catch (error) {
			this.logger.error('Failed to get DM conversation', { error });
			throw error;
		}
	}
	
	async startDMInboxSubscription(): Promise<void> {
		try {
			// Initialize signing first
			await this.nostr.initializeSigning();
			
			// Update DM module with signing provider
			if (this.signingProvider) {
				await this.nostr.dm.updateSigningProvider(this.signingProvider);
			}
			
			// Start a subscription for incoming gift-wrapped DMs (NIP-17)
			// This will listen for kind 1059 events directed at our pubkey
			const ourPubkey = this.signingProvider ? 
				await this.signingProvider.getPublicKey() : 
				await this.nostr.getExtensionPubkey();
			
			// The DM module automatically handles inbox subscriptions when conversations are created
			// For now, we'll rely on the per-conversation subscriptions
			this.logger.info('DM inbox subscription prepared (handled per-conversation)');
		} catch (error) {
			this.logger.error('Failed to start DM inbox subscription', { error });
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

	/**
	 * Create a new temporary account with fresh keys
	 */
	async createTemporaryAccount(): Promise<ServiceResult<string>> {
		try {
			// ALWAYS create a fresh temporary signer with new random keys
			// This ensures each temporary account has unique keys
			const tempSigner = new TemporarySigner();
			
			// Completely recreate NostrUnchained instance with the new signer
			// This ensures no state from previous temporary accounts is carried over
			this.nostr = new NostrUnchained({
				relays: this.config.relays,
				debug: true, // Enable debug for temporary accounts
				timeout: this.config.timeout,
				signingProvider: tempSigner
			});
			this.signingProvider = tempSigner;
			
			// Get the new unique public and private keys
			const tempPublicKey = await tempSigner.getPublicKey();
			const tempPrivateKey = await tempSigner.getPrivateKeyForEncryption();
			
			// Clear any old temp data and store fresh keys
			sessionStorage.removeItem('temp_private_key');
			sessionStorage.removeItem('temp_public_key');
			sessionStorage.setItem('temp_private_key', tempPrivateKey);
			sessionStorage.setItem('temp_public_key', tempPublicKey);
			sessionStorage.setItem('temp_signer_active', 'true');
			
			this.logger.info('New temporary account created with unique keys', { 
				publicKey: tempPublicKey.substring(0, 16) + '...',
				privateKeyPrefix: tempPrivateKey.substring(0, 8) + '...'
			} as any);
			
			return {
				success: true,
				data: tempPublicKey
			};
		} catch (error) {
			const appError = createNostrError('Failed to create temporary account');
			this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}
}

// =============================================================================
// Service Factory
// =============================================================================

export function createNostrService(config: NostrConfig): NostrService {
	return new NostrService(config);
}