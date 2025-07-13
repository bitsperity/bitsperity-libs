import type { NostrUnchainedBuilder, NostrUnchainedConfig, NostrUnchained } from '@/types';
import { NostrUnchainedImpl } from './nostr-unchained-impl';
import { mergeConfig } from '@/config/defaults';

/**
 * Builder Pattern für NostrUnchained
 * Ermöglicht fluent API configuration: NostrUnchained.builder().withRelays(...).create()
 */
export class NostrUnchainedBuilderImpl implements NostrUnchainedBuilder {
  private config: Partial<NostrUnchainedConfig> = {};

  /**
   * Setzt die Relay-URLs für Verbindungen
   */
  public withRelays(relays: readonly string[]): NostrUnchainedBuilder {
    this.config = { ...this.config, relays };
    return this;
  }

  /**
   * Setzt das Connection-Timeout in Millisekunden
   */
  public withTimeout(timeout: number): NostrUnchainedBuilder {
    this.config = { ...this.config, timeout };
    return this;
  }

  /**
   * Aktiviert oder deaktiviert Debug-Logging
   */
  public withDebug(debug: boolean): NostrUnchainedBuilder {
    this.config = { ...this.config, debug };
    return this;
  }

  /**
   * Konfiguriert Retry-Strategien
   */
  public withRetry(retry: NostrUnchainedConfig['retry']): NostrUnchainedBuilder {
    if (retry) {
      this.config = { ...this.config, retry };
    }
    return this;
  }

  /**
   * Setzt Resource-Limits
   */
  public withLimits(limits: NostrUnchainedConfig['limits']): NostrUnchainedBuilder {
    if (limits) {
      this.config = { ...this.config, limits };
    }
    return this;
  }

  /**
   * Erstellt eine NostrUnchained-Instanz mit der konfigurierten Konfiguration
   */
  public async create(): Promise<NostrUnchained> {
    const mergedConfig = mergeConfig(this.config);
    const instance = new NostrUnchainedImpl(mergedConfig);
    await instance.initialize();
    return instance;
  }
}

/**
 * Factory function für den Builder
 */
export function createBuilder(): NostrUnchainedBuilder {
  return new NostrUnchainedBuilderImpl();
} 