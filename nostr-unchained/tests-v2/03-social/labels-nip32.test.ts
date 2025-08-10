import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testEnv } from '../shared/TestEnvironment.js';

describe('Social - Labels (NIP-32)', () => {
  let user: Awaited<ReturnType<typeof testEnv.createTestUser>>;

  beforeAll(async () => {
    user = await testEnv.createTestUser('LabelsUser');
  }, 30000);

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('can label an event with namespace and read labels reactively', async () => {
    const nostr: any = user.nostr;

    // Publish a base event to label
    const base = await nostr.events.create().kind(1).content('Label me').sign();
    const baseRes = await nostr.publishSigned(await base.build());
    expect(baseRes.success).toBe(true);
    const eventId = baseRes.eventId!;

    // Create labels for the event
    const labRes = await nostr.labels
      .edit()
      .namespace('ISO-639-1')
      .label('en', 'ISO-639-1')
      .targetEvent(eventId)
      .reason('language: English')
      .publish();
    expect(labRes.success).toBe(true);

    // Reactive read
    const store = nostr.labels.forEvent(eventId);
    await testEnv.waitForSubscription(800);
    const labels = store.current || [];
    const found = labels.find((e: any) => e.kind === 1985 && e.tags.some((t: any) => t[0] === 'l' && t[1] === 'en'));
    expect(!!found).toBe(true);
  }, 20000);
});


