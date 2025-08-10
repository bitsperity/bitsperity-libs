import type { NostrEvent } from '../../core/types.js';

export class LabelsBuilder {
  private tags: string[][] = [];
  private content: string = '';
  constructor(private nostr: any) {}

  namespace(ns: string): this {
    this.tags.push(['L', ns]);
    return this;
  }

  label(value: string, namespaceMark?: string): this {
    if (namespaceMark) this.tags.push(['l', value, namespaceMark]);
    else this.tags.push(['l', value]);
    return this;
  }

  targetEvent(eventId: string, relayHint?: string): this {
    this.tags.push(['e', eventId, relayHint || '']);
    return this;
  }

  targetAuthor(pubkey: string, relayHint?: string): this {
    this.tags.push(['p', pubkey, relayHint || '']);
    return this;
  }

  targetAddress(address: string, relayHint?: string): this {
    this.tags.push(['a', address, relayHint || '']);
    return this;
  }

  targetRelay(url: string): this {
    this.tags.push(['r', url]);
    return this;
  }

  targetTopic(topic: string): this {
    this.tags.push(['t', topic]);
    return this;
  }

  reason(text: string): this {
    this.content = text;
    return this;
  }

  async publish(): Promise<any> {
    return await this.nostr.events
      .create()
      .kind(1985)
      .content(this.content)
      .tags(this.tags)
      .publish();
  }
}

export class LabelsModule {
  constructor(private nostr: any) {}

  edit(): LabelsBuilder {
    return new LabelsBuilder(this.nostr);
  }

  /** Reactive store of labels (kind 1985) for a given target event */
  forEvent(eventId: string) {
    this.nostr.sub().kinds([1985]).tags('e', [eventId]).execute().catch(() => {});
    return this.nostr.query().kinds([1985]).tags('e', [eventId]).execute();
  }
}


