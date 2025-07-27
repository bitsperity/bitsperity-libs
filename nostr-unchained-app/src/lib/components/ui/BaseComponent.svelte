<!--
  Base Component
  
  Foundation for all UI components in the app.
  Provides consistent props interface and styling.
  Max 200 lines - Zero Monolith Policy
-->

<script lang="ts">
	import type { ComponentProps } from '../../types/app.js';

	// =============================================================================
	// Props Interface
	// =============================================================================

	interface Props extends ComponentProps {
		/**
		 * Component variant for styling
		 */
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
		
		/**
		 * Component size
		 */
		size?: 'sm' | 'md' | 'lg';
		
		/**
		 * Disabled state
		 */
		disabled?: boolean;
		
		/**
		 * Loading state
		 */
		loading?: boolean;
		
		/**
		 * Data test ID for testing
		 */
		testId?: string;
	}

	// =============================================================================
	// Props with Defaults
	// =============================================================================

	let {
		class: className = '',
		style = '',
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		testId,
		...restProps
	}: Props = $props();

	// =============================================================================
	// Computed Classes
	// =============================================================================

	const baseClasses = 'base-component';
	const variantClasses = `variant-${variant}`;
	const sizeClasses = `size-${size}`;
	const stateClasses = [
		disabled && 'disabled',
		loading && 'loading'
	].filter(Boolean).join(' ');

	const computedClass = [
		baseClasses,
		variantClasses,
		sizeClasses,
		stateClasses,
		className
	].filter(Boolean).join(' ');

	// =============================================================================
	// Accessibility Attributes (Svelte 5 Runes)
	// =============================================================================

	let accessibilityAttrs = $derived({
		'aria-disabled': disabled,
		'aria-busy': loading,
		'data-testid': testId
	});
</script>

<!--
  Template
  
  Provides slot for component content with consistent wrapper.
-->
<div 
	class={computedClass}
	{style}
	{...accessibilityAttrs}
	{...restProps}
>
	{#if loading}
		<div class="loading-indicator" aria-hidden="true">
			<slot name="loading">
				<span class="spinner" />
			</slot>
		</div>
	{/if}
	
	<div class="content" class:loading>
		<slot />
	</div>
</div>

<!--
  Styles
  
  Base styling following design system principles.
-->
<style>
	.base-component {
		/* Base layout */
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		
		/* Base styling */
		border-radius: 0.5rem;
		transition: all 0.2s ease-in-out;
		
		/* Focus management */
		outline: none;
	}
	
	.base-component:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* Variant Styles */
	.variant-primary {
		background-color: var(--color-primary);
		color: var(--color-primary-text);
		border: 1px solid var(--color-primary);
	}

	.variant-secondary {
		background-color: var(--color-secondary);
		color: var(--color-secondary-text);
		border: 1px solid var(--color-secondary);
	}

	.variant-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.variant-ghost {
		background-color: transparent;
		color: var(--color-text);
		border: none;
	}

	/* Size Styles */
	.size-sm {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		min-height: 2rem;
	}

	.size-md {
		padding: 0.75rem 1rem;
		font-size: 1rem;
		min-height: 2.5rem;
	}

	.size-lg {
		padding: 1rem 1.25rem;
		font-size: 1.125rem;
		min-height: 3rem;
	}

	/* State Styles */
	.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		pointer-events: none;
	}

	.loading {
		cursor: wait;
	}

	/* Loading Indicator */
	.loading-indicator {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.8);
		border-radius: inherit;
	}

	.content.loading {
		opacity: 0.3;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid var(--color-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.base-component {
			/* Larger touch targets on mobile */
			min-height: 44px;
		}
		
		.size-sm {
			min-height: 40px;
		}
		
		.size-md {
			min-height: 44px;
		}
		
		.size-lg {
			min-height: 48px;
		}
	}
</style>