<!--
  SvelteKit Root Layout
  
  This is the global layout that wraps all pages.
  Imports global CSS and ensures dark theme is applied properly.
-->

<script>
	// Import global CSS - this is crucial for SvelteKit!
	import '../app.css';
</script>

<!-- The slot where page content gets rendered -->
<slot />

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