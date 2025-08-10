import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Social - Public Chat (NIP-28)', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('ChatUser');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can create a channel, set metadata and post messages; reactive reads work', async () => {
    const nostr: any = user.nostr;

    // Create channel
    const ch = await nostr.channels.create()
      .name('Demo Channel')
      .about('A test channel')
      .picture('https://placekitten.com/200/200')
      .publish();
    expect(ch.success).toBe(true);
    const channelId = ch.eventId!;

    // Set metadata (kind 41)
    const metaRes = await nostr.channels.metadata(channelId)
      .name('Updated Demo Channel')
      .about('Updated')
      .category('test')
      .publish();
    expect(metaRes.success).toBe(true);

    // Post a root message (kind 42)
    const msg1 = await nostr.channels.message(channelId)
      .content('Hello everyone!')
      .publish();
    expect(msg1.success).toBe(true);

    // Reply message
    const msg2 = await nostr.channels.message(channelId)
      .content('Replying...')
      .replyTo(msg1.eventId)
      .publish();
    expect(msg2.success).toBe(true);

    // Reactive read
    const list = nostr.channels.list();
    const messages = nostr.channels.messagesFor(channelId);
    await testEnv.waitForSubscription(800);

    expect((list as any).current.length).toBeGreaterThanOrEqual(1);
    const msgs = (messages as any).current;
    expect(msgs.some((e: any) => e.id === msg1.eventId)).toBe(true);
    expect(msgs.some((e: any) => e.id === msg2.eventId)).toBe(true);
  }, 25000);
});


