/**
 * Debug Live Relay Test
 * 
 * Simplified test to debug what's failing with live relay integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 30000;

describe('Debug Live Relay', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;

  beforeEach(async () => {
    console.log(`🔗 Testing against: ${LIVE_RELAY_URL}`);
    
    alice = new NostrUnchained({ 
      relays: [LIVE_RELAY_URL],
      debug: true
    });
    
    bob = new NostrUnchained({ 
      relays: [LIVE_RELAY_URL],
      debug: true 
    });

    // Set up real signing
    (alice as any).signingProvider = new TemporarySigner();
    (bob as any).signingProvider = new TemporarySigner();

    console.log('🔌 Connecting to relay...');
    await Promise.all([alice.connect(), bob.connect()]);
    
    // Wait for connections
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Connected');
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await Promise.all([alice?.disconnect(), bob?.disconnect()]);
    console.log('🔌 Disconnected');
  }, TEST_TIMEOUT);

  it('should connect to relay successfully', async () => {
    expect(alice).toBeDefined();
    expect(bob).toBeDefined();
    console.log('✅ Basic connection test passed');
  }, TEST_TIMEOUT);

  it('should initialize DM modules', async () => {
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    await bob.dm.updateSigningProvider((bob as any).signingProvider);

    const alicePubkey = await (alice as any).signingProvider.getPublicKey();
    const bobPubkey = await (bob as any).signingProvider.getPublicKey();

    console.log(`🔑 Alice: ${alicePubkey}`);
    console.log(`🔑 Bob: ${bobPubkey}`);

    expect(alicePubkey).toMatch(/^[0-9a-f]{64}$/);
    expect(bobPubkey).toMatch(/^[0-9a-f]{64}$/);
    console.log('✅ DM module initialization test passed');
  }, TEST_TIMEOUT);

  it('should create DM conversation', async () => {
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    await bob.dm.updateSigningProvider((bob as any).signingProvider);

    const bobPubkey = await (bob as any).signingProvider.getPublicKey();
    const conversation = await alice.dm.with(bobPubkey);

    expect(conversation).toBeDefined();
    expect(typeof conversation.send).toBe('function');
    console.log('✅ DM conversation creation test passed');
  }, TEST_TIMEOUT);

  it('should attempt to send DM and check result', async () => {
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    await bob.dm.updateSigningProvider((bob as any).signingProvider);

    const bobPubkey = await (bob as any).signingProvider.getPublicKey();
    const conversation = await alice.dm.with(bobPubkey);

    console.log(`📱 Attempting to send DM to ${bobPubkey.slice(0, 8)}...`);
    
    const result = await conversation.send('Debug test message');
    
    console.log(`📊 Send result:`, {
      success: result.success,
      error: result.error,
      messageId: result.messageId
    });

    // Don't fail the test, just log the result
    console.log(`✅ Send attempt completed (success: ${result.success})`);
  }, TEST_TIMEOUT);

  it('should check conversation status', async () => {
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    
    const bobPubkey = await (bob as any).signingProvider.getPublicKey();
    const conversation = await alice.dm.with(bobPubkey);

    const status = await new Promise(resolve => {
      conversation.status.subscribe(status => resolve(status));
    });

    console.log(`📊 Conversation status: ${status}`);
    console.log('✅ Status check completed');
  }, TEST_TIMEOUT);
});