import type { 
  NostrUnchained, 
  NostrUnchainedConfig, 
  NostrUnchainedConfigDefaults, 
  Signer, 
  EventBus 
} from '@/types';
import { ConfigurationError } from '@/types';
import { SimpleEventBus } from './event-bus';
import { SimpleResourceManager } from './resource-manager';
import { Nip07Signer } from '@/signers/nip07-signer';
import { TemporarySigner } from '@/signers/temporary-signer';
import { mergeConfig } from '@/config/defaults';

/**
 * Hauptimplementierung der NostrUnchained-Klasse
 * Verwaltet Signer, EventBus und Ressourcen-Cleanup
 */
export class NostrUnchainedImpl implements NostrUnchained {
  private readonly _config: NostrUnchainedConfigDefaults;
  private readonly _eventBus: EventBus;
  private readonly _resourceManager: SimpleResourceManager;
  private _signer: Signer | null = null;
  private _isInitialized = false;

  public constructor(config: NostrUnchainedConfig = {}) {
    this._config = mergeConfig(config);
    this._eventBus = new SimpleEventBus();
    this._resourceManager = new SimpleResourceManager();
    
    // Register event bus and resource manager for cleanup
    this._resourceManager.addResource(this._eventBus);
    this._resourceManager.addResource(this._resourceManager);
  }

  public get config(): NostrUnchainedConfigDefaults {
    return this._config;
  }

  public get signer(): Signer | null {
    return this._signer;
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  public get eventBus(): EventBus {
    return this._eventBus;
  }

  /**
   * Initialisiert die NostrUnchained-Instanz
   * Versucht NIP-07 Extension zu verwenden, fallback auf temporäre Keys
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    try {
      this._eventBus.emit('initialization:started', {});
      
      // Versuche NIP-07 Extension zu verwenden
      if (Nip07Signer.isAvailable()) {
        this._signer = new Nip07Signer();
        await this._signer.initialize();
        
        this._eventBus.emit('signer:initialized', {
          type: 'nip07',
          capabilities: this._signer.info.capabilities,
        });
        
        if (this._config.debug) {
          console.log('NostrUnchained: NIP-07 signer initialized');
        }
      } else {
        // Fallback auf temporäre Keys
        this._signer = new TemporarySigner();
        await this._signer.initialize();
        
        this._eventBus.emit('signer:initialized', {
          type: 'temporary',
          capabilities: this._signer.info.capabilities,
        });
        
        if (this._config.debug) {
          console.log('NostrUnchained: Temporary signer initialized (NIP-07 not available)');
        }
      }

      // Register signer for cleanup
      if (this._signer && this._signer.cleanup) {
        this._resourceManager.addResource({
          dispose: () => this._signer!.cleanup!(),
        });
      }

      this._isInitialized = true;
      this._eventBus.emit('initialization:completed', {
        signerType: this._signer.info.type,
        config: this._config,
      });

      if (this._config.debug) {
        console.log('NostrUnchained: Initialization completed', {
          signerType: this._signer.info.type,
          pubkey: this._signer.info.pubkey,
        });
      }
    } catch (error) {
      this._eventBus.emit('initialization:failed', { error });
      throw new ConfigurationError('Failed to initialize NostrUnchained', error as Error);
    }
  }

  /**
   * Bereinigt alle Ressourcen
   */
  public async dispose(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      this._eventBus.emit('disposal:started', {});
      
      // Cleanup signer first
      if (this._signer && this._signer.cleanup) {
        await this._signer.cleanup();
      }
      
      // Cleanup all managed resources
      await this._resourceManager.dispose();
      
      this._signer = null;
      this._isInitialized = false;
      
      if (this._config.debug) {
        console.log('NostrUnchained: Disposal completed');
      }
    } catch (error) {
      console.error('NostrUnchained: Error during disposal:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine neue Instanz (für Tests)
   */
  public static async create(config: NostrUnchainedConfig = {}): Promise<NostrUnchained> {
    const instance = new NostrUnchainedImpl(config);
    await instance.initialize();
    return instance;
  }
} 