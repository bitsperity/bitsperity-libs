import type { NostrEvent } from '../../core/types.js';

type PublishResult = any;

interface ChannelMetadataContent {
  name?: string;
  about?: string;
  picture?: string;
  relays?: string[];
}

export class ChannelCreateBuilder {
  private meta: ChannelMetadataContent = {};
  private categoryTags: string[] = [];
  constructor(private nostr: any) {}

  name(name: string): this { this.meta.name = name; return this; }
  about(about: string): this { this.meta.about = about; return this; }
  picture(url: string): this { this.meta.picture = url; return this; }
  relays(relays: string[]): this { this.meta.relays = relays; return this; }
  category(tag: string): this { this.categoryTags.push(tag); return this; }

  async publish(): Promise<PublishResult> {
    const content = JSON.stringify(this.meta);
    const builder = this.nostr.events.create().kind(40).content(content);
    for (const t of this.categoryTags) builder.tag('t', t);
    return builder.publish();
  }
}

export class ChannelMetadataBuilder {
  private meta: ChannelMetadataContent = {};
  private categoryTags: string[] = [];
  private relayHint?: string;
  constructor(private nostr: any, private channelEventId: string) {}

  hint(url: string): this { this.relayHint = url; return this; }
  name(name: string): this { this.meta.name = name; return this; }
  about(about: string): this { this.meta.about = about; return this; }
  picture(url: string): this { this.meta.picture = url; return this; }
  relays(relays: string[]): this { this.meta.relays = relays; return this; }
  category(tag: string): this { this.categoryTags.push(tag); return this; }

  async publish(): Promise<PublishResult> {
    const content = JSON.stringify(this.meta);
    const builder = this.nostr.events
      .create()
      .kind(41)
      .content(content)
      .tag('e', this.channelEventId, this.relayHint || '', 'root');
    for (const t of this.categoryTags) builder.tag('t', t);
    return builder.publish();
  }
}

export class ChannelMessageBuilder {
  private messageContent: string = '';
  private replyToEventId?: string;
  private replyRelayHint?: string;
  private mentions: Array<{ pubkey: string; relay?: string }> = [];
  private relayHint?: string;
  constructor(private nostr: any, private channelEventId: string) {}

  hint(url: string): this { this.relayHint = url; return this; }
  content(text: string): this { this.messageContent = text; return this; }
  replyTo(eventId: string, relayHint?: string): this { this.replyToEventId = eventId; this.replyRelayHint = relayHint; return this; }
  mention(pubkey: string, relay?: string): this { this.mentions.push({ pubkey, relay }); return this; }

  async publish(): Promise<PublishResult> {
    const builder = this.nostr.events
      .create()
      .kind(42)
      .content(this.messageContent)
      .tag('e', this.channelEventId, this.relayHint || '', 'root');
    if (this.replyToEventId) builder.tag('e', this.replyToEventId, this.replyRelayHint || '', 'reply');
    for (const m of this.mentions) builder.tag('p', m.pubkey, m.relay || '');
    return builder.publish();
  }
}

export class HideMessageBuilder {
  private reason?: string;
  constructor(private nostr: any, private messageEventId: string) {}
  withReason(reason: string): this { this.reason = reason; return this; }
  async publish(): Promise<PublishResult> {
    const content = this.reason ? JSON.stringify({ reason: this.reason }) : '';
    return this.nostr.events.create().kind(43).content(content).tag('e', this.messageEventId).publish();
  }
}

export class MuteUserBuilder {
  private reason?: string;
  constructor(private nostr: any, private pubkey: string) {}
  withReason(reason: string): this { this.reason = reason; return this; }
  async publish(): Promise<PublishResult> {
    const content = this.reason ? JSON.stringify({ reason: this.reason }) : '';
    return this.nostr.events.create().kind(44).content(content).tag('p', this.pubkey).publish();
  }
}

export class ChannelsModule {
  constructor(private nostr: any) {}

  create(): ChannelCreateBuilder { return new ChannelCreateBuilder(this.nostr); }
  metadata(channelEventId: string): ChannelMetadataBuilder { return new ChannelMetadataBuilder(this.nostr, channelEventId); }
  message(channelEventId: string): ChannelMessageBuilder { return new ChannelMessageBuilder(this.nostr, channelEventId); }
  hide(messageEventId: string): HideMessageBuilder { return new HideMessageBuilder(this.nostr, messageEventId); }
  mute(pubkey: string): MuteUserBuilder { return new MuteUserBuilder(this.nostr, pubkey); }

  // Reactive: list of channels (kind 40)
  list() {
    this.nostr.sub().kinds([40]).execute().catch(() => {});
    return this.nostr.query().kinds([40]).execute();
  }

  // Reactive: metadata (latest kind 41) for a channel
  metadataFor(channelEventId: string) {
    this.nostr.sub().kinds([41]).tags('e', [channelEventId]).execute().catch(() => {});
    return this.nostr.query().kinds([41]).tags('e', [channelEventId]).execute();
  }

  // Reactive: messages for a channel (kind 42 with e-tag root=channel id)
  messagesFor(channelEventId: string) {
    this.nostr.sub().kinds([42]).tags('e', [channelEventId]).execute().catch(() => {});
    return this.nostr.query().kinds([42]).tags('e', [channelEventId]).execute();
  }

  // Reactive: viewer-visible messages (filter out 43/44 by viewer)
  visibleMessages(channelEventId: string, viewerPubkey: string) {
    const messages = this.messagesFor(channelEventId);
    const hides = this.nostr.query().kinds([43]).authors([viewerPubkey]).execute();
    const mutes = this.nostr.query().kinds([44]).authors([viewerPubkey]).execute();
    // Produce a mapped store using UniversalNostrStore.map
    return (messages as any).map((events: NostrEvent[]) => {
      const hiddenIds = new Set<string>((hides as any).current?.flatMap((e: NostrEvent) => e.tags.filter(t => t[0]==='e').map(t => t[1])) || []);
      const mutedPubkeys = new Set<string>((mutes as any).current?.flatMap((e: NostrEvent) => e.tags.filter(t => t[0]==='p').map(t => t[1])) || []);
      return events.filter(ev => !hiddenIds.has(ev.id) && !mutedPubkeys.has(ev.pubkey));
    });
  }
}


