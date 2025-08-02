<script lang="ts">
/**
 * Modal Component
 * 
 * Reusable modal dialog with backdrop, ESC key support and multiple sizes.
 * Follows accessibility best practices with focus management.
 * Max 200 lines - Zero Monolith Policy
 */

import { createEventDispatcher, onMount, onDestroy } from 'svelte';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	isOpen: boolean;
	title?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	showCloseButton?: boolean;
	closeOnBackdrop?: boolean;
	closeOnEscape?: boolean;
	className?: string;
}

const {
	isOpen = false,
	title,
	size = 'md',
	showCloseButton = true,
	closeOnBackdrop = true,
	closeOnEscape = true,
	className = ''
}: Props = $props();

// =============================================================================
// Event Dispatcher
// =============================================================================

const dispatch = createEventDispatcher<{
	close: void;
	open: void;
}>();

// =============================================================================
// State Management
// =============================================================================

let modalElement: HTMLElement;
let previousActiveElement: Element | null = null;

// =============================================================================
// Size Classes
// =============================================================================

const sizeClasses = {
	sm: 'max-w-md',
	md: 'max-w-lg', 
	lg: 'max-w-2xl',
	xl: 'max-w-4xl'
};

// =============================================================================
// Event Handlers
// =============================================================================

function handleClose() {
	dispatch('close');
}

function handleBackdropClick(event: MouseEvent) {
	if (closeOnBackdrop && event.target === event.currentTarget) {
		handleClose();
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (closeOnEscape && event.key === 'Escape') {
		handleClose();
	}
	
	// Trap focus within modal
	if (event.key === 'Tab' && isOpen) {
		trapFocus(event);
	}
}

function trapFocus(event: KeyboardEvent) {
	if (!modalElement) return;
	
	const focusableElements = modalElement.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);
	
	const firstFocusable = focusableElements[0] as HTMLElement;
	const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
	
	if (event.shiftKey) {
		if (document.activeElement === firstFocusable) {
			lastFocusable?.focus();
			event.preventDefault();
		}
	} else {
		if (document.activeElement === lastFocusable) {
			firstFocusable?.focus();
			event.preventDefault();
		}
	}
}

// =============================================================================
// Lifecycle
// =============================================================================

$effect(() => {
	if (isOpen) {
		// Store currently focused element
		previousActiveElement = document.activeElement;
		
		// Prevent body scroll
		document.body.style.overflow = 'hidden';
		
		// Focus modal after it's rendered
		setTimeout(() => {
			const firstFocusable = modalElement?.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			) as HTMLElement;
			
			if (firstFocusable) {
				firstFocusable.focus();
			} else {
				modalElement?.focus();
			}
		}, 100);
		
		dispatch('open');
	} else {
		// Restore body scroll
		document.body.style.overflow = '';
		
		// Restore focus to previous element
		if (previousActiveElement instanceof HTMLElement) {
			previousActiveElement.focus();
		}
	}
});

onMount(() => {
	document.addEventListener('keydown', handleKeydown);
});

onDestroy(() => {
	document.removeEventListener('keydown', handleKeydown);
	// Restore body scroll on unmount
	document.body.style.overflow = '';
});
</script>

<!-- Modal Backdrop -->
{#if isOpen}
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		tabindex="-1"
	>
		<!-- Modal Container -->
		<div
			bind:this={modalElement}
			class="modal-container {sizeClasses[size]} {className}"
			role="document"
		>
			<!-- Modal Header -->
			{#if title || showCloseButton}
				<div class="modal-header">
					{#if title}
						<h2 id="modal-title" class="modal-title">
							{title}
						</h2>
					{/if}
					
					{#if showCloseButton}
						<button
							type="button"
							class="modal-close-button"
							on:click={handleClose}
							aria-label="Close modal"
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M18 6L6 18M6 6L18 18"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}
			
			<!-- Modal Body -->
			<div class="modal-body">
				<slot />
			</div>
			
			<!-- Modal Footer -->
			{#if $$slots.footer}
				<div class="modal-footer">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
.modal-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	padding: var(--spacing-md, 1rem);
	animation: fadeIn 0.15s ease-out;
}

.modal-container {
	background-color: var(--color-surface, #2d3748);
	border-radius: var(--radius-lg, 0.75rem);
	box-shadow: var(--shadow-xl, 0 20px 25px rgba(0, 0, 0, 0.1));
	width: 100%;
	max-height: 90vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	animation: scaleIn 0.15s ease-out;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--spacing-lg, 1.5rem);
	border-bottom: 1px solid var(--color-border-light, #2d3748);
	flex-shrink: 0;
}

.modal-title {
	color: var(--color-text, #f7fafc);
	font-size: var(--text-lg, 1.125rem);
	font-weight: 600;
	margin: 0;
}

.modal-close-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: var(--radius-md, 0.5rem);
	background: transparent;
	color: var(--color-text-muted, #a0aec0);
	transition: all var(--transition-fast, 150ms ease-in-out);
	cursor: pointer;
}

.modal-close-button:hover {
	background-color: var(--color-border-light, #2d3748);
	color: var(--color-text, #f7fafc);
}

.modal-close-button:focus {
	outline: 2px solid var(--color-accent, #ed8936);
	outline-offset: 2px;
}

.modal-body {
	padding: var(--spacing-lg, 1.5rem);
	overflow-y: auto;
	flex: 1;
}

.modal-footer {
	padding: var(--spacing-lg, 1.5rem);
	border-top: 1px solid var(--color-border-light, #2d3748);
	display: flex;
	gap: var(--spacing-sm, 0.5rem);
	justify-content: flex-end;
	flex-shrink: 0;
}

/* Animations */
@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes scaleIn {
	from {
		opacity: 0;
		transform: scale(0.95);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

/* Mobile Responsive */
@media (max-width: 768px) {
	.modal-backdrop {
		padding: var(--spacing-sm, 0.5rem);
		align-items: flex-end;
	}
	
	.modal-container {
		max-height: 95vh;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	
	.modal-header,
	.modal-body,
	.modal-footer {
		padding: var(--spacing-md, 1rem);
	}
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
	.modal-backdrop,
	.modal-container {
		animation: none;
	}
}
</style>