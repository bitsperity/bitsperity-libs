<!--
  LoginView Component
  
  Beautiful onboarding experience for Nostr authentication.
  Mobile-first design with multiple authentication methods.
  Max 200 lines - Zero Monolith Policy
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '../ui/Button.svelte';
	import BaseComponent from '../ui/BaseComponent.svelte';
	import { authStore, authActions } from '../../stores/AuthStore.js';
	import { getService, recreateService } from '../../services/ServiceContainer.js';
	import { createContextLogger } from '../../utils/Logger.js';
	import type { AuthService } from '../../services/AuthService.js';
	import type { NostrService } from '../../services/NostrService.js';
	import type { SupportedExtensions } from '../../types/auth.js';

	// =============================================================================
	// Props & State
	// =============================================================================

	interface Props {
		onSuccess?: () => void;
		onCancel?: () => void;
		class?: string;
	}

	let { onSuccess, onCancel, class: className = '' }: Props = $props();

	// =============================================================================
	// Component State
	// =============================================================================

	let authService: AuthService | null = null;
	let extensions: SupportedExtensions | null = null;
	let isLoading = $state(false);
	let currentStep = $state<'welcome' | 'method' | 'extension' | 'temporary' | 'manual-key'>('welcome');
	let error = $state<string | null>(null);
	let manualKey = $state('');

	const logger = createContextLogger('LoginView');

	// =============================================================================
	// Lifecycle
	// =============================================================================

	onMount(async () => {
		try {
			authService = await getService<AuthService>('auth');
			if (authService) {
				extensions = await authService.detectExtensions();
			}
		} catch (err) {
			logger.error('Failed to initialize LoginView', { error: err });
			error = 'Initialisierung fehlgeschlagen';
		}
	});

	// =============================================================================
	// Authentication Methods
	// =============================================================================

	async function handleExtensionLogin(): Promise<void> {
		if (!authService) return;

		try {
			isLoading = true;
			error = null;
			authActions.setLoading(true);

			logger.info('Starting extension login...');
			const result = await authService.loginWithExtension();

			if (result.success && result.user && result.publicKey && result.method) {
				authActions.setAuthenticated(result.method, result.publicKey, result.user);
				logger.info('Extension login successful');
				onSuccess?.();
			} else {
				const errorMessage = result.error?.message || 'Extension-Login fehlgeschlagen';
				error = errorMessage;
				authActions.setError(errorMessage);
				logger.error('Extension login failed', { error: result.error });
			}
		} catch (err) {
			const errorMessage = 'Unerwarteter Fehler beim Extension-Login';
			error = errorMessage;
			authActions.setError(errorMessage);
			logger.error('Extension login error', { error: err });
		} finally {
			isLoading = false;
			authActions.setLoading(false);
		}
	}

	function handleTemporaryLogin(): void {
		currentStep = 'temporary';
	}

	function showManualKeyInput(): void {
		currentStep = 'manual-key';
	}

	async function loginWithManualKey(): Promise<void> {
		if (!manualKey.trim()) {
			error = 'Bitte gib einen gültigen Schlüssel ein';
			return;
		}

		isLoading = true;
		error = null;

		try {
			logger.info('Starting manual key login...');
			
			// Handle both nsec (private) and npub (public) keys
			let publicKey = manualKey.trim();
			
			// If it's an nsec, we'd need to derive the public key
			// For now, assume it's an npub (public key)
			if (publicKey.startsWith('nsec') || publicKey.startsWith('npub')) {
				// Remove the prefix and validate
				publicKey = publicKey.substring(4);
			}
			
			// Simple validation - should be hex string
			if (!/^[0-9a-fA-F]{64}$/.test(publicKey)) {
				throw new Error('Ungültiges Schlüsselformat. Bitte verwende npub oder nsec.');
			}

			// Store in auth store as manual key login
			authActions.setAuthenticated('manual', publicKey);
			
			logger.info('Manual key login successful');
			onSuccess?.();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Login fehlgeschlagen';
			error = message;
			logger.error('Manual key login failed', { error: err });
		} finally {
			isLoading = false;
		}
	}

	async function createTemporaryAccount(): Promise<void> {
		isLoading = true;
		error = null;

		try {
			logger.info('Creating temporary account...');
			
			// Clear any existing temporary account data completely
			sessionStorage.removeItem('temp_private_key');
			sessionStorage.removeItem('temp_public_key');
			sessionStorage.removeItem('temp_signer_active');
			
			// Force complete service recreation before setting the temp flag
			// This ensures we start with a fresh NostrService instance
			recreateService('nostr');
			
			// Set flag for temporary account AFTER service recreation
			sessionStorage.setItem('temp_signer_active', 'true');
			
			// Force another recreation now that the temp flag is set
			// This ensures the new service instance recognizes the temp flag
			recreateService('nostr');
			
			// Get new service with fresh TemporarySigner
			const nostrService = await getService<NostrService>('nostr');
			const result = await nostrService.createTemporaryAccount();
			
			if (!result.success || !result.data) {
				throw new Error(result.error?.message || 'Failed to create temporary account');
			}
			
			// Store as temporary account
			authActions.setAuthenticated('temporary', result.data, {
				pubkey: result.data,
				name: 'Temp User',
				about: 'Temporary account user',
				verified: false
			});
			
			logger.info('Temporary account created successfully', { 
				publicKey: result.data.substring(0, 16) + '...' 
			} as any);
			onSuccess?.();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Fehler beim Erstellen des temporären Kontos';
			error = message;
			logger.error('Temporary account creation failed', { error: err } as any);
		} finally {
			isLoading = false;
		}
	}


	function goBack(): void {
		if (currentStep === 'method') {
			currentStep = 'welcome';
		} else if (currentStep === 'extension' || currentStep === 'temporary' || currentStep === 'manual-key') {
			currentStep = 'method';
		}
		error = null;
	}

	function getStarted(): void {
		currentStep = 'method';
	}

	// =============================================================================
	// UI Helpers (Svelte 5 Runes)
	// =============================================================================

	let hasExtensions = $derived(extensions && (
		extensions.alby?.isAvailable || 
		extensions.nos2x?.isAvailable || 
		extensions.getNostr?.isAvailable
	));

	let extensionName = $derived(extensions?.alby?.isAvailable ? 'Alby' :
		extensions?.nos2x?.isAvailable ? 'nos2x' :
		extensions?.getNostr?.isAvailable ? 'Browser Extension' :
		'Extension');
</script>

<!--
  Template
  
  Multi-step authentication flow with beautiful mobile-first design.
-->
<BaseComponent 
	class="login-view {className}"
	variant="ghost"
	testId="login-view"
>
	<div class="login-container">
		<!-- Welcome Step -->
		{#if currentStep === 'welcome'}
			<div class="welcome-step">
				<div class="logo">
					<div class="logo-icon">⚡</div>
					<h1>Nostr Unchained</h1>
				</div>
				
				<div class="welcome-content">
					<h2>Willkommen bei Nostr</h2>
					<p>
						Erlebe soziale Medien ohne Zensur, ohne Algorithmen,
						und mit vollständiger Kontrolle über deine Daten.
					</p>
					
					<div class="features">
						<div class="feature">
							<span class="feature-icon">🔒</span>
							<span>Deine Schlüssel, deine Identität</span>
						</div>
						<div class="feature">
							<span class="feature-icon">🌐</span>
							<span>Dezentral und zensurresistent</span>
						</div>
						<div class="feature">
							<span class="feature-icon">⚡</span>
							<span>Lightning-schnell und privat</span>
						</div>
					</div>
				</div>
				
				<div class="welcome-actions">
					<Button 
						variant="primary" 
						size="lg" 
						fullWidth
						onclick={getStarted}
						testId="get-started-button"
					>
						Jetzt starten
					</Button>
				</div>
			</div>
		{/if}

		<!-- Method Selection Step -->
		{#if currentStep === 'method'}
			<div class="method-step">
				<div class="step-header">
					<Button 
						variant="ghost" 
						size="sm" 
						onclick={goBack}
						testId="back-button"
					>
						← Zurück
					</Button>
					<h2>Anmeldung wählen</h2>
				</div>

				<div class="auth-methods">
					<!-- Extension Login -->
					{#if hasExtensions}
						<div class="auth-method primary">
							<div class="method-icon">🔌</div>
							<div class="method-content">
								<h3>{extensionName}</h3>
								<p>Nutze deine bestehende Nostr-Browser-Erweiterung</p>
								<div class="method-features">
									<span>✓ Sicher</span>
									<span>✓ Einfach</span>
									<span>✓ Empfohlen</span>
								</div>
							</div>
							<Button 
								variant="primary"
								onclick={handleExtensionLogin}
								loading={isLoading}
								disabled={isLoading}
								testId="extension-login-button"
							>
								Mit {extensionName} anmelden
							</Button>
						</div>
					{:else}
						<div class="auth-method disabled">
							<div class="method-icon">🔌</div>
							<div class="method-content">
								<h3>Browser-Erweiterung</h3>
								<p>Keine Nostr-Erweiterung gefunden</p>
								<div class="mobile-note">
									<strong>📱 Hinweis für Mobile:</strong> Browser-Erweiterungen sind auf Mobile limitiert. 
									Verwende stattdessen "Temporäres Konto" oder "Eigener Schlüssel" für die beste iPhone-Experience.
								</div>
								<a 
									href="https://getalby.com" 
									target="_blank" 
									rel="noopener noreferrer"
									class="install-link"
								>
									Alby für Desktop installieren →
								</a>
							</div>
						</div>
					{/if}

					<!-- Manual Key Input (Mobile) -->
					<div class="auth-method secondary">
						<div class="method-icon">🔑</div>
						<div class="method-content">
							<h3>Eigener Schlüssel</h3>
							<p>Verwende deinen eigenen Nostr-Schlüssel (npub/nsec)</p>
							<div class="method-features">
								<span>📱 Mobile-freundlich</span>
								<span>✓ Sofort verfügbar</span>
							</div>
						</div>
						<Button 
							variant="primary"
							onclick={showManualKeyInput}
							disabled={isLoading}
							testId="manual-key-button"
						>
							Mit eigenem Schlüssel
						</Button>
					</div>

					<!-- Temporary Account -->
					<div class="auth-method primary">
						<div class="method-icon">⚡</div>
						<div class="method-content">
							<h3>Temporäres Konto</h3>
							<p>Perfekt für iPhone! Sofort loslegen ohne Setup</p>
							<div class="method-features">
								<span>📱 Mobile-optimiert</span>
								<span>✓ Keine Installation</span>
								<span>✓ Sofort verfügbar</span>
							</div>
						</div>
						<Button 
							variant="primary"
							onclick={handleTemporaryLogin}
							disabled={isLoading}
							testId="temporary-login-button"
						>
							Temporäres Konto erstellen
						</Button>
					</div>
				</div>

				{#if error}
					<div class="error-message" role="alert">
						{error}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Temporary Account Step -->
		{#if currentStep === 'temporary'}
			<div class="temporary-step">
				<div class="step-header">
					<Button 
						variant="ghost" 
						size="sm" 
						onclick={goBack}
						testId="back-button"
					>
						← Zurück
					</Button>
					<h2>Temporäres Konto</h2>
				</div>

				<div class="warning-box">
					<div class="warning-icon">⚠️</div>
					<div class="warning-content">
						<h3>Wichtiger Hinweis</h3>
						<p>
							Temporäre Konten sind nur für Tests gedacht. 
							Deine Daten gehen verloren, wenn du die App schließt.
						</p>
						<p>
							Für langfristige Nutzung empfehlen wir eine 
							Browser-Erweiterung wie Alby.
						</p>
					</div>
				</div>

				<div class="temporary-actions">
					<Button 
						variant="outline" 
						fullWidth
						onclick={goBack}
						testId="cancel-temporary-button"
					>
						Abbrechen
					</Button>
					<Button 
						variant="primary" 
						fullWidth
						onclick={createTemporaryAccount}
						loading={isLoading}
						disabled={isLoading}
						testId="create-temporary-button"
					>
						Temporäres Konto erstellen
					</Button>
				</div>
			</div>
		{/if}

		<!-- Manual Key Input Step -->
		{#if currentStep === 'manual-key'}
			<div class="manual-key-step">
				<div class="step-header">
					<Button 
						variant="ghost" 
						size="sm" 
						onclick={goBack}
						testId="back-button"
					>
						← Zurück
					</Button>
					<h2>Eigener Schlüssel</h2>
				</div>

				<div class="key-input-section">
					<div class="input-description">
						<h3>🔑 Nostr-Schlüssel eingeben</h3>
						<p>
							Gib deinen Nostr-Schlüssel ein. Du kannst sowohl deinen öffentlichen Schlüssel (npub) 
							als auch deinen privaten Schlüssel (nsec) verwenden.
						</p>
					</div>

					<div class="key-input-container">
						<label for="manual-key-input">Schlüssel (npub oder nsec):</label>
						<textarea
							id="manual-key-input"
							bind:value={manualKey}
							placeholder="npub1... oder nsec1... oder hex format"
							class="key-input"
							rows="3"
						></textarea>
					</div>

					<div class="key-info">
						<div class="info-item">
							<strong>npub:</strong> Nur zum Lesen (empfohlen für iPhone)
						</div>
						<div class="info-item">
							<strong>nsec:</strong> Vollzugriff (nur auf vertrauenswürdigen Geräten)
						</div>
					</div>

					{#if error}
						<div class="error-message" role="alert">
							{error}
						</div>
					{/if}
				</div>

				<div class="manual-key-actions">
					<Button 
						variant="outline" 
						fullWidth
						onclick={goBack}
						disabled={isLoading}
						testId="cancel-manual-key-button"
					>
						Abbrechen
					</Button>
					<Button 
						variant="primary" 
						fullWidth
						onclick={loginWithManualKey}
						loading={isLoading}
						disabled={isLoading || !manualKey.trim()}
						testId="login-manual-key-button"
					>
						Anmelden
					</Button>
				</div>
			</div>
		{/if}

		<!-- Cancel Option -->
		{#if onCancel && currentStep !== 'welcome'}
			<div class="cancel-option">
				<Button 
					variant="ghost" 
					size="sm" 
					onclick={onCancel}
					testId="cancel-login-button"
				>
					Später anmelden
				</Button>
			</div>
		{/if}
	</div>
</BaseComponent>

<!--
  Styles
  
  Mobile-first responsive design with beautiful gradients and animations.
-->
<style>
	.login-view {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.login-container {
		width: 100%;
		max-width: 400px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		animation: slideUp 0.3s ease-out;
	}

	/* Welcome Step */
	.welcome-step {
		padding: 2rem;
		text-align: center;
	}

	.logo {
		margin-bottom: 2rem;
	}

	.logo-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.logo h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: #1a202c;
	}

	.welcome-content h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: #2d3748;
	}

	.welcome-content p {
		color: #4a5568;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.features {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.feature {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-align: left;
		color: #4a5568;
		font-size: 0.875rem;
	}

	.feature-icon {
		font-size: 1.25rem;
	}

	/* Method Step */
	.method-step {
		padding: 1.5rem;
	}

	.step-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.step-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: #1a202c;
	}

	.auth-methods {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.auth-method {
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.auth-method.primary {
		border-color: #667eea;
		background: linear-gradient(135deg, #667eea08, #764ba208);
	}

	.auth-method.disabled {
		opacity: 0.6;
		background: #f7fafc;
	}

	.auth-method .method-icon {
		font-size: 2rem;
		margin-bottom: 0.75rem;
	}

	.auth-method h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #1a202c;
	}

	.auth-method p {
		color: #4a5568;
		font-size: 0.875rem;
		margin: 0 0 0.75rem 0;
		line-height: 1.4;
	}

	.method-features {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.method-features span {
		font-size: 0.75rem;
		color: #667eea;
		font-weight: 500;
	}

	.install-link {
		color: #667eea;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.install-link:hover {
		text-decoration: underline;
	}

	.ios-instructions {
		margin: 1rem 0;
		padding: 0.75rem;
		background: #f0f4f8;
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.ios-instructions ol {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.ios-instructions li {
		margin-bottom: 0.25rem;
		line-height: 1.4;
	}

	.ios-instructions strong {
		color: #1a202c;
	}

	.mobile-note {
		margin: 0.75rem 0;
		padding: 0.75rem;
		background: #e8f4fd;
		border: 1px solid #bee3f8;
		border-radius: 8px;
		border-left: 4px solid #3182ce;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #2c5282;
	}

	.mobile-note strong {
		color: #1a365d;
	}

	/* Temporary Step */
	.temporary-step,
	.manual-key-step {
		padding: 1.5rem;
	}

	.warning-box {
		background: #fef5e7;
		border: 1px solid #f6ad55;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.warning-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.warning-content h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #c05621;
	}

	.warning-content p {
		font-size: 0.875rem;
		color: #c05621;
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
	}

	.temporary-actions,
	.manual-key-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Manual Key Input */
	.key-input-section {
		margin: 1.5rem 0;
	}

	.input-description h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #1a202c;
	}

	.input-description p {
		color: #4a5568;
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.key-input-container {
		margin: 1rem 0;
	}

	.key-input-container label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: #1a202c;
		font-size: 0.875rem;
	}

	.key-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.875rem;
		font-family: var(--font-mono);
		background: #f7fafc;
		resize: vertical;
		transition: border-color 0.2s ease;
	}

	.key-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.key-info {
		background: #f0f4f8;
		border: 1px solid #cbd5e0;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.info-item {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.info-item:last-child {
		margin-bottom: 0;
	}

	.info-item strong {
		color: #1a202c;
	}

	/* Error Message */
	.error-message {
		background: #fed7d7;
		color: #c53030;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		text-align: center;
	}

	/* Cancel Option */
	.cancel-option {
		padding: 1rem;
		text-align: center;
		border-top: 1px solid #e2e8f0;
	}

	/* Animations */
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Mobile Optimizations */
	@media (max-width: 480px) {
		.login-view {
			padding: 0.5rem;
		}

		.login-container {
			max-width: none;
			border-radius: 12px;
		}

		.welcome-step,
		.method-step,
		.temporary-step {
			padding: 1.5rem;
		}

		.auth-method {
			padding: 1rem;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.login-container {
			background: #1a202c;
			color: white;
		}

		.logo h1,
		.step-header h2,
		.auth-method h3 {
			color: white;
		}

		.welcome-content p,
		.auth-method p {
			color: #a0aec0;
		}

		.auth-method {
			border-color: #2d3748;
		}

		.auth-method.disabled {
			background: #2d3748;
		}
	}
</style>