"use server";

import { registerManager } from "@/lib/register";
import { createAction } from "@/lib/safe-action";
import { registerSchema } from "@/lib/validations/register.validation";

export const registerAction = createAction(registerSchema, (values) =>
  registerManager(values),
);
