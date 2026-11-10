"use server";

import { redirect } from "next/navigation";

import { confirmManagerPassword } from "@/lib/auth/manager-access";
import { createAction } from "@/lib/core/safe-action";
import { managerLoginSchema } from "@/lib/validations/manager-login.validation";

// Password check for manager access, then on to `/manage`. Failures (wrong
// password, locked, not a manager, no session) come back as an ActionResult.
// `createAction` rethrows the redirect.
export const managerLoginAction = createAction(
  managerLoginSchema,
  async (values) => {
    await confirmManagerPassword(values);
    redirect("/manage");
  },
);
