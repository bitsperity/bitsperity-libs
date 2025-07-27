/**
 * Logger Utility
 * 
 * Structured logging with different levels and contexts.
 * Follows Single Responsibility Principle.
 * Max 200 lines - Zero Monolith Policy
 */

import type { AppError } from '../types/app.js';

// =============================================================================
// Logger Types
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
	readonly level: LogLevel;
	readonly message: string;
	readonly context?: string;
	readonly data?: unknown;
	readonly timestamp: number;
}

export interface LoggerConfig {
	readonly level: LogLevel;
	readonly enableConsole: boolean;
	readonly enableStorage: boolean;
	readonly maxEntries: number;
}

// =============================================================================
// Logger Implementation
// =============================================================================

export class Logger {
	private readonly config: LoggerConfig;
	private readonly entries: LogEntry[] = [];
	private readonly levelValues: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3
	};

	constructor(config: Partial<LoggerConfig> = {}) {
		this.config = {
			level: config.level || 'info',
			enableConsole: config.enableConsole ?? true,
			enableStorage: config.enableStorage ?? false,
			maxEntries: config.maxEntries || 1000
		};
	}

	debug(message: string, context?: string, data?: unknown): void {
		this.log('debug', message, context, data);
	}

	info(message: string, context?: string, data?: unknown): void {
		this.log('info', message, context, data);
	}

	warn(message: string, context?: string, data?: unknown): void {
		this.log('warn', message, context, data);
	}

	error(message: string, context?: string, data?: unknown): void {
		this.log('error', message, context, data);
	}

	logError(error: AppError, context?: string): void {
		this.error(
			error.message,
			context || error.type,
			{
				type: error.type,
				code: error.code,
				retryable: error.retryable,
				timestamp: error.timestamp
			}
		);
	}

	private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
		// Check if log level is enabled
		if (this.levelValues[level] < this.levelValues[this.config.level]) {
			return;
		}

		const entry: LogEntry = {
			level,
			message,
			data,
			timestamp: Date.now()
		};
		
		if (context !== undefined) {
			(entry as { context?: string }).context = context;
		}

		// Store entry
		if (this.config.enableStorage) {
			this.storeEntry(entry);
		}

		// Console output
		if (this.config.enableConsole) {
			this.outputToConsole(entry);
		}
	}

	private storeEntry(entry: LogEntry): void {
		this.entries.push(entry);

		// Limit stored entries
		if (this.entries.length > this.config.maxEntries) {
			this.entries.shift();
		}
	}

	private outputToConsole(entry: LogEntry): void {
		const timestamp = new Date(entry.timestamp).toISOString();
		const contextStr = entry.context ? `[${entry.context}]` : '';
		const message = `${timestamp} ${entry.level.toUpperCase()} ${contextStr} ${entry.message}`;

		switch (entry.level) {
			case 'debug':
				console.debug(message, entry.data);
				break;
			case 'info':
				console.info(message, entry.data);
				break;
			case 'warn':
				console.warn(message, entry.data);
				break;
			case 'error':
				console.error(message, entry.data);
				break;
		}
	}

	// =============================================================================
	// Utility Methods
	// =============================================================================

	getEntries(): readonly LogEntry[] {
		return [...this.entries];
	}

	getEntriesByLevel(level: LogLevel): readonly LogEntry[] {
		return this.entries.filter(entry => entry.level === level);
	}

	getEntriesByContext(context: string): readonly LogEntry[] {
		return this.entries.filter(entry => entry.context === context);
	}

	clear(): void {
		this.entries.length = 0;
	}

	setLevel(level: LogLevel): void {
		(this.config as { level: LogLevel }).level = level;
	}
}

// =============================================================================
// Context-Specific Loggers
// =============================================================================

export function createContextLogger(context: string, baseLogger?: Logger): Logger {
	const logger = baseLogger || globalLogger;

	return {
		debug: (message: string, data?: unknown) => logger.debug(message, context, data),
		info: (message: string, data?: unknown) => logger.info(message, context, data),
		warn: (message: string, data?: unknown) => logger.warn(message, context, data),
		error: (message: string, data?: unknown) => logger.error(message, context, data),
		logError: (error: AppError) => logger.logError(error, context)
	} as Logger;
}

// =============================================================================
// Global Logger Instance
// =============================================================================

export const globalLogger = new Logger({
	level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
	enableConsole: true,
	enableStorage: process.env.NODE_ENV !== 'production'
});

// =============================================================================
// Convenience Exports
// =============================================================================

export const log = globalLogger;