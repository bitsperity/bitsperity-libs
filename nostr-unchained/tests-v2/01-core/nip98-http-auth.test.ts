import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';
import { signHttpAuth } from '../../src/index.js';

describe('NIP-98: HTTP Auth', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('HttpAuthUser');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('builds a signed HTTP auth header for a request', async () => {
    const nostr: any = user.nostr;
    const { event, header } = await signHttpAuth(nostr, {
      method: 'POST',
      url: 'https://api.example.com/upload',
      payload: JSON.stringify({ hello: 'world' })
    });
    expect(event.kind).toBe(27235);
    expect(header.startsWith('Nostr ')).toBe(true);
  }, 20000);
});


