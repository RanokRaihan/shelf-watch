"use server";

import { redirect } from "next/navigation";

import { lockManagerAccess } from "@/lib/auth/manager-access";
import { createAction } from "@/lib/core/safe-action";

// Ends manager access on this session, then on to `/today`. The session and
// device stay. `createAction` rethrows the redirect.
export const managerLockAction = createAction(async () => {
  await lockManagerAccess();
  redirect("/today");
});
