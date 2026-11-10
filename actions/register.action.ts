"use server";

import { registerManager } from "@/lib/auth/register";
import { createAction } from "@/lib/core/safe-action";
import { registerSchema } from "@/lib/validations/register.validation";

export const registerAction = createAction(registerSchema, (values) =>
  registerManager(values),
);
