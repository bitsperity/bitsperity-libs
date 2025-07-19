import type { NIP44Padding } from '../types';
import { CryptoError } from '../types';

/**
 * NIP-44 PKCS#7 Padding Implementation
 * Used für message length obfuscation in NIP-44 encryption
 */
export class NIP44PaddingImpl implements NIP44Padding {

  /**
   * Pad message using PKCS#7 padding
   * Adds padding bytes to make message length a multiple of 16
   */
  pad(message: Uint8Array): Uint8Array {
    try {
      const blockSize = 16; // AES block size used in NIP-44
      const paddingLength = blockSize - (message.length % blockSize);
      
      // PKCS#7: padding bytes all have value equal to padding length
      const paddedMessage = new Uint8Array(message.length + paddingLength);
      paddedMessage.set(message);
      
      // Fill padding bytes
      for (let i = message.length; i < paddedMessage.length; i++) {
        paddedMessage[i] = paddingLength;
      }
      
      return paddedMessage;
    } catch (error) {
      throw new CryptoError(
        `Message padding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PADDING_FAILED'
      );
    }
  }

  /**
   * Remove PKCS#7 padding from message
   * Validates padding before removal
   */
  unpad(paddedMessage: Uint8Array): Uint8Array {
    try {
      if (paddedMessage.length === 0) {
        throw new CryptoError('Cannot unpad empty message', 'UNPADDING_FAILED');
      }

      const paddingLength = paddedMessage[paddedMessage.length - 1]!;
      
      // Validate padding length
      if (paddingLength === 0 || paddingLength > 16) {
        throw new CryptoError('Invalid padding length', 'INVALID_PADDING');
      }
      
      if (paddingLength > paddedMessage.length) {
        throw new CryptoError('Padding length exceeds message length', 'INVALID_PADDING');
      }

      // Validate all padding bytes
      const paddingStart = paddedMessage.length - paddingLength;
      for (let i = paddingStart; i < paddedMessage.length; i++) {
        if (paddedMessage[i] !== paddingLength) {
          throw new CryptoError('Invalid padding bytes', 'INVALID_PADDING');
        }
      }

      // Return message without padding
      return paddedMessage.slice(0, paddingStart);
    } catch (error) {
      throw new CryptoError(
        `Message unpadding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNPADDING_FAILED'
      );
    }
  }

  /**
   * Calculate padding overhead für message
   * Used für bundle size optimization analysis
   */
  calculatePaddingOverhead(messageLength: number): number {
    const blockSize = 16;
    return blockSize - (messageLength % blockSize);
  }

  /**
   * Validate PKCS#7 padding without removal
   * Used für fast padding validation
   */
  validatePadding(paddedMessage: Uint8Array): boolean {
    try {
      if (paddedMessage.length === 0) return false;

      const paddingLength = paddedMessage[paddedMessage.length - 1]!;
      
      if (paddingLength === 0 || paddingLength > 16) return false;
      if (paddingLength > paddedMessage.length) return false;

      const paddingStart = paddedMessage.length - paddingLength;
      for (let i = paddingStart; i < paddedMessage.length; i++) {
        if (paddedMessage[i] !== paddingLength) return false;
      }

      return true;
    } catch {
      return false;
    }
  }
} 