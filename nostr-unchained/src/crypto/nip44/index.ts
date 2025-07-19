import type { 
  CryptoModule, 
  EncryptionResult, 
  NIP44EncryptionResult,
  NIP44ConversationKeys,
  CryptoConfig,
  PrivateKey,
  PublicKey
} from '../types';
import { CryptoError, NIP44ComplianceError, DEFAULT_CRYPTO_CONFIG } from '../types';

/**
 * NIP-44 v2 Encryption Implementation
 * Features lazy loading, custom ChaCha20-Poly1305, and Noble fallback
 * Optimized für minimal bundle size und maximum compatibility
 */
export class NIP44Crypto implements CryptoModule {
  private config: CryptoConfig;
  private cryptoImpl: any = null;
  private keyDerivation: any = null;
  private padding: any = null;

  constructor(config: Partial<CryptoConfig> = {}) {
    this.config = { ...DEFAULT_CRYPTO_CONFIG, ...config };
  }

  // ===== Lazy Loading Implementation =====

  private async loadCryptoImplementation() {
    if (this.cryptoImpl) return this.cryptoImpl;

    try {
      if (this.config.backend === 'custom' || this.config.backend === 'auto') {
        // Try custom implementation first
        const { CustomChaCha20Poly1305 } = await import('../core/chacha20-poly1305');
        this.cryptoImpl = new CustomChaCha20Poly1305();
        return this.cryptoImpl;
      }
    } catch (error) {
      if (this.config.backend === 'custom') {
        throw new CryptoError('Custom crypto implementation failed to load', 'CRYPTO_LOAD_FAILED');
      }
      // Fall through to Noble fallback
    }

    try {
      // Noble fallback for maximum compatibility
      const noble = await this.loadNobleImplementation();
      this.cryptoImpl = noble;
      return this.cryptoImpl;
    } catch (error) {
      throw new CryptoError('All crypto implementations failed to load', 'CRYPTO_LOAD_FAILED');
    }
  }

  private async loadKeyDerivation() {
    if (this.keyDerivation) return this.keyDerivation;

    const { NIP44KeyDerivation } = await import('./key-derivation');
    this.keyDerivation = new NIP44KeyDerivation();
    return this.keyDerivation;
  }

  private async loadPadding() {
    if (this.padding) return this.padding;

    const { NIP44PaddingImpl } = await import('./padding');
    this.padding = new NIP44PaddingImpl();
    return this.padding;
  }

  private async loadNobleImplementation() {
    // Lazy load Noble implementation als fallback
    const { chacha20poly1305 } = await import('@noble/ciphers/chacha');
    
    return {
      async encrypt(plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<EncryptionResult> {
        const ciphertext = chacha20poly1305(key, nonce).encrypt(plaintext);
        return {
          ciphertext: ciphertext.slice(0, -16),
          nonce,
          tag: ciphertext.slice(-16),
        };
      },

      async decrypt(ciphertext: Uint8Array, tag: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
        const combined = new Uint8Array(ciphertext.length + tag.length);
        combined.set(ciphertext);
        combined.set(tag, ciphertext.length);
        
        return chacha20poly1305(key, nonce).decrypt(combined);
      }
    };
  }

  // ===== Public NIP-44 API =====

  /**
   * Encrypt message using NIP-44 v2 specification
   * Returns base64-encoded ciphertext in NIP-44 format
   */
  async encryptNIP44(
    message: string, 
    privateKey: PrivateKey, 
    publicKey: PublicKey
  ): Promise<NIP44EncryptionResult> {
    try {
      const [crypto, keyDerivation, padding] = await Promise.all([
        this.loadCryptoImplementation(),
        this.loadKeyDerivation(),
        this.loadPadding(),
      ]);

      // Derive conversation keys
      const conversationKeys = await keyDerivation.deriveConversationKeys(privateKey, publicKey);
      
      // Prepare message
      const messageBytes = new TextEncoder().encode(message);
      const paddedMessage = padding.pad(messageBytes);
      
      // Encrypt with ChaCha20-Poly1305
      const result = await crypto.encrypt(
        paddedMessage,
        conversationKeys.chacha_key,
        conversationKeys.chacha_nonce
      );

      // Format according to NIP-44 v2 specification
      const ciphertext = this.formatNIP44Ciphertext(result);
      
      return {
        ciphertext: this.bytesToBase64(ciphertext),
        format: 'nip44-v2',
      };
    } catch (error) {
      throw new NIP44ComplianceError(
        `NIP-44 encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt NIP-44 v2 encrypted message
   * Accepts base64-encoded ciphertext from NIP-44 format
   */
  async decryptNIP44(
    encryptedData: NIP44EncryptionResult,
    privateKey: PrivateKey,
    publicKey: PublicKey
  ): Promise<string> {
    try {
      if (encryptedData.format !== 'nip44-v2') {
        throw new NIP44ComplianceError(`Unsupported format: ${encryptedData.format}`);
      }

      const [crypto, keyDerivation, padding] = await Promise.all([
        this.loadCryptoImplementation(),
        this.loadKeyDerivation(),
        this.loadPadding(),
      ]);

      // Derive conversation keys
      const conversationKeys = await keyDerivation.deriveConversationKeys(privateKey, publicKey);
      
      // Parse NIP-44 ciphertext format
      const ciphertext = this.base64ToBytes(encryptedData.ciphertext);
      const { payload, nonce, tag } = this.parseNIP44Ciphertext(ciphertext);

      // Decrypt with ChaCha20-Poly1305
      const paddedMessage = await crypto.decrypt(
        payload,
        tag,
        conversationKeys.chacha_key,
        nonce
      );

      // Remove padding
      const messageBytes = padding.unpad(paddedMessage);
      
      return new TextDecoder().decode(messageBytes);
    } catch (error) {
      throw new NIP44ComplianceError(
        `NIP-44 decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ===== Core CryptoModule Interface =====

  async encrypt(
    plaintext: Uint8Array, 
    key: Uint8Array, 
    nonce?: Uint8Array
  ): Promise<EncryptionResult> {
    const crypto = await this.loadCryptoImplementation();
    const actualNonce = nonce || this.generateNonce();
    return crypto.encrypt(plaintext, key, actualNonce);
  }

  async decrypt(
    ciphertext: Uint8Array, 
    key: Uint8Array, 
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    const crypto = await this.loadCryptoImplementation();
    // Extract tag from ciphertext (last 16 bytes)
    const tag = ciphertext.slice(-16);
    const payload = ciphertext.slice(0, -16);
    return crypto.decrypt(payload, tag, key, nonce);
  }

  async deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    const keyDerivation = await this.loadKeyDerivation();
    return keyDerivation.deriveSharedSecret(privateKey, publicKey);
  }

  async deriveConversationKey(sharedSecret: Uint8Array): Promise<Uint8Array> {
    const keyDerivation = await this.loadKeyDerivation();
    const keys = await keyDerivation.deriveNIP44Keys(sharedSecret);
    
    // Return concatenated keys für compatibility
    const result = new Uint8Array(76);
    result.set(keys.chacha_key, 0);
    result.set(keys.hmac_key, 32);
    result.set(keys.chacha_nonce, 64);
    return result;
  }

  generateNonce(): Uint8Array {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Browser environment
      return crypto.getRandomValues(new Uint8Array(12));
    } else if (typeof require !== 'undefined') {
      // Node.js environment
      const crypto = require('crypto');
      return crypto.randomBytes(12);
    } else {
      // Fallback to Math.random (not cryptographically secure!)
      console.warn('Using insecure random number generation. Use in production environment with proper crypto support.');
      const nonce = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        nonce[i] = Math.floor(Math.random() * 256);
      }
      return nonce;
    }
  }

  constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i]! ^ b[i]!;
    }
    
    return result === 0;
  }

  // ===== NIP-44 Format Handling =====

  private formatNIP44Ciphertext(result: EncryptionResult): Uint8Array {
    // NIP-44 v2 format: version(1) + nonce(12) + ciphertext + tag(16)
    const formatted = new Uint8Array(1 + 12 + result.ciphertext.length + 16);
    formatted[0] = 2; // NIP-44 v2
    formatted.set(result.nonce, 1);
    formatted.set(result.ciphertext, 13);
    formatted.set(result.tag, 13 + result.ciphertext.length);
    return formatted;
  }

  private parseNIP44Ciphertext(ciphertext: Uint8Array): {
    version: number;
    nonce: Uint8Array;
    payload: Uint8Array;
    tag: Uint8Array;
  } {
    if (ciphertext.length < 29) { // 1 + 12 + 16 minimum
      throw new NIP44ComplianceError('Ciphertext too short for NIP-44 format');
    }

    const version = ciphertext[0];
    if (version !== 2) {
      throw new NIP44ComplianceError(`Unsupported NIP-44 version: ${version}`);
    }

    const nonce = ciphertext.slice(1, 13);
    const tag = ciphertext.slice(-16);
    const payload = ciphertext.slice(13, -16);

    return { version, nonce, payload, tag };
  }

  // ===== Utility Methods =====

  private bytesToBase64(bytes: Uint8Array): string {
    if (typeof btoa !== 'undefined') {
      // Browser environment
      return btoa(String.fromCharCode(...bytes));
    } else {
      // Node.js environment
      return Buffer.from(bytes).toString('base64');
    }
  }

  private base64ToBytes(base64: string): Uint8Array {
    if (typeof atob !== 'undefined') {
      // Browser environment
      const binary = atob(base64);
      return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
    } else {
      // Node.js environment
      return new Uint8Array(Buffer.from(base64, 'base64'));
    }
  }

  // ===== Bundle Size Analysis =====

  async getBundleSize(): Promise<{
    customImplementation: number;
    nobleImplementation: number;
    currentImplementation: string;
  }> {
    // This would be populated by bundler analysis in production
    return {
      customImplementation: 4800, // ~4.8KB estimated
      nobleImplementation: 22000, // ~22KB estimated  
      currentImplementation: this.cryptoImpl ? 'custom' : 'noble',
    };
  }
} 