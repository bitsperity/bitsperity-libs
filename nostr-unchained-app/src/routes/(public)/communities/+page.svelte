<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { getService } from '$lib/services/ServiceContainer.js';

	let nostr: any = null;
	let listStore: any = null;
	let communities: any[] = $state([]);
	let search = $state('');
	let isReady = $state(false);

	async function ensure() {
		if (nostr) return;
		const svc: any = await getService('nostr');
		nostr = await (svc.getReadyInstance ? svc.getReadyInstance() : svc.getInstance());
		try { await nostr.connect?.(); } catch {}
	}

	function matches(comm: any): boolean {
		try {
			const tags = new Map<string, string[]>();
			for (const t of comm.tags || []) {
				const key = t[0]; const val = t[1];
				if (!tags.has(key)) tags.set(key, []);
				tags.get(key).push(val);
			}
			const name = (tags.get('name')?.[0] || '').toLowerCase();
			const desc = (tags.get('description')?.[0] || '').toLowerCase();
			const d = (tags.get('d')?.[0] || '').toLowerCase();
			const q = (search || '').toLowerCase().trim();
			if (!q) return true;
			return name.includes(q) || desc.includes(q) || d.includes(q);
		} catch { return true; }
	}

	onMount(async () => {
		await ensure();
		// Prime cache quickly
		try { nostr.sub().kinds([34550]).executeOnce({ closeOn: 'eose' }); } catch {}
		// Build live list (all communities by latest)
		listStore = nostr.query().kinds([34550]).execute();
		listStore.subscribe((evs: any[]) => {
			try {
				const latestByD = new Map<string, any>();
				for (const ev of evs || []) {
					const d = (ev.tags.find((t: string[]) => t[0] === 'd')?.[1]) || '';
					const prev = latestByD.get(d);
					if (!prev || ev.created_at > prev.created_at) latestByD.set(d, ev);
				}
				communities = Array.from(latestByD.values()).sort((a,b)=>b.created_at-a.created_at);
				isReady = true;
			} catch {}
		});
		return () => { try { listStore?.unsubscribe?.(); } catch {} };
	});
</script>

<div class="wrap">
	<header class="head">
		<h1>Communities</h1>
		<input class="input" placeholder="Search name/description/identifier…" bind:value={search} />
		<a class="btn primary" href="/communities/new">New</a>
	</header>

	{#if !isReady}
		<div class="empty">Loading…</div>
	{:else if communities.length === 0}
		<div class="empty">No communities yet</div>
	{:else}
		<div class="grid">
			{#each communities.filter(matches) as ev}
				<a class="card" href={`/communities/${ev.pubkey}/${ev.tags.find((t)=>t[0]==='d')?.[1] || ''}`}>
					<div class="title">{ev.tags.find((t)=>t[0]==='name')?.[1] || '(no name)'}</div>
					<div class="desc">{ev.tags.find((t)=>t[0]==='description')?.[1] || ''}</div>
					<div class="meta">by <code>{ev.pubkey.slice(0,8)}…</code> · {new Date(ev.created_at*1000).toLocaleString()}</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wrap { padding: 12px; display:flex; flex-direction:column; gap: 12px; }
	.head { display:flex; gap:8px; align-items:center; }
	.input { flex:1; padding:.45rem .6rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); }
	.input:focus { outline:none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
	.btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; text-decoration:none; }
	.btn.primary { background: var(--color-primary); color: var(--color-primary-text); border-color: var(--color-primary); }
	.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
	.card { display:flex; flex-direction:column; gap:6px; border:1px solid var(--color-border); border-radius:12px; padding:10px; background: rgba(255,255,255,0.04); color: var(--color-text); text-decoration:none; }
	.title { font-weight:700; }
	.desc { color:#94a3b8; font-size:.9rem; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
	.meta { color:#94a3b8; font-size:.85rem; }
</style>
