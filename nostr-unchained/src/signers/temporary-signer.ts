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
      // Use same approach as working quick-umbrel-test.js
      const secp256k1 = await import('noble-secp256k1');
      
      // Generate real key pair using secp256k1 like working script
      this._privateKey = secp256k1.default.utils.randomPrivateKey();
      this._publicKey = Buffer.from(secp256k1.default.getPublicKey(this._privateKey, true).slice(1)).toString('hex');
      
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
      // Use the working external script for crypto
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const content = event.content || '';
      const privateKeyHex = Buffer.from(this._privateKey).toString('hex');
      
      console.log(`📝 Creating event with working script approach...`);
      
      const result = await execAsync(`node create-event.js "${content}" "${privateKeyHex}" "${this._publicKey}"`);
      
      const signedEvent = JSON.parse(result.stdout.trim()) as NostrEvent;
      
      console.log(`✅ Event created successfully using working crypto!`);
      console.log(`   🆔 Event ID: ${signedEvent.id.substring(0, 16)}...`);
      console.log(`   ✍️ Signature: ${signedEvent.sig.substring(0, 16)}...`);
      
      return signedEvent;
    } catch (error) {
      console.error('❌ TemporarySigner signing error:', error);
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