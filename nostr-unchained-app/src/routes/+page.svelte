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

			// Clean, professional initialization
			nostr = new NostrUnchained({
				signingProvider: signer,
				relays: ['ws://umbrel.local:4848'],
				debug: true
			});

			// Connect to relays
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.signer-selection {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
		color: white;
	}

	.signer-selection h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0,0,0,0.3);
	}

	.signer-selection p {
		font-size: 1.2rem;
		margin-bottom: 3rem;
		opacity: 0.9;
	}

	.signer-options {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.signer-btn {
		background: rgba(255, 255, 255, 0.15);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 1rem;
		padding: 2rem;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		min-width: 200px;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.signer-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
	}

	.signer-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.signer-btn span {
		font-size: 0.9rem;
		opacity: 0.8;
		font-weight: normal;
	}

	.loading, .error {
		margin-top: 2rem;
		padding: 1rem 2rem;
		border-radius: 0.5rem;
		font-weight: 500;
	}

	.loading {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.error {
		background: rgba(255, 75, 75, 0.2);
		border: 1px solid rgba(255, 75, 75, 0.5);
		color: #ffcccc;
	}
</style>

