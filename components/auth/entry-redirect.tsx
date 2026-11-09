import { redirect } from "next/navigation";

import { getEntryRoute } from "@/lib/session";

// Sends signed-in or trusted phones from `/` into the app; everyone else stays
// on the landing page. Renders nothing. Reads cookies, so put it inside
// Suspense (cacheComponents) and keep the landing markup outside it.
export async function EntryRedirect() {
  const route = await getEntryRoute();
  if (route) redirect(route);
  return null;
}
