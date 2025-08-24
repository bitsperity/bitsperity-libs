<script lang="ts">
  import { getService } from '$lib/services/ServiceContainer.js';
  import { onMount } from 'svelte';
  let { event, nostr, reactionSummary, likePending = false, repostPending = false, replyPending = false, deletePending = false, repostCount = 0, replyCount = 0, onLike, onRepost, onReply, onDelete }: any = $props();
  let isBookmarked = $state(false);
  let bookmarking = $state(false);
  let unsubscribeBookmarks: (() => void) | null = null;
  let bookmarkReady = $state(false);

  async function refreshBookmarkState() {
    try {
      const nostrService: any = await getService('nostr');
      const snap = nostrService?.getBookmarksSnapshot?.();
      isBookmarked = Array.isArray(snap?.items) && snap.items.includes(event?.id);
    } catch {}
  }

  // initial state handled in onMount; live updates via list subscription

  onMount(async () => {
    try {
      const nostrService: any = await getService('nostr');
      // Initialize from local snapshot immediately
      try {
        const snap = nostrService.getBookmarksSnapshot?.();
        isBookmarked = Array.isArray(snap?.items) && snap.items.includes(event?.id);
      } catch {}
      // Ensure a fresh sync to avoid stale local snapshot, then mark ready
      try { await nostrService.syncBookmarks(); } catch {}
      try {
        const snap2 = nostrService.getBookmarksSnapshot?.();
        isBookmarked = Array.isArray(snap2?.items) && snap2.items.includes(event?.id);
      } catch {}
      bookmarkReady = true;
      // Subscribe to remote bookmarks to keep UI in sync like reactions
      const me = await (nostr as any)?.getPublicKey?.();
      if (me && (nostr as any)?.lists?.get) {
        const store = (nostr as any).lists.get(me, 30003, 'bookmarks');
        unsubscribeBookmarks = store.subscribe((list: any) => {
          try {
            const ids = Array.isArray(list?.e) ? list.e.map((x: any) => x.id) : [];
            isBookmarked = ids.includes(event?.id);
          } catch {}
        });
      }
    } catch {}
    return () => { try { unsubscribeBookmarks && unsubscribeBookmarks(); } catch {} };
  });

  async function toggleBookmark() {
    bookmarking = true;
    const previous = isBookmarked;
    // Optimistic UI
    isBookmarked = !previous;
    try {
      const nostrService: any = await getService('nostr');
      // Trust remote state: if remote says already bookmarked/not, enforce that to choose add/remove
      let remoteSays = previous;
      try { remoteSays = await nostrService.hasBookmark(event.id, 1200); } catch {}
      const shouldRemove = remoteSays === true;
      if (shouldRemove) {
        await nostrService.removeBookmark(event.id);
      } else {
        await nostrService.addBookmark(event.id);
      }
      // Refresh local snapshot
      await nostrService.syncBookmarks();
      await refreshBookmarkState();
    } catch {
      // Revert on failure
      isBookmarked = previous;
    } finally {
      bookmarking = false;
    }
  }

  // Share menu state
  import { hexToNote, isValidHexKey } from '../../utils/keyDisplay.js';
  let shareOpen = $state(false);
  let copying = $state<null | 'hex' | 'note' | 'uri'>(null);

  function toggleShare() {
    shareOpen = !shareOpen;
  }

  async function copyHex() {
    if (!event?.id) return;
    copying = 'hex';
    try { await navigator.clipboard.writeText(event.id); } finally { setTimeout(()=> copying=null, 600); }
  }

  async function copyNote() {
    if (!event?.id) return;
    copying = 'note';
    try {
      const note = isValidHexKey(event.id) ? hexToNote(event.id) : '';
      await navigator.clipboard.writeText(note || event.id);
    } finally { setTimeout(()=> copying=null, 600); }
  }

  async function copyNostrUri() {
    if (!event?.id) return;
    copying = 'uri';
    try {
      const note = isValidHexKey(event.id) ? hexToNote(event.id) : '';
      const uri = note ? `nostr:${note}` : `nostr:${event.id}`;
      await navigator.clipboard.writeText(uri);
    } finally { setTimeout(()=> copying=null, 600); }
  }

  function openNjump() {
    if (!event?.id) return;
    const hex = String(event.id || '').toLowerCase();
    const note = isValidHexKey(hex) ? hexToNote(hex) : '';
    const target = `https://njump.me/${note || hex}`;
    const a = document.createElement('a');
    a.href = target;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    shareOpen = false;
  }
</script>

<div class="card-actions">
  <div class="left-actions">
    <button class="ghost {reactionSummary.userReactionType ? 'active' : ''}" aria-label="Like" title="Like/Unlike" onclick={onLike} disabled={likePending} aria-busy={likePending}>
      <span class="icon">❤️</span>
      {#if reactionSummary.totalCount}
        <span class="badge">{reactionSummary.totalCount}</span>
      {/if}
      {#if likePending}<span class="spinner" aria-hidden="true"></span>{/if}
    </button>

    <!-- Bookmark -->
    <button class="ghost {isBookmarked ? 'active' : ''}" aria-label="Bookmark" title="Bookmark" onclick={toggleBookmark} disabled={bookmarking || !bookmarkReady} aria-busy={bookmarking || !bookmarkReady}>
      <span class="icon">🔖</span>
    </button>

    <button class="ghost" aria-label="Repost" title="Repost" onclick={onRepost} disabled={repostPending} aria-busy={repostPending}>
      <span class="icon">🔄</span>
      {#if repostCount}
        <span class="badge">{repostCount}</span>
      {/if}
      {#if repostPending}<span class="spinner" aria-hidden="true"></span>{/if}
    </button>

    <button class="ghost" aria-label="Reply" title="Reply" onclick={onReply} disabled={replyPending} aria-busy={replyPending}>
      <span class="icon">💬</span>
      {#if replyCount}
        <span class="badge">{replyCount}</span>
      {/if}
      {#if replyPending}<span class="spinner" aria-hidden="true"></span>{/if}
    </button>

    {#if (nostr as any)?.me === event.pubkey}
      <button class="ghost danger" aria-label="Delete" title="Delete" onclick={onDelete} disabled={deletePending} aria-busy={deletePending}>
        <span class="icon">🗑️</span>
        {#if deletePending}<span class="spinner" aria-hidden="true"></span>{/if}
      </button>
    {/if}

    <!-- Share Menu -->
    <div class="share-wrapper">
      <button class="ghost" aria-label="Share" title="Share" onclick={toggleShare}>
        <span class="icon">🔗</span>
      </button>
      {#if shareOpen}
        <div class="share-menu" role="menu" tabindex="0" onmouseleave={() => shareOpen=false}>
          <button class="share-item" onclick={copyHex}>
            {copying==='hex' ? '✅' : '📋'} Copy hex id
          </button>
          <button class="share-item" onclick={copyNote}>
            {copying==='note' ? '✅' : '📋'} Copy note id
          </button>
          <button class="share-item" onclick={copyNostrUri}>
            {copying==='uri' ? '✅' : '📋'} Copy nostr: URI
          </button>
          <button class="share-item" onclick={openNjump}>
            ↗ Open on njump
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .card-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  .left-actions { display: flex; gap: 0.35rem; align-items: center; }
  .ghost { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem; border-radius: 9999px; 
           background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer;
           backdrop-filter: blur(6px); transition: transform .15s ease, background .15s ease, border-color .15s ease; position: relative; }
  .ghost:hover { transform: translateY(-1px); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
  .ghost[disabled] { opacity: 0.6; cursor: default; }
  .ghost.active { color: #ef4444; border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.08); }
  .ghost.active .icon { filter: drop-shadow(0 0 4px rgba(239,68,68,.35)); }
  .ghost.danger { color: #ef4444; }
  .icon { line-height: 1; }
  .badge { font-size: 0.7rem; background: rgba(255,255,255,0.06); padding: 0.05rem 0.4rem; border-radius: 9999px; }
  .spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.7); border-radius: 50%; animation: spin .6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Share menu */
  .share-wrapper { position: relative; }
  .share-menu { position: absolute; bottom: 110%; left: 0; display:flex; flex-direction: column; background: rgba(2,6,23,0.9); border:1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: .25rem; min-width: 180px; z-index: 20; box-shadow: 0 6px 18px rgba(0,0,0,.35); max-height: 220px; overflow:auto; }
  .share-item { text-align: left; background: transparent; color:#cbd5e1; border:none; padding: .35rem .5rem; border-radius: 8px; cursor: pointer; }
  .share-item:hover { background: rgba(255,255,255,0.06); }
</style>


