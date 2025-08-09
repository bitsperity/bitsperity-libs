<script lang="ts">
  export let event: any;
  export let nostr: any;
  export let reactionSummary: { totalCount: number; userReacted: boolean; userReactionType?: string };
  export let likePending = false;
  export let repostPending = false;
  export let replyPending = false;
  export let deletePending = false;
  export let repostCount: number = 0;
  export let replyCount: number = 0;
  export let onLike: () => void;
  export let onRepost: () => void;
  export let onReply: () => void;
  export let onDelete: () => void;
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
  .ghost.danger { color: #ef4444; }
  .icon { line-height: 1; }
  .badge { font-size: 0.7rem; background: rgba(255,255,255,0.06); padding: 0.05rem 0.4rem; border-radius: 9999px; }
  .spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.7); border-radius: 50%; animation: spin .6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>


