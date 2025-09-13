<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getService } from '$lib/services/ServiceContainer.js';
	import ProfileAvatar from '$lib/components/ui/ProfileAvatar.svelte';

	let { params }: { params: { author: string; d: string } } = $props();
	let nostr: any = $state(null);
	let me: string | null = null;
	let headerStore: any = null;
	let header: any = $state(null);
	let postsStore: any = null;
	let posts: any[] = $state([]);
	let approvedOnly = $state(false);
	let newPost = $state('');
	let busy = $state(false);
	let message = $state<string | null>(null);
	let canSign = $state(false);
	let isModerator = $state(false);
	let moderators: string[] = $state([]);
	let activeTab: 'posts' | 'approvals' = $state('posts');

	// Approvals tab state
	let approvalsStore: any = null;
	let deletionsStore: any = null;
	let approvals: any[] = $state([]);
	let deletions: any[] = $state([]);
	let pending: any[] = $state([]);
	let approved: Array<{ post: any; approval: any }> = $state([]);
	let approving: string | null = $state(null);
	let revoking: string | null = $state(null);

	// Unsubscribe handles
	let headerUnsub: (() => void) | null = null;
	let moderatorsUnsub: (() => void) | null = null;
	let postsUnsub: (() => void) | null = null;
	let approvalsUnsub: (() => void) | null = null;
	let deletionsUnsub: (() => void) | null = null;

	async function ensure() {
		const svc: any = await getService('nostr');
		nostr = await (svc.getReadyInstance ? svc.getReadyInstance() : svc.getInstance());
		try { await nostr.connect?.(); } catch {}
		try {
			me = await nostr.getPublicKey?.();
			canSign = !!me;
		} catch { me = null; canSign = false; }
	}

	async function ensureSigner(): Promise<boolean> {
		if (!nostr) return false;
		try {
			const info = nostr.getSigningInfo?.();
			if (info?.method && info.method !== 'unknown') { canSign = true; return true; }
			const pk = await nostr.getPublicKey?.();
			canSign = !!pk;
			return canSign;
		} catch { canSign = false; return false; }
	}

	function readHeader() {
		if (!nostr) return;
		headerStore = nostr.communities.getCommunity(params.author, params.d);
		headerUnsub = headerStore.subscribe((ev: any) => { header = ev; });
	}

	function readModerators() {
		if (!nostr) return;
		const mstore = nostr.communities.moderators(params.author, params.d);
		moderatorsUnsub = mstore.subscribe((list: string[]) => { moderators = list || []; isModerator = !!(me && moderators.includes(me)); });
	}

	function readPosts() {
		if (!nostr) return;
		try { postsUnsub && postsUnsub(); } catch {}
		postsStore = nostr.communities.posts(params.author, params.d, { approvedOnly, moderatorsOnly: false });
		postsUnsub = postsStore.subscribe((evs: any[]) => { posts = (evs||[]).slice().sort((a,b)=>b.created_at-a.created_at); });
		message = null;
	}

	function computeQueues() {
		try {
			const address = `34550:${params.author}:${params.d}`;
			// all posts in this community from cache
			const allPostsStore = nostr.query().kinds([1111]).execute();
			const all = (allPostsStore.current||[]).filter((ev:any)=>ev.tags.some((t:string[])=> (t[0]==='A' || t[0]==='a') && t[1]===address));
			// Build non-revoked approvals map by post id
			const revoked = new Set<string>();
			for (const d of deletions||[]) {
				const e = (d.tags||[]).find((t:string[])=>t[0]==='e')?.[1];
				if (e) revoked.add(e);
			}
			const latestApprovalByPost = new Map<string, any>();
			for (const ap of approvals||[]) {
				const apRevoked = (deletions||[]).some((del:any)=> (del.tags||[]).some((t:string[])=> t[0]==='e' && t[1]===ap.id));
				if (apRevoked) continue;
				const postId = (ap.tags||[]).find((t:string[])=>t[0]==='e')?.[1];
				if (!postId) continue;
				const prev = latestApprovalByPost.get(postId);
				if (!prev || ap.created_at > prev.created_at) latestApprovalByPost.set(postId, ap);
			}
			const pend: any[] = [];
			const appr: Array<{post:any; approval:any}> = [];
			for (const p of all) {
				const ap = latestApprovalByPost.get(p.id);
				if (ap) appr.push({ post: p, approval: ap }); else pend.push(p);
			}
			pending = pend.sort((a,b)=>b.created_at-a.created_at);
			approved = appr.sort((a,b)=>b.post.created_at-a.post.created_at).slice(0,100);
		} catch {}
	}

	function readApprovals() {
		if (!nostr) return;
		approvalsStore = nostr.communities.approvals(params.author, params.d);
		approvalsUnsub = approvalsStore.subscribe((evs:any[])=>{ approvals = evs||[]; computeQueues(); });
		deletionsStore = nostr.query().kinds([5]).execute();
		deletionsUnsub = deletionsStore.subscribe((evs:any[])=>{ deletions = evs||[]; computeQueues(); });
	}

	async function approvePost(p: any) {
		if (!isModerator) return;
		if (!nostr) return;
		try {
			approving = p?.id || null;
			await nostr.communities
				.approve({ authorPubkey: params.author, identifier: params.d })
				.post(p)
				.publish();
		} catch {}
		finally { approving = null; }
	}

	async function revoke(ap: any) {
		if (!isModerator) return;
		if (!nostr) return;
		try {
			revoking = ap?.id || null;
			await nostr.communities.revokeApproval(ap.id);
		} catch {}
		finally { revoking = null; }
	}

	async function publishPost() {
		console.log('publish click', { hasText: !!newPost, textLen: newPost?.length || 0, hasNostr: !!nostr, approvedOnly });
		if (!nostr) { message = 'Service nicht bereit'; return; }
		if (!newPost.trim()) { message = 'Bitte Text eingeben'; return; }
		busy = true; message = 'Veröffentliche…';
		try {
			console.log('Publishing community post…');
			if (!nostr?.communities) { console.warn('nostr.communities missing'); message = 'Communities-API nicht verfügbar'; return; }
			const ok = await ensureSigner();
			if (!ok) { message = 'Kein Signer aktiv (Extension). Bitte freigeben/anmelden.'; return; }
			const res = await nostr.communities.postTo(params.author, params.d).content(newPost.trim()).publish();
			console.log('Publish result', res);
			if (res?.success) {
				newPost='';
				message = approvedOnly ? 'Gepostet. Sichtbar nach Freigabe.' : 'Gepostet.';
				readPosts();
			} else {
				message = `Fehler beim Posten${res?.error ? ': '+res.error : ''}`;
			}
		} catch (e:any) {
			console.error('Publish failed', e);
			message = `Fehler: ${e?.message || e}`;
		} finally { busy = false; autoHideMsg(); }
	}

	function autoHideMsg() {
		try { setTimeout(() => { message = null; }, 3000); } catch {}
	}

	$effect(() => {
		// Eingabe ändert → Meldung ausblenden
		return () => {};
	});

	onMount(async () => {
		await ensure();
		// Prime
		try { nostr?.sub?.().kinds([34550]).authors([params.author]).executeOnce({ closeOn: 'eose' }); } catch {}
		try { nostr?.sub?.().kinds([1111]).executeOnce({ closeOn: 'eose' }); } catch {}
		try { nostr?.sub?.().kinds([4550]).executeOnce({ closeOn: 'eose' }); } catch {}
		if (nostr) {
			readHeader();
			readModerators();
			readPosts();
			readApprovals();
		}
		// deep link tab
		try { const t = new URL(location.href).searchParams.get('tab'); if (t==='approvals') activeTab='approvals'; } catch {}
		return () => {
			try { headerUnsub && headerUnsub(); } catch {}
			try { moderatorsUnsub && moderatorsUnsub(); } catch {}
			try { postsUnsub && postsUnsub(); } catch {}
			try { approvalsUnsub && approvalsUnsub(); } catch {}
			try { deletionsUnsub && deletionsUnsub(); } catch {}
		};
	});
</script>

<div class="wrap">
	<nav class="crumbs"><a href="/communities">Communities</a> / <span>{header?.tags?.find((t)=>t[0]==='name')?.[1] || params.d}</span></nav>

	<header class="chead">
		<div class="meta">
			<div class="title">{header?.tags?.find((t)=>t[0]==='name')?.[1] || '(no name)'} <small class="id">/{params.d}</small></div>
			<div class="desc">{header?.tags?.find((t)=>t[0]==='description')?.[1] || ''}</div>
			<div class="mods">Moderators: {#each moderators as pk}<a class="p" href={`/profiles/${pk}`}><ProfileAvatar pubkey={pk} size="xs" navigateOnClick={false} /></a>{/each}</div>
		</div>
		<div class="actions">
			<button class="tab {activeTab==='posts' ? 'active' : ''}" onclick={() => activeTab='posts'}>Posts</button>
			<button class="tab {activeTab==='approvals' ? 'active' : ''}" onclick={() => activeTab='approvals'}>Approvals</button>
			<label class="toggle"><input type="checkbox" bind:checked={approvedOnly} onchange={readPosts} /> Approved only</label>
		</div>
	</header>

	{#if activeTab==='posts'}
	<section class="posts">
		<div class="composer">
			<textarea class="textarea" rows="3" placeholder="Write a post…" bind:value={newPost}></textarea>
			<button class="btn primary" aria-disabled={busy || !nostr} disabled={busy || !nostr} onclick={(e) => { e.preventDefault(); e.stopPropagation(); publishPost(); }}>Publish</button>
		</div>
		{#if message}
			<div class="msg">{message}</div>
		{/if}
		{#each posts as p (p.id)}
			<article class="post">
				<header class="phead"><a class="p" href={`/profiles/${p.pubkey}`} title="Author"><ProfileAvatar pubkey={p.pubkey} size="xs" navigateOnClick={false} /></a><div class="ptime">{new Date(p.created_at*1000).toLocaleString()}</div></header>
				<div class="pcontent">{p.content}</div>
			</article>
		{/each}
	</section>
	{:else}
	<section class="approvals">
		<h3>Pending</h3>
		<div class="alist">
			{#each pending as p (p.id)}
				<article class="post compact">
					<header class="phead"><a class="p" href={`/profiles/${p.pubkey}`} title="Author"><ProfileAvatar pubkey={p.pubkey} size="xs" navigateOnClick={false} /></a><div class="ptime">{new Date(p.created_at*1000).toLocaleString()}</div></header>
					<div class="pcontent small">{p.content}</div>
					{#if isModerator}
						<div class="row-actions">
							<button class="btn primary" disabled={!nostr || approving === p.id} onclick={() => approvePost(p)}>Approve</button>
						</div>
					{/if}
				</article>
			{/each}
			{#if pending.length===0}<div class="empty">No pending posts</div>{/if}
		</div>
		<h3>Approved</h3>
		<div class="alist">
			{#each approved as item (item.post.id)}
				<article class="post compact">
					<header class="phead"><a class="p" href={`/profiles/${item.post.pubkey}`} title="Author"><ProfileAvatar pubkey={item.post.pubkey} size="xs" navigateOnClick={false} /></a><div class="ptime">{new Date(item.post.created_at*1000).toLocaleString()}</div></header>
					<div class="pcontent small">{item.post.content}</div>
					{#if isModerator}
						<div class="row-actions">
							<button class="btn" disabled={!nostr || revoking === item.approval?.id} onclick={() => revoke(item.approval)}>Undo</button>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	</section>
	{/if}
</div>

<style>
	.wrap { display:flex; flex-direction:column; gap:12px; padding:12px; }
	.crumbs { color:#94a3b8; }
	.chead { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; border-bottom:1px solid var(--color-border); padding-bottom:8px; }
	.title { font-weight:700; }
	.id { color:#94a3b8; font-size:.9rem; }
	.desc { color:#94a3b8; }
	.mods { display:flex; gap:6px; margin-top:6px; }
	.p { display:inline-flex; }
	.actions { display:flex; align-items:center; gap:10px; }
	.toggle { display:flex; align-items:center; gap:6px; color:#cbd5e1; }
	.tab { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: transparent; color:#cbd5e1; cursor:pointer; }
	.tab.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); }
	.posts { display:flex; flex-direction:column; gap:10px; }
	.composer { display:flex; gap:8px; }
	.textarea { flex:1; padding:.5rem .65rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); resize: vertical; }
	.textarea:focus { outline:none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
	.btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; text-decoration:none; cursor:pointer; }
	.btn.primary { background: var(--color-primary); color: var(--color-primary-text); border-color: var(--color-primary); }
	.post { border:1px solid var(--color-border); border-radius:12px; padding:10px; background: rgba(255,255,255,0.04); }
	.post.compact { padding:8px; }
	.phead { display:flex; gap:8px; align-items:center; justify-content:space-between; margin-bottom:6px; }
	.ptime { color:#94a3b8; font-size:.85rem; }
	.pcontent { white-space: pre-wrap; word-break: break-word; }
	.pcontent.small { font-size:.9rem; color:#e2e8f0; }
	.alist { display:flex; flex-direction:column; gap:8px; }
	.empty { color:#94a3b8; }
</style>
