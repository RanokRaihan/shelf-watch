"use server";

import { createAction } from "@/lib/core/safe-action";
import { requireManager } from "@/lib/auth/session";
import { rotateJoinLink } from "@/lib/store/store-invite";

// Rotate the store's join link. The manager check runs first (no session goes
// to `/unlock`, expired manager access to `/manage/login`; `createAction`
// rethrows the redirect). The store comes from the session, never the client.
export const rotateJoinLinkAction = createAction(async () => {
  const { user } = await requireManager();
  await rotateJoinLink({ storeId: user.storeId, userId: user.id });
});
