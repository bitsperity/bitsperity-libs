import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Build optimization
	build: {
		target: 'es2022',
		minify: 'esbuild',
		sourcemap: true
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
