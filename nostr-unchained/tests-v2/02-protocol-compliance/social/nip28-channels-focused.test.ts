/**
 * NIP-28: Public Chat - COMPREHENSIVE FOCUSED TESTS
 *
 * Reference: https://github.com/nostr-protocol/nips/blob/master/28.md
 *
 * Covers:
 * - Kind 40: Channel Create (with JSON metadata)
 * - Kind 41: Channel Metadata Update (e-tag with root marker)
 * - Kind 42: Channel Messages (root + replies with e/p tags)
 * - Kind 43: Hide Message (client-side moderation)
 * - Kind 44: Mute User (client-side moderation)
 * - Reactive stores (list, messages, metadata)
 * - visibleMessages filtering
 * - Category tags (t-tags)
 * - Relay hints
 *
 * Architecture: Layer 2 (Social Module - Channels)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../../shared/TestEnvironment.js';

const RELAY_URLS = [
  'ws://localhost:7777',
  'ws://localhost:7778',
  'ws://localhost:7779'
];

describe('NIP-28: Public Chat Channels (Focused)', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = new TestEnvironment({
      relayUrls: RELAY_URLS,
      debug: false
    });
  }, 30000);

  afterAll(async () => {
    await env.cleanup();
  });

  describe('Kind 40: Channel Create', () => {
    it('should create channel with JSON metadata', async () => {
      const [owner] = await env.createTestUsers(['Owner-NIP28-1']);
      
      // Global sub for channels
      owner.nostr.sub().kinds([40]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await owner.nostr.social.channels
        .create()
        .name('Test Channel')
        .about('A test channel for NIP-28')
        .picture('https://example.com/channel.png')
        .relays([RELAY_URLS[0], RELAY_URLS[1]])
        .category('tech')
        .category('nostr')
        .publish();
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      await env.waitForPropagation(1500);
      
      // Query the channel
      const allChannels = owner.nostr.query()
        .kinds([40])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const channel = allChannels.current.find((e: any) => e.id === result.eventId);
      expect(channel).toBeDefined();
      expect(channel.kind).toBe(40);
      
      // Verify JSON content
      const metadata = JSON.parse(channel.content);
      expect(metadata.name).toBe('Test Channel');
      expect(metadata.about).toBe('A test channel for NIP-28');
      expect(metadata.picture).toBe('https://example.com/channel.png');
      expect(metadata.relays).toEqual([RELAY_URLS[0], RELAY_URLS[1]]);
      
      // Verify category tags
      const tTags = channel.tags.filter((t: string[]) => t[0] === 't');
      expect(tTags.length).toBe(2);
      expect(tTags.some((t: string[]) => t[1] === 'tech')).toBe(true);
      expect(tTags.some((t: string[]) => t[1] === 'nostr')).toBe(true);
    });

    it('should create minimal channel without optional fields', async () => {
      const [owner] = await env.createTestUsers(['Owner-NIP28-2']);
      
      owner.nostr.sub().kinds([40]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const result = await owner.nostr.social.channels
        .create()
        .name('Minimal Channel')
        .publish();
      
      expect(result.success).toBe(true);
      await env.waitForPropagation(1500);
      
      const allChannels = owner.nostr.query()
        .kinds([40])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const channel = allChannels.current.find((e: any) => e.id === result.eventId);
      expect(channel).toBeDefined();
      
      const metadata = JSON.parse(channel.content);
      expect(metadata.name).toBe('Minimal Channel');
      expect(metadata.about).toBeUndefined();
      expect(metadata.picture).toBeUndefined();
    });
  });

  describe('Kind 41: Channel Metadata Update', () => {
    it('should update channel metadata with e-tag root marker', async () => {
      const [owner] = await env.createTestUsers(['Owner-NIP28-3']);
      
      owner.nostr.sub().kinds([40, 41]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Original Name')
        .about('Original description')
        .publish();
      
      expect(channelResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Update metadata
      const updateResult = await owner.nostr.social.channels
        .metadata(channelResult.eventId!)
        .name('Updated Name')
        .about('Updated description')
        .picture('https://example.com/updated.png')
        .category('updated')
        .hint(RELAY_URLS[0])
        .publish();
      
      expect(updateResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Query metadata
      const allMetadata = owner.nostr.query()
        .kinds([41])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const metadata = allMetadata.current.find((e: any) => e.id === updateResult.eventId);
      expect(metadata).toBeDefined();
      expect(metadata.kind).toBe(41);
      
      // Verify content
      const content = JSON.parse(metadata.content);
      expect(content.name).toBe('Updated Name');
      expect(content.about).toBe('Updated description');
      expect(content.picture).toBe('https://example.com/updated.png');
      
      // Verify e-tag with root marker
      const eTags = metadata.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBe(1);
      expect(eTags[0][1]).toBe(channelResult.eventId);
      expect(eTags[0][2]).toBe(RELAY_URLS[0]);
      expect(eTags[0][3]).toBe('root');
      
      // Verify category tag
      const tTags = metadata.tags.filter((t: string[]) => t[0] === 't');
      expect(tTags.some((t: string[]) => t[1] === 'updated')).toBe(true);
    });

    it('should only show latest metadata per channel (replaceable behavior)', async () => {
      const [owner] = await env.createTestUsers(['Owner-NIP28-4']);
      
      owner.nostr.sub().kinds([40, 41]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Original')
        .publish();
      
      expect(channelResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Update 1
      await owner.nostr.social.channels
        .metadata(channelResult.eventId!)
        .name('Update 1')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Update 2 (latest)
      const update2 = await owner.nostr.social.channels
        .metadata(channelResult.eventId!)
        .name('Update 2')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Query metadata - should show all, but clients should use latest
      const metadataStore = owner.nostr.social.channels.metadataFor(channelResult.eventId!);
      await env.waitForSubscription(1000);
      
      const allMeta = metadataStore.current;
      // Should have multiple metadata events
      expect(allMeta.length).toBeGreaterThan(0);
      
      // Latest should be Update 2
      const latest = allMeta.reduce((prev: any, curr: any) => 
        curr.created_at > prev.created_at ? curr : prev
      );
      
      const latestContent = JSON.parse(latest.content);
      expect(latestContent.name).toBe('Update 2');
    });
  });

  describe('Kind 42: Channel Messages', () => {
    it('should send root message with e-tag root marker', async () => {
      const [owner, user] = await env.createTestUsers(['Owner-NIP28-5', 'User-NIP28-5']);
      
      owner.nostr.sub().kinds([40, 42]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Message Test Channel')
        .publish();
      
      expect(channelResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Send message
      const messageResult = await user.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Hello channel!')
        .hint(RELAY_URLS[0])
        .publish();
      
      expect(messageResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Query messages
      const allMessages = owner.nostr.query()
        .kinds([42])
        .authors([user.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const message = allMessages.current.find((e: any) => e.id === messageResult.eventId);
      expect(message).toBeDefined();
      expect(message.kind).toBe(42);
      expect(message.content).toBe('Hello channel!');
      
      // Verify e-tag with root marker
      const eTags = message.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBe(1);
      expect(eTags[0][1]).toBe(channelResult.eventId);
      expect(eTags[0][2]).toBe(RELAY_URLS[0]);
      expect(eTags[0][3]).toBe('root');
    });

    it('should send reply with root and reply e-tags + p-tag', async () => {
      const [owner, alice, bob] = await env.createTestUsers([
        'Owner-NIP28-6',
        'Alice-NIP28-6',
        'Bob-NIP28-6'
      ]);
      
      owner.nostr.sub().kinds([40, 42]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Reply Test Channel')
        .publish();
      
      expect(channelResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Alice sends root message
      const aliceMessage = await alice.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Alice message')
        .publish();
      
      expect(aliceMessage.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Bob replies to Alice
      const bobReply = await bob.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Reply to Alice')
        .replyTo(aliceMessage.eventId!, RELAY_URLS[0])
        .mention(alice.publicKey, RELAY_URLS[0])
        .publish();
      
      expect(bobReply.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Query Bob's message
      const allMessages = owner.nostr.query()
        .kinds([42])
        .authors([bob.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const reply = allMessages.current.find((e: any) => e.id === bobReply.eventId);
      expect(reply).toBeDefined();
      expect(reply.content).toBe('Reply to Alice');
      
      // Verify e-tags (root + reply)
      const eTags = reply.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBe(2);
      
      const rootTag = eTags.find((t: string[]) => t[3] === 'root');
      const replyTag = eTags.find((t: string[]) => t[3] === 'reply');
      
      expect(rootTag).toBeDefined();
      expect(rootTag![1]).toBe(channelResult.eventId);
      
      expect(replyTag).toBeDefined();
      expect(replyTag![1]).toBe(aliceMessage.eventId);
      expect(replyTag![2]).toBe(RELAY_URLS[0]);
      
      // Verify p-tag (mention)
      const pTags = reply.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBe(1);
      expect(pTags[0][1]).toBe(alice.publicKey);
      expect(pTags[0][2]).toBe(RELAY_URLS[0]);
    });

    it('should support multiple mentions', async () => {
      const [owner, alice, bob, charlie] = await env.createTestUsers([
        'Owner-NIP28-7',
        'Alice-NIP28-7',
        'Bob-NIP28-7',
        'Charlie-NIP28-7'
      ]);
      
      owner.nostr.sub().kinds([40, 42]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Mentions Test')
        .publish();
      
      expect(channelResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Alice mentions Bob and Charlie
      const messageResult = await alice.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Hey @Bob and @Charlie!')
        .mention(bob.publicKey)
        .mention(charlie.publicKey)
        .publish();
      
      expect(messageResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Query message
      const allMessages = owner.nostr.query()
        .kinds([42])
        .authors([alice.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const message = allMessages.current.find((e: any) => e.id === messageResult.eventId);
      expect(message).toBeDefined();
      
      // Verify p-tags
      const pTags = message.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBe(2);
      expect(pTags.some((t: string[]) => t[1] === bob.publicKey)).toBe(true);
      expect(pTags.some((t: string[]) => t[1] === charlie.publicKey)).toBe(true);
    });
  });

  describe('Kind 43: Hide Message (Client-Side Moderation)', () => {
    it('should hide message with optional reason', async () => {
      const [owner, alice] = await env.createTestUsers([
        'Owner-NIP28-8',
        'Alice-NIP28-8'
      ]);
      
      owner.nostr.sub().kinds([40, 42, 43]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Hide Test')
        .publish();
      
      expect(channelResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Alice sends message
      const messageResult = await alice.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Inappropriate content')
        .publish();
      
      expect(messageResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Owner hides message
      const hideResult = await owner.nostr.social.channels
        .hide(messageResult.eventId!)
        .withReason('Inappropriate')
        .publish();
      
      expect(hideResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Query hide event
      const allHides = owner.nostr.query()
        .kinds([43])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const hide = allHides.current.find((e: any) => e.id === hideResult.eventId);
      expect(hide).toBeDefined();
      expect(hide.kind).toBe(43);
      
      // Verify content (reason)
      const content = JSON.parse(hide.content);
      expect(content.reason).toBe('Inappropriate');
      
      // Verify e-tag
      const eTags = hide.tags.filter((t: string[]) => t[0] === 'e');
      expect(eTags.length).toBe(1);
      expect(eTags[0][1]).toBe(messageResult.eventId);
    });

    it('should hide message without reason', async () => {
      const [owner, alice] = await env.createTestUsers([
        'Owner-NIP28-9',
        'Alice-NIP28-9'
      ]);
      
      owner.nostr.sub().kinds([40, 42, 43]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel + message
      const channelResult = await owner.nostr.social.channels.create().name('Test').publish();
      await env.waitForPropagation(1500);
      
      const messageResult = await alice.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Message to hide')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Hide without reason
      const hideResult = await owner.nostr.social.channels
        .hide(messageResult.eventId!)
        .publish();
      
      expect(hideResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      const allHides = owner.nostr.query().kinds([43]).authors([owner.publicKey]).execute();
      await env.waitForSubscription(1000);
      
      const hide = allHides.current.find((e: any) => e.id === hideResult.eventId);
      expect(hide).toBeDefined();
      expect(hide.content).toBe('');
    });
  });

  describe('Kind 44: Mute User (Client-Side Moderation)', () => {
    it('should mute user with optional reason', async () => {
      const [owner, spammer] = await env.createTestUsers([
        'Owner-NIP28-10',
        'Spammer-NIP28-10'
      ]);
      
      owner.nostr.sub().kinds([44]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Mute spammer
      const muteResult = await owner.nostr.social.channels
        .mute(spammer.publicKey)
        .withReason('Spam')
        .publish();
      
      expect(muteResult.success).toBe(true);
      await env.waitForPropagation(1500);
      
      // Query mute
      const allMutes = owner.nostr.query()
        .kinds([44])
        .authors([owner.publicKey])
        .execute();
      
      await env.waitForSubscription(1000);
      
      const mute = allMutes.current.find((e: any) => e.id === muteResult.eventId);
      expect(mute).toBeDefined();
      expect(mute.kind).toBe(44);
      
      // Verify content (reason)
      const content = JSON.parse(mute.content);
      expect(content.reason).toBe('Spam');
      
      // Verify p-tag
      const pTags = mute.tags.filter((t: string[]) => t[0] === 'p');
      expect(pTags.length).toBe(1);
      expect(pTags[0][1]).toBe(spammer.publicKey);
    });
  });

  describe('Reactive Stores & Filtering', () => {
    it('should filter visible messages based on hides and mutes', async () => {
      const [owner, alice, bob, spammer] = await env.createTestUsers([
        'Owner-NIP28-11',
        'Alice-NIP28-11',
        'Bob-NIP28-11',
        'Spammer-NIP28-11'
      ]);
      
      owner.nostr.sub().kinds([40, 42, 43, 44]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Filter Test')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Alice sends good message
      const aliceMsg = await alice.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Good message from Alice')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Bob sends bad message (will be hidden)
      const bobMsg = await bob.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Bad message from Bob')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Spammer sends message (user will be muted)
      const spamMsg = await spammer.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Spam message')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Owner hides Bob's message
      await owner.nostr.social.channels.hide(bobMsg.eventId!).publish();
      await env.waitForPropagation(1500);
      
      // Owner mutes spammer
      await owner.nostr.social.channels.mute(spammer.publicKey).publish();
      await env.waitForPropagation(1500);
      
      // Get visible messages (should only show Alice's)
      const visibleStore = owner.nostr.social.channels.visibleMessages(
        channelResult.eventId!,
        owner.publicKey
      );
      
      await env.waitForSubscription(1500);
      
      const visible = visibleStore.current;
      
      // Should only show Alice's message
      expect(visible.length).toBe(1);
      expect(visible[0].pubkey).toBe(alice.publicKey);
      expect(visible[0].content).toBe('Good message from Alice');
      
      // Should NOT show Bob's (hidden) or Spammer's (muted)
      expect(visible.some((m: any) => m.id === bobMsg.eventId)).toBe(false);
      expect(visible.some((m: any) => m.id === spamMsg.eventId)).toBe(false);
    });

    it('should list all channels', async () => {
      const [owner] = await env.createTestUsers(['Owner-NIP28-12']);
      
      owner.nostr.sub().kinds([40]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create multiple channels
      await owner.nostr.social.channels.create().name('Channel 1').publish();
      await env.waitForPropagation(1000);
      
      await owner.nostr.social.channels.create().name('Channel 2').publish();
      await env.waitForPropagation(1000);
      
      // List channels
      const channelList = owner.nostr.social.channels.list();
      await env.waitForSubscription(1000);
      
      const channels = channelList.current;
      expect(channels.length).toBeGreaterThanOrEqual(2);
      
      // All should be kind 40
      expect(channels.every((c: any) => c.kind === 40)).toBe(true);
    });

    it('should get messages for channel', async () => {
      const [owner, user1, user2] = await env.createTestUsers([
        'Owner-NIP28-13',
        'User1-NIP28-13',
        'User2-NIP28-13'
      ]);
      
      owner.nostr.sub().kinds([40, 42]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      // Create channel
      const channelResult = await owner.nostr.social.channels
        .create()
        .name('Messages Test')
        .publish();
      
      await env.waitForPropagation(1500);
      
      // Send messages
      await user1.nostr.social.channels.message(channelResult.eventId!).content('Message 1').publish();
      await env.waitForPropagation(1000);
      
      await user2.nostr.social.channels.message(channelResult.eventId!).content('Message 2').publish();
      await env.waitForPropagation(1000);
      
      // Get messages
      const messagesStore = owner.nostr.social.channels.messagesFor(channelResult.eventId!);
      await env.waitForSubscription(1000);
      
      const messages = messagesStore.current;
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.every((m: any) => m.kind === 42)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should create channel within 2000ms', async () => {
      const [owner] = await env.createTestUsers(['Owner-NIP28-Perf1']);
      
      owner.nostr.sub().kinds([40]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      env.startPerformanceMeasurement();
      
      await owner.nostr.social.channels
        .create()
        .name('Performance Test')
        .publish();
      
      const duration = env.endPerformanceMeasurement('NIP-28 channel creation');
      env.assertPerformance(duration, 2000, 'NIP-28 channel creation');
    });

    it('should send message within 2000ms', async () => {
      const [owner, user] = await env.createTestUsers([
        'Owner-NIP28-Perf2',
        'User-NIP28-Perf2'
      ]);
      
      owner.nostr.sub().kinds([40, 42]).execute().catch(() => {});
      await env.waitForSubscription(1000);
      
      const channelResult = await owner.nostr.social.channels.create().name('Test').publish();
      await env.waitForPropagation(1500);
      
      env.startPerformanceMeasurement();
      
      await user.nostr.social.channels
        .message(channelResult.eventId!)
        .content('Performance test message')
        .publish();
      
      const duration = env.endPerformanceMeasurement('NIP-28 message sending');
      env.assertPerformance(duration, 2000, 'NIP-28 message sending');
    });
  });
});

