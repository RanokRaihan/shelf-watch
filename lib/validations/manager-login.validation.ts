import { z } from "zod";

export const managerLoginSchema = z.object({
  // 72 is bcrypt's limit, matching signup.
  password: z
    .string()
    .min(1, "Enter your password")
    .max(72, "Password must be 72 characters or fewer"),
});

export type ManagerLoginValues = z.infer<typeof managerLoginSchema>;
