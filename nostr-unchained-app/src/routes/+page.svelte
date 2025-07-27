<!--
  Nostr Mobile Terminal
  
  Revolutionary touch-first developer experience for Nostr
-->

<script lang="ts">
	import AuthProvider from '../lib/components/auth/AuthProvider.svelte';
	import LoginView from '../lib/components/auth/LoginView.svelte';
	import KeyManager from '../lib/components/auth/KeyManager.svelte';
	import NostrTerminal from '../lib/components/terminal/NostrTerminal.svelte';
	import { authStore } from '../lib/stores/AuthStore.js';

	let currentView = $state<'login' | 'keys' | 'terminal'>('login');
	
	let authState = $derived($authStore);
	
	$effect(() => {
		if (authState.isAuthenticated) {
			currentView = 'terminal';
		}
	});

	function showKeyManager() {
		currentView = 'keys';
	}

	function showLogin() {
		currentView = 'login';
	}

	function logout() {
		currentView = 'login';
		// TODO: Add actual logout logic
	}

	function handleAuthSuccess() {
		currentView = 'terminal';
	}
</script>

<AuthProvider autoRestore={false}>
	{#if currentView === 'login'}
		<LoginView onSuccess={handleAuthSuccess} />
	{:else if currentView === 'keys'}
		<KeyManager onCancel={() => currentView = 'login'} onSuccess={handleAuthSuccess} />
	{:else if currentView === 'terminal'}
		<NostrTerminal 
			{authState} 
			onLogout={logout} 
			onShowKeys={showKeyManager} 
		/>
	{/if}
</AuthProvider>

