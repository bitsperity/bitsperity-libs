/**
 * NIP-05 verification utilities (app-side)
 */

export type Nip05CheckResult = { ok: true } | { ok: false; reason: string };

export function parseNip05(nip05?: string): { local: string; domain: string } | null {
  if (!nip05 || typeof nip05 !== 'string') return null;
  const parts = nip05.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { local: parts[0].toLowerCase(), domain: parts[1].toLowerCase() };
}

export async function verifyNip05(
  nip05: string,
  pubkey: string,
  timeoutMs: number = 5000
): Promise<Nip05CheckResult> {
  const parsed = parseNip05(nip05);
  if (!parsed) return { ok: false, reason: 'invalid_nip05' };
  const { local, domain } = parsed;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(local)}`, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = await res.json();
    const expected = data?.names?.[local];
    return expected === pubkey ? { ok: true } : { ok: false, reason: 'mismatch' };
  } catch (e) {
    return { ok: false, reason: (e as any)?.name === 'AbortError' ? 'timeout' : 'network' };
  }
}


