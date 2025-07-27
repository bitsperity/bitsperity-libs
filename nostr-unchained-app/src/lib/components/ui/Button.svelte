<!--
  Button Component
  
  Standard button component with consistent styling and behavior.
  Built on BaseComponent foundation.
  Max 200 lines - Zero Monolith Policy
-->

<script lang="ts">
	import BaseComponent from './BaseComponent.svelte';
	import type { ComponentProps } from '../../types/app.js';

	// =============================================================================
	// Props Interface
	// =============================================================================

	interface Props extends ComponentProps {
		/**
		 * Button type for form submission
		 */
		type?: 'button' | 'submit' | 'reset';
		
		/**
		 * Button variant
		 */
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
		
		/**
		 * Button size
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
		 * Full width button
		 */
		fullWidth?: boolean;
		
		/**
		 * Icon only button
		 */
		iconOnly?: boolean;
		
		/**
		 * Click handler
		 */
		onclick?: (event: MouseEvent) => void;
		
		/**
		 * Accessibility label
		 */
		ariaLabel?: string;
		
		/**
		 * Test ID
		 */
		testId?: string;
	}

	// =============================================================================
	// Props with Defaults
	// =============================================================================

	let {
		type = 'button',
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		fullWidth = false,
		iconOnly = false,
		onclick,
		ariaLabel,
		testId,
		class: className = '',
		style = '',
		...restProps
	}: Props = $props();

	// =============================================================================
	// Event Handlers
	// =============================================================================

	function handleClick(event: MouseEvent): void {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}

		onclick?.(event);
	}

	// =============================================================================
	// Computed Classes
	// =============================================================================

	const buttonClasses = [
		'button',
		fullWidth && 'full-width',
		iconOnly && 'icon-only',
		className
	].filter(Boolean).join(' ');

	// =============================================================================
	// Accessibility Attributes (Svelte 5 Runes)
	// =============================================================================

	let buttonAttrs = $derived({
		'aria-label': ariaLabel,
		'aria-pressed': type === 'button' ? undefined : false
	});
</script>

<!--
  Template
  
  Button element wrapped in BaseComponent for consistent styling.
-->
<BaseComponent 
	{variant}
	{size}
	{disabled}
	{loading}
	{testId}
	class={buttonClasses}
	{style}
	{...restProps}
>
	<button
		{type}
		{disabled}
		onclick={handleClick}
		{...buttonAttrs}
		class="button-inner"
	>
		{#if $$slots.icon}
			<span class="icon" aria-hidden="true">
				<slot name="icon" />
			</span>
		{/if}
		
		{#if !iconOnly}
			<span class="text">
				<slot />
			</span>
		{/if}
	</button>
	
	<!-- Loading state -->
	<slot name="loading" slot="loading">
		<span class="loading-text" aria-live="polite">
			Lädt...
		</span>
	</slot>
</BaseComponent>

<!--
  Styles
  
  Button-specific styling following design system.
-->
<style>
	.button {
		/* Remove BaseComponent padding for button */
		padding: 0;
	}

	.button-inner {
		/* Full size of parent */
		width: 100%;
		height: 100%;
		
		/* Layout */
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		
		/* Reset button styles */
		background: none;
		border: none;
		padding: inherit;
		margin: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		border-radius: inherit;
		
		/* Interaction */
		transition: all 0.2s ease-in-out;
	}

	.button-inner:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.button-inner:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Icon styling */
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* Text styling */
	.text {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Full width styling */
	.full-width {
		width: 100%;
	}

	/* Icon only styling */
	.icon-only {
		aspect-ratio: 1;
		padding: 0;
	}

	.icon-only .button-inner {
		padding: 0;
	}

	/* Danger variant */
	:global(.variant-danger) {
		background-color: var(--color-danger);
		color: var(--color-danger-text);
		border-color: var(--color-danger);
	}

	:global(.variant-danger:hover) .button-inner:not(:disabled) {
		background-color: var(--color-danger-hover);
	}

	/* Loading state */
	.loading-text {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.button-inner {
			/* Better touch targets */
			gap: 0.75rem;
		}
		
		.text {
			/* Prevent text from being too small on mobile */
			font-size: 1rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.button-inner {
			border: 2px solid;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.button-inner,
		.button-inner:hover,
		.button-inner:active {
			transition: none;
			transform: none;
		}
	}
</style>