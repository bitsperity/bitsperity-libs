import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

const waitForMessage = (
  conversation: any,
  predicate: (message: any) => boolean,
  timeoutMs = 5000
): Promise<any[]> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try { unsubscribe(); } catch {}
      reject(new Error('Timeout waiting for DM message'));
    }, timeoutMs);

    const unsubscribe = conversation.subscribe((messages: any[]) => {
      if (messages.some(predicate)) {
        clearTimeout(timeout);
        try { unsubscribe(); } catch {}
        resolve(messages);
      }
    });
  });

describe('High-Level: Universal DM Module', () => {
  let alice: Awaited<ReturnType<typeof testEnv.createTestUser>>;
  let bob: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    [alice, bob] = await Promise.all([
      testEnv.createTestUser('UniversalDMAlice'),
      testEnv.createTestUser('UniversalDMBob')
    ]);
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('delivers DMs without recipient relay lists using fallback routing', async () => {
    const aliceConvo = alice.nostr.getDM()?.with(bob.publicKey);
    const bobConvo = bob.nostr.getDM()?.with(alice.publicKey);
    expect(aliceConvo).toBeDefined();
    expect(bobConvo).toBeDefined();

    const payload = `Fallback DM ${Date.now()}`;
    const sendResult = await aliceConvo!.send(payload);
    expect(sendResult.success).toBe(true);

    await waitForMessage(bobConvo!, (msg) => msg.content === payload && !msg.isFromMe);

    const bobMessages = bobConvo!.messages;
    expect(
      bobMessages.some(
        (msg) => msg.content === payload && msg.senderPubkey === alice.publicKey.toLowerCase() && msg.status === 'received'
      )
    ).toBe(true);

    const aliceMessages = aliceConvo!.messages;
    expect(
      aliceMessages.some(
        (msg) => msg.content === payload && msg.isFromMe && msg.status === 'sent'
      )
    ).toBe(true);
  }, 30000);

  it('rejects sending to malformed pubkeys before publishing gift wraps', async () => {
    const convo = alice.nostr.getDM()?.with('not-a-hex-pubkey');
    expect(convo).toBeDefined();
    const result = await convo!.send('This should fail');
    expect(result.success).toBe(false);
    expect(result.error?.toLowerCase()).toContain('invalid recipient pubkey');
  });
});

