import type { Signer, SignerInfo, SignerCapabilities, NostrEvent } from '@/types';
import { SignerError } from '@/types';
import { secp256k1 } from '@/crypto/secp256k1-setup'; // Globally configured secp256k1

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
      // Use modern @noble/secp256k1 API (HMAC already configured)
      this._privateKey = secp256k1.utils.randomPrivateKey();
      const publicKeyBytes = secp256k1.getPublicKey(this._privateKey, true); // compressed
      this._publicKey = secp256k1.etc.bytesToHex(publicKeyBytes.slice(1)); // remove 0x02/0x03 prefix
      
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
      console.log(`📝 Creating event with direct TypeScript implementation...`);
      
      // Create proper NostrEvent
      const nostrEvent: NostrEvent = {
        id: '',
        pubkey: this._publicKey,
        created_at: event.created_at || Math.floor(Date.now() / 1000),
        kind: event.kind || 1,
        tags: event.tags || [],
        content: event.content || '',
        sig: ''
      };

      // Generate event ID using proper serialization
      const eventData = [
        0,
        nostrEvent.pubkey,
        nostrEvent.created_at,
        nostrEvent.kind,
        nostrEvent.tags,
        nostrEvent.content
      ];
      
      const eventString = JSON.stringify(eventData);
      const eventHash = await this.sha256(new TextEncoder().encode(eventString));
      nostrEvent.id = Array.from(eventHash)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Use modern @noble/secp256k1 API for signing
      const eventHashHex = secp256k1.etc.bytesToHex(eventHash);
      
      // Modern ECDSA signing using @noble/secp256k1
      const signature = secp256k1.sign(eventHashHex, this._privateKey);
      nostrEvent.sig = signature.toCompactHex();
      
      const signedEvent = nostrEvent;
      
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
  private async sha256(data: Uint8Array): Promise<Uint8Array> {
    const { sha256 } = await import('@noble/hashes/sha256');
    return sha256(data);
  }

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