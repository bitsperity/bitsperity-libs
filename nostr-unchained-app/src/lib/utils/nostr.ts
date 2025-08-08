/**
 * Nostr Utilities
 * 
 * Common utility functions for Nostr protocol operations.
 * Includes pubkey formatting, validation, and URL normalization.
 * Max 200 lines - Zero Monolith Policy
 */

import { createContextLogger } from './Logger.js';
import { isValidHexKey, isValidNpub, npubToHex } from 'nostr-unchained';

// =============================================================================
// Types
// =============================================================================

export interface FormatPubkeyOptions {
	length?: number;
	showEllipsis?: boolean;
	prefix?: string;
	suffix?: string;
}

export interface NormalizeUrlResult {
	url: string;
	isValid: boolean;
	protocol: string;
	domain: string;
}

export interface NormalizeRecipientResult {
  ok: boolean;
  hex?: string;
  source?: 'hex' | 'npub';
  errorCode?: 'format' | 'empty' | 'unknown';
}

// =============================================================================
// Constants
// =============================================================================

const HEX_REGEX = /^[0-9a-fA-F]+$/;
const PUBKEY_LENGTH = 64;
const NIP05_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const LIGHTNING_ADDRESS_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// =============================================================================
// Logger
// =============================================================================

const logger = createContextLogger('NostrUtils');

// =============================================================================
// Pubkey Operations
// =============================================================================

/**
 * Format a pubkey for display with optional truncation
 */
export function formatPubkey(
	pubkey: string,
	options: FormatPubkeyOptions = {}
): string {
	const {
		length = 16,
		showEllipsis = true,
		prefix = '',
		suffix = ''
	} = options;
	
  if (!pubkey || typeof pubkey !== 'string') {
    // Quietly handle empty/invalid input to avoid UI noise and loops
    return '';
  }
	
	// Validate pubkey format
  if (!isValidPubkey(pubkey)) {
    return '';
  }
	
	// Return full pubkey if length is greater than or equal to pubkey length
	if (length >= pubkey.length) {
		return `${prefix}${pubkey}${suffix}`;
	}
	
	// Calculate truncation
	const halfLength = Math.floor(length / 2);
	const start = pubkey.substring(0, halfLength);
	const end = pubkey.substring(pubkey.length - halfLength);
	const ellipsis = showEllipsis ? '...' : '';
	
	return `${prefix}${start}${ellipsis}${end}${suffix}`;
}

/**
 * Format pubkey for display with npub prefix
 */
export function formatNpub(pubkey: string, length: number = 16): string {
	return formatPubkey(pubkey, { 
		length,
		prefix: 'npub1',
		showEllipsis: true 
	});
}

/**
 * Get display name from pubkey (first 8 characters)
 */
export function getPubkeyDisplayName(pubkey: string): string {
	if (!isValidPubkey(pubkey)) {
		return 'Unknown';
	}
	
	return pubkey.substring(0, 8);
}

/**
 * Normalize recipient (hex or npub) to hex for DM flows
 */
export function normalizeRecipientToHex(input: string): NormalizeRecipientResult {
  if (!input || typeof input !== 'string') {
    return { ok: false, errorCode: 'empty' };
  }
  const trimmed = input.trim();
  if (isValidHexKey(trimmed)) {
    return { ok: true, hex: trimmed.toLowerCase(), source: 'hex' };
  }
  if (isValidNpub(trimmed)) {
    try {
      const hex = npubToHex(trimmed);
      return { ok: true, hex: hex.toLowerCase(), source: 'npub' };
    } catch (error) {
      logger.warn('npub→hex conversion failed', { error });
      return { ok: false, errorCode: 'format' };
    }
  }
  return { ok: false, errorCode: 'format' };
}

/**
 * Quick validation helper for recipient inputs
 */
export function isValidRecipient(input: string): boolean {
  const res = normalizeRecipientToHex(input);
  return res.ok === true;
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate if a string is a valid hex pubkey
 */
export function isValidPubkey(pubkey: string): boolean {
	if (!pubkey || typeof pubkey !== 'string') {
		return false;
	}
	
	// Check length
	if (pubkey.length !== PUBKEY_LENGTH) {
		return false;
	}
	
	// Check if it's valid hex
	return HEX_REGEX.test(pubkey);
}

/**
 * Validate NIP-05 identifier format
 */
export function isValidNip05(nip05: string): boolean {
	if (!nip05 || typeof nip05 !== 'string') {
		return false;
	}
	
	return NIP05_REGEX.test(nip05);
}

/**
 * Validate Lightning Address format
 */
export function isValidLightningAddress(address: string): boolean {
	if (!address || typeof address !== 'string') {
		return false;
	}
	
	return LIGHTNING_ADDRESS_REGEX.test(address);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
	if (!url || typeof url !== 'string') {
		return false;
	}
	
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

// =============================================================================
// URL Operations
// =============================================================================

/**
 * Normalize URL with protocol and validation
 */
export function normalizeUrl(url: string): NormalizeUrlResult {
	const result: NormalizeUrlResult = {
		url: '',
		isValid: false,
		protocol: '',
		domain: ''
	};
	
	if (!url || typeof url !== 'string') {
		return result;
	}
	
	// Trim whitespace and convert to lowercase
	let normalizedUrl = url.trim();
	
	// Add protocol if missing
	if (!normalizedUrl.match(/^https?:\/\//i)) {
		normalizedUrl = 'https://' + normalizedUrl;
	}
	
	try {
		const urlObj = new URL(normalizedUrl);
		
		result.url = urlObj.toString();
		result.isValid = true;
		result.protocol = urlObj.protocol;
		result.domain = urlObj.hostname;
		
		logger.debug('URL normalized successfully', { 
			original: url, 
			normalized: result.url 
		});
		
		return result;
	} catch (error) {
		logger.warn('URL normalization failed', { url, error });
		return result;
	}
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
	const normalized = normalizeUrl(url);
	return normalized.isValid ? normalized.domain : null;
}

// =============================================================================
// Content Processing
// =============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) {
		return text;
	}
	
	return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
	if (!text) return [];
	
	const hashtagRegex = /#(\w+)/g;
	const matches = text.match(hashtagRegex);
	
	return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Extract mentions from text (npub references)
 */
export function extractMentions(text: string): string[] {
	if (!text) return [];
	
	const mentionRegex = /nostr:npub1[0-9a-z]{58}/g;
	const matches = text.match(mentionRegex);
	
	return matches ? matches.map(mention => mention.replace('nostr:', '')) : [];
}

// =============================================================================
// Time Utilities
// =============================================================================

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
	if (!timestamp || timestamp <= 0) {
		return 'Unknown';
	}
	
	const date = new Date(timestamp * 1000); // Nostr uses seconds
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	const diffDays = diffHours / 24;
	
	if (diffHours < 1) {
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		return `${diffMinutes}m ago`;
	} else if (diffHours < 24) {
		return `${Math.floor(diffHours)}h ago`;
	} else if (diffDays < 7) {
		return `${Math.floor(diffDays)}d ago`;
	} else {
		return date.toLocaleDateString();
	}
}

/**
 * Get relative time string
 */
export function getRelativeTime(timestamp: number): string {
	return formatTimestamp(timestamp);
}

// =============================================================================
// Avatar & Image Utilities
// =============================================================================

/**
 * Generate avatar fallback text from name or pubkey
 */
export function getAvatarFallback(name?: string, pubkey?: string): string {
	if (name && name.length > 0) {
		return name.charAt(0).toUpperCase();
	}
	
	if (pubkey && isValidPubkey(pubkey)) {
		return pubkey.charAt(0).toUpperCase();
	}
	
	return '?';
}

/**
 * Validate and normalize image URL
 */
export function normalizeImageUrl(url: string): string | null {
	if (!url) return null;
	
	const normalized = normalizeUrl(url);
	if (!normalized.isValid) return null;
	
	// Check if URL points to an image
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
	const hasImageExtension = imageExtensions.some(ext => 
		normalized.url.toLowerCase().includes(ext)
	);
	
	// Accept URLs with image extensions or known image hosting domains
	const imageHosts = ['imgur.com', 'github.com', 'githubusercontent.com'];
	const isImageHost = imageHosts.some(host => 
		normalized.domain.includes(host)
	);
	
	if (hasImageExtension || isImageHost) {
		return normalized.url;
	}
	
	// Return URL anyway - let the browser decide
	return normalized.url;
}