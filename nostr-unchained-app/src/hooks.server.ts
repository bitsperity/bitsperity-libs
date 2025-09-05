import type { Handle } from '@sveltejs/kit';

// Minimaler Guard ohne Persistenz: Nur Query-Parameter steuern die einmalige Rückleitung
export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const search = event.url.search;
  const isGet = event.request.method === 'GET';
  const accept = event.request.headers.get('accept') || '';
  const isDocument = isGet && accept.includes('text/html');
  const isSigned = !!event.cookies.get('signer_selected') || !!event.cookies.get('temp_signer_active');

  const isAssetExt = /\.(js|mjs|cjs|css|map|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|otf|txt|json)$/i.test(path);
  const isPublic =
    path === '/' ||
    isAssetExt ||
    path.startsWith('/__') ||
    path.startsWith('/api/') ||
    path.startsWith('/favicon') ||
    path.startsWith('/_app') ||
    path.startsWith('/.svelte-kit') ||
    path.startsWith('/@vite') ||
    path.startsWith('/node_modules') ||
    path.startsWith('/build') ||
    path.startsWith('/assets') ||
    path.startsWith('/static') ||
    path.startsWith('/.well-known');

  // Nicht-öffentliche Route: Dokument → Landing, außer wenn einmalige Freigabe via allow=1
  if (!isPublic && path !== '/' && isDocument) {
    if (event.url.searchParams.get('allow') === '1') {
      return resolve(event);
    }
    const rt = encodeURIComponent(path + search);
    return new Response(null, { status: 307, headers: { Location: '/?rt=' + rt } });
  }

  // Auf Root: keine Persistenz – nur weiterleiten, wenn rt per Query übergeben wurde
  if (path === '/' && isDocument) {
    const rtParam = event.url.searchParams.get('rt');
    if (rtParam) {
      const target = decodeURIComponent(rtParam);
      return new Response(null, { status: 307, headers: { Location: target + (target.includes('?') ? '&' : '?') + 'allow=1' } });
    }
  }

  return resolve(event);
};


