<script lang="ts">
  import { hexToNpub, hexToNote, isValidHexKey } from 'nostr-unchained';
  import { createEventDispatcher } from 'svelte';

  // Props
  export let hexKey: string;
  export let type: 'pubkey' | 'eventId' = 'pubkey';
  export let variant: 'full' | 'short' | 'compact' | 'icon' = 'short';
  export let copyable: boolean = true;
  export let showLabel: boolean = false;
  export let className: string = '';

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    click: { hex: string; encoded: string };
    copy: { hex: string; encoded: string };
  }>();

  // Reactive values
  $: isValid = isValidHexKey(hexKey);
  $: encoded = isValid ? (type === 'pubkey' ? hexToNpub(hexKey) : hexToNote(hexKey)) : '';
  $: displayText = getDisplayText(encoded, variant);
  $: label = type === 'pubkey' ? 'Pubkey' : 'Event ID';

  // State
  let copied = false;

  function getDisplayText(encoded: string, variant: string): string {
    if (!encoded) return 'Invalid Key';
    
    switch (variant) {
      case 'full':
        return encoded;
      case 'short':
        return `${encoded.substring(0, 12)}...${encoded.slice(-6)}`;
      case 'compact':
        return `${encoded.substring(0, 8)}...`;
      case 'icon':
        return type === 'pubkey' ? '👤' : '📝';
      default:
        return encoded;
    }
  }

  async function handleClick() {
    if (!isValid) return;

    dispatch('click', { hex: hexKey, encoded });

    if (copyable) {
      try {
        await navigator.clipboard.writeText(encoded);
        copied = true;
        dispatch('copy', { hex: hexKey, encoded });
        
        setTimeout(() => {
          copied = false;
        }, 2000);
      } catch (err) {
        console.warn('Failed to copy to clipboard:', err);
      }
    }
  }
</script>

<!-- Key Display Component -->
<div 
  class="key-display {className}"
  class:key-pubkey={type === 'pubkey'}
  class:key-event={type === 'eventId'}
  class:key-full={variant === 'full'}
  class:key-short={variant === 'short'}
  class:key-compact={variant === 'compact'}
  class:key-icon={variant === 'icon'}
  class:key-copyable={copyable && isValid}
  class:key-invalid={!isValid}
  class:key-copied={copied}
  role={copyable ? 'button' : 'text'}
  tabindex={copyable ? 0 : -1}
  title={isValid ? `${copyable ? 'Click to copy: ' : ''}${encoded}` : 'Invalid key'}
  data-hex={hexKey}
  data-encoded={encoded}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
  {#if showLabel}
    <span class="key-label">{label}:</span>
  {/if}
  
  <span class="key-text">{displayText}</span>
  
  {#if copyable && isValid}
    <span class="copy-icon" class:copied>
      {copied ? '✅' : '📋'}
    </span>
  {/if}
</div>

<style>
  .key-display {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    position: relative;
    overflow: hidden;
  }

  /* Base Colors */
  .key-pubkey {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .key-event {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .key-invalid {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: white;
    font-style: italic;
  }

  /* Interactive States */
  .key-copyable {
    cursor: pointer;
  }

  .key-copyable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .key-copyable:active {
    transform: translateY(0);
  }

  .key-copyable:focus {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 2px;
  }

  .key-copied {
    animation: copied-pulse 0.4s ease-out;
  }

  @keyframes copied-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  /* Variants */
  .key-full {
    font-size: 0.75rem;
    max-width: 320px;
    word-break: break-all;
    padding: 8px 12px;
  }

  .key-short {
    min-width: 140px;
  }

  .key-compact {
    padding: 4px 8px;
    font-size: 0.75rem;
    min-width: 90px;
  }

  .key-icon {
    padding: 6px 8px;
    font-size: 1.1rem;
    min-width: auto;
  }

  .key-icon .key-text {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Label */
  .key-label {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 400;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Copy Icon */
  .copy-icon {
    opacity: 0.7;
    font-size: 0.75rem;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .key-display:hover .copy-icon {
    opacity: 1;
  }

  .copy-icon.copied {
    opacity: 1;
    animation: copy-success 0.3s ease-out;
  }

  @keyframes copy-success {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    .key-pubkey {
      background: linear-gradient(135deg, #4c6ef5 0%, #845ec2 100%);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .key-event {
      background: linear-gradient(135deg, #e76f51 0%, #e9c46a 100%);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .key-display:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .key-display {
      font-size: 0.75rem;
      padding: 5px 10px;
    }
    
    .key-full {
      max-width: 240px;
      font-size: 0.7rem;
    }

    .key-compact {
      padding: 3px 6px;
      font-size: 0.7rem;
      min-width: 70px;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .key-display {
      border: 2px solid;
    }
    
    .key-pubkey {
      border-color: #4c6ef5;
    }
    
    .key-event {
      border-color: #e76f51;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .key-display,
    .copy-icon {
      transition: none;
    }
    
    .key-copyable:hover {
      transform: none;
    }
    
    .key-copied,
    .copy-icon.copied {
      animation: none;
    }
  }
</style>