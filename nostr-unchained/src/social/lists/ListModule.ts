import type { NostrEvent } from '../../core/types.js';

export type ListKind = 30000 | 30001 | 30002 | 30003;

export interface ParsedList {
  kind: ListKind;
  identifier: string | null;
  title?: string;
  description?: string;
  image?: string;
  p: Array<{ pubkey: string; relay?: string; petname?: string }>;
  e: Array<{ id: string; relay?: string }>;
  a: Array<{ address: string; relay?: string }>;
  relays: string[];
  topics: string[];
  updatedAt: number | null;
}

export class ListBuilder {
  private tags: string[][] = [];
  private content: string = '';
  private identifier: string | null = null;
  constructor(private nostr: any, private kind: ListKind) {}

  id(d: string): ListBuilder {
    this.identifier = d;
    return this;
  }
  title(t: string): ListBuilder {
    this.tags.push(['title', t]);
    return this;
  }
  description(desc: string): ListBuilder {
    this.tags.push(['description', desc]);
    return this;
  }
  image(url: string): ListBuilder {
    this.tags.push(['image', url]);
    return this;
  }
  note(content: string): ListBuilder {
    this.content = content;
    return this;
  }
  addPerson(pubkey: string, relay?: string, petname?: string): ListBuilder {
    const t: string[] = ['p', pubkey];
    if (relay) t.push(relay);
    if (petname) t.push(petname);
    this.tags.push(t);
    return this;
  }
  addEvent(id: string, relay?: string): ListBuilder {
    const t: string[] = ['e', id];
    if (relay) t.push(relay);
    this.tags.push(t);
    return this;
  }
  addAddress(address: string, relay?: string): ListBuilder {
    const t: string[] = ['a', address];
    if (relay) t.push(relay);
    this.tags.push(t);
    return this;
  }
  addRelay(url: string): ListBuilder {
    this.tags.push(['relay', url]);
    return this;
  }
  topic(tag: string): ListBuilder {
    this.tags.push(['t', tag]);
    return this;
  }

  async publish(): Promise<any> {
    const builder = this.nostr.events.kind(this.kind).content(this.content || '');
    if (this.identifier) builder.tag('d', this.identifier);
    for (const t of this.tags) builder.tag(...t as any);
    return builder.publish();
  }
}

export class ListModule {
  constructor(private nostr: any) {}

  edit(kind: ListKind, identifier?: string): ListBuilder {
    const b = new ListBuilder(this.nostr, kind);
    if (identifier) b.id(identifier);
    return b;
  }

  get(author: string, kind: ListKind, identifier?: string): any {
    // Subscription-first: ensure cache fills
    const sub = this.nostr.sub().kinds([kind]).authors([author]);
    if (identifier) sub.tags('d', [identifier]);
    sub.limit(1).execute().catch(() => {});

    const q = this.nostr.query().kinds([kind]).authors([author]);
    if (identifier) q.tags('d', [identifier]);
    const store = q.limit(1).execute().map((events: NostrEvent[]) => this.parse(events?.[0]));
    return store;
  }

  private parse(event?: NostrEvent): ParsedList | null {
    if (!event) return null;
    const getTag = (name: string) => event.tags.find((t) => t[0] === name)?.[1];
    const all = (name: string) => event.tags.filter((t) => t[0] === name);
    const identifier = getTag('d') || null;
    const title = getTag('title');
    const description = getTag('description');
    const image = getTag('image');
    const p = all('p').map(t => ({ pubkey: t[1], relay: t[2], petname: t[3] }));
    const e = all('e').map(t => ({ id: t[1], relay: t[2] }));
    const a = all('a').map(t => ({ address: t[1], relay: t[2] }));
    const relays = all('relay').map(t => t[1]);
    const topics = all('t').map(t => t[1]);
    return {
      kind: event.kind as ListKind,
      identifier,
      title,
      description,
      image,
      p,
      e,
      a,
      relays,
      topics,
      updatedAt: event.created_at
    };
  }
}


