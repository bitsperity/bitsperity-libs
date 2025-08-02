<script lang="ts">
/**
 * Input Component
 * 
 * Reusable form input with validation states, labels, and helper text.
 * Supports various input types and follows accessibility best practices.
 * Max 200 lines - Zero Monolith Policy
 */

import { createEventDispatcher } from 'svelte';
import { generateId } from '../../utils/dom.js';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	value?: string;
	type?: 'text' | 'email' | 'url' | 'password' | 'search';
	placeholder?: string;
	label?: string;
	helperText?: string;
	error?: string;
	disabled?: boolean;
	required?: boolean;
	readonly?: boolean;
	maxLength?: number;
	pattern?: string;
	autocomplete?: string;
	className?: string;
	inputClass?: string;
}

const {
	value = '',
	type = 'text',
	placeholder,
	label,
	helperText,
	error,
	disabled = false,
	required = false,
	readonly = false,
	maxLength,
	pattern,
	autocomplete,
	className = '',
	inputClass = ''
}: Props = $props();

// =============================================================================
// Event Dispatcher
// =============================================================================

const dispatch = createEventDispatcher<{
	input: string;
	change: string;
	focus: FocusEvent;
	blur: FocusEvent;
	enter: KeyboardEvent;
}>();

// =============================================================================
// State Management
// =============================================================================

const inputId = generateId('input');
const helperId = helperText ? generateId('helper') : undefined;
const errorId = error ? generateId('error') : undefined;

let inputElement: HTMLInputElement;
let internalValue = $state(value);
let isFocused = $state(false);

// Sync internal value with prop
$effect(() => {
	internalValue = value;
});

// =============================================================================
// Computed Properties
// =============================================================================

const hasError = $derived(!!error);
const showCharacterCount = $derived(maxLength && maxLength > 0);
const characterCount = $derived(internalValue.length);
const isOverLimit = $derived(maxLength ? characterCount > maxLength : false);

const describedBy = $derived(() => {
	const ids = [];
	if (helperId) ids.push(helperId);
	if (errorId) ids.push(errorId);
	return ids.length > 0 ? ids.join(' ') : undefined;
});

// =============================================================================
// Event Handlers
// =============================================================================

function handleInput(event: Event) {
	const target = event.target as HTMLInputElement;
	internalValue = target.value;
	dispatch('input', target.value);
}

function handleChange(event: Event) {
	const target = event.target as HTMLInputElement;
	dispatch('change', target.value);
}

function handleFocus(event: FocusEvent) {
	isFocused = true;
	dispatch('focus', event);
}

function handleBlur(event: FocusEvent) {
	isFocused = false;
	dispatch('blur', event);
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Enter') {
		dispatch('enter', event);
	}
}

// =============================================================================
// Public Methods
// =============================================================================

export function focus() {
	inputElement?.focus();
}

export function blur() {
	inputElement?.blur();
}

export function select() {
	inputElement?.select();
}
</script>

<div class="input-container {className}">
	<!-- Label -->
	{#if label}
		<label for={inputId} class="input-label">
			{label}
			{#if required}
				<span class="input-required" aria-label="required">*</span>
			{/if}
		</label>
	{/if}
	
	<!-- Input Wrapper -->
	<div class="input-wrapper" class:has-error={hasError} class:is-focused={isFocused}>
		<input
			bind:this={inputElement}
			id={inputId}
			{type}
			{placeholder}
			{disabled}
			{readonly}
			{required}
			{maxLength}
			{pattern}
			{autocomplete}
			value={internalValue}
			class="input-field {inputClass}"
			aria-invalid={hasError}
			aria-describedby={describedBy}
			on:input={handleInput}
			on:change={handleChange}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:keydown={handleKeydown}
		/>
		
		<!-- Character Count -->
		{#if showCharacterCount}
			<div class="character-count" class:over-limit={isOverLimit}>
				{characterCount}{#if maxLength}/{maxLength}{/if}
			</div>
		{/if}
	</div>
	
	<!-- Helper Text -->
	{#if helperText && !error}
		<div id={helperId} class="input-helper">
			{helperText}
		</div>
	{/if}
	
	<!-- Error Message -->
	{#if error}
		<div id={errorId} class="input-error" role="alert">
			{error}
		</div>
	{/if}
</div>

<style>
.input-container {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs, 0.25rem);
}

.input-label {
	color: var(--color-text, #f7fafc);
	font-size: var(--text-sm, 0.875rem);
	font-weight: 500;
	line-height: var(--leading-tight, 1.25);
}

.input-required {
	color: var(--color-danger, #e53e3e);
	margin-left: 2px;
}

.input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
}

.input-field {
	width: 100%;
	padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
	background-color: var(--color-surface, #2d3748);
	border: 1px solid var(--color-border, #4a5568);
	border-radius: var(--radius-md, 0.5rem);
	color: var(--color-text, #f7fafc);
	font-size: var(--text-base, 1rem);
	line-height: var(--leading-normal, 1.5);
	transition: all var(--transition-fast, 150ms ease-in-out);
	min-height: 44px; /* Ensure minimum touch target */
}

.input-field::placeholder {
	color: var(--color-text-muted, #a0aec0);
}

.input-field:focus {
	outline: none;
	border-color: var(--color-primary, #667eea);
	box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.input-wrapper.has-error .input-field {
	border-color: var(--color-danger, #e53e3e);
}

.input-wrapper.has-error .input-field:focus {
	border-color: var(--color-danger, #e53e3e);
	box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.1);
}

.input-field:disabled {
	background-color: var(--color-border-light, #2d3748);
	color: var(--color-text-light, #4a5568);
	cursor: not-allowed;
	opacity: 0.6;
}

.input-field:readonly {
	background-color: var(--color-border-light, #2d3748);
	cursor: default;
}

.character-count {
	position: absolute;
	right: var(--spacing-sm, 0.5rem);
	top: 50%;
	transform: translateY(-50%);
	font-size: var(--text-xs, 0.75rem);
	color: var(--color-text-muted, #a0aec0);
	background-color: var(--color-surface, #2d3748);
	padding: 2px 4px;
	border-radius: var(--radius-sm, 0.25rem);
	pointer-events: none;
}

.character-count.over-limit {
	color: var(--color-danger, #e53e3e);
}

.input-helper {
	color: var(--color-text-muted, #a0aec0);
	font-size: var(--text-xs, 0.75rem);
	line-height: var(--leading-normal, 1.5);
}

.input-error {
	color: var(--color-danger, #e53e3e);
	font-size: var(--text-xs, 0.75rem);
	line-height: var(--leading-normal, 1.5);
	display: flex;
	align-items: center;
	gap: var(--spacing-xs, 0.25rem);
}

.input-error::before {
	content: '⚠';
	font-size: var(--text-sm, 0.875rem);
}

/* Focus within container */
.input-wrapper.is-focused {
	/* Additional focus styles can be added here */
}

/* Mobile optimizations */
@media (max-width: 768px) {
	.input-field {
		font-size: 16px; /* Prevent zoom on iOS */
		padding: var(--spacing-sm, 0.5rem);
	}
	
	.character-count {
		position: static;
		transform: none;
		margin-top: var(--spacing-xs, 0.25rem);
		text-align: right;
	}
}

/* High contrast mode */
@media (prefers-contrast: high) {
	.input-field {
		border-width: 2px;
	}
	
	.input-wrapper.has-error .input-field {
		border-width: 2px;
	}
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
	.input-field {
		transition: none;
	}
}
</style>