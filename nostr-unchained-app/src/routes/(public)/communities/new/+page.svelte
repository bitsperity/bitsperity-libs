<script lang="ts">
	// @ts-nocheck
	import { getService } from '$lib/services/ServiceContainer.js';
	import { onMount } from 'svelte';

	let nostr: any = null;
	let me: string | null = null;
	let d = $state('');
	let name = $state('');
	let about = $state('');
	let image = $state('');
	let moderators = $state<string>(''); // comma-separated npub/hex
	let relayAuthor = $state('');
	let relayRequests = $state('');
	let relayApprovals = $state('');
	let busy = $state(false);
	let result: any = $state(null);

	onMount(async () => {
		const svc: any = await getService('nostr');
		nostr = await (svc.getReadyInstance ? svc.getReadyInstance() : svc.getInstance());
		try { me = await nostr.getPublicKey?.(); } catch { me = null; }
	});

	async function publish() {
		try {
			if (!nostr || !me) { alert('Please sign in'); return; }
			busy = true; result = null;
			const b = nostr.communities.create(me);
			if (d) b.identifier(d);
			if (name) b.name(name);
			if (about) b.description(about);
			if (image) b.image(image);
			// moderators
			for (const raw of (moderators||'').split(',').map(s=>s.trim()).filter(Boolean)) {
				let pk = raw; try { const mod: any = await import('nostr-unchained'); const norm = (mod.npubToHex||mod.utils?.npubToHex)?.(raw); if (norm) pk = norm; } catch {}
				b.moderator(pk);
			}
			if (relayAuthor) b.relay(relayAuthor, 'author');
			if (relayRequests) b.relay(relayRequests, 'requests');
			if (relayApprovals) b.relay(relayApprovals, 'approvals');
			result = await b.publish();
		} catch (e) { result = { success:false, error: e?.message || String(e) }; }
		finally { busy = false; }
	}
</script>

<div class="wrap">
	<h1>New Community</h1>
	<div class="form">
		<label>Identifier (d)<input class="input" bind:value={d} placeholder="unique-id" /></label>
		<label>Name<input class="input" bind:value={name} placeholder="My Community" /></label>
		<label>About<textarea class="textarea" bind:value={about} rows="3" placeholder="Description…" /></label>
		<label>Image URL<input class="input" bind:value={image} placeholder="https://…" /></label>
		<label>Moderators (comma, npub or hex)<input class="input" bind:value={moderators} placeholder="npub1…, npub1…" /></label>
		<div class="row">
			<label>Relay (author)<input class="input" bind:value={relayAuthor} placeholder="wss://…" /></label>
			<label>Relay (requests)<input class="input" bind:value={relayRequests} placeholder="wss://…" /></label>
			<label>Relay (approvals)<input class="input" bind:value={relayApprovals} placeholder="wss://…" /></label>
		</div>
		<div class="actions">
			<button class="btn primary" disabled={busy} on:click={publish}>{busy ? 'Publishing…' : 'Publish'}</button>
			<a class="btn" href="/communities">Back</a>
		</div>
		{#if result}
			<div class="result {result.success ? 'ok' : 'err'}">
				{#if result.success}
					✅ Published
				{:else}
					❌ {result.error}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.wrap { padding: 12px; display:flex; flex-direction:column; gap: 12px; }
	.form { display:flex; flex-direction:column; gap:10px; }
	.input, .textarea { width:100%; padding:.5rem .65rem; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); }
	.textarea { resize: vertical; }
	.input:focus, .textarea:focus { outline:none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
	.row { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:8px; }
	.actions { display:flex; gap:8px; }
	.btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; text-decoration:none; cursor:pointer; }
	.btn.primary { background: var(--color-primary); color: var(--color-primary-text); border-color: var(--color-primary); }
	.result { padding:8px; border-radius:10px; }
	.result.ok { border:1px solid rgba(34,197,94,0.35); background: rgba(34,197,94,0.12); }
	.result.err { border:1px solid rgba(239,68,68,0.35); background: rgba(239,68,68,0.12); }
</style>
