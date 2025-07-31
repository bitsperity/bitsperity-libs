<!--
  Clean Nostr Terminal
  
  Developer-first Nostr explorer powered by DevExplorer
  Simple wrapper that just handles connection status
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { createContextLogger } from '../../utils/Logger.js';
	import DevExplorer from './DevExplorer.svelte';
	import type { AuthState } from '../../types/app.js';

	let { authState, onLogout, onShowKeys, nostr }: {
		authState: AuthState;
		onLogout: () => void;
		onShowKeys: () => void;
		nostr: any; // NostrUnchained instance
	} = $props();

	// =============================================================================
	// Simple Connection Status
	// =============================================================================

	let connectionStatus = $state({ isConnected: false, connectedRelays: [] });
	const logger = createContextLogger('NostrTerminal');

	onMount(async () => {
		await checkConnection();
	});

	async function checkConnection() {
		try {
			// Wait for connection to be established
			let attempts = 0;
			while (nostr.connectedRelays.length === 0 && attempts < 10) {
				console.log('⏳ Waiting for relay connection... attempt', attempts + 1);
				await new Promise(resolve => setTimeout(resolve, 500));
				attempts++;
			}
			
			connectionStatus = {
				isConnected: nostr.connectedRelays.length > 0,
				connectedRelays: nostr.connectedRelays
			};
			
			logger.info('Terminal connection established', { 
				connectedRelays: nostr.connectedRelays,
				isConnected: connectionStatus.isConnected
			});
		} catch (error) {
			logger.error('Failed to establish connection', { error });
		}
	}
</script>

<div class="nostr-terminal">
	<!-- Connection Status Bar -->
	<div class="status-bar">
		<div class="status-left">
			<div class="connection-status" class:connected={connectionStatus.isConnected}>
				{#if connectionStatus.isConnected}
					🟢 Connected to {connectionStatus.connectedRelays.length} relays
				{:else}
					🔴 Connecting...
				{/if}
			</div>
		</div>
		
		<div class="status-right">
			<div class="user-info">
				<span class="user-key">
					{authState.publicKey ? authState.publicKey.substring(0, 8) + '...' : 'Loading...'}
				</span>
				<span class="signer-type">{authState.signerType}</span>
			</div>
			
			<button class="logout-btn" onclick={onLogout} title="Logout">
				🚪
			</button>
		</div>
	</div>

	<!-- Developer Explorer (handles everything) -->
	<div class="explorer-container">
		<DevExplorer {nostr} />
	</div>
</div>

<style>
	.nostr-terminal {
		min-height: 100vh;
		background: var(--color-background);
		color: var(--color-text);
		display: flex;
		flex-direction: column;
	}

	/* ===== STATUS BAR ===== */
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		min-height: 60px;
	}

	.status-left {
		display: flex;
		align-items: center;
	}

	.connection-status {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-background);
	}

	.connection-status.connected {
		color: rgb(34, 197, 94);
		border-color: rgba(34, 197, 94, 0.3);
		background: rgba(34, 197, 94, 0.1);
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-xs);
	}

	.user-key {
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	.signer-type {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.logout-btn {
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: var(--text-base);
	}

	.logout-btn:hover {
		color: var(--color-danger);
		border-color: var(--color-danger);
		background: rgba(239, 68, 68, 0.1);
	}

	/* ===== EXPLORER CONTAINER ===== */
	.explorer-container {
		flex: 1;
		overflow: hidden;
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 768px) {
		.status-bar {
			flex-direction: column;
			gap: var(--spacing-sm);
			padding: var(--spacing-md);
		}

		.status-right {
			width: 100%;
			justify-content: space-between;
		}

		.user-info {
			align-items: flex-start;
		}
	}
</style>