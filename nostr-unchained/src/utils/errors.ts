/**
 * Error Handling Utilities
 * 
 * Provides consistent error handling and user-friendly error messages
 * with actionable suggestions for recovery.
 */

import type { NostrError, RelayResult } from '../core/types.js';
import { ERROR_MESSAGES, SUGGESTIONS } from './constants.js';

export class ErrorHandler {
  /**
   * Create a standardized Nostr error
   */
  static createError(
    type: 'validation' | 'network' | 'signing' | 'relay' | 'config',
    message: string,
    options: {
      retryable?: boolean;
      suggestion?: string;
      userAction?: string;
    } = {}
  ): NostrError {
    return {
      message,
      retryable: options.retryable ?? false,
      suggestion: options.suggestion,
      userAction: options.userAction
    };
  }

  /**
   * Handle content validation errors
   */
  static handleContentError(content: string): NostrError {
    if (content === '') {
      return ErrorHandler.createError('validation', ERROR_MESSAGES.EMPTY_CONTENT, {
        retryable: true,
        suggestion: SUGGESTIONS.EMPTY_CONTENT
      });
    }

    if (content.length > 8192) {
      return ErrorHandler.createError('validation', ERROR_MESSAGES.CONTENT_TOO_LONG, {
        retryable: true,
        suggestion: SUGGESTIONS.CONTENT_TOO_LONG
      });
    }

    return ErrorHandler.createError('validation', ERROR_MESSAGES.INVALID_EVENT);
  }

  /**
   * Handle signing errors
   */
  static handleSigningError(error: Error): NostrError {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('user declined') || errorMessage.includes('denied')) {
      return ErrorHandler.createError('signing', 'User declined to sign the event', {
        retryable: true,
        userAction: 'User declined signing',
        suggestion: 'Click approve in your Nostr extension to publish the event'
      });
    }

    if (errorMessage.includes('no extension')) {
      return ErrorHandler.createError('signing', ERROR_MESSAGES.NO_EXTENSION, {
        retryable: false,
        suggestion: SUGGESTIONS.NO_EXTENSION
      });
    }

    return ErrorHandler.createError('signing', ERROR_MESSAGES.SIGNING_FAILED, {
      retryable: true,
      suggestion: 'Check your Nostr extension and try again'
    });
  }

  /**
   * Handle relay connection errors
   */
  static handleConnectionError(relayUrl: string, error: Error): NostrError {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('timeout')) {
      return ErrorHandler.createError('network', `Connection to ${relayUrl} timed out`, {
        retryable: true,
        suggestion: 'The relay might be slow or unavailable. Try again or use different relays'
      });
    }

    if (errorMessage.includes('refused') || errorMessage.includes('failed to connect')) {
      return ErrorHandler.createError('network', `Failed to connect to ${relayUrl}`, {
        retryable: true,
        suggestion: 'The relay might be down. Check the relay URL or try different relays'
      });
    }

    return ErrorHandler.createError('network', ERROR_MESSAGES.CONNECTION_FAILED, {
      retryable: true,
      suggestion: SUGGESTIONS.CONNECTION_FAILED
    });
  }

  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(relayResults: RelayResult[]): {
    success: boolean;
    error?: NostrError;
  } {
    const totalRelays = relayResults.length;
    const successfulRelays = relayResults.filter(r => r.success);
    const failedRelays = relayResults.filter(r => !r.success);

    // No relays configured
    if (totalRelays === 0) {
      return {
        success: false,
        error: ErrorHandler.createError('config', ERROR_MESSAGES.NO_RELAYS, {
          retryable: false,
          suggestion: 'Configure at least one relay URL'
        })
      };
    }

    // All relays failed
    if (successfulRelays.length === 0) {
      const allTimeouts = failedRelays.every(r => 
        r.error?.toLowerCase().includes('timeout')
      );

      const allConnectionFailed = failedRelays.every(r =>
        r.error?.toLowerCase().includes('connect') ||
        r.error?.toLowerCase().includes('refused')
      );

      if (allTimeouts) {
        return {
          success: false,
          error: ErrorHandler.createError('network', 'All relays timed out', {
            retryable: true,
            suggestion: 'Check your internet connection or try again later'
          })
        };
      }

      if (allConnectionFailed) {
        return {
          success: false,
          error: ErrorHandler.createError('network', 'Could not connect to any relay', {
            retryable: true,
            suggestion: 'Check relay URLs and your internet connection'
          })
        };
      }

      return {
        success: false,
        error: ErrorHandler.createError('relay', ERROR_MESSAGES.PUBLISH_FAILED, {
          retryable: true,
          suggestion: SUGGESTIONS.PUBLISH_FAILED
        })
      };
    }

    // At least one relay succeeded
    return { success: true };
  }

  /**
   * Create user-friendly error message with context
   */
  static formatErrorForUser(error: NostrError, context?: {
    relayResults?: RelayResult[];
    attemptedRelays?: string[];
  }): string {
    let message = error.message;

    // Add context if available
    if (context?.relayResults) {
      const successful = context.relayResults.filter(r => r.success).length;
      const total = context.relayResults.length;
      
      if (successful > 0) {
        message += ` (${successful}/${total} relays succeeded)`;
      } else {
        message += ` (0/${total} relays succeeded)`;
      }
    }

    // Add suggestion if available
    if (error.suggestion) {
      message += `\n\nSuggestion: ${error.suggestion}`;
    }

    // Add retry information
    if (error.retryable) {
      message += '\n\nThis error is retryable - you can try again.';
    }

    return message;
  }

  /**
   * Check if error should trigger automatic retry
   */
  static shouldRetry(error: NostrError, attemptCount: number, maxRetries: number): boolean {
    return error.retryable && attemptCount < maxRetries;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(baseDelay * Math.pow(2, attemptCount), 30000); // Max 30 seconds
  }
}