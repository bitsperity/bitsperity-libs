<script lang="ts">
/**
 * Textarea Component
 * 
 * Reusable form textarea with validation states, auto-resize, and character counting.
 * Follows accessibility best practices and supports markdown editing.
 * Max 200 lines - Zero Monolith Policy
 */

import { createEventDispatcher } from 'svelte';
import { generateId } from '../../utils/dom.js';

// =============================================================================
// Props & Types
// =============================================================================

interface Props {
	value?: string;
	placeholder?: string;
	label?: string;
	helperText?: string;
	error?: string;
	disabled?: boolean;
	required?: boolean;
	readonly?: boolean;
	rows?: number;
	maxLength?: number;
	autoResize?: boolean;
	showCharacterCount?: boolean;
	className?: string;
	textareaClass?: string;
}

const {
	value = '',
	placeholder,
	label,
	helperText,
	error,
	disabled = false,
	required = false,
	readonly = false,
	rows = 4,
	maxLength,
	autoResize = true,
	showCharacterCount = true,
	className = '',
	textareaClass = ''
}: Props = $props();

// =============================================================================
// Event Dispatcher
// =============================================================================

const dispatch = createEventDispatcher<{
	input: string;
	change: string;
	focus: FocusEvent;
	blur: FocusEvent;
	keydown: KeyboardEvent;
}>();

// =============================================================================
// State Management
// =============================================================================

const textareaId = generateId('textarea');
const helperId = helperText ? generateId('helper') : undefined;
const errorId = error ? generateId('error') : undefined;

let textareaElement: HTMLTextAreaElement;
let internalValue = $state(value);
let isFocused = $state(false);

// Sync internal value with prop
$effect(() => {
	internalValue = value;
});

// Auto-resize effect
$effect(() => {
	if (autoResize && textareaElement && internalValue !== undefined) {
		resizeTextarea();
	}
});

// =============================================================================
// Computed Properties
// =============================================================================

const hasError = $derived(!!error);
const characterCount = $derived(internalValue.length);
const isOverLimit = $derived(maxLength ? characterCount > maxLength : false);
const showCounter = $derived(showCharacterCount && (maxLength || characterCount > 0));

const describedBy = $derived(() => {
	const ids = [];
	if (helperId) ids.push(helperId);
	if (errorId) ids.push(errorId);
	return ids.length > 0 ? ids.join(' ') : undefined;
});

// =============================================================================
// Methods
// =============================================================================

function resizeTextarea() {
	if (!textareaElement) return;
	
	// Reset height to auto to get the correct scrollHeight
	textareaElement.style.height = 'auto';
	
	// Set height to scrollHeight
	const newHeight = Math.max(textareaElement.scrollHeight, rows * 24); // 24px per row approximation
	textareaElement.style.height = `${newHeight}px`;
}

// =============================================================================
// Event Handlers
// =============================================================================

function handleInput(event: Event) {
	const target = event.target as HTMLTextAreaElement;
	internalValue = target.value;
	
	if (autoResize) {
		resizeTextarea();
	}
	
	dispatch('input', target.value);
}

function handleChange(event: Event) {
	const target = event.target as HTMLTextAreaElement;
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
	// Allow Tab indentation
	if (event.key === 'Tab' && !event.shiftKey) {
		event.preventDefault();
		insertTextAtCursor('  '); // 2 spaces for indentation
		return;
	}
	
	dispatch('keydown', event);
}

function insertTextAtCursor(text: string) {
	if (!textareaElement) return;
	
	const start = textareaElement.selectionStart;
	const end = textareaElement.selectionEnd;
	const currentValue = textareaElement.value;
	
	const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
	internalValue = newValue;
	
	// Set cursor position after inserted text
	setTimeout(() => {
		textareaElement.setSelectionRange(start + text.length, start + text.length);
		textareaElement.focus();
	}, 0);
	
	dispatch('input', newValue);
}

// =============================================================================
// Public Methods
// =============================================================================

export function focus() {
	textareaElement?.focus();
}

export function blur() {
	textareaElement?.blur();
}

export function select() {
	textareaElement?.select();
}

export function insertText(text: string) {
	insertTextAtCursor(text);
}

export function getSelection(): { start: number; end: number; text: string } {
	if (!textareaElement) return { start: 0, end: 0, text: '' };
	
	const start = textareaElement.selectionStart;
	const end = textareaElement.selectionEnd;
	const text = textareaElement.value.substring(start, end);
	
	return { start, end, text };
}
</script>

<div class="textarea-container {className}">
	<!-- Label -->
	{#if label}
		<label for={textareaId} class="textarea-label">
			{label}
			{#if required}
				<span class="textarea-required" aria-label="required">*</span>
			{/if}
		</label>
	{/if}
	
	<!-- Textarea Wrapper -->
	<div class="textarea-wrapper" class:has-error={hasError} class:is-focused={isFocused}>
		<textarea
			bind:this={textareaElement}
			id={textareaId}
			{placeholder}
			{disabled}
			{readonly}
			{required}
			{rows}
			{maxLength}
			value={internalValue}
			class="textarea-field {textareaClass}"
			class:auto-resize={autoResize}
			aria-invalid={hasError}
			aria-describedby={describedBy}
			on:input={handleInput}
			on:change={handleChange}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:keydown={handleKeydown}
		></textarea>
		
		<!-- Character Count -->
		{#if showCounter}
			<div class="character-count" class:over-limit={isOverLimit}>
				{characterCount}{#if maxLength}/{maxLength}{/if}
			</div>
		{/if}
	</div>
	
	<!-- Helper Text -->
	{#if helperText && !error}
		<div id={helperId} class="textarea-helper">
			{helperText}
		</div>
	{/if}
	
	<!-- Error Message -->
	{#if error}
		<div id={errorId} class="textarea-error" role="alert">
			{error}
		</div>
	{/if}
</div>

<style>
.textarea-container {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs, 0.25rem);
}

.textarea-label {
	color: var(--color-text, #f7fafc);
	font-size: var(--text-sm, 0.875rem);
	font-weight: 500;
	line-height: var(--leading-tight, 1.25);
}

.textarea-required {
	color: var(--color-danger, #e53e3e);
	margin-left: 2px;
}

.textarea-wrapper {
	position: relative;
	display: flex;
	flex-direction: column;
}

.textarea-field {
	width: 100%;
	padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
	background-color: var(--color-surface, #2d3748);
	border: 1px solid var(--color-border, #4a5568);
	border-radius: var(--radius-md, 0.5rem);
	color: var(--color-text, #f7fafc);
	font-size: var(--text-base, 1rem);
	font-family: var(--font-sans, sans-serif);
	line-height: var(--leading-normal, 1.5);
	transition: all var(--transition-fast, 150ms ease-in-out);
	resize: none;
	min-height: calc(var(--text-base, 1rem) * var(--leading-normal, 1.5) * 4 + var(--spacing-sm, 0.5rem) * 2); /* 4 rows */
}

.textarea-field.auto-resize {
	resize: none;
	overflow-y: hidden;
}

.textarea-field::placeholder {
	color: var(--color-text-muted, #a0aec0);
}

.textarea-field:focus {
	outline: none;
	border-color: var(--color-primary, #667eea);
	box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.textarea-wrapper.has-error .textarea-field {
	border-color: var(--color-danger, #e53e3e);
}

.textarea-wrapper.has-error .textarea-field:focus {
	border-color: var(--color-danger, #e53e3e);
	box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.1);
}

.textarea-field:disabled {
	background-color: var(--color-border-light, #2d3748);
	color: var(--color-text-light, #4a5568);
	cursor: not-allowed;
	opacity: 0.6;
}

.textarea-field:readonly {
	background-color: var(--color-border-light, #2d3748);
	cursor: default;
}

.character-count {
	position: absolute;
	bottom: var(--spacing-xs, 0.25rem);
	right: var(--spacing-sm, 0.5rem);
	font-size: var(--text-xs, 0.75rem);
	color: var(--color-text-muted, #a0aec0);
	background-color: var(--color-surface, #2d3748);
	padding: 2px 6px;
	border-radius: var(--radius-sm, 0.25rem);
	pointer-events: none;
	border: 1px solid var(--color-border, #4a5568);
}

.character-count.over-limit {
	color: var(--color-danger, #e53e3e);
	border-color: var(--color-danger, #e53e3e);
}

.textarea-helper {
	color: var(--color-text-muted, #a0aec0);
	font-size: var(--text-xs, 0.75rem);
	line-height: var(--leading-normal, 1.5);
}

.textarea-error {
	color: var(--color-danger, #e53e3e);
	font-size: var(--text-xs, 0.75rem);
	line-height: var(--leading-normal, 1.5);
	display: flex;
	align-items: center;
	gap: var(--spacing-xs, 0.25rem);
}

.textarea-error::before {
	content: '⚠';
	font-size: var(--text-sm, 0.875rem);
}

/* Focus within container */
.textarea-wrapper.is-focused {
	/* Additional focus styles can be added here */
}

/* Mobile optimizations */
@media (max-width: 768px) {
	.textarea-field {
		font-size: 16px; /* Prevent zoom on iOS */
		padding: var(--spacing-sm, 0.5rem);
	}
	
	.character-count {
		position: static;
		margin-top: var(--spacing-xs, 0.25rem);
		text-align: right;
		align-self: flex-end;
	}
}

/* High contrast mode */
@media (prefers-contrast: high) {
	.textarea-field {
		border-width: 2px;
	}
	
	.textarea-wrapper.has-error .textarea-field {
		border-width: 2px;
	}
	
	.character-count {
		border-width: 1px;
	}
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
	.textarea-field {
		transition: none;
	}
}
</style>