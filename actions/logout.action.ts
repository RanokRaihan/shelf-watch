"use server";

import { redirect } from "next/navigation";

import { createAction } from "@/lib/core/safe-action";
import { endSession } from "@/lib/auth/session";

// Ends this phone's session and goes to the PIN screen. The device stays
// trusted. `createAction` rethrows the redirect.
export const logoutAction = createAction(async () => {
  await endSession();
  redirect("/unlock");
});
