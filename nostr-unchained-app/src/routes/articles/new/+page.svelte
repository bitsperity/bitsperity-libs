<script lang="ts">
  import { getService } from '$lib/services/ServiceContainer.js';
  import { goto } from '$app/navigation';

  let d = $state('');
  let title = $state('');
  let summary = $state('');
  let image = $state('');
  let content = $state('');
  let pending = $state(false);

  async function publish() {
    if (!d || !content) return;
    pending = true;
    try {
      const svc: any = await getService('nostr');
      const inst = await svc.getReadyInstance();
      const b = inst.content?.article?.();
      if (!b) { pending = false; return; }
      b.identifier(d).content(content);
      if (title) b.title?.(title);
      if (summary) b.summary?.(summary);
      if (image) b.image?.(image);
      const res = await b.publish();
      if (res?.success) {
        const pubkey = await inst.getPublicKey?.();
        goto(`/articles/${pubkey}/${encodeURIComponent(d)}`);
      }
    } finally {
      pending = false;
    }
  }
</script>

<div class="article-new">
  <header class="page-header">
    <button class="ghost" onclick={() => history.length > 1 ? history.back() : goto('/articles')}>←</button>
    <h1>New Article</h1>
  </header>
  <div class="form">
    <input type="text" placeholder="Identifier (d)" bind:value={d} />
    <input type="text" placeholder="Title" bind:value={title} />
    <input type="text" placeholder="Summary" bind:value={summary} />
    <input type="text" placeholder="Image URL" bind:value={image} />
    <textarea rows="14" placeholder="Content" bind:value={content}></textarea>
    <div class="actions">
      <button class="primary" onclick={publish} disabled={pending || !d || !content}>{pending ? 'Publishing…' : 'Publish'}</button>
    </div>
  </div>
</div>

<style>
  .article-new { padding: 1rem; display:flex; flex-direction:column; gap:.75rem; }
  .page-header { display:flex; align-items:center; gap:.75rem; }
  .ghost { border:1px solid rgba(255,255,255,0.12); background: transparent; color:#cbd5e1; border-radius:8px; padding:4px 8px; cursor:pointer; }
  .form { display:flex; flex-direction:column; gap:.5rem; }
  input, textarea { padding:10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); }
  .actions { display:flex; gap:.5rem; }
  .primary { border:1px solid rgba(255,255,255,0.12); background: var(--color-primary); color: var(--color-primary-text); border-radius:8px; padding:8px 12px; cursor:pointer; }
</style>


