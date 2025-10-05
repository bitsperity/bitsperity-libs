/**
 * TestEnvironment - Shared test environment setup for nostr-unchained
 * 
 * Provides consistent test environment across all test suites:
 * - Container relay management
 * - Test key generation
 * - Performance measurement
 * - Resource cleanup
 */

import { NostrUnchained } from '../../src/index.js';
import { LocalKeySigner } from '../../src/crypto/SigningProvider.js';
import { EventBuilder } from '../../src/core/EventBuilder.js';

export interface TestUser {
  privateKey?: string; // removed in P1
  publicKey: string;
  nostr: NostrUnchained;
  name: string;
}

export interface TestEnvironmentConfig {
  relayUrl?: string;
  relayUrls?: string[]; // Multi-relay support
  debug?: boolean;
  timeout?: number;
  userCount?: number;
}

export class TestEnvironment {
  public readonly relayUrl: string;
  public readonly relayUrls: string[];
  public readonly debug: boolean;
  private users: TestUser[] = [];
  private startTime: number = 0;
  
  constructor(config: TestEnvironmentConfig = {}) {
    // Support both single and multi-relay configurations
    if (config.relayUrls && config.relayUrls.length > 0) {
      this.relayUrls = config.relayUrls;
      this.relayUrl = config.relayUrls[0]; // Primary relay
    } else {
      this.relayUrl = config.relayUrl || 'ws://localhost:7777';
      this.relayUrls = [this.relayUrl];
    }
    
    this.debug = config.debug || false;
    
    if (this.debug) {
      console.log('🧪 Test Environment initialized:', {
        relays: this.relayUrls,
        userCount: config.userCount || 'dynamic'
      });
    }
  }
  
  /**
   * Create a test user with deterministic keys
   */
  async createTestUser(name: string, customRelays?: string[]): Promise<TestUser> {
    // Create a new signing provider (generates secure keys automatically)
    const signer = new LocalKeySigner();
    const publicKey = await signer.getPublicKey();
    
    // Use custom relays if provided, otherwise use environment relays
    const relays = customRelays || this.relayUrls;
    
    const nostr = new NostrUnchained({
      relays: relays,
      debug: this.debug,
      timeout: 15000,
      signingProvider: signer // Provide signer directly
    });
    
    // Connect to relay
    await nostr.connect();
    
    const user: TestUser = {
      privateKey: undefined,
      publicKey,
      nostr,
      name
    };
    
    this.users.push(user);
    
    if (this.debug) {
      console.log(`👤 Created test user: ${name} (${publicKey.slice(0, 8)}...) on ${relays.length} relay(s)`);
    }
    
    return user;
  }
  
  /**
   * Create multiple test users for interaction scenarios
   */
  async createTestUsers(names: string[]): Promise<TestUser[]> {
    const users: TestUser[] = [];
    
    for (const name of names) {
      const user = await this.createTestUser(name);
      users.push(user);
    }
    
    return users;
  }
  
  /**
   * Start performance measurement
   */
  startPerformanceMeasurement(): void {
    this.startTime = performance.now();
  }
  
  /**
   * End performance measurement and return duration
   */
  endPerformanceMeasurement(operation: string): number {
    const duration = performance.now() - this.startTime;
    
    if (this.debug) {
      console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  /**
   * Assert performance requirement
   */
  assertPerformance(duration: number, maxMs: number, operation: string): void {
    if (duration > maxMs) {
      throw new Error(`Performance requirement failed: ${operation} took ${duration.toFixed(2)}ms (max: ${maxMs}ms)`);
    }
    
    if (this.debug) {
      console.log(`✅ Performance OK: ${operation} ${duration.toFixed(2)}ms < ${maxMs}ms`);
    }
  }
  
  /**
   * Wait for relay propagation (minimal delay for container relay)
   */
  async waitForPropagation(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Wait for subscription to receive events
   */
  async waitForSubscription(timeoutMs: number = 5000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 2000)));
  }
  
  /**
   * Clean up all test resources
   */
  async cleanup(): Promise<void> {
    if (this.debug) {
      console.log('🧹 Cleaning up test environment...');
    }
    
    // Disconnect all test users
    for (const user of this.users) {
      try {
        await user.nostr.disconnect();
      } catch (error) {
        // Ignore cleanup errors
        if (this.debug) {
          console.warn(`Warning: Error disconnecting user ${user.name}:`, error);
        }
      }
    }
    
    this.users = [];
    
    if (this.debug) {
      console.log('✅ Test environment cleanup completed');
    }
  }
  
  /**
   * Validate relay connectivity
   */
  async validateRelayHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.relayUrl.replace('ws://', 'http://'));
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Get test event content with unique identifier
   */
  getTestContent(prefix: string = 'Test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix} content ${timestamp}_${random}`;
  }
  
  /**
   * Create standardized test event
   */
  async createTestEvent(user: TestUser, content?: string): Promise<any> {
    const testContent = content || this.getTestContent();
    
    // Create a proper text note event (kind 1)
    const event = EventBuilder.createTextNote(testContent, user.publicKey);
    
    return user.nostr.publish(event);
  }
  
  /**
   * Assert successful publish result
   */
  assertPublishSuccess(result: any, operation: string = 'publish'): void {
    if (!result.success) {
      throw new Error(`${operation} failed: ${result.error?.message || 'Unknown error'}`);
    }
    
    if (!result.eventId || !/^[a-f0-9]{64}$/.test(result.eventId)) {
      throw new Error(`${operation} returned invalid event ID: ${result.eventId}`);
    }
    
    if (!result.event) {
      throw new Error(`${operation} did not return event object`);
    }
    
    if (this.debug) {
      console.log(`✅ ${operation} success: ${result.eventId.slice(0, 8)}...`);
    }
  }
  
  /**
   * Create test scenario description
   */
  scenario(description: string): string {
    const prefix = this.debug ? '🎯' : '';
    return `${prefix} ${description}`;
  }
}

/**
 * Global test environment instance
 */
export const testEnv = new TestEnvironment();

/**
 * Test helper functions
 */
export const TestHelpers = {
  /**
   * Create minimal test setup
   */
  async quickSetup(): Promise<TestUser> {
    return await testEnv.createTestUser('QuickTest');
  },
  
  /**
   * Create multi-user test setup
   */
  async multiUserSetup(userNames: string[]): Promise<TestUser[]> {
    return await testEnv.createTestUsers(userNames);
  },
  
  /**
   * Validate event structure
   */
  validateNostrEvent(event: any): void {
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be an object');
    }
    
    if (!event.id || !/^[a-f0-9]{64}$/.test(event.id)) {
      throw new Error(`Invalid event ID: ${event.id}`);
    }
    
    if (!event.pubkey || !/^[a-f0-9]{64}$/.test(event.pubkey)) {
      throw new Error(`Invalid pubkey: ${event.pubkey}`);
    }
    
    if (typeof event.kind !== 'number') {
      throw new Error(`Invalid kind: ${event.kind}`);
    }
    
    if (typeof event.content !== 'string') {
      throw new Error(`Invalid content: must be string`);
    }
    
    if (!Array.isArray(event.tags)) {
      throw new Error(`Invalid tags: must be array`);
    }
    
    if (typeof event.created_at !== 'number') {
      throw new Error(`Invalid created_at: ${event.created_at}`);
    }
    
    if (typeof event.sig !== 'string') {
      throw new Error(`Invalid sig: ${event.sig}`);
    }
  },
  
  /**
   * Generate unique test content
   */
  uniqueContent(prefix: string = 'Test'): string {
    return testEnv.getTestContent(prefix);
  }
};