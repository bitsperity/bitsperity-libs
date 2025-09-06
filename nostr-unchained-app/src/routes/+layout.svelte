<!--
  SvelteKit Root Layout
  
  This is the global layout that wraps all pages.
  Imports global CSS and ensures dark theme is applied properly.
-->

<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/ui/AppShell.svelte';
	import { onMount } from 'svelte';
	// Statische, globale Sidebar (einheitlich über alle Routen)
	const sidebar = [
		{ label: 'Feed', href: '/feed', icon: '📰' },
		{ label: 'Explore', href: '/explore', icon: '🌐' },
		{ label: 'Labels', href: '/labels', icon: '🏷️' },
		{ label: 'Articles', href: '/articles', icon: '📚' },
		{ label: 'Relays', href: '/relays', icon: '🔗' },
		{ label: 'Compose', href: '/compose', icon: '📝' },
		{ label: 'Messages', href: '/messages', icon: '💬' },
		{ label: 'Lists', href: '/lists', icon: '🗂️' }
	];
	const topActions: Array<{ label: string; href: string }> = [];

	// Backwards-compat: support old deep-links like ?thread=... or ?profile=...
	onMount(() => {
		try {
			const params = new URLSearchParams(location.search);
			const thread = params.get('thread');
			const profile = params.get('profile');
			if (thread) {
				location.replace(`/threads/${thread}`);
				return;
			}
			if (profile) {
				location.replace(`/profiles/${profile}`);
				return;
			}
		} catch {}
	});
</script>

<AppShell title="Nostr Unchained" {sidebar} {topActions}>
	<slot />
</AppShell>

<style>
	/* Global body styles - must use :global() in SvelteKit */
	:global(html) {
		height: 100%;
	}
	
	:global(body) {
		/* Apply our CSS variables to body */
		background-color: var(--color-background);
		color: var(--color-text);
		font-family: var(--font-sans);
		margin: 0;
		padding: 0;
		height: 100%;
		overflow-x: hidden;
	}

	/* Ensure the root div takes full height */
	:global(#svelte) {
		height: 100%;
	}

	/* Apply dark theme to all elements that need it */
	:global(*) {
		/* Ensure CSS variables are inherited properly */
		color: inherit;
	}

	/* Fix any remaining white backgrounds */
	:global(html, body, #svelte) {
		background-color: var(--color-background) !important;
	}
</style>