/**
 * Nostr Service Wrapper
 * 
 * Service layer wrapper for nostr-unchained library.
 * Provides app-specific abstractions and error handling.
 * Max 200 lines - Zero Monolith Policy
 */

import { NostrUnchained, TemporarySigner, ExtensionSigner } from 'nostr-unchained';
import type { ServiceResult } from '../types/app.js';
import { createNostrError, createValidationError, errorProcessor } from '../utils/ErrorHandler.js';
import { normalizeRecipientToHex } from '../utils/nostr.js';
import { createContextLogger } from '../utils/Logger.js';

// =============================================================================
// Nostr Service Types
// =============================================================================

export interface NostrConfig {
    readonly relays: string[];
    readonly debug: boolean;
    readonly timeout: number;
    readonly routing?: 'none' | 'nip65';
}

export interface ConnectionStatus {
	readonly isConnected: boolean;
	readonly connectedRelays: string[];
	readonly failedRelays: string[];
}

export interface RelayHealth {
    relay: string;
    ok: boolean;
    latencyMs?: number;
}

export interface BookmarkState {
    items: string[];
    updatedAt?: number;
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
    private nostr: any | null = null;
	private readonly config: NostrConfig;
	private signingProvider: any = null;
    private routingMode: 'none' | 'nip65' = 'nip65';

    constructor(config: NostrConfig) {
        this.config = config;
        const isTempAccount = sessionStorage.getItem('temp_signer_active') === 'true';
        console.log(`🏗️ NostrService constructor called with isTempAccount=${isTempAccount}`);
        this.routingMode = (config.routing as any) === 'nip65' ? 'nip65' : 'none';
        // Kein Auto-Init der Lib hier – Instanz wird erst nach Signer-Wahl erzeugt
        this.logger.info('NostrService initialized', undefined, {
            relayCount: config.relays.length,
            debug: config.debug,
            isTempAccount,
            routing: this.routingMode
        });
    }

    private async createInstance(provider?: any): Promise<void> {
        const base: any = {
            relays: this.config.relays,
            debug: this.config.debug,
            timeout: this.config.timeout,
            routing: this.routingMode,
            ...(provider ? { signingProvider: provider } : {})
        };
        this.nostr = new NostrUnchained(base as any);
        if (provider) {
            this.signingProvider = provider;
            try { await (this.nostr as any).initializeSigning(provider); } catch {}
        }
        try { await this.nostr.connect(); } catch {}
    }

	async setSigningProvider(provider: any): Promise<void> {
		try {
			this.signingProvider = provider;
			if (!this.nostr) {
				await this.createInstance(provider);
			} else {
				await (this.nostr as any).initializeSigning(provider);
			}
			// Optional: connect eagerly; inbox subscription wird lazy via getDM().with() gestartet
			try {
				await this.nostr.connect();
			} catch {}
				this.logger.info('NostrService updated existing Nostr instance with new signing provider');
				try {
					const info = (this.nostr as any)?.getSigningInfo?.();
					if (info?.method && info.method !== 'unknown') {
						this.logger.info(`Signer method active: ${info.method}`);
					}
				} catch {}
		} catch (error) {
            this.logger.error('Failed to set signing provider', undefined, { error });
			throw error;
		}
	}

	// =============================================================================
	// Connection Management
	// =============================================================================

	async connect(): Promise<ServiceResult<ConnectionStatus>> {
		try {
			this.logger.info('Connecting to relays...');
			if (!this.nostr) {
				return { success: false, error: errorProcessor.process(new Error('Nostr not initialized')) } as any;
			}
			await this.nostr?.connect?.();
			
			const status: ConnectionStatus = {
				isConnected: this.nostr.connectedRelays.length > 0,
				connectedRelays: this.nostr.connectedRelays,
				failedRelays: this.config.relays.filter(
					relay => !this.nostr.connectedRelays.includes(relay)
				)
			};

            this.logger.info('Connection attempt completed', undefined, status);

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
		if (!this.nostr) {
			return { isConnected: false, connectedRelays: [], failedRelays: this.config.relays.slice() };
		}
		return {
			isConnected: this.nostr.connectedRelays.length > 0,
			connectedRelays: this.nostr.connectedRelays,
			failedRelays: this.config.relays.filter(relay => !this.nostr.connectedRelays.includes(relay))
		};
	}

	// =============================================================================
	// Authentication
	// =============================================================================

	async hasExtension(): Promise<boolean> {
		try {
			return await this.nostr.hasExtension();
		} catch (error) {
            this.logger.error('Error checking extension availability', undefined, { error });
			return false;
		}
	}

	async getPublicKey(): Promise<ServiceResult<string>> {
		try {
			const publicKey = await this.nostr.getPublicKey();
			
            this.logger.info('Retrieved public key', undefined, { 
				publicKey: publicKey.substring(0, 16) + '...' 
			});
			
			return {
				success: true,
				data: publicKey
			};

		} catch (error) {
			const appError = createNostrError('Failed to get public key');
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

  async publishDM(recipientInput: string, content: string): Promise<any> {
		try {
      // Validate and normalize recipient
      const recipient = normalizeRecipientToHex(recipientInput);
      if (!recipient.ok || !recipient.hex) {
        const err = createValidationError('Ungültiger Empfänger (erwarte hex oder npub)');
        return { success: false, error: errorProcessor.process(err) };
      }
			// Use the correct API: getDM() returns DMModule or undefined
			const dmModule = this.nostr.getDM();
			if (!dmModule) {
				throw new Error('DM module not available');
			}
			
			// Get or create conversation with recipient - this triggers lazy loading
      const conversation = dmModule.with(recipient.hex);
			
			// Send encrypted message
			const result = await conversation.send(content);
			
			this.logger.info('DM sent', undefined, { 
        recipient: recipient.hex.substring(0, 8) + '...',
					success: result.success 
				});
			
			return result;
		} catch (error) {
            this.logger.error('Failed to send DM', undefined, { error });
			throw error;
		}
	}

	async getDMConversation(pubkey: string) {
		try {
			// Use the correct API: getDM() returns DMModule or undefined
			const dmModule = this.nostr.getDM();
			if (!dmModule) {
				throw new Error('DM module not available');
			}
			
			// This returns the DMConversation instance with reactive stores
			// Lazy loading is triggered automatically by getDM().with()
			const conversation = dmModule.with(pubkey);
			
            this.logger.info('Retrieved DM conversation instance', undefined, { 
				pubkey: pubkey.substring(0, 8) + '...'
			});
			
			return conversation;
		} catch (error) {
            this.logger.error('Failed to get DM conversation', undefined, { error });
			throw error;
		}
	}
	
	async startDMInboxSubscription(): Promise<void> {
		try {
			// Start the universal gift wrap subscription (lazy loading)
			await this.nostr.startUniversalGiftWrapSubscription();
			
			this.logger.info('Universal gift wrap subscription active');
		} catch (error) {
            this.logger.error('Failed to start DM inbox subscription', undefined, { error });
			throw error;
		}
	}

	async publishNote(content: string): Promise<ServiceResult<PublishStatus>> {
		try {
            this.logger.info('Publishing note', undefined, { 
				contentLength: content.length,
				preview: content.substring(0, 50) + '...'
			});
			
			const result = await this.nostr.publish(content);
			
            const status: PublishStatus = {
				eventId: result.eventId || '',
				success: result.success,
                relayResults: result.relayResults.map((relay: any) => ({
					relay: relay.relay,
					success: relay.success,
					error: relay.error
				}))
			};

            this.logger.info('Note published', undefined, status);
			
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
		// Expose the library's QueryBuilder directly for fluent API usage
		return this.nostr?.query?.();
	}

	// =============================================================================
	// Relay Health (NIP-66 lite)
	// =============================================================================

	async checkRelayHealth(relay: string, timeoutMs: number = 2000): Promise<RelayHealth> {
		try {
			const info = await (this.nostr as any)?.relayHealth?.check?.(relay, timeoutMs);
			let ok = !!info?.ok;
			let latencyMs = typeof info?.latencyMs === 'number' ? info.latencyMs : undefined;
			// Fallback: wenn keine Latenz geliefert wird, per WebSocket messen
			if (!(latencyMs > 0)) {
				try {
					const measured = await this.measureWebSocketLatency(relay, Math.min(timeoutMs, 1500));
					if (typeof measured === 'number') {
						latencyMs = measured;
						ok = ok || measured > 0;
					}
				} catch {}
			}
			return { relay, ok, latencyMs };
		} catch {
			return { relay, ok: false };
		}
	}

	async bulkCheckRelayHealth(relays: string[], timeoutMs: number = 2000): Promise<RelayHealth[]> {
		const unique = Array.from(new Set(relays || []));
		const checks = unique.map((r) => this.checkRelayHealth(r, timeoutMs));
		return await Promise.all(checks);
	}

	/**
	 * Minimaler WS-Latency-Messer (Open→Close) als Fallback.
	 */
	private async measureWebSocketLatency(relayUrl: string, timeoutMs: number): Promise<number | undefined> {
		return new Promise<number | undefined>((resolve) => {
			let url = relayUrl?.trim();
			if (!/^wss?:\/\//i.test(url)) {
				url = 'wss://' + url.replace(/^\/*/, '');
			}
			let done = false;
			const started = performance.now();
			let timer: any;
			try {
				const ws = new (window as any).WebSocket(url);
				const finalize = (value: number | undefined) => {
					if (done) return;
					done = true;
					try { clearTimeout(timer); } catch {}
					try { ws.close(); } catch {}
					resolve(value);
				};
				timer = setTimeout(() => finalize(undefined), timeoutMs);
				ws.onopen = () => {
					const ms = Math.max(1, Math.round(performance.now() - started));
					finalize(ms);
				};
				ws.onerror = () => finalize(undefined);
			} catch {
				resolve(undefined);
			}
		});
	}

	// =============================================================================
	// Event Builder API
	// =============================================================================

	/**
	 * Access the FluentEventBuilder API
	 */
	events() {
		return this.nostr.events;
	}


	// =============================================================================
	// Utility Methods
	// =============================================================================

	getStats() {
		return this.nostr?.getStats?.();
	}

	getConfiguredRelays(): string[] {
		return [...this.config.relays];
	}

	getConnectedRelays(): string[] {
		return this.nostr ? this.nostr.connectedRelays : [];
	}

	// =============================================================================
	// Bookmarks (NIP-51, kind 30003, d='bookmarks')
	// =============================================================================

	private loadLocalBookmarks(): BookmarkState {
		try {
			const raw = localStorage.getItem('nostr_bookmarks');
			if (!raw) return { items: [] };
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed?.items)) return { items: parsed.items, updatedAt: parsed.updatedAt };
		} catch {}
		return { items: [] };
	}

	private saveLocalBookmarks(state: BookmarkState): void {
		try { localStorage.setItem('nostr_bookmarks', JSON.stringify(state)); } catch {}
	}

	/** Subscribe+query remote bookmarks into cache; merge into local snapshot for F5 persistence */
	async syncBookmarks(): Promise<BookmarkState> {
		if (!this.nostr) return this.loadLocalBookmarks();
		try {
			const me = await (this.nostr as any).getPublicKey();
			// subscription-first to ensure cache fill
			(this.nostr as any).lists.get(me, 30003, 'bookmarks');
			const store = (this.nostr as any).lists.get(me, 30003, 'bookmarks');
			return await new Promise<BookmarkState>((resolve) => {
				const unsub = store.subscribe((list: any) => {
					try {
						if (list?.e) {
							const ids = Array.from(new Set(list.e.map((x: any) => x.id)));
							const snapshot = { items: ids, updatedAt: Date.now() } as BookmarkState;
							this.saveLocalBookmarks(snapshot);
							resolve(snapshot);
							try { unsub && unsub(); } catch {}
						}
					} catch { resolve(this.loadLocalBookmarks()); }
				});
				// Fallback after 1s
				setTimeout(() => resolve(this.loadLocalBookmarks()), 1000);
			});
		} catch { return this.loadLocalBookmarks(); }
	}

	getBookmarksSnapshot(): BookmarkState {
		return this.loadLocalBookmarks();
	}

	async hasBookmark(eventId: string, timeoutMs: number = 2000): Promise<boolean | null> {
		const remote = await this.fetchRemoteBookmarkIds(timeoutMs);
		if (Array.isArray(remote)) return remote.includes(eventId);
		return null; // Remote-Stand unbekannt
	}

	/**
	 * Robust preflight: fetch remote bookmark ids (replaceable 30003,d=bookmarks) with a short timeout.
	 * Returns null if not fetched in time.
	 */
	private async fetchRemoteBookmarkIds(timeoutMs: number = 1500): Promise<string[] | null> {
		try {
			await this.nostr?.connect?.();
			const me = await (this.nostr as any).getPublicKey();
			// ensure subscription to fill cache quickly
			await (this.nostr as any).sub().kinds([30003]).authors([me]).tags('d', ['bookmarks']).limit(1).execute();
			const store = (this.nostr as any).query().kinds([30003]).authors([me]).tags('d', ['bookmarks']).limit(1).execute();
			return await new Promise<string[] | null>((resolve) => {
				let done = false;
				let timer: any;
				try {
					const unsub = store.subscribe((events: any[]) => {
						if (done) return;
						done = true;
						try { clearTimeout(timer); } catch {}
						try { unsub && unsub(); } catch {}
						const ev = Array.isArray(events) && events.length > 0 ? events[0] : null;
						if (!ev) return resolve([]);
						const ids = (ev.tags || []).filter((t: any) => Array.isArray(t) && t[0] === 'e').map((t: any) => t[1]).filter(Boolean);
						resolve(Array.from(new Set(ids)));
					});
					timer = setTimeout(() => {
						if (done) return;
						done = true;
						resolve(null);
					}, timeoutMs);
				} catch { resolve(null); }
			});
		} catch { return null; }
	}

	async addBookmark(eventId: string): Promise<boolean> {
		if (!this.nostr) return false;
		await this.nostr.connect?.();
		// Strong preflight against remote state to avoid re-publishing an identical list
		const remote = await this.fetchRemoteBookmarkIds(2000);
		if (remote === null) { await this.syncBookmarks().catch(()=>{}); return false; }
		if (Array.isArray(remote) && remote.includes(eventId)) return false;
		const current = await this.syncBookmarks();
		if (current.items.includes(eventId)) return false;
		const next = Array.from(new Set([eventId, ...current.items]));
		// Delta-check against remote
		const deltaNeeded = next.some(id => !remote.includes(id)) || remote.some(id => !next.includes(id));
		if (!deltaNeeded) return false;
		// Publish replaceable 30003 with combined items
		let b = (this.nostr as any).lists.edit(30003, 'bookmarks');
		if ((b as any).title) b = b.title('Bookmarks');
		for (const id of next) b = b.addEvent(id);
		await b.publish();
		this.saveLocalBookmarks({ items: next, updatedAt: Date.now() });
		return true;
	}

	async removeBookmark(eventId: string): Promise<boolean> {
		if (!this.nostr) return false;
		await this.nostr.connect?.();
		const remote = await this.fetchRemoteBookmarkIds(2000);
		if (remote === null) { await this.syncBookmarks().catch(()=>{}); return false; }
		if (!remote.includes(eventId)) return false;
		const current = await this.syncBookmarks();
		const next = current.items.filter((id) => id !== eventId);
		// Delta-check against remote
		const deltaNeeded = next.some(id => !remote.includes(id)) || remote.some(id => !next.includes(id));
		if (!deltaNeeded) return false;
		let b = (this.nostr as any).lists.edit(30003, 'bookmarks');
		if ((b as any).title) b = b.title('Bookmarks');
		for (const id of next) b = b.addEvent(id);
		await b.publish();
		this.saveLocalBookmarks({ items: next, updatedAt: Date.now() });
		return true;
	}

    /** Routing Mode Control (opt-in NIP-65) */
    getRoutingMode(): 'none' | 'nip65' {
        return this.routingMode;
    }

    async setRoutingMode(mode: 'none' | 'nip65'): Promise<void> {
        if (mode === this.routingMode) return;
        this.routingMode = mode;
        try {
            const prevSigner = this.signingProvider || (this.nostr as any)?.signingProvider || null;
            const wasConnected = (this.nostr.connectedRelays || []).length > 0;
            try { await this.nostr.disconnect(); } catch {}
            this.nostr = new NostrUnchained({
                relays: this.config.relays,
                debug: this.config.debug,
                timeout: this.config.timeout,
                routing: this.routingMode,
                ...(prevSigner ? { signingProvider: prevSigner } : {})
            } as any);
            if (prevSigner) {
                try { await (this.nostr as any).initializeSigning(prevSigner); } catch {}
            }
            if (wasConnected) {
                try { await this.nostr.connect(); } catch {}
            }
            try { localStorage.setItem('nostr_routing', this.routingMode); } catch {}
        } catch (error) {
            this.logger.error('Failed to set routing mode', undefined, { error });
            throw error;
        }
    }

    /** Update configured relay endpoints and reconnect */
    async setRelays(relays: string[]): Promise<void> {
        try {
            const prevSigner = this.signingProvider || (this.nostr as any)?.signingProvider || null;
            const wasConnected = (this.nostr.connectedRelays || []).length > 0;
            try { await this.nostr.disconnect(); } catch {}
            (this as any).config.relays = relays.slice();
            this.nostr = new NostrUnchained({
                relays,
                debug: this.config.debug,
                timeout: this.config.timeout,
                routing: this.routingMode,
                ...(prevSigner ? { signingProvider: prevSigner } : {})
            } as any);
            if (prevSigner) {
                try { await (this.nostr as any).initializeSigning(prevSigner); } catch {}
            }
            if (wasConnected) {
                try { await this.nostr.connect(); } catch {}
            }
            try { localStorage.setItem('nostr_relays', JSON.stringify(relays)); } catch {}
        } catch (error) {
            this.logger.error('Failed to update relays', undefined, { error });
            throw error;
        }
    }

    /** Publish Relay List Metadata (NIP-65) */
    async publishRelayList(opts: { read?: string[]; write?: string[]; both?: string[] } = {}): Promise<any> {
        try {
            // Ensure signing and connectivity
            try {
                const info = (this.nostr as any)?.getSigningInfo?.();
                if (!info || info.method === 'unknown') {
                    // Try to force signer readiness
                    await (this.nostr as any).getPublicKey();
                }
            } catch {}
            try { await this.nostr.connect(); } catch {}

            const mod: any = (this.nostr as any).relayList;
            const hasModule = !!(mod && typeof mod.edit === 'function');
            const normalize = (url: string) => {
                if (!url) return url;
                let u = url.trim();
                if (!/^wss?:\/\//i.test(u)) {
                    const host = u.replace(/^[\/]+/, '');
                    const isLocal = /(^localhost(?::\d+)?$)|(^127\.0\.0\.1(?::\d+)?$)|((?:^|\.)local(?::\d+)?$)/i.test(host);
                    u = (isLocal ? 'ws://' : 'wss://') + host;
                }
                // strip trailing single slash
                u = u.replace(/\/$/, '');
                // Preserve provided scheme; DO NOT upcast ws->wss to support LAN relays
                return u;
            };
            let b: any = hasModule ? mod.edit() : null;
            const both = (opts.both || []).map(normalize);
            const read = (opts.read || []).map(normalize).filter((u) => !both.includes(u));
            const write = (opts.write || []).map(normalize).filter((u) => !both.includes(u));
            // de-dup
            const seen = new Set<string>();
            const pushUnique = (list: string[]) => list.filter((u) => (u && !seen.has(u) ? (seen.add(u), true) : false));
            const bothU = pushUnique(both);
            const readU = pushUnique(read);
            const writeU = pushUnique(write);
            let res: any;
            if (hasModule) {
                for (const u of bothU) { if (b.both) b = b.both(u); else { b = b.read(u).write(u); } }
                for (const u of readU) { b = b.read(u); }
                for (const u of writeU) { b = b.write(u); }
                res = await b.publish();
            } else {
                // Fallback: Build 10002 event directly via fluent builder
                const builder = (this.nostr as any).events.kind(10002).content('');
                for (const u of readU) builder.tag('r', u, 'read');
                for (const u of writeU) builder.tag('r', u, 'write');
                for (const u of bothU) builder.tag('r', u);
                res = await builder.publish();
            }
            // Guard: if result comes back falsy or unsuccessful, throw explicit error
            if (!res || res.success === false) {
                const msg = res?.error?.message || 'Publish failed (unknown)';
                throw new Error(msg);
            }
            return res;
        } catch (error) {
            this.logger.error('Failed to publish relay list', undefined, { error });
            throw error;
        }
    }

	/**
	 * Use browser extension for signing (User Control)
	 */
	async useExtensionSigner(): Promise<ServiceResult<string>> {
		try {
			const result = await this.nostr.useExtensionSigner();
			
			if (result.success) {
				// Ensure method label is 'extension' by forcing a canonical ExtensionSigner wrapper
				try { await (this.nostr as any).initializeSigning(new ExtensionSigner() as any); } catch {}
				// Preserve provider for future re-initializations
				try { this.signingProvider = (this.nostr as any)?.signingProvider || this.signingProvider; } catch {}
                this.logger.info('Switched to extension signer', undefined, { 
					pubkey: result.pubkey?.substring(0, 16) + '...' 
				});
				
				return {
					success: true,
					data: result.pubkey || ''
				};
			} else {
				return {
					success: false,
					error: errorProcessor.process(new Error(result.error))
				};
			}
		} catch (error) {
			const appError = createNostrError('Failed to use extension signer');
            this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	/**
	 * Use local key signer (User Control)
	 */
	async useLocalKeySigner(): Promise<ServiceResult<string>> {
		try {
			const result = await this.nostr.useLocalKeySigner();
			
			if (result.success) {
                this.logger.info('Switched to local key signer', undefined, { 
					pubkey: result.pubkey?.substring(0, 16) + '...' 
				});
				
				return {
					success: true,
					data: result.pubkey || ''
				};
			} else {
				return {
					success: false,
					error: errorProcessor.process(new Error(result.error))
				};
			}
		} catch (error) {
			const appError = createNostrError('Failed to use local key signer');
            this.logger.logError(appError);
			
			return {
				success: false,
				error: errorProcessor.process(error)
			};
		}
	}

	/**
	 * Get current signing method info
	 */
	getSigningInfo() {
		return this.nostr.getSigningInfo();
	}

	/**
	 * Create a new temporary account with fresh keys
	 */
	async createTemporaryAccount(): Promise<ServiceResult<string>> {
		try {
			// ALWAYS create a fresh temporary signer with new random keys
			// This ensures each temporary account has unique keys
			const tempSigner = new TemporarySigner();
			this.signingProvider = tempSigner;
			// Update existing instance instead of creating a new one
			await (this.nostr as any).initializeSigning(tempSigner);
			
			// Get the new unique public key
			const tempPublicKey = await tempSigner.getPublicKey();
			// Note: Private key is handled internally by the signing provider
			
			// Clear any old temp data and store fresh public key
			sessionStorage.removeItem('temp_private_key');
			sessionStorage.removeItem('temp_public_key');
			sessionStorage.setItem('temp_public_key', tempPublicKey);
			sessionStorage.setItem('temp_signer_active', 'true');
			
            this.logger.info('New temporary account created with unique keys', undefined, { 
				publicKey: tempPublicKey.substring(0, 16) + '...'
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

	/**
	 * Expose the single NostrUnchained instance
	 */
    getInstance(): any {
		return this.nostr;
	}
}

// =============================================================================
// Service Factory
// =============================================================================

export function createNostrService(config: NostrConfig): NostrService {
	return new NostrService(config);
}