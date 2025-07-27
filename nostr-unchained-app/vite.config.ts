import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Build optimization
	build: {
		target: 'es2022',
		minify: 'esbuild',
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunk for large dependencies
					vendor: ['nostr-unchained'],
					// UI chunk for Svelte components
					ui: ['@sveltejs/kit']
				}
			}
		}
	},
	
	// Development optimization
	server: {
		fs: {
			strict: false
		}
	},
	
	// Performance optimization
	optimizeDeps: {
		include: ['nostr-unchained'],
		exclude: ['@sveltejs/kit']
	},
	
	// Bundle analysis
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().toISOString())
	}
});
