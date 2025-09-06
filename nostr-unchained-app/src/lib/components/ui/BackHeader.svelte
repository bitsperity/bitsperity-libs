<script lang="ts">
  export let title: string;
  export let fallbackHref: string = '/';
  export let className: string = '';
  export let sticky: boolean = false;

  // simple props via export let (compatible across setups)

  function handleBack() {
    try {
      if (history.length > 1) {
        history.back();
      } else {
        location.assign(fallbackHref);
      }
    } catch {
      location.assign(fallbackHref);
    }
  }
</script>

<header class="back-header {sticky ? 'sticky' : ''} {className}">
  <button class="back-btn" onclick={handleBack} aria-label="Zurück">←</button>
  <h1 class="title">{title}</h1>
  <div class="spacer"></div>
  <slot name="right" />
</header>

<style>
  .back-header {
    position: relative;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .75rem 1rem;
    backdrop-filter: blur(6px);
    background: rgba(2, 6, 23, 0.45);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .back-header.sticky {
    position: sticky;
  }
  .back-btn {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #e2e8f0;
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
  }
  .title {
    font-size: 1.1rem;
    margin: 0;
  }
  .spacer {
    flex: 1 1 auto;
  }
</style>


