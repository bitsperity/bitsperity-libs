import type { NostrEvent } from '../../core/types.js';

export interface MediaMeta {
  url: string;
  mimeType?: string;
  alt?: string;
  blurhash?: string;
  dim?: string; // e.g., 3024x4032
  sha256?: string; // NIP-94 'x' field
  fallbacks?: string[];
}

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif'
};
const VIDEO_MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v'
};
const AUDIO_MIME_BY_EXT: Record<string, string> = {
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac', m4a: 'audio/mp4'
};

export function guessMimeType(url: string): string | undefined {
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();
    const m = pathname.match(/\.([a-z0-9]+)$/i);
    const ext = m?.[1] || '';
    if (IMAGE_MIME_BY_EXT[ext]) return IMAGE_MIME_BY_EXT[ext];
    if (VIDEO_MIME_BY_EXT[ext]) return VIDEO_MIME_BY_EXT[ext];
    if (AUDIO_MIME_BY_EXT[ext]) return AUDIO_MIME_BY_EXT[ext];
  } catch {}
  return undefined;
}

export function buildImetaTag(meta: MediaMeta): string[] {
  const tokens: string[] = [];
  tokens.push(`url ${meta.url}`);
  if (meta.mimeType) tokens.push(`m ${meta.mimeType}`);
  if (meta.blurhash) tokens.push(`blurhash ${meta.blurhash}`);
  if (meta.dim) tokens.push(`dim ${meta.dim}`);
  if (meta.alt) tokens.push(`alt ${meta.alt}`);
  if (meta.sha256) tokens.push(`x ${meta.sha256}`);
  if (meta.fallbacks && meta.fallbacks.length) {
    for (const f of meta.fallbacks) tokens.push(`fallback ${f}`);
  }
  return ['imeta', ...tokens];
}

export function parseImetaTags(event: NostrEvent): MediaMeta[] {
  const metas: MediaMeta[] = [];
  for (const tag of event.tags || []) {
    if (tag[0] !== 'imeta') continue;
    const meta: MediaMeta = { url: '' };
    for (let i = 1; i < tag.length; i++) {
      const token = tag[i];
      const spaceIdx = token.indexOf(' ');
      if (spaceIdx <= 0) continue;
      const key = token.slice(0, spaceIdx);
      const value = token.slice(spaceIdx + 1);
      switch (key) {
        case 'url': meta.url = value; break;
        case 'm': meta.mimeType = value; break;
        case 'blurhash': meta.blurhash = value; break;
        case 'dim': meta.dim = value; break;
        case 'alt': meta.alt = value; break;
        case 'x': meta.sha256 = value; break;
        case 'fallback':
          if (!meta.fallbacks) meta.fallbacks = [];
          meta.fallbacks.push(value);
          break;
        default:
          break;
      }
    }
    if (meta.url) metas.push(meta);
  }
  return metas;
}


