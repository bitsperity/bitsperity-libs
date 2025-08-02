<!--
  NostrUnchained Demo App
  
  State-of-the-Art DX showcase for NostrUnchained library
-->

<script lang="ts">
	import { NostrUnchained } from 'nostr-unchained';
	import { ExtensionSigner, TemporarySigner } from 'nostr-unchained';
	import NostrApp from '../lib/components/NostrApp.svelte';

	// =============================================================================
	// State-of-the-Art NostrUnchained Integration
	// =============================================================================
	
	let nostr: NostrUnchained | null = $state(null);
	let signerChoice: 'extension' | 'temporary' | null = $state(null);
	let isInitializing = $state(false);
	let error: string | null = $state(null);

	// Create NostrUnchained instance with chosen signer
	async function initializeNostr(signerType: 'extension' | 'temporary') {
		isInitializing = true;
		error = null;
		
		try {
			let signer;
			
			if (signerType === 'extension') {
				signer = new ExtensionSigner();
				await signer.getPublicKey(); // Test extension availability
			} else {
				signer = new TemporarySigner();
			}

			// PERFECT DX: Just create NostrUnchained and connect!
			nostr = new NostrUnchained({
				signingProvider: signer,
				relays: ['ws://umbrel.local:4848'],
				debug: true
			});
			
			// Connect to relays - that's it!
			await nostr.connect();
			
			signerChoice = signerType;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to initialize';
			nostr = null;
		} finally {
			isInitializing = false;
		}
	}
</script>

<main class="app">
	{#if !nostr}
		<!-- Signer Selection - Clean UX -->
		<div class="signer-selection">
			<h1>🔥 NostrUnchained Demo</h1>
			<p>Choose your signing method to get started</p>
			
			<div class="signer-options">
				<button 
					class="signer-btn extension"
					disabled={isInitializing}
					onclick={() => initializeNostr('extension')}
				>
					🔌 Browser Extension
					<span>Use your Alby or nos2x extension</span>
				</button>
				
				<button 
					class="signer-btn temporary"
					disabled={isInitializing}
					onclick={() => initializeNostr('temporary')}
				>
					⚡ Temporary Account
					<span>Generate ephemeral keys for testing</span>
				</button>
			</div>
			
			{#if isInitializing}
				<div class="loading">Initializing NostrUnchained...</div>
			{/if}
			
			{#if error}
				<div class="error">Error: {error}</div>
			{/if}
		</div>
	{:else}
		<!-- Main App - NostrUnchained Ready -->
		<NostrApp {nostr} signer={signerChoice} />
	{/if}
</main>

<style>
	.app {
		min-height: 100vh;
		background: var(--color-background);
	}

	.signer-selection {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: var(--spacing-xl);
		text-align: center;
		color: var(--color-text);
	}

	.signer-selection h1 {
		font-size: var(--text-3xl);
		margin-bottom: var(--spacing-md);
		text-shadow: var(--shadow-md);
		color: var(--color-text);
	}

	.signer-selection p {
		font-size: var(--text-lg);
		margin-bottom: var(--spacing-2xl);
		color: var(--color-text-muted);
	}

	.signer-options {
		display: flex;
		gap: var(--spacing-xl);
		flex-wrap: wrap;
		justify-content: center;
	}

	.signer-btn {
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-normal);
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		min-width: 200px;
		font-size: var(--text-lg);
		font-weight: 600;
	}

	.signer-btn:hover:not(:disabled) {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-primary-text);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.signer-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.signer-btn span {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-weight: normal;
	}

	.loading, .error {
		margin-top: var(--spacing-xl);
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--radius-md);
		font-weight: 500;
	}

	.loading {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.error {
		background: var(--color-surface);
		border: 1px solid var(--color-danger);
		color: var(--color-danger);
	}
</style>

