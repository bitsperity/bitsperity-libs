<!--
  NostrUnchained Demo App
  
  State-of-the-Art DX showcase for NostrUnchained library
-->

<script lang="ts">
    import { getService } from '../lib/services/ServiceContainer.js';
	import NostrApp from '../lib/components/NostrApp.svelte';

	// =============================================================================
	// State-of-the-Art NostrUnchained Integration
	// =============================================================================
	
    let nostr: any | null = $state(null);
    let signerChoice: 'extension' | 'temporary' | null = $state(null);
    let isInitializing = $state(false);
    let error: string | null = $state(null);
    let showApiMap = $state(false);

	// Create NostrUnchained instance with chosen signer
    async function initializeNostr(signerType: 'extension' | 'temporary') {
		isInitializing = true;
		error = null;
		
        try {
            // Zentralen Singleton-Service nutzen
            const nostrService: any = await getService('nostr');
            // dynamisch importieren, um SSR-Resolver-Probleme zu vermeiden
            const mod = await import('nostr-unchained');
            const signer = signerType === 'extension' ? new mod.ExtensionSigner() : new mod.TemporarySigner();
            if (signerType === 'extension') {
                await signer.getPublicKey();
            }

            await nostrService.setSigningProvider(signer);
            // Instanz aus Service holen
            nostr = nostrService.getInstance();
            await nostr.connect();

            signerChoice = signerType;
			// Persistente Wahl für serverseitigen Guard
			try {
				document.cookie = `signer_selected=${signerType}; Path=/; SameSite=Lax`;
				if (signerType === 'temporary') document.cookie = `temp_signer_active=true; Path=/; SameSite=Lax`;
				document.cookie = 'signed_now=1; Path=/; SameSite=Lax';
			} catch {}
			// Direkt zurück zur Zielroute navigieren (ohne Reload), Server-Hook ist Fallback
			// Direkt zur Zielroute navigieren; One-Time-Pass setzen, damit die
			// Zielroute nicht erneut zur Landing umleitet
			const cookieRt = (() => { try { const c = document.cookie.split('; ').find((x) => x.startsWith('rt=')); return c ? decodeURIComponent(c.split('=')[1] || '') : ''; } catch { return ''; } })();
			const paramRt = (() => { try { const p = new URLSearchParams(location.search).get('rt'); return p ? decodeURIComponent(p) : ''; } catch { return ''; } })();
			const rt = cookieRt || paramRt || '/';
			// Nur umleiten, wenn eine Zielroute vorhanden ist und nicht Root ist
			if (rt && rt !== '/') {
				location.replace(`/?rt=${encodeURIComponent(rt)}`);
			}
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

        <!-- Floating API Map (discoverability of full API) -->
        <div class="api-map">
            <button class="api-toggle" onclick={() => showApiMap = !showApiMap}>
                {showApiMap ? '❌ API-Map schließen' : '🧭 API-Map öffnen'}
            </button>
            {#if showApiMap}
                <div class="api-grid">
                    <div class="api-section">
                        <h4>Core</h4>
                        <ul>
                            <li><code>connect()</code></li>
                            <li><code>disconnect()</code></li>
                            <li><code>publish(event)</code></li>
                            <li><code>query().kinds().authors().tags().limit().execute()</code></li>
                            <li><code>sub().kinds().authors().tags().limit().execute()</code></li>
                        </ul>
                    </div>
                    <div class="api-section">
                        <h4>Events</h4>
                        <ul>
                            <li><code>events.create().kind().content().tag().publish()</code></li>
                            <li><code>events.note().publish()</code></li>
                            <li><code>events.reaction(eventId).publish()</code></li>
                            <li><code>events.deletion(eventId).publish()</code></li>
                        </ul>
                    </div>
                    <div class="api-section">
                        <h4>DM</h4>
                        <ul>
                            <li><code>getDM()?.with(pubkey)</code></li>
                            <li><code>conversation.send('hello')</code></li>
                            <li><code>conversation.messages.store</code></li>
                        </ul>
                    </div>
                    <div class="api-section">
                        <h4>Social</h4>
                        <ul>
                            <li><code>social.content.feed({ '{' } authors {'}' })</code></li>
                            <li><code>social.reactions.react(eventId)</code></li>
                            <li><code>social.threads.reply(eventId, '...')</code></li>
                        </ul>
                    </div>
                    <div class="api-section">
                        <h4>Profile</h4>
                        <ul>
                            <li><code>profile.get(pubkey)</code></li>
                            <li><code>profile.edit().name('...').publish()</code></li>
                            <li><code>profile.follows.add(pubkey).publish()</code></li>
                        </ul>
                    </div>
                </div>
            {/if}
        </div>
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

  /* Floating API Map styles */
  .api-map { position: fixed; right: 16px; bottom: 16px; z-index: 10; }
  .api-toggle {
    background: var(--color-primary);
    color: var(--color-primary-text);
    border: none;
    border-radius: var(--radius-md);
    padding: 8px 12px;
    cursor: pointer;
  }
  .api-grid {
    margin-top: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    max-width: 92vw;
    max-height: 60vh;
    overflow: auto;
  }
  .api-section h4 { margin: 0 0 4px 0; }
  .api-section ul { margin: 0; padding-left: 16px; }
  .api-section code { font-family: var(--font-mono); }
</style>

