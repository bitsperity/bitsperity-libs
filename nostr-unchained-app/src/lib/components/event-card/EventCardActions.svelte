<script lang="ts">
  export let event: any;
  export let nostr: any;
  export let reactionSummary: { totalCount: number; userReacted: boolean; userReactionType?: string };
  export let likePending = false;
  export let repostPending = false;
  export let replyPending = false;
  export let deletePending = false;
  export let onLike: () => void;
  export let onRepost: () => void;
  export let onReply: () => void;
  export let onDelete: () => void;
</script>

<div class="card-actions">
  <div class="left-actions">
    <button class="action-btn heart-btn {reactionSummary.userReactionType ? 'active' : ''}" aria-label="Like" title="Like/Unlike" onclick={onLike} disabled={likePending}>
      <svg class="heart-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4 8.04 4 9.54 4.81 10.35 6.08 11.16 4.81 12.66 4 14.2 4 16.69 4 18.7 6.01 18.7 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
      </svg>
      <span class="count">{reactionSummary.totalCount || ''}</span>
    </button>
    <button class="action-btn" aria-label="Repost" title="Repost" onclick={onRepost} disabled={repostPending}>
      🔄
    </button>
    <button class="action-btn" aria-label="Reply" title="Reply" onclick={onReply} disabled={replyPending}>
      💬
    </button>
    {#if (nostr as any)?.me === event.pubkey}
      <button class="action-btn" aria-label="Delete" title="Delete" onclick={onDelete} disabled={deletePending}>🗑️</button>
    {/if}
  </div>
</div>

<style>
  .card-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  .left-actions { display: flex; gap: 0.25rem; align-items: center; }
  .action-btn { background: none; border: none; color: #64748b; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
  .action-btn:hover { color: #94a3b8; background: rgba(255, 255, 255, 0.05); }
  .heart-btn { color: #64748b; }
  .heart-btn .heart-icon { display: inline-block; fill: none; stroke: currentColor; stroke-width: 2; }
  .heart-btn.active { color: #ef4444; }
  .heart-btn.active .heart-icon { fill: currentColor; }
  .heart-btn .count { margin-left: 4px; }
</style>


