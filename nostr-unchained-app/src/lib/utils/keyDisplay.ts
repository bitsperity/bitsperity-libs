/**
 * Key Display Utilities
 * 
 * TypeScript utilities und helper functions für die KeyDisplay Komponente
 */

import { hexToNpub, hexToNote, isValidHexKey } from 'nostr-unchained';

export interface KeyDisplayEvent {
  hex: string;
  encoded: string;
}

export type KeyDisplayVariant = 'full' | 'short' | 'compact' | 'icon';
export type KeyDisplayType = 'pubkey' | 'eventId';

export interface KeyDisplayOptions {
  type?: KeyDisplayType;
  variant?: KeyDisplayVariant;
  copyable?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * Formatiert einen hex key für Anzeige basierend auf Variante
 */
export function formatKeyForDisplay(
  hexKey: string, 
  type: KeyDisplayType = 'pubkey',
  variant: KeyDisplayVariant = 'short'
): string {
  if (!isValidHexKey(hexKey)) {
    return 'Invalid Key';
  }

  const encoded = type === 'pubkey' ? hexToNpub(hexKey) : hexToNote(hexKey);
  
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

/**
 * Erstellt ein Tooltip für einen hex key
 */
export function createKeyTooltip(
  hexKey: string,
  type: KeyDisplayType = 'pubkey',
  copyable: boolean = true
): string {
  if (!isValidHexKey(hexKey)) {
    return 'Invalid key';
  }

  const encoded = type === 'pubkey' ? hexToNpub(hexKey) : hexToNote(hexKey);
  const prefix = copyable ? 'Click to copy: ' : '';
  
  return `${prefix}${encoded}`;
}

/**
 * Kopiert einen key in die Zwischenablage
 */
export async function copyKeyToClipboard(
  hexKey: string,
  type: KeyDisplayType = 'pubkey'
): Promise<boolean> {
  if (!isValidHexKey(hexKey)) {
    return false;
  }

  try {
    const encoded = type === 'pubkey' ? hexToNpub(hexKey) : hexToNote(hexKey);
    await navigator.clipboard.writeText(encoded);
    return true;
  } catch (error) {
    console.warn('Failed to copy key to clipboard:', error);
    return false;
  }
}

/**
 * Validiert und normalisiert KeyDisplay Props
 */
export function normalizeKeyDisplayProps(
  hexKey: string,
  options: KeyDisplayOptions = {}
): Required<KeyDisplayOptions> & { isValid: boolean; encoded: string } {
  const {
    type = 'pubkey',
    variant = 'short',
    copyable = true,
    showLabel = false,
    className = ''
  } = options;

  const isValid = isValidHexKey(hexKey);
  const encoded = isValid 
    ? (type === 'pubkey' ? hexToNpub(hexKey) : hexToNote(hexKey))
    : '';

  return {
    type,
    variant,
    copyable: copyable && isValid, // Only copyable if valid
    showLabel,
    className,
    isValid,
    encoded
  };
}

/**
 * Erstellt CSS-Klassen für KeyDisplay
 */
export function createKeyDisplayClasses(
  options: KeyDisplayOptions,
  isValid: boolean,
  copied: boolean = false
): string {
  const {
    type = 'pubkey',
    variant = 'short',
    copyable = true,
    className = ''
  } = options;

  const classes = [
    'key-display',
    `key-${type}`,
    `key-${variant}`,
    copyable && isValid ? 'key-copyable' : '',
    !isValid ? 'key-invalid' : '',
    copied ? 'key-copied' : '',
    className
  ].filter(Boolean);

  return classes.join(' ');
}

/**
 * Accessibility helper für KeyDisplay
 */
export function getKeyDisplayAccessibility(
  hexKey: string,
  options: KeyDisplayOptions = {}
): {
  role: string;
  tabindex: number;
  'aria-label': string;
  'aria-description'?: string;
} {
  const { type = 'pubkey', copyable = true } = options;
  const isValid = isValidHexKey(hexKey);
  
  if (!isValid) {
    return {
      role: 'text',
      tabindex: -1,
      'aria-label': 'Invalid key'
    };
  }

  const encoded = type === 'pubkey' ? hexToNpub(hexKey) : hexToNote(hexKey);
  const keyType = type === 'pubkey' ? 'public key' : 'event ID';
  
  if (copyable) {
    return {
      role: 'button',
      tabindex: 0,
      'aria-label': `Copy ${keyType} to clipboard`,
      'aria-description': encoded
    };
  }

  return {
    role: 'text',
    tabindex: -1,
    'aria-label': `${keyType}: ${encoded}`
  };
}

/**
 * Keyboard navigation handler
 */
export function handleKeyDisplayKeydown(
  event: KeyboardEvent,
  callback: () => void
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

/**
 * Preset-Konfigurationen für häufige Use-Cases
 */
export const KeyDisplayPresets = {
  // Für Listen und Übersichten
  listItem: {
    variant: 'compact' as KeyDisplayVariant,
    copyable: true,
    showLabel: false
  },

  // Für Detailansichten
  detail: {
    variant: 'short' as KeyDisplayVariant,
    copyable: true,
    showLabel: true
  },

  // Für Headers und Titel
  header: {
    variant: 'short' as KeyDisplayVariant,
    copyable: true,
    showLabel: false
  },

  // Für Platzsparende Anzeigen
  minimal: {
    variant: 'icon' as KeyDisplayVariant,
    copyable: true,
    showLabel: false
  },

  // Für technische/Debug-Ansichten
  technical: {
    variant: 'full' as KeyDisplayVariant,
    copyable: true,
    showLabel: true
  },

  // Für readonly Anzeigen
  readonly: {
    variant: 'short' as KeyDisplayVariant,
    copyable: false,
    showLabel: true
  }
} as const;

/**
 * Theme helper für custom styling
 */
export const KeyDisplayThemes = {
  default: {
    pubkey: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff'
    },
    eventId: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#ffffff'
    }
  },
  
  minimal: {
    pubkey: {
      background: '#f8fafc',
      color: '#374151',
      border: '1px solid #e5e7eb'
    },
    eventId: {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    }
  },

  dark: {
    pubkey: {
      background: 'linear-gradient(135deg, #4c6ef5 0%, #845ec2 100%)',
      color: '#ffffff'
    },
    eventId: {
      background: 'linear-gradient(135deg, #e76f51 0%, #e9c46a 100%)',
      color: '#ffffff'
    }
  }
} as const;