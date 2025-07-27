/**
 * Error Handler Utility
 * 
 * Centralized error handling with user-friendly messages.
 * Follows Single Responsibility Principle.
 * Max 200 lines - Zero Monolith Policy
 */

import type { AppError, UserFriendlyError, ErrorType } from '../types/app.js';

// =============================================================================
// Error Creation Utilities
// =============================================================================

export function createAppError(
	type: ErrorType,
	message: string,
	retryable = false,
	code?: string
): AppError {
	const error: AppError = {
		type,
		message,
		retryable,
		timestamp: Date.now()
	};
	
	if (code !== undefined) {
		(error as { code?: string }).code = code;
	}
	
	return error;
}

export function createNetworkError(message: string, retryable = true): AppError {
	return createAppError('network', message, retryable);
}

export function createValidationError(message: string): AppError {
	return createAppError('validation', message, false);
}

export function createAuthError(message: string, retryable = true): AppError {
	return createAppError('auth', message, retryable);
}

export function createNostrError(message: string, retryable = true): AppError {
	return createAppError('nostr', message, retryable);
}

// =============================================================================
// Error Mapping to User-Friendly Messages
// =============================================================================

const ERROR_MESSAGES: Record<ErrorType, Record<string, string>> = {
	network: {
		default: 'Verbindungsproblem. Bitte prüfe deine Internetverbindung.',
		timeout: 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.',
		offline: 'Du bist offline. Einige Funktionen sind nicht verfügbar.'
	},
	validation: {
		default: 'Eingabe ist ungültig. Bitte prüfe deine Daten.',
		required: 'Dieses Feld ist erforderlich.',
		format: 'Das Format ist ungültig.'
	},
	auth: {
		default: 'Authentifizierung fehlgeschlagen.',
		noExtension: 'Keine Nostr-Browser-Erweiterung gefunden.',
		keyInvalid: 'Der Schlüssel ist ungültig.',
		signFailed: 'Signierung fehlgeschlagen.'
	},
	nostr: {
		default: 'Nostr-Fehler aufgetreten.',
		relayError: 'Relay-Verbindung fehlgeschlagen.',
		eventInvalid: 'Event ist ungültig.'
	},
	unknown: {
		default: 'Ein unbekannter Fehler ist aufgetreten.'
	}
};

const ERROR_TITLES: Record<ErrorType, string> = {
	network: 'Verbindungsfehler',
	validation: 'Eingabefehler',
	auth: 'Authentifizierungsfehler',
	nostr: 'Nostr-Fehler',
	unknown: 'Unbekannter Fehler'
};

// =============================================================================
// User-Friendly Error Conversion
// =============================================================================

export function toUserFriendlyError(error: AppError): UserFriendlyError {
	const title = ERROR_TITLES[error.type] || ERROR_TITLES.unknown;
	
	const messages = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.unknown;
	const message = messages[error.code || 'default'] || messages.default;

	const userFriendlyError: UserFriendlyError = {
		title,
		message,
		retryable: error.retryable
	};

	// Add retry action for retryable errors
	if (error.retryable) {
		(userFriendlyError as { action?: { label: string; handler: () => void } }).action = {
			label: 'Erneut versuchen',
			handler: () => {
				// Placeholder for retry logic
				// Will be implemented by consuming components
			}
		};
	}

	return userFriendlyError;
}

// =============================================================================
// Error Processing Pipeline
// =============================================================================

export class ErrorProcessor {
	private readonly handlers: ((error: AppError) => void)[] = [];

	addHandler(handler: (error: AppError) => void): void {
		this.handlers.push(handler);
	}

	process(error: unknown): AppError {
		const appError = this.normalizeError(error);
		
		// Execute all registered handlers
		this.handlers.forEach(handler => {
			try {
				handler(appError);
			} catch (handlerError) {
				console.error('Error handler failed:', handlerError);
			}
		});

		return appError;
	}

	private normalizeError(error: unknown): AppError {
		// Already an AppError
		if (this.isAppError(error)) {
			return error;
		}

		// Standard Error object
		if (error instanceof Error) {
			return this.fromStandardError(error);
		}

		// String error
		if (typeof error === 'string') {
			return createAppError('unknown', error);
		}

		// Unknown error type
		return createAppError('unknown', 'An unknown error occurred');
	}

	private fromStandardError(error: Error): AppError {
		// Network errors
		if (error.name === 'NetworkError' || error.message.includes('fetch')) {
			return createNetworkError(error.message);
		}

		// Timeout errors
		if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
			return createNetworkError('Request timed out', true);
		}

		// Default to unknown error
		return createAppError('unknown', error.message);
	}

	private isAppError(error: unknown): error is AppError {
		return (
			typeof error === 'object' &&
			error !== null &&
			'type' in error &&
			'message' in error &&
			'retryable' in error &&
			'timestamp' in error
		);
	}
}

// =============================================================================
// Global Error Processor
// =============================================================================

export const errorProcessor = new ErrorProcessor();