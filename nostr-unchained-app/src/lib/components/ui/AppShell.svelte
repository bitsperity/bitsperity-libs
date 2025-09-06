<script lang="ts">
  // @ts-nocheck
  export let title: string = 'Nostr Unchained';
  export let sidebar: Array<{ label: string; href: string; icon?: string }> = [];
  export let topActions: Array<{ label: string; href: string }> = [];
  import { hexToNpub, npubToHex, isValidHexKey, isValidNpub } from 'nostr-unchained';
  import { onMount } from 'svelte';
  import { getService } from '$lib/services/ServiceContainer.js';
  import ProfileAvatar from '$lib/components/ui/ProfileAvatar.svelte';
  import CacheMonitorModal from '$lib/components/monitor/CacheMonitorModal.svelte';
  import SubsMonitorModal from '$lib/components/monitor/SubsMonitorModal.svelte';

  let converterInput = '';
  let converterOutput = '';
  function runConvert() {
    const v = (converterInput||'').trim();
    try {
      if (isValidHexKey(v)) { converterOutput = hexToNpub(v); return; }
      if (isValidNpub(v)) { converterOutput = npubToHex(v); return; }
      converterOutput = '';
    } catch { converterOutput = ''; }
  }

  async function submitSearch(e: KeyboardEvent) {
    try {
      if (e.key !== 'Enter') return;
      const v = (converterInput||'').trim();
      if (!v) return;
      // Hashtag
      if (v.startsWith('#') && v.length > 1) {
        const tag = v.slice(1);
        location.assign(`/feed?tab=hashtags&tag=${encodeURIComponent(tag)}`);
        return;
      }
      // Thread note id (note1...)
      if (v.startsWith('note1')) {
        try {
          const mod: any = await import('nostr-unchained');
          const hex = (mod.noteToHex || mod.utils?.noteToHex)?.(v);
          if (hex) { location.assign(`/threads/${hex}`); return; }
        } catch {}
      }
      // Profile (npub1...)
      if (v.startsWith('npub1')) {
        try {
          const mod: any = await import('nostr-unchained');
          const pk = (mod.npubToHex || mod.utils?.npubToHex)?.(v);
          if (pk) { location.assign(`/profiles/${pk}`); return; }
        } catch {}
      }
      // Hex fallback: 64 chars → event → thread
      if (/^[0-9a-fA-F]{64}$/.test(v)) { location.assign(`/threads/${v}`); return; }
      // Fallback: Explore Suche
      location.assign(`/explore?q=${encodeURIComponent(v)}`);
    } catch {}
  }

  // auth header mini state
  let mePk: string | null = null;
  let meProfile: any = null;
  let hasSigner = false;
  let profileUnsub: any = null;
  let authAttempts = 0;
  let showCacheModal = false;
  let showSubsModal = false;
  async function refreshAuth(force: boolean = false) {
    try {
      const svc: any = await getService('nostr');
      const inst = await (svc.getReadyInstance ? svc.getReadyInstance() : svc.getInstance());
      try { await inst.connect?.(); } catch {}
      let pk: string | null = null;
      try { pk = await inst.getPublicKey?.(); } catch { pk = null; }
      if (pk !== mePk) {
        mePk = pk;
        if (profileUnsub) { try { profileUnsub(); } catch {} profileUnsub = null; }
        meProfile = null;
        if (mePk && inst?.profile?.get) {
          try {
            const store = inst.profile.get(mePk);
            profileUnsub = store.subscribe((p: any) => { meProfile = p; });
          } catch {}
        }
      }
      // Update hasSigner AFTER potential rehydration
      try { hasSigner = !!(mePk) || !!svc?.hasSigner?.(); } catch { hasSigner = !!mePk; }
      if (!mePk && (sessionStorage.getItem('selected_signer') || hasSigner) && authAttempts < 5) {
        authAttempts += 1;
        setTimeout(() => { refreshAuth(true); }, 300);
      }
    } catch { hasSigner = false; mePk = null; meProfile = null; }
  }
  function handleStorage(e: StorageEvent) { if (e.key === 'auth_changed') refreshAuth(); }
  function handleAuthChanged() { refreshAuth(); }
  function handleFocus() { refreshAuth(); }
  onMount(() => {
    // Immediate refresh to populate header on first paint
    refreshAuth(true);
    // Also schedule a short follow-up refresh to catch late signer rehydration
    setTimeout(() => refreshAuth(true), 150);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('nostr:auth-changed' as any, handleAuthChanged as any);
    window.addEventListener('focus', handleFocus);
    return () => {
      try { window.removeEventListener('storage', handleStorage); } catch {}
      try { window.removeEventListener('nostr:auth-changed' as any, handleAuthChanged as any); } catch {}
      try { window.removeEventListener('focus', handleFocus); } catch {}
      if (profileUnsub) { try { profileUnsub(); } catch {} profileUnsub = null; }
    };
  });
  function logout() { try { sessionStorage.clear(); localStorage.removeItem('temp_signer_active'); localStorage.setItem('auth_changed', String(Date.now())); location.reload(); } catch { location.reload(); } }
</script>

<div class="app-shell">
  <header class="topbar">
    <div class="brand">
      <a class="brand-link" href="/feed" aria-label={title}>{title}</a>
    </div>
    <div class="search">
      <input class="search-input" type="search" placeholder="Suche…" bind:value={converterInput} onkeydown={submitSearch} />
    </div>
    <nav class="top-actions">
      {#each topActions as a}
        <a class="top-btn" href={a.href}>{a.label}</a>
      {/each}
      <button class="icon-btn" title="Cache Monitor" onclick={() => showCacheModal = true}>🧠 Cache</button>
      <button class="icon-btn" title="Subscriptions Monitor" onclick={() => showSubsModal = true}>📡 Subs</button>
      <div class="converter">
        <input class="converter-input" placeholder="hex ⇄ npub" bind:value={converterInput} oninput={runConvert} />
        {#if converterOutput}
          <code class="converter-out" title="Konvertiert">{converterOutput}</code>
        {/if}
      </div>
      {#if mePk}
        <a class="profile-link" href={`/profiles/${mePk}`} title="Mein Profil">
          <ProfileAvatar pubkey={mePk} initialProfile={meProfile} size="sm" navigateOnClick={false} />
        </a>
        <button class="top-btn" onclick={logout}>Log out</button>
      {:else}
        <a class="top-btn" href="/signin">Sign in</a>
      {/if}
    </nav>
  </header>

  <div class="main">
    <aside class="sidebar">
      <nav class="side-nav">
        {#each sidebar as item}
          <a class="nav-item" href={item.href} aria-label={item.label}>
            <span class="icon">{item.icon || '•'}</span>
            <span class="label">{item.label}</span>
          </a>
        {/each}
      </nav>
    </aside>
    <section class="content">
      <slot />
    </section>
  </div>

  {#if showCacheModal}
    <CacheMonitorModal on:close={() => showCacheModal = false} />
  {/if}
  {#if showSubsModal}
    <SubsMonitorModal on:close={() => showSubsModal = false} />
  {/if}
</div>

<style>
  .app-shell { min-height:100vh; display:flex; flex-direction:column; background: var(--color-background); color: var(--color-text); }
  .topbar { height:52px; display:grid; grid-template-columns: 200px 1fr auto; align-items:center; gap: .75rem; padding: 0 .75rem; background: var(--color-surface); border-bottom:1px solid var(--color-border); position: sticky; top:0; z-index: 20; }
  .brand-link { color: var(--color-text); text-decoration:none; font-weight:700; letter-spacing:.02em; }
  .search { display:flex; align-items:center; }
  .search-input { width:100%; max-width:420px; padding:8px 10px; border:1px solid var(--color-border); border-radius:10px; background: var(--color-background); color: var(--color-text); }
  .top-actions { display:flex; gap:.5rem; }
  .top-btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; text-decoration:none; }
  .icon-btn { padding:6px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer; }
  .converter { display:flex; align-items:center; gap:.35rem; }
  .converter-input { width:220px; padding:6px 8px; border:1px solid var(--color-border); border-radius:8px; background: var(--color-background); color: var(--color-text); font-family: var(--font-mono); }
  .converter-out { font-family: var(--font-mono); font-size:.8rem; opacity:.9; }
  .profile-link { display:flex; align-items:center; }

  .main { flex:1; display:grid; grid-template-columns: 220px 1fr; min-height:0; }
  .sidebar { border-right:1px solid var(--color-border); background: rgba(255,255,255,0.03); }
  .side-nav { display:flex; flex-direction:column; padding:.5rem; gap:4px; }
  .nav-item { display:flex; align-items:center; gap:.5rem; padding:8px 10px; border-radius:8px; color:#cbd5e1; text-decoration:none; }
  .nav-item:hover { background: rgba(255,255,255,0.06); }
  .icon { opacity:.9; }
  .content { min-width:0; min-height:0; overflow:auto; }

  @media (max-width: 900px) {
    .main { grid-template-columns: 1fr; }
    .sidebar { display:none; }
  }
</style>


