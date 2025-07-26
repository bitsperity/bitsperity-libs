/**
 * Timestamp Randomizer for NIP-59 Gift Wrap Protocol
 * 
 * Randomizes timestamps for gift wraps to prevent timing analysis.
 * Timestamps are randomized within a 2-day window in the past.
 */

import { randomBytes } from '@noble/hashes/utils';
import { NIP59Error, NIP59ErrorCode, NIP59_CONFIG } from '../types/nip59-types.js';

export class TimestampRandomizer {
  
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(
    maxAgeSeconds: number = NIP59_CONFIG.MAX_TIMESTAMP_AGE_SECONDS
  ): number {
    try {
      if (maxAgeSeconds < 0) {
        throw new NIP59Error(
          'Max age seconds cannot be negative',
          NIP59ErrorCode.TIMESTAMP_RANDOMIZATION_FAILED
        );
      }
      
      const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
      
      if (maxAgeSeconds === 0) {
        return now; // No randomization requested
      }
      
      // Generate cryptographically secure random offset
      const randomOffset = this.generateSecureRandomOffset(maxAgeSeconds);
      
      // Subtract random offset from current time to get past timestamp
      const randomizedTimestamp = now - randomOffset;
      
      return randomizedTimestamp;
      
    } catch (error) {
      if (error instanceof NIP59Error) throw error;
      throw new NIP59Error(
        `Timestamp randomization failed: ${error.message}`,
        NIP59ErrorCode.TIMESTAMP_RANDOMIZATION_FAILED,
        error
      );
    }
  }

  /**
   * Generate a cryptographically secure random offset within the specified range
   */
  private static generateSecureRandomOffset(maxOffset: number): number {
    // Use 4 bytes for random number (can represent values up to ~4.2 billion)
    const randomBytes4 = randomBytes(4);
    
    // Convert to 32-bit unsigned integer
    const randomUint32 = new DataView(randomBytes4.buffer).getUint32(0, false);
    
    // Scale to range [0, maxOffset]
    const scaledRandom = Math.floor((randomUint32 / 0xFFFFFFFF) * maxOffset);
    
    return scaledRandom;
  }

  /**
   * Generate multiple randomized timestamps for batch gift wrap creation
   * Each timestamp is independently randomized
   */
  static generateMultipleRandomizedTimestamps(
    count: number,
    maxAgeSeconds: number = NIP59_CONFIG.MAX_TIMESTAMP_AGE_SECONDS
  ): number[] {
    if (count <= 0) {
      throw new NIP59Error(
        'Timestamp count must be greater than 0',
        NIP59ErrorCode.TIMESTAMP_RANDOMIZATION_FAILED
      );
    }
    
    const timestamps: number[] = [];
    
    for (let i = 0; i < count; i++) {
      timestamps.push(this.generateRandomizedTimestamp(maxAgeSeconds));
    }
    
    return timestamps;
  }

  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(
    timestamp: number,
    maxAgeSeconds: number = NIP59_CONFIG.MAX_TIMESTAMP_AGE_SECONDS
  ): boolean {
    try {
      const now = Math.floor(Date.now() / 1000);
      const minValidTimestamp = now - maxAgeSeconds;
      
      // Timestamp should be between (now - maxAge) and now
      // Allow small future tolerance (up to 60 seconds) for clock skew
      const maxValidTimestamp = now + 60;
      
      return timestamp >= minValidTimestamp && timestamp <= maxValidTimestamp;
      
    } catch {
      return false;
    }
  }

  /**
   * Get the recommended timestamp randomization window for NIP-59
   */
  static getRecommendedMaxAge(): number {
    return NIP59_CONFIG.MAX_TIMESTAMP_AGE_SECONDS;
  }

  /**
   * Calculate entropy bits for timestamp randomization
   * Higher entropy means better privacy protection
   */
  static calculateTimestampEntropy(maxAgeSeconds: number): number {
    if (maxAgeSeconds <= 0) return 0;
    
    // Entropy = log2(possible_values)
    // Since we randomize by seconds, possible values = maxAgeSeconds
    return Math.log2(maxAgeSeconds);
  }

  /**
   * Generate a timestamp that appears to be from a specific time window
   * Useful for testing or specific privacy requirements
   */
  static generateTimestampInWindow(
    windowStart: number,
    windowEnd: number
  ): number {
    if (windowStart >= windowEnd) {
      throw new NIP59Error(
        'Window start must be before window end',
        NIP59ErrorCode.TIMESTAMP_RANDOMIZATION_FAILED
      );
    }
    
    const windowSize = windowEnd - windowStart;
    const randomOffset = this.generateSecureRandomOffset(windowSize);
    
    return windowStart + randomOffset;
  }
}