/**
 * Simple DM Test - Just send one message and verify it works
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrUnchained } from '../../src/core/NostrUnchained.js';
import { TemporarySigner } from '../../src/crypto/SigningProvider.js';

const LIVE_RELAY_URL = 'ws://umbrel.local:4848';
const TEST_TIMEOUT = 60000;

describe('Simple DM Test', () => {
  let alice: NostrUnchained;
  let bob: NostrUnchained;

  beforeEach(async () => {
    alice = new NostrUnchained({ relays: [LIVE_RELAY_URL], debug: true });
    bob = new NostrUnchained({ relays: [LIVE_RELAY_URL], debug: true });

    (alice as any).signingProvider = new TemporarySigner();
    (bob as any).signingProvider = new TemporarySigner();

    await Promise.all([alice.connect(), bob.connect()]);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await Promise.all([alice?.disconnect(), bob?.disconnect()]);
  }, TEST_TIMEOUT);

  it('should send one DM successfully', async () => {
    await alice.dm.updateSigningProvider((alice as any).signingProvider);
    await bob.dm.updateSigningProvider((bob as any).signingProvider);

    const bobPubkey = await (bob as any).signingProvider.getPublicKey();
    console.log(`Bob pubkey: ${bobPubkey}`);
    
    const aliceConversation = await alice.dm.with(bobPubkey);
    console.log(`Created conversation`);

    const message = `Hello Bob! Test at ${Date.now()}`;
    console.log(`Sending message: ${message}`);
    
    const result = await aliceConversation.send(message);
    console.log(`Send result:`, result);

    expect(result.success).toBe(true);
    console.log(`✅ Message sent successfully!`);
  }, TEST_TIMEOUT);
});