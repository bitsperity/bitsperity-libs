<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Props = {
		pending?: boolean;
		namespace?: string;
		label?: string;
		mark?: string;
		reason?: string;
		knownNamespaces?: string[];
		knownLabels?: string[];
	};

	let {
		pending = false,
		namespace = 'app',
		label = 'star',
		mark = '',
		reason = '',
		knownNamespaces = [],
		knownLabels = []
 	}: Props = $props();

	const dispatch = createEventDispatcher();

	function onCancel() {
		dispatch('cancel');
	}

	function onSubmit() {
		const ns = namespace.trim();
		const lv = label.trim();
		if (!ns || !lv) return;
		dispatch('submit', { namespace: ns, label: lv, mark: mark.trim() || undefined, reason: reason.trim() });
 	}
</script>

<div class="label-composer" aria-busy={pending}>
	<div class="row">
		<div class="field">
			<label for="ns-input">Namespace</label>
			<input id="ns-input" type="text" list="ns-list" bind:value={namespace} placeholder="z.B. app" {pending} disabled={pending} />
			<datalist id="ns-list">
				{#each knownNamespaces as ns (ns)}
					<option value={ns}></option>
				{/each}
			</datalist>
		</div>
		<div class="field">
			<label for="label-input">Label</label>
			<input id="label-input" type="text" list="label-list" bind:value={label} placeholder="z.B. star" {pending} disabled={pending} />
			<datalist id="label-list">
				{#each knownLabels as lv (lv)}
					<option value={lv}></option>
				{/each}
			</datalist>
		</div>
		<div class="field">
			<label for="mark-input">Mark (optional)</label>
			<input id="mark-input" type="text" bind:value={mark} placeholder="z.B. strong" {pending} disabled={pending} />
		</div>
	</div>

	<div class="field">
		<label for="reason-input">Reason (optional)</label>
		<textarea id="reason-input" rows="2" bind:value={reason} placeholder="Begründung hinzufügen…" disabled={pending}></textarea>
	</div>

	<div class="actions">
		<button type="button" class="ghost" onclick={onCancel} disabled={pending}>Abbrechen</button>
		<button type="button" class="ghost primary" onclick={onSubmit} disabled={pending || !namespace.trim() || !label.trim()}>
			{#if pending}<span class="spinner"></span> Speichere…{:else}Label setzen{/if}
		</button>
	</div>
</div>

<style>
	.label-composer { display:flex; flex-direction: column; gap:.5rem; }
	.row { display:flex; gap:.5rem; flex-wrap: wrap; }
	.field { flex:1 1 160px; display:flex; flex-direction: column; gap:.25rem; }
	label { font-size:.85rem; color:#9aa5b1; }
	input, textarea {
		width: 100%;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px;
		padding: .5rem .6rem;
		color: #e2e8f0;
	}
	.actions { display:flex; gap:.5rem; justify-content:flex-end; }
	.ghost { padding: .35rem .6rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.06); color:#e2e8f0; }
	.ghost.primary { background: var(--color-primary, rgba(99,102,241,.25)); border-color: rgba(255,255,255,0.14); }
	.spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.25); border-top-color:#fff; border-radius:50%; display:inline-block; animation: spin 1s linear infinite; vertical-align: -2px; margin-right:6px; }
	@keyframes spin { to { transform: rotate(360deg); } }
</style>

