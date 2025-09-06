import type { Handle } from '@sveltejs/kit';

// Neutraler Hook: Keine Redirect-Guards. Lässt alle Requests passieren.
export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};

