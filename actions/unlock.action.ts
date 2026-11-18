"use server";

import { redirect } from "next/navigation";

import { createAction } from "@/lib/core/safe-action";
import { unlockWithPin } from "@/lib/auth/unlock";
import { unlockSchema } from "@/lib/validations/unlock.validation";

// PIN unlock on a trusted phone, then on to `/pulls`. Failures (wrong PIN,
// locked, untrusted device) come back as an ActionResult. `createAction`
// rethrows the redirect.
export const unlockAction = createAction(unlockSchema, async (values) => {
  await unlockWithPin(values);
  redirect("/pulls");
});
