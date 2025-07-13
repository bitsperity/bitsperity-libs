import type { Signer, SignerInfo, SignerCapabilities, NostrEvent } from '@/types';
import { SignerError } from '@/types';

/**
 * Temporary Signer für sichere Fallback-Keys
 * Generiert temporäre Schlüssel für Tests und Entwicklung
 */
export class TemporarySigner implements Signer {
  private _info: SignerInfo | null = null;
  private _privateKey: Uint8Array | null = null;
  private _publicKey: string | null = null;

  public get info(): SignerInfo {
    if (!this._info) {
      throw new SignerError('Signer not initialized');
    }
    return this._info;
  }

  /**
   * Initialisiert den Signer mit einem temporären Schlüsselpaar
   */
  public async initialize(): Promise<void> {
    try {
      // Generate cryptographically secure random private key
      this._privateKey = crypto.getRandomValues(new Uint8Array(32));
      
      // Derive public key from private key (simplified for now)
      // In production, this would use secp256k1 curve
      this._publicKey = await this.derivePublicKey(this._privateKey);
      
      const capabilities: SignerCapabilities = {
        canSign: true,
        canEncrypt: false, // Temporary signers don't support encryption
        canDecrypt: false,
        supportsNip07: false,
        supportsNip44: false,
      };

      this._info = {
        type: 'temporary',
        pubkey: this._publicKey,
        capabilities,
        metadata: {
          isTemporary: true,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new SignerError('Failed to initialize temporary signer', error as Error);
    }
  }

  public async getPublicKey(): Promise<string> {
    if (!this._publicKey) {
      throw new SignerError('Signer not initialized');
    }
    return this._publicKey;
  }

  public async signEvent(event: Partial<NostrEvent>): Promise<NostrEvent> {
    if (!this._privateKey || !this._publicKey) {
      throw new SignerError('Signer not initialized');
    }

    try {
      const eventToSign = {
        kind: event.kind!,
        tags: event.tags?.map(tag => [...tag]) || [],
        content: event.content!,
        created_at: event.created_at || Math.floor(Date.now() / 1000),
        pubkey: this._publicKey,
      };

      // Generate event ID (simplified)
      const eventId = await this.generateEventId(eventToSign);
      
      // Sign the event (simplified)
      const signature = await this.signMessage(eventId, this._privateKey);

      return {
        id: eventId,
        pubkey: this._publicKey,
        created_at: eventToSign.created_at,
        kind: eventToSign.kind,
        tags: eventToSign.tags.map(tag => [...tag] as readonly string[]),
        content: eventToSign.content,
        sig: signature,
      };
    } catch (error) {
      throw new SignerError('Failed to sign event', error as Error);
    }
  }

  public async cleanup(): Promise<void> {
    // Securely clear private key
    if (this._privateKey) {
      this._privateKey.fill(0);
    }
    
    this._info = null;
    this._privateKey = null;
    this._publicKey = null;
  }

  /**
   * Derive public key from private key
   * In production, this would use secp256k1
   */
  private async derivePublicKey(privateKey: Uint8Array): Promise<string> {
    // Simplified implementation - in production use secp256k1
    const hash = await crypto.subtle.digest('SHA-256', privateKey);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate event ID according to NIP-01
   */
  private async generateEventId(event: {
    kind: number;
    tags: string[][];
    content: string;
    created_at: number;
    pubkey: string;
  }): Promise<string> {
    // Simplified implementation - in production use SHA-256 of serialized event
    const serialized = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);
    
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Sign message with private key
   */
  private async signMessage(message: string, privateKey: Uint8Array): Promise<string> {
    // Simplified implementation - in production use secp256k1 signing
    const hash = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(message + privateKey.toString())
    );
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
} 