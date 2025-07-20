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
      // Import required crypto modules and setup secp256k1
      const secp256k1 = await import('noble-secp256k1');
      const { hmac } = await import('@noble/hashes/hmac');
      const { sha256 } = await import('@noble/hashes/sha256');
      
      // Setup HMAC for secp256k1 - CRITICAL for signing to work
      secp256k1.default.utils.hmacSha256Sync = (key, ...msgs) => {
        const h = hmac.create(sha256, key);
        msgs.forEach(msg => h.update(msg));
        return h.digest();
      };
      
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

      // Sign event ID using secp256k1 (HMAC already configured in initialize)
      const secp256k1 = await import('@noble/secp256k1');
      
      const privateKeyHex = Array.from(this._privateKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Convert eventHash to hex string for signing
      const eventHashHex = Array.from(eventHash)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const signature = secp256k1.sign(eventHashHex, privateKeyHex);
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