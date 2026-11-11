"use server";

import { redirect } from "next/navigation";

import { createAction } from "@/lib/core/safe-action";
import { signInWithPassword } from "@/lib/auth/sign-in";
import { signInSchema } from "@/lib/validations/sign-in.validation";

// Password sign-in on a new browser, then on to `/today`. `createAction`
// rethrows the redirect.
export const signInAction = createAction(signInSchema, async (values) => {
  await signInWithPassword(values);
  redirect("/today");
});
