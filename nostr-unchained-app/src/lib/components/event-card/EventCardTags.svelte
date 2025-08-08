<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let tags: string[][] = [];
  const dispatch = createEventDispatcher();

  type TagGroups = Record<string, string[][]>;

  function groupTags(list: string[][]): TagGroups {
    const groups: TagGroups = {};
    (list || []).forEach((t) => {
      if (!t || t.length === 0) return;
      const key = String(t[0] ?? '');
      if (!groups[key]) groups[key] = [];
      groups[key].push(t as string[]);
    });
    return groups;
  }

  // slim layout: no group labels shown

  function formatValue(key: string, value?: string): string {
    if (!value) return '';
    if (key === 'e' || key === 'p' || key === 'a') {
      return value.length > 12 ? `${value.slice(0, 8)}…` : value;
    }
    if (key === 't') return `#${value}`;
    return value.length > 20 ? `${value.slice(0, 16)}…` : value;
  }

  function hueFor(key: string, value?: string): number {
    const base: Record<string, number> = { e: 210, p: 160, t: 30, a: 275, g: 330, pow: 190 };
    const seed = base[key] ?? 200;
    if (!value) return seed;
    let h = 0;
    for (let i = 0; i < Math.min(value.length, 8); i++) h = (h * 31 + value.charCodeAt(i)) % 360;
    return (seed + (h % 24)) % 360; // subtle variation per value
  }

  function chipStyle(key: string, value?: string): string {
    const h = hueFor(key, value);
    return `color: hsla(${h},85%,70%,1); background: hsla(${h},80%,60%,0.12); border-color: hsla(${h},85%,70%,0.25);`;
  }

  function handleTagClick(tag: string[]) {
    if (!tag || tag.length === 0) return;
    const [type, value] = tag;
    dispatch('tagClick', { type, value });
  }

  // Derive groups once for rendering
  let groups: TagGroups = {};
  $: groups = groupTags(tags);
  const PRIORITY_KEYS: string[] = ['e', 'p', 't', 'a', 'g', 'pow'];
</script>

{#if tags && tags.length > 0}
  <div class="tags-inline">
    {#each PRIORITY_KEYS as key}
      {#if groups[key]?.length}
        {#each groups[key] as tArr}
          {@const t = tArr as string[]}
          {@const value = t[1]}
          {@const marker = (t[3] || t[2]) as string}
          <button class="chip" style={chipStyle(key, value)} title={t.join(', ')} onclick={() => handleTagClick(t)}>
            <span class="key" aria-label={`tag ${key}`}>{key}</span>
            <span class="dot" style={`background: hsla(${hueFor(key, value)},85%,70%,1);`}></span>
            <span class="val">{formatValue(key, value)}</span>
            {#if marker}
              <span class="meta">{marker}</span>
            {/if}
          </button>
        {/each}
      {/if}
    {/each}
    {#each Object.keys(groups).filter(k => !PRIORITY_KEYS.includes(k)) as key}
      {#each (groups[key] || []) as tArr}
        {@const t = tArr as string[]}
        {@const value = t[1]}
        <button class="chip" style={chipStyle(key, value)} title={t.join(', ')} onclick={() => handleTagClick(t)}>
          <span class="key" aria-label={`tag ${key}`}>{key}</span>
          <span class="dot" style={`background: hsla(${hueFor(key, value)},85%,70%,1);`}></span>
          <span class="val">{formatValue(key, value)}</span>
        </button>
      {/each}
    {/each}
  </div>
{/if}

<style>
  .tags-inline { margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .chip { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 9999px; padding: 0.15rem 0.5rem; font-size: 0.72rem; border: 1px solid transparent; cursor: pointer; backdrop-filter: blur(6px); }
  .chip .key { font-family: var(--font-mono); font-size: 0.68rem; opacity: 0.75; text-transform: lowercase; }
  .chip .dot { width: 6px; height: 6px; border-radius: 50%; opacity: 0.85; }
  .chip .val { font-family: var(--font-mono); letter-spacing: 0.01em; }
  .chip .meta { font-size: 0.68rem; color: #94a3b8; }
  .chip:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.12); transition: all .15s ease; }
</style>


