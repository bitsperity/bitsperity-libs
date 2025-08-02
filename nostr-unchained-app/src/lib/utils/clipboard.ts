/**
 * Clipboard Utilities
 * 
 * Modern clipboard API with fallback support for older browsers.
 * Handles async clipboard operations with proper error handling.
 * Max 200 lines - Zero Monolith Policy
 */

import { createContextLogger } from './Logger.js';

// =============================================================================
// Types
// =============================================================================

export interface ClipboardResult {
	success: boolean;
	error?: string;
}

export interface ClipboardOptions {
	showFeedback?: boolean;
	feedbackDuration?: number;
	fallbackMethod?: 'execCommand' | 'textArea' | 'none';
}

// =============================================================================
// Logger
// =============================================================================

const logger = createContextLogger('Clipboard');

// =============================================================================
// Main Clipboard Function
// =============================================================================

/**
 * Copy text to clipboard with modern API and fallback support
 */
export async function copyToClipboard(
	text: string, 
	options: ClipboardOptions = {}
): Promise<ClipboardResult> {
	const {
		showFeedback = false,
		feedbackDuration = 2000,
		fallbackMethod = 'textArea'
	} = options;
	
	logger.debug('Attempting to copy to clipboard', { 
		textLength: text.length,
		showFeedback,
		fallbackMethod 
	});

	// Try modern Clipboard API first
	if (navigator.clipboard && window.isSecureContext) {
		try {
			await navigator.clipboard.writeText(text);
			logger.debug('Clipboard copy successful (modern API)');
			
			if (showFeedback) {
				showCopyFeedback('Copied to clipboard!', feedbackDuration);
			}
			
			return { success: true };
		} catch (error) {
			logger.warn('Modern clipboard API failed, trying fallback', { error });
			// Continue to fallback methods
		}
	}

	// Fallback methods for older browsers or insecure contexts
	if (fallbackMethod === 'execCommand') {
		return copyWithExecCommand(text, showFeedback, feedbackDuration);
	} else if (fallbackMethod === 'textArea') {
		return copyWithTextArea(text, showFeedback, feedbackDuration);
	}

	// No fallback method available
	const errorMsg = 'Clipboard not supported in this environment';
	logger.error(errorMsg);
	
	if (showFeedback) {
		showCopyFeedback('Copy failed - not supported', feedbackDuration);
	}
	
	return { success: false, error: errorMsg };
}

// =============================================================================
// Fallback Methods
// =============================================================================

/**
 * Fallback using deprecated execCommand
 */
function copyWithExecCommand(
	text: string, 
	showFeedback: boolean, 
	feedbackDuration: number
): ClipboardResult {
	try {
		// Create temporary element
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		
		const successful = document.execCommand('copy');
		document.body.removeChild(textArea);
		
		if (successful) {
			logger.debug('Clipboard copy successful (execCommand)');
			
			if (showFeedback) {
				showCopyFeedback('Copied to clipboard!', feedbackDuration);
			}
			
			return { success: true };
		} else {
			throw new Error('execCommand returned false');
		}
	} catch (error) {
		const errorMsg = `execCommand fallback failed: ${error}`;
		logger.error(errorMsg, { error });
		
		if (showFeedback) {
			showCopyFeedback('Copy failed', feedbackDuration);
		}
		
		return { success: false, error: errorMsg };
	}
}

/**
 * Fallback using temporary textarea (most compatible)
 */
function copyWithTextArea(
	text: string, 
	showFeedback: boolean, 
	feedbackDuration: number
): ClipboardResult {
	try {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		
		// Make textarea invisible but still selectable
		textArea.style.position = 'absolute';
		textArea.style.left = '-9999px';
		textArea.style.top = '0';
		textArea.setAttribute('readonly', '');
		textArea.style.fontSize = '12pt';
		textArea.style.border = '0';
		textArea.style.padding = '0';
		textArea.style.margin = '0';
		
		document.body.appendChild(textArea);
		
		// Handle iOS Safari
		if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
			const range = document.createRange();
			range.selectNodeContents(textArea);
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
				selection.addRange(range);
			}
			textArea.setSelectionRange(0, 999999);
		} else {
			textArea.select();
		}
		
		const successful = document.execCommand('copy');
		document.body.removeChild(textArea);
		
		if (successful) {
			logger.debug('Clipboard copy successful (textarea)');
			
			if (showFeedback) {
				showCopyFeedback('Copied to clipboard!', feedbackDuration);
			}
			
			return { success: true };
		} else {
			throw new Error('Textarea method failed');
		}
	} catch (error) {
		const errorMsg = `Textarea fallback failed: ${error}`;
		logger.error(errorMsg, { error });
		
		if (showFeedback) {
			showCopyFeedback('Copy failed', feedbackDuration);
		}
		
		return { success: false, error: errorMsg };
	}
}

// =============================================================================
// Feedback System
// =============================================================================

/**
 * Show copy feedback to user
 */
function showCopyFeedback(message: string, duration: number): void {
	// Create feedback element
	const feedback = document.createElement('div');
	feedback.textContent = message;
	feedback.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: var(--color-surface, #2d3748);
		color: var(--color-text, #f7fafc);
		padding: 12px 16px;
		border-radius: var(--radius-md, 0.5rem);
		box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.1));
		z-index: 9999;
		font-size: var(--text-sm, 0.875rem);
		font-family: var(--font-sans, sans-serif);
		transition: all 250ms ease-in-out;
		opacity: 0;
		transform: translateY(-10px);
	`;
	
	document.body.appendChild(feedback);
	
	// Animate in
	requestAnimationFrame(() => {
		feedback.style.opacity = '1';
		feedback.style.transform = 'translateY(0)';
	});
	
	// Remove after duration
	setTimeout(() => {
		feedback.style.opacity = '0';
		feedback.style.transform = 'translateY(-10px)';
		
		setTimeout(() => {
			if (feedback.parentNode) {
				document.body.removeChild(feedback);
			}
		}, 250);
	}, duration);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Copy text with feedback (common use case)
 */
export async function copyWithFeedback(text: string): Promise<ClipboardResult> {
	return copyToClipboard(text, { 
		showFeedback: true,
		feedbackDuration: 2000 
	});
}

/**
 * Copy pubkey with truncated feedback
 */
export async function copyPubkey(pubkey: string): Promise<ClipboardResult> {
	const result = await copyToClipboard(pubkey, { 
		showFeedback: true,
		feedbackDuration: 2000 
	});
	
	return result;
}

/**
 * Check if clipboard is available
 */
export function isClipboardAvailable(): boolean {
	return !!(navigator.clipboard && window.isSecureContext) || 
		   !!(document.execCommand);
}