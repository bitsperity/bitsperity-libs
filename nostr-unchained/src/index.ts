// Main exports
export { NostrUnchainedImpl as NostrUnchained } from './core/nostr-unchained-impl';
export { createBuilder } from './core/nostr-unchained-builder';

// Types exports
export type {
  NostrUnchained as INostrUnchained,
  NostrUnchainedConfig,
  NostrUnchainedConfigDefaults,
  NostrUnchainedBuilder,
  NostrUnchainedConstructor,
  Signer,
  SignerInfo,
  SignerCapabilities,
  NostrEvent,
  NostrEventPartial,
  EventBus,
  Disposable,
  ResourceManager,
} from './types';

// Error exports
export {
  NostrUnchainedError,
  ConfigurationError,
  SignerError,
  NetworkError,
  CryptoError,
} from './types';

// Config exports
export { DEFAULT_CONFIG, validateConfig, mergeConfig } from './config/defaults';

// Signer exports
export { Nip07Signer } from './signers/nip07-signer';
export { TemporarySigner } from './signers/temporary-signer';

// Factory function for builder pattern
export { createBuilder as createNostrUnchainedBuilder } from './core/nostr-unchained-builder';

// Default export für convenience
export { NostrUnchainedImpl as default } from './core/nostr-unchained-impl'; 