"use server";

import { refresh } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { ok } from "@/lib/core/action-result";
import { createAction } from "@/lib/core/safe-action";
import { markPullItem, undoPullItem } from "@/lib/pulls/pull-items";
import { markPullItemSchema, undoPullItemSchema } from "@/lib/validations/pulls.validation";

// The store comes from the session, never from the client.
async function actor() {
  const { user } = await requireSession();
  return { storeId: user.storeId, userId: user.id, timezone: user.store.timezone };
}

export const markPullItemAction = createAction(markPullItemSchema, async ({ id, status }) => {
  await markPullItem(await actor(), id, status);
  refresh();
  return ok(null, status === "PULLED" ? "Marked pulled" : "Skipped");
});

export const undoPullItemAction = createAction(undoPullItemSchema, async ({ id }) => {
  await undoPullItem(await actor(), id);
  refresh();
  return ok(null, "Back on the list");
});
