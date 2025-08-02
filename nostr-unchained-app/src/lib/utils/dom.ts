/**
 * DOM Utilities
 * 
 * Common DOM manipulation and helper functions.
 * Includes ID generation, element queries, and accessibility helpers.
 * Max 200 lines - Zero Monolith Policy
 */

// =============================================================================
// ID Generation
// =============================================================================

let idCounter = 0;

/**
 * Generate unique ID for form elements
 */
export function generateId(prefix: string = 'id'): string {
	return `${prefix}-${++idCounter}-${Date.now().toString(36)}`;
}

/**
 * Generate unique ID with namespace
 */
export function generateNamespacedId(namespace: string, prefix: string = 'id'): string {
	return `${namespace}-${prefix}-${++idCounter}-${Date.now().toString(36)}`;
}

// =============================================================================
// Element Queries
// =============================================================================

/**
 * Find focusable elements within a container
 */
export function getFocusableElements(container: Element): HTMLElement[] {
	const selector = [
		'button:not([disabled])',
		'[href]',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(', ');

	return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

/**
 * Get first focusable element in container
 */
export function getFirstFocusable(container: Element): HTMLElement | null {
	const focusable = getFocusableElements(container);
	return focusable.length > 0 ? focusable[0] : null;
}

/**
 * Get last focusable element in container
 */
export function getLastFocusable(container: Element): HTMLElement | null {
	const focusable = getFocusableElements(container);
	return focusable.length > 0 ? focusable[focusable.length - 1] : null;
}

// =============================================================================
// Accessibility Helpers
// =============================================================================

/**
 * Set ARIA attributes on element
 */
export function setAriaAttributes(element: Element, attributes: Record<string, string | boolean>): void {
	Object.entries(attributes).forEach(([key, value]) => {
		if (value === false) {
			element.removeAttribute(`aria-${key}`);
		} else {
			element.setAttribute(`aria-${key}`, String(value));
		}
	});
}

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
	const announcer = document.createElement('div');
	announcer.setAttribute('aria-live', priority);
	announcer.setAttribute('aria-atomic', 'true');
	announcer.className = 'sr-only';
	announcer.textContent = text;
	
	document.body.appendChild(announcer);
	
	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcer);
	}, 1000);
}

// =============================================================================
// Scroll Utilities
// =============================================================================

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(element: Element, options: ScrollIntoViewOptions = {}): void {
	const defaultOptions: ScrollIntoViewOptions = {
		behavior: 'smooth',
		block: 'nearest',
		inline: 'nearest'
	};
	
	element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * Get scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
	return {
		x: window.pageXOffset || document.documentElement.scrollLeft,
		y: window.pageYOffset || document.documentElement.scrollTop
	};
}

// =============================================================================
// Element State
// =============================================================================

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	const windowHeight = window.innerHeight || document.documentElement.clientHeight;
	const windowWidth = window.innerWidth || document.documentElement.clientWidth;
	
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= windowHeight &&
		rect.right <= windowWidth
	);
}

/**
 * Check if element is partially visible in viewport
 */
export function isElementPartiallyVisible(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	const windowHeight = window.innerHeight || document.documentElement.clientHeight;
	const windowWidth = window.innerWidth || document.documentElement.clientWidth;
	
	return (
		rect.bottom > 0 &&
		rect.right > 0 &&
		rect.top < windowHeight &&
		rect.left < windowWidth
	);
}

// =============================================================================
// Event Utilities
// =============================================================================

/**
 * Add event listener with automatic cleanup
 */
export function addEventListener<K extends keyof WindowEventMap>(
	target: Window,
	type: K,
	listener: (event: WindowEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): () => void;

export function addEventListener<K extends keyof DocumentEventMap>(
	target: Document,
	type: K,
	listener: (event: DocumentEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): () => void;

export function addEventListener<K extends keyof HTMLElementEventMap>(
	target: HTMLElement,
	type: K,
	listener: (event: HTMLElementEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): () => void;

export function addEventListener(
	target: EventTarget,
	type: string,
	listener: EventListener,
	options?: boolean | AddEventListenerOptions
): () => void {
	target.addEventListener(type, listener, options);
	
	return () => {
		target.removeEventListener(type, listener, options);
	};
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => void>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: number;
	
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => func(...args), delay);
	};
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => void>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;
	
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= delay) {
			lastCall = now;
			func(...args);
		}
	};
}

// =============================================================================
// CSS Utilities
// =============================================================================

/**
 * Add CSS class with transition support
 */
export function addClass(element: Element, className: string, duration?: number): Promise<void> {
	return new Promise(resolve => {
		element.classList.add(className);
		
		if (duration) {
			setTimeout(resolve, duration);
		} else {
			// Wait for next frame
			requestAnimationFrame(() => resolve());
		}
	});
}

/**
 * Remove CSS class with transition support
 */
export function removeClass(element: Element, className: string, duration?: number): Promise<void> {
	return new Promise(resolve => {
		element.classList.remove(className);
		
		if (duration) {
			setTimeout(resolve, duration);
		} else {
			// Wait for next frame
			requestAnimationFrame(() => resolve());
		}
	});
}

/**
 * Toggle CSS class
 */
export function toggleClass(element: Element, className: string, force?: boolean): boolean {
	return element.classList.toggle(className, force);
}