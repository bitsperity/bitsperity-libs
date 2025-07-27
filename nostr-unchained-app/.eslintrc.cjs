/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'@typescript-eslint/recommended-requiring-type-checking',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
		project: './tsconfig.json',
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2022: true,
		node: true
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},
		{
			files: ['*.test.ts', '*.spec.ts'],
			rules: {
				'@typescript-eslint/no-unsafe-assignment': 'off',
				'@typescript-eslint/no-unsafe-member-access': 'off',
				'@typescript-eslint/no-unsafe-call': 'off'
			}
		}
	],
	rules: {
		// Code quality rules
		'@typescript-eslint/no-unused-vars': 'error',
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/prefer-const': 'error',
		'@typescript-eslint/no-non-null-assertion': 'error',
		
		// Zero-monolith policy enforcement
		'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
		'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
		
		// SOLID principles enforcement
		'complexity': ['error', 10],
		'max-depth': ['error', 4],
		'max-params': ['error', 5],
		
		// Performance rules
		'@typescript-eslint/prefer-readonly': 'error',
		'@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for some cases
		
		// Svelte specific rules
		'svelte/no-at-html-tags': 'error',
		'svelte/no-target-blank': 'error',
		'svelte/valid-compile': 'error'
	},
	settings: {
		'svelte3/typescript': true
	}
};