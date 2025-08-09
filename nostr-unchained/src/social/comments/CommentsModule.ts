import type { NostrEvent } from '../../core/types.js';

type MaybeString = string | undefined | null;

export interface CommentRootRef {
  E?: { id: string; relay?: string; pubkey?: string };
  A?: { address: string; relay?: string };
  I?: { identifier: string; context?: string };
  K?: { kind: number };
  P?: { pubkey: string; relay?: string };
}

export interface CommentParentRef {
  e?: { id: string; relay?: string; pubkey?: string };
  a?: { address: string; relay?: string };
  i?: { identifier: string; context?: string };
  k?: { kind: number };
  p?: { pubkey: string; relay?: string };
}

export class CommentBuilder {
  private root: CommentRootRef = {};
  private parent: CommentParentRef = {};
  private _content: string | undefined;

  constructor(private nostr: any) {}

  // Root references (uppercase)
  onEventRoot(eventId: string, relay?: MaybeString, pubkey?: MaybeString): this {
    this.root.E = { id: eventId, relay: relay || undefined, pubkey: pubkey || undefined };
    return this;
    }

  onAddressableRoot(kind: number, pubkey: string, identifier: string, relay?: MaybeString): this {
    this.root.A = { address: `${kind}:${pubkey}:${identifier}`, relay: relay || undefined };
    this.root.K = { kind };
    this.root.P = { pubkey };
    return this;
  }

  onExternalRoot(identifier: string, context?: MaybeString): this {
    this.root.I = { identifier, context: context || undefined };
    return this;
  }

  onKindRoot(kind: number): this {
    this.root.K = { kind };
    return this;
  }

  onAuthorRoot(pubkey: string, relay?: MaybeString): this {
    this.root.P = { pubkey, relay: relay || undefined };
    return this;
  }

  // Parent references (lowercase)
  replyToEvent(parentEventId: string, relay?: MaybeString, pubkey?: MaybeString): this {
    this.parent.e = { id: parentEventId, relay: relay || undefined, pubkey: pubkey || undefined };
    return this;
  }

  replyToAddress(kind: number, pubkey: string, identifier: string, relay?: MaybeString): this {
    this.parent.a = { address: `${kind}:${pubkey}:${identifier}`, relay: relay || undefined };
    this.parent.k = { kind };
    this.parent.p = { pubkey };
    return this;
  }

  replyToExternal(identifier: string, context?: MaybeString): this {
    this.parent.i = { identifier, context: context || undefined };
    return this;
  }

  replyToKind(kind: number): this {
    this.parent.k = { kind };
    return this;
  }

  replyToAuthor(pubkey: string, relay?: MaybeString): this {
    this.parent.p = { pubkey, relay: relay || undefined };
    return this;
  }

  content(text: string): this {
    this._content = text ?? '';
    return this;
  }

  private buildTags(): string[][] {
    const tags: string[][] = [];
    // Uppercase root
    if (this.root.E) tags.push(['E', this.root.E.id, this.root.E.relay || '', this.root.E.pubkey || ''].filter(Boolean) as string[]);
    if (this.root.A) tags.push(['A', this.root.A.address, this.root.A.relay || ''].filter(Boolean) as string[]);
    if (this.root.I) tags.push(['I', this.root.I.identifier, this.root.I.context || ''].filter(Boolean) as string[]);
    if (this.root.K) tags.push(['K', String(this.root.K.kind)]);
    if (this.root.P) tags.push(['P', this.root.P.pubkey, this.root.P.relay || ''].filter(Boolean) as string[]);

    // Lowercase parent
    if (this.parent.e) tags.push(['e', this.parent.e.id, this.parent.e.relay || '', this.parent.e.pubkey || ''].filter(Boolean) as string[]);
    if (this.parent.a) tags.push(['a', this.parent.a.address, this.parent.a.relay || ''].filter(Boolean) as string[]);
    if (this.parent.i) tags.push(['i', this.parent.i.identifier, this.parent.i.context || ''].filter(Boolean) as string[]);
    if (this.parent.k) tags.push(['k', String(this.parent.k.kind)]);
    if (this.parent.p) tags.push(['p', this.parent.p.pubkey, this.parent.p.relay || ''].filter(Boolean) as string[]);

    return tags;
  }

  async publish(targetRelays?: string[]): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this._content || this._content.length === 0) {
      throw new Error('Comment content must not be empty');
    }
    const builder = this.nostr.events.create().kind(1111).content(this._content);
    for (const tag of this.buildTags()) builder.tag(tag[0], ...tag.slice(1));
    const signed = await builder.sign();
    const res = await this.nostr.publishSigned(await signed.build(), targetRelays);
    return res;
  }
}

export class CommentsModule {
  constructor(private nostr: any) {}

  /** Create a new comment builder */
  create(): CommentBuilder {
    return new CommentBuilder(this.nostr);
  }

  /** Reactive stream of comments for a given root address (kind:pubkey:d) */
  getForAddressable(kind: number, pubkey: string, identifier: string) {
    const address = `${kind}:${pubkey}:${identifier}`;
    // Subscription-first: subscribe broadly by kind and filter client-side by tags
    this.nostr
      .sub()
      .kinds([1111])
      .execute()
      .catch(() => {});

    return this.nostr
      .query()
      .kinds([1111])
      .execute()
      .map((events: NostrEvent[]) =>
        events.filter((ev) => ev.tags.some((t) => (t[0] === 'A' && t[1] === address) || (t[0] === 'a' && t[1] === address)))
      );
  }

  /** Reactive stream of replies to a parent comment id */
  getRepliesTo(parentCommentId: string) {
    // Subscribe narrowly by kind 1111; then client-side filter by lowercase e
    this.nostr
      .sub()
      .kinds([1111])
      .execute()
      .catch(() => {});

    return this.nostr
      .query()
      .kinds([1111])
      .execute()
      .map((events: NostrEvent[]) => events.filter((ev) => ev.tags.some((t) => t[0] === 'e' && t[1] === parentCommentId)));
  }
}


