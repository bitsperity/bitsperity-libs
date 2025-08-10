import type { NostrEvent } from '../../core/types.js';

type MaybeString = string | undefined | null;

export interface CommunityAddress {
  authorPubkey: string;
  identifier: string; // d identifier
  relay?: string;
}

function toAddress(c: CommunityAddress): string {
  return `34550:${c.authorPubkey}:${c.identifier}`;
}

export class CommunityBuilder {
  private d?: string;
  private nameTag?: string;
  private descriptionTag?: string;
  private imageTag?: { url: string; dim?: string };
  private moderators: Array<{ pubkey: string; relay?: string } > = [];
  private relays: Array<{ url: string; marker?: 'author' | 'requests' | 'approvals' } > = [];

  constructor(private nostr: any, private authorPubkey: string) {}

  identifier(d: string): this { this.d = d; return this; }
  name(name: string): this { this.nameTag = name; return this; }
  description(desc: string): this { this.descriptionTag = desc; return this; }
  image(url: string, dim?: string): this { this.imageTag = { url, dim }; return this; }
  moderator(pubkey: string, relay?: MaybeString): this { this.moderators.push({ pubkey, relay: relay || undefined }); return this; }
  relay(url: string, marker?: 'author' | 'requests' | 'approvals'): this { this.relays.push({ url, marker }); return this; }

  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this.d) throw new Error('Community identifier (d) is required');
    const b = this.nostr.events.create().kind(34550).content('');
    b.tag('d', this.d);
    if (this.nameTag) b.tag('name', this.nameTag);
    if (this.descriptionTag) b.tag('description', this.descriptionTag);
    if (this.imageTag) b.tag('image', this.imageTag.url, ...(this.imageTag.dim ? [this.imageTag.dim] : []));
    for (const m of this.moderators) {
      b.tag('p', m.pubkey, ...(m.relay ? [m.relay] : []), 'moderator');
    }
    for (const r of this.relays) {
      if (r.marker) b.tag('relay', r.url, r.marker);
      else b.tag('relay', r.url);
    }
    return await b.publish();
  }
}

export class CommunityPostBuilder {
  private _content: string | undefined;
  private relayHint?: string;
  constructor(private nostr: any, private community: CommunityAddress) {}

  content(text: string): this { this._content = text ?? ''; return this; }
  relay(url: string): this { this.relayHint = url; return this; }

  private buildTags(): string[][] {
    const A = toAddress(this.community);
    const tags: string[][] = [];
    // Per NIP-72 top-level posts: uppercase and lowercase tags refer to community definition
    tags.push(['A', A, ...(this.community.relay ? [this.community.relay] : [])]);
    tags.push(['a', A, ...(this.community.relay ? [this.community.relay] : [])]);
    tags.push(['P', this.community.authorPubkey, ...(this.community.relay ? [this.community.relay] : [])]);
    tags.push(['p', this.community.authorPubkey, ...(this.community.relay ? [this.community.relay] : [])]);
    tags.push(['K', '34550']);
    tags.push(['k', '34550']);
    return tags;
  }

  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this._content || this._content.length === 0) throw new Error('Post content must not be empty');
    const b = this.nostr.events.create().kind(1111).content(this._content);
    for (const t of this.buildTags()) b.tag(t[0], ...t.slice(1));
    return await b.publish();
  }
}

export class CommunityReplyBuilder {
  private _content: string | undefined;
  constructor(private nostr: any, private community: CommunityAddress, private parent: { id: string; pubkey: string; relay?: string; kind?: number }) {}
  content(text: string): this { this._content = text ?? ''; return this; }
  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this._content || this._content.length === 0) throw new Error('Reply content must not be empty');
    const A = toAddress(this.community);
    const b = this.nostr.events.create().kind(1111).content(this._content);
    // Uppercase root stays on community
    b.tag('A', A, ...(this.community.relay ? [this.community.relay] : []));
    b.tag('P', this.community.authorPubkey, ...(this.community.relay ? [this.community.relay] : []));
    b.tag('K', '34550');
    // Lowercase refers to parent
    b.tag('e', this.parent.id, ...(this.parent.relay ? [this.parent.relay] : []));
    b.tag('p', this.parent.pubkey, ...(this.parent.relay ? [this.parent.relay] : []));
    b.tag('k', String(this.parent.kind ?? 1111));
    return await b.publish();
  }
}

export class CommunityApprovalBuilder {
  private _post?: NostrEvent;
  private _contentJson?: string;
  constructor(private nostr: any, private community: CommunityAddress) {}
  post(event: NostrEvent): this { this._post = event; this._contentJson = JSON.stringify(event); return this; }
  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this._post) throw new Error('Approval requires a post event');
    const b = this.nostr.events.create().kind(4550).content(this._contentJson!);
    const A = toAddress(this.community);
    b.tag('a', A, ...(this.community.relay ? [this.community.relay] : []));
    b.tag('e', this._post.id);
    b.tag('p', this._post.pubkey);
    b.tag('k', String(this._post.kind));
    const signed = await b.sign();
    return await this.nostr.publishSigned(await signed.build());
  }
}

export class CommunitiesModule {
  constructor(private nostr: any) {}

  // Builders
  create(authorPubkey: string): CommunityBuilder { return new CommunityBuilder(this.nostr, authorPubkey); }
  postTo(authorPubkey: string, identifier: string, relay?: MaybeString): CommunityPostBuilder {
    return new CommunityPostBuilder(this.nostr, { authorPubkey, identifier, relay: relay || undefined });
  }
  replyTo(community: CommunityAddress, parent: { id: string; pubkey: string; relay?: string; kind?: number }): CommunityReplyBuilder {
    return new CommunityReplyBuilder(this.nostr, community, parent);
  }
  approve(community: CommunityAddress): CommunityApprovalBuilder {
    return new CommunityApprovalBuilder(this.nostr, community);
  }

  // Readers (subscription-first: we start subs narrowly by kind)
  getCommunity(authorPubkey: string, identifier: string) {
    const d = identifier;
    // subscribe to kind 34550 by author
    this.nostr
      .sub()
      .kinds([34550])
      .authors([authorPubkey])
      .execute()
      .catch(() => {});
    return this.nostr.query().kinds([34550]).authors([authorPubkey]).execute().map((events: NostrEvent[]) => {
      const candidates = events.filter(ev => ev.tags.some(t => t[0] === 'd' && t[1] === d));
      // replaceable: pick latest by created_at
      return candidates.sort((a, b) => b.created_at - a.created_at)[0] ?? null;
    });
  }

  posts(authorPubkey: string, identifier: string) {
    const address = `34550:${authorPubkey}:${identifier}`;
    // subscribe to posts
    this.nostr.sub().kinds([1111]).execute().catch(() => {});
    return this.nostr
      .query()
      .kinds([1111])
      .execute()
      .map((events: NostrEvent[]) =>
        events.filter((ev) =>
          ev.tags.some((t) => (t[0] === 'A' || t[0] === 'a') && t[1] === address)
        )
      );
  }

  approvals(authorPubkey: string, identifier: string, postId?: string) {
    const address = `34550:${authorPubkey}:${identifier}`;
    // subscribe narrowly to approvals; optionally filter by e-tag client-side
    this.nostr
      .sub()
      .kinds([4550])
      .execute()
      .catch(() => {});
    return this.nostr
      .query()
      .kinds([4550])
      .execute()
      .map((events: NostrEvent[]) =>
        events.filter(
          (ev) =>
            ev.tags.some((t) => t[0] === 'a' && t[1] === address) &&
            (!postId || ev.tags.some((t) => t[0] === 'e' && t[1] === postId))
        )
      );
  }

  moderators(authorPubkey: string, identifier: string) {
    // Reactive derivation from replaceable 34550 events
    const d = identifier;
    this.nostr
      .sub()
      .kinds([34550])
      .authors([authorPubkey])
      .execute()
      .catch(() => {});
    return this.nostr
      .query()
      .kinds([34550])
      .authors([authorPubkey])
      .execute()
      .map((events: NostrEvent[]) => {
        const candidates = events.filter((ev) => ev.tags.some((t) => t[0] === 'd' && t[1] === d));
        const latest = candidates.sort((a, b) => b.created_at - a.created_at)[0];
        if (!latest) return [] as string[];
        const mods = latest.tags
          .filter((t) => t[0] === 'p' && (t[3] === 'moderator' || t.includes('moderator')))
          .map((t) => t[1]);
        return Array.from(new Set(mods));
      });
  }
}


