import type { LayoutLoad } from './$types';

// Keine clientseitigen Redirects mehr – Server-Hook ist die Single Source of Truth
export const load: LayoutLoad = async () => {
  return {};
};


