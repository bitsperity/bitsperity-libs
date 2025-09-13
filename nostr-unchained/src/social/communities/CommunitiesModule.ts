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
    // Prefer publishing to the explicit author relay if provided
    try {
      const authorRelay = this.relays.find((r) => r.marker === 'author')?.url;
      if (authorRelay) (b as any).toRelays?.(authorRelay);
    } catch {}
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
    if (this.relayHint) { try { (b as any).toRelays?.(this.relayHint); } catch {} }
    else if (this.community.relay) { try { (b as any).toRelays?.(this.community.relay); } catch {} }
    else {
      // Dynamisch Marker auflösen (requests)
      try {
        const markers = await (this.nostr.communities as any).resolveRelays(this.community.authorPubkey, this.community.identifier, 800);
        if (markers?.requests) { try { (b as any).toRelays?.(markers.requests); } catch {} }
      } catch {}
    }
    // Wenn weiterhin kein Ziel gesetzt ist: Fehler werfen (Safety)
    if (!(b as any).targetRelays || ((b as any).targetRelays?.length || 0) === 0) {
      throw new Error('No target relay known for community (requests). Set markers or pass relay().');
    }
    for (const t of this.buildTags()) b.tag(t[0], ...t.slice(1));
    return await b.publish();
  }
}

export class CommunityReplyBuilder {
  private _content: string | undefined;
  private relayHint?: string;
  constructor(private nostr: any, private community: CommunityAddress, private parent: { id: string; pubkey: string; relay?: string; kind?: number }) {}
  content(text: string): this { this._content = text ?? ''; return this; }
  relay(url: string): this { this.relayHint = url; return this; }
  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this._content || this._content.length === 0) throw new Error('Reply content must not be empty');
    const A = toAddress(this.community);
    const b = this.nostr.events.create().kind(1111).content(this._content);
    if (this.relayHint) { try { (b as any).toRelays?.(this.relayHint); } catch {} }
    else if (this.community.relay) { try { (b as any).toRelays?.(this.community.relay); } catch {} }
    else {
      try {
        const markers = await (this.nostr.communities as any).resolveRelays(this.community.authorPubkey, this.community.identifier, 800);
        if (markers?.requests) { try { (b as any).toRelays?.(markers.requests); } catch {} }
      } catch {}
    }
    if (!(b as any).targetRelays || ((b as any).targetRelays?.length || 0) === 0) {
      throw new Error('No target relay known for community (requests). Set markers or pass relay().');
    }
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
  private relayHint?: string;
  constructor(private nostr: any, private community: CommunityAddress) {}
  post(event: NostrEvent): this { this._post = event; this._contentJson = JSON.stringify(event); return this; }
  relay(url: string): this { this.relayHint = url; return this; }
  async publish(): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this._post) throw new Error('Approval requires a post event');
    const b = this.nostr.events.create().kind(4550).content(this._contentJson!);
    if (this.relayHint) { try { (b as any).toRelays?.(this.relayHint); } catch {} }
    else if (this.community.relay) { try { (b as any).toRelays?.(this.community.relay); } catch {} }
    else {
      try {
        const markers = await (this.nostr.communities as any).resolveRelays(this.community.authorPubkey, this.community.identifier, 800);
        if (markers?.approvals) { try { (b as any).toRelays?.(markers.approvals); } catch {} }
      } catch {}
    }
    if (!(b as any).targetRelays || ((b as any).targetRelays?.length || 0) === 0) {
      throw new Error('No target relay known for community (approvals). Set markers or pass relay().');
    }
    const A = toAddress(this.community);
    b.tag('a', A, ...(this.community.relay ? [this.community.relay] : []));
    b.tag('e', this._post.id);
    b.tag('p', this._post.pubkey);
    b.tag('k', String(this._post.kind));
    return await b.publish();
  }
}

export class CommunitiesModule {
  constructor(private nostr: any) {}

  private readonly relayMap = new Map<string, { author?: string; requests?: string; approvals?: string }>();

  private getAddress(authorPubkey: string, identifier: string): string {
    return `34550:${authorPubkey}:${identifier}`;
  }

  private learnRelaysFromEvent(ev: any): { author?: string; requests?: string; approvals?: string } {
    const relays = { author: undefined as string | undefined, requests: undefined as string | undefined, approvals: undefined as string | undefined };
    try {
      for (const t of ev?.tags || []) {
        if (t[0] === 'relay') {
          const url = t[1];
          const marker = t[2];
          if (marker === 'author') relays.author = url;
          else if (marker === 'requests') relays.requests = url;
          else if (marker === 'approvals') relays.approvals = url;
        }
      }
    } catch {}
    return relays;
  }

  private getRelays(authorPubkey: string, identifier: string): { author?: string; requests?: string; approvals?: string } {
    const addr = this.getAddress(authorPubkey, identifier);
    const cached = this.relayMap.get(addr);
    if (cached) return cached;
    try {
      const store = this.nostr.query().kinds([34550]).authors([authorPubkey]).execute();
      const events = (store as any).current || [];
      let latest: any = null;
      for (const ev of events) {
        const d = (ev.tags || []).find((t: string[]) => t[0] === 'd')?.[1];
        if (d === identifier && (!latest || ev.created_at > latest.created_at)) latest = ev;
      }
      if (latest) {
        const relays = this.learnRelaysFromEvent(latest);
        this.relayMap.set(addr, relays);
        return relays;
      }
    } catch {}
    return {};
  }

  /**
   * Ensure latest community definition is cached and return its marker relays.
   */
  async resolveRelays(authorPubkey: string, identifier: string, timeoutMs: number = 1000): Promise<{ author?: string; requests?: string; approvals?: string }> {
    const addr = this.getAddress(authorPubkey, identifier);
    const cached = this.relayMap.get(addr);
    if (cached && (cached.author || cached.requests || cached.approvals)) return cached;

    try {
      // Narrow subscription to pull latest 34550 into cache
      await this.nostr.sub().kinds([34550]).authors([authorPubkey]).limit(1).execute();
    } catch {}

    const store = this.nostr.query().kinds([34550]).authors([authorPubkey]).execute();
    const pickLatest = (events: NostrEvent[]) => {
      const candidates = events.filter((ev: NostrEvent) => (ev.tags || []).some((t: string[]) => t[0] === 'd' && t[1] === identifier));
      return candidates.sort((a: any, b: any) => b.created_at - a.created_at)[0] || null;
    };

    // Try current snapshot first
    let latest: NostrEvent | null = pickLatest((store as any).current || []);
    if (!latest) {
      // Wait briefly for cache fill
      latest = await new Promise<NostrEvent | null>((resolve) => {
        let done = false;
        let timer: any;
        try {
          const unsub = store.subscribe((events: NostrEvent[]) => {
            if (done) return;
            const l = pickLatest(events);
            if (l) {
              done = true; try { clearTimeout(timer); } catch {}
              try { unsub && unsub(); } catch {}
              resolve(l);
            }
          });
          timer = setTimeout(() => { if (done) return; done = true; try { unsub && unsub(); } catch {}; resolve(null); }, timeoutMs);
        } catch { resolve(null); }
      });
    }

    if (latest) {
      const relays = this.learnRelaysFromEvent(latest);
      this.relayMap.set(addr, relays);
      return relays;
    }
    return {};
  }

  // Builders
  create(authorPubkey: string): CommunityBuilder { return new CommunityBuilder(this.nostr, authorPubkey); }
  postTo(authorPubkey: string, identifier: string, relay?: MaybeString): CommunityPostBuilder {
    const builder = new CommunityPostBuilder(this.nostr, { authorPubkey, identifier, relay: relay || undefined });
    try {
      if (!relay) {
        const markers = this.getRelays(authorPubkey, identifier);
        if (markers?.requests) builder.relay(markers.requests);
      }
    } catch {}
    return builder;
  }
  replyTo(community: CommunityAddress, parent: { id: string; pubkey: string; relay?: string; kind?: number }): CommunityReplyBuilder {
    const builder = new CommunityReplyBuilder(this.nostr, community, parent);
    try {
      if (!community.relay) {
        const markers = this.getRelays(community.authorPubkey, community.identifier);
        if (markers?.requests) builder.relay(markers.requests);
      }
    } catch {}
    return builder;
  }
  approve(community: CommunityAddress): CommunityApprovalBuilder {
    const builder = new CommunityApprovalBuilder(this.nostr, community);
    try {
      const markers = this.getRelays(community.authorPubkey, community.identifier);
      if (markers?.approvals) builder.relay(markers.approvals);
    } catch {}
    return builder;
  }

  // Revoke an approval via NIP-09 deletion (kind 5)
  async revokeApproval(approvalEventId: string, reason?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    return await this.nostr.events
      .create()
      .kind(5)
      .content(reason || '')
      .tag('e', approvalEventId, '', 'deletion')
      .publish();
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

  posts(authorPubkey: string, identifier: string, options?: { approvedOnly?: boolean; moderatorsOnly?: boolean }) {
    const address = `34550:${authorPubkey}:${identifier}`;
    // subscribe to posts
    this.nostr.sub().kinds([1111]).execute().catch(() => {});
    if (options?.approvedOnly) {
      // ensure approvals and community defs are flowing
      this.nostr.sub().kinds([4550]).execute().catch(() => {});
      this.nostr.sub().kinds([34550]).authors([authorPubkey]).execute().catch(() => {});
      this.nostr.sub().kinds([5]).execute().catch(() => {});
    }
    return this.nostr
      .query()
      .kinds([1111])
      .execute()
      .map((events: NostrEvent[]) =>
        {
          // Base: posts in community
          let posts = events.filter((ev) => ev.tags.some((t) => (t[0] === 'A' || t[0] === 'a') && t[1] === address));
          if (options?.approvedOnly) {
            // Snapshot approvals and moderators from cache
            const approvalsStore = this.nostr.query().kinds([4550]).execute();
            const approvals = approvalsStore.current || [];
            const deletionsStore = this.nostr.query().kinds([5]).execute();
            const deletions = deletionsStore.current || [];
            // Exclude approvals that have a matching deletion (kind 5 referencing approval id)
            const isRevoked = (ap: NostrEvent) =>
              deletions.some((d: NostrEvent) => d.tags.some((t) => t[0] === 'e' && t[1] === ap.id));
            const modsStore = this.moderators(authorPubkey, identifier);
            const moderators = new Set((modsStore as any).current || []);
            posts = posts.filter((post) => {
              const relevant = approvals.filter((ap: NostrEvent) =>
                ap.tags.some((t) => t[0] === 'a' && t[1] === address) &&
                ap.tags.some((t) => t[0] === 'e' && t[1] === post.id) &&
                !isRevoked(ap)
              );
              if (relevant.length === 0) return false;
              if (options?.moderatorsOnly) {
                return relevant.some((ap: NostrEvent) => moderators.has(ap.pubkey));
              }
              return true;
            });
          }
          return posts;
        }
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


