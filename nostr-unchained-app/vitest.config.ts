import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	test: {
		// Environment setup
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		
		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/test-setup.ts',
				'**/*.d.ts',
				'**/*.config.*',
				'**/dist/**'
			],
			// Strict coverage thresholds following Bitsperity standards
			thresholds: {
				global: {
					branches: 85,
					functions: 90,
					lines: 90,
					statements: 90
				}
			}
		},
		
		// Test discovery
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules/', 'dist/', '.svelte-kit/'],
		
		// Performance optimization
		pool: 'forks',
		poolOptions: {
			forks: {
				singleFork: true
			}
		},
		
		// Test timeout
		testTimeout: 10000,
		hookTimeout: 10000,
		
		// UI configuration
		ui: true,
		open: false,
		
		// Reporter configuration
		reporter: ['verbose', 'json', 'html'],
		outputFile: {
			json: './coverage/test-results.json',
			html: './coverage/test-results.html'
		}
	}
});