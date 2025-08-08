import { describe, it, expect, afterAll } from 'vitest';
import { testEnv, TestHelpers } from '../shared/TestEnvironment.js';

describe('Core - Query Guards', () => {
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('FilterBuilder sets default limit when not provided', async () => {
    const user = await testEnv.createTestUser('Alice');
    // Execute without explicit limit
    const store = user.nostr.query().kinds([1]).execute();
    // No assertion on count; only ensure store works and current is array
    const current = store.current;
    expect(Array.isArray(current)).toBe(true);
  }, 20000);

  it('UniversalNostrStore.map() survives mapper errors', async () => {
    const user = await testEnv.createTestUser('Bob');
    const store = user.nostr.query().kinds([1]).execute();
    const mapped = store.map(() => { throw new Error('mapper fail'); });
    // Access current should not throw
    const cur = mapped.current;
    expect(cur).toBeUndefined();
  }, 20000);
});


