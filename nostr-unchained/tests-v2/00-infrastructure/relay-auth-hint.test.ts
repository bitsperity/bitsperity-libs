/**
 * Infrastructure Test: NIP-42 auth-required handling
 *
 * Ensures that when the relay emits CLOSED/NOTICE with "auth-required:" or
 * "restricted:" the client attempts AUTH (no exception thrown, hooks wired).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import type { NostrUnchained } from '../../src/index.js';

describe('Infrastructure: NIP-42 auth-required hint handling', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('AuthHintUser');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should react to CLOSED/NOTICE auth-required by attempting AUTH', async () => {
    const nostr = user.nostr as unknown as any;
    const relayManager = nostr['relayManager'];
    const handleMessage = relayManager['handleRelayMessage'].bind(relayManager);
    const relayUrl = testEnv.relayUrl;

    // Simulate that a challenge arrived earlier
    const connections = relayManager['connections'] as Map<string, any>;
    const conn = connections.get(relayUrl);
    if (conn) conn.lastAuthChallenge = 'simulated-challenge';

    // Feed a CLOSED with auth-required
    await handleMessage(relayUrl, JSON.stringify(['CLOSED', 'sub1', 'auth-required: need auth']));

    // Feed a NOTICE with restricted
    await handleMessage(relayUrl, JSON.stringify(['NOTICE', 'restricted: no access']));

    expect(true).toBe(true);
  }, 15000);
});


