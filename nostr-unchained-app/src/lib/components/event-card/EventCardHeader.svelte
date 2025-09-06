<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ProfileAvatar from '../ui/ProfileAvatar.svelte';
  import KeyDisplay from '../ui/KeyDisplay.svelte';

  export let event: any;
  export let nostr: any;

  const dispatch = createEventDispatcher();
  let idCopied = false;
  let copyTimer: any;

  function getEventType(kind: number): string {
    const eventTypes: Record<number, string> = {
      0: 'Profile',
      1: 'Text Note',
      3: 'Contacts',
      4: 'Direct Message',
      5: 'Delete',
      6: 'Repost',
      7: 'Reaction',
      1984: 'Report',
      9734: 'Zap Request',
      9735: 'Zap',
      10002: 'Relay List',
      30023: 'Long Form'
    };
    return eventTypes[kind] ?? `Kind ${kind}`;
  }

  function getEventIcon(kind: number): string {
    const icons: Record<number, string> = {
      0: '👤',
      1: '💬',
      3: '👥',
      4: '🔒',
      5: '🗑️',
      6: '🔄',
      7: '❤️',
      1984: '🚨',
      9734: '⚡',
      9735: '⚡',
      10002: '🔗',
      30023: '📄'
    };
    return icons[kind] ?? '📦';
  }

  function formatTimestamp(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  async function copyEventId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(event.id);
      idCopied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (idCopied = false), 1200);
    } catch {}
  }
</script>

<div class="event-meta">
  <span class="event-icon" role="img" aria-label={getEventType(event.kind)}>
    {getEventIcon(event.kind)}
  </span>
  <span class="event-type">{getEventType(event.kind)}</span>
  <span class="event-time">{formatTimestamp(event.created_at)}</span>
  <button class="event-id-btn" title="Copy event id (hex)" on:click={copyEventId}>
    <code class="event-id-frag">{event.id?.slice(0,8)}…</code>
    {#if idCopied}<span class="copied">✓</span>{/if}
  </button>
</div>
<div class="author-info">
  <div class="avatar-wrap" data-prevent-nav on:click|stopPropagation>
    <ProfileAvatar 
      pubkey={event.pubkey}
      {nostr}
      size="sm"
      clickable={true}
      navigateOnClick={true}
      on:profileClick={(e) => dispatch('profileClick', e.detail)}
    />
  </div>
  <KeyDisplay 
    hexKey={event.pubkey}
    variant="compact"
    copyable={true}
    className="event-author"
  />
  
</div>

<style>
  .event-meta { display: flex; align-items: center; gap: 0.5rem; }
  .event-icon { font-size: 1.125rem; }
  .event-type { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .event-time { font-size: 0.75rem; color: #64748b; font-family: var(--font-mono); }
  .author-info { display: flex; align-items: center; gap: var(--spacing-xs); justify-content: flex-end; }
  .event-id-btn { 
    display: inline-flex; align-items: center; gap: 0.3rem;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #94a3b8; padding: 0.1rem 0.4rem; border-radius: 0.375rem;
    cursor: pointer; transition: background .15s ease, color .15s ease;
  }
  .event-id-btn:hover { background: rgba(255,255,255,0.07); color: #cbd5e1; }
  .event-id-frag { font-family: var(--font-mono); font-size: 0.72rem; }
  .copied { color: #10b981; font-size: 0.72rem; }
</style>


